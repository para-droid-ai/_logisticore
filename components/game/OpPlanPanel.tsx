
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { OpPlan, PlayerId, StrategicThoughtProcessData } from '../../types';
import { FACTION_COLORS, AI2_ID } from '../../constants';
import { Button } from '../common/Button';

interface OpPlanPanelProps {
  factionId: PlayerId;
  plan: OpPlan | null;
  historyCount: number;
  onScratchpadHistoryClick?: (factionId: PlayerId) => void;
  // onProvideGuidanceClick?: (factionId: PlayerId) => void;
  // queuedGuidance?: string | null;
}

const TOTAL_OPPLAN_CAROUSEL_PAGES = 6;
const OPPLAN_CAROUSEL_INTERVAL_MS = 8000;
const OPPLAN_MANUAL_NAVIGATION_TIMEOUT_MS = 15000;


const ScratchpadSectionDisplay: React.FC<{ title: string; content: string | undefined; colorClass: string; isFirst?: boolean }> = ({ title, content, colorClass, isFirst }) => {
  if (!content && title !== "CONTINGENCIES_AND_NEXT_TURN_ADAPTATION") return null;

  return (
    <div className={`${isFirst ? '' : 'mt-1.5'}`}>
      <strong className={`text-xs ${colorClass} opacity-90`}>{title.replace(/_/g, ' ').toUpperCase()}:</strong>
      <p className="text-gray-400 text-xs ml-2 whitespace-pre-line leading-snug">{content || <span className="italic">Not specified</span>}</p>
    </div>
  );
};

const scratchpadPage1Keys: Array<keyof StrategicThoughtProcessData> = [
  "CRITICAL_GAME_FACTORS",
  "COMPREHENSIVE_SELF_ASSESSMENT",
];

const scratchpadPage2Keys: Array<keyof StrategicThoughtProcessData> = [
  "ENEMY_ASSESSMENT",
  "OBJECTIVE_REFINEMENT_FOR_CURRENT_OPPLAN",
];

const scratchpadPage3Keys: Array<keyof StrategicThoughtProcessData> = [
  "STRATEGIC_CONSIDERATIONS_AND_OPTIONS",
  "PREFERRED_STRATEGY_AND_RATIONALE",
];

const scratchpadPage4Keys: Array<keyof StrategicThoughtProcessData> = [
  "CONFIDENCE_AND_RISK_ANALYSIS",
  "CONTINGENCIES_AND_NEXT_TURN_ADAPTATION",
];

const scratchpadPage5Keys: Array<keyof StrategicThoughtProcessData> = [
  "FINAL_PLAN_ALIGNMENT_CHECK",
];


export const OpPlanPanel: React.FC<OpPlanPanelProps> = ({ factionId, plan, historyCount, onScratchpadHistoryClick /*, onProvideGuidanceClick, queuedGuidance */ }) => {
  const factionTheme = FACTION_COLORS[factionId];
  const [currentPage, setCurrentPage] = useState(0);
  const carouselTimeoutRef = useRef<number | null>(null);
  const manualNavTimeoutRef = useRef<number | null>(null);

  const resetCarouselInterval = useCallback(() => {
    if (manualNavTimeoutRef.current) clearTimeout(manualNavTimeoutRef.current);
    manualNavTimeoutRef.current = window.setTimeout(() => {
        manualNavTimeoutRef.current = null;
         if (carouselTimeoutRef.current) clearTimeout(carouselTimeoutRef.current);
         carouselTimeoutRef.current = window.setTimeout(() => {
            setCurrentPage(prev => (prev + 1) % TOTAL_OPPLAN_CAROUSEL_PAGES);
         }, OPPLAN_CAROUSEL_INTERVAL_MS);

    }, OPPLAN_MANUAL_NAVIGATION_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    if (manualNavTimeoutRef.current) return;

    if (carouselTimeoutRef.current) clearTimeout(carouselTimeoutRef.current);
    carouselTimeoutRef.current = window.setTimeout(() => {
      setCurrentPage(prev => (prev + 1) % TOTAL_OPPLAN_CAROUSEL_PAGES);
    }, OPPLAN_CAROUSEL_INTERVAL_MS);

    return () => {
      if (carouselTimeoutRef.current) clearTimeout(carouselTimeoutRef.current);
      if (manualNavTimeoutRef.current) clearTimeout(manualNavTimeoutRef.current);
    };
  }, [currentPage, manualNavTimeoutRef]);


  const handleNavigation = (direction: 'next' | 'prev') => {
    setCurrentPage(prev => (prev + (direction === 'next' ? 1 : -1) + TOTAL_OPPLAN_CAROUSEL_PAGES) % TOTAL_OPPLAN_CAROUSEL_PAGES);
    resetCarouselInterval();
  };

  if (!plan) {
    return (
      <div className="flex-1 p-3 bg-terminal-gray-panel terminal-border h-full flex flex-col">
        <h3 className={`text-base font-semibold mb-2 ${factionTheme?.primary || 'text-terminal-green'}`}>
          {factionId} :: Op Plan & Analysis
        </h3>
        <div className="flex-grow flex items-center justify-center">
          <p className="text-terminal-gray-light">No plan available.</p>
        </div>
      </div>
    );
  }

  const handleHistoryClick = () => {
    if (onScratchpadHistoryClick) {
      onScratchpadHistoryClick(factionId);
    }
  };
  
  // const handleGuidanceClick = () => {
  //   if (onProvideGuidanceClick) {
  //     onProvideGuidanceClick(factionId);
  //   }
  // };

  const scratchpad = plan.scratchpadOutput;

  const renderPageContent = () => {
    if (!scratchpad && currentPage > 0) {
        return <p className="text-terminal-gray-light text-xs">No AI strategic analysis available for this plan.</p>;
    }

    switch (currentPage) {
      case 0: // OpPlan Core
        return (
          <>
            <div>
              <strong className="text-terminal-yellow text-xs">OBJECTIVE:</strong>
              <p className="text-gray-300 ml-2 text-xs leading-snug">{plan.objective}</p>
            </div>
            <div className="mt-1.5">
              <strong className="text-terminal-yellow text-xs">OPERATION:</strong>
              <p className={`${factionTheme?.primary || 'text-terminal-green'} ml-2 text-xs leading-snug`}>{plan.operation}</p>
            </div>
            <div className="mt-1.5">
              <strong className="text-terminal-yellow text-xs">TASKS:</strong>
              <ul className="list-none ml-2 text-gray-300 text-xs space-y-0.5">
                {plan.tasks.map((task, index) => (
                  <li key={index} className="flex leading-snug">
                    <span className={`mr-1.5 ${factionTheme?.primary || 'text-terminal-green'}`}>&#x25B8;</span>
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
            </div>
            {plan.turnAnalysis && (
              <div className="mt-1.5">
                <strong className={`block text-xs ${factionTheme?.primary || 'text-terminal-green'}`}>{plan.turnAnalysis}</strong>
              </div>
            )}
            {plan.economicAnalysis && (
              <div className="mt-1.5">
                <h4 className="font-semibold text-xs text-terminal-gray-light">## Economic Analysis:</h4>
                <p className="text-gray-300 whitespace-pre-line text-xs leading-snug">{plan.economicAnalysis}</p>
              </div>
            )}
            {plan.economicAssessment && (
              <div className="mt-1.5">
                <strong className="text-xs text-terminal-gray-light">Economic Assessment:</strong>
                <p className="text-gray-300 whitespace-pre-line text-xs leading-snug">{plan.economicAssessment}</p>
              </div>
            )}
          </>
        );
      case 1:
        return (
          <div className="space-y-1.5">
            {scratchpadPage1Keys.map((key, idx) => (
              <ScratchpadSectionDisplay
                key={key}
                title={key}
                content={scratchpad?.[key]}
                colorClass={factionTheme?.primary || 'text-terminal-cyan'}
                isFirst={idx === 0}
              />
            ))}
          </div>
        );
      case 2:
        return (
          <div className="space-y-1.5">
            {scratchpadPage2Keys.map((key, idx) => (
              <ScratchpadSectionDisplay
                key={key}
                title={key}
                content={scratchpad?.[key]}
                colorClass={factionTheme?.primary || 'text-terminal-cyan'}
                isFirst={idx === 0}
              />
            ))}
          </div>
        );
      case 3:
        return (
          <div className="space-y-1.5">
            {scratchpadPage3Keys.map((key, idx) => (
              <ScratchpadSectionDisplay
                key={key}
                title={key}
                content={scratchpad?.[key]}
                colorClass={factionTheme?.primary || 'text-terminal-cyan'}
                isFirst={idx === 0}
              />
            ))}
          </div>
        );
      case 4:
        return (
          <div className="space-y-1.5">
            {scratchpadPage4Keys.map((key, idx) => (
              <ScratchpadSectionDisplay
                key={key}
                title={key}
                content={scratchpad?.[key]}
                colorClass={factionTheme?.primary || 'text-terminal-cyan'}
                isFirst={idx === 0}
              />
            ))}
          </div>
        );
      case 5:
        return (
          <div className="space-y-1.5">
            {scratchpadPage5Keys.map((key, idx) => (
              <ScratchpadSectionDisplay
                key={key}
                title={key}
                content={scratchpad?.[key]}
                colorClass={factionTheme?.primary || 'text-terminal-cyan'}
                isFirst={idx === 0}
              />
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  const pageTitles = [
    "OpPlan Core",
    "Analysis (1/5)",
    "Analysis (2/5)",
    "Analysis (3/5)",
    "Analysis (4/5)",
    "Analysis (5/5)"
  ];

  return (
    <div className="flex-1 p-3 bg-terminal-gray-panel terminal-border h-full flex flex-col text-xs">
      <div className="flex justify-between items-center mb-1.5 flex-shrink-0">
        <h3 className={`text-sm font-semibold ${factionTheme?.primary || 'text-terminal-green'} truncate`}>
          {factionId} :: {pageTitles[currentPage]}
        </h3>
        <div className="flex items-center">
            <button
              onClick={() => handleNavigation('prev')}
              className="text-terminal-green hover:text-white p-1 bg-black bg-opacity-20 rounded-full text-xs mr-1"
              title="Previous Page"
              aria-label="Previous OpPlan Page"
            > &lt; </button>
            <Button variant="secondary" size="sm" onClick={handleHistoryClick} className="text-xs px-1.5 py-0.5">
              SCRATCHPAD HIST ({historyCount})
            </Button>
            {/* {factionId === AI2_ID && onProvideGuidanceClick && (
                <Button variant="primary" size="sm" onClick={handleGuidanceClick} className="text-xs px-1.5 py-0.5" title="Provide strategic guidance to AXIOM">
                  GUIDANCE
                </Button>
            )} */}
            <button
              onClick={() => handleNavigation('next')}
              className="text-terminal-green hover:text-white p-1 bg-black bg-opacity-20 rounded-full text-xs ml-1"
              title="Next Page"
              aria-label="Next OpPlan Page"
            > &gt; </button>
        </div>
      </div>

      <div className="overflow-y-auto pr-1 flex-grow custom-scrollbar-op-plan">
        {renderPageContent()}
      </div>
      {/* {queuedGuidance && factionId === AI2_ID && (
        <div className="mt-2 p-1.5 border-t border-dashed border-terminal-yellow/50 text-xs flex-shrink-0">
            <p className="text-terminal-yellow font-semibold">Queued Guidance:</p>
            <p className="text-gray-300 italic whitespace-pre-wrap">"{queuedGuidance}"</p>
        </div>
      )} */}
       <div className="flex justify-center items-center pt-1.5 space-x-1.5 flex-shrink-0">
            {Array.from({ length: TOTAL_OPPLAN_CAROUSEL_PAGES }).map((_, index) => (
                <button
                    key={index}
                    onClick={() => { setCurrentPage(index); resetCarouselInterval(); }}
                    className={`w-2 h-2 rounded-full ${currentPage === index ? (factionTheme?.primary.replace('text-','bg-') || 'bg-terminal-green') : 'bg-terminal-gray-dark hover:bg-terminal-gray'} transition-colors`}
                    aria-label={`Go to OpPlan page ${index + 1}`}
                />
            ))}
        </div>
      <style>{`
        .custom-scrollbar-op-plan::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar-op-plan::-webkit-scrollbar-track {
          background: #1a1f26;
        }
        .custom-scrollbar-op-plan::-webkit-scrollbar-thumb {
          background: ${FACTION_COLORS[factionId]?.actualHex || '#39FF14'};
          border-radius: 3px;
        }
        .custom-scrollbar-op-plan::-webkit-scrollbar-thumb:hover {
          background: ${factionId === 'AXIOM' ? '#00B8B8' : '#E00036'};
        }
      `}</style>
    </div>
  );
};
