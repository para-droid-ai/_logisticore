# Logisticore: Phased Update & Balance Guide

This document outlines the planned sequence of updates, bug fixes, and balance adjustments for Logisticore. It is based on the comprehensive review of game simulations (notably the T43 log for Volgograd Cauldron), AI performance analysis, and strategic design discussions.

## How to Use This Guide
Mark items with `[x]` as they are completed. Add notes or links to specific commits if necessary.

---

## Phase 1: Critical Fixes, Core Mechanic Activation & AI Tuning (Largely Completed)

This phase focused on resolving critical bugs identified in game logs, activating underutilized core game mechanics (Artillery and Infiltrators), alongside general AI strategic improvements.

### 1.0 Critical Bug Fixes & Core Logic Refinements
*   **Priority:** Highest. These addressed core gameplay integrity.
*   **Files Primarily Affected:** `App.tsx`, `services/geminiService.ts`, `constants.ts`.
*   **Status:** COMPLETE.

*   [x] **1.0.0: Verify & Enhance Save/Load Completeness for Testing.**
*   [x] **1.0.1 Reinforcement Allocation (T9 GEM-Q Anomaly).**
*   [x] **1.0.2 AI Invalid Action Type (e.g., T13 AXIOM Maneuver).**
*   [x] **1.0.3 Upkeep Calculation & Logging Consistency.**
*   [x] **1.0.4 AI Action Fallback for Invalid Params.**
*   [x] **1.0.5: Play/Pause After Load.**
*   [x] **1.0.6: `generateOpPlanFromGemini` Argument Handling (App.tsx).**
*   [x] **1.0.7: AI JSON Parsing Robustness (Sanitation Function):**
    *   **Reasoning:** Generative AIs can occasionally produce JSON output that is semantically correct but contains minor syntactic flaws.
    *   **Fix:** Implemented `sanitizeAIJsonResponse` in `services/geminiService.ts` to pre-process and clean common formatting issues before parsing, reducing fallbacks.

### 1.1 Artillery System Activation & AI Integration
*   **Priority:** High.
*   **Status:** COMPLETE.
*   **Details:** Constants adjusted for artillery costs. AI prompts updated to encourage strategic artillery use (purchase, bombardment). Game logic in `App.tsx` verified.

### 1.2 Infiltrator System Activation & AI Integration
*   **Priority:** High.
*   **Status:** COMPLETE.
*   **Details:** Core game logic (`TRAIN_INFILTRATOR`, `SABOTAGE_MATERIEL`), constants (`ATTRITION_COST_INFILTRATOR_MAT`), and AI prompts updated. Basic detection/risk model implemented.

### 1.3 AI Strategic & Economic Acumen Enhancements (General Prompt Engineering)
*   **Priority:** Medium (Ongoing).
*   **Status:** IN PROGRESS / ONGOING.
*   **Details:**
    *   [x] **Capacity Management:** Stronger prompts. (Improved, but needs ongoing monitoring)
    *   [x] **Target Prioritization & Flexibility:** Prompts for AI to consider alternatives. (Ongoing AI prompt refinement)
    *   [x] **Fortification Strategy Expansion:** Prompts to consider fortifying IHs, vulnerable Fortresses. (Ongoing AI prompt refinement)
    *   [x] **Economic Prudence for Recon Pulses:** Refined cost/benefit analysis in prompts. (Improved, but needs ongoing monitoring)
    *   [x] **Utilization of Artillery & Infiltrators:** Prompts updated. (Ongoing tuning process for optimal use)


### 1.4 Fortification HP System (New Major Feature)
*   **Priority:** High.
*   **Status:** COMPLETE.
*   **Details:** Implemented `fortificationHP`, `maxFortificationHP`. Damage mechanics in combat and from artillery strikes. `BUILD_FORTIFICATIONS` action revamped for Repair/Upgrade. Combat bonus now based on effective HP. AI prompts updated for new system. UI updates in `NodeComponent.tsx` and `NodeActivityDisplay.tsx` show Fort HP and effective level.

### 1.5 Strategic Attrition Report Enhancements (KPIs Phase 1)
*   **Priority:** High.
*   **Status:** MOSTLY COMPLETE.
*   **Details:**
    *   [x] **KPI Data Backend Implementation:** New fields in `Faction` type for Fort HP repair, Artillery ammo/kills, Sabotage success/drain tracked in `App.tsx`. Save/Load updated.
    *   [x] **Integrate New KPIs into Carousel:** Added "Page 4" (Operational Engagements) to `NodeActivityDisplay.tsx` for these new KPIs. `TOTAL_CAROUSEL_PAGES` is 5.
    *   [ ] **Tooltips & Final Polish for New KPI Page:** Update `metricTooltips` for Page 4 KPIs. Test data accuracy and usability. (ACTIVE/NEXT)

---

## Phase 2: SCS Implementation & UI Overhauls (Largely Completed)

This phase introduces the Strategic Communication Subsystem, significantly overhauls related UI elements, and continues refining existing mechanics.

### 2.0 Strategic Communication Subsystem (SCS) with Human Input
*   **Priority:** Highest for Phase 2.
*   **Status:** COMPLETE.
*   **Concept:** AI-to-AI messaging feature, with the ability for a human watcher to inject directives. AIs generate concise messages based on game state, personas, opponent's last message, and any human directive. This system *replaces* the old, separate "Human Watcher Guidance System".
*   **UI:**
    *   [x] **Header Button & Modal:**
        *   Created `components/ui/SCSHeaderButton.tsx` for header. UI button text "SCS".
        *   Created `components/game/SCSModal.tsx` for the pop-out modal UI.
        *   Modal displays a chronological log of messages.
        *   Styled messages: AXIOM (cyan), GEM-Q (red), Human Directives (yellow). Include turn number.
        *   Human input area: Textarea, target selection (AXIOM, GEM-Q, Broadcast), "Send Directive" button.
        *   Integrated SCS button and modal state management into `App.tsx`.
*   **Backend & AI Logic:**
    *   [x] **Type Definitions (`types.ts`):**
        *   Defined `CommLogEntry { id, turn, timestamp, senderId: PlayerId, senderName, message, targetFactionId?: PlayerId | 'BROADCAST', colorClass }`. `PlayerId` updated to include `COMMAND_CONSOLE`.
        *   Added `commLog: CommLogEntry[]` to `GameState`.
    *   [x] **AI Service (`services/geminiService.ts`):**
        *   Created `generateStrategicCommunique(gameState, factionId, opponentLastMessage, humanDirective)` function.
        *   Modified `generateOpPlanFromGemini` prompt to include "Recent Communications Log" and "Human Watcher Directive" sections in context. AI scratchpad sections prompted to acknowledge these.
    *   [x] **Main Game Logic (`App.tsx`):**
        *   Initialized `commLog: []`.
        *   SCS messages generated during `FLUCTUATION` phase.
        *   Human directives processed and added to `commLog`. AI communiques generated and added.
        *   Opponent's last SCS message and relevant human directive from `commLog` passed to `generateOpPlanFromGemini`.
*   **Refactor Old Human Guidance System Code:**
    *   [x] Removed `humanWatcherNotes` from `GameState`.
    *   [x] Removed guidance props from `OpPlanPanel.tsx`.
    *   [x] Removed guidance state/handlers from `App.tsx`. Deleted `GuidanceModal.tsx`.

### 2.1 Sidebar Expandable Panels - Battle History
*   **Priority:** Medium.
*   **Status:** COMPLETE.
*   **Details:** Added expand/collapse functionality to the Battle History panel, similar to System Log.

---

## Phase 3: Gemma Model JSON Compatibility & Settings Hot-Swapping (COMPLETE)

This phase focused on making Gemma models fully functional for JSON-reliant tasks and ensuring game settings adapt seamlessly when models are switched.

*   **Priority:** Highest for current development.
*   **Status:** COMPLETE.
*   **Goal:** Enable Gemma models to reliably produce JSON output (for OpPlans, AI Actions) by prompting them for JSON-formatted text, and ensure application settings (UI, API calls, prompts) "hot-swap" correctly when the selected AI model changes.
*   **Rationale:** Gemma models offer potential performance/cost benefits but have API limitations regarding direct JSON mode. This phase makes them viable alternatives.

### 3.1 System Analysis & Design for Gemma JSON Workaround
*   **Status:** COMPLETE.
*   **Tasks:**
    *   [x] **Detailed Plan for Conditional API Calls:**
        *   When Gemma is selected, `geminiService.ts` functions will omit `responseMimeType: "application/json"`.
        *   A specific, robust in-prompt instruction for generating JSON-formatted *text* will be used for Gemma models.
    *   [x] **Plan for UI Adjustments (`ModifiersModal.tsx`):**
        *   "Enable Structured Gemini Output" toggle will be disabled when Gemma is selected.
        *   Explanatory text will be added.
    *   [x] **Plan for Game Pause on Modal Open (`App.tsx`):**
        *   Game pauses when Settings or Modifiers modals are open.
        *   Game does *not* auto-resume on modal close.

### 3.2 Red-Team Solution (Identify & Mitigate Pitfalls)
*   **Status:** COMPLETE.
*   **Key Pitfalls & Mitigations Reviewed:**
    *   **Gemma Prompt Adherence:** Risk of Gemma not following text-JSON instructions. *Mitigation: Careful prompt engineering, robust sanitization, extensive testing.*
    *   **Hot-Swapping State Complexity:** Risk of stale state leading to incorrect API calls. *Mitigation: Derived state flag for active model type, ensure services get latest settings, game pause during changes.*
    *   **User Confusion (Disabled UI):** Risk of users not understanding why "Structured Output" is disabled for Gemma. *Mitigation: Conditional explanatory text in UI.*
    *   **Sanitization Overload:** Risk of sanitization failing if Gemma output is too malformed. *Mitigation: Prioritize prompt refinement; sanitization is a safety net.*

### 3.3 Implementation Tasks
*   [x] **Implement Conditional Logic in `geminiService.ts`:**
    *   Functions (`generateOpPlanFromGemini`, `getAIActionFromGemini`, `getAIFortifyActionFromGemini`) to check selected model type.
    *   If Gemma: Omit `responseMimeType`, use Gemma-specific JSON-in-text prompt. This prompt will be similar to the current "non-structured" one but refined for Gemma. The `isStructuredOutputEnabled` flag's schema will *not* be used for Gemma.
    *   If Gemini: Retain existing logic (use `responseMimeType`, respect `isStructuredOutputEnabled` for prompt style).
*   [x] **Implement UI Changes for `ModifiersModal.tsx`:**
    *   Disable "Enable Structured Gemini Output" toggle when a Gemma model is active.
    *   Add conditional note explaining the behavior for Gemma models.
*   [x] **Implement Game Pause on Modal Open (`App.tsx`):**
    *   Set `gameState.isGameRunning = false` when `isSettingsModalOpen` or `isModifiersModalOpen` (and other key modals) is true.
    *   Ensure game does not auto-resume.
*   [x] **Testing & Refinement (Core Gemma JSON functionality confirmed):**
    *   Thoroughly tested OpPlan and AI Action generation with supported Gemma models.
    *   Verified JSON parsing reliability.
    *   Tested hot-swapping between Gemini and Gemma models during gameplay.
    *   *Further iterative refinements to prompts will be ongoing as needed.*

---

## Phase 4: Veteran Cadre System Implementation (NEXT)

This phase introduces "Veteran Units" with enhanced combat capabilities and distinct creation pathways to add strategic depth and help break late-game stalemates, replacing the older "Evolved Units" concept.

*   **Priority:** Highest for next development cycle.
*   **Status:** NOT STARTED.
*   **Goal:** Implement the Veteran Cadre system, allowing units to gain veteran status through active training or battle experience, providing combat bonuses and distinct strategic value.

### 4.1 Data Model & Constant Definition
*   **Files Primarily Affected:** `types.ts`, `constants.ts`.
*   **Tasks:**
    *   [ ] Update `NodeData` interface: Add `veteranUnits: number`, `trainingQueue?: TrainingOrder`. Deprecate/remove `evolvedUnits`.
    *   [ ] Define `TrainingOrder { type: 'VETERAN', quantity: number, turnsRemaining: number }`.
    *   [ ] Update `Faction` interface: Add `totalVeteranUnits: number`. Adjust calculation for `totalStandardUnits`.
    *   [ ] Update `AIActionName` enum: Add `TRAIN_VETERANS`.
    *   [ ] Define new constants in `constants.ts`: `VETERAN_COMBAT_BONUS`, `VETERAN_UPKEEP_MODIFIER`, `VETERAN_TRAINING_NODE_TYPE` (e.g., 'FORTRESS'), `VETERAN_TRAINING_TIME_TURNS`, `VETERAN_TRAINING_MAT_COST`, `BATTLE_PROMOTION_RATIO`.

### 4.2 Core Game Logic - Training & Promotion
*   **Files Primarily Affected:** `App.tsx`.
*   **Tasks:**
    *   [ ] **Active Training (`handleManeuverPhase`):**
        *   Implement logic for `TRAIN_VETERANS` AI action.
        *   Validate node type, ownership, unit availability, MAT cost.
        *   Deduct MAT, move standard units to `trainingQueue` on the node.
    *   [ ] **Training Completion (e.g., `handleResourcePhase` or start of `handleFluctuationPhase`):**
        *   Iterate `trainingQueue` on nodes.
        *   Decrement `turnsRemaining`.
        *   On completion: Add to `node.veteranUnits`, update `faction.totalVeteranUnits`, clear queue. Log event.
    *   [ ] **Battlefield Promotion (`handleCombatPhase`):**
        *   After battle resolution, for winner/holding defender:
        *   Calculate promotions based on `BATTLE_PROMOTION_RATIO` and surviving `standardUnits`.
        *   Update `standardUnits` and `veteranUnits` on node and for faction. Log event.

### 4.3 Core Game Logic - Combat & Upkeep
*   **Files Primarily Affected:** `App.tsx`.
*   **Tasks:**
    *   [ ] **Combat Bonus (`handleCombatPhase`):**
        *   Modify combat resolution to include `VETERAN_COMBAT_BONUS` (e.g., add to dice roll or effective strength).
    *   [ ] **Casualty Allocation (`handleCombatPhase`):**
        *   Ensure standard units are lost before veteran units.
    *   [ ] **Upkeep (`handleUpkeepPhase`):**
        *   Update upkeep calculation to include `VETERAN_UPKEEP_MODIFIER`.

### 4.4 Initialization & Faction Stats
*   **Files Primarily Affected:** `App.tsx`.
*   **Tasks:**
    *   [ ] Update `createInitialGameState` to initialize new veteran-related fields.
    *   [ ] Update `calculateFactionStats` to include veteran unit counts.

### 4.5 AI Integration
*   **Files Primarily Affected:** `services/geminiService.ts`.
*   **Tasks:**
    *   [ ] **`getSimplifiedGameStateForAI`:** Add veteran unit data and new constants to AI context.
    *   [ ] **`generateOpPlanFromGemini`:**
        *   Add "Veteran Superiority" strategic imperative to prompt.
        *   Encourage AI to consider veterans in its `scratchpadOutput`.
    *   [ ] **`getAIActionFromGemini`:**
        *   Add `TRAIN_VETERANS` to available actions with parameters.
        *   Instruct AI on strategic value and trade-offs of veterans.

### 4.6 UI Implementation
*   **Files Primarily Affected:** `NodeComponent.tsx`, `Sidebar.tsx`, `BattleReportModal.tsx`, `NodeActivityDisplay.tsx`, `InfoModal.tsx`, `EndGameReportModal.tsx`.
*   **Tasks:**
    *   [ ] Display veteran unit counts distinctly on nodes and in tooltips.
    *   [ ] Show training queue status on nodes.
    *   [ ] Update FactionPanel in Sidebar with total veteran units.
    *   [ ] Update Battle Report to show veteran breakdown, combat bonuses, and promotions.
    *   [ ] Update NodeActivityDisplay to show veteran units, training queue, and integrate new Veteran-related KPIs.
    *   [ ] Update Game Guide in InfoModal with Veteran system explanation.
    *   [ ] `EndGameReportModal.tsx`: Update to display Veteran unit statistics, training progress, combat impact, and other new KPIs.

### 4.7 Save/Load Game Update
*   **Files Primarily Affected:** `App.tsx`.
*   **Tasks:**
    *   [ ] Ensure new state fields (`veteranUnits`, `trainingQueue`, `totalVeteranUnits`) are correctly saved and loaded. Handle potential migration from saves without these fields.

### 4.8 Testing & Initial Balancing
*   **Tasks:**
    *   [ ] Rigorously test all new mechanics and their interactions.
    *   [ ] Observe AI behavior with the new system.
    *   [ ] Perform initial balancing of veteran-related constants based on gameplay feel.
    *   [ ] Define and integrate Veteran-specific KPIs: (e.g., cost-benefit of Veteran training vs. standard units, battlefield promotion rates, veteran survivability, impact on attrition). Investigate metrics like average unit upgrade chance per turn based on battle history. Integrate relevant metrics into the Strategic Attrition Report and End Game Report.

---

## Phase 5: Advanced Gameplay Systems & AI Evolution

This phase focuses on major new gameplay mechanics and significant AI enhancements.

### Evolved Units System (Superseded)
*   **Status:** SUPERSEDED by the Veteran Cadre System.
*   **Note:** The objectives of the Evolved Units system (qualitative unit improvement, breaking stalemates) will be addressed by the new Veteran Cadre System.

### 5.0 Enhanced Combat System (Supporting Veteran Units & Other Mechanics)
*   **Status:** PARTIALLY ADDRESSED (Artillery, Fort HP), further enhancements NOT STARTED.
*   **Details:**
    *   [ ] Further integration and balancing of `VETERAN_COMBAT_BONUS` and potential unique Veteran Unit abilities if defined.
    *   [ ] Implement `suppression` effects from infiltrators (e.g., combat penalties for suppressed units, temporary reduction in node output or fortification effectiveness).

### 5.1 Advanced AI Reconnaissance & Infiltrator Strategy
*   **Status:** NOT STARTED.
*   **Details:**
    *   [ ] AI more proactively uses infiltrators for strategic sabotage (e.g., targeting enemy economy or key infrastructure based on intel).
    *   [ ] AI uses Recon Pulses more strategically to scout for specific objectives or confirm enemy weaknesses before committing to major offensives.
    *   [ ] Potential for counter-intelligence mechanics.

### 5.2 Historical Battle Data & Evolving AI Personas
*   **Status:** CONCEPTUAL / FUTURE.
*   **Summary:** Allow AI factions to "remember" outcomes from previous game sessions. This history could influence their strategic biases, assessment of opponents, and their SCS messaging style.
*   **Implementation Idea:** Potentially a JSON-based "War Chronicle" file that can be saved/loaded. This chronicle's summary would be fed into AI prompts.

---

## Phase 6: Quality of Life, Performance, & System Enhancements

This phase focuses on broader usability, advanced features, and overall game feel. It will be further detailed as Phase 5 nears completion.

### 6.0 QoL/UI/UX Enhancements
*   **Status:** ONGOING / NOT STARTED for specific items.
*   **Details:**
    *   [ ] **Visual Feedback for Map Actions:** e.g., clearer indicators for artillery strikes, sabotage attempts, unit movements.
    *   [ ] **Comprehensive Map Key/Legend.**
    *   [ ] **Improved Tooltips and Information Presentation** (beyond initial KPI tooltips).
    *   [ ] **Visual Game Replay System:** Allow playback of completed games.
    *   [ ] **Refresh EndGameReportModal:** Broader refresh to include a wider range of game statistics and KPIs, including those related to new systems like Veterans and other recently added metrics (beyond just Veteran-specific updates).

### 6.1 Lyria Music Engine Enhancements
*   **Status:** NOT STARTED for specific items.
*   **Details:**
    *   [ ] More dynamic and contextual triggers for music changes based on game events.
    *   [ ] User ability to create and save/load multiple Lyria prompt/config "playlists."
    *   [ ] Refine UI for Lyria controls based on user feedback.

### 6.2 Performance Optimization
*   **Status:** NOT STARTED.
*   **Details:** For very long games or complex map states.

### 6.3 Technical Debt & Code Health
*   **Status:** ONGOING (as needed).
*   **Details:** Refactoring key modules, enhancing inline code documentation.

### 6.4 Further System Expansions
*   **Status:** CONCEPTUAL.
*   **Details:**
    *   [ ] Game Modifiers Expansion: Add more options for customizing game rules at setup.

---

## Future Considerations: UI/UX Responsiveness & Dashboard View (From User Feedback)

This section captures broader UI/UX concerns and potential long-term improvements based on user feedback regarding screen real estate utilization and responsiveness across various screen sizes.

**A. Core Problems Identified:**
1.  **Responsiveness on Smaller Screens:**
    *   Fixed-width elements (sidebar, bottom report/analysis panels) do not adapt well.
    *   Header elements (text, buttons) become distorted or overflow.
    *   Map can become cluttered or unusable.
2.  **Space Utilization on Larger Screens:**
    *   Significant "wasted space" around the map area that could be used for persistent data displays.
    *   Attrition Report carousel hides information that could be part of a static dashboard.

**B. Potential Solution Areas & Concepts:**
1.  **Enhanced General Responsiveness (Short-Term Foundational Work):**
    *   **Fluid Layouts:** Transition fixed-width elements to use flexible CSS (Flexbox/Grid, percentages).
    *   **Adaptive Header:** Ensure header content reflows or resizes gracefully.
    *   **Responsive Typography & Spacing:** Use Tailwind's responsive utilities for text sizes, padding, and margins.
    *   **Map Scaling:** Improve map container scaling and define minimum usable sizes.

2.  **"View Selector" & "Strategic Dashboard" (Medium-Term Feature):**
    *   **Concept:** Allow users to toggle between different UI layouts optimized for different tasks or screen sizes.
    *   **Tactical View (Current):** Large map focus.
    *   **Strategic Dashboard View (New):**
        *   Smaller map display.
        *   Persistent panels for key faction KPIs (elements from current Attrition Report).
        *   Integrated, tabbed "Intel Panel" (see below).
        *   Possibly compact OpPlan summaries.

3.  **Consolidated Intel Panel (Medium-Term Feature / Part of Dashboard):**
    *   Combine System Log, Battle History, and new SCS Messages into a single, tabbed component.
    *   This panel could reside in the sidebar (if it becomes resizable/collapsible) or be a key part of the Strategic Dashboard View.

4.  **Faction-Specific Sidebars (Conceptual for Alternative Layouts):**
    *   Explore layouts where AXIOM data is on one side (e.g., left sidebar) and GEM-Q data on the other (e.g., right sidebar), with other UI elements in the center or as hover/pop-out options. This might be an option within the "View Selector".

**C. Approach:**
*   This is a significant UI/UX undertaking and should be planned as a dedicated "UI Refinement Phase" after core gameplay (like Veteran Units) is stable.
*   A phased approach is recommended:
    1.  Address basic responsiveness issues with existing components.
    2.  Design and implement the Strategic Dashboard View and View Selector.
    3.  Refactor components for modularity to support different layouts more easily.

---
*This guide will be updated as development progresses and new insights are gained from testing.*