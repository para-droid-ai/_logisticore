
import React, { useEffect, useRef } from 'react';
import { GameState, Faction, SystemLogEntry, BattleLogEntry, PlayerId, NodeData, SidebarTab, CommLogEntry } from '../../types';
import { AI1_ID, AI2_ID, FACTION_COLORS, SYSTEM_SENDER_NAME, COMMAND_CONSOLE_ID } from '../../constants';

interface SidebarProps {
  gameState: GameState;
  activeSidebarTab: SidebarTab;
  setActiveSidebarTab: (tab: SidebarTab) => void;
  expandedSidebarTab: SidebarTab | null;
  setExpandedSidebarTab: (tab: SidebarTab | null) => void;
  onOpenBattleReportModal: (battleId: string) => void;
  commLog: CommLogEntry[];
  factions: Record<PlayerId, Faction>; // Added for SCS Log rendering
  hasNewSystemLogEntry: boolean;
  setHasNewSystemLogEntry: (value: boolean) => void;
  hasNewBattleHistoryEntry: boolean;
  setHasNewBattleHistoryEntry: (value: boolean) => void;
  hasNewSCSMessage: boolean;
  setHasNewSCSMessage: (value: boolean) => void;
}

const ClockIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 mr-1 ${className}`}>
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
  </svg>
);

const ExpandIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9M20.25 20.25h-4.5m4.5 0v-4.5m0-4.5L15 15" />
  </svg>
);

const CollapseIcon: React.FC<{className?: string}> = ({className}) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 ${className}`}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9V4.5M15 9h4.5M15 9l5.25-5.25M15 15v4.5M15 15h4.5M15 15l5.25 5.25" />
</svg>
);

const CopyIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m9.75 0V9.375c0 .621-.504 1.125-1.125 1.125H18v-3.375c0-.621.504-1.125 1.125-1.125h2.25z" />
  </svg>
);

const InfoRow: React.FC<{ label: string; value: string | number; valueColor?: string; className?: string }> = ({ label, value, valueColor, className }) => (
  <div className={`flex justify-between text-xs mb-1 ${className || ''}`}>
    <span className="text-terminal-gray-light">{label}:</span>
    <span className={`${valueColor || 'text-terminal-green'} font-semibold`}>{value}</span>
  </div>
);

const FactionPanel: React.FC<{ faction: Faction, title: string, mapNodes: Record<string, NodeData> }> = ({ faction, title, mapNodes }) => {
  const factionTheme = FACTION_COLORS[faction.id];
  let matIncome = 0;
  let qrIncome = 0;

  Object.values(mapNodes).forEach(node => {
    if (node.owner === faction.id) {
      if (!(node.interdictedTurns && node.interdictedTurns > 0) && !node.lowSupply) { 
        matIncome += node.MAT_output || 0;
      }
      qrIncome += node.qrOutput || 0; 
    }
  });

  const standardUnits = faction.totalUnits - (faction.evolvedUnits || 0); 
  const reconCapabilityText = faction.isReconSystemActive ? "READY" : "OFFLINE";
  let reconStatusColor = factionTheme.primary;
  if (faction.isReconSystemActive) {
    reconStatusColor = 'text-terminal-yellow';
    if (faction.hasActiveReconPulseThisTurn) {
      reconStatusColor = 'text-terminal-red';
    }
  }

  return (
    <div className={`p-2 terminal-border border-opacity-30 mb-2 ${factionTheme.border} h-full`}>
      <h4 className={`text-sm font-bold ${factionTheme.primary} mb-1`}>{title}</h4>
      <InfoRow label="Recon" value={reconCapabilityText} valueColor={reconStatusColor} />
      <InfoRow label="QR" value={`${faction.qr} (+${qrIncome})`} valueColor={factionTheme.primary} />
      <InfoRow label="MAT" value={`${faction.MAT.toFixed(2)} (+${matIncome})`} valueColor={factionTheme.primary} />
      <div className="my-2 border-t border-terminal-green border-opacity-20"></div>
      <h5 className={`${factionTheme.primary} text-xs font-semibold mb-1`}>Force Composition</h5>
      <InfoRow label="Total Units" value={faction.totalUnits} valueColor={factionTheme.primary}/>
      <InfoRow label="Standard Units" value={standardUnits} valueColor={factionTheme.primary}/>
      <InfoRow label="Evolved Units" value={faction.evolvedUnits || 0} valueColor={factionTheme.primary}/>
      <InfoRow label="Units Lost" value={faction.totalUnitsLost} valueColor={factionTheme.primary}/>
      <InfoRow label="Artillery" value={faction.totalArtillery} valueColor={factionTheme.primary}/>
      <InfoRow label="Infiltrators" value={faction.totalInfiltrators} valueColor={factionTheme.primary}/>
      <InfoRow label="Fortified Nodes" value={faction.totalFortifiedNodes} valueColor={factionTheme.primary}/>
      {faction.activeDoctrines && faction.activeDoctrines.length > 0 && (
        <div className="mt-2">
          <h5 className={`${factionTheme.primary} text-xs font-semibold mb-1`}>Active Doctrines</h5>
          {faction.activeDoctrines.map(doctrine => (
            <p key={doctrine.id} className="text-xs text-terminal-gray-light leading-tight">
              - {doctrine.name}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ 
    gameState, 
    factions, 
    activeSidebarTab, setActiveSidebarTab,
    expandedSidebarTab, setExpandedSidebarTab,
    onOpenBattleReportModal,
    commLog,
    hasNewSystemLogEntry, setHasNewSystemLogEntry,
    hasNewBattleHistoryEntry, setHasNewBattleHistoryEntry,
    hasNewSCSMessage, setHasNewSCSMessage
}) => {
  const logContentRef = useRef<HTMLDivElement>(null);
  
  const systemLogLength = gameState.systemLog.length;
  const battleLogLength = gameState.battleLog.length;
  const commLogLength = commLog.length;

  useEffect(() => {
    if (logContentRef.current) {
      const scroller = logContentRef.current;
      requestAnimationFrame(() => {
        if (!expandedSidebarTab) { // Active, non-expanded tab
          if (activeSidebarTab === 'SYSTEM_LOG') {
            // System Log: newest is at the bottom (due to direct map), scroll to bottom
            scroller.scrollTop = scroller.scrollHeight;
          } else if (activeSidebarTab === 'BATTLE_HISTORY' || activeSidebarTab === 'SCS_LOG') {
            // Battle History & SCS Log: newest is at the top (due to .slice().reverse()), scroll to top
            scroller.scrollTop = 0;
          }
        } else { // Active, expanded tab
          // When an expanded tab becomes active (e.g., switching back to game view, or opening it),
          // scroll its content to the top for a consistent starting view.
           if (activeSidebarTab === expandedSidebarTab) { 
            scroller.scrollTop = 0;
          }
        }
      });
    }
  }, [
    activeSidebarTab,
    expandedSidebarTab,
    (activeSidebarTab === 'SYSTEM_LOG' && !expandedSidebarTab) ? systemLogLength : undefined,
    (activeSidebarTab === 'BATTLE_HISTORY' && !expandedSidebarTab) ? battleLogLength : undefined,
    (activeSidebarTab === 'SCS_LOG' && !expandedSidebarTab) ? commLogLength : undefined,
  ]);


  const formatTimeWithMilliseconds = (seconds: number | undefined): string => {
    if (seconds === undefined || isNaN(seconds) || seconds < 0) seconds = 0;
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    const ms = Math.floor((seconds * 10) % 10); 
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${ms.toString()}`;
  };
  
  const formatTotalTimeWithoutMilliseconds = (seconds: number): string => {
    if (seconds === undefined || isNaN(seconds) || seconds < 0) seconds = 0;
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const formatLogTimestamp = (timestamp: string) => {
    return timestamp.split(" ")[0]; 
  };

  const activePlayerNameForTurnDisplay = gameState.activePlayerForManeuver ? gameState.factions[gameState.activePlayerForManeuver]?.name : 
                                         gameState.currentPhase === 'FLUCTUATION' || gameState.currentPhase === 'RESOURCE' || gameState.currentPhase === 'COMBAT' || gameState.currentPhase === 'UPKEEP' ? 
                                         'SYSTEM' : '';
  
  const currentTurnElapsedTime = gameState.gameTimeElapsed - gameState.turnStartTime;
  
  const handleCopyLog = (logType: SidebarTab) => {
    let logText = "";
    if (logType === 'SYSTEM_LOG') {
        logText = gameState.systemLog.map(entry => // Display order: oldest first, newest last (matching visual)
          `${formatLogTimestamp(entry.timestamp)} [T${entry.turn},${entry.phase.substring(0,4)}] ${entry.source ? `${gameState.factions[entry.source as PlayerId]?.name || entry.source}: ` : `${(SYSTEM_SENDER_NAME || 'SYSTEM')}: `}${entry.message}`
        ).join('\n');
    } else if (logType === 'BATTLE_HISTORY') {
        logText = gameState.battleLog.slice().reverse().map(battle => // Display newest first
            `T${battle.turn}: ${battle.nodeName} - ${gameState.factions[battle.attacker]?.name} vs ${gameState.factions[battle.defender]?.name} - ${battle.outcome.replace('_', ' ')}`
        ).join('\n');
    } else if (logType === 'SCS_LOG') {
        logText = commLog.slice().reverse().map(entry => { // Display newest first
            const targetInfo = entry.senderId === COMMAND_CONSOLE_ID && entry.targetFactionId && entry.targetFactionId !== 'BROADCAST' 
                               ? ` to ${factions[entry.targetFactionId as PlayerId]?.name || entry.targetFactionId}`
                               : '';
            return `${entry.senderName} (T${entry.turn}${targetInfo}): ${entry.message}`;
        }).join('\n');
    }
    navigator.clipboard.writeText(logText)
      .then(() => alert(`${logType.replace('_', ' ')} copied to clipboard!`))
      .catch(err => console.error(`Failed to copy ${logType}: `, err));
  };

  const renderLogContent = (tab: SidebarTab) => {
    switch (tab) {
      case 'SYSTEM_LOG':
        return (
          <>
            {gameState.systemLog.length === 0 && <p className="text-terminal-gray-light italic">No system events.</p>}
            {gameState.systemLog.map(entry => ( // gameState.systemLog has newest entries at the end
            <p key={entry.id} className="mb-1 leading-tight">
                <span className="text-terminal-gray-light">{formatLogTimestamp(entry.timestamp)} [T${entry.turn},{entry.phase.substring(0,4)}] </span>
                <span className={entry.source ? (FACTION_COLORS[entry.source as PlayerId]?.primary || 'text-terminal-cyan') : 'text-terminal-green'}>
                {entry.source ? `${gameState.factions[entry.source as PlayerId]?.name || entry.source}: ` : `${(SYSTEM_SENDER_NAME || 'SYSTEM')}: `}
                </span>
                <span className="text-gray-300">{entry.message}</span>
            </p>
            ))}
          </>
        );
      case 'BATTLE_HISTORY':
        return (
          <>
            {gameState.battleLog.length === 0 && <p className="text-terminal-gray-light italic">No battles recorded.</p>}
            {gameState.battleLog.slice().reverse().map(battle => ( // Newest entries are at the end, so reverse for display
              <button 
                key={battle.id} 
                onClick={() => onOpenBattleReportModal(battle.id)}
                className="block w-full text-left mb-1 p-1 leading-tight hover:bg-terminal-green hover:text-black rounded transition-colors duration-150"
                aria-label={`View details for battle at ${battle.nodeName}, Turn ${battle.turn}`}
              >
                <span className="text-terminal-gray-light">T{battle.turn}: {battle.nodeName} - </span>
                <span className={FACTION_COLORS[battle.attacker]?.primary}>{gameState.factions[battle.attacker]?.name}</span>
                <span className="text-gray-300"> vs </span>
                <span className={FACTION_COLORS[battle.defender]?.primary}>{gameState.factions[battle.defender]?.name}</span>
                <span className="text-gray-300"> - </span>
                <span className={battle.outcome === 'ATTACKER_WINS' ? 'text-terminal-green' : battle.outcome === 'DEFENDER_WINS' ? 'text-terminal-red' : 'text-terminal-yellow'}>
                  {battle.outcome.replace('_', ' ')}
                </span>
              </button>
            ))}
          </>
        );
      case 'SCS_LOG':
        return (
            <>
              {commLog.length === 0 && <p className="text-terminal-gray-light italic">No SCS messages.</p>}
              {commLog.slice().reverse().map(entry => { // Newest entries are at the end, so reverse for display
                const senderColor = FACTION_COLORS[entry.senderId]?.primary || 'text-terminal-gray-light';
                const targetInfo = entry.senderId === COMMAND_CONSOLE_ID && entry.targetFactionId && entry.targetFactionId !== 'BROADCAST' 
                                   ? ` to ${factions[entry.targetFactionId as PlayerId]?.name || entry.targetFactionId}`
                                   : '';
                return (
                  <p key={entry.id} className="mb-1 leading-tight">
                    <span className={`${senderColor} font-semibold`}>{entry.senderName}</span>
                    <span className="text-terminal-gray-light"> (T{entry.turn}{targetInfo}): </span>
                    <span className={senderColor}>{entry.message}</span>
                  </p>
                );
              })}
            </>
          );
      default: return null;
    }
  };

  const tabConfigs: { id: SidebarTab; label: string; notificationState?: boolean; clearNotification?: () => void }[] = [
    { id: 'SYSTEM_LOG', label: 'System Log', notificationState: hasNewSystemLogEntry, clearNotification: () => setHasNewSystemLogEntry(false) },
    { id: 'BATTLE_HISTORY', label: 'Battle History', notificationState: hasNewBattleHistoryEntry, clearNotification: () => setHasNewBattleHistoryEntry(false) },
    { id: 'SCS_LOG', label: 'SCS Log', notificationState: hasNewSCSMessage, clearNotification: () => setHasNewSCSMessage(false) },
  ];

  const handleTabClick = (tabId: SidebarTab) => {
    setActiveSidebarTab(tabId);
    const tabConfig = tabConfigs.find(tc => tc.id === tabId);
    if (tabConfig?.clearNotification) {
      tabConfig.clearNotification();
    }
  };
  
  const copyHandler = () => {
    const logToCopy = expandedSidebarTab || activeSidebarTab;
    handleCopyLog(logToCopy);
  };

  const expandCollapseHandler = () => {
    if (expandedSidebarTab) {
      setExpandedSidebarTab(null);
    } else {
      setExpandedSidebarTab(activeSidebarTab);
    }
  };


  if (expandedSidebarTab) {
    return (
      <div className="w-full h-full bg-terminal-gray-panel terminal-border flex flex-col text-sm p-3 space-y-2 overflow-hidden">
        <div className="flex justify-between items-center flex-shrink-0">
          <h3 className="text-md font-semibold text-terminal-green uppercase">
            {expandedSidebarTab.replace('_', ' ')} - EXPANDED
          </h3>
          <div className="flex items-center space-x-2">
            <button onClick={copyHandler} className="text-terminal-cyan hover:text-terminal-green p-1" aria-label={`Copy ${expandedSidebarTab.replace('_', ' ')}`} title={`Copy ${expandedSidebarTab.replace('_', ' ')}`}>
              <CopyIcon />
            </button>
            <button onClick={expandCollapseHandler} className="text-terminal-cyan hover:text-terminal-green p-1" aria-label={`Collapse ${expandedSidebarTab.replace('_', ' ')}`}>
              <CollapseIcon />
            </button>
          </div>
        </div>
        <div ref={logContentRef} className="terminal-border border-terminal-green border-opacity-50 p-2 text-xs overflow-y-auto flex-1 bg-black bg-opacity-20">
          {renderLogContent(expandedSidebarTab)}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-terminal-gray-panel terminal-border flex flex-col text-sm p-3 space-y-3 overflow-y-auto">
      {/* Turn Info and Faction Overviews */}
      <div className="terminal-border border-terminal-green border-opacity-50 p-2">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-md font-bold text-terminal-green">
            TURN {gameState.turn} {activePlayerNameForTurnDisplay && `(${activePlayerNameForTurnDisplay})`}
          </h3>
          <div className="flex items-center text-lg font-bold text-terminal-green">
            <ClockIcon />
            {formatTimeWithMilliseconds(currentTurnElapsedTime)}
          </div>
        </div>
        <InfoRow 
            label="Phase" 
            value={gameState.currentPhase.replace('_', ' ') + (gameState.activePlayerForManeuver ? ` (${gameState.factions[gameState.activePlayerForManeuver]?.name || gameState.activePlayerForManeuver})` : '')} 
            valueColor={gameState.activePlayerForManeuver ? FACTION_COLORS[gameState.activePlayerForManeuver]?.primary : 'text-terminal-cyan'} 
        />
        <InfoRow label="Phase Time" value={formatTimeWithMilliseconds(gameState.currentPhaseTime)} />
        <InfoRow label="Total Game Time" value={formatTotalTimeWithoutMilliseconds(gameState.gameTimeElapsed)} />
        <InfoRow label="Avg Turn" value={formatTotalTimeWithoutMilliseconds(gameState.avgTurnTime)} />
        <InfoRow label="Last Turn" value={formatTotalTimeWithoutMilliseconds(gameState.lastTurnDuration)} />
      </div>
      
      <div>
        <h3 className="text-md font-semibold text-terminal-green mb-1 ml-1">FACTION OVERVIEW</h3>
        <div className="flex flex-row space-x-2">
            <div className="flex-1">
                {gameState.factions[AI2_ID] && <FactionPanel faction={gameState.factions[AI2_ID]} title="AXIOM" mapNodes={gameState.mapNodes} />}
            </div>
            <div className="flex-1">
                {gameState.factions[AI1_ID] && <FactionPanel faction={gameState.factions[AI1_ID]} title="GEM-Q" mapNodes={gameState.mapNodes} />}
            </div>
        </div>
      </div>

      {/* Tabbed Log Area */}
      <div className="flex flex-col flex-1 min-h-[200px]">
        <div className="flex items-center border-b border-terminal-green border-opacity-30 mb-1">
          {tabConfigs.map(tabConfig => {
            const isActive = activeSidebarTab === tabConfig.id;
            const hasNotification = tabConfig.notificationState && !isActive;
            let textColor = 'text-terminal-gray-light';
            if (isActive) textColor = 'text-terminal-green';
            else if (hasNotification) textColor = 'text-terminal-yellow';
            
            return (
              <button
                key={tabConfig.id}
                onClick={() => handleTabClick(tabConfig.id)}
                className={`px-3 py-1.5 text-xs font-semibold focus:outline-none ${isActive ? 'border-b-2 border-terminal-green' : 'hover:text-terminal-green'} ${textColor} transition-colors`}
                aria-pressed={isActive}
                aria-label={tabConfig.label}
              >
                {tabConfig.label}
                {hasNotification && <span className="ml-1.5 text-xs">&#x25CF;</span>} {/* Notification dot */}
              </button>
            );
          })}
          <div className="flex-grow"></div> {/* Spacer */}
          <button onClick={copyHandler} className="text-terminal-cyan hover:text-terminal-green p-1 mr-1" aria-label={`Copy ${activeSidebarTab.replace('_',' ')}`} title={`Copy ${activeSidebarTab.replace('_',' ')}`}>
            <CopyIcon />
          </button>
          <button onClick={expandCollapseHandler} className="text-terminal-cyan hover:text-terminal-green p-1" aria-label={`Expand ${activeSidebarTab.replace('_',' ')}`}>
            <ExpandIcon />
          </button>
        </div>
        <div ref={logContentRef} className="terminal-border border-terminal-green border-opacity-50 p-2 text-xs overflow-y-auto flex-1 bg-black bg-opacity-20">
          {renderLogContent(activeSidebarTab)}
        </div>
      </div>
    </div>
  );
};
