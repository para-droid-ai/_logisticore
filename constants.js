"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VETERAN_TRAINING_MAT_COST = exports.VETERAN_TRAINING_TIME_TURNS = exports.VETERAN_TRAINING_NODE_TYPE = exports.VETERAN_UPKEEP_MODIFIER = exports.VETERAN_COMBAT_BONUS = exports.FORTIFICATION_DEFENSE_BONUS_PER_LEVEL = exports.QR_PER_CONNECTED_NODE_IN_LARGEST_NETWORK = exports.UNITS_REINFORCED_PER_NODE = exports.DEPLOYMENT_MAX_UNITS_PER_TURN = exports.MAX_FORTIFICATION_LEVEL = exports.MAX_TURNS = exports.ATTRITION_UPKEEP_FORTRESS = exports.ATTRITION_UPKEEP_ELITE = exports.ATTRITION_UPKEEP_STANDARD = exports.MAX_ALARM_LEVEL = exports.SABOTAGE_FORT_DESTRUCTION_CHANCE = exports.SABOTAGE_IH_OUTPUT_REDUCTION_FACTOR = exports.SABOTAGE_INTERDICTION_TURNS = exports.SABOTAGE_MAT_DRAIN_AMOUNT = exports.SABOTAGE_DETECTION_CHANCE_ON_FAILURE = exports.SABOTAGE_BASE_SUCCESS_CHANCE = exports.MAX_INFILTRATORS_PER_NODE_FROM_ONE_FACTION = exports.ATTRITION_COST_INFILTRATOR_MAT = exports.RECON_PULSE_COST_MAT = exports.RECON_PULSE_COST_QR = exports.RECON_ARRAY_UPKEEP_MAT = exports.RECON_ARRAY_ACTIVATION_COST_MAT = exports.RECON_ARRAY_ACTIVATION_COST_QR = exports.MAX_ARTILLERY_PER_NODE = exports.ARTILLERY_COMBAT_SUPPORT_DAMAGE_PER_GUN = exports.ARTILLERY_STRIKE_DAMAGE_PER_GUN = exports.ATTRITION_AMMO_COST_ARTILLERY_DEFENSIVE_SUPPORT = exports.ATTRITION_AMMO_COST_ARTILLERY_OFFENSIVE_SUPPORT = exports.ATTRITION_AMMO_COST_ARTILLERY_STRIKE = exports.ATTRITION_COST_ARTILLERY_MOVE_MAT_PER_PIECE = exports.ATTRITION_COST_ARTILLERY_MAT_CREATION = exports.ATTRITION_COST_ARTILLERY_QR = exports.ARTILLERY_STRIKE_FORT_HP_DAMAGE_PER_GUN = exports.BATTLE_FORT_HP_DAMAGE_PER_ROUND = exports.FORT_UPGRADE_LEVEL_MAT_COST = exports.FORT_REPAIR_MAT_COST_PER_HP = exports.FORT_HP_PER_LEVEL = exports.ATTRITION_COST_STANDARD_UNIT_MAT = exports.ATTRITION_STARTING_MAT = exports.ATTRITION_STARTING_QR = exports.SYSTEM_SENDER_NAME = exports.COMMAND_CONSOLE_ID = exports.NEUTRAL_ID = exports.AI2_ID = exports.AI1_ID = void 0;
exports.LYRIA_SCALES = exports.INITIAL_LYRIA_CONFIG = exports.INITIAL_LYRIA_PROMPTS = exports.LYRIA_PROMPT_COLORS = exports.MAX_LYRIA_PROMPTS = exports.LYRIA_MODEL_NAME = exports.AI2_NAME = exports.AI1_NAME = exports.RECON_ARRAY_NEUTRAL_COLORS = exports.NEUTRAL_STRONGHOLD_COLORS = exports.FACTION_COLORS = exports.DOCTRINE_HIGH_TIER_COST = exports.DOCTRINE_MEDIUM_TIER_COST = exports.DOCTRINE_LOW_TIER_COST = exports.DOCTRINE_STANDARD_LIMIT = exports.DOCTRINE_ANOMALOUS_START_TURN = exports.DOCTRINE_STANDARD_START_TURN = exports.DOCTRINE_PHASE_INTERVAL = exports.BATTLE_PROMOTION_RATIO = void 0;
const types_1 = require("./types");
// --- FACTION & SYSTEM IDENTIFIERS ---
exports.AI1_ID = 'GEM-Q';
exports.AI2_ID = 'AXIOM';
exports.NEUTRAL_ID = 'NEUTRAL';
exports.COMMAND_CONSOLE_ID = 'COMMAND_CONSOLE'; // New ID for human player directives
exports.SYSTEM_SENDER_NAME = 'SYSTEM';
// --- ATTRITION DOCTRINE - RESOURCE & COSTS ---
exports.ATTRITION_STARTING_QR = 100;
exports.ATTRITION_STARTING_MAT = 650;
exports.ATTRITION_COST_STANDARD_UNIT_MAT = 15; // MAT to deploy one standard unit
// --- FORTIFICATION HP SYSTEM ---
exports.FORT_HP_PER_LEVEL = 100; // Max HP per level of fortification
exports.FORT_REPAIR_MAT_COST_PER_HP = 0.25; // MAT cost to repair 1 HP of fortification
exports.FORT_UPGRADE_LEVEL_MAT_COST = 25; // MAT cost to *initiate* an upgrade to the next fortification level (if at max HP for current level)
exports.BATTLE_FORT_HP_DAMAGE_PER_ROUND = 10; // HP damage fortifications take per round of combat
exports.ARTILLERY_STRIKE_FORT_HP_DAMAGE_PER_GUN = 15; // HP damage fortifications take from ARTILLERY_STRIKE per gun
// --- ARTILLERY COSTS ---
exports.ATTRITION_COST_ARTILLERY_QR = 30; // QR to purchase one artillery piece (was 75)
exports.ATTRITION_COST_ARTILLERY_MAT_CREATION = 100; // MAT to build one artillery piece (was 150)
exports.ATTRITION_COST_ARTILLERY_MOVE_MAT_PER_PIECE = 5; // MAT to move one artillery piece
// --- ARTILLERY AMMUNITION COSTS (MAT per gun per use) ---
exports.ATTRITION_AMMO_COST_ARTILLERY_STRIKE = 15; // For ARTILLERY_STRIKE action (was 25)
exports.ATTRITION_AMMO_COST_ARTILLERY_OFFENSIVE_SUPPORT = 10; // For supporting own attack in COMBAT phase (was 20)
exports.ATTRITION_AMMO_COST_ARTILLERY_DEFENSIVE_SUPPORT = 5; // For defending in COMBAT phase (was 10)
// --- ARTILLERY EFFECTIVENESS ---
exports.ARTILLERY_STRIKE_DAMAGE_PER_GUN = 1; // Units lost by target per gun in ARTILLERY_STRIKE (can be float for average)
exports.ARTILLERY_COMBAT_SUPPORT_DAMAGE_PER_GUN = 1; // Units lost by opponent per gun in COMBAT phase support
exports.MAX_ARTILLERY_PER_NODE = 5; // Max artillery pieces a single node can garrison
// --- RECONNAISSANCE ARRAY COSTS & RULES (New System) ---
exports.RECON_ARRAY_ACTIVATION_COST_QR = 75; // One-time QR cost to activate a captured RECON_ARRAY node
exports.RECON_ARRAY_ACTIVATION_COST_MAT = 50; // One-time MAT cost
exports.RECON_ARRAY_UPKEEP_MAT = 10; // Per-turn MAT upkeep for each active (owned, activated & connected) RECON_ARRAY
exports.RECON_PULSE_COST_QR = 40; // QR cost to perform a recon pulse
exports.RECON_PULSE_COST_MAT = 20; // MAT cost to perform a recon pulse
// --- INFILTRATOR COSTS & RULES ---
exports.ATTRITION_COST_INFILTRATOR_MAT = 75; // MAT to train one infiltrator (was 100)
exports.MAX_INFILTRATORS_PER_NODE_FROM_ONE_FACTION = 1; // Max infiltrators one faction can have on a single enemy/neutral node
exports.SABOTAGE_BASE_SUCCESS_CHANCE = 0.75; // 75% base chance for sabotage success
exports.SABOTAGE_DETECTION_CHANCE_ON_FAILURE = 0.50; // 50% chance infiltrator is detected if sabotage fails
exports.SABOTAGE_MAT_DRAIN_AMOUNT = 75; // MAT drained from enemy stockpile on successful IH sabotage
exports.SABOTAGE_INTERDICTION_TURNS = 2; // Turns an IH or Recon Array is interdicted
exports.SABOTAGE_IH_OUTPUT_REDUCTION_FACTOR = 0.5; // 50% MAT output reduction for interdicted IH
exports.SABOTAGE_FORT_DESTRUCTION_CHANCE = 0.10; // 10% chance to destroy 1 fort level (if >0) on Fortress/CN
exports.MAX_ALARM_LEVEL = 5; // Max alarm level a node can reach
// --- ATTRITION DOCTRINE - UPKEEP COSTS (per turn) ---
exports.ATTRITION_UPKEEP_STANDARD = 0.25; // MAT - Reduced from 1
exports.ATTRITION_UPKEEP_ELITE = 3; // MAT (Placeholder)
exports.ATTRITION_UPKEEP_FORTRESS = 5; // MAT to maintain a Fortress node (general upkeep, not per fort level) - Reduced from 10
// Note: Artillery upkeep could be added, e.g., ATTRITION_UPKEEP_ARTILLERY_PIECE = 5 MAT
// --- GAME RULES & LIMITS ---
exports.MAX_TURNS = 60;
exports.MAX_FORTIFICATION_LEVEL = 5;
exports.DEPLOYMENT_MAX_UNITS_PER_TURN = 10;
exports.UNITS_REINFORCED_PER_NODE = 2; // Reduced from 3 (was 5 originally)
exports.QR_PER_CONNECTED_NODE_IN_LARGEST_NETWORK = 10; // QR generated per node in the largest connected network
// --- COMBAT MODIFIERS ---
exports.FORTIFICATION_DEFENSE_BONUS_PER_LEVEL = 2; // Bonus to defense roll per fortification level (Effective level with HP system)
// --- VETERAN UNIT CONSTANTS ---
exports.VETERAN_COMBAT_BONUS = 2; // Flat bonus added to combat rolls.
exports.VETERAN_UPKEEP_MODIFIER = 1.5; // Veterans cost 1.5x standard upkeep.
exports.VETERAN_TRAINING_NODE_TYPE = 'FORTRESS'; // Veterans are trained at Fortresses.
exports.VETERAN_TRAINING_TIME_TURNS = 2; // Takes 2 full turns to train.
exports.VETERAN_TRAINING_MAT_COST = 10; // MAT cost per unit to begin training.
exports.BATTLE_PROMOTION_RATIO = 5; // 1 in 5 surviving standard units in a battle are promoted.
// --- STRATEGIC DOCTRINE CONSTANTS ---
exports.DOCTRINE_PHASE_INTERVAL = 5; // Doctrines are offered every 5 turns.
exports.DOCTRINE_STANDARD_START_TURN = 20;
exports.DOCTRINE_ANOMALOUS_START_TURN = 5;
exports.DOCTRINE_STANDARD_LIMIT = 2;
exports.DOCTRINE_LOW_TIER_COST = 250; // QR Cost
exports.DOCTRINE_MEDIUM_TIER_COST = 500; // QR Cost
exports.DOCTRINE_HIGH_TIER_COST = 1000; // QR Cost
// --- UI THEME COLORS ---
exports.FACTION_COLORS = {
    AXIOM: { primary: 'text-terminal-cyan', nodeBg: 'bg-cyan-600', text: 'text-cyan-300', border: 'border-cyan-500', actualHex: '#00FFFF' },
    'GEM-Q': { primary: 'text-terminal-red', nodeBg: 'bg-red-600', text: 'text-red-300', border: 'border-red-500', actualHex: '#FF003F' },
    NEUTRAL: { primary: 'text-terminal-gray', nodeBg: 'bg-gray-600', text: 'text-gray-300', border: 'border-gray-500', actualHex: '#808080' },
    COMMAND_CONSOLE: { primary: 'text-terminal-yellow', nodeBg: 'bg-yellow-700', text: 'text-yellow-300', border: 'border-yellow-500', actualHex: '#FFFF00' }
};
exports.NEUTRAL_STRONGHOLD_COLORS = { primary: 'text-terminal-yellow', nodeBg: 'bg-yellow-500', text: 'text-yellow-300', border: 'border-yellow-400', actualHex: '#FFFF00' };
exports.RECON_ARRAY_NEUTRAL_COLORS = { primary: 'text-purple-400', nodeBg: 'bg-purple-700', text: 'text-purple-300', border: 'border-purple-500', actualHex: '#A020F0' };
// --- Constants for noospheric-map-data.ts compatibility ---
exports.AI1_NAME = 'GEM-Q';
exports.AI2_NAME = 'AXIOM';
// --- End of Noospheric constants ---
// --- LYRIA MUSIC ENGINE CONSTANTS ---
exports.LYRIA_MODEL_NAME = 'models/lyria-realtime-exp';
exports.MAX_LYRIA_PROMPTS = 6;
exports.LYRIA_PROMPT_COLORS = [
    '#39FF14', // Terminal Green
    '#00FFFF', // Terminal Cyan
    '#FF003F', // Terminal Red
    '#FFFF00', // Terminal Yellow
    '#00BFFF', // Terminal Blue (Deep Sky Blue)
    '#FF00FF', // Magenta
];
exports.INITIAL_LYRIA_PROMPTS = [
    { text: "post-rock full band wall of sound", weight: 1.00 },
    { text: "dotted eighth delay", weight: 1.30 },
    { text: "airy drums", weight: 1.30 },
    { text: "lofi-chillwave", weight: 1.30 },
    { text: "fender rhodes with room reverb", weight: 0.70 },
];
exports.INITIAL_LYRIA_CONFIG = {
    temperature: 1.0,
    guidance: 4.0,
    density: 0.5,
    brightness: 0.5,
    bpm: 120,
    scale: types_1.GenAiScale.C_MAJOR_A_MINOR,
    muteBass: false,
    muteDrums: false,
    onlyBassAndDrums: false,
    seed: undefined,
    topK: undefined,
};
exports.LYRIA_SCALES = [
    { name: "Model Default", value: types_1.GenAiScale.SCALE_UNSPECIFIED },
    { name: "C Major / A Minor", value: types_1.GenAiScale.C_MAJOR_A_MINOR },
    { name: "D♭ Major / B♭ Minor", value: types_1.GenAiScale.D_FLAT_MAJOR_B_FLAT_MINOR },
    { name: "D Major / B Minor", value: types_1.GenAiScale.D_MAJOR_B_MINOR },
    { name: "E♭ Major / C Minor", value: types_1.GenAiScale.E_FLAT_MAJOR_C_MINOR },
    { name: "E Major / C♯/D♭ Minor", value: types_1.GenAiScale.E_MAJOR_D_FLAT_MINOR },
    { name: "F Major / D Minor", value: types_1.GenAiScale.F_MAJOR_D_MINOR },
    { name: "G♭ Major / E♭ Minor", value: types_1.GenAiScale.G_FLAT_MAJOR_E_FLAT_MINOR },
    { name: "G Major / E Minor", value: types_1.GenAiScale.G_MAJOR_E_MINOR },
    { name: "A♭ Major / F Minor", value: types_1.GenAiScale.A_FLAT_MAJOR_F_MINOR },
    { name: "A Major / F♯/G♭ Minor", value: types_1.GenAiScale.A_MAJOR_G_FLAT_MINOR },
    { name: "B♭ Major / G Minor", value: types_1.GenAiScale.B_FLAT_MAJOR_G_MINOR },
    { name: "B Major / G♯/A♭ Minor", value: types_1.GenAiScale.B_MAJOR_A_FLAT_MINOR },
];
// --- End of Lyria constants ---
