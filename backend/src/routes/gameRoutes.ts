import { Router, Request, Response } from 'express';
import { createInitialGameState } from '../game/game';
import { handleFluctuationPhase, handleManeuverPhase, handleCombatPhase, handleResourcePhase, handleUpkeepPhase, handleDoctrinePhase } from '../game/phases';
import { DOCTRINE_LIBRARY } from '../data/doctrines';
import { applyDoctrineEffects } from '../game/doctrines';
import { GameState, MapType, GameSettings, PlayerId, CommLogEntry, SystemLogEntry, BattleLogEntry, NodeActivityEntry, BattleRoundDetail, GamePhase } from '../types';
import { run as analyzeCode } from '../tools/code_analyzer';

const router = Router();

let gameState: GameState | null = null; // This will hold the single source of truth for the game state

// Helper function to add log entries (for now, just console.log)
const addLogEntry = (message: string, type: SystemLogEntry['type'] = 'INFO', source?: PlayerId | 'LYRIA_SYSTEM' | 'SCS_SYSTEM' | 'COMMAND_CONSOLE', phaseOverride?: GamePhase) => {
    console.log(`[${type}] ${message}`);
    // In a real application, you'd want to store these logs in the gameState or a database
};

// Helper function for setGameState (for now, just updates the local gameState variable)
const setGameState = (updater: (prevState: GameState) => GameState) => {
    if (gameState) {
        gameState = updater(gameState);
    }
};

// Helper function for setHasNewSCSMessage (for now, just console.log)
const setHasNewSCSMessage = (value: boolean) => {
    console.log(`setHasNewSCSMessage: ${value}`);
};

// Helper function for addNodeActivityEntry (for now, just console.log)
const addNodeActivityEntry = (node: any, message: string, type: NodeActivityEntry['type'], factionId?: PlayerId) => {
    console.log(`[Node Activity] ${node.label}: ${message}`);
};

// Helper function for zoomToCoordinates (for now, just console.log)
const zoomToCoordinates = (x: number, y: number, scale: number) => {
    console.log(`Zooming to ${x}, ${y} with scale ${scale}`);
};

// Helper function for autoResetViewTimer (for now, just console.log)
const autoResetViewTimer = null; // Placeholder
const setAutoResetViewTimer = (timer: number | null) => {
    console.log(`Setting autoResetViewTimer: ${timer}`);
};

// Helper function for handleResetView (for now, just console.log)
const handleResetView = () => {
    console.log('Resetting view');
};

// Helper for isGemmaModelActive (for now, always false)
const isGemmaModelActive = false;

// Endpoint to create a new game
router.post('/new', (req: Request, res: Response) => {
    const { mapType, gameSettings } = req.body;
    if (!mapType || !gameSettings) {
        return res.status(400).json({ error: 'mapType and gameSettings are required' });
    }
    gameState = createInitialGameState(mapType as MapType, gameSettings as GameSettings);
    addLogEntry("New game created.", "EVENT");
    res.status(201).json(gameState);
});

// Endpoint to get the current game state
router.get('/state', (req: Request, res: Response) => {
    if (!gameState) {
        return res.status(404).json({ error: 'No game in progress' });
    }
    res.json(gameState);
});

// Endpoint to advance to the next phase
router.post('/next-phase', async (req: Request, res: Response) => {
    if (!gameState) {
        return res.status(404).json({ error: 'No game in progress' });
    }

    const { gameSettings } = req.body; // Assuming gameSettings might be needed for phase handling

    let updatedState: GameState = { ...gameState };

    switch (gameState.currentPhase) {
        case 'FLUCTUATION':
            updatedState = await handleFluctuationPhase(updatedState, gameSettings, addLogEntry, setGameState, null, setHasNewSCSMessage, isGemmaModelActive);
            break;
        case 'RESOURCE':
            updatedState = handleResourcePhase(updatedState, addLogEntry, gameSettings, isGemmaModelActive);
            if (updatedState.currentPhase === 'DOCTRINE') {
                return res.json({ ...updatedState, doctrineChoices: updatedState.currentDoctrineChoices });
            }
            break;
        case 'MANEUVER_AXIOM':
            await handleManeuverPhase('AXIOM', updatedState, gameSettings, addLogEntry, setGameState, null, setHasNewSCSMessage, isGemmaModelActive, zoomToCoordinates, autoResetViewTimer, handleResetView, setAutoResetViewTimer, addNodeActivityEntry);
            updatedState = gameState!; // Update from setGameState calls within handleManeuverPhase
            break;
        case 'MANEUVER_GEMQ':
            await handleManeuverPhase('GEM-Q', updatedState, gameSettings, addLogEntry, setGameState, null, setHasNewSCSMessage, isGemmaModelActive, zoomToCoordinates, autoResetViewTimer, handleResetView, setAutoResetViewTimer, addNodeActivityEntry);
            updatedState = gameState!; // Update from setGameState calls within handleManeuverPhase
            break;
        case 'UPKEEP':
            updatedState = handleUpkeepPhase(updatedState, addLogEntry);
            break;
        case 'DOCTRINE':
            updatedState = await handleDoctrinePhase(updatedState, addLogEntry, gameSettings, isGemmaModelActive);
            break;
        default:
            return res.status(400).json({ error: 'Invalid game phase' });
    }

    gameState = updatedState; // Ensure the global gameState is updated
    res.json(gameState);
});

// New endpoint for game actions (e.g., choosing doctrine)
router.post('/action', async (req: Request, res: Response) => {
    if (!gameState) {
        return res.status(404).json({ error: 'No game in progress' });
    }

    const { actionType, payload } = req.body;

    let updatedState: GameState = { ...gameState };

    switch (actionType) {
        case 'chooseDoctrine':
            const { doctrineId } = payload;
            if (!doctrineId) {
                return res.status(400).json({ error: 'doctrineId is required for chooseDoctrine action.' });
            }
            const chosenDoctrine = DOCTRINE_LIBRARY.find(d => d.id === doctrineId);
            if (!chosenDoctrine) {
                return res.status(400).json({ error: 'Invalid doctrineId.' });
            }

            // Apply buffs and nerfs for the chosen doctrine to the current player (COMMAND_CONSOLE)
            updatedState.factions[COMMAND_CONSOLE_ID].currentDoctrine = chosenDoctrine;
            chosenDoctrine.buffs.forEach(buff => {
                updatedState = applyDoctrineEffects(updatedState, COMMAND_CONSOLE_ID, buff);
            });
            chosenDoctrine.nerfs.forEach(nerf => {
                updatedState = applyDoctrineEffects(updatedState, COMMAND_CONSOLE_ID, nerf);
            });
            addLogEntry(`${updatedState.factions[COMMAND_CONSOLE_ID].name} chose the '${chosenDoctrine.name}' doctrine.`, 'EVENT', COMMAND_CONSOLE_ID, 'DOCTRINE');

            // Transition to the next phase after doctrine selection
            updatedState.currentPhase = 'FLUCTUATION'; // Or whatever the next phase should be
            updatedState.gameMessage = null;
            break;
        case 'sendDirective':
            // Existing sendDirective logic
            const { message, target } = payload;
            const commEntry: CommLogEntry = {
                id: `scs-${Date.now()}-human-${Math.random()}`, turn: updatedState.turn, timestamp: new Date().toLocaleTimeString(),
                senderId: COMMAND_CONSOLE_ID, senderName: "COMMAND_CONSOLE", message: message, targetFactionId: target
            };
            updatedState.commLog = [...updatedState.commLog, commEntry].slice(-50);
            setHasNewSCSMessage(true);
            break;
        default:
            return res.status(400).json({ error: 'Invalid action type' });
    }

    gameState = updatedState; // Ensure the global gameState is updated
    res.json(gameState);
});

// New endpoint for code analysis
router.post('/analyze-code', async (req: Request, res: Response) => {
    const { file_path, analysis_type, entity_name } = req.body;

    if (!file_path || !analysis_type) {
        return res.status(400).json({ error: 'file_path and analysis_type are required.' });
    }

    try {
        const result = await analyzeCode({ file_path, analysis_type, entity_name });
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

