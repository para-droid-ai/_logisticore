import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GameState, MapType, Faction, PlayerId, SystemLogEntry, GamePhase, GameSettings, BattleReportData, NodeActivityEntry, SidebarTab, DoctrineDefinition } from './types';
import { Map } from './components/game/Map';
import { Sidebar } from './components/game/Sidebar';
import { Button } from './components/common/Button';
import { Modal } from './components/common/Modal';
import { BattleReportModal } from './components/game/BattleReportModal';
import { NodeActivityDisplay } from './components/game/NodeActivityDisplay';
import InfoModal from './components/game/InfoModal';
import { EndGameReportModal } from './components/game/EndGameReportModal';
import { ModifiersModal } from './components/game/ModifiersModal';
import { DoctrineChoiceModal } from './components/game/DoctrineChoiceModal';
import LyriaHeaderButton from './components/lyria/LyriaHeaderButton';
import LyriaControls from './components/lyria/LyriaControls';
import LyriaSaveLoadModal from './components/lyria/LyriaSaveLoadModal';
import { ScratchpadHistoryModal } from './components/game/ScratchpadHistoryModal';
import { SCSModal } from './components/game/SCSModal';
import SCSHeaderButton from './components/ui/SCSHeaderButton';
import { useLyriaAI } from './hooks/useLyriaAI'; // Import the new hook

import { COMMAND_CONSOLE_ID } from './constants';
// No direct imports for game logic or AI services from local files.
// All game state and AI interactions will go through the backend API.

const GAME_LOGIC_SPEED_MS = 2000;
const VISUAL_TICK_MS = 100;
const LOGIC_TICKS_PER_GAME_TICK = Math.max(1, Math.floor(GAME_LOGIC_SPEED_MS / VISUAL_TICK_MS));

const AEI_HISTORY_LENGTH = 3;
const DOUBLE_CLICK_DELAY_MS = 250;
const AUTO_RESET_VIEW_DELAY_MS = 3000;


interface MapViewport {
  scale: number;
  translateX: number;
  translateY: number;
}

interface IconProps {
  className?: string;
}

const PlayIcon: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className || ''}`}><path d="M6 19V5l14 7-14 7z"></path></svg>
);
const PauseIcon: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className || ''}`}><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>
);
const SettingsIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={`w-5 h-5 ${className || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826 3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);
const DataIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={`w-4 h-4 ${className || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4M4 7l8 5 8-5M4 12l8 5 8-5" />
  </svg>
);
const ResetViewIcon: React.FC<IconProps> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 ${className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);
const InfoIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
  </svg>
);
const ModifiersIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 6m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0 M4 6l8 0 M18 6l2 0 M10 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0 M4 12l4 0 M14 12l6 0 M6 18m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0 M4 18l0 0 M10 18l10 0" />
  </svg>
);
const MusicNoteIconSM: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 ${className || ''}`}>
    <path d="M10 3.5A1.5 1.5 0 0 1 11.5 2h.05a1.5 1.5 0 0 1 1.45 1.5V11a3 3 0 1 1-2.5-2.917V3.5ZM9 14.5A1.5 1.5 0 1 0 12 13a1.5 1.5 0 0 0-3 1.5Z" />
  </svg>
);


const App: React.FC = () => {
  const [selectedMapTypeForNewGame, setSelectedMapTypeForNewGame] = useState<MapType>(MapType.VOLGOGRAD_CAULDRON);
  const [gameSettings, setGameSettings] = useState<GameSettings>(() => ({ // Initialize with a function to read from localStorage or default
    isFoWEnabledForNewGame: true,
    selectedGenAIModel: 'gemini-2.5-flash-preview-04-17',
    isAggressiveSanitizationEnabled: false, 
    isStructuredOutputEnabled: true,    
  }));
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isModifiersModalOpen, setIsModifiersModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isDoctrineChoiceModalOpen, setIsDoctrineChoiceModalOpen] = useState(false);
  const [availableDoctrineChoices, setAvailableDoctrineChoices] = useState<DoctrineDefinition[]>([]);
  
  const [isSCSModalOpen, setIsSCSModalOpen] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab>('SYSTEM_LOG');
  const [expandedSidebarTab, setExpandedSidebarTab] = useState<SidebarTab | null>(null);
  const [hasNewSystemLogEntry, setHasNewSystemLogEntry] = useState(false);
  const [hasNewBattleHistoryEntry, setHasNewBattleHistoryEntry] = useState(false);
  const [hasNewSCSMessage, setHasNewSCSMessage] = useState(false);

  const [isScratchpadHistoryModalOpen, setIsScratchpadHistoryModalOpen] = useState(false);
  const [scratchpadHistoryFaction, setScratchpadHistoryFaction] = useState<Faction | null>(null);
  const [selectedBattleReportId, setSelectedBattleReportId] = useState<string | null>(null);
  const [isBattleReportModalOpen, setIsBattleReportModalOpen] = useState(false);
  const [isEndGameReportModalOpen, setIsEndGameReportModalOpen] = useState(false);

  const [mapViewport, setMapViewport] = useState<MapViewport>({ scale: 1, translateX: 0, translateY: 0 });
  const [zoomTargetNodeId, setZoomTargetNodeId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStartViewport, setPanStartViewport] = useState<{ x: number, y: number, tx: number, ty: number } | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [autoResetViewTimer, setAutoResetViewTimer] = useState<number | null>(null);
  const [isSaveLoadModalOpen, setIsSaveLoadModalOpen] = useState(false);

  const gameStateRef = useRef(gameState);
  const prevPhaseRef = useRef<GamePhase | null>(null);

  const [showLyriaControlsInSettings, setShowLyriaControlsInSettings] = useState(false);
  const [isLyriaSaveLoadModalOpen, setIsLyriaSaveLoadModalOpen] = useState(false);

  const { lyriaPrompts, setLyriaPrompts, lyriaConfig, setLyriaConfig, lyriaPlaybackState, lyriaStatusMessage, handleLyriaPlayPause, handleAddLyriaPrompt, handleRemoveLyriaPrompt, handleLyriaPromptTextChange, handleLyriaPromptWeightChange, handleLyriaConfigChange, handleLyriaResetContext, handleSaveLyriaSettings, handleLoadLyriaSettings } = useLyriaAI({ addLogEntry });

  

  useEffect(() => {
    gameStateRef.current = gameState;
    if (prevPhaseRef.current !== 'GAME_OVER' && gameState?.currentPhase === 'GAME_OVER' && !isEndGameReportModalOpen) {
      setIsEndGameReportModalOpen(true);
    }
    prevPhaseRef.current = gameState?.currentPhase || null;
  }, [gameState, isEndGameReportModalOpen]);

  const phaseExecutionLock = useRef(false);
  const logicTickCounterRef = useRef(0);
  const clickTimerRef = useRef<number | null>(null);
  const firstClickNodeIdRef = useRef<string | null>(null);

  const addLogEntry = useCallback((message: string, type: SystemLogEntry['type'] = 'INFO', source?: PlayerId | 'LYRIA_SYSTEM' | 'SCS_SYSTEM' | 'COMMAND_CONSOLE', phaseOverride?: GamePhase) => {
    setGameState(prev => {
      if (!prev) return prev; // Don't add logs if gameState is null
      return {
        ...prev,
        systemLog: [
          ...prev.systemLog,
          {
            id: `log-${Date.now()}-${Math.random()}`,
            timestamp: new Date().toLocaleTimeString(),
            turn: prev.turn ?? 0,
            phase: phaseOverride || prev.currentPhase,
            message,
            type,
            source: source || (prev.activePlayerForManeuver && (prev.currentPhase.startsWith('MANEUVER') || prev.currentPhase.startsWith('FORTIFY')) ? prev.activePlayerForManeuver : undefined),
          },
        ],
      };
    });
    if (activeSidebarTab !== 'SYSTEM_LOG') {
        setHasNewSystemLogEntry(true);
    }
  }, [setGameState, activeSidebarTab]);

  const addNodeActivityEntry = useCallback((node: NodeData, message: string, type: NodeActivityEntry['type'], factionId?: PlayerId) => {
    setGameState(prev => {
      if (!prev) return prev; // Don't add activity if gameState is null
      return {
        ...prev,
        lastTurnNodeActivity: [
          ...prev.lastTurnNodeActivity,
          {
            id: `node-act-${Date.now()}-${Math.random()}`,
            turn: prev.turn ?? 0,
            nodeId: node.id,
            nodeLabel: node.label,
            message,
            type,
            factionId: factionId || node.owner,
          }
        ]
      };
    });
  }, [setGameState]);

  const handleResetView = useCallback(() => {
    if (autoResetViewTimer) {
      window.clearTimeout(autoResetViewTimer);
      setAutoResetViewTimer(null);
    }
    setMapViewport({ scale: 1, translateX: 0, translateY: 0 });
    setZoomTargetNodeId(null);
  }, [autoResetViewTimer]);

  const zoomToCoordinates = useCallback((targetXPercent: number, targetYPercent: number, targetScale: number) => {
    if (!mapContainerRef.current) return;

    const mapWidth = mapContainerRef.current.offsetWidth;
    const mapHeight = mapContainerRef.current.offsetHeight;

    const nodeMapX = targetXPercent / 100 * mapWidth;
    const nodeMapY = targetYPercent / 100 * mapHeight;

    const viewportCenterX = mapWidth / 2;
    const viewportCenterY = mapHeight / 2;

    const newTranslateX = targetScale * (viewportCenterX - nodeMapX);
    const newTranslateY = targetScale * (viewportCenterY - nodeMapY);

    setMapViewport({
      scale: targetScale,
      translateX: newTranslateX,
      translateY: newTranslateY,
    });
  }, []);


  const handleNodeInteraction = useCallback((nodeId: string) => {
    if (clickTimerRef.current && firstClickNodeIdRef.current === nodeId) {
      window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      firstClickNodeIdRef.current = null;

      const node = gameStateRef.current?.mapNodes[nodeId];
      if (!node) return;

      if (mapViewport.scale > 1.8 && zoomTargetNodeId === nodeId) {
        handleResetView();
      } else {
        if (autoResetViewTimer) {
          window.clearTimeout(autoResetViewTimer);
          setAutoResetViewTimer(null);
        }
        zoomToCoordinates(node.x, node.y, 2.0);
        setZoomTargetNodeId(nodeId);
      }
    } else {
      if (clickTimerRef.current) {
        window.clearTimeout(clickTimerRef.current);
      }
      firstClickNodeIdRef.current = nodeId;
      clickTimerRef.current = window.setTimeout(() => {
        setSelectedNodeId(prevId => prevId === nodeId ? null : nodeId);
        clickTimerRef.current = null;
        firstClickNodeIdRef.current = null;
      }, DOUBLE_CLICK_DELAY_MS);
    }
  }, [mapViewport.scale, zoomTargetNodeId, handleResetView, zoomToCoordinates, autoResetViewTimer]);


  const handleMapPanStart = (event: React.MouseEvent) => {
    setIsPanning(true);
    setPanStartViewport({
      x: event.clientX,
      y: event.clientY,
      tx: mapViewport.translateX,
      ty: mapViewport.translateY,
    });
  };

  const handleMapPanMove = (event: React.MouseEvent) => {
    if (!isPanning || !panStartViewport) return;
    const dx = event.clientX - panStartViewport.x;
    const dy = event.clientY - panStartViewport.y;
    setMapViewport(prev => ({
      ...prev,
      translateX: panStartViewport.tx + dx,
      translateY: panStartViewport.ty + dy,
    }));
  };

  const handleMapPanEnd = () => {
    setIsPanning(false);
    setPanStartViewport(null);
  };

  const handleMapWheel = useCallback((event: React.WheelEvent) => {
    if (autoResetViewTimer) {
      window.clearTimeout(autoResetViewTimer);
      setAutoResetViewTimer(null);
    }
    if (!mapContainerRef.current) return;
    event.preventDefault();

    const rect = mapContainerRef.current.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const oldScale = mapViewport.scale;
    const newScale = Math.max(0.5, Math.min(3.0, oldScale - event.deltaY * 0.001 * oldScale));

    const mapContentMouseX = (mouseX - mapViewport.translateX) / oldScale;
    const mapContentMouseY = (mouseY - mapViewport.translateY) / oldScale;

    const newTranslateX = mouseX - mapContentMouseX * newScale;
    const newTranslateY = mouseY - mapContentMouseY * newScale;

    setMapViewport({
      scale: targetScale,
      translateX: newTranslateX,
      translateY: newTranslateY,
    });
  }, [mapViewport, autoResetViewTimer]);


  const handleNewSetup = useCallback(async () => {
    addLogEntry("Initializing new game setup...", "EVENT");
    try {
      const response = await fetch('http://localhost:3001/api/game/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mapType: selectedMapTypeForNewGame, gameSettings }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const newGameState = await response.json();
      setGameState(newGameState);
      setSelectedNodeId(null);
      setActiveSidebarTab('SYSTEM_LOG');
      setExpandedSidebarTab(null);
      setHasNewSystemLogEntry(false);
      setHasNewBattleHistoryEntry(false);
      setHasNewSCSMessage(false);
      handleResetView();
      setIsSaveLoadModalOpen(false);
      setIsEndGameReportModalOpen(false);
    } catch (error) {
      console.error("Failed to create new game:", error);
      addLogEntry(`Failed to create new game: ${error instanceof Error ? error.message : 'Unknown error'}`, "ERROR");
    }
  }, [addLogEntry, gameSettings, selectedMapTypeForNewGame, handleResetView]);


  const handleTogglePlayPause = useCallback(async () => {
    if (!gameState) return; // Cannot toggle if gameState is null

    const newIsGameRunning = !gameState.isGameRunning;

    if (newIsGameRunning) {
      addLogEntry("Game Resumed.", "EVENT", undefined, gameState.currentPhase);
      setGameState(prev => prev ? { ...prev, isGameRunning: newIsGameRunning, gameMessage: null } : null);

      // If resuming, immediately try to advance the phase via backend
      try {
        const response = await fetch('http://localhost:3001/api/game/next-phase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameSettings }),
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const updatedGameState = await response.json();
        setGameState(updatedGameState);

        if (updatedGameState.currentPhase === 'DOCTRINE' && updatedGameState.currentDoctrineChoices) {
          handleOpenDoctrineChoiceModal(updatedGameState.currentDoctrineChoices[COMMAND_CONSOLE_ID]);
        }
      } catch (error) {
        console.error("Failed to advance game phase:", error);
        addLogEntry(`Failed to advance game phase: ${error instanceof Error ? error.message : 'Unknown error'}`, "ERROR");
        setGameState(prev => prev ? { ...prev, isGameRunning: false, gameMessage: "Error: Game Halted" } : null);
      }

    } else {
      addLogEntry("Game Paused.", "EVENT", undefined, gameState.currentPhase);
      setGameState(prev => prev ? { ...prev, isGameRunning: newIsGameRunning, gameMessage: "Game Paused" } : null);
    }
  }, [gameState, addLogEntry, gameSettings]);

  const handleOpenScratchpadHistoryModal = (factionId: PlayerId) => {
    if (!gameState) return; // Cannot open if gameState is null
    setScratchpadHistoryFaction(gameState.factions[factionId]);
    setIsScratchpadHistoryModalOpen(true);
    if (gameState.isGameRunning) {
      setGameState(prev => ({...prev, isGameRunning: false, gameMessage: "Game Paused"}));
      addLogEntry("Game Paused: Scratchpad History opened.", "INFO");
    }
  };
  const handleCloseScratchpadHistoryModal = () => {
    setIsScratchpadHistoryModalOpen(false); setScratchpadHistoryFaction(null);
    setGameState(prev => ({...prev, gameMessage: prev?.gameMessage === "Game Paused" ? null : prev?.gameMessage }));
  };


  const handleOpenBattleReportModal = (battleId: string) => {
    setSelectedBattleReportId(battleId);
    setIsBattleReportModalOpen(true);
    if (gameState?.isGameRunning) {
      setGameState(prev => ({...prev, isGameRunning: false, gameMessage: "Game Paused"}));
      addLogEntry("Game Paused: Battle Report opened.", "INFO");
    }
  };
  const handleCloseBattleReportModal = () => {
    setIsBattleReportModalOpen(false);
    setSelectedBattleReportId(null);
    setGameState(prev => ({...prev, gameMessage: prev?.gameMessage === "Game Paused" ? null : prev?.gameMessage }));
  };

  const handleOpenDoctrineChoiceModal = useCallback((choices: DoctrineDefinition[]) => {
    setAvailableDoctrineChoices(choices);
    setIsDoctrineChoiceModalOpen(true);
    if (gameState?.isGameRunning) {
      setGameState(prev => ({...prev, isGameRunning: false, gameMessage: "Game Paused: Choose Doctrine"}));
      addLogEntry("Game Paused: Doctrine Choice required.", "INFO");
    }
  }, [gameState, addLogEntry]);

  const handleDoctrineSelected = useCallback(async (doctrineId: string) => {
    if (!gameState) return;
    addLogEntry(`Doctrine selected: ${doctrineId}`, "INFO", COMMAND_CONSOLE_ID);
    setIsDoctrineChoiceModalOpen(false);
    setAvailableDoctrineChoices([]);
    setGameState(prev => ({...prev, gameMessage: "Applying doctrine..."}));

    try {
      const response = await fetch('http://localhost:3001/api/game/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionType: 'chooseDoctrine', payload: { doctrineId } }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const updatedGameState = await response.json();
      setGameState(updatedGameState);
      addLogEntry(`Doctrine ${doctrineId} applied.`, "EVENT");
    } catch (error) {
      console.error("Failed to apply doctrine:", error);
      addLogEntry(`Failed to apply doctrine: ${error instanceof Error ? error.message : 'Unknown error'}`, "ERROR");
      setGameState(prev => prev ? { ...prev, isGameRunning: false, gameMessage: "Error: Game Halted" } : null);
    }
  }, [gameState, addLogEntry]);

  const selectedBattleReport = useMemo(() => {
    if (!selectedBattleReportId || !gameState) return null;
    return gameState.battleLog.find(b => b.id === selectedBattleReportId) || null;
  }, [selectedBattleReportId, gameState?.battleLog]);
  
  const toggleSCSModal = () => {
    const openingSCSModal = !isSCSModalOpen;
    if (openingSCSModal) {
        if (activeSidebarTab === 'SCS_LOG') {
            setActiveSidebarTab('SYSTEM_LOG'); 
            setExpandedSidebarTab(null);
        }
        if (gameState?.isGameRunning) {
            setGameState(prev => ({...prev, isGameRunning: false, gameMessage: "Game Paused"}));
            addLogEntry("Game Paused: SCS Modal opened.", "INFO");
        }
        setHasNewSCSMessage(false); // Clear notification when modal is opened
    } else {
         setGameState(prev => ({...prev, gameMessage: prev?.gameMessage === "Game Paused" ? null : prev?.gameMessage }));
    }
    setIsSCSModalOpen(openingSCSModal);
  };
  
  const handleDockSCSPanel = () => {
    setActiveSidebarTab('SCS_LOG');
    setHasNewSCSMessage(false);
    setIsSCSModalOpen(false);
    setExpandedSidebarTab(null); 
    // If game was paused due to SCS modal, clear pause message. User must manually resume.
    setGameState(prev => ({...prev, gameMessage: prev?.gameMessage === "Game Paused" ? null : prev?.gameMessage }));
  };

  const handleSendDirective = useCallback(async (message: string, target: PlayerId | 'BROADCAST') => {
    if (!gameState) return; // Cannot send directive if gameState is null
    try {
      const response = await fetch('http://localhost:3001/api/game/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionType: 'sendDirective', payload: { message, target } }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const updatedGameState = await response.json();
      setGameState(updatedGameState);
      addLogEntry(`Directive to ${target === 'BROADCAST' ? 'ALL' : gameState.factions[target]?.name || target}: "${message}"`, 'DIRECTIVE', COMMAND_CONSOLE_ID);
      if (activeSidebarTab !== 'SCS_LOG') {
        setHasNewSCSMessage(true);
      }
    } catch (error) {
      console.error("Failed to send directive:", error);
      addLogEntry(`Failed to send directive: ${error instanceof Error ? error.message : 'Unknown error'}`, "ERROR", COMMAND_CONSOLE_ID);
    }
  }, [gameState, activeSidebarTab, addLogEntry]);


  const handleCombatPhase = useCallback(async () => {
    if (!gameStateRef.current) return;
    addLogEntry(`Starting COMBAT phase for Turn ${gameStateRef.current.turn}.`, 'PHASE_TRANSITION', undefined, 'COMBAT');
    setGameState(prev => {
      if (!prev) return prev;
      return { ...prev, gameMessage: "Resolving battles..." };
    });
    if (activeSidebarTab !== 'BATTLE_HISTORY') {
        setHasNewBattleHistoryEntry(true);
    }

    try {
      const response = await fetch('http://localhost:3001/api/game/next-phase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameSettings }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const updatedGameState = await response.json();
      setGameState(updatedGameState);
    } catch (error) {
      console.error("Failed to advance to Combat Phase:", error);
      addLogEntry(`Failed to advance to Combat Phase: ${error instanceof Error ? error.message : 'Unknown error'}`, "ERROR");
    }
  }, [addLogEntry, activeSidebarTab, gameSettings]);
  

  
    <div className="app-container font-space-mono flex flex-col h-screen bg-gray-900 text-gray-100">
      <header className="flex items-center justify-between p-4 bg-gray-800 shadow-md">
        <h1 className="text-2xl font-bold text-red-500">Attrition Doctrine</h1>
        <div className="flex items-center space-x-4">
          <Button onClick={handleNewSetup} className="bg-blue-600 hover:bg-blue-700">New Game</Button>
          <Button onClick={handleTogglePlayPause} className={gameState?.isGameRunning ? "bg-yellow-600 hover:bg-yellow-700" : "bg-green-600 hover:bg-green-700"}>
            {gameState?.isGameRunning ? <PauseIcon /> : <PlayIcon />}
            {gameState?.isGameRunning ? 'Pause' : 'Play'}
          </Button>
          <Button onClick={() => setIsSettingsModalOpen(true)} className="bg-gray-600 hover:bg-gray-700"><SettingsIcon />Settings</Button>
          <Button onClick={() => setIsModifiersModalOpen(true)} className="bg-gray-600 hover:bg-gray-700"><ModifiersIcon />Modifiers</Button>
          <Button onClick={() => setIsInfoModalOpen(true)} className="bg-gray-600 hover:bg-gray-700"><InfoIcon />Info</Button>
          <LyriaHeaderButton onPlayPause={handleLyriaPlayPause} playbackState={lyriaPlaybackState} isLyriaReady={lyriaPlaybackState !== 'error'} />
          <SCSHeaderButton onClick={toggleSCSModal} hasNewSCSMessage={hasNewSCSMessage} />
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        <div className="relative flex-1">
          {gameState && (
            <Map
              gameState={gameState}
              selectedNodeId={selectedNodeId}
              onNodeClick={handleNodeInteraction}
              mapViewport={mapViewport}
              setMapViewport={setMapViewport}
              mapContainerRef={mapContainerRef}
              onMouseDown={handleMapPanStart}
              onMouseMove={handleMapPanMove}
              onMouseUp={handleMapPanEnd}
              onMouseLeave={handleMapPanEnd}
              onWheel={handleMapWheel}
            />
          )}
          {gameState?.gameMessage && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-800 text-white px-4 py-2 rounded-lg shadow-lg z-10">
              {gameState.gameMessage}
            </div>
          )}
          {gameState && <NodeActivityDisplay nodeActivity={gameState.lastTurnNodeActivity} />}
        </div>

        {gameState && (
          <Sidebar
            gameState={gameState}
            selectedNodeId={selectedNodeId}
            setSelectedNodeId={setSelectedNodeId}
            addLogEntry={addLogEntry}
            addNodeActivityEntry={addNodeActivityEntry}
            handleOpenBattleReportModal={handleOpenBattleReportModal}
            activeTab={activeSidebarTab}
            setActiveTab={setActiveSidebarTab}
            expandedTab={expandedSidebarTab}
            setExpandedTab={setExpandedSidebarTab}
            setHasNewSystemLogEntry={setHasNewSystemLogEntry}
            setHasNewBattleHistoryEntry={setHasNewBattleHistoryEntry}
            setHasNewSCSMessage={setHasNewSCSMessage}
            handleOpenScratchpadHistoryModal={handleOpenScratchpadHistoryModal}
            handleSendDirective={handleSendDirective}
            handleCombatPhase={handleCombatPhase}
          />
        )}
      </main>

      {/* Settings Modal */}
      <Modal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} title="Settings">
        <div className="p-4 text-gray-200">
          <div className="mb-4">
            <label className="block text-sm font-bold mb-2" htmlFor="mapType">
              Select Map Type:
            </label>
            <select
              id="mapType"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
              value={selectedMapTypeForNewGame}
              onChange={(e) => setSelectedMapTypeForNewGame(e.target.value as MapType)}
            >
              {Object.values(MapType).map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              id="fogOfWar"
              className="mr-2 leading-tight"
              checked={gameSettings.isFoWEnabledForNewGame}
              onChange={(e) => setGameSettings(prev => ({ ...prev, isFoWEnabledForNewGame: e.target.checked }))}
            />
            <label htmlFor="fogOfWar" className="text-sm">
              Enable Fog of War for New Game
            </label>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-bold mb-2" htmlFor="genAIModel">
              Select Generative AI Model:
            </label>
            <select
              id="genAIModel"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
              value={gameSettings.selectedGenAIModel}
              onChange={(e) => setGameSettings(prev => ({ ...prev, selectedGenAIModel: e.target.value }))}
            >
              <option value="gemini-1.5-flash-latest">Gemini 1.5 Flash (Latest)</option>
              <option value="gemini-1.5-pro-latest">Gemini 1.5 Pro (Latest)</option>
              <option value="gemini-pro">Gemini Pro (Legacy)</option>
              <option value="gemma-7b-it">Gemma 7B IT (Local)</option>
            </select>
          </div>
          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              id="aggressiveSanitization"
              className="mr-2 leading-tight"
              checked={gameSettings.isAggressiveSanitizationEnabled}
              onChange={(e) => setGameSettings(prev => ({ ...prev, isAggressiveSanitizationEnabled: e.target.checked }))}
            />
            <label htmlFor="aggressiveSanitization" className="text-sm">
              Enable Aggressive Sanitization (for AI output)
            </label>
          </div>
          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              id="structuredOutput"
              className="mr-2 leading-tight"
              checked={gameSettings.isStructuredOutputEnabled}
              onChange={(e) => setGameSettings(prev => ({ ...prev, isStructuredOutputEnabled: e.target.checked }))}
            />
            <label htmlFor="structuredOutput" className="text-sm">
              Enable Structured Output (for AI output)
            </label>
          </div>
          <div className="flex items-center justify-between mt-4">
            <Button onClick={handleNewSetup} className="bg-blue-600 hover:bg-blue-700">Apply Settings & New Game</Button>
          </div>
          <div className="mt-6">
            <h3 className="text-lg font-bold mb-2">Lyria Music Engine Settings</h3>
            <Button onClick={() => setShowLyriaControlsInSettings(!showLyriaControlsInSettings)} className="bg-gray-600 hover:bg-gray-700 text-sm py-1 px-2">
              {showLyriaControlsInSettings ? 'Hide Lyria Controls' : 'Show Lyria Controls'}
            </Button>
            {showLyriaControlsInSettings && (
              <LyriaControls
                lyriaPrompts={lyriaPrompts}
                setLyriaPrompts={setLyriaPrompts}
                lyriaConfig={lyriaConfig}
                setLyriaConfig={setLyriaConfig}
                lyriaPlaybackState={lyriaPlaybackState}
                lyriaStatusMessage={lyriaStatusMessage}
                handleLyriaPlayPause={handleLyriaPlayPause}
                handleAddLyriaPrompt={handleAddLyriaPrompt}
                handleRemoveLyriaPrompt={handleRemoveLyriaPrompt}
                handleLyriaPromptTextChange={handleLyriaPromptTextChange}
                handleLyriaPromptWeightChange={handleLyriaPromptWeightChange}
                handleLyriaConfigChange={handleLyriaConfigChange}
                handleLyriaResetContext={handleLyriaResetContext}
                handleOpenLyriaSaveLoadModal={handleOpenLyriaSaveLoadModal}
              />
            )}
          </div>
        </div>
      </Modal>

      {/* Modifiers Modal */}
      <Modal isOpen={isModifiersModalOpen} onClose={() => setIsModifiersModalOpen(false)} title="Game Modifiers">
        <ModifiersModal />
      </Modal>

      {/* Info Modal */}
      <Modal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} title="Attrition Doctrine Info">
        <InfoModal />
      </Modal>

      {/* Battle Report Modal */}
      {selectedBattleReport && (
        <BattleReportModal
          isOpen={isBattleReportModalOpen}
          onClose={handleCloseBattleReportModal}
          battleReport={selectedBattleReport}
          factions={gameState?.factions}
          nodes={gameState?.mapNodes}
        />
      )}

      {/* End Game Report Modal */}
      {gameState?.currentPhase === 'GAME_OVER' && isEndGameReportModalOpen && (
        <EndGameReportModal
          isOpen={isEndGameReportModalOpen}
          onClose={() => setIsEndGameReportModalOpen(false)}
          gameState={gameState}
        />
      )}

      {/* Scratchpad History Modal */}
      {isScratchpadHistoryModalOpen && scratchpadHistoryFaction && (
        <ScratchpadHistoryModal
          isOpen={isScratchpadHistoryModalOpen}
          onClose={handleCloseScratchpadHistoryModal}
          faction={scratchpadHistoryFaction}
        />
      )}

      {/* SCS Modal */}
      {isSCSModalOpen && gameState && (
        <SCSModal
          isOpen={isSCSModalOpen}
          onClose={toggleSCSModal}
          gameState={gameState}
          handleSendDirective={handleSendDirective}
          handleDockSCSPanel={handleDockSCSPanel}
        />
      )}

      {/* Lyria Save/Load Modal */}
      {isLyriaSaveLoadModalOpen && (
        <LyriaSaveLoadModal
          isOpen={isLyriaSaveLoadModalOpen}
          onClose={handleCloseLyriaSaveLoadModal}
          onSave={handleSaveLyriaSettings}
          onLoad={handleLoadLyriaSettings}
        />
      )}

      {/* Doctrine Choice Modal */}
      {isDoctrineChoiceModalOpen && (
        <DoctrineChoiceModal
          isOpen={isDoctrineChoiceModalOpen}
          onClose={() => setIsDoctrineChoiceModalOpen(false)} // Allow closing without selection, but game remains paused
          doctrineChoices={availableDoctrineChoices}
          onDoctrineSelected={handleDoctrineSelected}
        />
      )}
    </div>
  );
};

export default App;
