"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapType = exports.GenAiScale = void 0;
var genai_1 = require("@google/genai"); // Export the enum object directly
Object.defineProperty(exports, "GenAiScale", { enumerable: true, get: function () { return genai_1.Scale; } });
var MapType;
(function (MapType) {
    MapType["VOLGOGRAD_CAULDRON"] = "VOLGOGRAD_CAULDRON";
    MapType["SERAPHIM_GRID"] = "SERAPHIM_GRID";
    MapType["TWIN_PEAKS"] = "TWIN_PEAKS";
    MapType["CLASSIC_LATTICE"] = "CLASSIC_LATTICE";
    MapType["TARTARUS_ANOMALY"] = "TARTARUS_ANOMALY";
})(MapType || (exports.MapType = MapType = {}));
