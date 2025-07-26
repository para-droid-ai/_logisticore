
import { PlayerId, LiveMusicGenerationConfig, LyriaScale, GenAiScale } from './types';

// --- FACTION & SYSTEM IDENTIFIERS ---
export const AI1_ID: PlayerId = 'GEM-Q';
export const AI2_ID: PlayerId = 'AXIOM';
export const NEUTRAL_ID: PlayerId = 'NEUTRAL';
export const COMMAND_CONSOLE_ID: PlayerId = 'COMMAND_CONSOLE'; // New ID for human player directives
export const SYSTEM_SENDER_NAME = 'SYSTEM';

// --- ATTRITION DOCTRINE - RESOURCE & COSTS ---
export const ATTRITION_STARTING_QR = 100;
export const ATTRITION_STARTING_MAT = 650;
export const ATTRITION_COST_STANDARD_UNIT_MAT = 15; // MAT to deploy one standard unit

// --- FORTIFICATION HP SYSTEM ---
export const FORT_HP_PER_LEVEL = 100; // Max HP per level of fortification
export const FORT_REPAIR_MAT_COST_PER_HP = 0.25; // MAT cost to repair 1 HP of fortification
export const FORT_UPGRADE_LEVEL_MAT_COST = 25; // MAT cost to *initiate* an upgrade to the next fortification level (if at max HP for current level)
export const BATTLE_FORT_HP_DAMAGE_PER_ROUND = 10; // HP damage fortifications take per round of combat
export const ARTILLERY_STRIKE_FORT_HP_DAMAGE_PER_GUN = 15; // HP damage fortifications take from ARTILLERY_STRIKE per gun

// --- ARTILLERY COSTS ---
export const ATTRITION_COST_ARTILLERY_QR = 30;         // QR to purchase one artillery piece (was 75)
export const ATTRITION_COST_ARTILLERY_MAT_CREATION = 100; // MAT to build one artillery piece (was 150)
export const ATTRITION_COST_ARTILLERY_MOVE_MAT_PER_PIECE = 5; // MAT to move one artillery piece

// --- ARTILLERY AMMUNITION COSTS (MAT per gun per use) ---
export const ATTRITION_AMMO_COST_ARTILLERY_STRIKE = 15;              // For ARTILLERY_STRIKE action (was 25)
export const ATTRITION_AMMO_COST_ARTILLERY_OFFENSIVE_SUPPORT = 10;   // For supporting own attack in COMBAT phase (was 20)
export const ATTRITION_AMMO_COST_ARTILLERY_DEFENSIVE_SUPPORT = 5;   // For defending in COMBAT phase (was 10)

// --- ARTILLERY EFFECTIVENESS ---
export const ARTILLERY_STRIKE_DAMAGE_PER_GUN = 1;          // Units lost by target per gun in ARTILLERY_STRIKE (can be float for average)
export const ARTILLERY_COMBAT_SUPPORT_DAMAGE_PER_GUN = 1;  // Units lost by opponent per gun in COMBAT phase support
export const MAX_ARTILLERY_PER_NODE = 5;                   // Max artillery pieces a single node can garrison


// --- RECONNAISSANCE ARRAY COSTS & RULES (New System) ---
export const RECON_ARRAY_ACTIVATION_COST_QR = 75;    // One-time QR cost to activate a captured RECON_ARRAY node
export const RECON_ARRAY_ACTIVATION_COST_MAT = 50;   // One-time MAT cost
export const RECON_ARRAY_UPKEEP_MAT = 10;            // Per-turn MAT upkeep for each active (owned, activated & connected) RECON_ARRAY
export const RECON_PULSE_COST_QR = 40;               // QR cost to perform a recon pulse
export const RECON_PULSE_COST_MAT = 20;              // MAT cost to perform a recon pulse

// --- INFILTRATOR COSTS & RULES ---
export const ATTRITION_COST_INFILTRATOR_MAT = 75; // MAT to train one infiltrator (was 100)
export const MAX_INFILTRATORS_PER_NODE_FROM_ONE_FACTION = 1; // Max infiltrators one faction can have on a single enemy/neutral node
export const SABOTAGE_BASE_SUCCESS_CHANCE = 0.75; // 75% base chance for sabotage success
export const SABOTAGE_DETECTION_CHANCE_ON_FAILURE = 0.50; // 50% chance infiltrator is detected if sabotage fails
export const SABOTAGE_MAT_DRAIN_AMOUNT = 75; // MAT drained from enemy stockpile on successful IH sabotage
export const SABOTAGE_INTERDICTION_TURNS = 2; // Turns an IH or Recon Array is interdicted
export const SABOTAGE_IH_OUTPUT_REDUCTION_FACTOR = 0.5; // 50% MAT output reduction for interdicted IH
export const SABOTAGE_FORT_DESTRUCTION_CHANCE = 0.10; // 10% chance to destroy 1 fort level (if >0) on Fortress/CN
export const MAX_ALARM_LEVEL = 5; // Max alarm level a node can reach

// --- ATTRITION DOCTRINE - UPKEEP COSTS (per turn) ---
export const ATTRITION_UPKEEP_STANDARD = 0.25; // MAT - Reduced from 1
export const ATTRITION_UPKEEP_ELITE = 3;       // MAT (Placeholder)
export const ATTRITION_UPKEEP_FORTRESS = 5;    // MAT to maintain a Fortress node (general upkeep, not per fort level) - Reduced from 10
// Note: Artillery upkeep could be added, e.g., ATTRITION_UPKEEP_ARTILLERY_PIECE = 5 MAT

// --- GAME RULES & LIMITS ---
export const MAX_TURNS = 60;
export const MAX_FORTIFICATION_LEVEL = 5;
export const DEPLOYMENT_MAX_UNITS_PER_TURN = 10;
export const UNITS_REINFORCED_PER_NODE = 2; // Reduced from 3 (was 5 originally)
export const QR_PER_CONNECTED_NODE_IN_LARGEST_NETWORK = 10; // QR generated per node in the largest connected network


// --- COMBAT MODIFIERS ---
export const FORTIFICATION_DEFENSE_BONUS_PER_LEVEL = 2; // Bonus to defense roll per fortification level (Effective level with HP system)

// --- VETERAN UNIT CONSTANTS ---
export const VETERAN_COMBAT_BONUS = 2; // Flat bonus added to combat rolls.
export const VETERAN_UPKEEP_MODIFIER = 1.5; // Veterans cost 1.5x standard upkeep.
export const VETERAN_TRAINING_NODE_TYPE: NodeType = 'FORTRESS'; // Veterans are trained at Fortresses.
export const VETERAN_TRAINING_TIME_TURNS = 2; // Takes 2 full turns to train.
export const VETERAN_TRAINING_MAT_COST = 10; // MAT cost per unit to begin training.
export const BATTLE_PROMOTION_RATIO = 5; // 1 in 5 surviving standard units in a battle are promoted.

// --- STRATEGIC DOCTRINE CONSTANTS ---
export const DOCTRINE_PHASE_INTERVAL = 5; // Doctrines are offered every 5 turns.
export const DOCTRINE_STANDARD_START_TURN = 20;
export const DOCTRINE_ANOMALOUS_START_TURN = 5;
export const DOCTRINE_STANDARD_LIMIT = 2;
export const DOCTRINE_LOW_TIER_COST = 250; // QR Cost
export const DOCTRINE_MEDIUM_TIER_COST = 500; // QR Cost
export const DOCTRINE_HIGH_TIER_COST = 1000; // QR Cost


// --- UI THEME COLORS ---
export const FACTION_COLORS: Record<PlayerId, { primary: string, nodeBg: string, text: string, border: string, actualHex?: string }> = {
  AXIOM: { primary: 'text-terminal-cyan', nodeBg: 'bg-cyan-600', text: 'text-cyan-300', border: 'border-cyan-500', actualHex: '#00FFFF' },
  'GEM-Q': { primary: 'text-terminal-red', nodeBg: 'bg-red-600', text: 'text-red-300', border: 'border-red-500', actualHex: '#FF003F' },
  NEUTRAL: { primary: 'text-terminal-gray', nodeBg: 'bg-gray-600', text: 'text-gray-300', border: 'border-gray-500', actualHex: '#808080' },
  COMMAND_CONSOLE: { primary: 'text-terminal-yellow', nodeBg: 'bg-yellow-700', text: 'text-yellow-300', border: 'border-yellow-500', actualHex: '#FFFF00'}
};

export const NEUTRAL_STRONGHOLD_COLORS = { primary: 'text-terminal-yellow', nodeBg: 'bg-yellow-500', text: 'text-yellow-300', border: 'border-yellow-400', actualHex: '#FFFF00' };
export const RECON_ARRAY_NEUTRAL_COLORS = { primary: 'text-purple-400', nodeBg: 'bg-purple-700', text: 'text-purple-300', border: 'border-purple-500', actualHex: '#A020F0' };


// --- Constants for noospheric-map-data.ts compatibility ---
export const AI1_NAME = 'GEM-Q';
export const AI2_NAME = 'AXIOM';
// --- End of Noospheric constants ---

// --- LYRIA MUSIC ENGINE CONSTANTS ---
export const LYRIA_MODEL_NAME = 'models/lyria-realtime-exp';
export const MAX_LYRIA_PROMPTS = 6;
export const LYRIA_PROMPT_COLORS = [ // Vibrant, distinct terminal-themed colors
  '#39FF14', // Terminal Green
  '#00FFFF', // Terminal Cyan
  '#FF003F', // Terminal Red
  '#FFFF00', // Terminal Yellow
  '#00BFFF', // Terminal Blue (Deep Sky Blue)
  '#FF00FF', // Magenta
];

export const INITIAL_LYRIA_PROMPTS = [
  { text: "post-rock full band wall of sound", weight: 1.00 },
  { text: "dotted eighth delay", weight: 1.30 },
  { text: "airy drums", weight: 1.30 },
  { text: "lofi-chillwave", weight: 1.30 },
  { text: "fender rhodes with room reverb", weight: 0.70 },
];

export const INITIAL_LYRIA_CONFIG: LiveMusicGenerationConfig = {
  temperature: 1.0,
  guidance: 4.0,
  density: 0.5,
  brightness: 0.5,
  bpm: 120,
  scale: GenAiScale.C_MAJOR_A_MINOR,
  muteBass: false,
  muteDrums: false,
  onlyBassAndDrums: false,
  seed: undefined, 
  topK: undefined, 
};

export const LYRIA_SCALES: { name: string, value: LyriaScale }[] = [ 
  { name: "Model Default", value: GenAiScale.SCALE_UNSPECIFIED }, 
  { name: "C Major / A Minor", value: GenAiScale.C_MAJOR_A_MINOR },
  { name: "D♭ Major / B♭ Minor", value: GenAiScale.D_FLAT_MAJOR_B_FLAT_MINOR },
  { name: "D Major / B Minor", value: GenAiScale.D_MAJOR_B_MINOR },
  { name: "E♭ Major / C Minor", value: GenAiScale.E_FLAT_MAJOR_C_MINOR },
  { name: "E Major / C♯/D♭ Minor", value: GenAiScale.E_MAJOR_D_FLAT_MINOR },
  { name: "F Major / D Minor", value: GenAiScale.F_MAJOR_D_MINOR },
  { name: "G♭ Major / E♭ Minor", value: GenAiScale.G_FLAT_MAJOR_E_FLAT_MINOR },
  { name: "G Major / E Minor", value: GenAiScale.G_MAJOR_E_MINOR },
  { name: "A♭ Major / F Minor", value: GenAiScale.A_FLAT_MAJOR_F_MINOR },
  { name: "A Major / F♯/G♭ Minor", value: GenAiScale.A_MAJOR_G_FLAT_MINOR },
  { name: "B♭ Major / G Minor", value: GenAiScale.B_FLAT_MAJOR_G_MINOR },
  { name: "B Major / G♯/A♭ Minor", value: GenAiScale.B_MAJOR_A_FLAT_MINOR },
];
// --- End of Lyria constants ---
