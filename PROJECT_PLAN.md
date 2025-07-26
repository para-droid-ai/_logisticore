# Project Plan: Evolving Attrition Doctrine to a Full-Stack Application

## 1. Codebase Understanding

The current codebase is a single-page React application built with TypeScript and Vite. It implements a complex, turn-based strategy wargame called "Attrition Doctrine." The application is monolithic, with the vast majority of the game logic, state management, and UI rendering contained within the `App.tsx` file.

### Key Technologies:

*   **Frontend:** React, TypeScript, Tailwind CSS
*   **Build Tool:** Vite
*   **State Management:** React Hooks (`useState`, `useEffect`, `useCallback`, etc.) - *Transitioning to Backend-driven*
*   **AI Integration:** The application is designed to use generative AI models (Gemini and Gemma) for AI decision-making, with services defined in `services/geminiService.ts` - *Transitioning to Backend-driven*

### Architecture:

The current architecture is a classic single-page application (SPA). All game logic, including turn progression, combat resolution, and AI action processing, is handled on the client-side. This creates a tight coupling between the game's rules and its presentation, making it difficult to maintain and scale.

## 2. The App's Purpose: Attrition Doctrine

"Attrition Doctrine" is a wargame that simulates a conflict between two AI factions, GEM-Q and AXIOM. The game is played on a map of interconnected nodes, and the objective is to achieve victory through strategic resource management, unit deployment, and combat.

### Core Gameplay Mechanics:

*   **Turn-based:** The game progresses in turns, with each turn divided into distinct phases (Fluctuation, Resource, Maneuver, Combat, etc.).
*   **AI-driven:** The AI factions are controlled by a generative AI model, which generates operational plans (OpPlans) and makes tactical decisions.
*   **Resource Management:** Players manage two primary resources: Quantum Resonance (QR) and Materiel (MAT).
*   **Combat:** Battles are resolved through a dice-based combat system, with various modifiers for terrain, fortifications, and unit types.
*   **Strategic Command System (SCS):** The human player can influence the AI factions by issuing high-level directives through the SCS.
*   **Lyria Music Engine:** An experimental feature that uses a generative music model to create a dynamic soundtrack that reflects the game's state.

## 3. Full-Stack Evolution Plan

The goal is to refactor the application into a full-stack architecture with a distinct frontend and backend. This will improve modularity, scalability, and maintainability.

### Phase 1: Backend Scaffolding (COMPLETED)

1.  **Create a `backend` directory:** This has been created and houses the new Node.js server.
2.  **Initialize a Node.js project:** A `package.json` file is present, and necessary dependencies (`express`, `cors`, `@google/generative-ai`) are installed.
3.  **Create a basic Express server:** A simple server is set up in `backend/src/server.ts` that listens on a specified port.

### Phase 2: Game Logic Migration (COMPLETED)

1.  **Move game state to the backend:** The `GameState` object is now managed on the backend. The backend is becoming the single source of truth for the game's state.
2.  **Migrate game logic functions:** Core game logic functions (`createInitialGameState`, `calculateFactionStats`, `handleFluctuationPhase`, `handleManeuverPhase`, `handleCombatPhase`, `handleResourcePhase`, `handleUpkeepPhase`, `handleDoctrinePhase`) have been moved to the backend (`backend/src/game/game.ts`, `backend/src/game/phases.ts`, `backend/src/game/utils.ts`).
3.  **Create API endpoints:** Initial RESTful API endpoints have been exposed for game creation (`POST /api/game/new`), state retrieval (`GET /api/game/state`), player actions (`POST /api/game/action`), and phase advancement (`POST /api/game/next-phase`).

    *   `POST /api/game/new`: Create a new game.
    *   `GET /api/game/state`: Get the current game state.
    *   `POST /api/game/action`: Submit a player action (e.g., an SCS directive).
    *   `POST /api/game/next-phase`: Advance the game to the next phase.

### Phase 3: Frontend Refactoring (IN PROGRESS)

1.  **Create a `frontend` directory:** Existing React code is in the root, acting as the frontend.
2.  **Refactor `App.tsx`:** `App.tsx` has been refactored to remove direct imports of game logic and AI services. It now fetches initial game state from the backend.
3.  **Implement API calls:** `handleNewSetup`, `handleTogglePlayPause`, and `handleSendDirective` now communicate with the backend API.
4.  **Extract Lyria AI logic to custom hook:** All Lyria AI-related state, effects, and functions have been moved from `App.tsx` into a new custom hook, `frontend/src/hooks/useLyriaAI.ts`.

    **Remaining:** All remaining direct game logic and state manipulation within `App.tsx` and other frontend components must be replaced with calls to the new backend API. Continue addressing type-checking errors across the frontend components.

### Phase 4: AI Integration (IN PROGRESS)

1.  **Move AI service to the backend:** The `geminiService.ts` file has been moved to `backend/src/services/geminiService.ts`. The backend is now responsible for making AI calls.
2.  **Implement Lyria AI backend endpoints:** Backend API endpoints for Lyria AI (connect, set prompts, set config, play/pause, reset context) have been implemented in `backend/src/routes/lyriaRoutes.ts` and integrated into `backend/src/server.ts`.

    **Remaining:** Frontend Lyria integration needs to be fully updated to use these new backend endpoints. Continue addressing type-checking errors across the backend components.

### Phase 5: Game State Management API (NEW)

1.  **Implement `game_state_manager` API:** Expose new backend API endpoints to directly manage and query the game state.
    *   `GET /api/game/state_value`: Retrieve a specific value from the game state (e.g., `factions.AXIOM.MAT`).
    *   `POST /api/game/set_state_value`: Modify a specific value within the game state.
    *   `POST /api/game/advance_phase`: Advance the game by one or more phases.
    *   `POST /api/game/advance_turn`: Advance the game by one or more turns.
    *   `POST /api/game/simulate_action`: Simulate a player action (e.g., a directive, node click).

2.  **Benefits:** This will greatly enhance debugging, testing, and the ability to reproduce specific game scenarios by allowing direct manipulation and inspection of the game state from external tools or a dedicated frontend testing panel.

## 4. New Features Implemented

### Veteran Cadre System (COMPLETED)

*   **Data Model & Constants:** Updated `backend/src/types/index.ts` and `constants.ts` with `TrainingOrder`, `veteranUnits`, `totalVeteranUnits`, `VETERAN_COMBAT_BONUS`, `VETERAN_UPKEEP_MODIFIER`, `VETERAN_TRAINING_NODE_TYPE`, `VETERAN_TRAINING_MAT_COST`, `VETERAN_TRAINING_TIME_TURNS`, `BATTLE_PROMOTION_RATIO`.
*   **Core Game Logic:**
    *   `TRAIN_VETERANS` action implemented in `handleManeuverPhase`.
    *   Veteran training completion handled in `handleResourcePhase`.
    *   Battlefield promotion logic added to `handleCombatPhase`.
    *   Veteran unit upkeep integrated into `handleUpkeepPhase`.

### Strategic Doctrine System (IN PROGRESS)

*   **Data Model & Constants:** `data/doctrines.ts` created. `backend/src/types/index.ts` and `constants.ts` updated with `DoctrineDefinition`, `ActiveDoctrine`, `DoctrineTier`, `DoctrineTheme`, `activeDoctrines`, `currentDoctrineChoices`, `DOCTRINE` phase, `DOCTRINE_PHASE_INTERVAL`, `DOCTRINE_STANDARD_START_TURN`, `DOCTRINE_ANOMALOUS_START_TURN`, `DOCTRINE_STANDARD_LIMIT`, `DOCTRINE_LOW_TIER_COST`, `DOCTRINE_MEDIUM_TIER_COST`, `DOCTRINE_HIGH_TIER_COST`.
*   **Core Game Logic:**
    *   `handleDoctrinePhase` created in `backend/src/game/phases.ts`.
    *   `handleUpkeepPhase` updated to transition to `DOCTRINE` phase based on turn.
    *   `handleDoctrinePhase` now selects two random doctrines for each AI faction.
    *   `backend/src/game/game.ts` updated to initialize doctrine-related fields.

## 5. Testing Strategy (NOT STARTED)

The testing strategy will focus on ensuring the correctness of the game logic and the reliability of the AI integration.

### Unit Tests:

*   **Backend:** We will use a testing framework like Jest to write unit tests for the game logic functions on the backend. This will involve creating mock game states and asserting that the functions produce the expected outcomes.
*   **Frontend:** We will use React Testing Library to write unit tests for the UI components, ensuring they render correctly based on the props they receive.

### Integration Tests:

*   We will write integration tests to verify the communication between the frontend and the backend. This will involve making API calls from the frontend and asserting that the backend responds with the correct data.

### AI Model Testing:

*   **Gemini API:** We will test the integration with the Gemini API by making live calls to the API and verifying that the responses are in the expected format.
*   **Local Gemma:** We will set up a local Gemma instance and test the integration with it. This will involve creating a separate test suite that runs against the local model.

By following this plan, we can successfully evolve "Attrition Doctrine" from a monolithic SPA to a robust and scalable full-stack application.