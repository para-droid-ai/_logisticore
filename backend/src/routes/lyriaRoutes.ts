import { Router } from 'express';
import { LiveMusicGenerationConfig, LyriaPrompt, LyriaPlaybackState } from '../../../types'; // Adjust path as needed
import { LiveMusicSession, LiveMusicServerMessage, GoogleGenAI } from "@google/genai";
import { LYRIA_MODEL_NAME } from '../../../constants'; // Adjust path as needed

const router = Router();

interface LyriaSessionState {
    session: LiveMusicSession | null;
    playbackState: LyriaPlaybackState;
    config: LiveMusicGenerationConfig;
    prompts: LyriaPrompt[];
    error: boolean;
    statusMessage: string;
    audioContext: AudioContext | null;
    outputNode: GainNode | null;
    nextChunkStartTime: number;
}

const lyriaState: LyriaSessionState = {
    session: null,
    playbackState: 'stopped',
    config: {}, // Will be initialized with default config from frontend
    prompts: [], // Will be initialized with default prompts from frontend
    error: true,
    statusMessage: "Lyria AI Not Initialized.",
    audioContext: null,
    outputNode: null,
    nextChunkStartTime: 0,
};

// This will need to be initialized properly, perhaps via a service
let lyriaAiInstance: GoogleGenAI | null = null;

export const setLyriaAiInstance = (instance: GoogleGenAI) => {
    lyriaAiInstance = instance;
};

router.post('/lyria/connect', async (req, res) => {
    if (!lyriaAiInstance) {
        lyriaState.statusMessage = "Error: Lyria AI not initialized on backend.";
        lyriaState.playbackState = 'error';
        lyriaState.error = true;
        return res.status(500).json({ message: lyriaState.statusMessage });
    }

    if (lyriaState.session) {
        if (!lyriaState.error) {
            return res.status(200).json({ message: "Lyria session already active." });
        }
        try { lyriaState.session.close(); } catch(e) {/* ignore */}
        lyriaState.session = null;
    }

    lyriaState.statusMessage = "Connecting to Lyria session...";
    lyriaState.error = false;

    try {
        lyriaState.session = await lyriaAiInstance.live.music.connect({
            model: LYRIA_MODEL_NAME,
            callbacks: {
                onmessage: async (e: LiveMusicServerMessage) => {
                    if (e.setupComplete) {
                        lyriaState.statusMessage = "Lyria session connected.";
                        if (lyriaState.session && !lyriaState.error) {
                            try {
                                await lyriaState.session.setMusicGenerationConfig({ musicGenerationConfig: lyriaState.config });
                                if (lyriaState.prompts.filter(p => p.text.trim() && p.weight > 0).length > 0) {
                                    await lyriaState.session.setWeightedPrompts({
                                        weightedPrompts: lyriaState.prompts.filter(p => p.text.trim() && p.weight > 0)
                                            .map(p => ({text: p.text, weight: p.weight}))
                                    });
                                }
                            } catch (configError: any) {
                                lyriaState.statusMessage = `Error setting initial config: ${configError.message || "Unknown"}`;
                                lyriaState.error = true;
                                lyriaState.playbackState = 'error';
                            }
                        }
                    }

                    if (e.serverContent?.audioChunks?.[0]?.data) {
                        // Send audio data back to frontend
                        // This part needs careful consideration for streaming
                        // For now, we'll just acknowledge receipt
                    } else if ((e as any).error) {
                        const errorMessage = (e as any).error.message || 'Unknown server error';
                        lyriaState.statusMessage = `Lyria Error: ${errorMessage}`;
                        lyriaState.error = true;
                        lyriaState.playbackState = 'error';
                    }
                },
                onerror: (errEvent: Event) => {
                    const errorMsg = (errEvent as any).message || 'Unknown connection error. Check console.';
                    lyriaState.statusMessage = `Lyria connection error: ${errorMsg}`;
                    lyriaState.error = true;
                    lyriaState.playbackState = 'error';
                    lyriaState.session = null;
                },
                onclose: (closeEvent: CloseEvent) => {
                    const newState = lyriaState.error ? 'error' : 'stopped';
                    lyriaState.playbackState = newState;
                    lyriaState.statusMessage = newState === 'error' ? "Lyria connection error." : "Lyria connection closed.";
                    lyriaState.nextChunkStartTime = 0;
                    lyriaState.session = null;
                },
            },
        });
        res.status(200).json({ message: "Lyria session connected.", status: lyriaState.statusMessage });
    } catch (error: any) {
        lyriaState.statusMessage = `Failed to connect to Lyria: ${error.message || "Unknown error"}`;
        lyriaState.error = true;
        lyriaState.playbackState = 'error';
        res.status(500).json({ message: lyriaState.statusMessage });
    }
});

router.post('/lyria/play', async (req, res) => {
    if (!lyriaState.session || lyriaState.error) {
        lyriaState.statusMessage = "No active Lyria session or session in error state.";
        return res.status(400).json({ message: lyriaState.statusMessage });
    }
    try {
        await lyriaState.session.play();
        lyriaState.playbackState = 'playing';
        lyriaState.statusMessage = "Music playing.";
        res.status(200).json({ message: lyriaState.statusMessage });
    } catch (error: any) {
        lyriaState.statusMessage = `Failed to play Lyria: ${error.message || "Unknown error"}`;
        lyriaState.error = true;
        lyriaState.playbackState = 'error';
        res.status(500).json({ message: lyriaState.statusMessage });
    }
});

router.post('/lyria/pause', async (req, res) => {
    if (!lyriaState.session || lyriaState.error) {
        lyriaState.statusMessage = "No active Lyria session or session in error state.";
        return res.status(400).json({ message: lyriaState.statusMessage });
    }
    try {
        await lyriaState.session.pause();
        lyriaState.playbackState = 'paused';
        lyriaState.statusMessage = "Music paused.";
        res.status(200).json({ message: lyriaState.statusMessage });
    } catch (error: any) {
        lyriaState.statusMessage = `Failed to pause Lyria: ${error.message || "Unknown error"}`;
        lyriaState.error = true;
        lyriaState.playbackState = 'error';
        res.status(500).json({ message: lyriaState.statusMessage });
    }
});

router.post('/lyria/set-prompts', async (req, res) => {
    if (!lyriaState.session || lyriaState.error) {
        lyriaState.statusMessage = "No active Lyria session or session in error state.";
        return res.status(400).json({ message: lyriaState.statusMessage });
    }
    const { prompts } = req.body;
    if (!Array.isArray(prompts)) {
        return res.status(400).json({ message: "Invalid prompts format." });
    }
    lyriaState.prompts = prompts;
    try {
        await lyriaState.session.setWeightedPrompts({ weightedPrompts: prompts.map(p => ({text: p.text, weight: p.weight})) });
        lyriaState.statusMessage = "Lyria prompts updated.";
        res.status(200).json({ message: lyriaState.statusMessage });
    } catch (error: any) {
        lyriaState.statusMessage = `Failed to set Lyria prompts: ${error.message || "Unknown error"}`;
        lyriaState.error = true;
        lyriaState.playbackState = 'error';
        res.status(500).json({ message: lyriaState.statusMessage });
    }
});

router.post('/lyria/set-config', async (req, res) => {
    if (!lyriaState.session || lyriaState.error) {
        lyriaState.statusMessage = "No active Lyria session or session in error state.";
        return res.status(400).json({ message: lyriaState.statusMessage });
    }
    const { config } = req.body;
    if (typeof config !== 'object' || config === null) {
        return res.status(400).json({ message: "Invalid config format." });
    }
    lyriaState.config = config;
    try {
        await lyriaState.session.setMusicGenerationConfig({ musicGenerationConfig: config });
        lyriaState.statusMessage = "Lyria config updated.";
        res.status(200).json({ message: lyriaState.statusMessage });
    } catch (error: any) {
        lyriaState.statusMessage = `Failed to set Lyria config: ${error.message || "Unknown error"}`;
        lyriaState.error = true;
        lyriaState.playbackState = 'error';
        res.status(500).json({ message: lyriaState.statusMessage });
    }
});

router.post('/lyria/reset-context', async (req, res) => {
    if (!lyriaState.session) {
        lyriaState.statusMessage = "No active Lyria session to reset.";
        return res.status(400).json({ message: lyriaState.statusMessage });
    }
    try {
        await lyriaState.session.resetContext();
        lyriaState.nextChunkStartTime = 0;
        lyriaState.statusMessage = "Lyria context reset.";
        res.status(200).json({ message: lyriaState.statusMessage });
    } catch (error: any) {
        lyriaState.statusMessage = `Failed to reset Lyria context: ${error.message || "Unknown error"}`;
        lyriaState.error = true;
        lyriaState.playbackState = 'error';
        res.status(500).json({ message: lyriaState.statusMessage });
    }
});

router.get('/lyria/status', (req, res) => {
    res.status(200).json({
        playbackState: lyriaState.playbackState,
        statusMessage: lyriaState.statusMessage,
        error: lyriaState.error,
        config: lyriaState.config,
        prompts: lyriaState.prompts,
    });
});

export default router;