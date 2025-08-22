import { LiveMusicGenerationConfig as GenAiLiveMusicGenerationConfig, Scale as GenAiScaleType, Scale } from "@google/genai";

export { Scale as GenAiScale } from "@google/genai"; // Export the enum object directly

export type PlayerId = 'GEM-Q' | 'AXIOM' | 'NEUTRAL' | 'COMMAND_CONSOLE';
export type GamePhase = 'FLUCTUATION' | 'RESOURCE' | 'MANEUVER_AXIOM' | 'MANEUVER_GEMQ' | 'COMBAT' | 'FORTIFY_AXIOM' | 'FORTIFY_GEMQ' | 'UPKEEP' | 'GAME_OVER';
export type NodeType = 'CN' | 'QN' | 'KJ' | 'INDUSTRIAL_HUB' | 'FORTRESS' | 'URBAN' | 'STANDARD' | 'RECON_ARRAY'; // Added 'RECON_ARRAY'

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
  'PERFORM_RECON_PULSE'; // New action for recon pulse

export interface AIActionArgs {
  nodeId?: string; // Source node for most actions, or target for ACTIVATE_RECON_ARRAY/PERFORM_RECON_PULSE
  targetNodeId?: string;
  unitsToDeploy?: number;
  unitsToMove?: number;
  quantity?: number; // For purchasing artillery
  artilleryToMove?: number; // For moving artillery
  artilleryToFire?: number; // For artillery strike action
}

export interface AIAction {
  type: AIActionName;
  params: AIActionArgs;
  reasoning?: string;
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
  evolvedUnits: number;
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
  artilleryGarrison?: number; // Number of artillery pieces
  infiltratorUnits?: Partial<Record<PlayerId, number>>; // Tracks infiltrators by faction on this node

  suppression?: number;
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
  evolvedUnits?: number;
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

export interface GameState {
  turn: number;
  currentPhase: GamePhase;
  activePlayerForManeuver: PlayerId | null;
  mapNodes: Record<string, NodeData>;
  factions: Record<PlayerId, Faction>;
  systemLog: SystemLogEntry[];
  battleLog: BattleLogEntry[];
  isAttritionDoctrineMode: boolean;
  selectedMap: MapType;
  gameTimeElapsed: number;
  currentPhaseTime: number;

  avgTurnTime: number;
  lastTurnDuration: number;
  turnStartTime: number;
  allTurnDurations: number[];

  isGameRunning: boolean;
  gameMessage: string | null;
  opPlanHistory: Record<PlayerId, OpPlanHistoryEntry[]>;
  lastTurnNodeActivity: NodeActivityEntry[];

  gameStats: {
    mostBrutalBattle: BattleLogEntry | null;
  };
  isFogOfWarActive: boolean;
  factionIntelSnapshots: Partial<Record<PlayerId, FactionIntelSnapshot>>;
  commLog: CommLogEntry[];
}

export interface GameSettings {
    isFoWEnabledForNewGame: boolean;
    selectedGenAIModel: string;
    isAggressiveSanitizationEnabled: boolean;
    isStructuredOutputEnabled: boolean; // New setting for toggling structured JSON output
    apiKey?: string;
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