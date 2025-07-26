
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Modal } from '../common/Modal';
import { OpPlanHistoryEntry, PlayerId, StrategicThoughtProcessData, Faction } from '../../types';
import { FACTION_COLORS } from '../../constants';
import { Button } from '../common/Button';

interface ArrowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  direction: 'up' | 'down' | 'left' | 'right';
}

const ArrowIcon: React.FC<ArrowButtonProps> = ({ direction, ...props }) => {
  let pathData = "";
  switch (direction) {
    case 'up': pathData = "M5 15l5-5 5 5H5z"; break;
    case 'down': pathData = "M5 5l5 5 5-5H5z"; break;
    case 'left': pathData = "M15 5l-5 5 5 5V5z"; break;
    case 'right': pathData = "M5 5l5 5-5 5V5z"; break;
  }
  return (
    <button {...props} className={`p-1 text-terminal-green hover:text-terminal-cyan disabled:text-terminal-gray disabled:opacity-50 ${props.className || ''}`}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d={pathData} clipRule="evenodd" />
      </svg>
    </button>
  );
};

const ExpandCollapseIcon: React.FC<{ expanded: boolean }> = ({ expanded }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1 text-terminal-cyan">
    {expanded ? (
      <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
    ) : (
      <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
    )}
  </svg>
);

interface ScratchpadHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: OpPlanHistoryEntry[];
  faction: Faction | null;
}

// Define the desired order of scratchpad keys for consistent display
const scratchpadDisplayOrder: Array<keyof StrategicThoughtProcessData> = [
  "CRITICAL_GAME_FACTORS",
  "COMPREHENSIVE_SELF_ASSESSMENT",
  "ENEMY_ASSESSMENT",
  "OBJECTIVE_REFINEMENT_FOR_CURRENT_OPPLAN",
  "STRATEGIC_CONSIDERATIONS_AND_OPTIONS",
  "PREFERRED_STRATEGY_AND_RATIONALE",
  "CONFIDENCE_AND_RISK_ANALYSIS",
  "CONTINGENCIES_AND_NEXT_TURN_ADAPTATION",
  "FINAL_PLAN_ALIGNMENT_CHECK",
];

const ScratchpadSectionItem: React.FC<{ title: string; content: string | undefined; colorClass: string }> = ({ title, content, colorClass }) => {
   if (!content && title !== "CONTINGENCIES_AND_NEXT_TURN_ADAPTATION") return null;
  return (
    <div className="mb-1.5">
      <h5 className={`text-xs font-semibold ${colorClass} opacity-80`}>{title.replace(/_/g, ' ').toUpperCase()}:</h5>
      <p className="text-gray-400 text-xs whitespace-pre-line ml-2 leading-snug">{content || <span className="italic">Not specified</span>}</p>
    </div>
  );
};

export const ScratchpadHistoryModal: React.FC<ScratchpadHistoryModalProps> = ({ isOpen, onClose, history, faction }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expandedScratchpads, setExpandedScratchpads] = useState<Set<string>>(new Set());
  const entryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const relevantHistory = useMemo(() => history.filter(entry => entry.scratchpadOutput), [history]);

  useEffect(() => {
    if (isOpen && relevantHistory.length > 0) {
      setCurrentIndex(0); 
      setExpandedScratchpads(new Set()); 
    }
  }, [isOpen, relevantHistory, faction]);

  useEffect(() => {
    if (isOpen && relevantHistory.length > 0 && entryRefs.current[relevantHistory[currentIndex]?.id]) {
      const entryElement = entryRefs.current[relevantHistory[currentIndex].id];
      const scrollableModalContent = entryElement?.closest('.overflow-y-auto');

      if (entryElement && scrollableModalContent) {
        const stickyHeader = scrollableModalContent.querySelector('.js-sticky-header') as HTMLElement;
        const headerHeight = stickyHeader ? stickyHeader.offsetHeight : 0;
        
        const elementRect = entryElement.getBoundingClientRect();
        const scrollableParentRect = scrollableModalContent.getBoundingClientRect();
        
        const targetScrollTop = elementRect.top - scrollableParentRect.top + scrollableModalContent.scrollTop - headerHeight;

        scrollableModalContent.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        });
      } else if (entryElement) {
         entryElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [currentIndex, relevantHistory, isOpen]);


  const uniqueTurns = useMemo(() => {
    const turns = new Set<number>();
    relevantHistory.forEach(entry => turns.add(entry.turnGenerated));
    return Array.from(turns).sort((a, b) => a - b); 
  }, [relevantHistory]);

  const handleJumpToTurn = (turn: number) => {
    const firstEntryIndexForTurn = relevantHistory.findIndex(entry => entry.turnGenerated === turn);
    if (firstEntryIndexForTurn !== -1) {
      setCurrentIndex(firstEntryIndexForTurn);
    }
  };

  const handlePrevious = () => { 
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => { 
    setCurrentIndex(prev => Math.min(relevantHistory.length - 1, prev + 1));
  };

  const toggleScratchpad = (entryId: string) => {
    setExpandedScratchpads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };


  if (!isOpen || !faction) {
    return null;
  }

  const factionTheme = FACTION_COLORS[faction.id];
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${faction.name} - AI Strategic Reasoning History`}>
      <>
        {relevantHistory.length > 0 && (
          <div className="sticky top-0 z-10 bg-terminal-gray-panel py-2 border-b border-terminal-green border-opacity-30 js-sticky-header">
            <div className="px-4"> {/* Inner wrapper for padding */}
              <div className="flex items-center justify-center space-x-1 mb-1 overflow-x-auto pb-1">
                <span className="text-xs text-terminal-gray mr-1 whitespace-nowrap">Jump to Turn:</span>
                {uniqueTurns.map(turn => (
                  <Button
                    key={turn}
                    size="sm"
                    variant={relevantHistory[currentIndex]?.turnGenerated === turn ? 'primary' : 'secondary'}
                    onClick={() => handleJumpToTurn(turn)}
                    className="text-xs px-1.5 py-0.5"
                  >
                    {turn}
                  </Button>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <ArrowIcon direction="left" onClick={handlePrevious} disabled={currentIndex === 0} aria-label="Newer Turn" title="Newer Turn" />
                <span className="text-xs text-terminal-cyan text-center">
                  Displaying: Turn {relevantHistory[currentIndex]?.turnGenerated} (Entry {currentIndex + 1} of {relevantHistory.length})
                </span>
                <ArrowIcon direction="right" onClick={handleNext} disabled={currentIndex === relevantHistory.length - 1} aria-label="Older Turn" title="Older Turn" />
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3 text-xs pt-3 px-4"> {/* Added px-4 here */}
          {relevantHistory.length > 0 ? (
            relevantHistory.map((entry, index) => (
              <div 
                key={entry.id} 
                ref={(el: HTMLDivElement | null) => { entryRefs.current[entry.id] = el; }}
                className={`p-2.5 terminal-border border-opacity-25 rounded-md bg-black bg-opacity-20 ${factionTheme.border} ${index === currentIndex ? `ring-2 ${factionTheme.primary.replace('text-','ring-')}` : ''}`}
              >
                <div className="flex justify-between items-baseline mb-1.5">
                    <h4 className={`text-sm font-bold ${factionTheme.primary}`}>
                        Turn {entry.turnGenerated} - OpPlan & Analysis
                    </h4>
                </div>

                <div className="mb-2 p-2 border border-terminal-gray-dark rounded-sm bg-black/10">
                    <div>
                        <strong className="text-terminal-yellow text-xs">OBJECTIVE:</strong>
                        <p className="text-gray-300 ml-2 text-xs leading-snug">{entry.objective}</p>
                    </div>
                    <div className="mt-1">
                        <strong className="text-terminal-yellow text-xs">OPERATION:</strong>
                        <p className={`${factionTheme?.primary || 'text-terminal-green'} ml-2 text-xs leading-snug`}>{entry.operation}</p>
                    </div>
                    <div className="mt-1">
                        <strong className="text-terminal-yellow text-xs">TASKS:</strong>
                        <ul className="list-none ml-2 text-gray-300 text-xs space-y-0.5">
                            {entry.tasks.map((task, i) => (
                            <li key={i} className="flex leading-snug">
                                <span className={`mr-1.5 ${factionTheme?.primary || 'text-terminal-green'}`}>&#x25B8;</span>
                                <span>{task}</span>
                            </li>
                            ))}
                        </ul>
                    </div>
                    {entry.turnAnalysis && (
                        <div className="mt-1">
                            <strong className={`block text-xs ${factionTheme?.primary || 'text-terminal-green'}`}>{entry.turnAnalysis}</strong>
                        </div>
                    )}
                    {entry.economicAnalysis && (
                        <div className="mt-1">
                            <h4 className="font-semibold text-xs text-terminal-gray-light">## Economic Analysis:</h4>
                            <p className="text-gray-300 whitespace-pre-line text-xs leading-snug">{entry.economicAnalysis}</p>
                        </div>
                    )}
                    {entry.economicAssessment && (
                        <div className="mt-1">
                            <strong className="text-xs text-terminal-gray-light">Economic Assessment:</strong>
                            <p className="text-gray-300 whitespace-pre-line text-xs leading-snug">{entry.economicAssessment}</p>
                        </div>
                    )}
                </div>
                
                <button 
                  onClick={() => toggleScratchpad(entry.id)}
                  className={`w-full flex items-center justify-start text-left text-xs font-semibold ${factionTheme.primary} mb-1 hover:opacity-80 transition-opacity`}
                  aria-expanded={expandedScratchpads.has(entry.id)}
                >
                  <ExpandCollapseIcon expanded={expandedScratchpads.has(entry.id)} />
                  Strategic Scratchpad:
                </button>
                {expandedScratchpads.has(entry.id) && (
                  <div className={`pl-2 border-l-2 border-opacity-40 ${factionTheme.border} space-y-1`}>
                      {scratchpadDisplayOrder.map(key => (
                          <ScratchpadSectionItem 
                              key={key} 
                              title={key} 
                              content={entry.scratchpadOutput?.[key]} 
                              colorClass={factionTheme.primary}
                          />
                      ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-terminal-gray-light text-center">No historical strategic analysis (scratchpad data) available for this faction.</p>
          )}
          {relevantHistory.length === 0 && history.length > 0 && (
            <p className="text-terminal-yellow text-center mt-2">Some past OpPlans exist but do not have associated scratchpad data.</p>
          )}
        </div>
      </>
    </Modal>
  );
};
