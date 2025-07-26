import { LiveMusicGenerationConfig as GenAiLiveMusicGenerationConfig, Scale as GenAiScaleType, Scale } from "@google/genai";

export { Scale as GenAiScale } from "@google/genai"; // Export the enum object directly

export type PlayerId = 'GEM-Q' | 'AXIOM' | 'NEUTRAL' | 'COMMAND_CONSOLE';
export type GamePhase = 'FLUCTUATION' | 'RESOURCE' | 'MANEUVER_AXIOM' | 'MANEUVER_GEMQ' | 'COMBAT' | 'FORTIFY_AXIOM' | 'FORTIFY_GEMQ' | 'UPKEEP' | 'DOCTRINE' | 'GAME_OVER';
export type NodeType = 'CN' | 'QN' | 'KJ' | 'INDUSTRIAL_HUB' | 'FORTRESS' | 'URBAN' | 'STANDARD' | 'RECON_ARRAY' | 'ALL';

// More specific AI Action Types
export type AIActionName =
  'DEPLOY_UNITS' |
  'MOVE_UNITS' |
  'ATTACK_NODE' |
  'BUILD_FORTIFICATIONS' |
  'PURCHASE_ARTILLERY' |
  'MOVE_ARTILLERY' |
  'ARTILLERY_STRIKE' |
  'TRAIN_INFILTRATOR' |
  'SABOTAGE_MATERIEL' |
  'REINFORCE_NODE' |
  'CONSOLIDATE_FORCES' |
  'HOLD_POSITION' |
  'ECONOMIC_FOCUS' |
  'ACTIVATE_RECON_ARRAY' |
  'PERFORM_RECON_PULSE' |
  'TRAIN_VETERANS'; // New action for training veterans

export interface AIActionArgs {
  nodeId?: string; // Source node for most actions, or target for ACTIVATE_RECON_ARRAY/PERFORM_RECON_PULSE
  targetNodeId?: string;
  unitsToDeploy?: number;
  unitsToMove?: number;
  quantity?: number; // For purchasing artillery or training veterans
  artilleryToMove?: number; // For moving artillery
  artilleryToFire?: number; // For artillery strike action
}

export interface AIAction {
  type: AIActionName;
  params: AIActionArgs;
  reasoning?: string;
}

// --- VETERAN CADRE SYSTEM ---

export interface TrainingOrder {
  type: 'VETERAN';
  quantity: number;
  turnsRemaining: number;
}

// --- STRATEGIC DOCTRINE SYSTEM ---

export type DoctrineTier = 'LOW' | 'MEDIUM' | 'HIGH';

export type DoctrineTheme = 
  'ECONOMIC' | 
  'MILITARY_OFFENSE' | 
  'MILITARY_DEFENSE' | 
  'TERRITORIAL_CONTROL' | 
  'INTELLIGENCE_GATHERING' | 
  'COUNTER_INTELLIGENCE' |
  'SUBTERFUGE' |
  'LOGISTICS' |
  'STRATEGIC_FLEXIBILITY';

export interface DoctrineEffect {
  type: 
    | 'GAIN_MAT'
    | 'FLAT_MAT_INCOME'
    | 'FLAT_QR_INCOME'
    | 'PERCENTAGE_MAT_INCOME_MODIFIER'
    | 'PERCENTAGE_QR_INCOME_MODIFIER'
    | 'UNIT_UPKEEP_MODIFIER'
    | 'UNIT_DEPLOY_COST_MODIFIER'
    | 'COMBAT_ROLL_MODIFIER'
    | 'MAX_UNIT_CAPACITY_MODIFIER'
    | 'FORTIFICATION_COST_MODIFIER'
    | 'FORTIFICATION_HP_MODIFIER'
    | 'FORTIFICATION_COMBAT_BONUS_MODIFIER'
    | 'ARTILLERY_COST_MODIFIER'
    | 'ARTILLERY_RANGE_MODIFIER'
    | 'ARTILLERY_DAMAGE_MODIFIER'
    | 'RECON_COST_MODIFIER'
    | 'RECON_PULSE_DURATION_MODIFIER'
    | 'INFILTRATOR_COST_MODIFIER'
    | 'INFILTRATOR_EFFECTIVENESS_MODIFIER'
    | 'INFILTRATOR_DETECTION_MODIFIER'
    | 'DISABLE_ACTION'
    | 'GAIN_MAT_ON_CAPTURE'
    | 'PERMANENT_NODE_MAT_REDUCTION_ON_CAPTURE'
    | 'FREE_UNIT_PER_TURN'
    | 'RESOURCE_CONVERSION'
    | 'DISABLE_RESOURCE_TYPE'
    | 'BATTLE_REWARD_MAT'
    | 'TEMPORARY_ACTION_COST_REDUCTION'
    | 'TEMPORARY_ACTION_COST_INCREASE'
    | 'MAX_CONTROLLED_NODE_TYPE_LIMIT'
    | 'COMBAT_ROLL_MODIFIER_CONDITIONAL'
    | 'MAT_INCOME_MODIFIER_FROM_NODE_TYPE'
    | 'UNIT_DEPLOY_LIMIT'
    | 'ARTILLERY_SUPPORT_RANGE_MODIFIER'
    | 'CN_MAX_UNIT_CAPACITY_MODIFIER'
    | 'UNIT_UPKEEP_PERCENTAGE_INCREASE'
    | 'UNIT_UPKEEP_PERCENTAGE_DECREASE'
    | 'SUPPRESSION_INCREASE'
    | 'ENEMY_RECON_PULSE_FAILURE_CHANCE'
    | 'ARTILLERY_FIRE_COST_MODIFIER'
    | 'MOVE_UNITS_COST_MODIFIER'
    | 'MOVE_UNITS_COST_PER_UNIT_MODIFIER'
    | 'COMBAT_BONUS_NEUTRAL_TERRITORY'
    | 'COMBAT_PENALTY_OWN_FORTRESS_DEFENSE'
    | 'RECON_ARRAY_UPKEEP_MODIFIER'
    | 'DECOY_RECON_PULSE'
    | 'PERMANENT_ENEMY_RESOURCE_VISIBILITY'
    | 'MAX_ACTIVE_RECON_ARRAY_LIMIT'
    | 'TRAIN_INFILTRATOR_INSTANT'
    | 'INFILTRATOR_UPKEEP_MODIFIER'
    | 'INFILTRATOR_NEW_ACTION'
    | 'ARTILLERY_STRIKE_FORT_HP_DAMAGE'
    | 'ARTILLERY_STRIKE_OWN_UNIT_DAMAGE_CHANCE'
    | 'MOVE_UNITS_TWO_NODES'
    | 'MOVE_UNITS_SUPPRESSION_PENALTY'
    | 'ENEMY_UNIT_ATTRITION_ON_MOVE'
    | 'DISABLE_NEUTRAL_NODE_CAPTURE_ADJACENT_ENEMY'
    | 'BATTLEFIELD_PROMOTION_MODIFIER'
    | 'DISABLE_AUTO_REINFORCEMENTS'
    | 'MOVE_UNITS_FROM_CN_TO_ANY_NODE'
    | 'MOVE_UNITS_CN_COST_MODIFIER'
    | 'MAX_UNIT_CAPACITY_NON_CN_MODIFIER'
    | 'AUTO_REINFORCEMENT_RATE_MODIFIER'
    | 'IMMUNE_TO_LOW_SUPPLY_PENALTY'
    | 'MAX_MAT_STOCKPILE_MODIFIER'
    | 'BUILD_FORTIFICATIONS_ADJACENT_NEUTRAL'
    | 'OVERFLOW_REINFORCEMENTS_TO_RESERVE_POOL'
    | 'MOVE_UNITS_LEAVE_ZERO_UNITS'
    | 'MAT_TO_GLOBAL_STOCKPILE'
    | 'SABOTAGE_TARGETS_GLOBAL_STOCKPILE'
    | 'RECOVER_LOST_UNITS_AFTER_BATTLE'
    | 'UNIT_UPKEEP_ADJACENT_CN_MODIFIER'
    | 'UNIT_UPKEEP_OTHER_UNITS_MODIFIER'
    | 'FREE_MOVE_INTO_NEUTRAL_NODE'
    | 'NEUTRAL_NODE_CAPTURE_BONUS_REDUCTION'
    | 'ENEMY_COMBAT_PENALTY_ADJACENT_RECON_ARRAY'
    | 'OWN_RECON_ARRAY_ENEMY_ATTACK_BONUS'
    | 'GAIN_MAT_ON_ENEMY_DEPLOYMENT'
    | 'DISABLE_NEW_INFILTRATORS';
  value?: number; // Generic value for the effect (e.g., amount, percentage, modifier)
  unitType?: 'STANDARD' | 'VETERAN' | 'ARTILLERY' | 'INFILTRATOR' | 'ALL';
  nodeType?: NodeType | 'ALL';
  duration?: number; // Number of turns for temporary effects
  targetFaction?: 'OWN' | 'ENEMY';
  modifierType?: 'FLAT' | 'PERCENTAGE_INCREASE' | 'PERCENTAGE_DECREASE' | 'MULTIPLIER';
  actionType?: AIActionName; // For effects related to specific actions
  resourceType?: 'MAT' | 'QR';
  condition?: 'ATTACKING' | 'DEFENDING' | 'NEUTRAL_TERRITORY' | 'LOW_FORT_HP' | 'ADJACENT_TO_ENEMY_TERRITORY' | 'UNITS_IN_BATTLE' | 'SUCCESSFUL_DEFENSE_NEXT_ATTACK' | 'NODE_HAS_ARTILLERY_AND_UNITS';
  // Specific fields for complex effects
  conversionRatio?: { from: 'MAT' | 'QR', to: 'MAT' | 'QR', ratio: number };
  maxLimit?: number; // For max controlled node type limit
  chance?: number; // For chance-based effects
  // For 'MOVE_UNITS_TWO_NODES'
  cooldown?: number;
  // For 'RECOVER_LOST_UNITS_AFTER_BATTLE'
  percentage?: number;
  // For 'UNIT_UPKEEP_ADJACENT_CN_MODIFIER' and 'UNIT_UPKEEP_OTHER_UNITS_MODIFIER'
  adjacentToCN?: boolean;
}

export interface DoctrineDefinition {
  id: string;
  name: string;
  theme: DoctrineTheme;
  tier: DoctrineTier;
  buffs: DoctrineEffect[];
  nerfs: DoctrineEffect[];
}

export interface ActiveDoctrine {
  id: string; // Corresponds to DoctrineDefinition id
  name: string; // For easy display
  turnsRemaining?: number; // For temporary doctrines
  appliedBuffs: DoctrineEffect[]; // The specific buffs applied
  appliedNerfs: DoctrineEffect[]; // The specific nerfs applied
}

export enum MapType {
  VOLGOGRAD_CAULDRON = 'VOLGOGRAD_CAULDRON',
  SERAPHIM_GRID = 'SERAPHIM_GRID',
  TWIN_PEAKS = 'TWIN_PEAKS',
  CLASSIC_LATTICE = 'CLASSIC_LATTICE',
  TARTARUS_ANOMALY = 'TARTARUS_ANOMALY',
}

export interface NodeData {
  id: string;
  label: string;
  regionName: string;
  owner: PlayerId;
  standardUnits: number;
  /** @deprecated Replaced by veteranUnits */
  evolvedUnits: number;
  veteranUnits: number;
  trainingQueue?: TrainingOrder;
  qrOutput: number;
  isKJ: boolean;
  isCN: boolean;
  nodeType: NodeType;
  x: number;
  y: number;
  connections: string[];
  maxUnits: number;

  MAT_output?: number;
  MAT_stockpile?: number;
  max_MAT_stockpile?: number;
  fortificationLevel?: number;
  fortificationHP?: number; // Current HP of fortifications
  maxFortificationHP?: number; // Max HP based on fortificationLevel
  fortificationHPModifier?: number; // New: Fortification HP modifier from doctrines
  artilleryGarrison?: number; // Number of artillery pieces
  infiltratorUnits?: Partial<Record<PlayerId, number>>; // Tracks infiltrators by faction on this node

  suppression?: number; // New: Suppression level of the node
  alarmLevel?: number;
  interdictedTurns?: number;
  lowSupply?: boolean;

  pendingAttackers?: Partial<Record<PlayerId, { units: number, fromNodeId: string }>>;
}

export interface Faction {
  id: PlayerId;
  name: string;
  color: string;
  qr: number;
  MAT: number;
  nodesControlled: number;
  totalUnits: number;
  /** @deprecated Replaced by totalVeteranUnits */
  evolvedUnits?: number;
  totalVeteranUnits: number;
  totalArtillery: number;
  totalInfiltrators: number; // Total active infiltrators belonging to this faction
  totalFortifiedNodes: number;
  currentOpPlan: OpPlan | null;

  totalUnitsLost: number;
  totalUnitsDeployed: number;
  battlesWon: number;
  battlesLost: number;

  totalMATGenerated: number;
  totalMATConsumed: number;

  totalMATSpentOnUnitDeployment: number;
  totalMATSpentOnUnitUpkeep: number;
  totalUnitTurns: number;

  unitsDeployedPerTurnHistory: number[];
  unitsLostPerTurnHistory: number[];
  currentTurnUnitsDeployed: number;
  currentTurnUnitsLost: number;

  totalMATSpentOnFortifications: number; // Primarily for upgrades
  matSpentOnFortRepair: number; // New: MAT spent specifically on repairing fort HP

  battlesWonAsAttacker: number;
  battlesInitiated: number;

  unitsLostInSuccessfulCaptures: number;
  nodesSuccessfullyCaptured: number;

  cumulativeMATDeniedToEnemyFromCaptures: number;

  totalAttackerStrengthCommittedInInitiatedBattles: number;
  totalDefenderStrengthFacedInInitiatedBattles: number;
  battlesInitiatedCountForOverkillIndex: number;

  // Recon System Fields
  isReconSystemActive: boolean; // Indicates capability to pulse (owned, activated, connected RECON_ARRAY)
  activatedReconNodeIds: string[]; // Tracks RECON_ARRAY nodes for which activation cost was paid
  hasActiveReconPulseThisTurn: boolean; // True if a recon pulse was performed this turn
  pulsesPerformedCount: number; // Total number of recon pulses performed
  intelAdvantageTurnsCount: number; // Number of turns where a pulse was active
  qrSpentOnRecon: number; // Total QR spent on recon (activation, pulses)
  matSpentOnRecon: number; // Total MAT spent on recon (activation, pulses)

  // New KPI tracking fields
  matSpentOnArtilleryAmmo: number;
  artilleryKills: number; // Units killed by this faction's artillery
  successfulSabotageAttempts: number;
  totalSabotageAttempts: number;
  enemyMatDrainedBySabotage: number;
  flatMATIncomeBonus?: number; // New: Flat MAT income bonus from doctrines
  flatQRIncomeBonus?: number; // New: Flat QR income bonus from doctrines
  percentageMATIncomeModifier?: number; // New: Percentage MAT income modifier from doctrines
  percentageQRIncomeModifier?: number; // New: Percentage QR income modifier from doctrines
  unitUpkeepModifier?: number; // New: Unit upkeep modifier from doctrines
  unitDeployCostModifier?: number; // New: Unit deploy cost modifier from doctrines
  combatRollModifier?: number; // New: Combat roll modifier from doctrines
  maxUnitCapacityModifier?: number; // New: Max unit capacity modifier from doctrines
  fortificationCostModifier?: number; // New: Fortification cost modifier from doctrines
  fortificationHPModifier?: number; // New: Fortification HP modifier from doctrines
  fortificationCombatBonusModifier?: number; // New: Fortification combat bonus modifier from doctrines
  artilleryCostModifier?: number; // New: Artillery cost modifier from doctrines
  artilleryRangeModifier?: number; // New: Artillery range modifier from doctrines
  artilleryDamageModifier?: number; // New: Artillery damage modifier from doctrines
  reconCostModifier?: number; // New: Recon cost modifier from doctrines
  reconPulseDurationModifier?: number; // New: Recon pulse duration modifier from doctrines
  infiltratorCostModifier?: number; // New: Infiltrator cost modifier from doctrines
  infiltratorEffectivenessModifier?: number; // New: Infiltrator effectiveness modifier from doctrines
  infiltratorDetectionModifier?: number; // New: Infiltrator detection modifier from doctrines
  disabledActions?: AIActionName[]; // New: Array of disabled actions from doctrines
  gainMatOnCaptureModifier?: number; // New: Modifier for MAT gained on capture
  permanentNodeMatReductionOnCapture?: number; // New: Permanent MAT reduction on captured nodes
  freeUnitPerTurn?: number; // New: Free unit per turn from doctrines
  resourceConversion?: { from: 'MAT' | 'QR', to: 'MAT' | 'QR', ratio: number }; // New: Resource conversion doctrine
  disabledResourceTypes?: ('MAT' | 'QR')[]; // New: Disabled resource types from doctrines
  battleRewardMat?: number; // New: MAT reward from battles
  temporaryActionCostModifiers?: { actionType: AIActionName, value: number, turnsRemaining: number, modifierType: 'PERCENTAGE_INCREASE' | 'PERCENTAGE_DECREASE' }[]; // New: Temporary action cost modifiers
  maxControlledNodeTypeLimits?: Partial<Record<NodeType, number>>; // New: Max controlled node type limits from doctrines
  combatRollModifierConditional?: { value: number, condition: 'ATTACKING' | 'DEFENDING' | 'UNITS_IN_BATTLE' | 'SUCCESSFUL_DEFENSE_NEXT_ATTACK' | 'LOW_FORT_HP' | 'NODE_HAS_ARTILLERY_AND_UNITS' }[]; // New: Conditional combat roll modifiers
  matIncomeModifierFromNodeType?: Partial<Record<NodeType, number>>; // New: MAT income modifier from node type
  unitDeployLimit?: number; // New: Unit deploy limit from doctrines
  artillerySupportRangeModifier?: number; // New: Artillery support range modifier from doctrines
  cnMaxUnitCapacityModifier?: number; // New: CN max unit capacity modifier from doctrines
  unitUpkeepPercentageIncrease?: number; // New: Unit upkeep percentage increase from doctrines
  unitUpkeepPercentageDecrease?: number; // New: Unit upkeep percentage decrease from doctrines
  suppressionIncrease?: number; // New: Suppression increase from doctrines
  enemyReconPulseFailureChance?: number; // New: Enemy recon pulse failure chance from doctrines
  artilleryFireCostModifier?: number; // New: Artillery fire cost modifier from doctrines
  moveUnitsCostModifier?: number; // New: Move units cost modifier from doctrines
  moveUnitsCostPerUnitModifier?: number; // New: Move units cost per unit modifier from doctrines
  combatBonusNeutralTerritory?: number; // New: Combat bonus in neutral territory from doctrines
  combatPenaltyOwnFortressDefense?: number; // New: Combat penalty when defending own fortress nodes
  reconArrayUpkeepModifier?: number; // New: Recon array upkeep modifier from doctrines
  decoyReconPulse?: boolean; // New: Decoy recon pulse from doctrines
  permanentEnemyResourceVisibility?: boolean; // New: Permanent enemy resource visibility from doctrines
  maxActiveReconArrayLimit?: number; // New: Max active recon array limit from doctrines
  immuneToLowSupplyPenalty?: boolean; // New: Immunity to low supply penalty from doctrines
  autoReinforcementRateModifier?: number; // New: Auto reinforcement rate modifier from doctrines
  maxUnitCapacityNonCNModifier?: number; // New: Max unit capacity non-CN modifier from doctrines
  canFortifyAdjacentNeutral?: boolean; // New: Can fortify adjacent neutral nodes from doctrines
  overflowReinforcementsToReservePool?: boolean; // New: Overflow reinforcements to reserve pool from doctrines
  moveUnitsFromCNToAnyNode?: { cooldown: number, lastUsedTurn: number }; // New: Move units from CN to any node doctrine
  moveUnitsCNCostModifier?: number; // New: Move units from CN cost modifier from doctrines
  moveUnitsLeaveZeroUnits?: boolean; // New: Move units leave zero units from doctrines
  matToGlobalStockpile?: boolean; // New: MAT to global stockpile from doctrines
  sabotageTargetsGlobalStockpile?: boolean; // New: Sabotage targets global stockpile from doctrines
  canTrainInfiltratorInstant?: boolean; // New: Can train infiltrator instantly from doctrines
  infiltratorUpkeepModifier?: number; // New: Infiltrator upkeep modifier from doctrines
  infiltratorNewAction?: boolean; // New: Infiltrator new action from doctrines
  artilleryStrikeFortHPDamage?: number; // New: Artillery strike fort HP damage from doctrines
  artilleryStrikeOwnUnitDamageChance?: number; // New: Artillery strike own unit damage chance from doctrines
  moveUnitsTwoNodes?: boolean; // New: Move units two nodes from doctrines
  moveUnitsSuppressionPenalty?: number; // New: Move units suppression penalty from doctrines
  enemyUnitAttritionOnMove?: number; // New: Enemy unit attrition on move from doctrines
  disableNeutralNodeCaptureAdjacentEnemy?: boolean; // New: Disable neutral node capture adjacent enemy from doctrines
  battlefieldPromotionModifier?: number; // New: Battlefield promotion modifier from doctrines
  unitUpkeepAdjacentCNModifier?: number; // New: Unit upkeep adjacent CN modifier from doctrines
  unitUpkeepOtherUnitsModifier?: number; // New: Unit upkeep other units modifier from doctrines
  freeMoveIntoNeutralNode?: boolean; // New: Free move into neutral node from doctrines
  neutralNodeCaptureBonusReduction?: number; // New: Neutral node capture bonus reduction from doctrines
  enemyCombatPenaltyAdjacentReconArray?: number; // New: Enemy combat penalty adjacent recon array from doctrines
  ownReconArrayEnemyAttackBonus?: number; // New: Own recon array enemy attack bonus from doctrines
  gainMatOnEnemyDeployment?: number; // New: Gain MAT on enemy deployment from doctrines
  disableNewInfiltrators?: boolean; // New: Disable new infiltrators from doctrines
  maxMatStockpileModifier?: number; // New: Max MAT stockpile modifier from doctrines
  recoverLostUnitsAfterBattlePercentage?: number; // New: Recover lost units after battle percentage from doctrines
  moveUnitsFromCNToAnyNode?: { cooldown: number, lastUsedTurn: number }; // New: Move units from CN to any node doctrine
  disableAutoReinforcements?: boolean; // New: Disable auto reinforcements from doctrines
}



export interface OpPlanHistoryEntry extends OpPlan {
    // any additional fields if history differs from active plan structure
}

export interface NodeActivityEntry {
  id: string;
  turn: number;
  nodeId: string;
  nodeLabel: string;
  message: string;
  factionId?: PlayerId;
  type: 'CAPTURE' | 'FORTIFY' | 'INTERDICT' | 'COMBAT_LOSS' | 'RESOURCE_CHANGE' | 'STATUS_CHANGE' |
        'UNIT_DEPLOY' | 'UNIT_DISBAND' | 'ARTILLERY_STRIKE' | 'ARTILLERY_PURCHASE' |
        'RECON_SYSTEM' | 'RECON_ARRAY_ACTIVATED' | 'RECON_ARRAY_DEACTIVATED' | 'RECON_PULSE_ACTIVATED' |
        'INFILTRATOR_DEPLOYED' | 'SABOTAGE_SUCCESS' | 'SABOTAGE_FAILURE' | 'INFILTRATOR_DETECTED' |
        'FORT_DAMAGE' | 'FORT_REPAIR';
}

export interface FactionIntelSnapshot {
  turnSnapshotTaken: number; // The turn this snapshot was generated AT THE END OF.
  qr?: number;
  MAT?: number;
  nodesControlled?: number;
  totalUnits?: number;
  totalArtillery?: number;
  totalUnitsLost?: number;
  totalUnitsDeployed?: number;
  totalMATGenerated?: number;
  totalMATConsumed?: number;
  isUnderLowSupply?: boolean;
  isReconSystemActive?: boolean; // Snapshot of their capability to pulse at end of that turn
}

export interface CommLogEntry {
  id: string;
  turn: number;
  timestamp: string;
  senderId: PlayerId; // PlayerId already includes 'COMMAND_CONSOLE'
  senderName: string;
  message: string;
  targetFactionId?: PlayerId | 'BROADCAST';
  colorClass?: string;
}

export type SidebarTab = 'SYSTEM_LOG' | 'BATTLE_HISTORY' | 'SCS_LOG';



export interface GameSettings {
    isFoWEnabledForNewGame: boolean;
    selectedGenAIModel: string;
    isAggressiveSanitizationEnabled: boolean;
    isStructuredOutputEnabled: boolean; // New setting for toggling structured JSON output
}

export interface SystemLogEntry {
  id: string;
  timestamp: string;
  turn: number;
  phase: GamePhase;
  message: string;
  type: 'EVENT' | 'ERROR' | 'INFO' | 'AI_COT' | 'AI_ACTION' | 'PHASE_TRANSITION' | 'ARTILLERY' | 'RECON' | 'LYRIA' | 'INFILTRATION' | 'FORTIFICATION' | 'SCS' | 'DIRECTIVE';
  source?: PlayerId | 'LYRIA_SYSTEM' | 'SCS_SYSTEM' | 'COMMAND_CONSOLE';
}

export interface BattleRoundDetail {
  roundNumber: number;
  attackerUnitsStart: number;
  defenderUnitsStart: number;
  attackerDiceRolls: number[];
  defenderDiceRolls: number[];
  attackerBonusesApplied?: string[];
  defenderBonusesApplied?: string[];
  attackerFinalRolls: number[];
  defenderFinalRolls: number[];
  attackerLossesThisRound: number;
  defenderLossesThisRound: number;
  attackerUnitsEnd: number;
  defenderUnitsEnd: number;
}

export interface BattleReportData {
  id: string;
  timestamp: string;
  turn: number;
  attacker: PlayerId;
  defender: PlayerId;
  nodeId: string;
  nodeName: string;
  outcome: 'ATTACKER_WINS' | 'DEFENDER_WINS' | 'MUTUAL_LOSSES' | 'NO_COMBAT' | 'STALEMATE';
  attackerUnitsBefore: number;
  defenderUnitsBefore: number;
  attackerLosses: number;
  defenderLosses: number;
  nodeCaptured: boolean;
  fortificationBonusUsed?: number; // Effective fort level used in combat
  fortificationHPDamage?: number; // HP damage to fortifications
  rounds: BattleRoundDetail[];
  attackerArtilleryFired?: number;
  defenderArtilleryFired?: number;
  attackerLossesFromDefensiveArtillery?: number;
  defenderLossesFromOffensiveArtillery?: number;
}

export interface OpPlan {
  id: string;
  turnGenerated: number;
  objective: string;
  operation: string;
  tasks: string[];
  priority?: "ECONOMIC" | "MILITARY_OFFENSE" | "MILITARY_DEFENSE" | "TERRITORIAL_EXPANSION" | "INTELLIGENCE_GATHERING";
  targetNodeIds?: string[];
  turnAnalysis?: string;
  economicAnalysis?: string; // New field for structured economic thought process
  economicAssessment?: string; // Fallback for older, less structured plans
  scratchpadOutput?: StrategicThoughtProcessData;
}

export interface StrategicThoughtProcessData {
  CRITICAL_GAME_FACTORS: string;
  COMPREHENSIVE_SELF_ASSESSMENT: string;
  ENEMY_ASSESSMENT: string;
  OBJECTIVE_REFINEMENT_FOR_CURRENT_OPPLAN: string;
  STRATEGIC_CONSIDERATIONS_AND_OPTIONS: string;
  PREFERRED_STRATEGY_AND_RATIONALE: string;
  CONFIDENCE_AND_RISK_ANALYSIS: string;
  CONTINGENCIES_AND_NEXT_TURN_ADAPTATION?: string; // Optional
  FINAL_PLAN_ALIGNMENT_CHECK: string;
}

export interface BattleLogEntry extends BattleReportData {} // Alias for clarity if BattleReportData fully covers it.

// Lyria-related types
export type LyriaScale = GenAiScaleType; // Use the imported GenAI Scale type

export interface LiveMusicGenerationConfig extends GenAiLiveMusicGenerationConfig {
  scale?: LyriaScale; // Use the LyriaScale type for 'scale'
  temperature?: number;
  guidance?: number;
  density?: number;
  brightness?: number;
  bpm?: number;
  seed?: number; // Make optional as per usage
  muteBass?: boolean;
  muteDrums?: boolean;
  onlyBassAndDrums?: boolean;
  topK?: number; // Make optional as per usage
}

export type LyriaPlaybackState = 'stopped' | 'loading' | 'playing' | 'paused' | 'error';

export interface LyriaSessionSettings {
  prompts: LyriaPrompt[];
  config: LiveMusicGenerationConfig;
}

export interface LyriaPrompt {
  promptId: string;
  text: string;
  weight: number;
  color: string;
}

// --- Noospheric Nexus Types ---
export type NoosphericPlayerId = 'GEM-Q' | 'AXIOM' | 'NEUTRAL' | 'COMMAND_CONSOLE';
export type NoosphericMapType = "Fractured Core" | "Global Conflict" | "Classic Lattice" | "Twin Peaks" | "The Seraphim Grid" | "The Tartarus Anomaly";

export interface NoosphericNodeData {
  id: string;
  label: string;
  regionName: string;
  owner: NoosphericPlayerId;
  standardUnits: number;
  evolvedUnits: number; // Assuming evolved units are also part of this model
  qrOutput: number;
  isKJ: boolean;
  isCN: boolean;
  x: number;
  y: number;
  connections: string[];
  maxUnits: number;
  hasFabricationHub: boolean; // KJ specific
  isHubActive: boolean; // For KJs, status of fabrication hub
  hubDisconnectedTurn?: number; // Turn when a KJ hub got disconnected
}

export interface NoosphericFaction {
  id: NoosphericPlayerId;
  name: string;
  color: string;
  qr: number;
  nodesControlled: number;
  totalUnits: number;
  kjsHeld: number; // Number of Knowledge Junctions held
  tacticalAnalysis: string; // Current tactical analysis or OpPlan summary
  totalStandardUnits: number;
  totalEvolvedUnits: number;
  activeHubsCount: number;
  successfulAttacks: number;
  attacksLost: number;
  successfulDefenses: number;
  defensesLost: number;
  successfulTurnAttempts: number;
  failedTurnAttempts: number;
  unitsPurchased: number;
  unitsLost: number;
  tacticalAnalysisHistory: string[];
}
