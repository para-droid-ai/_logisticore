import { useState, useEffect, useCallback, useRef } from 'react';
import { LiveMusicGenerationConfig, LyriaPrompt, LyriaPlaybackState, LyriaSessionSettings, SystemLogEntry, PlayerId } from '../types';
import { INITIAL_LYRIA_PROMPTS, INITIAL_LYRIA_CONFIG, LYRIA_PROMPT_COLORS, MAX_LYRIA_PROMPTS } from '../constants';
import { decodeBase64, decodeLyriaAudioData, throttle } from '../utils/lyriaUtils';
import { Scale as GenAiScale } from "@google/generative-ai";

interface UseLyriaAIProps {
  addLogEntry: (message: string, type?: SystemLogEntry['type'], source?: PlayerId | 'LYRIA_SYSTEM' | 'SCS_SYSTEM' | 'COMMAND_CONSOLE', phaseOverride?: any) => void;
}

interface UseLyriaAIResult {
  lyriaPrompts: LyriaPrompt[];
  setLyriaPrompts: React.Dispatch<React.SetStateAction<LyriaPrompt[]>>;
  lyriaConfig: LiveMusicGenerationConfig;
  setLyriaConfig: React.Dispatch<React.SetStateAction<LiveMusicGenerationConfig>>;
  lyriaPlaybackState: LyriaPlaybackState;
  lyriaStatusMessage: string;
  handleLyriaPlayPause: () => Promise<void>;
  handleAddLyriaPrompt: () => void;
  handleRemoveLyriaPrompt: (id: string) => void;
  handleLyriaPromptTextChange: (id: string, text: string) => void;
  handleLyriaPromptWeightChange: (id: string, weight: number) => void;
  handleLyriaConfigChange: (key: keyof LiveMusicGenerationConfig, value: any) => void;
  handleLyriaResetContext: () => Promise<void>;
  handleSaveLyriaSettings: () => void;
  handleLoadLyriaSettings: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const LYRIA_BUFFER_TIME_SECONDS = 2;

export const useLyriaAI = ({ addLogEntry }: UseLyriaAIProps): UseLyriaAIResult => {
  const [lyriaPrompts, setLyriaPrompts] = useState<LyriaPrompt[]>(() =>
    INITIAL_LYRIA_PROMPTS.map((p, index) => ({
      ...p,
      promptId: `lyria-prompt-initial-${Date.now() + index}`,
      color: LYRIA_PROMPT_COLORS[index % LYRIA_PROMPT_COLORS.length],
    }))
  );
  const [lyriaConfig, setLyriaConfig] = useState<LiveMusicGenerationConfig>(INITIAL_LYRIA_CONFIG);
  const [lyriaPlaybackState, setLyriaPlaybackState] = useState<LyriaPlaybackState>('stopped');
  const [lyriaStatusMessage, setLyriaStatusMessage] = useState<string>("Lyria AI Not Initialized.");

  const lyriaSessionRef = useRef<any | null>(null);
  const lyriaAudioContextRef = useRef<AudioContext | null>(null);
  const lyriaOutputNodeRef = useRef<GainNode | null>(null);
  const lyriaNextChunkStartTimeRef = useRef<number>(0);
  const lyriaSessionErrorRef = useRef<boolean>(true);

  const connectToLyriaSession = useCallback(async () => {
    // This will now call the backend API
    setLyriaStatusMessage("Connecting to Lyria session...");
    addLogEntry("Connecting to Lyria session...", "LYRIA", "LYRIA_SYSTEM");
    lyriaSessionErrorRef.current = false;

    try {
      const response = await fetch('http://localhost:3001/api/lyria/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setLyriaStatusMessage(data.message);
      // Handle audio streaming from backend if necessary, or assume backend handles it

      // For now, we'll assume the backend handles the actual session and audio streaming.
      // The frontend will just manage the playback state and config/prompts.
      // This part needs to be refined based on how audio streaming is handled.

    } catch (error: any) {
      setLyriaStatusMessage(`Failed to connect to Lyria: ${error.message || "Unknown error"}`);
      addLogEntry(`Lyria connection failed: ${error.message || "Unknown"}`, "ERROR", "LYRIA_SYSTEM");
      setLyriaPlaybackState('error');
      lyriaSessionErrorRef.current = true;
    }
  }, [addLogEntry]);

  const throttledSetLyriaPrompts = useCallback(
    throttle(async (currentPrompts: LyriaPrompt[], currentLyriaConfig: LiveMusicGenerationConfig, currentPlayback: LyriaPlaybackState) => {
      if (!lyriaSessionErrorRef.current && currentPlayback !== 'error') {
        const promptsToSend = currentPrompts.filter(p => p.text.trim() && p.weight > 0)
                                .map(p => ({ text: p.text, weight: p.weight }));
        const wasPlaying = currentPlayback === 'playing' || currentPlayback === 'loading';
        if (wasPlaying) { setLyriaStatusMessage("Applying prompt changes..."); }
        try {
          const response = await fetch('http://localhost:3001/api/lyria/set-prompts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompts: promptsToSend }),
          });
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const data = await response.json();
          setLyriaStatusMessage(data.message); addLogEntry("Lyria prompts updated.", "LYRIA", "LYRIA_SYSTEM");
          if (wasPlaying) { setLyriaStatusMessage("Music playing with new prompts."); }
        } catch (e: any) {
          setLyriaStatusMessage(`Error updating prompts: ${e.message || "Unknown"}`); addLogEntry(`Lyria prompt update error: ${e.message || "Unknown"}`, "ERROR", "LYRIA_SYSTEM");
          setLyriaPlaybackState('error');
        }
      }
    }, 500), [addLogEntry]);

  const throttledSetLyriaConfig = useCallback(
    throttle(async (newConfig: LiveMusicGenerationConfig, currentPlayback: LyriaPlaybackState) => {
      if (!lyriaSessionErrorRef.current && currentPlayback !== 'error') {
        const wasPlaying = currentPlayback === 'playing' || currentPlayback === 'loading';
        if (wasPlaying) { setLyriaStatusMessage("Applying config changes..."); }
        try {
          const response = await fetch('http://localhost:3001/api/lyria/set-config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ config: newConfig }),
          });
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const data = await response.json();
          setLyriaStatusMessage(data.message); addLogEntry("Lyria config updated.", "LYRIA", "LYRIA_SYSTEM");
          if (wasPlaying) { setLyriaStatusMessage("Music playing with new config."); }
        } catch (e: any) {
          setLyriaStatusMessage(`Error updating config: ${e.message || "Unknown"}`); addLogEntry(`Lyria config update error: ${e.message || "Unknown"}`, "ERROR", "LYRIA_SYSTEM");
          setLyriaPlaybackState('error');
        }
      }
    }, 500), [addLogEntry]);

  useEffect(() => {
    if (lyriaPlaybackState !== 'error' && lyriaPlaybackState !== 'stopped' ) {
        throttledSetLyriaPrompts(lyriaPrompts, lyriaConfig, lyriaPlaybackState);
    }
  }, [lyriaPrompts, lyriaConfig, throttledSetLyriaPrompts, lyriaPlaybackState]);

  useEffect(() => {
    if (lyriaPlaybackState !== 'error' && lyriaPlaybackState !== 'stopped' ) {
        throttledSetLyriaConfig(lyriaConfig, lyriaPlaybackState);
    }
  }, [lyriaConfig, throttledSetLyriaConfig, lyriaPlaybackState]);

  const handleLyriaPlayPause = useCallback(async () => {
    if (lyriaAudioContextRef.current && lyriaAudioContextRef.current.state === 'suspended') {
      try { await lyriaAudioContextRef.current.resume(); }
      catch (err) { setLyriaStatusMessage("Error: AudioContext failed to resume."); return; }
    }

    if (lyriaPlaybackState === 'playing' || lyriaPlaybackState === 'loading') {
      try {
        const response = await fetch('http://localhost:3001/api/lyria/pause', { method: 'POST' });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setLyriaPlaybackState('paused'); setLyriaStatusMessage(data.message);
        addLogEntry("Lyria music paused.", "LYRIA", "LYRIA_SYSTEM");
        if (lyriaOutputNodeRef.current && lyriaAudioContextRef.current) lyriaOutputNodeRef.current.gain.linearRampToValueAtTime(0, lyriaAudioContextRef.current.currentTime + 0.1);
        lyriaNextChunkStartTimeRef.current = 0;
      } catch (error: any) {
        setLyriaStatusMessage(`Failed to pause Lyria: ${error.message || "Unknown error"}`);
        addLogEntry(`Lyria pause failed: ${error.message || "Unknown"}`, "ERROR", "LYRIA_SYSTEM");
        setLyriaPlaybackState('error');
      }
    } else {
      setLyriaPlaybackState('loading'); setLyriaStatusMessage("Starting music stream...");
      addLogEntry("Lyria music play requested.", "LYRIA", "LYRIA_SYSTEM");
      if (lyriaOutputNodeRef.current && lyriaAudioContextRef.current) lyriaOutputNodeRef.current.gain.setValueAtTime(1, lyriaAudioContextRef.current.currentTime);

      if (lyriaSessionErrorRef.current) {
        await connectToLyriaSession();
      }
      try {
        const response = await fetch('http://localhost:3001/api/lyria/play', { method: 'POST' });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setLyriaPlaybackState('playing'); setLyriaStatusMessage(data.message);
      } catch (error: any) {
        setLyriaStatusMessage(`Failed to play Lyria: ${error.message || "Unknown error"}`);
        addLogEntry(`Lyria play failed: ${error.message || "Unknown"}`, "ERROR", "LYRIA_SYSTEM");
        setLyriaPlaybackState('error');
      }
    }
  }, [lyriaPlaybackState, connectToLyriaSession, addLogEntry]);

  const handleAddLyriaPrompt = () => {
    if (lyriaPrompts.length < MAX_LYRIA_PROMPTS) {
      const newPromptId = `lyria-prompt-custom-${Date.now()}`;
      const usedColors = lyriaPrompts.map(p => p.color);
      const availableColors = LYRIA_PROMPT_COLORS.filter(c => !usedColors.includes(c));
      const newColor = availableColors.length > 0 ? availableColors[0] : LYRIA_PROMPT_COLORS[lyriaPrompts.length % LYRIA_PROMPT_COLORS.length];
      setLyriaPrompts([...lyriaPrompts, { promptId: newPromptId, text: "", weight: 1.0, color: newColor }]);
    } else { setLyriaStatusMessage(`Max ${MAX_LYRIA_PROMPTS} prompts reached.`); }
  };

  const handleRemoveLyriaPrompt = (id: string) => setLyriaPrompts(lyriaPrompts.filter(p => p.promptId !== id));
  const handleLyriaPromptTextChange = (id: string, text: string) => setLyriaPrompts(lyriaPrompts.map(p => p.promptId === id ? { ...p, text } : p));
  const handleLyriaPromptWeightChange = (id: string, weight: number) => setLyriaPrompts(lyriaPrompts.map(p => p.promptId === id ? { ...p, weight } : p));

  const handleLyriaConfigChange = (key: keyof LiveMusicGenerationConfig, value: any) => {
    let processedValue = value;
    if (key === 'temperature' || key === 'guidance' || key === 'density' || key === 'brightness') {
        processedValue = parseFloat(value);
    } else if (key === 'topK' || key === 'seed' || key === 'bpm') {
        processedValue = value === '' || value === null || value === undefined ? undefined : parseInt(value, 10);
    }
    // No isNaN check for 'scale' as it's an enum
    if (key !== 'scale' && isNaN(processedValue as number) && (key === 'topK' || key === 'seed' || key === 'bpm')) {
        processedValue = undefined;
    }

    setLyriaConfig(prev => ({ ...prev, [key]: processedValue }));
  };

  const handleLyriaResetContext = useCallback(async () => {
    setLyriaStatusMessage("Resetting Lyria context...");
    addLogEntry("Lyria context reset requested.", "LYRIA", "LYRIA_SYSTEM");
    lyriaNextChunkStartTimeRef.current = 0;

    try {
      const response = await fetch('http://localhost:3001/api/lyria/reset-context', { method: 'POST' });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setLyriaStatusMessage(data.message);
      // After reset, re-apply current prompts and config
      await throttledSetLyriaPrompts(lyriaPrompts, lyriaConfig, lyriaPlaybackState);
      await throttledSetLyriaConfig(lyriaConfig, lyriaPlaybackState);

      if (lyriaPlaybackState === 'playing' || lyriaPlaybackState === 'loading') {
        const playResponse = await fetch('http://localhost:3001/api/lyria/play', { method: 'POST' });
        if (!playResponse.ok) throw new Error(`HTTP error! status: ${playResponse.status}`);
        const playData = await playResponse.json();
        setLyriaPlaybackState('playing'); setLyriaStatusMessage(playData.message);
      }
    } catch (error: any) {
      setLyriaStatusMessage(`Failed to reset Lyria context: ${error.message || "Unknown error"}`);
      addLogEntry(`Lyria context reset failed: ${error.message || "Unknown"}`, "ERROR", "LYRIA_SYSTEM");
      setLyriaPlaybackState('error');
    }
  }, [addLogEntry, lyriaPrompts, lyriaConfig, lyriaPlaybackState, throttledSetLyriaPrompts, throttledSetLyriaConfig]);

  const handleSaveLyriaSettings = useCallback(() => {
    const settingsToSave: LyriaSessionSettings = {
      prompts: lyriaPrompts,
      config: lyriaConfig,
    };
    const settingsString = JSON.stringify(settingsToSave, null, 2);
    const blob = new Blob([settingsString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lyria_settings_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addLogEntry("Lyria settings saved.", "LYRIA", "LYRIA_SYSTEM");
  }, [lyriaPrompts, lyriaConfig, addLogEntry]);

  const handleLoadLyriaSettings = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const loadedSettingsString = e.target?.result as string;
          const loadedSettings = JSON.parse(loadedSettingsString) as LyriaSessionSettings;

          if (loadedSettings.prompts && Array.isArray(loadedSettings.prompts) &&
              loadedSettings.config && typeof loadedSettings.config === 'object') {
            
            const validPrompts = loadedSettings.prompts.filter(p => 
              typeof p.promptId === 'string' &&
              typeof p.text === 'string' &&
              typeof p.weight === 'number' &&
              typeof p.color === 'string'
            ).map((p, index) => ({
              ...p,
              color: LYRIA_PROMPT_COLORS[index % LYRIA_PROMPT_COLORS.length]
            }));

            const validConfig = { ...INITIAL_LYRIA_CONFIG, ...loadedSettings.config };
            if (!Object.values(GenAiScale).includes(validConfig.scale as GenAiScale)) {
              validConfig.scale = INITIAL_LYRIA_CONFIG.scale;
            }
            
            const numericKeys: (keyof LiveMusicGenerationConfig)[] = ['temperature', 'guidance', 'density', 'brightness', 'bpm', 'seed', 'topK'];
            numericKeys.forEach(key => {
              if (typeof validConfig[key] !== 'number' && validConfig[key] !== undefined) {
                 const parsed = parseFloat(validConfig[key] as any);
                 (validConfig as any)[key] = isNaN(parsed) ? INITIAL_LYRIA_CONFIG[key] : parsed;
              }
              if (key === 'bpm' || key === 'seed' || key === 'topK') {
                  if (validConfig[key] !== undefined && !Number.isInteger(validConfig[key])) {
                      (validConfig as any)[key] = Math.round(validConfig[key] as number);
                  }
              }
            });

            setLyriaPrompts(validPrompts.slice(0, MAX_LYRIA_PROMPTS));
            setLyriaConfig(validConfig);
            addLogEntry(`Lyria settings loaded from ${file.name}.`, "LYRIA", "LYRIA_SYSTEM");
            setLyriaStatusMessage("Lyria settings loaded.");
          } else {
            throw new Error("Invalid Lyria settings file format.");
          }
        } catch (error) {
          console.error("Error loading Lyria settings:", error);
          addLogEntry(`Failed to load Lyria settings: ${error instanceof Error ? error.message : 'Unknown error'}.`, "ERROR", "LYRIA_SYSTEM");
          setLyriaStatusMessage("Error: Failed to load Lyria settings file.");
        }
        if (event.target) {
          event.target.value = '';
        }
      };
      reader.readAsText(file);
    }
  }, [addLogEntry, setLyriaPrompts, setLyriaConfig, setLyriaStatusMessage]);

  // The backend now handles audio context and streaming. The frontend only manages state.

  return {
    lyriaPrompts,
    setLyriaPrompts,
    lyriaConfig,
    setLyriaConfig,
    lyriaPlaybackState,
    lyriaStatusMessage,
    handleLyriaPlayPause,
    handleAddLyriaPrompt,
    handleRemoveLyriaPrompt,
    handleLyriaPromptTextChange,
    handleLyriaPromptWeightChange,
    handleLyriaConfigChange,
    handleLyriaResetContext,
    handleSaveLyriaSettings,
    handleLoadLyriaSettings,
  };
};
