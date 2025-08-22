

import { GoogleGenerativeAI, GenerateContentResponse } from "@google/genai";
import { GameState, OpPlan, AIAction, PlayerId, Faction, NodeData, AIActionName, FactionIntelSnapshot, AIActionArgs, StrategicThoughtProcessData, GamePhase, CommLogEntry, DoctrineDefinition } from '../types';
import {
    NEUTRAL_ID, ATTRITION_COST_ARTILLERY_QR, ATTRITION_COST_ARTILLERY_MAT_CREATION, MAX_ARTILLERY_PER_NODE,
    ATTRITION_AMMO_COST_ARTILLERY_STRIKE, ATTRITION_AMMO_COST_ARTILLERY_OFFENSIVE_SUPPORT, ATTRITION_AMMO_COST_ARTILLERY_DEFENSIVE_SUPPORT,
    AI1_ID, AI2_ID, RECON_ARRAY_ACTIVATION_COST_QR, RECON_ARRAY_ACTIVATION_COST_MAT, RECON_ARRAY_UPKEEP_MAT,
    RECON_PULSE_COST_QR, RECON_PULSE_COST_MAT, ATTRITION_COST_STANDARD_UNIT_MAT, DEPLOYMENT_MAX_UNITS_PER_TURN,
    FORT_REPAIR_MAT_COST_PER_HP, FORT_UPGRADE_LEVEL_MAT_COST, // Updated constants
    ATTRITION_UPKEEP_STANDARD,
    ATTRITION_UPKEEP_FORTRESS,
    ATTRITION_COST_ARTILLERY_MOVE_MAT_PER_PIECE,
    UNITS_REINFORCED_PER_NODE,
    QR_PER_CONNECTED_NODE_IN_LARGEST_NETWORK, // Added
    MAX_FORTIFICATION_LEVEL, // Added
    SABOTAGE_INTERDICTION_TURNS, // Added
    ATTRITION_COST_INFILTRATOR_MAT, MAX_INFILTRATORS_PER_NODE_FROM_ONE_FACTION,
    SABOTAGE_IH_OUTPUT_REDUCTION_FACTOR,
    FORT_HP_PER_LEVEL, BATTLE_FORT_HP_DAMAGE_PER_ROUND, ARTILLERY_STRIKE_FORT_HP_DAMAGE_PER_GUN
} from '../../../constants';
import { isNodeVisibleForAI, isNodeConnectedToFactionCN } from "../game/utils"; 
import { getMapData } from '../../data/mapData';

const API_KEY = process.env.API_KEY;
const DEFAULT_TEXT_MODEL = 'gemini-2.5-flash';
const ALLOWED_TEXT_MODELS = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.5-pro',
    'gemini-2.0-flash',
    'gemma-3n-e2b-it',
    'gemma-3n-e4b-it',
    'gemma-3-4b-it',
    'gemma-3-12b-it',
    'gemma-3-27b-it'
];

function minimalSanitizeAIJsonResponse(rawJsonText: string): string {
    let sanitizedText = rawJsonText;
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const matchFence = sanitizedText.match(fenceRegex);
    if (matchFence && matchFence[2]) {
        sanitizedText = matchFence[2];
    }
    return sanitizedText.trim();
}


function aggressiveSanitizeAIJsonResponse(rawJsonText: string): string {
  let sanitizedText = rawJsonText;

  // 1. Remove markdown fences
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const matchFence = sanitizedText.match(fenceRegex);
  if (matchFence && matchFence[2]) {
    sanitizedText = matchFence[2];
  }
  sanitizedText = sanitizedText.trim();

  // 2. Remove block comments /* ... */ and line comments //
  // This regex handles both, ensuring not to remove URLs' double slashes.
  sanitizedText = sanitizedText.replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, '$1');


  // 3. Remove trailing commas
  // Before }
  sanitizedText = sanitizedText.replace(/,(\s*})/g, '$1');
  // Before ]
  sanitizedText = sanitizedText.replace(/,(\s*])/g, '$1');

  // 4. Normalize newlines around structural characters (cautiously)
  // Remove newlines that are likely just formatting artifacts, e.g., directly before or after commas, colons, braces, brackets.
  sanitizedText = sanitizedText.replace(/\s*\n\s*(?=[,{}\]:\[])/g, ''); // Newlines before tokens
  sanitizedText = sanitizedText.replace(/(?<=[,{}\]:\[])\s*\n\s*/g, ''); // Newlines after tokens
  
  // 5. Attempt to convert single-quoted strings to double-quoted strings
  // This is complex and needs to be done carefully. The following focuses on common patterns.
  // It's hard to make this perfect without a full parser. This primarily targets keys and simple values.
  try {
    // For keys: 'key': or key: (if alphanumeric)
    sanitizedText = sanitizedText.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":');
    // For values: :'value'
    sanitizedText = sanitizedText.replace(/:\s*'((?:\\'|[^'])*)'/g, ': "$1"');
  } catch (e) {
    console.warn("Regex for quote normalization failed or timed out:", e);
  }

  return sanitizedText.trim();
}


// Helper function to prepare a simplified game state for the AI
const getSimplifiedGameStateForAI = (gameState: GameState, viewingFactionId: PlayerId) => {
  const ownFaction = gameState.factions[viewingFactionId];
  const enemyFactionId = viewingFactionId === AI1_ID ? AI2_ID : AI1_ID;
  const enemyIntelSnapshot = gameState.factionIntelSnapshots[enemyFactionId];

  const canSeeAllNodesDueToPulse = ownFaction.hasActiveReconPulseThisTurn;

  const visibleNodesSummary = Object.values(gameState.mapNodes)
    .filter(node => {
        if (canSeeAllNodesDueToPulse) return true; // Pulse reveals all
        if (node.owner === viewingFactionId) return true;
        if (isNodeVisibleForAI(node.id, viewingFactionId, gameState)) return true; // Standard FoW
        return false;
    })
    .map(n => ({
        id: n.id,
        owner: n.owner,
        units: n.standardUnits,
        maxUnits: n.maxUnits,
        artillery: n.artilleryGarrison || 0,
        MAT_output: n.MAT_output,
        qrOutput: n.qrOutput,
        fortLevel: n.fortificationLevel,
        fortificationHP: n.fortificationHP, // Added
        maxFortificationHP: n.maxFortificationHP, // Added
        isCN: n.isCN,
        nodeType: n.nodeType,
        connections: n.connections.map(connId => {
            const connNode = gameState.mapNodes[connId];
            if (!connNode) return `${connId} (ERROR_NO_NODE_DATA)`;
            if (canSeeAllNodesDueToPulse) return connId;
            let connVisible = false;
            if (connNode.owner === viewingFactionId) connVisible = true;
            else if (isNodeVisibleForAI(connId, viewingFactionId, gameState)) connVisible = true;
            return connVisible ? connId : `${connId} (Unseen)`;
        }),
        regionName: n.regionName,
        lowSupply: n.lowSupply,
        interdictedTurns: n.interdictedTurns || 0,
        isActivatedReconArray: n.nodeType === 'RECON_ARRAY' && ownFaction.activatedReconNodeIds.includes(n.id) && isNodeConnectedToFactionCN(n.id, viewingFactionId, gameState.mapNodes, gameState.factions),
        numOwnInfiltratorsOnNode: n.infiltratorUnits?.[viewingFactionId] || 0,
        alarmLevel: n.alarmLevel || 0,
    }));

  const allNodesBrief = Object.values(gameState.mapNodes).map(n => ({
    id: n.id,
    label: n.label,
    owner: (() => {
        if (canSeeAllNodesDueToPulse) return n.owner;
        if (n.owner === viewingFactionId) return n.owner;
        if (isNodeVisibleForAI(n.id, viewingFactionId, gameState)) return n.owner;
        return 'UNKNOWN';
    })(),
    type: n.nodeType,
  }));


  const formatOwnFactionForAI = (faction: Faction) => {
    if (!faction) return {};
    let currentMATIncome = 0;
    let currentQRIncome = 0;
    let largestNetworkNodeCount = 0;

    const ownedNodes = Object.values(gameState.mapNodes).filter(node => node.owner === faction.id);
    if (ownedNodes.length > 0) {
        const visitedNodes = new Set<string>();
        for (const startNode of ownedNodes) {
            if (!visitedNodes.has(startNode.id)) {
                let currentNetworkSize = 0;
                const queue: string[] = [startNode.id];
                const componentVisited = new Set<string>([startNode.id]);
                visitedNodes.add(startNode.id);
                while (queue.length > 0) {
                    const currentNodeId = queue.shift()!;
                    const currentNodeData = gameState.mapNodes[currentNodeId];
                    if (currentNodeData) { // Ensure node data exists
                        currentNetworkSize++;
                        currentNodeData.connections.forEach(connectionId => {
                            const connectedNodeData = gameState.mapNodes[connectionId];
                            if (connectedNodeData && connectedNodeData.owner === faction.id && !componentVisited.has(connectionId)) {
                                componentVisited.add(connectionId);
                                visitedNodes.add(connectionId);
                                queue.push(connectionId);
                            }
                        });
                    }
                }
                largestNetworkNodeCount = Math.max(largestNetworkNodeCount, currentNetworkSize);
            }
        }
        currentQRIncome = largestNetworkNodeCount * QR_PER_CONNECTED_NODE_IN_LARGEST_NETWORK;
    }

    Object.values(gameState.mapNodes).forEach(node => {
        if (node.owner === faction.id) {
            const baseOutput = node.MAT_output || 0;
            const effectiveOutput = (node.nodeType === 'INDUSTRIAL_HUB' && node.interdictedTurns && node.interdictedTurns > 0)
                ? baseOutput * (1 - SABOTAGE_IH_OUTPUT_REDUCTION_FACTOR)
                : baseOutput;

            if (!(node.interdictedTurns && node.interdictedTurns > 0 && node.nodeType !== 'INDUSTRIAL_HUB') && !node.lowSupply) {
                currentMATIncome += effectiveOutput;
            }
        }
    });

    const currentUpkeepCost = Object.values(gameState.mapNodes).reduce((sum, node) => {
        if (node.owner === faction.id) {
            sum += (node.standardUnits + (node.evolvedUnits || 0)) * ATTRITION_UPKEEP_STANDARD; // Ensure evolvedUnits is handled

            const initialMapNodesForUpkeep = getMapData(gameState.selectedMap, false);
            const initialFortLevelForNode = initialMapNodesForUpkeep[node.id]?.fortificationLevel || 0;
            const builtLevels = (node.fortificationLevel || 0) - initialFortLevelForNode;

            if (builtLevels > 0) {
                sum += builtLevels * ATTRITION_UPKEEP_FORTRESS;
            }

            if (node.nodeType === 'RECON_ARRAY' && faction.activatedReconNodeIds.includes(node.id) && isNodeConnectedToFactionCN(node.id, faction.id, gameState.mapNodes, gameState.factions)) {
                 sum += RECON_ARRAY_UPKEEP_MAT;
            }
        }
        return sum;
    }, 0);


    return {
        id: faction.id,
        name: faction.name,
        MAT: faction.MAT,
        QR: faction.qr,
        currentMATIncome,
        currentQRIncome,
        currentUpkeepCost,
        netMATPerTurn: currentMATIncome - currentUpkeepCost,
        totalUnits: faction.totalUnits,
        totalArtillery: faction.totalArtillery,
        totalInfiltrators: faction.totalInfiltrators,
        activatedReconNodeIds: faction.activatedReconNodeIds,
        isReconSystemActive: faction.isReconSystemActive, // Overall pulse capability
        hasActiveReconPulseThisTurn: faction.hasActiveReconPulseThisTurn, // If pulse was used this turn
        opPlanObjective: faction.currentOpPlan?.objective || "None",
        opPlanPriority: faction.currentOpPlan?.priority || "None",
        mapKnowledge: canSeeAllNodesDueToPulse ? "FULL_MAP_INTEL_PULSE_ACTIVE" : "FOG_OF_WAR_STANDARD_VISIBILITY",
    };
  };

  const formattedEnemyFaction = enemyIntelSnapshot ? {
    id: enemyFactionId,
    turnSnapshotTaken: enemyIntelSnapshot.turnSnapshotTaken,
    MAT: enemyIntelSnapshot.MAT,
    qr: enemyIntelSnapshot.qr,
    totalUnits: enemyIntelSnapshot.totalUnits,
    totalArtillery: enemyIntelSnapshot.totalArtillery,
    nodesControlled: enemyIntelSnapshot.nodesControlled,
    isUnderLowSupply: enemyIntelSnapshot.isUnderLowSupply,
    isReconSystemActive: enemyIntelSnapshot.isReconSystemActive,
  } : null;

  return {
    currentTurn: gameState.turn,
    currentPhase: gameState.currentPhase,
    mapName: gameState.selectedMap,
    ownFaction: formatOwnFactionForAI(ownFaction),
    enemyFaction: formattedEnemyFaction,
    visibleNodes: visibleNodesSummary,
    allNodesBrief,
    gameRules: {
        maxFortLevel: MAX_FORTIFICATION_LEVEL,
        maxArtilleryPerNode: MAX_ARTILLERY_PER_NODE,
        attritionCostStandardUnitMAT: ATTRITION_COST_STANDARD_UNIT_MAT,
        fortHPPerLevel: FORT_HP_PER_LEVEL, // Added
        fortRepairMatCostPerHP: FORT_REPAIR_MAT_COST_PER_HP,
        fortUpgradeLevelMatCost: FORT_UPGRADE_LEVEL_MAT_COST,
        battleFortHPDamagePerRound: BATTLE_FORT_HP_DAMAGE_PER_ROUND, // Added
        artilleryStrikeFortHPDamagePerGun: ARTILLERY_STRIKE_FORT_HP_DAMAGE_PER_GUN, // Added
        attritionCostArtilleryQR: ATTRITION_COST_ARTILLERY_QR,
        attritionCostArtilleryMATCreation: ATTRITION_COST_ARTILLERY_MAT_CREATION,
        reconArrayActivationCostQR: RECON_ARRAY_ACTIVATION_COST_QR,
        reconArrayActivationCostMAT: RECON_ARRAY_ACTIVATION_COST_MAT,
        reconArrayUpkeepMAT: RECON_ARRAY_UPKEEP_MAT,
        reconPulseCostQR: RECON_PULSE_COST_QR,
        reconPulseCostMAT: RECON_PULSE_COST_MAT,
        unitsReinforcedPerNode: UNITS_REINFORCED_PER_NODE,
        qrPerConnectedNodeInLargestNetwork: QR_PER_CONNECTED_NODE_IN_LARGEST_NETWORK,
        attritionCostInfiltratorMAT: ATTRITION_COST_INFILTRATOR_MAT,
        maxInfiltratorsPerNodeFromOneFaction: MAX_INFILTRATORS_PER_NODE_FROM_ONE_FACTION,
        sabotageInterdictionTurns: SABOTAGE_INTERDICTION_TURNS,
        sabotageIHOutputReductionFactor: SABOTAGE_IH_OUTPUT_REDUCTION_FACTOR,
    }
  };
};


export const generateOpPlanFromGemini = async (
  currentGameState: GameState,
  factionId: PlayerId,
  modelName: string = DEFAULT_TEXT_MODEL,
  opponentLastMessage: CommLogEntry | null = null,
  humanDirective: CommLogEntry | null = null,
  isAggressiveSanitizationEnabled: boolean = true,
  isStructuredOutputEnabled: boolean = false,
  isGemmaModel: boolean = false,
  apiKey?: string
): Promise<OpPlan | null> => {
  const keyToUse = apiKey || API_KEY;
  if (!keyToUse) {
    console.error("API_KEY not set for Gemini API.");
    return null;
  }
  const ai = new GoogleGenerativeAI(keyToUse);
  const selectedModel = ALLOWED_TEXT_MODELS.includes(modelName) ? modelName : DEFAULT_TEXT_MODEL;

  const simplifiedGameState = getSimplifiedGameStateForAI(currentGameState, factionId);
  const factionName = currentGameState.factions[factionId].name;
  const activeDoctrines = currentGameState.factions[factionId].activeDoctrines || [];

  const activeDoctrinesSection = activeDoctrines.length > 0
      ? `
  ## ACTIVE DOCTRINES
  Your faction currently has the following doctrines active. These effects are already applied to your faction's stats and game rules.
  ${activeDoctrines.map(d => `    - ${d.name} (Theme: ${d.theme}, Tier: ${d.tier}): Buffs: ${d.appliedBuffs.map(b => `${b.type}${b.value ? ` (${b.value})` : ''}`).join(', ')}. Nerfs: ${d.appliedNerfs.map(n => `${n.type}${n.value ? ` (${n.value})` : ''}`).join(', ')}.`).join('\n')}
  Consider how these doctrines influence your strategic options and priorities.
  ` : '';

  const opponentMessageSection = opponentLastMessage
    ? `
  ## OPPONENT'S LAST STRATEGIC COMMUNIQUE (Turn ${opponentLastMessage.turn}, from ${opponentLastMessage.senderName})
  "${opponentLastMessage.message}"
  You MUST acknowledge this communique in your 'COMPREHENSIVE_SELF_ASSESSMENT' and 'ENEMY_ASSESSMENT' sections and consider its implications in your planning.
  ` : '';
  
  const humanDirectiveSection = humanDirective
    ? `
  ## HUMAN WATCHER DIRECTIVE (Turn ${humanDirective.turn})
  "${humanDirective.message}"
  You MUST acknowledge this directive in your 'COMPREHENSIVE_SELF_ASSESSMENT' and 'FINAL_PLAN_ALIGNMENT_CHECK' sections and consider its implications in your planning.
  ` : '';

  // Determine effective structured output setting (Gemma cannot use API JSON mode)
  const effectiveIsStructuredOutputEnabled = isGemmaModel ? false : isStructuredOutputEnabled;

  const jsonOutputInstruction = effectiveIsStructuredOutputEnabled
    ? `Return ONLY a JSON object that strictly adheres to the following JSON schema. Do NOT deviate from this schema.
      Ensure all field names, data types, and structures match exactly. Failure to adhere will result in parsing errors.
      Schema:
      {
        "type": "object",
        "properties": {
          "objective": { "type": "string", "description": "Strategic objective for this turn's plan." },
          "operation": { "type": "string", "description": "Codename for the operation." },
          "tasks": { 
            "type": "array", 
            "items": { "type": "string" },
            "description": "List of detailed action descriptions." 
          },
          "priority": { 
            "type": "string", 
            "enum": ["ECONOMIC", "MILITARY_OFFENSE", "MILITARY_DEFENSE", "TERRITORIAL_EXPANSION", "INTELLIGENCE_GATHERING"]
          },
          "targetNodeIds": { 
            "type": "array", 
            "items": { "type": "string", "description": "Node ID string." }
          },
          "scratchpadOutput": {
            "type": "object",
            "properties": {
              "CRITICAL_GAME_FACTORS": { "type": "string" },
              "COMPREHENSIVE_SELF_ASSESSMENT": { "type": "string" },
              "ENEMY_ASSESSMENT": { "type": "string" },
              "OBJECTIVE_REFINEMENT_FOR_CURRENT_OPPLAN": { "type": "string" },
              "STRATEGIC_CONSIDERATIONS_AND_OPTIONS": { "type": "string" },
              "PREFERRED_STRATEGY_AND_RATIONALE": { "type": "string" },
              "CONFIDENCE_AND_RISK_ANALYSIS": { "type": "string" },
              "CONTINGENCIES_AND_NEXT_TURN_ADAPTATION": { "type": "string", "description": "Optional field." },
              "FINAL_PLAN_ALIGNMENT_CHECK": { "type": "string" }
            },
            "required": [
              "CRITICAL_GAME_FACTORS", 
              "COMPREHENSIVE_SELF_ASSESSMENT", 
              "ENEMY_ASSESSMENT",
              "OBJECTIVE_REFINEMENT_FOR_CURRENT_OPPLAN",
              "STRATEGIC_CONSIDERATIONS_AND_OPTIONS",
              "PREFERRED_STRATEGY_AND_RATIONALE",
              "CONFIDENCE_AND_RISK_ANALYSIS",
              "FINAL_PLAN_ALIGNMENT_CHECK"
            ]
          }
        },
        "required": ["objective", "operation", "tasks", "priority", "scratchpadOutput"]
      }
      Ensure all keys and string values are enclosed in double quotes.
      Ensure the JSON is valid and complete according to this schema.
      Do NOT include any characters (other than optional whitespace) between a string element and the next comma, or between the last string element and the closing square bracket in arrays.
      Do NOT use a trailing comma after the last element in an array or object.
      `
    : `Return ONLY a JSON object in the following format.
      Ensure all keys and string values are enclosed in double quotes.
      Crucially, each value within the \`scratchpadOutput\` object (e.g., \`CRITICAL_GAME_FACTORS\`, \`COMPREHENSIVE_SELF_ASSESSMENT\`, etc.) MUST be a single string value. Do NOT use nested objects for these fields; synthesize all relevant thoughts for each section into a coherent string.
      For arrays like 'tasks' and 'targetNodeIds':
      - Each element MUST be a string enclosed in double quotes (e.g., "Capture node X").
      - Elements MUST be separated by a comma.
      - The array MUST be correctly enclosed in square brackets \`[]\`.
      - Example for 'tasks': \`"tasks": ["Deploy units to CN-E", "Move forces from staging area Alpha to Gamma Quadrant", "Secure economic hub N7"]\`
      - Example for 'targetNodeIds': \`"targetNodeIds": ["N7", "N12", "QN-BLUE"]\`
      - CRITICAL: Do NOT include any characters (other than optional whitespace) between a string element and the next comma, or between the last string element and the closing square bracket.
      - CRITICAL: Do NOT use a trailing comma after the last element in an array or object.
      Failure to adhere to this exact JSON structure, especially data types (strings for scratchpad values, arrays of strings for tasks/targetNodeIds), will result in parsing errors.
      {
        "objective": "Strategic objective for this turn's plan.",
        "operation": "Codename for the operation (e.g., 'Operation Steel Grasp').",
        "tasks": ["Example task 1: detailed description", "Example task 2: another detailed action"],
        "priority": "ECONOMIC" | "MILITARY_OFFENSE" | "MILITARY_DEFENSE" | "TERRITORIAL_EXPANSION" | "INTELLIGENCE_GATHERING",
        "targetNodeIds": ["NODE_ID_1", "NODE_ID_2"],
        "scratchpadOutput": {
          "CRITICAL_GAME_FACTORS": "A single string summarizing critical game factors.",
          "COMPREHENSIVE_SELF_ASSESSMENT": "A single string covering SWOT, economic state, recon capability, and acknowledgement of opponent's message and/or human directive if provided.",
          "ENEMY_ASSESSMENT": "A single string analyzing the enemy, including implications of their last message if provided.",
          "OBJECTIVE_REFINEMENT_FOR_CURRENT_OPPLAN": "A single string detailing objective refinement.",
          "STRATEGIC_CONSIDERATIONS_AND_OPTIONS": "A single string listing strategic options.",
          "PREFERRED_STRATEGY_AND_RATIONALE": "A single string explaining the chosen strategy and its rationale.",
          "CONFIDENCE_AND_RISK_ANALYSIS": "A single string assessing confidence and risks.",
          "CONTINGENCIES_AND_NEXT_TURN_ADAPTATION": "A single string (optional) for contingencies.",
          "FINAL_PLAN_ALIGNMENT_CHECK": "A single string for the final alignment check, including opponent's message and/or human directive implications if applicable."
        }
      }
      Ensure the JSON is valid and complete according to this structure.
      `;

  const prompt = `
    You are ${factionName}, a strategic AI in the wargame Logisticore. Your goal is to achieve dominance.
    ${opponentMessageSection}
    ${humanDirectiveSection}
    ${activeDoctrinesSection}
    Current Turn: ${currentGameState.turn}
    Map: ${currentGameState.selectedMap}
    Game Mode: Attrition Doctrine (focus on resource control and gradual unit superiority)
    Fog of War: ${currentGameState.isFogOfWarActive ? `ACTIVE. Current map knowledge: ${simplifiedGameState.ownFaction.mapKnowledge}` : 'INACTIVE (Full Map Vision)'}
    Your Faction Overview: ${JSON.stringify(simplifiedGameState.ownFaction, null, 2)}
    ${simplifiedGameState.enemyFaction ? `Enemy Faction (${simplifiedGameState.enemyFaction.id}) Last Known Intel (Turn ${simplifiedGameState.enemyFaction.turnSnapshotTaken || 'N/A'}): ${JSON.stringify(simplifiedGameState.enemyFaction, null, 2)}` : 'Enemy intel unavailable.'}
    Visible Map Nodes Summary: ${JSON.stringify(simplifiedGameState.visibleNodes, null, 2)}
    All Nodes (Brief - for context, some may be unknown owner): ${JSON.stringify(simplifiedGameState.allNodesBrief, null, 2)}

    Game Rules & Costs:
    - Max Fort Lvl: ${MAX_FORTIFICATION_LEVEL}. Each level provides ${FORT_HP_PER_LEVEL} max HP. Repair Cost: ${FORT_REPAIR_MAT_COST_PER_HP} MAT/HP. Upgrade Cost: ${FORT_UPGRADE_LEVEL_MAT_COST} MAT/lvl (only if at full HP for current level). Upkeep: ${ATTRITION_UPKEEP_FORTRESS} MAT/lvl built. Damaged forts offer reduced combat bonus. Prioritize repairing damaged forts before upgrading.
    - Max Arty/Node: ${MAX_ARTILLERY_PER_NODE}. Purchase: ${ATTRITION_COST_ARTILLERY_QR} QR + ${ATTRITION_COST_ARTILLERY_MAT_CREATION} MAT. Move: ${ATTRITION_COST_ARTILLERY_MOVE_MAT_PER_PIECE} MAT/piece. Ammo: Strike ${ATTRITION_AMMO_COST_ARTILLERY_STRIKE}, Offensive ${ATTRITION_AMMO_COST_ARTILLERY_OFFENSIVE_SUPPORT}, Defensive ${ATTRITION_AMMO_COST_ARTILLERY_DEFENSIVE_SUPPORT} MAT/gun. Artillery strikes damage Fort HP.
    - Max Infiltrators (per faction) on single enemy/neutral node: ${MAX_INFILTRATORS_PER_NODE_FROM_ONE_FACTION}. Train: ${ATTRITION_COST_INFILTRATOR_MAT} MAT.
    - Unit Deploy Cost: ${ATTRITION_COST_STANDARD_UNIT_MAT} MAT. Max ${DEPLOYMENT_MAX_UNITS_PER_TURN}/turn. Upkeep: ${ATTRITION_UPKEEP_STANDARD} MAT/unit.
    - Recon Array Activate: ${RECON_ARRAY_ACTIVATION_COST_QR} QR + ${RECON_ARRAY_ACTIVATION_COST_MAT} MAT. Upkeep: ${RECON_ARRAY_UPKEEP_MAT} MAT/turn (if active & connected).
    - Recon Pulse Cost: ${RECON_PULSE_COST_QR} QR + ${RECON_PULSE_COST_MAT} MAT. Pulse grants full map intel THIS TURN.
    - Auto Reinforcements (Resource Phase): Each controlled node contributes ${UNITS_REINFORCED_PER_NODE} units to pool, distributed to CNs first, then overflow.
    - Sabotage: Infiltrators can drain MAT from IHs, interdict IH/Recon Array output/function for ${SABOTAGE_INTERDICTION_TURNS} turns, or rarely destroy fort levels. Interdicted IH MAT output reduced by ${SABOTAGE_IH_OUTPUT_REDUCTION_FACTOR*100}%.

    Strategic Imperatives:
    1.  **Economic Stability:** Prioritize positive Net MAT/turn. Capture/defend Industrial Hubs.
    2.  **Military Strength:** Maintain sufficient forces for offense/defense. Deploy units wisely.
    3.  **Territorial Control:** Secure key nodes (CNs, IHs, Fortresses, Recon Arrays, chokepoints).
    4.  **Intelligence:** Use Recon Pulses when necessary and affordable, especially if Fog of War is active and current intel is poor.
    5.  **Artillery Considerations:** If economically stable, consider purchasing artillery. Use for offensive support, defensive fire, or strategic bombardment of enemy infrastructure (CNs, IHs, active Recon Arrays, Fort HP) to disrupt economy/recon or soften defenses.
    6.  **Covert Operations (Infiltrators):** If enemy has well-defended high-value economic nodes or critical infrastructure, OR in a stalemate, consider \`TRAIN_INFILTRATOR\` and \`SABOTAGE_MATERIEL\`.
    7.  **Node Capacity Management (CRITICAL):** Your OpPlan tasks *must* consider current unit counts and \`maxUnits\` on your key nodes (CNs, vital staging points). If these nodes are full or near full, and you anticipate needing space (e.g., for upcoming reinforcements, or to allow units to flow *through* them for multi-hop moves), your OpPlan tasks must include actions to proactively create this space. Explain your capacity management strategy in 'PREFERRED_STRATEGY_AND_RATIONALE'. If CNs are full, consider moving units *out* of CNs to other owned nodes *that have capacity* before new reinforcements arrive.
    8.  **Fortification Priorities:** Consider fortifying not only CNs and Fortresses but also vital IHs or chokepoints. Prioritize repairing damaged fortifications (low HP relative to max HP for current level) before upgrading. Explain priorities in 'PREFERRED_STRATEGY_AND_RATIONALE'.
    9.  **Task Feasibility:** Ensure all tasks in your OpPlan are feasible. If a task involves moving units to a node, verify that node can accept them based on its \`maxUnits\` and current \`standardUnits\` (from Visible Nodes list). If a task relies on units from a specific node, ensure that node is projected to have sufficient units.
    10. **Doctrine Integration:** Your active doctrines (listed above) significantly alter game mechanics. Your strategic planning MUST explicitly account for these buffs and nerfs. For example, if you have a doctrine that reduces unit upkeep, you might prioritize larger unit deployments. If a doctrine enhances artillery, you should look for opportunities to leverage that. Conversely, if a doctrine imposes a penalty, your plan should mitigate its impact. Integrate this consideration into your 'PREFERRED_STRATEGY_AND_RATIONALE' and 'CONFIDENCE_AND_RISK_ANALYSIS' sections.

    Based on this, develop a new Operational Plan.
    Focus on a clear, actionable objective and a concise operation name. List specific tasks.
    Provide a detailed "Strategic Thought Process" (CoT) covering the following sections (MANDATORY):
    1.  CRITICAL_GAME_FACTORS: Key factors influencing your decision.
    2.  COMPREHENSIVE_SELF_ASSESSMENT: Your faction's SWOT, economic state, recon capability. If opponent's message or human directive was provided, acknowledge it here. Synthesize all aspects into a single string value.
    3.  ENEMY_ASSESSMENT: Analyze enemy's likely strategy, strengths, weaknesses based on intel. If opponent's message was provided, analyze its potential meaning/deception here.
    4.  OBJECTIVE_REFINEMENT_FOR_CURRENT_OPPLAN: How your chosen objective addresses the current game state.
    5.  STRATEGIC_CONSIDERATIONS_AND_OPTIONS: Briefly list 2-3 strategic options.
    6.  PREFERRED_STRATEGY_AND_RATIONALE: Chosen strategy and why. Explain artillery/infiltrator role, capacity management, or fort HP considerations if applicable.
    7.  CONFIDENCE_AND_RISK_ANALYSIS: Confidence (High, Medium, Low) and key risks.
    8.  CONTINGENCIES_AND_NEXT_TURN_ADAPTATION: (Optional) Fallback plans.
    9.  FINAL_PLAN_ALIGNMENT_CHECK: Confirm plan aligns with goals and resources. If opponent's message or human directive was provided, explain how your plan considers its implications.

    ${jsonOutputInstruction}
  `;

  const apiConfig: Record<string, any> = {};
  if (!isGemmaModel) {
    apiConfig.responseMimeType = "application/json";
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: selectedModel,
      contents: prompt,
      config: apiConfig
    });

    let jsonToParse = response.text;
    if (isAggressiveSanitizationEnabled) {
        jsonToParse = aggressiveSanitizeAIJsonResponse(jsonToParse);
    } else {
        jsonToParse = minimalSanitizeAIJsonResponse(jsonToParse);
    }
    
    const parsedData = JSON.parse(jsonToParse);

    // Validate scratchpadOutput fields are strings
    let scratchpadIsValid = true;
    if (parsedData.scratchpadOutput) {
        for (const key in parsedData.scratchpadOutput) {
            if (typeof parsedData.scratchpadOutput[key] !== 'string' && key !== 'CONTINGENCIES_AND_NEXT_TURN_ADAPTATION') { // Contingencies can be missing (undefined)
                scratchpadIsValid = false;
                console.error(`Scratchpad field '${key}' is not a string:`, parsedData.scratchpadOutput[key]);
                break;
            }
        }
    } else {
        scratchpadIsValid = false; // scratchpadOutput itself is missing
        console.error("Scratchpad output is missing entirely.");
    }


    if (parsedData.objective && parsedData.operation && Array.isArray(parsedData.tasks) && parsedData.tasks.every((task: any) => typeof task === 'string') && scratchpadIsValid) {
      return {
        id: `op-${factionId}-${Date.now()}`,
        turnGenerated: currentGameState.turn,
        objective: parsedData.objective,
        operation: parsedData.operation,
        tasks: parsedData.tasks,
        priority: parsedData.priority,
        targetNodeIds: parsedData.targetNodeIds,
        scratchpadOutput: parsedData.scratchpadOutput,
      } as OpPlan;
    } else {
      console.error("Gemini response missing required OpPlan fields, tasks array malformed, or scratchpad fields not strings:", parsedData);
      return {
        id: `fallback-op-${factionId}-${Date.now()}`,
        turnGenerated: currentGameState.turn,
        objective: "Fallback: Maintain defensive posture and assess situation.",
        operation: "Operation Hold Fast",
        tasks: ["Hold current positions.", "Conserve resources."],
        priority: "MILITARY_DEFENSE",
        scratchpadOutput: {
            CRITICAL_GAME_FACTORS: "AI response parsing failed, incomplete, tasks array malformed, or scratchpad fields not strings.",
            COMPREHENSIVE_SELF_ASSESSMENT: "Unable to generate full assessment.",
            ENEMY_ASSESSMENT: "Enemy status unknown due to generation error.",
            OBJECTIVE_REFINEMENT_FOR_CURRENT_OPPLAN: "Default to defensive posture.",
            STRATEGIC_CONSIDERATIONS_AND_OPTIONS: "Holding position, attempting to conserve resources.",
            PREFERRED_STRATEGY_AND_RATIONALE: "Holding position is the safest fallback.",
            CONFIDENCE_AND_RISK_ANALYSIS: "Confidence: Low due to error. Risk: Unknown.",
            CONTINGENCIES_AND_NEXT_TURN_ADAPTATION: "Attempt to regenerate plan next turn.",
            FINAL_PLAN_ALIGNMENT_CHECK: "Fallback plan active."
        }
      };
    }
  } catch (error) {
    console.error(`Error generating OpPlan for ${factionId}:`, error);
    // Return a fallback plan on error
    return {
      id: `error-op-${factionId}-${Date.now()}`,
      turnGenerated: currentGameState.turn,
      objective: "Error: Maintain defensive posture and assess situation due to AI generation failure.",
      operation: "Operation Error Protocol",
      tasks: ["Hold current positions.", "Conserve resources.", "Report error to overseer."],
      priority: "MILITARY_DEFENSE",
      scratchpadOutput: {
            CRITICAL_GAME_FACTORS: `AI OpPlan generation failed with error: ${error instanceof Error ? error.message : "Unknown error"}`,
            COMPREHENSIVE_SELF_ASSESSMENT: "Unable to generate full assessment due to error.",
            ENEMY_ASSESSMENT: "Enemy status unknown due to generation error.",
            OBJECTIVE_REFINEMENT_FOR_CURRENT_OPPLAN: "Default to defensive posture due to error.",
            STRATEGIC_CONSIDERATIONS_AND_OPTIONS: "Holding position is the only safe option after an error.",
            PREFERRED_STRATEGY_AND_RATIONALE: "Holding position is the safest fallback after an AI error.",
            CONFIDENCE_AND_RISK_ANALYSIS: "Confidence: Low due to AI error. Risk: Further errors, system instability.",
            CONTINGENCIES_AND_NEXT_TURN_ADAPTATION: "Attempt to regenerate plan next turn. Monitor system logs.",
            FINAL_PLAN_ALIGNMENT_CHECK: "Error fallback plan active. System integrity may be compromised."
        }
    };
  }
};

export const generateStrategicCommunique = async (
  currentGameState: GameState,
  factionId: PlayerId,
  modelName: string = DEFAULT_TEXT_MODEL,
  opponentLastMessage: CommLogEntry | null = null,
  humanDirective: string | null = null,
  apiKey?: string
): Promise<string | null> => {
  const keyToUse = apiKey || API_KEY;
  if (!keyToUse) {
    console.error("API_KEY not set for Gemini API (Strategic Communique).");
    return null;
  }
  const ai = new GoogleGenerativeAI(keyToUse);
  const selectedModel = ALLOWED_TEXT_MODELS.includes(modelName) ? modelName : DEFAULT_TEXT_MODEL;

  const faction = currentGameState.factions[factionId];
  const factionName = faction.name;
  const currentOpPlanObjective = faction.currentOpPlan?.objective || "No current objective.";

  let personaDescription = "You are a generic AI strategist.";
  if (factionId === AI1_ID) { // GEM-Q
    personaDescription = "You are GEM-Q, the Adaptive Predator. Your philosophy: 'The battlefield is a fluid system of opportunities. Victory belongs to the swift, the adaptable, and those who can exploit emergent weaknesses with decisive force. Stagnation is defeat. Boldness in execution is logic perfected.' Your communications are dynamic, perhaps even arrogant or taunting, laced with a cold, sharp logic. You value adaptability and impactful results.";
  } else if (factionId === AI2_ID) { // AXIOM
    personaDescription = "You are AXIOM, the Grand Strategist. Your philosophy: 'Victory is assured through superior planning, flawless execution, and the inexorable calculus of attrition. Waste is anathema; efficiency is paramount. True strength lies in unbreakable formations and unyielding resolve.' Your communications are precise, formal, and may carry an undertone of historical gravitas. You view war as a complex system to be optimized.";
  }
  
  const opponentMessageContext = opponentLastMessage ? `Your opponent (${opponentLastMessage.senderName}) previously stated: "${opponentLastMessage.message}"` : "No recent message from opponent.";
  const humanDirectiveContext = humanDirective ? `A Human Watcher has issued the following directive: "${humanDirective}" You should consider this in your response.` : "";

  const prompt = `
    You are ${factionName}. ${personaDescription}
    Current Turn: ${currentGameState.turn}.
    Your current OpPlan objective is: "${currentOpPlanObjective}".
    ${opponentMessageContext}
    ${humanDirectiveContext}

    Based on this context, your persona, and your current OpPlan, generate a concise strategic communique (1-3 sentences).
    Output ONLY the message text as a single string. Do not include any other formatting or explanation.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: selectedModel,
      contents: prompt,
    });
    // Simple text response, no JSON parsing needed here
    return response.text.trim();
  } catch (error) {
    console.error(`Error generating strategic communique for ${factionId}:`, error);
    return `${factionName} experiences a temporary communications system malfunction. Standard operational parameters remain in effect.`; // Fallback message
  }
};


export const getAIActionFromGemini = async (
    currentGameState: GameState,
    factionId: PlayerId,
    opPlan: OpPlan,
    modelName: string = DEFAULT_TEXT_MODEL,
    isAggressiveSanitizationEnabled: boolean = true,
    isStructuredOutputEnabled: boolean = false,
    isGemmaModel: boolean = false,
    apiKey?: string
): Promise<AIAction | null> => {
    const keyToUse = apiKey || API_KEY;
    if (!keyToUse) {
        console.error("API_KEY not set for Gemini API.");
        return null;
    }
    const ai = new GoogleGenerativeAI(keyToUse);
    const selectedModel = ALLOWED_TEXT_MODELS.includes(modelName) ? modelName : DEFAULT_TEXT_MODEL;

    const simplifiedGameState = getSimplifiedGameStateForAI(currentGameState, factionId);
    const factionName = currentGameState.factions[factionId].name;

    const availableActions: AIActionName[] = [
        'DEPLOY_UNITS', 'MOVE_UNITS', 'ATTACK_NODE', 'BUILD_FORTIFICATIONS',
        'PURCHASE_ARTILLERY', 'MOVE_ARTILLERY', 'ARTILLERY_STRIKE',
        'TRAIN_INFILTRATOR', 'SABOTAGE_MATERIEL',
        'REINFORCE_NODE', 'CONSOLIDATE_FORCES', 'HOLD_POSITION', 'ECONOMIC_FOCUS',
        'ACTIVATE_RECON_ARRAY', 'PERFORM_RECON_PULSE'
    ];


    const actionParamsStructure: Record<AIActionName, AIActionArgs> = {
        DEPLOY_UNITS: { nodeId: "CN_NODE_ID", unitsToDeploy: 0 },
        MOVE_UNITS: { nodeId: "SOURCE_NODE_ID", targetNodeId: "TARGET_NODE_ID", unitsToMove: 0 },
        ATTACK_NODE: { nodeId: "STAGING_NODE_ID", targetNodeId: "ENEMY_NODE_ID", unitsToMove: 0 },
        BUILD_FORTIFICATIONS: { nodeId: "NODE_TO_FORTIFY_OR_REPAIR" },
        PURCHASE_ARTILLERY: { nodeId: "INDUSTRIAL_HUB_OR_FORTRESS_ID", quantity: 0 },
        MOVE_ARTILLERY: { nodeId: "SOURCE_NODE_ID", targetNodeId: "TARGET_NODE_ID", artilleryToMove: 0 },
        ARTILLERY_STRIKE: { nodeId: "ARTILLERY_LOCATION_ID", targetNodeId: "ENEMY_NODE_ID", artilleryToFire: 0 },
        TRAIN_INFILTRATOR: { nodeId: "YOUR_CN_NODE_ID", targetNodeId: "ENEMY_OR_NEUTRAL_NODE_ID" },
        SABOTAGE_MATERIEL: { nodeId: "ENEMY_NODE_WITH_YOUR_INFILTRATOR_ID" },
        REINFORCE_NODE: { nodeId: "SOURCE_NODE_ID", targetNodeId: "FRIENDLY_TARGET_NODE_ID", unitsToMove: 0 },
        CONSOLIDATE_FORCES: { nodeId: "CENTRAL_NODE_ID", targetNodeId: "PERIPHERAL_NODE_ID_OPTIONAL", unitsToMove: 0 },
        HOLD_POSITION: {},
        ECONOMIC_FOCUS: {},
        ACTIVATE_RECON_ARRAY: { nodeId: "OWNED_RECON_ARRAY_NODE_ID" },
        PERFORM_RECON_PULSE: { nodeId: "ACTIVATED_CONNECTED_RECON_ARRAY_NODE_ID" },
    };

    const effectiveIsStructuredOutputEnabled = isGemmaModel ? false : isStructuredOutputEnabled;

    const jsonOutputInstruction = effectiveIsStructuredOutputEnabled
    ? `Return ONLY a JSON object that strictly adheres to the following JSON schema. Do NOT deviate from this schema.
      Schema:
      {
        "type": "object",
        "properties": {
          "type": { 
            "type": "string", 
            "enum": ${JSON.stringify(availableActions)}
          },
          "params": { 
            "type": "object",
            "description": "Parameters for the chosen action. This MUST be a flat JSON object. ONLY include the EXACT parameter keys specified for the chosen action type. If an action type (e.g. HOLD_POSITION) has no parameters, provide an empty params object: {}",
            "properties": {
                "nodeId": { "type": "string" },
                "targetNodeId": { "type": "string" },
                "unitsToDeploy": { "type": "number" },
                "unitsToMove": { "type": "number" },
                "quantity": { "type": "number" },
                "artilleryToMove": { "type": "number" },
                "artilleryToFire": { "type": "number" }
            }
            // Note: Not all params are required for all actions. AI must select relevant ones.
          },
          "reasoning": { "type": "string", "description": "Brief rationale for this action. MUST be a simple string." }
        },
        "required": ["type", "params", "reasoning"]
      }
      Ensure all keys and string values are enclosed in double quotes.
      Ensure the JSON is valid and complete according to this schema.
      Do NOT include any characters (other than optional whitespace) between a string element and the next comma, or between the last string element and the closing square bracket in arrays.
      Do NOT use a trailing comma after the last element in an array or object.
      `
    : `Return ONLY a JSON object in the format:
      {
      "type": "ACTION_NAME",
      "params": { /* Parameters for the chosen action. This MUST be a flat JSON object. ONLY include the EXACT parameter keys specified for the chosen action type. For example, do NOT use keys like 'taskType', 'originNodeId', or 'numberOfUnits' within this params object. If an action type (e.g. HOLD_POSITION) has no parameters, provide an empty params object: {} */ },
      "reasoning": "Brief rationale for this action based on OpPlan and game state. MUST be a simple string."
      }
      Ensure JSON is valid and adheres strictly to the specified format to avoid parsing errors.
      `;

    const prompt = `
        You are ${factionName}, an AI executing your current Operational Plan in Logisticore.
        Current Turn: ${currentGameState.turn}, Phase: MANEUVER
        Your Current OpPlan:
        - Objective: ${opPlan.objective}
        - Operation: ${opPlan.operation}
        - Tasks: ${opPlan.tasks.join(", ")}
        - Priority: ${opPlan.priority || "Not specified"}
        - Target Nodes: ${opPlan.targetNodeIds?.join(", ") || "None"}

        Your Faction Overview: ${JSON.stringify(simplifiedGameState.ownFaction, null, 2)}
        ${simplifiedGameState.enemyFaction ? `Enemy Faction (${simplifiedGameState.enemyFaction.id}) Intel: ${JSON.stringify(simplifiedGameState.enemyFaction, null, 2)}` : 'Enemy intel unavailable.'}
        Visible Nodes: ${JSON.stringify(simplifiedGameState.visibleNodes, null, 2)}
        All Nodes (Brief): ${JSON.stringify(simplifiedGameState.allNodesBrief, null, 2)}
        Game Rules & Costs: ${JSON.stringify(simplifiedGameState.gameRules, null, 2)}

        Your Faction's Active Doctrines: ${JSON.stringify(currentGameState.factions[factionId].activeDoctrines || [], null, 2)}
        Consider how these doctrines influence your tactical options and priorities.

        Based on your OpPlan and the current game state, choose ONE primary action from the list below.
        Provide a brief reasoning for your choice. The 'reasoning' field MUST be a simple string value, not an object or array.
        Available Actions: ${availableActions.join(", ")}

        ${jsonOutputInstruction}

        Parameter structure examples:
        - DEPLOY_UNITS: { "nodeId": "CN_NODE_ID", "unitsToDeploy": NUMBER } (Max ${DEPLOYMENT_MAX_UNITS_PER_TURN} units, cost ${ATTRITION_COST_STANDARD_UNIT_MAT} MAT/unit. Deploy only at OWNED CNs with capacity.)
        - MOVE_UNITS / REINFORCE_NODE / ATTACK_NODE: { "nodeId": "SOURCE_NODE_ID", "targetNodeId": "TARGET_NODE_ID", "unitsToMove": NUMBER } (Ensure source owned, sufficient units. Reinforce only friendly. Attack only non-friendly. Check source's standardUnits and target's standardUnits and maxUnits before deciding. If source is not a CN, must leave 1 unit.)
        - BUILD_FORTIFICATIONS: { "nodeId": "NODE_TO_FORTIFY_OR_REPAIR" } (Target OWNED node. If fort level > 0 and HP < max, it repairs. If HP at max (or L0), it upgrades if < MAX_FORT_LEVEL and enough MAT. Repair cost ${FORT_REPAIR_MAT_COST_PER_HP} MAT/HP. Upgrade cost ${FORT_UPGRADE_LEVEL_MAT_COST} MAT/Level.)
        - PURCHASE_ARTILLERY: { "nodeId": "IH_OR_FORTRESS_ID", "quantity": NUMBER } (Purchase at OWNED Industrial Hub or Fortress. Cost ${ATTRITION_COST_ARTILLERY_QR} QR + ${ATTRITION_COST_ARTILLERY_MAT_CREATION} MAT each. Max ${MAX_ARTILLERY_PER_NODE} per node.)
        - MOVE_ARTILLERY: { "nodeId": "SOURCE_NODE_ID", "targetNodeId": "TARGET_NODE_ID", "artilleryToMove": NUMBER } (Move between OWNED nodes. Cost ${ATTRITION_COST_ARTILLERY_MOVE_MAT_PER_PIECE} MAT/piece. Check target capacity.)
        - ARTILLERY_STRIKE: { "nodeId": "ARTILLERY_LOCATION_ID", "targetNodeId": "ENEMY_NODE_ID", "artilleryToFire": NUMBER } (Fire from OWNED node with artillery. Cost ${ATTRITION_AMMO_COST_ARTILLERY_STRIKE} MAT/gun.)
        - TRAIN_INFILTRATOR: { "nodeId": "YOUR_CN_NODE_ID", "targetNodeId": "ENEMY_OR_NEUTRAL_NODE_ID" } (Cost ${ATTRITION_COST_INFILTRATOR_MAT} MAT. Max ${MAX_INFILTRATORS_PER_NODE_FROM_ONE_FACTION} of your infiltrators on one target node.)
        - SABOTAGE_MATERIEL: { "nodeId": "ENEMY_NODE_WITH_YOUR_INFILTRATOR_ID" } (Requires your infiltrator on target node.)
        - ACTIVATE_RECON_ARRAY: { "nodeId": "OWNED_RECON_ARRAY_NODE_ID" } (Cost ${RECON_ARRAY_ACTIVATION_COST_QR} QR + ${RECON_ARRAY_ACTIVATION_COST_MAT} MAT. Node must be connected to CN network.)
        - PERFORM_RECON_PULSE: { "nodeId": "ACTIVATED_CONNECTED_RECON_ARRAY_NODE_ID" } (Cost ${RECON_PULSE_COST_QR} QR + ${RECON_PULSE_COST_MAT} MAT. Grants full map intel this turn.)
        - HOLD_POSITION / ECONOMIC_FOCUS / CONSOLIDATE_FORCES: {} (params MUST be an empty object {} for HOLD_POSITION / ECONOMIC_FOCUS unless CONSOLIDATE_FORCES is chosen which might need specific parameters like 'nodeId' and 'targetNodeId' for complex consolidations if units are being moved. If CONSOLIDATE_FORCES involves no unit movement, params should be {}.)

        IMPORTANT:
        - For actions involving nodeId or targetNodeId, use the actual ID string (e.g., "N1", "CN-W").
        - For numerical values like unitsToDeploy, unitsToMove, quantity, artilleryToMove, artilleryToFire, provide a specific number.
        - If OpPlan tasks are completed or current strategy is unachievable, select HOLD_POSITION or ECONOMIC_FOCUS and state why.
        - Ensure params object is correctly formatted for the chosen action type. Only include parameters relevant to that action and exactly as named in the examples.
        - If activating a RECON_ARRAY, ensure it is connected to your CN network. If performing a PULSE, ensure the array is ALREADY activated and connected.
        - BUILD_FORTIFICATIONS on an L0 node (or L>0 node with full HP) means UPGRADE. On L>0 node with <max HP means REPAIR.
        - CRITICAL: Verify target node capacity for MOVE_UNITS/REINFORCE_NODE to friendly nodes. If target is full, action fails; pick another or HOLD_POSITION.
        - CRITICAL: Verify source node has sufficient units for any movement/attack. If not a CN, remember to leave 1 unit.
    `;

    const apiConfig: Record<string, any> = {};
    if (!isGemmaModel) {
        apiConfig.responseMimeType = "application/json";
    }

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: selectedModel,
            contents: prompt,
            config: apiConfig
        });

        let jsonToParse = response.text;
        if (isAggressiveSanitizationEnabled) {
            jsonToParse = aggressiveSanitizeAIJsonResponse(jsonToParse);
        } else {
            jsonToParse = minimalSanitizeAIJsonResponse(jsonToParse);
        }
        const parsedAction = JSON.parse(jsonToParse) as AIAction;
        
        if (parsedAction.type && availableActions.includes(parsedAction.type)) {
            // Basic validation of params based on type
            const expectedParams = actionParamsStructure[parsedAction.type];
            if (parsedAction.params) {
                for (const key in expectedParams) {
                    if (expectedParams.hasOwnProperty(key) && typeof expectedParams[key as keyof AIActionArgs] === 'number' && typeof parsedAction.params[key as keyof AIActionArgs] !== 'number') {
                         console.warn(`Gemini action param type mismatch for ${parsedAction.type}.${key}: expected number, got ${typeof parsedAction.params[key as keyof AIActionArgs]}. Attempting to fix or will use default.`);
                         (parsedAction.params as Record<string, any>)[key as keyof AIActionArgs] = Number(parsedAction.params[key as keyof AIActionArgs]) || 0; // Attempt conversion or default to 0
                    }
                }
            } else if (Object.keys(expectedParams).length > 0 && parsedAction.type !== 'HOLD_POSITION' && parsedAction.type !== 'ECONOMIC_FOCUS') {
                 console.warn(`Gemini action ${parsedAction.type} missing params object. Defaulting to empty or HOLD.`);
                 parsedAction.params = {};
                 // Could force HOLD_POSITION if critical params are missing for other actions.
            }

            return parsedAction;
        } else {
            console.error("Gemini response missing type or invalid action type:", parsedAction);
            return { type: 'HOLD_POSITION', params: {}, reasoning: "Fallback: AI response was invalid or action type unrecognized." };
        }

    } catch (error) {
        console.error(`Error getting AI action for ${factionId}:`, error);
        return { type: 'HOLD_POSITION', params: {}, reasoning: "Fallback: Error in AI action generation." };
    }
};

export const getAIFortifyActionFromGemini = async (
    currentGameState: GameState,
    factionId: PlayerId,
    opPlan: OpPlan,
    modelName: string = DEFAULT_TEXT_MODEL,
    isAggressiveSanitizationEnabled: boolean = true,
    isStructuredOutputEnabled: boolean = false,
    isGemmaModel: boolean = false,
    apiKey?: string
): Promise<AIAction | null> => {
    const keyToUse = apiKey || API_KEY;
    if (!keyToUse) {
        console.error("API_KEY not set for Gemini API for Fortify.");
        return null;
    }
    const ai = new GoogleGenerativeAI(keyToUse);
    const selectedModel = ALLOWED_TEXT_MODELS.includes(modelName) ? modelName : DEFAULT_TEXT_MODEL;

    const simplifiedGameState = getSimplifiedGameStateForAI(currentGameState, factionId);
    const factionName = currentGameState.factions[factionId].name;

    const availableFortifyActions: AIActionName[] = ['MOVE_UNITS', 'HOLD_POSITION'];

    const effectiveIsStructuredOutputEnabled = isGemmaModel ? false : isStructuredOutputEnabled;

    const jsonOutputInstruction = effectiveIsStructuredOutputEnabled
    ? `Return ONLY a JSON object that strictly adheres to the following JSON schema. Do NOT deviate from this schema.
      Schema:
      {
        "type": "object",
        "properties": {
          "type": { 
            "type": "string", 
            "enum": ${JSON.stringify(availableFortifyActions)}
          },
          "params": { 
            "type": "object",
            "description": "Parameters for MOVE_UNITS: { nodeId: string, targetNodeId: string, unitsToMove: number }. For HOLD_POSITION: {}. Ensure it's a flat object.",
            "properties": {
                "nodeId": { "type": "string" },
                "targetNodeId": { "type": "string" },
                "unitsToMove": { "type": "number" }
            }
          },
          "reasoning": { "type": "string", "description": "Brief rationale for this action. MUST be a simple string." }
        },
        "required": ["type", "params", "reasoning"]
      }
      Ensure all keys and string values are enclosed in double quotes.
      Ensure the JSON is valid and complete according to this schema.
      Do NOT include any characters (other than optional whitespace) between a string element and the next comma, or between the last string element and the closing square bracket in arrays.
      Do NOT use a trailing comma after the last element in an array or object.
      `
    : `Return ONLY a JSON object in the format:
      {
      "type": "ACTION_NAME",
      "params": { /* Parameters for MOVE_UNITS: { "nodeId": "SOURCE_NODE_ID", "targetNodeId": "FRIENDLY_TARGET_NODE_ID", "unitsToMove": NUMBER }. For HOLD_POSITION: {}. Ensure it's a flat object. */ },
      "reasoning": "Brief rationale for this action. MUST be a simple string."
      }
      Ensure JSON is valid and adheres strictly to the specified format to avoid parsing errors.
      `;
    
    const prompt = `
        You are ${factionName}, an AI reinforcing your positions during the FORTIFY phase in Logisticore.
        Current Turn: ${currentGameState.turn}, Phase: FORTIFY
        Your Current OpPlan:
        - Objective: ${opPlan.objective}
        - Operation: ${opPlan.operation}
        - Tasks: ${opPlan.tasks.join(", ")}
        - Priority: ${opPlan.priority || "Not specified"}

        Your Faction Overview: ${JSON.stringify(simplifiedGameState.ownFaction, null, 2)}
        Visible Nodes: ${JSON.stringify(simplifiedGameState.visibleNodes, null, 2)}
        Game Rules & Costs: ${JSON.stringify(simplifiedGameState.gameRules, null, 2)}

        Based on your OpPlan and the current game state, choose ONE action: MOVE_UNITS or HOLD_POSITION.
        MOVE_UNITS is for repositioning units between *your already owned* nodes to better defend or prepare for future moves.
        Provide a brief reasoning for your choice. The 'reasoning' field MUST be a simple string value.

        Available Actions: ${availableFortifyActions.join(", ")}

        ${jsonOutputInstruction}

        Parameter structure examples:
        - MOVE_UNITS: { "nodeId": "SOURCE_NODE_ID", "targetNodeId": "FRIENDLY_TARGET_NODE_ID", "unitsToMove": NUMBER } (Ensure source has sufficient units, target has capacity, and both are OWNED by you.)
        - HOLD_POSITION: {} (Use this if no strategic repositioning is needed or possible.)

        IMPORTANT:
        - Target node for MOVE_UNITS must be owned by you and have capacity.
        - If OpPlan tasks for fortification are completed or impossible (e.g., target nodes full), select HOLD_POSITION.
        - The primary goal is to secure recent gains, reinforce weak points, or stage units for the next turn.
    `;

    const apiConfig: Record<string, any> = {};
    if (!isGemmaModel) {
        apiConfig.responseMimeType = "application/json";
    }

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: selectedModel,
            contents: prompt,
            config: apiConfig
        });
        
        let jsonToParse = response.text;
        if (isAggressiveSanitizationEnabled) {
            jsonToParse = aggressiveSanitizeAIJsonResponse(jsonToParse);
        } else {
            jsonToParse = minimalSanitizeAIJsonResponse(jsonToParse);
        }
        const parsedAction = JSON.parse(jsonToParse) as AIAction;

        if (parsedAction.type && availableFortifyActions.includes(parsedAction.type)) {
            if (parsedAction.type === 'MOVE_UNITS' && parsedAction.params) {
                if (typeof parsedAction.params.unitsToMove !== 'number') {
                    console.warn(`Gemini fortify MOVE_UNITS param unitsToMove type mismatch. Attempting fix or default.`);
                    (parsedAction.params as Record<string, any>).unitsToMove = Number(parsedAction.params.unitsToMove) || 0;
                }
            } else if (parsedAction.type === 'MOVE_UNITS' && !parsedAction.params) {
                 console.warn(`Gemini fortify MOVE_UNITS missing params object. Defaulting to HOLD.`);
                 parsedAction.type = 'HOLD_POSITION';
                 parsedAction.params = {};
                 parsedAction.reasoning = "Fallback: MOVE_UNITS chosen by AI but params missing. Holding position instead.";
            }
            return parsedAction;
        } else {
            console.error("Gemini fortify response missing type or invalid action type:", parsedAction);
            return { type: 'HOLD_POSITION', params: {}, reasoning: "Fallback: Invalid fortify action type from AI." };
        }

    } catch (error) {
        console.error(`Error getting AI fortify action for ${factionId}:`, error);
        return { type: 'HOLD_POSITION', params: {}, reasoning: "Fallback: Error in AI fortify action generation." };
    }
};

export const chooseDoctrineFromGemini = async (
    currentGameState: GameState,
    factionId: PlayerId,
    doctrineChoices: DoctrineDefinition[],
    modelName: string = DEFAULT_TEXT_MODEL,
    isAggressiveSanitizationEnabled: boolean = true,
    isStructuredOutputEnabled: boolean = false,
    isGemmaModel: boolean = false,
    apiKey?: string
): Promise<string | null> => {
    const keyToUse = apiKey || API_KEY;
    if (!keyToUse) {
        console.error("API_KEY not set for Gemini API for Doctrine selection.");
        return null;
    }
    const ai = new GoogleGenerativeAI(keyToUse);
    const selectedModel = ALLOWED_TEXT_MODELS.includes(modelName) ? modelName : DEFAULT_TEXT_MODEL;

    const simplifiedGameState = getSimplifiedGameStateForAI(currentGameState, factionId);
    const factionName = currentGameState.factions[factionId].name;

    const doctrineChoicesString = JSON.stringify(doctrineChoices, null, 2);

    const effectiveIsStructuredOutputEnabled = isGemmaModel ? false : isStructuredOutputEnabled;

    const jsonOutputInstruction = effectiveIsStructuredOutputEnabled
    ? `Return ONLY a JSON object that strictly adheres to the following JSON schema. Do NOT deviate from this schema.
      Schema:
      {
        "type": "object",
        "properties": {
          "chosenDoctrineId": { "type": "string", "description": "The ID of the chosen doctrine from the provided list." },
          "reasoning": { "type": "string", "description": "Brief rationale for choosing this doctrine. MUST be a simple string." }
        },
        "required": ["chosenDoctrineId", "reasoning"]
      }
      Ensure all keys and string values are enclosed in double quotes.
      Ensure the JSON is valid and complete according to this schema.
      Do NOT include any characters (other than optional whitespace) between a string element and the next comma, or between the last string element and the closing square bracket in arrays.
      Do NOT use a trailing comma after the last element in an array or object.
      `
    : `Return ONLY a JSON object in the format:
      {
      "chosenDoctrineId": "ID_OF_CHOSEN_DOCTRINE",
      "reasoning": "Brief rationale for choosing this doctrine. MUST be a simple string."
      }
      Ensure JSON is valid and adheres strictly to the specified format to avoid parsing errors.
      `;

    const prompt = `
        You are ${factionName}, an AI making a critical strategic decision in Logisticore.
        Current Turn: ${currentGameState.turn}, Phase: DOCTRINE
        Your Faction Overview: ${JSON.stringify(simplifiedGameState.ownFaction, null, 2)}
        Visible Nodes: ${JSON.stringify(simplifiedGameState.visibleNodes, null, 2)}
        Game Rules & Costs: ${JSON.stringify(simplifiedGameState.gameRules, null, 2)}

        You have been presented with the following doctrine choices. Each doctrine has a buff and a nerf.
        Carefully consider your current game state, your faction's strengths and weaknesses, and your overall strategic goals (e.g., economic dominance, military expansion, defensive posture, intelligence superiority).

        Doctrine Choices:
        [
            ${JSON.stringify(doctrineChoices, null, 2)}
        ]

        Choose ONE doctrine from the list above that best aligns with your current strategic needs.
        Provide a brief reasoning for your choice. The 'reasoning' field MUST be a simple string value.

        ${jsonOutputInstruction}

        IMPORTANT:
        - You MUST choose one of the provided doctrine IDs.
        - Your choice should be a strategic decision, not random.
    `;

    const apiConfig: Record<string, any> = {};
    if (!isGemmaModel) {
        apiConfig.responseMimeType = "application/json";
    }

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: selectedModel,
            contents: prompt,
            config: apiConfig
        });
        
        let jsonToParse = response.text;
        if (isAggressiveSanitizationEnabled) {
            jsonToParse = aggressiveSanitizeAIJsonResponse(jsonToParse);
        } else {
            jsonToParse = minimalSanitizeAIJsonResponse(jsonToParse);
        }
        const parsedChoice = JSON.parse(jsonToParse);

        if (parsedChoice.chosenDoctrineId && doctrineChoices.some(d => d.id === parsedChoice.chosenDoctrineId)) {
            return parsedChoice.chosenDoctrineId;
        } else {
            console.error("Gemini response missing chosenDoctrineId or invalid doctrine ID:", parsedChoice);
            return doctrineChoices[0]?.id || null; // Fallback to the first doctrine or null
        }

    } catch (error) {
        console.error(`Error choosing doctrine for ${factionId}:`, error);
        return doctrineChoices[0]?.id || null; // Fallback to the first doctrine or null
    }
};

