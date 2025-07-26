import { GameState, PlayerId, NodeData, Faction, BattleReportData, SystemLogEntry, GamePhase, OpPlan, CommLogEntry, GameSettings } from '../types';
import { getMapData } from '../../../data/mapData';
import { AI1_ID, AI2_ID, NEUTRAL_ID, COMMAND_CONSOLE_ID, QR_PER_CONNECTED_NODE_IN_LARGEST_NETWORK, SABOTAGE_IH_OUTPUT_REDUCTION_FACTOR, ATTRITION_UPKEEP_STANDARD, ATTRITION_UPKEEP_FORTRESS, RECON_ARRAY_UPKEEP_MAT, FORT_HP_PER_LEVEL, VETERAN_COMBAT_BONUS } from '../../../constants';

const AEI_HISTORY_LENGTH = 3;

const createInitialFaction = (id: PlayerId, name: string, color: string): Faction => ({
  id, name, color,
  qr: ATTRITION_STARTING_QR,
  MAT: ATTRITION_STARTING_MAT,
  nodesControlled: 0,
  totalUnits: 0,
  totalArtillery: 0,
  totalInfiltrators: 0,
  totalFortifiedNodes: 0,
  currentOpPlan: null,
  totalUnitsLost: 0,
  totalUnitsDeployed: 0,
  battlesWon: 0,
  battlesLost: 0,
  evolvedUnits: 0,
  totalMATGenerated: 0,
  totalMATConsumed: 0,
  totalMATSpentOnUnitDeployment: 0,
  totalMATSpentOnUnitUpkeep: 0,
  totalUnitTurns: 0,
  unitsDeployedPerTurnHistory: Array(AEI_HISTORY_LENGTH).fill(0),
  unitsLostPerTurnHistory: Array(AEI_HISTORY_LENGTH).fill(0),
  currentTurnUnitsDeployed: 0,
  currentTurnUnitsLost: 0,
  totalMATSpentOnFortifications: 0,
  matSpentOnFortRepair: 0,
  battlesWonAsAttacker: 0,
  battlesInitiated: 0,
  unitsLostInSuccessfulCaptures: 0,
  nodesSuccessfullyCaptured: 0,
  cumulativeMATDeniedToEnemyFromCaptures: 0,
  totalAttackerStrengthCommittedInInitiatedBattles: 0,
  totalDefenderStrengthFacedInInitiatedBattles: 0,
  battlesInitiatedCountForOverkillIndex: 0,
  isReconSystemActive: false,
  activatedReconNodeIds: [],
  hasActiveReconPulseThisTurn: false,
  pulsesPerformedCount: 0,
  intelAdvantageTurnsCount: 0,
  qrSpentOnRecon: 0,
  matSpentOnRecon: 0,
  matSpentOnArtilleryAmmo: 0,
  artilleryKills: 0,
  successfulSabotageAttempts: 0,
  totalSabotageAttempts: 0,
  enemyMatDrainedBySabotage: 0,
});

const calculateFactionStats = (nodes: Record<string, NodeData>, factionId: PlayerId): Partial<Faction> => {
    let nodesControlled = 0;
    let totalUnits = 0;
    let totalArtillery = 0;
    let totalInfiltrators = 0;
    let totalFortifiedNodes = 0;
    let evolvedUnits = 0;

    Object.values(nodes).forEach(node => {
        if (node.owner === factionId) {
            nodesControlled++;
            totalUnits += node.standardUnits;
            evolvedUnits += node.evolvedUnits;
            if (node.artilleryGarrison) totalArtillery += node.artilleryGarrison;
            if (node.fortificationLevel && node.fortificationLevel > 0) totalFortifiedNodes++;
        }
        if (node.infiltratorUnits && node.infiltratorUnits[factionId]) {
            totalInfiltrators += node.infiltratorUnits[factionId]!;
        }
    });
    return { nodesControlled, totalUnits, totalArtillery, totalInfiltrators, totalFortifiedNodes, evolvedUnits };
};


const createInitialGameState = (mapType: MapType, settings: GameSettings): GameState => {
  const initialNodes = getMapData(mapType, settings.isFoWEnabledForNewGame);
  const initialFactions: Record<PlayerId, Faction> = {
    'AXIOM': createInitialFaction(AI2_ID, 'AXIOM', FACTION_COLORS[AI2_ID].primary),
    'GEM-Q': createInitialFaction(AI1_ID, 'GEM-Q', FACTION_COLORS[AI1_ID].primary),
    'NEUTRAL': createInitialFaction(NEUTRAL_ID, 'NEUTRAL', FACTION_COLORS[NEUTRAL_ID].primary),
    'COMMAND_CONSOLE': createInitialFaction(COMMAND_CONSOLE_ID, 'COMMAND', FACTION_COLORS[COMMAND_CONSOLE_ID].primary),
  };

  Object.keys(initialFactions).forEach(fId => {
    const factionId = fId as PlayerId;
    if (factionId !== COMMAND_CONSOLE_ID) {
      const stats = calculateFactionStats(initialNodes, factionId);
      initialFactions[factionId] = { ...initialFactions[factionId], ...stats };
    }
  });

  const isFogOfWarActiveResult = settings.isFoWEnabledForNewGame;

  return {
    turn: 1,
    currentPhase: 'FLUCTUATION',
    activePlayerForManeuver: null,
    mapNodes: initialNodes,
    factions: initialFactions,
    systemLog: [],
    battleLog: [],
    isAttritionDoctrineMode: true,
    selectedMap: mapType,
    gameTimeElapsed: 0,
    currentPhaseTime: 0,
    avgTurnTime: 0,
    lastTurnDuration: 0,
    turnStartTime: 0,
    allTurnDurations: [],
    isGameRunning: false,
    gameMessage: null,
    opPlanHistory: {
      'GEM-Q': [],
      'AXIOM': [],
      'NEUTRAL': [],
      'COMMAND_CONSOLE': [],
    },
    lastTurnNodeActivity: [],
    gameStats: { mostBrutalBattle: null },
    isFogOfWarActive: isFogOfWarActiveResult,
    factionIntelSnapshots: {},
    commLog: [],
    currentDoctrineChoices: {},
  };
};