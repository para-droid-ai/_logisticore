"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMapData = getMapData;
const types_1 = require("../types");
const constants_1 = require("../constants");
const VOLGOGRAD_CAULDRON_NODES = [
    // AXIOM West
    { id: "CN-W", name: "Western Staging", type: "CN", mapPosition: { x: 10, y: 50 }, initialOwner: constants_1.AI2_ID, initialUnits: 25, labelOverride: "Western Staging", qrOutput: 10, MAT_output: 15, isCNOriginal: true, fortLevel: 1 }, // MaxUnits will be 100 by new global rule
    { id: "WSH", name: "West Supply Hub", type: "INDUSTRIAL_HUB", mapPosition: { x: 20, y: 35 }, initialOwner: constants_1.AI2_ID, initialUnits: 0, fortLevel: 1, labelOverride: "West Supply Hub", qrOutput: 8, MAT_output: 20 }, // MaxUnits will be 50
    { id: "WMP", name: "West Motor Pool", type: "STANDARD", mapPosition: { x: 20, y: 65 }, initialOwner: constants_1.AI2_ID, initialUnits: 0, labelOverride: "West Motor Pool", qrOutput: 5, MAT_output: 5 }, // MaxUnits will be 50
    { id: "FBD", name: "Recon Array Don", type: "RECON_ARRAY", mapPosition: { x: 30, y: 50 }, initialOwner: constants_1.NEUTRAL_ID, initialUnits: 5, labelOverride: "RA-Don", qrOutput: 0, MAT_output: 0 }, // MaxUnits will be 50 (was 15 in def)
    { id: "WG", name: "West Gate", type: "STANDARD", mapPosition: { x: 40, y: 50 }, initialOwner: constants_1.AI2_ID, initialUnits: 18, labelOverride: "West Gate", qrOutput: 5, MAT_output: 5 }, // MaxUnits will be 50
    { id: "BA", name: "Beketovka Approach", type: "STANDARD", mapPosition: { x: 45, y: 75 }, initialOwner: constants_1.AI2_ID, initialUnits: 1, labelOverride: "Beketovka Approach", qrOutput: 5, MAT_output: 5 }, // MaxUnits will be 50
    // Neutral Center & Strongpoints
    { id: "NS", name: "Northern Strongpoint", type: "FORTRESS", mapPosition: { x: 50, y: 15 }, initialOwner: constants_1.NEUTRAL_ID, initialUnits: 10, labelOverride: "Northern Strongpoint", qrOutput: 12, MAT_output: 10, fortLevel: 2 }, // MaxUnits will be 75 (was 40 in def)
    { id: "KA", name: "Kotluban Approach", type: "STANDARD", mapPosition: { x: 38, y: 25 }, initialOwner: constants_1.AI2_ID, initialUnits: 1, labelOverride: "Kotluban Approach", qrOutput: 5, MAT_output: 5 }, // MaxUnits will be 50
    { id: "NB", name: "North Bridge", type: "STANDARD", mapPosition: { x: 50, y: 35 }, initialOwner: constants_1.NEUTRAL_ID, initialUnits: 0, labelOverride: "North Bridge", qrOutput: 5, MAT_output: 0 }, // MaxUnits will be 50
    { id: "MK", name: "Mamayev Kurgan", type: "URBAN", mapPosition: { x: 50, y: 50 }, initialOwner: constants_1.NEUTRAL_ID, initialUnits: 5, labelOverride: "Mamayev Kurgan", qrOutput: 7, MAT_output: 10 }, // MaxUnits will be 50
    { id: "TF", name: "Tractor Factory", type: "INDUSTRIAL_HUB", mapPosition: { x: 58, y: 45 }, initialOwner: constants_1.NEUTRAL_ID, initialUnits: 5, labelOverride: "Tractor Factory", qrOutput: 8, MAT_output: 20 }, // MaxUnits will be 50
    { id: "OP", name: "October Plant", type: "INDUSTRIAL_HUB", mapPosition: { x: 62, y: 55 }, initialOwner: constants_1.NEUTRAL_ID, initialUnits: 5, labelOverride: "October Plant", qrOutput: 8, MAT_output: 20 }, // MaxUnits will be 50
    { id: "CS", name: "Central Station", type: "STANDARD", mapPosition: { x: 55, y: 60 }, initialOwner: constants_1.NEUTRAL_ID, initialUnits: 0, labelOverride: "Central Station", qrOutput: 5, MAT_output: 5 }, // MaxUnits will be 50
    { id: "SB", name: "South Bridge", type: "STANDARD", mapPosition: { x: 50, y: 68 }, initialOwner: constants_1.NEUTRAL_ID, initialUnits: 0, labelOverride: "South Bridge", qrOutput: 5, MAT_output: 0 }, // MaxUnits will be 50
    { id: "SS", name: "Southern Strongpoint", type: "FORTRESS", mapPosition: { x: 50, y: 85 }, initialOwner: constants_1.NEUTRAL_ID, initialUnits: 10, labelOverride: "Southern Strongpoint", qrOutput: 12, MAT_output: 10, fortLevel: 2 }, // MaxUnits will be 75 (was 40 in def)
    // GEM-Q East
    { id: "GH", name: "Gorodishche Heights", type: "STANDARD", mapPosition: { x: 65, y: 25 }, initialOwner: constants_1.AI1_ID, initialUnits: 6, labelOverride: "Gorodishche Heights", qrOutput: 5, MAT_output: 5 }, // MaxUnits will be 50
    { id: "EG", name: "East Gate", type: "STANDARD", mapPosition: { x: 70, y: 50 }, initialOwner: constants_1.AI1_ID, initialUnits: 9, labelOverride: "East Gate", qrOutput: 5, MAT_output: 5 }, // MaxUnits will be 50
    { id: "KR", name: "Krasnoarmeysk Ruins", type: "STANDARD", mapPosition: { x: 65, y: 75 }, initialOwner: constants_1.AI1_ID, initialUnits: 3, labelOverride: "Krasnoarmeysk Ruins", qrOutput: 5, MAT_output: 5 }, // MaxUnits will be 50
    { id: "FBV", name: "Recon Array Volga", type: "RECON_ARRAY", mapPosition: { x: 80, y: 50 }, initialOwner: constants_1.NEUTRAL_ID, initialUnits: 5, labelOverride: "RA-Volga", qrOutput: 0, MAT_output: 0 }, // MaxUnits will be 50 (was 15 in def)
    { id: "EMP", name: "East Motor Pool", type: "STANDARD", mapPosition: { x: 85, y: 65 }, initialOwner: constants_1.AI1_ID, initialUnits: 1, labelOverride: "East Motor Pool", qrOutput: 5, MAT_output: 5 }, // MaxUnits will be 50
    { id: "ESH", name: "East Supply Hub", type: "INDUSTRIAL_HUB", mapPosition: { x: 85, y: 35 }, initialOwner: constants_1.AI1_ID, initialUnits: 1, labelOverride: "East Supply Hub", qrOutput: 8, MAT_output: 20 }, // MaxUnits will be 50
    { id: "CN-E", name: "Eastern Staging", type: "CN", mapPosition: { x: 90, y: 50 }, initialOwner: constants_1.AI1_ID, initialUnits: 25, labelOverride: "Eastern Staging", qrOutput: 10, MAT_output: 15, isCNOriginal: true, fortLevel: 1 }, // MaxUnits will be 100
];
const VOLGOGRAD_CAULDRON_CONNECTIONS = [
    ["CN-W", "WSH"], ["CN-W", "WMP"], ["CN-W", "FBD"], ["WSH", "KA"], ["WSH", "FBD"], ["WMP", "FBD"], ["WMP", "BA"], ["FBD", "WG"], ["WG", "KA"], ["WG", "NB"], ["WG", "MK"], ["WG", "CS"], ["WG", "SB"], ["WG", "BA"], ["KA", "NS"], ["KA", "NB"], ["BA", "SB"], ["BA", "SS"], ["NS", "NB"], ["NS", "GH"], ["NB", "MK"], ["NB", "TF"], ["NB", "GH"], ["MK", "TF"], ["MK", "OP"], ["MK", "CS"], ["TF", "GH"], ["TF", "EG"], ["TF", "OP"], ["OP", "EG"], ["OP", "FBV"], ["OP", "CS"], ["CS", "SB"], ["CS", "KR"], ["CS", "EMP"], ["SB", "SS"], ["SB", "KR"], ["SS", "KR"], ["GH", "ESH"], ["GH", "EG"], ["EG", "ESH"], ["EG", "FBV"], ["KR", "FBV"], ["KR", "EMP"], ["FBV", "ESH"], ["FBV", "EMP"], ["FBV", "CN-E"], ["ESH", "CN-E"], ["EMP", "CN-E"],
];
const VOLGOGRAD_CAULDRON_DEFINITION = {
    name: "Volgograd Cauldron", ai1StartNodeId: "CN-E", ai2StartNodeId: "CN-W", viewBox: "0 0 100 100",
    nodes: VOLGOGRAD_CAULDRON_NODES, connections: VOLGOGRAD_CAULDRON_CONNECTIONS,
};
// --- Seraphim Grid Data ---
const SERAPHIM_GRID_NODES_RAW = [
    { "id": "A-CN", "name": "Alpha Core", "pos": { "x": 15, "y": 20 } }, { "id": "A-1", "name": "A-Perimeter 1", "pos": { "x": 10, "y": 30 } }, { "id": "A-2", "name": "A-Perimeter 2", "pos": { "x": 20, "y": 30 } }, { "id": "A-3", "name": "A-Relay", "pos": { "x": 15, "y": 40 } }, { "id": "A-4", "name": "Recon Array Alpha", "pos": { "x": 25, "y": 50 } }, { "id": "B-CN", "name": "Beta Core", "pos": { "x": 85, "y": 80 } }, { "id": "B-1", "name": "B-Perimeter 1", "pos": { "x": 90, "y": 70 } }, { "id": "B-2", "name": "B-Perimeter 2", "pos": { "x": 80, "y": 70 } }, { "id": "B-3", "name": "B-Relay", "pos": { "x": 85, "y": 60 } }, { "id": "B-4", "name": "Recon Array Beta", "pos": { "x": 75, "y": 50 } }, { "id": "G-KJ", "name": "Typhon Nexus", "pos": { "x": 50, "y": 50 } }, { "id": "G-1", "name": "G-Node 1", "pos": { "x": 45, "y": 45 } }, { "id": "G-2", "name": "G-Node 2", "pos": { "x": 55, "y": 45 } }, { "id": "G-3", "name": "G-Node 3", "pos": { "x": 55, "y": 55 } }, { "id": "G-4", "name": "G-Node 4", "pos": { "x": 45, "y": 55 } }, { "id": "G-5", "name": "G-Firewall N", "pos": { "x": 50, "y": 35 } }, { "id": "G-6", "name": "G-Firewall S", "pos": { "x": 50, "y": 65 } }, { "id": "D-KJ", "name": "Orion Arm", "pos": { "x": 50, "y": 15 } }, { "id": "D-1", "name": "D-Hub", "pos": { "x": 40, "y": 15 } }, { "id": "D-2", "name": "D-Anchor", "pos": { "x": 60, "y": 15 } }, { "id": "D-3", "name": "D-Echo 1", "pos": { "x": 45, "y": 5 } }, { "id": "D-4", "name": "D-Echo 2", "pos": { "x": 55, "y": 5 } }, { "id": "D-5", "name": "D-Deep Relay", "pos": { "x": 70, "y": 10 } }, { "id": "D-6", "name": "D-Spur", "pos": { "x": 30, "y": 10 } }, { "id": "E-KJ", "name": "Hydra Maw", "pos": { "x": 50, "y": 85 } }, { "id": "E-1", "name": "E-Hub", "pos": { "x": 40, "y": 85 } }, { "id": "E-2", "name": "E-Anchor", "pos": { "x": 60, "y": 85 } }, { "id": "E-3", "name": "E-Echo 1", "pos": { "x": 45, "y": 95 } }, { "id": "E-4", "name": "E-Echo 2", "pos": { "x": 55, "y": 95 } }, { "id": "E-5", "name": "E-Deep Relay", "pos": { "x": 30, "y": 90 } }, { "id": "E-6", "name": "E-Spur", "pos": { "x": 70, "y": 90 } }, { "id": "OR-1", "name": "Void Anomaly", "pos": { "x": 5, "y": 5 } }, { "id": "OR-2", "name": "Rogue Datastream", "pos": { "x": 95, "y": 5 } }, { "id": "OR-3", "name": "Forgotten Archive", "pos": { "x": 5, "y": 95 } }, { "id": "OR-4", "name": "Abyssal Node", "pos": { "x": 95, "y": 95 } }
];
const SERAPHIM_GRID_CONNECTIONS_RAW = [
    ["A-CN", "A-1"], ["A-CN", "A-2"], ["A-1", "A-3"], ["A-2", "A-3"], ["A-3", "A-4"], ["B-CN", "B-1"], ["B-CN", "B-2"], ["B-1", "B-3"], ["B-2", "B-3"], ["B-3", "B-4"], ["G-KJ", "G-1"], ["G-KJ", "G-2"], ["G-KJ", "G-3"], ["G-KJ", "G-4"], ["G-1", "G-2"], ["G-2", "G-3"], ["G-3", "G-4"], ["G-4", "G-1"], ["G-1", "G-5"], ["G-2", "G-5"], ["G-3", "G-6"], ["G-4", "G-6"], ["D-KJ", "D-1"], ["D-KJ", "D-2"], ["D-1", "D-3"], ["D-2", "D-4"], ["D-3", "D-4"], ["D-1", "D-6"], ["D-2", "D-5"], ["E-KJ", "E-1"], ["E-KJ", "E-2"], ["E-1", "E-3"], ["E-2", "E-4"], ["E-3", "E-4"], ["E-1", "E-5"], ["E-2", "E-6"], ["A-4", "G-4"], ["A-4", "G-1"], ["B-4", "G-2"], ["B-4", "G-3"], ["G-5", "D-KJ"], ["G-6", "E-KJ"], ["D-6", "OR-1"], ["D-5", "OR-2"], ["E-5", "OR-3"], ["E-6", "OR-4"], ["A-1", "OR-1"], ["A-1", "OR-3"], ["B-1", "OR-2"], ["B-1", "OR-4"], ["A-4", "G-5"], ["B-4", "G-6"],
];
const SERAPHIM_GRID_NODES = SERAPHIM_GRID_NODES_RAW.map(n => {
    let logisticoreType;
    let initialOwner = constants_1.NEUTRAL_ID;
    let initialUnits = 0;
    let qrOutput = 0;
    let MAT_output = 0;
    let isKJOriginal = false;
    let isCNOriginal = false;
    let fortLevel = 0;
    let labelOverride = n.id;
    if (n.id === "A-4") {
        logisticoreType = 'RECON_ARRAY';
        initialOwner = constants_1.NEUTRAL_ID;
        initialUnits = 5;
        qrOutput = 0;
        MAT_output = 0;
        labelOverride = "RA-Alpha";
    } // maxUnits will be 50
    else if (n.id === "B-4") {
        logisticoreType = 'RECON_ARRAY';
        initialOwner = constants_1.NEUTRAL_ID;
        initialUnits = 5;
        qrOutput = 0;
        MAT_output = 0;
        labelOverride = "RA-Beta";
    } // maxUnits will be 50
    else if (n.id.includes('-CN')) {
        logisticoreType = 'CN';
        isCNOriginal = true;
        initialOwner = n.id === 'A-CN' ? constants_1.AI1_ID : (n.id === 'B-CN' ? constants_1.AI2_ID : constants_1.NEUTRAL_ID);
        initialUnits = 25;
        qrOutput = 10;
        MAT_output = 15;
        fortLevel = 1;
    } // maxUnits will be 100
    else if (n.id.includes('-KJ')) {
        logisticoreType = 'INDUSTRIAL_HUB';
        isKJOriginal = true;
        if (["G-KJ", "D-KJ", "E-KJ"].includes(n.id)) {
            initialOwner = constants_1.NEUTRAL_ID;
            initialUnits = 5;
        }
        MAT_output = 20;
        qrOutput = 8;
    } // maxUnits will be 50
    else {
        logisticoreType = 'QN';
        initialUnits = 0;
        qrOutput = 15;
        MAT_output = 0;
    } // QN maxUnits will be 20 (default) or map-specific
    return { id: n.id, name: n.name, type: logisticoreType, mapPosition: n.pos, initialOwner, initialUnits, qrOutput, MAT_output, labelOverride, isKJOriginal, isCNOriginal, fortLevel, };
});
const SERAPHIM_GRID_DEFINITION = {
    name: "The Seraphim Grid", ai1StartNodeId: "A-CN", ai2StartNodeId: "B-CN", viewBox: "-5 -5 110 110", // Adjusted viewBox
    nodes: SERAPHIM_GRID_NODES, connections: SERAPHIM_GRID_CONNECTIONS_RAW,
};
// --- Twin Peaks ---
const TWIN_PEAKS_NODES_RAW = [
    { id: "TP_N1", name: "GEM-Q Base", type: 'CN', connections_orig: ["TP_N3", "TP_KJ1"], qrOutput: 10, mapPosition: { x: 15, y: 50 }, initialOwner: 'GEM-Q', initialUnits: 25, fortLevel: 1, MAT_output: 15 },
    { id: "TP_N2", name: "AXIOM Base", type: 'CN', connections_orig: ["TP_N4", "TP_KJ2"], qrOutput: 10, mapPosition: { x: 85, y: 50 }, initialOwner: 'AXIOM', initialUnits: 25, fortLevel: 1, MAT_output: 15 },
    { id: "TP_N3", name: "GEM-Q Outpost", type: 'INDUSTRIAL_HUB', connections_orig: ["TP_N1", "TP_N5"], qrOutput: 8, mapPosition: { x: 30, y: 30 }, initialOwner: 'GEM-Q', initialUnits: 8, fortLevel: 0, MAT_output: 20 },
    { id: "TP_N4", name: "AXIOM Outpost", type: 'INDUSTRIAL_HUB', connections_orig: ["TP_N2", "TP_N6"], qrOutput: 8, mapPosition: { x: 70, y: 30 }, initialOwner: 'AXIOM', initialUnits: 8, fortLevel: 0, MAT_output: 20 },
    { id: "TP_N5", name: "Upper Bridge", type: 'URBAN', connections_orig: ["TP_N3", "TP_N6", "TP_KJ1"], qrOutput: 7, mapPosition: { x: 50, y: 20 }, initialOwner: 'NEUTRAL', initialUnits: 5, fortLevel: 0, MAT_output: 10 },
    { id: "TP_N6", name: "Lower Bridge", type: 'URBAN', connections_orig: ["TP_N4", "TP_N5", "TP_KJ2"], qrOutput: 7, mapPosition: { x: 50, y: 80 }, initialOwner: 'NEUTRAL', initialUnits: 5, fortLevel: 0, MAT_output: 10 },
    { id: "TP_KJ1", name: "North Fortress", type: 'FORTRESS', connections_orig: ["TP_N1", "TP_N5"], qrOutput: 12, mapPosition: { x: 35, y: 70 }, initialOwner: 'NEUTRAL', initialUnits: 12, fortLevel: 1, MAT_output: 10 },
    { id: "TP_KJ2", name: "South Fortress", type: 'FORTRESS', connections_orig: ["TP_N2", "TP_N6"], qrOutput: 12, mapPosition: { x: 65, y: 70 }, initialOwner: 'NEUTRAL', initialUnits: 12, fortLevel: 1, MAT_output: 10 },
];
const TWIN_PEAKS_NODES = TWIN_PEAKS_NODES_RAW.map(n => ({
    id: n.id, name: n.name, type: n.type, mapPosition: n.mapPosition,
    initialOwner: n.initialOwner, initialUnits: n.initialUnits, qrOutput: n.qrOutput, fortLevel: n.fortLevel,
    labelOverride: n.name, MAT_output: n.MAT_output // MaxUnits will be determined by global rules
}));
const TWIN_PEAKS_CONNECTIONS = TWIN_PEAKS_NODES_RAW.flatMap(n => n.connections_orig.map(c => [n.id, c]));
const TWIN_PEAKS_DEFINITION = {
    name: "Twin Peaks", ai1StartNodeId: "TP_N1", ai2StartNodeId: "TP_N2", viewBox: "0 0 100 100",
    nodes: TWIN_PEAKS_NODES, connections: TWIN_PEAKS_CONNECTIONS,
};
// --- Classic Lattice ---
const CLASSIC_LATTICE_NODES_RAW = [
    { id: "N1", name: "GEM-Q CN", type: 'CN', connections_orig: ["N3", "N8", "N5"], qrOutput: 10, mapPosition: { x: 10, y: 30 }, initialOwner: 'GEM-Q', initialUnits: 25, fortLevel: 1, MAT_output: 15 },
    { id: "N2", name: "AXIOM CN", type: 'CN', connections_orig: ["N7", "N12", "N5"], qrOutput: 10, mapPosition: { x: 90, y: 30 }, initialOwner: 'AXIOM', initialUnits: 25, fortLevel: 1, MAT_output: 15 },
    { id: "N3", name: "Peri-Alpha", type: 'INDUSTRIAL_HUB', connections_orig: ["N1", "N5", "N6", "N8", "N9"], qrOutput: 8, mapPosition: { x: 30, y: 50 }, initialOwner: 'GEM-Q', initialUnits: 8, fortLevel: 0, MAT_output: 20 },
    { id: "N5", name: "Fortress Vega", type: 'FORTRESS', connections_orig: ["N1", "N2", "N3", "N6", "N7"], qrOutput: 12, mapPosition: { x: 50, y: 10 }, initialOwner: 'NEUTRAL', initialUnits: 12, fortLevel: 1, MAT_output: 10 },
    { id: "N6", name: "Fortress Nexus", type: 'FORTRESS', connections_orig: ["N3", "N5", "N7", "N9", "N10", "N11"], qrOutput: 12, mapPosition: { x: 50, y: 50 }, initialOwner: 'NEUTRAL', initialUnits: 15, fortLevel: 1, MAT_output: 10 },
    { id: "N7", name: "Peri-Beta", type: 'INDUSTRIAL_HUB', connections_orig: ["N2", "N5", "N6", "N11", "N12"], qrOutput: 8, mapPosition: { x: 70, y: 50 }, initialOwner: 'AXIOM', initialUnits: 8, fortLevel: 0, MAT_output: 20 },
    { id: "N8", name: "Quad Gamma", type: 'QN', connections_orig: ["N1", "N3", "N9", "N13"], qrOutput: 15, mapPosition: { x: 10, y: 50 }, initialOwner: 'GEM-Q', initialUnits: 5, fortLevel: 0, MAT_output: 0 },
    { id: "N9", name: "X-Link Delta (Urban)", type: 'URBAN', connections_orig: ["N3", "N6", "N8", "N10", "N13"], qrOutput: 7, mapPosition: { x: 30, y: 70 }, initialOwner: 'NEUTRAL', initialUnits: 5, fortLevel: 0, MAT_output: 10 },
    { id: "N10", name: "Fortress Sirius", type: 'FORTRESS', connections_orig: ["N6", "N9", "N11", "N13", "N14"], qrOutput: 12, mapPosition: { x: 50, y: 90 }, initialOwner: 'NEUTRAL', initialUnits: 12, fortLevel: 1, MAT_output: 10 },
    { id: "N11", name: "X-Link Zeta (Urban)", type: 'URBAN', connections_orig: ["N7", "N6", "N10", "N12", "N14"], qrOutput: 7, mapPosition: { x: 70, y: 70 }, initialOwner: 'NEUTRAL', initialUnits: 5, fortLevel: 0, MAT_output: 10 },
    { id: "N12", name: "Quad Eta", type: 'QN', connections_orig: ["N2", "N7", "N11", "N14"], qrOutput: 15, mapPosition: { x: 90, y: 50 }, initialOwner: 'AXIOM', initialUnits: 5, fortLevel: 0, MAT_output: 0 },
    { id: "N13", name: "Core Theta", type: 'QN', connections_orig: ["N8", "N9", "N10"], qrOutput: 15, mapPosition: { x: 10, y: 70 }, initialOwner: 'NEUTRAL', initialUnits: 0, fortLevel: 0, MAT_output: 0 },
    { id: "N14", name: "Core Iota", type: 'QN', connections_orig: ["N10", "N11", "N12"], qrOutput: 15, mapPosition: { x: 90, y: 70 }, initialOwner: 'NEUTRAL', initialUnits: 0, fortLevel: 0, MAT_output: 0 },
];
const CLASSIC_LATTICE_NODES = CLASSIC_LATTICE_NODES_RAW.map(n => ({
    id: n.id, name: n.name, type: n.type, mapPosition: n.mapPosition,
    initialOwner: n.initialOwner, initialUnits: n.initialUnits, qrOutput: n.qrOutput,
    labelOverride: n.name, MAT_output: n.MAT_output, fortLevel: n.fortLevel || 0 // MaxUnits will be determined by global rules
}));
const CLASSIC_LATTICE_CONNECTIONS = CLASSIC_LATTICE_NODES_RAW.flatMap(n => n.connections_orig.map(c => [n.id, c]));
const CLASSIC_LATTICE_DEFINITION = {
    name: "Classic Lattice", ai1StartNodeId: "N1", ai2StartNodeId: "N2", viewBox: "0 0 100 100",
    nodes: CLASSIC_LATTICE_NODES, connections: CLASSIC_LATTICE_CONNECTIONS,
};
// --- The Tartarus Anomaly ---
const TARTARUS_ANOMALY_NODES_RAW = [
    { id: "N3", type: "CN", name: "Elysian Fields (CN)", connections_orig: ["N2", "N0", "N9"], qrOutput: 10, mapPosition: { "x": 30, "y": 100 }, initialOwner: 'GEM-Q', initialUnits: 25, fortLevel: 1, MAT_output: 15 },
    { id: "N10", type: "CN", name: "Asphodel Meadows (CN)", connections_orig: ["N11", "N23", "N34"], qrOutput: 10, mapPosition: { "x": 170, "y": 100 }, initialOwner: 'AXIOM', initialUnits: 25, fortLevel: 1, MAT_output: 15 },
    { id: "N20", type: "FORTRESS", name: "Styx Terminus (F)", connections_orig: ["N32", "N33", "N31", "N30"], qrOutput: 12, mapPosition: { "x": 100, "y": 125 }, initialOwner: 'NEUTRAL', initialUnits: 15, fortLevel: 1, MAT_output: 10 },
    { id: "N21", type: "FORTRESS", name: "Lethe Confluence (F)", connections_orig: ["N30", "N31", "N29", "N28"], qrOutput: 12, mapPosition: { "x": 100, "y": 75 }, initialOwner: 'NEUTRAL', initialUnits: 15, fortLevel: 1, MAT_output: 10 },
    { id: "N22", type: "FORTRESS", name: "Acheron Gate (F)", connections_orig: ["N32", "N33", "N27", "N6"], qrOutput: 12, mapPosition: { "x": 100, "y": 175 }, initialOwner: 'NEUTRAL', initialUnits: 15, fortLevel: 1, MAT_output: 10 },
    { id: "N0", type: "QN", name: "Persephone's Gate", connections_orig: ["N3", "N29"], qrOutput: 15, mapPosition: { "x": 45, "y": 75 }, initialOwner: 'GEM-Q', initialUnits: 8, fortLevel: 0, MAT_output: 0 },
    { id: "N2", type: "INDUSTRIAL_HUB", name: "Hecate's Veil (IH)", connections_orig: ["N3", "N9", "N7", "N6", "N29"], qrOutput: 8, mapPosition: { "x": 45, "y": 125 }, initialOwner: 'GEM-Q', initialUnits: 5, fortLevel: 0, MAT_output: 20 },
    { id: "N6", type: "URBAN", name: "Orpheus Relay (U)", connections_orig: ["N8", "N7", "N2", "N22"], qrOutput: 7, mapPosition: { "x": 80, "y": 165 }, initialOwner: 'NEUTRAL', initialUnits: 5, fortLevel: 0, MAT_output: 10 },
    { id: "N7", type: "QN", name: "The Charon Relay", connections_orig: ["N2", "N6", "N29", "N30", "N32"], qrOutput: 15, mapPosition: { "x": 80, "y": 115 }, initialOwner: 'NEUTRAL', initialUnits: 3, fortLevel: 0, MAT_output: 0 },
    { id: "N8", type: "QN", name: "Eurydice's Hope", connections_orig: ["N9", "N6"], qrOutput: 15, mapPosition: { "x": 35, "y": 170 }, initialOwner: 'NEUTRAL', initialUnits: 0, fortLevel: 0, MAT_output: 0 },
    { id: "N9", type: "QN", name: "Nyx's Approach", connections_orig: ["N2", "N8", "N3"], qrOutput: 15, mapPosition: { "x": 15, "y": 135 }, initialOwner: 'GEM-Q', initialUnits: 5, fortLevel: 0, MAT_output: 0 },
    { id: "N11", type: "INDUSTRIAL_HUB", name: "Erebus Expanse (IH)", connections_orig: ["N10", "N23", "N25"], qrOutput: 8, mapPosition: { "x": 180, "y": 125 }, initialOwner: 'AXIOM', initialUnits: 5, fortLevel: 0, MAT_output: 20 },
    { id: "N23", type: "QN", name: "Hypnos Channel", connections_orig: ["N10", "N26", "N11", "N27", "N28"], qrOutput: 15, mapPosition: { "x": 155, "y": 120 }, initialOwner: 'AXIOM', initialUnits: 3, fortLevel: 0, MAT_output: 0 },
    { id: "N25", type: "QN", name: "Morpheus Drift", connections_orig: ["N11", "N27"], qrOutput: 15, mapPosition: { "x": 175, "y": 150 }, initialOwner: 'NEUTRAL', initialUnits: 0, fortLevel: 0, MAT_output: 0 },
    { id: "N26", type: "QN", name: "Thanatos Link", connections_orig: ["N23", "N27", "N28", "N31", "N33"], qrOutput: 15, mapPosition: { "x": 120, "y": 110 }, initialOwner: 'NEUTRAL', initialUnits: 3, fortLevel: 0, MAT_output: 0 },
    { id: "N27", type: "URBAN", name: "The Phlegethon (U)", connections_orig: ["N25", "N23", "N26", "N22"], qrOutput: 7, mapPosition: { "x": 120, "y": 165 }, initialOwner: 'NEUTRAL', initialUnits: 5, fortLevel: 0, MAT_output: 10 },
    { id: "N28", type: "QN", name: "The Cocytus", connections_orig: ["N26", "N23", "N34", "N21"], qrOutput: 15, mapPosition: { "x": 135, "y": 65 }, initialOwner: 'NEUTRAL', initialUnits: 3, fortLevel: 0, MAT_output: 0 },
    { id: "N29", type: "QN", name: "Hades' Crossing", connections_orig: ["N0", "N7", "N2", "N21"], qrOutput: 15, mapPosition: { "x": 80, "y": 65 }, initialOwner: 'NEUTRAL', initialUnits: 3, fortLevel: 0, MAT_output: 0 },
    { id: "N30", type: "QN", name: "Tartarus Breach", connections_orig: ["N21", "N20", "N7"], qrOutput: 15, mapPosition: { "x": 90, "y": 90 }, initialOwner: 'NEUTRAL', initialUnits: 0, fortLevel: 0, MAT_output: 0 },
    { id: "N31", type: "QN", name: "Cerberus Watch", connections_orig: ["N21", "N26", "N20", "N28"], qrOutput: 15, mapPosition: { "x": 115, "y": 90 }, initialOwner: 'NEUTRAL', initialUnits: 0, fortLevel: 0, MAT_output: 0 },
    { id: "N32", type: "QN", name: "Sisyphus Loop", connections_orig: ["N20", "N22", "N7"], qrOutput: 15, mapPosition: { "x": 90, "y": 145 }, initialOwner: 'NEUTRAL', initialUnits: 0, fortLevel: 0, MAT_output: 0 },
    { id: "N33", type: "QN", name: "Tantalus Reach", connections_orig: ["N20", "N22", "N26"], qrOutput: 15, mapPosition: { "x": 110, "y": 145 }, initialOwner: 'NEUTRAL', initialUnits: 0, fortLevel: 0, MAT_output: 0 },
    { id: "N34", type: "QN", name: "The Furies", connections_orig: ["N28", "N10"], qrOutput: 15, mapPosition: { "x": 165, "y": 75 }, initialOwner: 'AXIOM', initialUnits: 8, fortLevel: 0, MAT_output: 0 }
];
const TARTARUS_ANOMALY_NODES = TARTARUS_ANOMALY_NODES_RAW.map(n => ({
    id: n.id, name: n.name, type: n.type, mapPosition: n.mapPosition,
    initialOwner: n.initialOwner, initialUnits: n.initialUnits, qrOutput: n.qrOutput,
    labelOverride: n.name, MAT_output: n.MAT_output, fortLevel: n.fortLevel || 0 // MaxUnits will be determined by global rules
}));
const TARTARUS_ANOMALY_CONNECTIONS = TARTARUS_ANOMALY_NODES_RAW.flatMap(n => n.connections_orig.map(c => [n.id, c]));
const TARTARUS_ANOMALY_DEFINITION = {
    name: "The Tartarus Anomaly", ai1StartNodeId: "N3", ai2StartNodeId: "N10", viewBox: "0 0 200 200",
    nodes: TARTARUS_ANOMALY_NODES, connections: TARTARUS_ANOMALY_CONNECTIONS,
};
function getMapData(mapType, isFogOfWarActive) {
    const MAP_DEFINITIONS = {
        [types_1.MapType.VOLGOGRAD_CAULDRON]: VOLGOGRAD_CAULDRON_DEFINITION,
        [types_1.MapType.SERAPHIM_GRID]: SERAPHIM_GRID_DEFINITION,
        [types_1.MapType.TWIN_PEAKS]: TWIN_PEAKS_DEFINITION,
        [types_1.MapType.CLASSIC_LATTICE]: CLASSIC_LATTICE_DEFINITION,
        [types_1.MapType.TARTARUS_ANOMALY]: TARTARUS_ANOMALY_DEFINITION,
    };
    // console.log('[LOG] getMapData called. isFogOfWarActive parameter:', isFogOfWarActive, 'MapType:', mapType);
    let mapDef = MAP_DEFINITIONS[mapType];
    if (!mapDef) {
        console.warn(`Unknown map type: ${mapType}, defaulting to Volgograd Cauldron.`);
        mapDef = VOLGOGRAD_CAULDRON_DEFINITION;
    }
    const transformedNodes = {};
    const allConnections = {};
    let minX = 0, minY = 0, viewBoxWidth = 100, viewBoxHeight = 100;
    if (mapDef.viewBox) {
        const parts = mapDef.viewBox.split(' ').map(parseFloat);
        if (parts.length === 4 && !parts.some(isNaN)) {
            minX = parts[0];
            minY = parts[1];
            viewBoxWidth = parts[2];
            viewBoxHeight = parts[3];
            if (viewBoxWidth <= 0)
                viewBoxWidth = 100; // Default width if invalid
            if (viewBoxHeight <= 0)
                viewBoxHeight = 100; // Default height if invalid
        }
        else {
            console.warn(`Invalid viewBox format: "${mapDef.viewBox}". Defaulting to "0 0 100 100".`);
            minX = 0;
            minY = 0;
            viewBoxWidth = 100;
            viewBoxHeight = 100;
        }
    }
    mapDef.connections.forEach(([a, b]) => {
        if (!allConnections[a])
            allConnections[a] = [];
        if (!allConnections[b])
            allConnections[b] = [];
        if (!allConnections[a].includes(b))
            allConnections[a].push(b);
        if (!allConnections[b].includes(a))
            allConnections[b].push(a);
    });
    mapDef.nodes.forEach(nodeDef => {
        let finalOwner;
        let finalStandardUnits;
        let finalFortLevel;
        if (isFogOfWarActive) {
            finalOwner = constants_1.NEUTRAL_ID;
            finalStandardUnits = 0;
            finalFortLevel = 0;
            let isPlayerCN = false;
            if (mapDef.ai1StartNodeId === nodeDef.id) {
                finalOwner = constants_1.AI1_ID;
                finalStandardUnits = nodeDef.initialUnits !== undefined ? nodeDef.initialUnits : 25; // Updated default
                isPlayerCN = true;
                finalFortLevel = nodeDef.fortLevel !== undefined ? nodeDef.fortLevel : 1;
            }
            else if (mapDef.ai2StartNodeId === nodeDef.id) {
                finalOwner = constants_1.AI2_ID;
                finalStandardUnits = nodeDef.initialUnits !== undefined ? nodeDef.initialUnits : 25; // Updated default
                isPlayerCN = true;
                finalFortLevel = nodeDef.fortLevel !== undefined ? nodeDef.fortLevel : 1;
            }
            if (nodeDef.type === 'RECON_ARRAY') {
                finalOwner = constants_1.NEUTRAL_ID;
                finalStandardUnits = nodeDef.initialUnits || 5;
                finalFortLevel = nodeDef.fortLevel || 0;
            }
            else if (!isPlayerCN) {
                const significantNeutralTypes = ['INDUSTRIAL_HUB', 'FORTRESS', 'URBAN', 'CN', 'QN'];
                if ((nodeDef.initialUnits && nodeDef.initialUnits > 0) &&
                    (significantNeutralTypes.includes(nodeDef.type) || (mapType === types_1.MapType.SERAPHIM_GRID && nodeDef.isKJOriginal))) {
                    finalOwner = constants_1.NEUTRAL_ID;
                    finalStandardUnits = nodeDef.initialUnits;
                    finalFortLevel = nodeDef.fortLevel || 0;
                }
            }
        }
        else {
            finalOwner = nodeDef.initialOwner || constants_1.NEUTRAL_ID;
            finalStandardUnits = nodeDef.initialUnits || 0;
            finalFortLevel = nodeDef.fortLevel || 0;
        }
        const normalizedX = ((nodeDef.mapPosition.x - minX) / viewBoxWidth) * 100;
        const normalizedY = ((nodeDef.mapPosition.y - minY) / viewBoxHeight) * 100;
        const defaultQrOutput = nodeDef.type === 'CN' ? 10 :
            nodeDef.type === 'QN' ? 15 :
                nodeDef.type === 'FORTRESS' ? (nodeDef.qrOutput !== undefined ? nodeDef.qrOutput : 12) : // Default for FORTRESS if not set
                    nodeDef.type === 'INDUSTRIAL_HUB' ? 8 :
                        nodeDef.type === 'URBAN' ? 7 :
                            nodeDef.type === 'STANDARD' ? 5 :
                                nodeDef.type === 'RECON_ARRAY' ? 0 :
                                    0;
        const defaultMATOutput = nodeDef.type === 'CN' ? 15 : // Updated from 5 to 15
            nodeDef.type === 'INDUSTRIAL_HUB' ? 20 :
                nodeDef.type === 'URBAN' ? 10 :
                    nodeDef.type === 'FORTRESS' ? (nodeDef.MAT_output !== undefined ? nodeDef.MAT_output : 10) : // Default for FORTRESS if not set
                        nodeDef.type === 'STANDARD' ? 5 :
                            nodeDef.type === 'RECON_ARRAY' ? 0 :
                                0;
        const maxHP = finalFortLevel * constants_1.FORT_HP_PER_LEVEL;
        let newMaxUnitsValue;
        if (nodeDef.type === 'CN') {
            newMaxUnitsValue = 100;
        }
        else if (nodeDef.type === 'FORTRESS') {
            newMaxUnitsValue = 75;
        }
        else if (['INDUSTRIAL_HUB', 'URBAN', 'STANDARD', 'RECON_ARRAY'].includes(nodeDef.type)) {
            newMaxUnitsValue = 50;
        }
        else {
            // For types not explicitly re-balanced by user (e.g. QN), use map definition's value if present, or a fallback.
            // The `nodeDef.maxUnits` comes from the specific map definition arrays like VOLGOGRAD_CAULDRON_NODES.
            // If a map definition for a QN doesn't specify `maxUnits`, it defaults to 20.
            newMaxUnitsValue = nodeDef.maxUnits !== undefined ? nodeDef.maxUnits : 20;
        }
        transformedNodes[nodeDef.id] = {
            id: nodeDef.id,
            label: nodeDef.labelOverride || nodeDef.name.substring(0, 10),
            regionName: nodeDef.name,
            owner: finalOwner,
            standardUnits: finalStandardUnits,
            evolvedUnits: 0,
            qrOutput: nodeDef.qrOutput !== undefined ? nodeDef.qrOutput : defaultQrOutput,
            isKJ: nodeDef.type === 'INDUSTRIAL_HUB' && (nodeDef.isKJOriginal === true),
            isCN: nodeDef.type === 'CN',
            nodeType: nodeDef.type,
            x: normalizedX,
            y: normalizedY,
            connections: allConnections[nodeDef.id] || [],
            maxUnits: newMaxUnitsValue, // Use the newly determined max units
            MAT_output: nodeDef.MAT_output !== undefined ? nodeDef.MAT_output : defaultMATOutput,
            MAT_stockpile: 0,
            max_MAT_stockpile: nodeDef.type === 'CN' ? 1000 : (nodeDef.type === 'INDUSTRIAL_HUB' ? 500 : (nodeDef.type === 'RECON_ARRAY' ? 100 : 200)),
            fortificationLevel: finalFortLevel,
            fortificationHP: maxHP, // Start at full HP for the initial level
            maxFortificationHP: maxHP, // Max HP is based on the initial level
            artilleryGarrison: 0,
            infiltratorUnits: {}, // Initialize infiltrator tracking
            suppression: 0,
            alarmLevel: 0, // Initialize alarm level
            interdictedTurns: 0,
            lowSupply: false,
        };
    });
    return transformedNodes;
}
