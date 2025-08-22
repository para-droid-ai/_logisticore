import { GameState, PlayerId, OpPlan, CommLogEntry, GameSettings, OpPlanHistoryEntry, SystemLogEntry, NodeActivityEntry, NodeData, GamePhase, BattleReportData, BattleRoundDetail } from '../types';
import { generateOpPlanFromGemini, generateStrategicCommunique, getAIActionFromGemini, chooseDoctrineFromGemini } from '../services/geminiService';
import { AI1_ID, AI2_ID, COMMAND_CONSOLE_ID, FACTION_COLORS, SABOTAGE_IH_OUTPUT_REDUCTION_FACTOR, QR_PER_CONNECTED_NODE_IN_LARGEST_NETWORK, UNITS_REINFORCED_PER_NODE, NEUTRAL_ID, DEPLOYMENT_MAX_UNITS_PER_TURN, ATTRITION_COST_STANDARD_UNIT_MAT, FORT_HP_PER_LEVEL, FORT_REPAIR_MAT_COST_PER_HP, MAX_FORTIFICATION_LEVEL, FORT_UPGRADE_LEVEL_MAT_COST, ATTRITION_COST_ARTILLERY_QR, ATTRITION_COST_ARTILLERY_MAT_CREATION, MAX_ARTILLERY_PER_NODE, ATTRITION_COST_ARTILLERY_MOVE_MAT_PER_PIECE, ATTRITION_AMMO_COST_ARTILLERY_STRIKE, ARTILLERY_STRIKE_DAMAGE_PER_GUN, ARTILLERY_STRIKE_FORT_HP_DAMAGE_PER_GUN, RECON_ARRAY_ACTIVATION_COST_QR, RECON_ARRAY_ACTIVATION_COST_MAT, RECON_PULSE_COST_QR, RECON_PULSE_COST_MAT, ATTRITION_COST_INFILTRATOR_MAT, MAX_INFILTRATORS_PER_NODE_FROM_ONE_FACTION, SABOTAGE_BASE_SUCCESS_CHANCE, MAX_ALARM_LEVEL, SABOTAGE_MAT_DRAIN_AMOUNT, SABOTAGE_INTERDICTION_TURNS, SABOTAGE_FORT_DESTRUCTION_CHANCE, SABOTAGE_DETECTION_CHANCE_ON_FAILURE, FORTIFICATION_DEFENSE_BONUS_PER_LEVEL, BATTLE_FORT_HP_DAMAGE_PER_ROUND, VETERAN_TRAINING_NODE_TYPE, VETERAN_TRAINING_MAT_COST, VETERAN_TRAINING_TIME_TURNS, VETERAN_COMBAT_BONUS, BATTLE_PROMOTION_RATIO, DOCTRINE_PHASE_INTERVAL, DOCTRINE_STANDARD_START_TURN } from '../../constants';
import { isNodeConnectedToFactionCN, isNodeVisibleForAI } from './utils';
import { calculateFactionStats } from './game';
import { applyDoctrineEffects } from './doctrines';

export const handleFluctuationPhase = async (gameState: GameState, gameSettings: GameSettings, addLogEntry: any, setGameState: any, activeSidebarTab: any, setHasNewSCSMessage: any, isGemmaModelActive: boolean): Promise<GameState> => {
    addLogEntry(`Starting FLUCTUATION phase for Turn ${gameState.turn}.`, 'PHASE_TRANSITION', undefined, 'FLUCTUATION');
    let newGameState = { ...gameState, gameMessage: "AI generating OpPlans & Comms..." };

    let newCommLogEntries: CommLogEntry[] = [];

    const getOpponentLastMessage = (factionId: PlayerId, currentCommLog: CommLogEntry[]): CommLogEntry | null => {
        const opponentId = factionId === AI1_ID ? AI2_ID : AI1_ID;
        for (let i = currentCommLog.length - 1; i >= 0; i--) {
            if (currentCommLog[i].senderId === opponentId) return currentCommLog[i];
        }
        return null;
    };

    const getLatestHumanDirectiveFor = (factionId: PlayerId | 'BROADCAST', currentCommLog: CommLogEntry[]): CommLogEntry | null => {
        for (let i = currentCommLog.length - 1; i >= 0; i--) {
            const entry = currentCommLog[i];
            if (entry.senderId === COMMAND_CONSOLE_ID && (entry.targetFactionId === factionId || entry.targetFactionId === 'BROADCAST')) return entry;
        }
        return null;
    };
    
    const newOpPlans: Partial<Record<PlayerId, OpPlan>> = {};
    for (const factionId of [AI2_ID, AI1_ID] as PlayerId[]) {
        const freshGameStateForAI = newGameState;
        const opponentLastSCSMessage = getOpponentLastMessage(factionId, freshGameStateForAI.commLog);
        const relevantHumanDirectiveForOpPlan = getLatestHumanDirectiveFor(factionId, freshGameStateForAI.commLog);

        const plan = await generateOpPlanFromGemini(
            freshGameStateForAI, factionId, gameSettings.selectedGenAIModel, 
            opponentLastSCSMessage, relevantHumanDirectiveForOpPlan, 
            gameSettings.isAggressiveSanitizationEnabled,
            gameSettings.isStructuredOutputEnabled,
            isGemmaModelActive,
            gameSettings.apiKey
        );
        
        if (plan) {
            newOpPlans[factionId] = plan;
            addLogEntry(`OpPlan for ${freshGameStateForAI.factions[factionId].name}: ${plan.objective}`, 'AI_COT', factionId, 'FLUCTUATION');
        } else {
            addLogEntry(`Failed to generate OpPlan for ${freshGameStateForAI.factions[factionId].name}. Using fallback.`, 'ERROR', factionId, 'FLUCTUATION');
        }
    }
    
    const updatedFactions = { ...newGameState.factions };
    const updatedOpPlanHistory = { ...newGameState.opPlanHistory };
    let newLastTurnActivity = newGameState.lastTurnNodeActivity;
    if (newGameState.turn > 1 && newGameState.currentPhase === 'FLUCTUATION') newLastTurnActivity = [];
    ([AI2_ID, AI1_ID] as PlayerId[]).forEach(id => {
        if (newOpPlans[id]) {
            const currentPlan = updatedFactions[id].currentOpPlan;
            if(currentPlan) updatedOpPlanHistory[id] = [currentPlan as OpPlanHistoryEntry, ...updatedOpPlanHistory[id]].slice(0,10);
            updatedFactions[id] = { ...updatedFactions[id], currentOpPlan: newOpPlans[id]! };
        }
    });
    newGameState = { ...newGameState, factions: updatedFactions, opPlanHistory: updatedOpPlanHistory, lastTurnNodeActivity: newLastTurnActivity };

    const axiomGameStateSnapshot = newGameState;
    const axiomOpponentLastMsg = getOpponentLastMessage(AI2_ID, axiomGameStateSnapshot.commLog);
    const axiomHumanDirective = getLatestHumanDirectiveFor(AI2_ID, axiomGameStateSnapshot.commLog);
    const axiomCommuniqueText = await generateStrategicCommunique(axiomGameStateSnapshot, AI2_ID, gameSettings.selectedGenAIModel, axiomOpponentLastMsg, axiomHumanDirective?.message || null, gameSettings.apiKey);
    if (axiomCommuniqueText) {
        const axiomCommEntry: CommLogEntry = {
            id: `scs-${Date.now()}-axiom-${Math.random()}`, turn: axiomGameStateSnapshot.turn, timestamp: new Date().toLocaleTimeString(),
            senderId: AI2_ID, senderName: axiomGameStateSnapshot.factions[AI2_ID].name, message: axiomCommuniqueText, colorClass: FACTION_COLORS[AI2_ID]?.primary
        };
        newCommLogEntries.push(axiomCommEntry);
        addLogEntry(`SCS [AXIOM]: ${axiomCommuniqueText}`, 'SCS', AI2_ID, 'FLUCTUATION');
        if (activeSidebarTab !== 'SCS_LOG') setHasNewSCSMessage(true);
    }
    
    const gemqGameStateSnapshot = {...newGameState, commLog: [...newGameState.commLog, ...newCommLogEntries]};
    const gemqOpponentLastMsg = getOpponentLastMessage(AI1_ID, gemqGameStateSnapshot.commLog);
    const gemqHumanDirective = getLatestHumanDirectiveFor(AI1_ID, gemqGameStateSnapshot.commLog);
    const gemqCommuniqueText = await generateStrategicCommunique(gemqGameStateSnapshot, AI1_ID, gameSettings.selectedGenAIModel, gemqOpponentLastMsg, gemqHumanDirective?.message || null, gameSettings.apiKey);

    if (gemqCommuniqueText) {
        const gemqCommEntry: CommLogEntry = {
            id: `scs-${Date.now()}-gemq-${Math.random()}`, turn: gemqGameStateSnapshot.turn, timestamp: new Date().toLocaleTimeString(),
            senderId: AI1_ID, senderName: gemqGameStateSnapshot.factions[AI1_ID].name, message: gemqCommuniqueText, colorClass: FACTION_COLORS[AI1_ID]?.primary
        };
        newCommLogEntries.push(gemqCommEntry);
        addLogEntry(`SCS [GEM-Q]: ${gemqCommuniqueText}`, 'SCS', AI1_ID, 'FLUCTUATION');
        if (activeSidebarTab !== 'SCS_LOG') setHasNewSCSMessage(true);
    }

    return {
        ...newGameState,
        commLog: [...newGameState.commLog, ...newCommLogEntries].slice(-50),
        currentPhase: 'RESOURCE',
        currentPhaseTime: 0,
        gameMessage: null,
    };
};

export const handleManeuverPhase = async (factionId: PlayerId, gameState: GameState, gameSettings: GameSettings, addLogEntry: any, setGameState: any, activeSidebarTab: any, setHasNewSCSMessage: any, isGemmaModelActive: boolean, zoomToCoordinates: any, autoResetViewTimer: any, handleResetView: any, setAutoResetViewTimer: any, addNodeActivityEntry: any) => {
    const initialGameState = gameState;
    addLogEntry(`Starting MANEUVER phase for ${initialGameState.factions[factionId].name}.`, 'PHASE_TRANSITION', factionId, `MANEUVER_${factionId}` as GamePhase);
    setGameState(prev => ({ ...prev, gameMessage: `AI ${initialGameState.factions[factionId].name} is planning maneuvers...` }));

    const currentOpPlan = initialGameState.factions[factionId].currentOpPlan;
    if (!currentOpPlan) {
      addLogEntry(`No OpPlan for ${initialGameState.factions[factionId].name}. Holding position.`, 'ERROR', factionId, `MANEUVER_${factionId}` as GamePhase);
      setGameState(prev => ({
        ...prev,
        currentPhase: factionId === AI2_ID ? 'MANEUVER_GEMQ' : 'COMBAT',
        activePlayerForManeuver: factionId === AI2_ID ? AI1_ID : null,
        currentPhaseTime: 0,
        gameMessage: null,
      }));
      return;
    }

    const aiAction = await getAIActionFromGemini(
        initialGameState, factionId, currentOpPlan, 
        gameSettings.selectedGenAIModel, 
        gameSettings.isAggressiveSanitizationEnabled,
        gameSettings.isStructuredOutputEnabled,
        isGemmaModelActive,
        gameSettings.apiKey
    );

    if (aiAction) {
      addLogEntry(`${initialGameState.factions[factionId].name} action: ${aiAction.type}. ${aiAction.reasoning || ''}`, 'AI_ACTION', factionId, `MANEUVER_${factionId}` as GamePhase);

      setGameState(prev => {
        let newNodes = { ...prev.mapNodes };
        let newFactions = { ...prev.factions };
        let message = "";
        let eventLogs: SystemLogEntry[] = [];
        let nodeActivityLogsInternal: NodeActivityEntry[] = [];


        const { type, params } = aiAction;
        const actingFaction = newFactions[factionId];

        switch (type) {
          case 'DEPLOY_UNITS':
            if (params.nodeId && params.unitsToDeploy && params.unitsToDeploy > 0) {
              const cnNode = newNodes[params.nodeId];
              if (cnNode && cnNode.owner === factionId && cnNode.isCN) {
                 const unitsToDeploy = Math.min(params.unitsToDeploy, DEPLOYMENT_MAX_UNITS_PER_TURN, Math.floor(actingFaction.MAT / ATTRITION_COST_STANDARD_UNIT_MAT));
                 if (unitsToDeploy > 0 && (cnNode.standardUnits + unitsToDeploy <= cnNode.maxUnits) ) {
                    newNodes[params.nodeId] = { ...cnNode, standardUnits: cnNode.standardUnits + unitsToDeploy };
                    newFactions[factionId] = {
                        ...actingFaction,
                        totalUnits: actingFaction.totalUnits + unitsToDeploy,
                        totalUnitsDeployed: actingFaction.totalUnitsDeployed + unitsToDeploy,
                        MAT: actingFaction.MAT - (unitsToDeploy * ATTRITION_COST_STANDARD_UNIT_MAT),
                        totalMATConsumed: actingFaction.totalMATConsumed + (unitsToDeploy * ATTRITION_COST_STANDARD_UNIT_MAT),
                        totalMATSpentOnUnitDeployment: actingFaction.totalMATSpentOnUnitDeployment + (unitsToDeploy * ATTRITION_COST_STANDARD_UNIT_MAT),
                        currentTurnUnitsDeployed: actingFaction.currentTurnUnitsDeployed + unitsToDeploy,
                    };
                    message = `${actingFaction.name} deployed ${unitsToDeploy} units at ${cnNode.label}.`;
                    nodeActivityLogsInternal.push({ id:`na-${Date.now()}`, turn:prev.turn, nodeId: cnNode.id, nodeLabel: cnNode.label, message: `${unitsToDeploy} units deployed.`, type: 'UNIT_DEPLOY', factionId});
                 } else { message = `${actingFaction.name} failed to deploy units at ${cnNode.label} (max units, no MAT, or invalid count).`;}
              } else { message = `${actingFaction.name} failed to deploy: Invalid CN node.`;}
            } else { message = `${actingFaction.name} failed to deploy: Missing parameters.`;}
            break;

          case 'MOVE_UNITS':
          case 'REINFORCE_NODE':
            if (params.nodeId && params.targetNodeId && params.unitsToMove && params.unitsToMove > 0) {
              const sourceNode = newNodes[params.nodeId];
              const targetNode = newNodes[params.targetNodeId];
              if (sourceNode && targetNode && sourceNode.owner === factionId && sourceNode.standardUnits >= params.unitsToMove) {
                if (type === 'REINFORCE_NODE' && targetNode.owner !== factionId) {
                  message = `${actingFaction.name} failed to reinforce: ${targetNode.label} is not friendly. Holding.`;
                  break;
                }
                 if (targetNode.owner === factionId && (targetNode.standardUnits + params.unitsToMove > targetNode.maxUnits)) {
                  message = `${actingFaction.name} failed to move to ${targetNode.label}: Target node at max capacity. Holding.`;
                  break;
                }

                newNodes[params.nodeId] = { ...sourceNode, standardUnits: sourceNode.standardUnits - params.unitsToMove };
                if (targetNode.owner === factionId) {
                    newNodes[params.targetNodeId] = { ...targetNode, standardUnits: targetNode.standardUnits + params.unitsToMove };
                } else {
                     if (!newNodes[params.targetNodeId].pendingAttackers) newNodes[params.targetNodeId].pendingAttackers = {};
                     newNodes[params.targetNodeId].pendingAttackers![factionId] = {
                        units: (newNodes[params.targetNodeId].pendingAttackers![factionId]?.units || 0) + params.unitsToMove,
                        fromNodeId: params.nodeId
                     };
                }
                message = `${actingFaction.name} moved ${params.unitsToMove} units from ${sourceNode.label} to ${targetNode.label}.`;
              } else { message = `${actingFaction.name} failed to move units: Invalid source/target or insufficient units.`;}
            } else { message = `${actingFaction.name} failed to move units: Missing parameters.`;}
            break;

          case 'ATTACK_NODE':
            if (params.nodeId && params.targetNodeId && params.unitsToMove && params.unitsToMove > 0) {
              const sourceNode = newNodes[params.nodeId];
              const targetNode = newNodes[params.targetNodeId];
              if (sourceNode && targetNode && sourceNode.owner === factionId && sourceNode.standardUnits >= params.unitsToMove && targetNode.owner !== factionId) {
                newNodes[params.nodeId] = { ...sourceNode, standardUnits: sourceNode.standardUnits - params.unitsToMove };
                if (!newNodes[params.targetNodeId].pendingAttackers) newNodes[params.targetNodeId].pendingAttackers = {};

                newNodes[params.targetNodeId].pendingAttackers![factionId] = {
                    units: (newNodes[params.targetNodeId].pendingAttackers![factionId]?.units || 0) + params.unitsToMove,
                    fromNodeId: params.nodeId
                };
                message = `${actingFaction.name} staged ${params.unitsToMove} units from ${sourceNode.label} to attack ${targetNode.label}.`;
              } else { message = `${actingFaction.name} failed to stage attack: Invalid source/target, insufficient units, or target is friendly.`;}
            } else { message = `${actingFaction.name} failed to stage attack: Missing parameters.`;}
            break;

          case 'BUILD_FORTIFICATIONS':
            if (params.nodeId) {
                const nodeToFortify = newNodes[params.nodeId];
                if (nodeToFortify && nodeToFortify.owner === factionId) {
                    const currentFortHP = nodeToFortify.fortificationHP || 0;
                    const currentFortLevel = nodeToFortify.fortificationLevel || 0;
                    const maxFortHPForCurrentLevel = currentFortLevel * FORT_HP_PER_LEVEL;


                    if (currentFortLevel > 0 && currentFortHP < maxFortHPForCurrentLevel) { // REPAIR
                        const hpToRepair = maxFortHPForCurrentLevel - currentFortHP;
                        const matCostForFullRepair = hpToRepair * FORT_REPAIR_MAT_COST_PER_HP;

                        if (actingFaction.MAT >= matCostForFullRepair) {
                            newNodes[params.nodeId] = { ...nodeToFortify, fortificationHP: maxFortHPForCurrentLevel };
                            newFactions[factionId] = { 
                                ...actingFaction, 
                                MAT: actingFaction.MAT - matCostForFullRepair, 
                                totalMATConsumed: actingFaction.totalMATConsumed + matCostForFullRepair,
                                matSpentOnFortRepair: actingFaction.matSpentOnFortRepair + matCostForFullRepair
                            };
                            message = `${actingFaction.name} fully repaired fortifications at ${nodeToFortify.label} to ${maxFortHPForCurrentLevel} HP.`;
                            nodeActivityLogsInternal.push({ id:`na-${Date.now()}`, turn:prev.turn, nodeId: nodeToFortify.id, nodeLabel: nodeToFortify.label, message: `Fortifications fully repaired to ${maxFortHPForCurrentLevel} HP.`, type: 'FORT_REPAIR', factionId});
                        } else {
                            const repairableHP = Math.floor(actingFaction.MAT / FORT_REPAIR_MAT_COST_PER_HP);
                            if (repairableHP > 0) {
                                const actualMatCost = repairableHP * FORT_REPAIR_MAT_COST_PER_HP;
                                newNodes[params.nodeId] = { ...nodeToFortify, fortificationHP: Math.min(maxFortHPForCurrentLevel, currentFortHP + repairableHP) };
                                newFactions[factionId] = { 
                                    ...actingFaction, 
                                    MAT: actingFaction.MAT - actualMatCost, 
                                    totalMATConsumed: actingFaction.totalMATConsumed + actualMatCost,
                                    matSpentOnFortRepair: actingFaction.matSpentOnFortRepair + actualMatCost
                                };
                                message = `${actingFaction.name} partially repaired fortifications at ${nodeToFortify.label} by ${repairableHP} HP.`;
                                nodeActivityLogsInternal.push({ id:`na-${Date.now()}`, turn:prev.turn, nodeId: nodeToFortify.id, nodeLabel: nodeToFortify.label, message: `Fortifications partially repaired by ${repairableHP} HP.`, type: 'FORT_REPAIR', factionId});
                            } else {
                                message = `${actingFaction.name} failed to repair fortifications at ${nodeToFortify.label}: Insufficient MAT for any repair.`;
                            }
                        }
                    } else if (currentFortLevel < MAX_FORTIFICATION_LEVEL && (currentFortHP === maxFortHPForCurrentLevel || currentFortLevel === 0)) { // UPGRADE
                        if (actingFaction.MAT >= FORT_UPGRADE_LEVEL_MAT_COST) {
                            const newLevel = currentFortLevel + 1;
                            const newMaxHP = newLevel * FORT_HP_PER_LEVEL;
                            newNodes[params.nodeId] = {
                                ...nodeToFortify,
                                fortificationLevel: newLevel,
                                fortificationHP: newMaxHP,
                                maxFortificationHP: newMaxHP
                            };
                            newFactions[factionId] = {
                                ...actingFaction,
                                MAT: actingFaction.MAT - FORT_UPGRADE_LEVEL_MAT_COST,
                                totalMATConsumed: actingFaction.totalMATConsumed + FORT_UPGRADE_LEVEL_MAT_COST,
                                totalMATSpentOnFortifications: actingFaction.totalMATSpentOnFortifications + FORT_UPGRADE_LEVEL_MAT_COST,
                                totalFortifiedNodes: currentFortLevel === 0 ? actingFaction.totalFortifiedNodes + 1 : actingFaction.totalFortifiedNodes
                            };
                            message = `${actingFaction.name} upgraded fortifications at ${nodeToFortify.label} to level ${newLevel}.`;
                            nodeActivityLogsInternal.push({ id:`na-${Date.now()}`, turn:prev.turn, nodeId: nodeToFortify.id, nodeLabel: nodeToFortify.label, message: `Fortifications upgraded to level ${newLevel}.`, type: 'FORTIFY', factionId});
                        } else {
                            message = `${actingFaction.name} failed to upgrade fortifications at ${nodeToFortify.label}: Insufficient MAT.`;
                        }
                    } else if (currentFortLevel >= MAX_FORTIFICATION_LEVEL && currentFortHP === maxFortHPForCurrentLevel) {
                        message = `${actingFaction.name} failed to act on fortifications at ${nodeToFortify.label}: Already at max level and full HP.`;
                    } else {
                         message = `${actingFaction.name} fortification action at ${nodeToFortify.label} had no effect (likely needs repair first or already max level).`;
                    }
                } else { message = `${actingFaction.name} failed to act on fortifications: Invalid node or not owner.`; }
            } else { message = `${actingFaction.name} failed to act on fortifications: Missing parameters.`; }
            break;

          case 'PURCHASE_ARTILLERY':
            if (params.nodeId && params.quantity && params.quantity > 0) {
                const purchaseNode = newNodes[params.nodeId];
                if (purchaseNode && purchaseNode.owner === factionId && (purchaseNode.nodeType === 'INDUSTRIAL_HUB' || purchaseNode.nodeType === 'FORTRESS')) {
                    const qrCost = params.quantity * ATTRITION_COST_ARTILLERY_QR;
                    const matCost = params.quantity * ATTRITION_COST_ARTILLERY_MAT_CREATION;
                    const currentArty = purchaseNode.artilleryGarrison || 0;
                    if (actingFaction.qr >= qrCost && actingFaction.MAT >= matCost && (currentArty + params.quantity <= MAX_ARTILLERY_PER_NODE)) {
                        newNodes[params.nodeId] = { ...purchaseNode, artilleryGarrison: currentArty + params.quantity };
                        newFactions[factionId] = {
                            ...actingFaction,
                            qr: actingFaction.qr - qrCost,
                            MAT: actingFaction.MAT - matCost,
                            totalArtillery: actingFaction.totalArtillery + params.quantity,
                            totalMATConsumed: actingFaction.totalMATConsumed + matCost,
                        };
                        message = `${actingFaction.name} purchased ${params.quantity} artillery at ${purchaseNode.label}.`;
                        nodeActivityLogsInternal.push({ id:`na-${Date.now()}`, turn:prev.turn, nodeId: purchaseNode.id, nodeLabel: purchaseNode.label, message: `${params.quantity} artillery purchased.`, type: 'ARTILLERY_PURCHASE', factionId});
                    } else { message = `${actingFaction.name} failed to purchase artillery at ${purchaseNode.label}: Insufficient QR/MAT, node type invalid, or max artillery reached.`; }
                } else { message = `${actingFaction.name} failed to purchase artillery: Invalid node or node type.`; }
            } else { message = `${actingFaction.name} failed to purchase artillery: Missing parameters.`; }
            break;

          case 'MOVE_ARTILLERY':
            if (params.nodeId && params.targetNodeId && params.artilleryToMove && params.artilleryToMove > 0) {
                const sourceNode = newNodes[params.nodeId];
                const targetNode = newNodes[params.targetNodeId];
                const moveCost = params.artilleryToMove * ATTRITION_COST_ARTILLERY_MOVE_MAT_PER_PIECE;
                if (sourceNode && targetNode && sourceNode.owner === factionId && targetNode.owner === factionId &&
                    (sourceNode.artilleryGarrison || 0) >= params.artilleryToMove &&
                    ((targetNode.artilleryGarrison || 0) + params.artilleryToMove <= MAX_ARTILLERY_PER_NODE) &&
                    actingFaction.MAT >= moveCost) {

                    newNodes[params.nodeId] = { ...sourceNode, artilleryGarrison: (sourceNode.artilleryGarrison || 0) - params.artilleryToMove };
                    newNodes[params.targetNodeId] = { ...targetNode, artilleryGarrison: (targetNode.artilleryGarrison || 0) + params.artilleryToMove };
                    newFactions[factionId] = { ...actingFaction, MAT: actingFaction.MAT - moveCost, totalMATConsumed: actingFaction.totalMATConsumed + moveCost };
                    message = `${actingFaction.name} moved ${params.artilleryToMove} artillery from ${sourceNode.label} to ${targetNode.label}.`;
                } else { message = `${actingFaction.name} failed to move artillery: Invalid nodes, insufficient artillery/MAT, or target full.`; }
            } else { message = `${actingFaction.name} failed to move artillery: Missing parameters.`; }
            break;

          case 'ARTILLERY_STRIKE':
            if (params.nodeId && params.targetNodeId && params.artilleryToFire && params.artilleryToFire > 0) {
                const sourceNode = newNodes[params.nodeId];
                const targetNode = newNodes[params.targetNodeId];
                if (sourceNode && targetNode && sourceNode.owner === factionId && (sourceNode.artilleryGarrison || 0) >= params.artilleryToFire) {
                    const ammoCost = params.artilleryToFire * ATTRITION_AMMO_COST_ARTILLERY_STRIKE;
                    if (actingFaction.MAT >= ammoCost) {
                        newFactions[factionId] = { 
                            ...actingFaction, 
                            MAT: actingFaction.MAT - ammoCost, 
                            totalMATConsumed: actingFaction.totalMATConsumed + ammoCost,
                            matSpentOnArtilleryAmmo: actingFaction.matSpentOnArtilleryAmmo + ammoCost
                        };

                        let unitDamageDealt = params.artilleryToFire * ARTILLERY_STRIKE_DAMAGE_PER_GUN;
                        unitDamageDealt = Math.max(0, Math.floor(unitDamageDealt));
                        const actualUnitLosses = Math.min(targetNode.standardUnits, unitDamageDealt);
                        newNodes[params.targetNodeId] = { ...targetNode, standardUnits: targetNode.standardUnits - actualUnitLosses };
                        if (targetNode.owner !== factionId && targetNode.owner !== NEUTRAL_ID) { 
                            newFactions[factionId].artilleryKills += actualUnitLosses; 
                        }

                        let fortHPDamage = 0;
                        if ((newNodes[params.targetNodeId].fortificationHP || 0) > 0) {
                            fortHPDamage = params.artilleryToFire * ARTILLERY_STRIKE_FORT_HP_DAMAGE_PER_GUN;
                            fortHPDamage = Math.max(0, Math.floor(fortHPDamage));
                            const currentFortHP = newNodes[params.targetNodeId].fortificationHP || 0;
                            newNodes[params.targetNodeId].fortificationHP = Math.max(0, currentFortHP - fortHPDamage);

                            if (fortHPDamage > 0) {
                                eventLogs.push({ id: `log-${Date.now()}-artystrikefort-${Math.random()}`, timestamp: new Date().toLocaleTimeString(), turn: prev.turn, phase: `MANEUVER_${factionId}` as GamePhase, message: `Fortifications at ${targetNode.label} took ${fortHPDamage} HP damage.`, type: 'FORTIFICATION', source: factionId});
                                nodeActivityLogsInternal.push({ id:`na-${Date.now()}-artystrikefort`, turn:prev.turn, nodeId: targetNode.id, nodeLabel: targetNode.label, message: `Fortifications took ${fortHPDamage} HP damage from artillery.`, type: 'FORT_DAMAGE', factionId: targetNode.owner });
                            }
                        }

                        if (targetNode.owner !== NEUTRAL_ID && newFactions[targetNode.owner]) {
                            newFactions[targetNode.owner] = {
                                ...newFactions[targetNode.owner],
                                totalUnits: newFactions[targetNode.owner].totalUnits - actualUnitLosses,
                                totalUnitsLost: newFactions[targetNode.owner].totalUnitsLost + actualUnitLosses,
                                currentTurnUnitsLost: newFactions[targetNode.owner].currentTurnUnitsLost + actualUnitLosses,
                            };
                        }
                        message = `${actingFaction.name} struck ${targetNode.label} with ${params.artilleryToFire} artillery from ${sourceNode.label}, inflicting ${actualUnitLosses} unit casualties${fortHPDamage > 0 ? ` and ${fortHPDamage} Fort HP damage` : ''}.`;
                        eventLogs.push({id: `log-${Date.now()}-artystrike-${Math.random()}`, timestamp: new Date().toLocaleTimeString(),turn: prev.turn,phase: `MANEUVER_${factionId}` as GamePhase, message, type: 'ARTILLERY', source: factionId});
                        nodeActivityLogsInternal.push({ id:`na-${Date.now()}-artystrike`, turn:prev.turn, nodeId: targetNode.id, nodeLabel: targetNode.label, message: `Hit by artillery from ${sourceNode.label}, ${actualUnitLosses} casualties${fortHPDamage > 0 ? `, ${fortHPDamage} Fort HP damage` : ''}.`, type: 'ARTILLERY_STRIKE', factionId: targetNode.owner});

                    } else { message = `${actingFaction.name} failed artillery strike: Insufficient MAT for ammo.`; }
                } else { message = `${actingFaction.name} failed artillery strike: Invalid source/target or insufficient artillery.`; }
            } else { message = `${actingFaction.name} failed artillery strike: Missing parameters.`; }
            break;

          case 'ACTIVATE_RECON_ARRAY':
            if (params.nodeId) {
                const reconNode = newNodes[params.nodeId];
                if (reconNode && reconNode.nodeType === 'RECON_ARRAY' && reconNode.owner === factionId) {
                    if (!actingFaction.activatedReconNodeIds.includes(params.nodeId)) {
                        if (isNodeConnectedToFactionCN(params.nodeId, factionId, newNodes, newFactions)) {
                            if (actingFaction.qr >= RECON_ARRAY_ACTIVATION_COST_QR && actingFaction.MAT >= RECON_ARRAY_ACTIVATION_COST_MAT) {
                                newFactions[factionId] = {
                                    ...actingFaction,
                                    qr: actingFaction.qr - RECON_ARRAY_ACTIVATION_COST_QR,
                                    MAT: actingFaction.MAT - RECON_ARRAY_ACTIVATION_COST_MAT,
                                    totalMATConsumed: actingFaction.totalMATConsumed + RECON_ARRAY_ACTIVATION_COST_MAT,
                                    activatedReconNodeIds: [...actingFaction.activatedReconNodeIds, params.nodeId],
                                    qrSpentOnRecon: actingFaction.qrSpentOnRecon + RECON_ARRAY_ACTIVATION_COST_QR,
                                    matSpentOnRecon: actingFaction.matSpentOnRecon + RECON_ARRAY_ACTIVATION_COST_MAT,
                                };
                                const isNowCapable = newFactions[factionId].activatedReconNodeIds.some(id => isNodeConnectedToFactionCN(id, factionId, newNodes, newFactions));
                                if (newFactions[factionId].isReconSystemActive !== isNowCapable) {
                                     newFactions[factionId].isReconSystemActive = isNowCapable;
                                     message = `${actingFaction.name} activated Recon Array ${reconNode.label}. Recon Capability is now ${isNowCapable ? 'READY' : 'OFFLINE'}.`;
                                     nodeActivityLogsInternal.push({ id:`na-${Date.now()}`, turn:prev.turn, nodeId: reconNode.id, nodeLabel: reconNode.label, message: `Recon Array activated. Capability: ${isNowCapable ? 'READY' : 'OFFLINE'}`, type: 'RECON_ARRAY_ACTIVATED', factionId});
                                } else {
                                     message = `${actingFaction.name} activated Recon Array ${reconNode.label}.`;
                                     nodeActivityLogsInternal.push({ id:`na-${Date.now()}`, turn:prev.turn, nodeId: reconNode.id, nodeLabel: reconNode.label, message: `Recon Array activated.`, type: 'RECON_ARRAY_ACTIVATED', factionId});
                                }
                            } else { message = `${actingFaction.name} failed to activate ${reconNode.label}: Insufficient QR/MAT.`; }
                        } else { message = `${actingFaction.name} failed to activate ${reconNode.label}: Not connected to Command Node network.`;}
                    } else { message = `${actingFaction.name} tried to activate ${reconNode.label}, but it was already activated.`;}
                } else { message = `${actingFaction.name} failed to activate Recon Array: Invalid or not owned RECON_ARRAY node.`;}
            } else { message = `${actingFaction.name} failed to activate Recon Array: Missing node ID.`; }
            break;

          case 'PERFORM_RECON_PULSE':
            if (params.nodeId) {
                const pulseNode = newNodes[params.nodeId];
                if (pulseNode && pulseNode.nodeType === 'RECON_ARRAY' && pulseNode.owner === factionId &&
                    actingFaction.activatedReconNodeIds.includes(params.nodeId) &&
                    isNodeConnectedToFactionCN(params.nodeId, factionId, newNodes, newFactions)) {

                    if (actingFaction.qr >= RECON_PULSE_COST_QR && actingFaction.MAT >= RECON_PULSE_COST_MAT) {
                        newFactions[factionId] = {
                            ...actingFaction,
                            qr: actingFaction.qr - RECON_PULSE_COST_QR,
                            MAT: actingFaction.MAT - RECON_PULSE_COST_MAT,
                            totalMATConsumed: actingFaction.totalMATConsumed + RECON_PULSE_COST_MAT,
                            hasActiveReconPulseThisTurn: true,
                            pulsesPerformedCount: actingFaction.pulsesPerformedCount + 1,
                            qrSpentOnRecon: actingFaction.qrSpentOnRecon + RECON_PULSE_COST_QR,
                            matSpentOnRecon: actingFaction.matSpentOnRecon + RECON_PULSE_COST_MAT,
                        };
                        message = `${actingFaction.name} performed a Recon Pulse from ${pulseNode.label}. Full map intel acquired for this turn.`;
                        nodeActivityLogsInternal.push({ id:`na-${Date.now()}`, turn:prev.turn, nodeId: pulseNode.id, nodeLabel: pulseNode.label, message: `Recon Pulse performed.`, type: 'RECON_PULSE_ACTIVATED', factionId});
                        eventLogs.push({id: `log-${Date.now()}-reconpulse-${Math.random()}`, timestamp: new Date().toLocaleTimeString(),turn: prev.turn,phase: `MANEUVER_${factionId}` as GamePhase, message, type: 'RECON', source: factionId});

                    } else { message = `${actingFaction.name} failed to perform Recon Pulse from ${pulseNode.label}: Insufficient QR/MAT.`; }
                } else { message = `${actingFaction.name} failed to perform Recon Pulse: Invalid, unactivated, disconnected, or not owned RECON_ARRAY node.`; }
            } else { message = `${actingFaction.name} failed to perform Recon Pulse: Missing RECON_ARRAY node ID.`; }
            break;

          case 'TRAIN_INFILTRATOR':
            if (params.nodeId && params.targetNodeId) {
                const trainingNode = newNodes[params.nodeId];
                const targetNodeForInfiltrator = newNodes[params.targetNodeId];

                if (trainingNode && trainingNode.owner === factionId && trainingNode.isCN &&
                    targetNodeForInfiltrator && targetNodeForInfiltrator.owner !== factionId &&
                    actingFaction.MAT >= ATTRITION_COST_INFILTRATOR_MAT) {

                    const currentInfiltratorsOnTarget = targetNodeForInfiltrator.infiltratorUnits?.[factionId] || 0;
                    if (currentInfiltratorsOnTarget < MAX_INFILTRATORS_PER_NODE_FROM_ONE_FACTION) {
                        newFactions[factionId] = {
                            ...actingFaction,
                            MAT: actingFaction.MAT - ATTRITION_COST_INFILTRATOR_MAT,
                            totalMATConsumed: actingFaction.totalMATConsumed + ATTRITION_COST_INFILTRATOR_MAT,
                            totalInfiltrators: actingFaction.totalInfiltrators + 1,
                        };
                        if (!newNodes[params.targetNodeId].infiltratorUnits) {
                            newNodes[params.targetNodeId].infiltratorUnits = {};
                        }
                        newNodes[params.targetNodeId].infiltratorUnits![factionId] = (newNodes[params.targetNodeId].infiltratorUnits![factionId] || 0) + 1;

                        message = `${actingFaction.name} trained and deployed an infiltrator to ${targetNodeForInfiltrator.label}.`;
                        eventLogs.push({ id: `log-${Date.now()}-infiltrain-${Math.random()}`, timestamp: new Date().toLocaleTimeString(), turn: prev.turn, phase: `MANEUVER_${factionId}` as GamePhase, message, type: 'INFILTRATION', source: factionId});
                        nodeActivityLogsInternal.push({ id:`na-${Date.now()}`, turn:prev.turn, nodeId: targetNodeForInfiltrator.id, nodeLabel: targetNodeForInfiltrator.label, message: `Infiltrator from ${actingFaction.name} deployed.`, type: 'INFILTRATOR_DEPLOYED', factionId: targetNodeForInfiltrator.owner });
                    } else { message = `${actingFaction.name} failed to deploy infiltrator to ${targetNodeForInfiltrator.label}: Max infiltrators reached for this faction on target.`; }
                } else { message = `${actingFaction.name} failed to train infiltrator: Invalid training node, target node, or insufficient MAT.`; }
            } else { message = `${actingFaction.name} failed to train infiltrator: Missing parameters.`; }
            break;

          case 'SABOTAGE_MATERIEL':
            if (params.nodeId) {
                const targetNode = newNodes[params.nodeId];
                if (targetNode && targetNode.infiltratorUnits && (targetNode.infiltratorUnits[factionId] || 0) > 0) {
                    newFactions[factionId].totalSabotageAttempts += 1;
                    const successRoll = Math.random();
                    let sabotageSuccess = successRoll < SABOTAGE_BASE_SUCCESS_CHANCE; 

                    if (sabotageSuccess) {
                        newFactions[factionId].successfulSabotageAttempts += 1;
                        message = `${actingFaction.name}'s infiltrator successfully sabotaged ${targetNode.label}.`;
                        newNodes[params.nodeId].alarmLevel = Math.min((newNodes[params.nodeId].alarmLevel || 0) + 1, MAX_ALARM_LEVEL);
                        nodeActivityLogsInternal.push({ id:`na-${Date.now()}-sabosuccess`, turn:prev.turn, nodeId: targetNode.id, nodeLabel: targetNode.label, message: `Sabotage successful! Alarm increased.`, type: 'SABOTAGE_SUCCESS', factionId: targetNode.owner });

                        if (targetNode.nodeType === 'INDUSTRIAL_HUB' && targetNode.owner !== NEUTRAL_ID && newFactions[targetNode.owner]) {
                            const matDrained = Math.min(newFactions[targetNode.owner].MAT, SABOTAGE_MAT_DRAIN_AMOUNT);
                            newFactions[targetNode.owner].MAT -= matDrained;
                            newFactions[factionId].enemyMatDrainedBySabotage += matDrained;
                            message += ` ${matDrained} MAT drained from ${newFactions[targetNode.owner].name}.`;
                            newNodes[params.nodeId].interdictedTurns = SABOTAGE_INTERDICTION_TURNS;
                            message += ` MAT output interdicted for ${SABOTAGE_INTERDICTION_TURNS} turns.`;
                        } else if (targetNode.nodeType === 'RECON_ARRAY' && targetNode.owner !== NEUTRAL_ID && newFactions[targetNode.owner]?.activatedReconNodeIds.includes(targetNode.id)) {
                            newFactions[targetNode.owner].activatedReconNodeIds = newFactions[targetNode.owner].activatedReconNodeIds.filter(id => id !== targetNode.id);
                            const targetFactionStillHasCapability = newFactions[targetNode.owner].activatedReconNodeIds.some(id => isNodeConnectedToFactionCN(id, targetNode.owner, newNodes, newFactions));
                            if (newFactions[targetNode.owner].isReconSystemActive !== targetFactionStillHasCapability) {
                                newFactions[targetNode.owner].isReconSystemActive = targetFactionStillHasCapability;
                            }
                            newNodes[params.nodeId].interdictedTurns = SABOTAGE_INTERDICTION_TURNS; 
                            message += ` Recon Array disabled for ${SABOTAGE_INTERDICTION_TURNS} turns.`;
                        } else if ((targetNode.nodeType === 'FORTRESS' || targetNode.nodeType === 'CN') && (targetNode.fortificationLevel || 0) > 0) {
                            if (Math.random() < SABOTAGE_FORT_DESTRUCTION_CHANCE) {
                                newNodes[params.nodeId].fortificationLevel = (newNodes[params.nodeId].fortificationLevel || 0) - 1;
                                const newMaxHPForReducedLevel = (newNodes[params.nodeId].fortificationLevel || 0) * FORT_HP_PER_LEVEL;
                                newNodes[params.nodeId].fortificationHP = Math.min(newNodes[params.nodeId].fortificationHP || 0, newMaxHPForReducedLevel);
                                newNodes[params.nodeId].maxFortificationHP = newMaxHPForReducedLevel;

                                message += ` Fortification level reduced by 1!`;
                                if (targetNode.owner !== NEUTRAL_ID) { 
                                    if (newNodes[params.nodeId].fortificationLevel === 0 && newFactions[targetNode.owner]) { 
                                        newFactions[targetNode.owner].totalFortifiedNodes = (newFactions[targetNode.owner].totalFortifiedNodes || 0) -1;
                                    }
                                }
                            } else { message += ` Fortifications resisted direct damage.`; }
                        }
                    } else {
                        message = `${actingFaction.name}'s infiltrator failed to sabotage ${targetNode.label}.`;
                        nodeActivityLogsInternal.push({ id:`na-${Date.now()}-sabofail`, turn:prev.turn, nodeId: targetNode.id, nodeLabel: targetNode.label, message: `Sabotage attempt failed.`, type: 'SABOTAGE_FAILURE', factionId: targetNode.owner });
                        if (Math.random() < SABOTAGE_DETECTION_CHANCE_ON_FAILURE) {
                            newNodes[params.nodeId].infiltratorUnits![factionId] = (newNodes[params.nodeId].infiltratorUnits![factionId] || 0) - 1;
                            if (newNodes[params.nodeId].infiltratorUnits![factionId]! <= 0) delete newNodes[params.nodeId].infiltratorUnits![factionId];
                            newFactions[factionId].totalInfiltrators -= 1;
                            message += ` Infiltrator detected and eliminated!`;
                             nodeActivityLogsInternal.push({ id:`na-${Date.now()}-infildetect`, turn:prev.turn, nodeId: targetNode.id, nodeLabel: targetNode.label, message: `Infiltrator from ${actingFaction.name} detected and eliminated.`, type: 'INFILTRATOR_DETECTED', factionId: targetNode.owner });
                        }
                    }
                    eventLogs.push({ id: `log-${Date.now()}-sabotage-${Math.random()}`, timestamp: new Date().toLocaleTimeString(), turn: prev.turn, phase: `MANEUVER_${factionId}` as GamePhase, message, type: 'INFILTRATION', source: factionId});

                } else { message = `${actingFaction.name} failed sabotage: No infiltrator at ${targetNode?.label || 'target'}.`; }
            } else { message = `${actingFaction.name} failed sabotage: Missing parameters.`; }
            break;

          case 'ECONOMIC_FOCUS':
          case 'HOLD_POSITION':
            message = `${actingFaction.name} action: ${type}. Reason: ${aiAction.reasoning || "Tactical decision."}`;
            break;
          default:
            message = `${actingFaction.name} performed an unhandled action: ${type}.`;
            break;
        }

        if (message && !eventLogs.some(log => log.message === message)) {
             eventLogs.push({
                id: `log-${Date.now()}-${Math.random()}`,
                timestamp: new Date().toLocaleTimeString(),
                turn: prev.turn,
                phase: `MANEUVER_${factionId}` as GamePhase,
                message,
                type: 'EVENT',
                source: factionId,
            });
        }
        
        const newSystemLog = [...prev.systemLog, ...eventLogs];
        if (eventLogs.length > 0 && activeSidebarTab !== 'SYSTEM_LOG') {
          setHasNewSystemLogEntry(true);
        }

        const updatedStats = calculateFactionStats(newNodes, factionId);
        newFactions[factionId] = { ...newFactions[factionId], ...updatedStats };
        if (type === 'ARTILLERY_STRIKE' && params.targetNodeId && newNodes[params.targetNodeId].owner !== NEUTRAL_ID && newNodes[params.targetNodeId].owner !== factionId) {
             const enemyFactionId = newNodes[params.targetNodeId].owner;
             if (newFactions[enemyFactionId]) {
                const enemyUpdatedStats = calculateFactionStats(newNodes, enemyFactionId);
                newFactions[enemyFactionId] = { ...newFactions[enemyFactionId], ...enemyUpdatedStats};
             }
        }

        return {
          ...prev,
          mapNodes: newNodes,
          factions: newFactions,
          systemLog: newSystemLog,
          lastTurnNodeActivity: [...prev.lastTurnNodeActivity, ...nodeActivityLogsInternal],
          currentPhase: factionId === AI2_ID ? 'MANEUVER_GEMQ' : 'COMBAT',
          activePlayerForManeuver: factionId === AI2_ID ? AI1_ID : null,
          currentPhaseTime: 0,
          gameMessage: null,
        };
      });
      let zoomNodeId: string | null = null;
      if (['DEPLOY_UNITS', 'BUILD_FORTIFICATIONS', 'PURCHASE_ARTILLERY', 'ACTIVATE_RECON_ARRAY', 'PERFORM_RECON_PULSE', 'TRAIN_INFILTRATOR', 'SABOTAGE_MATERIEL'].includes(aiAction.type) && aiAction.params.nodeId) {
          zoomNodeId = aiAction.params.nodeId;
          if (aiAction.type === 'TRAIN_INFILTRATOR' && aiAction.params.targetNodeId) zoomNodeId = aiAction.params.targetNodeId;
      } else if (['MOVE_UNITS', 'ATTACK_NODE', 'REINFORCE_NODE', 'MOVE_ARTILLERY', 'ARTILLERY_STRIKE'].includes(aiAction.type) && aiAction.params.targetNodeId) {
          zoomNodeId = aiAction.params.targetNodeId;
      }
      if (zoomNodeId && gameStateRef.current.mapNodes[zoomNodeId]) {
          zoomToCoordinates(gameStateRef.current.mapNodes[zoomNodeId].x, gameStateRef.current.mapNodes[zoomNodeId].y, 1.3);
          if (autoResetViewTimer) window.clearTimeout(autoResetViewTimer);
          const timerId = window.setTimeout(() => handleResetView(), AUTO_RESET_VIEW_DELAY_MS);
          setAutoResetViewTimer(timerId);
      }

    } else {
      addLogEntry(`AI ${initialGameState.factions[factionId].name} failed to decide on an action. Holding position.`, 'ERROR', factionId, `MANEUVER_${factionId}` as GamePhase);
       setGameState(prev => ({
        ...prev,
        currentPhase: factionId === AI2_ID ? 'MANEUVER_GEMQ' : 'COMBAT',
        activePlayerForManeuver: factionId === AI2_ID ? AI1_ID : null,
        currentPhaseTime: 0,
        gameMessage: null,
      }));
    }
  };

export const handleResourcePhase = (gameState: GameState, addLogEntry: any, gameSettings: GameSettings, isGemmaModelActive: boolean): GameState => {
    let newGameState = { ...gameState };
    addLogEntry(`Starting RESOURCE phase for Turn ${newGameState.turn}.`, 'PHASE_TRANSITION', undefined, 'RESOURCE');

    // Training completion
    for (const nodeId in newGameState.mapNodes) {
        const node = newGameState.mapNodes[nodeId];
        if (node.trainingQueue && node.trainingQueue.turnsRemaining > 0) {
            node.trainingQueue.turnsRemaining -= 1;
            if (node.trainingQueue.turnsRemaining === 0) {
                if (node.trainingQueue.type === 'VETERAN') {
                    node.veteranUnits = (node.veteranUnits || 0) + node.trainingQueue.quantity;
                    newGameState.factions[node.owner].totalVeteranUnits = (newGameState.factions[node.owner].totalVeteranUnits || 0) + node.trainingQueue.quantity;
                    addLogEntry(`${node.trainingQueue.quantity} veterans have been trained at ${node.label}.`, 'EVENT', node.owner, 'RESOURCE');
                }
                delete node.trainingQueue;
            }
        }
    }

    // Resource collection and reinforcement logic will go here

    // Check if it's time for a doctrine phase
    if (newGameState.turn >= DOCTRINE_STANDARD_START_TURN && (newGameState.turn - DOCTRINE_STANDARD_START_TURN) % DOCTRINE_PHASE_INTERVAL === 0) {
        newGameState.currentPhase = 'DOCTRINE';
        newGameState.gameMessage = "Choose your doctrine!";
        // Populate doctrine choices for AI factions
        const choices = getRandomDoctrines(2);
        newGameState.currentDoctrineChoices = {};
        for (const factionId in newGameState.factions) {
            if (factionId === AI1_ID || factionId === AI2_ID) {
                newGameState.currentDoctrineChoices[factionId as PlayerId] = choices;
            }
        }
    } else {
        newGameState.currentPhase = 'MANEUVER_AXIOM';
        newGameState.activePlayerForManeuver = AI2_ID;
        newGameState.gameMessage = null;
    }

    return newGameState;
};

export const handleCombatPhase = (gameState: GameState, addLogEntry: any, addNodeActivityEntry: any): GameState => {
    let newGameState = { ...gameState };
    let battleReports: BattleReportData[] = [];

    for (const nodeId in newGameState.mapNodes) {
        const node = newGameState.mapNodes[nodeId];
        if (node.pendingAttackers && Object.keys(node.pendingAttackers).length > 0) {
            // We have a battle!
            const defenderId = node.owner;
                const defender = newGameState.factions[defenderId];
                let defenderStandardUnits = node.standardUnits;
                let defenderVeteranUnits = node.veteranUnits || 0;

                for (const attackerId in node.pendingAttackers) {
                    const attacker = newGameState.factions[attackerId as PlayerId];
                    const attackData = node.pendingAttackers[attackerId as PlayerId];
                    if (!attacker || !attackData) continue;

                    let attackerStandardUnits = attackData.units; // Assuming attackers are always standard units for now
                    let attackerVeteranUnits = 0; // Placeholder for veteran attackers

                    const battleReport: BattleReportData = {
                        id: `battle-${Date.now()}-${nodeId}-${attackerId}`,
                        timestamp: new Date().toISOString(),
                        turn: newGameState.turn,
                        attacker: attackerId as PlayerId,
                        defender: defenderId,
                        nodeId: nodeId,
                        nodeName: node.label,
                        outcome: 'STALEMATE', // Default outcome
                        attackerUnitsBefore: attackerStandardUnits + attackerVeteranUnits,
                        defenderUnitsBefore: defenderStandardUnits + defenderVeteranUnits,
                        attackerLosses: 0,
                        defenderLosses: 0,
                        nodeCaptured: false,
                        fortificationBonusUsed: 0,
                        rounds: [],
                    };

                    // Simple combat logic for now, can be expanded
                    const fortBonus = (node.fortificationLevel || 0) * FORTIFICATION_DEFENSE_BONUS_PER_LEVEL;
                    battleReport.fortificationBonusUsed = fortBonus;

                    let roundNum = 1;
                    while((attackerStandardUnits + attackerVeteranUnits > 0) && (defenderStandardUnits + defenderVeteranUnits > 0)) {
                        const roundDetail: BattleRoundDetail = {
                            roundNumber: roundNum,
                            attackerUnitsStart: attackerStandardUnits + attackerVeteranUnits,
                            defenderUnitsStart: defenderStandardUnits + defenderVeteranUnits,
                            attackerDiceRolls: [],
                            defenderDiceRolls: [],
                            attackerFinalRolls: [],
                            defenderFinalRolls: [],
                            attackerLossesThisRound: 0,
                            defenderLossesThisRound: 0,
                            attackerUnitsEnd: 0,
                            defenderUnitsEnd: 0,
                        };

                        let attackerRolls = Array.from({ length: attackerStandardUnits }, () => Math.floor(Math.random() * 6) + 1);
                        let attackerVeteranRolls = Array.from({ length: attackerVeteranUnits }, () => Math.floor(Math.random() * 6) + 1 + VETERAN_COMBAT_BONUS);
                        let defenderRolls = Array.from({ length: defenderStandardUnits }, () => Math.floor(Math.random() * 6) + 1);
                        let defenderVeteranRolls = Array.from({ length: defenderVeteranUnits }, () => Math.floor(Math.random() * 6) + 1 + VETERAN_COMBAT_BONUS);

                        roundDetail.attackerDiceRolls = [...attackerRolls, ...attackerVeteranRolls];
                        roundDetail.defenderDiceRolls = [...defenderRolls, ...defenderVeteranRolls];

                        let defenderRollsWithBonus = defenderRolls.map(roll => roll + fortBonus);
                        let defenderVeteranRollsWithBonus = defenderVeteranRolls.map(roll => roll + fortBonus);
                        roundDetail.defenderFinalRolls = [...defenderRollsWithBonus, ...defenderVeteranRollsWithBonus];
                        roundDetail.attackerFinalRolls = [...attackerRolls, ...attackerVeteranRolls];

                        const attackerHits = attackerRolls.filter(r => r >= 5).length + attackerVeteranRolls.filter(r => r >= 5).length;
                        const defenderHits = defenderRollsWithBonus.filter(r => r >= 5).length + defenderVeteranRollsWithBonus.filter(r => r >= 5).length;

                        let attackerStandardLosses = 0;
                        let attackerVeteranLosses = 0;
                        let defenderStandardLosses = 0;
                        let defenderVeteranLosses = 0;

                        // Standard units die first
                        attackerStandardLosses = Math.min(attackerStandardUnits, defenderHits);
                        let remainingDefenderHits = defenderHits - attackerStandardLosses;
                        if (remainingDefenderHits > 0) {
                            attackerVeteranLosses = Math.min(attackerVeteranUnits, remainingDefenderHits);
                        }

                        defenderStandardLosses = Math.min(defenderStandardUnits, attackerHits);
                        let remainingAttackerHits = attackerHits - defenderStandardLosses;
                        if (remainingAttackerHits > 0) {
                            defenderVeteranLosses = Math.min(defenderVeteranUnits, remainingAttackerHits);
                        }
                        
                        roundDetail.attackerLossesThisRound = attackerStandardLosses + attackerVeteranLosses;
                        roundDetail.defenderLossesThisRound = defenderStandardLosses + defenderVeteranLosses;

                        attackerStandardUnits -= attackerStandardLosses;
                        attackerVeteranUnits -= attackerVeteranLosses;
                        defenderStandardUnits -= defenderStandardLosses;
                        defenderVeteranUnits -= defenderVeteranLosses;

                        roundDetail.attackerUnitsEnd = attackerStandardUnits + attackerVeteranUnits;
                        roundDetail.defenderUnitsEnd = defenderStandardUnits + defenderVeteranUnits;
                        battleReport.rounds.push(roundDetail);
                        roundNum++;
                    }

                    battleReport.attackerLosses = battleReport.attackerUnitsBefore - (attackerStandardUnits + attackerVeteranUnits);
                    battleReport.defenderLosses = battleReport.defenderUnitsBefore - (defenderStandardUnits + defenderVeteranUnits);

                    if (attackerStandardUnits + attackerVeteranUnits > 0) { // Attacker wins
                        battleReport.outcome = 'ATTACKER_WINS';
                        battleReport.nodeCaptured = true;
                        
                        addLogEntry(`${attacker.name} wins! ${node.label} captured. Losses: Att-${battleReport.attackerLosses}, Def-${battleReport.defenderLosses}.`, 'EVENT', attackerId as PlayerId, 'COMBAT');
                        addNodeActivityEntry(node, `${attacker.name} captured the node.`, 'CAPTURE', attackerId as PlayerId);

                        // Battlefield promotion for attackers
                        const promotedAttackers = Math.floor(attackerStandardUnits / BATTLE_PROMOTION_RATIO);
                        attackerStandardUnits -= promotedAttackers;
                        attackerVeteranUnits += promotedAttackers;
                        if (promotedAttackers > 0) {
                            addLogEntry(`${promotedAttackers} of ${attacker.name}'s units were promoted to veterans.`, 'EVENT', attackerId as PlayerId, 'COMBAT');
                        }

                        newGameState.mapNodes[nodeId] = {
                            ...newGameState.mapNodes[nodeId],
                            owner: attackerId as PlayerId,
                            standardUnits: attackerStandardUnits,
                            veteranUnits: attackerVeteranUnits,
                        };
                    } else { // Defender wins
                        battleReport.outcome = 'DEFENDER_WINS';
                        addLogEntry(`${defender.name} holds ${node.label}! Losses: Att-${battleReport.attackerLosses}, Def-${battleReport.defenderLosses}.`, 'EVENT', defenderId, 'COMBAT');
                        addNodeActivityEntry(node, `Defended against an attack from ${attacker.name}.`, 'STATUS_CHANGE', defenderId);

                        // Battlefield promotion for defenders
                        const promotedDefenders = Math.floor(defenderStandardUnits / BATTLE_PROMOTION_RATIO);
                        defenderStandardUnits -= promotedDefenders;
                        defenderVeteranUnits += promotedDefenders;
                        if (promotedDefenders > 0) {
                            addLogEntry(`${promotedDefenders} of ${defender.name}'s units were promoted to veterans.`, 'EVENT', defenderId, 'COMBAT');
                        }

                        newGameState.mapNodes[nodeId] = {
                            ...newGameState.mapNodes[nodeId],
                            standardUnits: defenderStandardUnits,
                            veteranUnits: defenderVeteranUnits,
                        };
                    }
            // Clear pending attackers for the node
            newGameState.mapNodes[nodeId].pendingAttackers = {};
        }
    }

    newGameState.battleLog = [...newGameState.battleLog, ...battleReports];
    
    // Recalculate stats for all factions involved in battles
    const factionsToUpdate = new Set<PlayerId>();
    battleReports.forEach(br => {
        factionsToUpdate.add(br.attacker);
        factionsToUpdate.add(br.defender);
    });

    factionsToUpdate.forEach(factionId => {
        if (factionId !== NEUTRAL_ID) {
            const updatedStats = calculateFactionStats(newGameState.mapNodes, factionId);
            newGameState.factions[factionId] = { ...newGameState.factions[factionId], ...updatedStats };
        }
    });

    newGameState.currentPhase = 'FORTIFY_AXIOM';
    newGameState.activePlayerForManeuver = AI2_ID;
    newGameState.gameMessage = null;

    return newGameState;
};

export const handleUpkeepPhase = (gameState: GameState, addLogEntry: any): GameState => {
    let newGameState = { ...gameState };
    addLogEntry(`Starting UPKEEP phase for Turn ${newGameState.turn}.`, 'PHASE_TRANSITION', undefined, 'UPKEEP');

    for (const factionId in newGameState.factions) {
        if (factionId === NEUTRAL_ID || factionId === COMMAND_CONSOLE_ID) continue;

        const faction = newGameState.factions[factionId as PlayerId];
        let totalUpkeep = 0;

        for (const nodeId in newGameState.mapNodes) {
            const node = newGameState.mapNodes[nodeId];
            if (node.owner === faction.id) {
                totalUpkeep += (node.standardUnits || 0) * 0.25; // Standard unit upkeep
                totalUpkeep += (node.veteranUnits || 0) * 0.25 * 1.5; // Veteran unit upkeep
            }
        }

        faction.MAT -= totalUpkeep;
        addLogEntry(`${faction.name} paid ${totalUpkeep.toFixed(2)} MAT for unit upkeep.`, 'EVENT', faction.id, 'UPKEEP');
    }

    newGameState.currentPhase = 'FLUCTUATION';
    newGameState.turn += 1;
    newGameState.gameMessage = null;

    return newGameState;
};

import { DOCTRINE_LIBRARY } from '../../data/doctrines';

const getRandomDoctrines = (count: number) => {
    const shuffled = [...DOCTRINE_LIBRARY].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

export const handleDoctrinePhase = async (gameState: GameState, addLogEntry: any, gameSettings: GameSettings, isGemmaModelActive: boolean): Promise<GameState> => {
    let newGameState = { ...gameState };
    addLogEntry(`Starting DOCTRINE phase for Turn ${newGameState.turn}.`, 'PHASE_TRANSITION', undefined, 'DOCTRINE');

    newGameState.currentDoctrineChoices = {};
    for (const factionId of [AI1_ID, AI2_ID] as PlayerId[]) {
        const choices = getRandomDoctrines(2);
        newGameState.currentDoctrineChoices[factionId as PlayerId] = choices;
        addLogEntry(`${newGameState.factions[factionId as PlayerId].name} is presented with new doctrines.`, 'EVENT', factionId as PlayerId, 'DOCTRINE');

        const chosenDoctrineId = await chooseDoctrineFromGemini(
            newGameState, 
            factionId as PlayerId, 
            choices,
            gameSettings.selectedGenAIModel,
            gameSettings.isAggressiveSanitizationEnabled,
            gameSettings.isStructuredOutputEnabled,
            isGemmaModelActive,
            gameSettings.apiKey
        );

        if (chosenDoctrineId) {
            const chosenDoctrine = DOCTRINE_LIBRARY.find(d => d.id === chosenDoctrineId);
            if (chosenDoctrine) {
                newGameState.factions[factionId as PlayerId].activeDoctrines = [...(newGameState.factions[factionId as PlayerId].activeDoctrines || []), { ...chosenDoctrine, turnsRemaining: undefined, appliedBuffs: chosenDoctrine.buffs, appliedNerfs: chosenDoctrine.nerfs }];
                addLogEntry(`${newGameState.factions[factionId as PlayerId].name} chose the '${chosenDoctrine.name}' doctrine.`, 'EVENT', factionId as PlayerId, 'DOCTRINE');

                // Apply buffs and nerfs
                chosenDoctrine.buffs.forEach(buff => {
                    newGameState = applyDoctrineEffects(newGameState, factionId as PlayerId, buff);
                });
                chosenDoctrine.nerfs.forEach(nerf => {
                    newGameState = applyDoctrineEffects(newGameState, factionId as PlayerId, nerf);
                });
            }
        }
    }

    }

    newGameState.currentPhase = 'FLUCTUATION';
    newGameState.gameMessage = null;

    return newGameState;
};