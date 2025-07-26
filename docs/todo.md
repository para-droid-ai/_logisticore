# Logisticore: The Attrition Doctrine - TODO & Roadmap

This document tracks development progress, current issues, and planned features for the Logisticore application, informed by game simulations and AI performance analysis.

## I. Current State & Key Findings (from T43 Log Analysis - Volgograd Cauldron)

This section summarizes insights from the detailed 43-turn game log provided (map assumed to be Volgograd Cauldron).

**A. Overall Game State (at T43 End of Log):**
*   **GEM-Q is in a commanding position.**
    *   **Territory (Approx.):** GEM-Q controls ~11 nodes (CN-E, ESH, EMP, FBV, OP, TF, SS, NS, KA, GH, EG). AXIOM controls ~8 nodes (CN-W, WSH, WMP, FBD, WG, BA, NB, MK).
    *   **Economy (Est. Income):** GEM-Q ~115 MAT/turn vs. AXIOM ~70 MAT/turn.
    *   **MAT Stockpile (End of T42 Upkeep):** GEM-Q 420.50, AXIOM 305.00.
    *   **Fortifications:** GEM-Q: CN-E (L5), NS (L3), SS (L3). AXIOM: CN-W (L2).
*   **Conclusion:** GEM-Q leads due to superior economic control, broader territorial expansion, and more significant fortification efforts.

**B. Mechanics Functioning Well / As Intended:**
*   **Starting Economy:** CN MAT Output at 15 provides a stable early game.
*   **QR Generation:** 10 QR/node in the largest connected network is working.
*   **Automatic Reinforcements (Core Logic):** Base unit generation (5 units/node), CN capacity (75 units), and basic overflow are generally functional (see T9 Anomaly in Issues).
*   **Combat Resolution:** Battles resolve via attrition without arbitrary round limits.
*   **Reconnaissance System:** Capture, activation (costs correct), pulse (costs correct), and upkeep for active arrays appear functional. AI uses pulse intel. Upkeep seems to be for BUILT fort levels and active RAs.
*   **AI Fortification Building (Basic):** Both AIs used `BUILD_FORTIFICATIONS` (GEM-Q more, on CNs & Fortresses).
*   **Fog of War (FoW):** Core visibility logic and AI operation under FoW are in place.
*   **Core Game Loop & UI:** Save/Load, Model Selector, Multi-Map, Lyria (Phase 1), UI Panels generally functional.
*   **Fortification HP System:** Damage, repair, upgrade, and combat bonus integration functioning.
*   **Artillery & Infiltrator Systems (Core Actions):** Actions for purchase, movement, strikes (artillery), training, and sabotage (infiltrators) are implemented. AI is being prompted to use them.
*   **KPI Tracking:** Backend data points for new KPIs (Fort HP repair, Artillery ammo/kills, Sabotage success/drain) are integrated.

**C. Mechanics & AI Behavior Requiring Urgent Attention / Improvement (Ongoing Observation):**
*   **AI Capacity Management for Reinforcements:** Both AIs frequently lose reinforcements due to full nodes. (Improved, but needs ongoing monitoring)
*   **AI Target Fixation & Strategic Rigidity:** AIs (especially AXIOM) can get stuck attacking the same nodes repeatedly without adapting strategy or force composition. (Ongoing AI prompt refinement)
*   **AI Fortification Strategy Scope:** Needs broader application beyond just CNs/existing Fortresses (e.g., to key IHs). (Ongoing AI prompt refinement)
*   **AI Economic Prudence for Recon Pulses:** AI sometimes overuses costly pulses in poor economic states. (Improved, but needs ongoing monitoring)
*   **AI Utilization of Artillery & Infiltrators:** While systems are active, ensuring AI makes *strategically optimal* use of them is an ongoing tuning process.

**D. Key Anomalies / Bugs Observed in Log (Previous):**
*   **[RESOLVED] [CRITICAL-BUG] T9 GEM-Q Reinforcement Anomaly:** GEM-Q received 30 overflow units from a potential 25.
*   **[MITIGATED] [AI-BUG] T13 AXIOM Invalid Maneuver Action:** AI suggested `HOLD_POSITION` during Maneuver phase. (Improved prompt constraints)
*   **[MITIGATED] [AI-LOGIC] AI Action Fallback for Invalid Params:** AI sometimes fails to validate action prerequisites. (Improved prompt constraints)
*   **[RESOLVED] [LOGIC/AI] Upkeep Calculation/Logging Clarity for "Forts".**
*   **[RESOLVED] [CODE-CLEANUP] `generateOpPlanFromGemini` Argument Handling:** Corrected argument passing in `App.tsx` (`handleFluctuationPhase`) when `humanWatcherNote` parameter in `geminiService.ts` was commented out, ensuring the function was called with the expected number of arguments.
*   **[COMPLETED] [ROBUSTNESS] AI JSON Parsing Robustness (Sanitation Function):**
    *   **Reasoning:** Generative AIs can occasionally produce JSON output that is semantically correct but contains minor syntactic flaws (e.g., trailing commas, block comments, inconsistent quoting, extraneous newlines) which cause `JSON.parse()` to fail.
    *   **Fix:** Implemented `sanitizeAIJsonResponse` function in `services/geminiService.ts`. This function acts as a pre-processing step to conservatively clean up common, low-risk formatting issues *before* parsing. This includes removing markdown fences, stripping comments, removing trailing commas, normalizing newlines around structural characters, and attempting to convert single-quoted strings/keys to double quotes.
    *   **Goal:** Reduce fallbacks to default AI behavior due to parsing errors, without altering AI's intended data/actions. It's a "best effort" for common AI quirks; robust error handling for unrecoverable JSON remains essential.

## II. Current Development Focus (Phase 2 Items from `PHASED_UPDATE_GUIDE.MD`)

### Strategic Attrition Report Enhancements
*   [x] **KPI Data Backend Implementation & Integration into Carousel (Page 4).**
*   **Next Step:** [ ] **Tooltips & Final Polish for New KPI Page.**

### Strategic Communication Subsystem (SCS) with Human Input
*   **Priority:** High for Phase 2.
*   **Status:** COMPLETE.
*   **Concept:** AI-to-AI messaging, human watcher can inject directives. Replaces the old "Human Watcher Guidance System".
*   **Details:** UI (Header button, pop-out drawer, styled message log, human input area). Backend (Types, AI Service updates for `generateStrategicCommunique` and `generateOpPlanFromGemini` to use comms context, `App.tsx` logic for managing `commLog`). Refactor/remove old guidance system code.

## III. Gemma Model Compatibility & Settings Hot-Swapping
*   **Priority:** Highest (Current Phase).
*   **Status:** COMPLETE.
*   **Goal:** Enable Gemma models to reliably produce JSON output for OpPlans and AI Actions by prompting for JSON-formatted text, and ensure game settings adapt automatically when switching AI models.
*   **Key Issues:**
    *   Gemma models do not support `responseMimeType: "application/json"`.
    *   Current "Structured Output" relies on this API feature.
*   **Tasks:**
    *   [x] **Design Gemma-Specific JSON Prompting:** Create robust in-prompt instructions for Gemma models to return JSON-formatted text for OpPlans and AI Actions. This will be similar to the current "non-structured" JSON prompt but potentially more explicit. (Completed in `geminiService.ts` via `isGemmaModel` flag).
    *   [x] **Conditional API Call Logic (`geminiService.ts`):**
        *   Modify `generateOpPlanFromGemini`, `getAIActionFromGemini`, `getAIFortifyActionFromGemini`.
        *   If a Gemma model is selected:
            *   Omit `responseMimeType: "application/json"` from the `config` object.
            *   Force usage of the Gemma-specific text-based JSON prompt instruction, regardless of the `isStructuredOutputEnabled` setting.
        *   If a Gemini model is selected, retain current behavior (use `responseMimeType` and respect `isStructuredOutputEnabled`).
    *   [x] **UI Adjustments (`ModifiersModal.tsx`):**
        *   When a Gemma model is selected, disable the "Enable Structured Gemini Output" checkbox.
        *   Provide a brief explanatory note to the user about why this toggle is disabled for Gemma models.
    *   [x] **Game Pause on Modal Open (`App.tsx`):**
        *   Implement logic to automatically pause `gameState.isGameRunning` when `isSettingsModalOpen` or `isModifiersModalOpen` (and other key modals) are true.
        *   Ensure the game does *not* automatically resume upon modal close; user must manually resume.
    *   [x] **Hot-Swapping Robustness:**
        *   Ensure a derived state flag (e.g., `isGemmaModelActive`) in `App.tsx` correctly reflects the selected model type.
        *   Verify this flag is correctly passed and used by `geminiService.ts` and UI components to ensure immediate and correct behavior changes upon model selection.
    *   [x] **Thorough Testing (Core Functionality Confirmed):**
        *   Tested JSON parsing reliability and game logic with supported Gemma models for OpPlan and AI Action generation.
        *   Tested hot-swapping between Gemini and Gemma models during a live game, ensuring settings and prompts update correctly.
        *   *Iterative refinement of Gemma-specific JSON prompts remains ongoing as needed based on continued observation.*

## IV. Veteran Cadre System (Next Major Feature)
*   **Priority:** Highest (Next Phase after Gemma compatibility is fully tested).
*   **Goal:** Introduce "Veteran Units" with enhanced combat capabilities and distinct creation pathways to add strategic depth and help break late-game stalemates.
*   **Tasks:**
    *   [ ] **Data Model & Constants (`types.ts`, `constants.ts`):**
        *   Add `veteranUnits: number` and `trainingQueue?: TrainingOrder` to `NodeData`. Deprecate `evolvedUnits`.
        *   Add `totalVeteranUnits: number` to `Faction`.
        *   Add `TRAIN_VETERANS` to `AIActionName`.
        *   Define `TrainingOrder` interface.
        *   Define constants: `VETERAN_COMBAT_BONUS`, `VETERAN_UPKEEP_MODIFIER`, `VETERAN_TRAINING_NODE_TYPE`, `VETERAN_TRAINING_TIME_TURNS`, `VETERAN_TRAINING_MAT_COST`, `BATTLE_PROMOTION_RATIO`.
    *   [ ] **Core Game Logic - Training (`App.tsx`):**
        *   Implement `TRAIN_VETERANS` action in `handleManeuverPhase` (MAT cost, unit deduction, add to `trainingQueue`).
        *   Process completed training in `handleResourcePhase` or `handleFluctuationPhase` (decrement `turnsRemaining`, add to `veteranUnits`, update faction totals, clear queue).
    *   [ ] **Core Game Logic - Combat & Promotion (`App.tsx`):**
        *   Integrate `VETERAN_COMBAT_BONUS` into combat calculations.
        *   Implement casualty allocation: standard units lost first, then veterans.
        *   Implement battlefield promotion logic for survivors.
    *   [ ] **Core Game Logic - Upkeep (`App.tsx`):** Update `handleUpkeepPhase` for `VETERAN_UPKEEP_MODIFIER`.
    *   [ ] **Initialization & Stats (`App.tsx`):** Update `createInitialGameState` and `calculateFactionStats`.
    *   [ ] **AI Integration (`services/geminiService.ts`):**
        *   Update `getSimplifiedGameStateForAI` (add veteran data, new constants).
        *   Update `generateOpPlanFromGemini` prompt (add "Veteran Superiority" imperative, encourage scratchpad consideration).
        *   Update `getAIActionFromGemini` prompt (add `TRAIN_VETERANS` action, instruct on trade-offs).
    *   [ ] **UI Updates:**
        *   `NodeComponent.tsx`: Display veteran units, training status. Update tooltip.
        *   `Sidebar.tsx` (FactionPanel): Display total veteran units.
        *   `BattleReportModal.tsx`: Show veteran breakdown, combat bonus, promotions.
        *   `NodeActivityDisplay.tsx`: Show veteran units, training queue.
        *   `InfoModal.tsx`: Add section explaining Veteran Units.
        *   `EndGameReportModal.tsx`: Update to reflect Veteran unit statistics and impact.
    *   [ ] **Save/Load Game:** Ensure new fields are handled.
    *   [ ] **Testing & Initial Balancing:**
        *   Thoroughly test all aspects and balance constants.
        *   `[ ] Define & Track Veteran-Specific KPIs: (e.g., MAT/QR spent on training, Veteran promotion rates, battle effectiveness of Veterans). Investigate metrics like average unit upgrade chance per turn based on battle history. Integrate into Attrition Report and End Game Report.`

## V. Evolved Units System (Superseded/Replaced by Veteran Cadre System)
*   **Status:** This specific concept of "Evolved Units" is now superseded by the "Veteran Cadre System" (see Section IV). The goals (qualitative unit improvement, breaking stalemates) are addressed by the Veteran system.

## VI. Next Major Features (Post-Veteran System - Phase 5 from `PHASED_UPDATE_GUIDE.MD`)

### Enhanced Combat System (Supporting Veteran Units & Other Mechanics)
*   **Status:** PARTIALLY ADDRESSED (Artillery, Fort HP), further enhancements NOT STARTED.
*   **Details:**
    *   [ ] Further integration and balancing of `VETERAN_COMBAT_BONUS` and potential unique Veteran Unit abilities if defined.
    *   [ ] Implement `suppression` effects from infiltrators (e.g., combat penalties for suppressed units, temporary reduction in node output or fortification effectiveness).

### Advanced AI Reconnaissance & Infiltrator Strategy
*   **Status:** NOT STARTED.
*   **Details:**
    *   [ ] AI more proactively uses infiltrators for strategic sabotage (e.g., targeting enemy economy or key infrastructure based on intel).
    *   [ ] AI uses Recon Pulses more strategically to scout for specific objectives or confirm enemy weaknesses before committing to major offensives.
    *   [ ] Potential for counter-intelligence mechanics.

### Historical Battle Data & Evolving AI Personas (Conceptual)
*   **Status:** CONCEPTUAL / FUTURE.
*   **Summary:** Allow AI factions to "remember" outcomes from previous game sessions. This history could influence their strategic biases, assessment of opponents, and their SCS messaging style.
*   **Implementation Idea:** Potentially a JSON-based "War Chronicle" file that can be saved/loaded. This chronicle's summary would be fed into AI prompts.

### QoL/UI/UX Enhancements
*   **Status:** ONGOING / NOT STARTED for specific items.
*   **Details:**
    *   [ ] **Visual Feedback for Map Actions:** e.g., clearer indicators for artillery strikes, sabotage attempts, unit movements.
    *   [ ] **Comprehensive Map Key/Legend.**
    *   [ ] **Improved Tooltips and Information Presentation** (beyond initial KPI tooltips).
    *   [ ] **Visual Game Replay System:** Allow playback of completed games.
    *   [ ] **Refresh EndGameReportModal:** Include a wider range of game statistics and KPIs, including those related to new systems like Veterans and other recently added metrics.


## VII. Old Human Watcher Guidance System (Archival - SUPERSEDED)
*   **Status:** SUPERSEDED by SCS Human Input.
*   **Original Summary:** Human provides strategic guidance to one AI via a dedicated modal, injecting a note into its OpPlan generation.
*   **Reason for Change:** SCS integration offers a more diegetic and interactive experience.

---
*This guide will be updated as development progresses.*