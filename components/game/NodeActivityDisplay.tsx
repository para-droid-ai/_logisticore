
import React, { useState, useEffect, useRef } from 'react';
import { NodeData, Faction, PlayerId, NodeActivityEntry, GameState, FactionIntelSnapshot } from '../../types';
import { FACTION_COLORS, NEUTRAL_ID, MAX_FORTIFICATION_LEVEL, AI1_ID, AI2_ID, MAX_ARTILLERY_PER_NODE, FORT_HP_PER_LEVEL } from '../../constants';
// Import isNodeConnectedToFactionCN if it's not passed as a prop and calculations are done here.
// However, it's better to pass it if it's a shared utility from App.tsx.

interface NodeActivityDisplayProps {
  selectedNode: NodeData | null;
  lastTurnActivity: NodeActivityEntry[];
  factions: Record<PlayerId, Faction>;
  factionIntelSnapshots: Partial<Record<PlayerId, FactionIntelSnapshot>>;
  currentTurn: number;
  onClosePanel: () => void;
  gameStats: GameState['gameStats'];
  mapNodes: Record<string, NodeData>;
  isFogOfWarActive: boolean;
  playerFactionId: PlayerId;
  isNodeConnectedToFactionCN: (nodeId: string, factionId: PlayerId, mapNodes: Record<string, NodeData>, factions: Record<PlayerId, Faction>) => boolean;
}

const DetailItem: React.FC<{ label: string; value: string | number; valueColor?: string; className?: string, title?: string, icon?: React.ReactNode }> = ({ label, value, valueColor, className, title, icon }) => (
  <div className={`text-xs ${className || ''}`} title={title}>
    <span className="text-terminal-gray-light flex items-center">
      {icon && <span className="mr-1">{icon}</span>}
      {label}:
    </span>
    <span className={`${valueColor || 'text-terminal-green'} font-semibold ml-1`}>{value}</span>
  </div>
);

const RadarDishIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-3 h-3 ${className}`}>
    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L9 5.414V17a1 1 0 102 0V5.414l5.293 5.293a1 1 0 001.414-1.414l-7-7z" />
    <path d="M3.283 8.717a.5.5 0 000 .566A7.001 7.001 0 009.5 16h1a7.001 7.001 0 006.217-6.717.5.5 0 000-.566A7.001 7.001 0 0010.5 2h-1a7.001 7.001 0 00-6.217 6.717zM10 11a1 1 0 100-2 1 1 0 000 2z" />
     <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 3zM6.075 5.02a.75.75 0 01.092 1.058l-.001.001A5.503 5.503 0 0010 13.25a5.503 5.503 0 003.834-7.17l-.001-.002a.75.75 0 11.966-1.152l.001.002A7.003 7.003 0 0110 14.75a7.003 7.003 0 01-4.895-8.086l.001-.001a.75.75 0 011.058-.092A.752.752 0 016.075 5.02z" clipRule="evenodd" />

  </svg>
);


const CAROUSEL_INTERVAL_MS = 7000;
const MANUAL_NAVIGATION_TIMEOUT_MS = 10000;
const TEXT_METRICS_PER_PAGE_PAGE1 = 4;
const TEXT_METRICS_PER_PAGE_OTHERS = 6; // Standard for most pages
const TOTAL_CAROUSEL_PAGES = 5; // Updated to 5 pages

const DataBar: React.FC<{ label?: string; currentValue: number; maxValue: number; colorClass: string; barHeight?: string; title?: string; showValueText?: boolean; wrapperClassName?: string }> =
  ({ label, currentValue, maxValue, colorClass, barHeight = 'h-3', title, showValueText = true, wrapperClassName }) => {
  const val = isNaN(currentValue) || typeof currentValue !== 'number' ? 0 : currentValue;
  const max = isNaN(maxValue) || typeof maxValue !== 'number' || maxValue === 0 ? (val > 0 ? val : 1) : maxValue;
  const percentage = max > 0 ? Math.min((val / max) * 100, 100) : 0;

  const displayValue = val > 1000 ? `${(val/1000).toFixed(1)}k` : val.toFixed(max > 1 && max < 10 && val % 1 !== 0 ? 1 : 0);
  const displayMax = max > 1000 ? `${(max/1000).toFixed(1)}k` : max.toFixed(0);

  return (
    <div className={`${wrapperClassName || ''}`} title={title}>
      {label && <div className="text-xs text-terminal-gray-light mb-0.5">{label}</div>}
      <div className={`w-full bg-terminal-gray-dark ${barHeight} rounded overflow-hidden border border-terminal-gray border-opacity-50`}>
        <div
          className={`${colorClass} ${barHeight} transition-all duration-500 ease-out flex items-center justify-end pr-1`}
          style={{ width: `${percentage}%` }}
        >
        </div>
      </div>
      {showValueText && <div className="text-center text-[10px] font-semibold mt-0.5">{displayValue} / {displayMax}</div>}
    </div>
  );
};


export const NodeActivityDisplay: React.FC<NodeActivityDisplayProps> = ({
    selectedNode,
    lastTurnActivity,
    factions,
    factionIntelSnapshots,
    currentTurn,
    onClosePanel,
    gameStats,
    mapNodes,
    isFogOfWarActive,
    playerFactionId,
    isNodeConnectedToFactionCN
}) => {
  const [currentReportPage, setCurrentReportPage] = useState(0);
  const reportCarouselTimeoutRef = useRef<number | null>(null);

  const resetCarouselInterval = () => {
    if (reportCarouselTimeoutRef.current) {
      clearTimeout(reportCarouselTimeoutRef.current);
    }
    reportCarouselTimeoutRef.current = window.setTimeout(() => {
      setCurrentReportPage(prev => (prev + 1) % TOTAL_CAROUSEL_PAGES);
      reportCarouselTimeoutRef.current = null;
    }, MANUAL_NAVIGATION_TIMEOUT_MS);
  };

  const handleSharedNavigation = (direction: 'next' | 'prev') => {
    setCurrentReportPage(prev => (prev + (direction === 'next' ? 1 : -1) + TOTAL_CAROUSEL_PAGES) % TOTAL_CAROUSEL_PAGES);
    resetCarouselInterval();
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!reportCarouselTimeoutRef.current) {
        setCurrentReportPage(prev => (prev + 1) % TOTAL_CAROUSEL_PAGES);
      }
    }, CAROUSEL_INTERVAL_MS);
    return () => {
      clearInterval(intervalId);
      if (reportCarouselTimeoutRef.current) clearTimeout(reportCarouselTimeoutRef.current);
    };
  }, []);

  const getFactionName = (id: PlayerId) => factions[id]?.name || id;

  if (selectedNode) {
    const node = selectedNode;
    const ownerName = getFactionName(node.owner);
    const ownerColor = FACTION_COLORS[node.owner]?.primary || 'text-terminal-gray';
    const nodeTypeColor = (node.nodeType === 'CN' || node.nodeType === 'FORTRESS') ? 'text-terminal-yellow' : 'text-terminal-cyan';
    const totalInfiltratorsOnNode = Object.values(node.infiltratorUnits || {}).reduce((sum, count) => sum + (count || 0), 0);
    
    let effectiveFortLevel = 0;
    if (node.fortificationLevel && node.fortificationLevel > 0 && node.fortificationHP && node.maxFortificationHP && node.maxFortificationHP > 0) {
        effectiveFortLevel = Math.ceil((node.fortificationHP / node.maxFortificationHP) * node.fortificationLevel);
        effectiveFortLevel = Math.min(effectiveFortLevel, node.fortificationLevel); 
    }


    return (
      <div className="w-full h-full bg-terminal-gray-panel p-3 flex flex-col text-xs relative">
        <div className="flex justify-between items-center mb-1 flex-shrink-0">
          <h3 className="text-base font-semibold text-terminal-green truncate uppercase">NODE DETAILS: {node.label}</h3>
          <button
            onClick={onClosePanel}
            className="text-terminal-gray-light hover:text-terminal-red text-2xl leading-none px-1 -mr-1"
            aria-label="Close node details"
          >
            &times;
          </button>
        </div>
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-x-3 gap-y-1 pr-1">
          {/* Column 1: General & Combat */}
          <div className="space-y-0.5">
            <DetailItem label="Region" value={node.regionName} className="text-terminal-gray-light" />
            <DetailItem label="Owner" value={ownerName} valueColor={ownerColor} />
            <DetailItem label="Type" value={node.nodeType} valueColor={nodeTypeColor} />
            <hr className="border-terminal-green border-opacity-10 my-1"/>
            <DetailItem label="Units (Std)" value={node.standardUnits} />
            <DetailItem label="Units (Max)" value={node.maxUnits} />
            <DetailItem 
              label="Fort Level" 
              value={`${node.fortificationLevel || 0} / ${MAX_FORTIFICATION_LEVEL} (HP: ${node.fortificationHP || 0}/${node.maxFortificationHP || 0}) Eff: ${effectiveFortLevel}`} 
            />
            <DetailItem
              label="Artillery"
              value={node.artilleryGarrison || 0}
              valueColor={node.artilleryGarrison && node.artilleryGarrison > 0 ? 'text-terminal-yellow' : undefined}
              title={`Current artillery: ${node.artilleryGarrison || 0}. Max per node: ${MAX_ARTILLERY_PER_NODE}.`}
            />
          </div>

          {/* Column 2: Resources & Specialized Units */}
          <div className="space-y-0.5">
            <DetailItem label="MAT Output" value={`${node.MAT_output || 0}`} />
            <DetailItem label="MAT Stock" value={`${node.MAT_stockpile || 0} / ${node.max_MAT_stockpile || 0}`} />
            <DetailItem label="QR Output" value={`${node.qrOutput || 0}`} />
             <hr className="border-terminal-green border-opacity-10 my-1"/>
            {totalInfiltratorsOnNode > 0 && <DetailItem label="Infiltrators" value={totalInfiltratorsOnNode} />}
            {totalInfiltratorsOnNode === 0 && <DetailItem label="Spec. Units" value="None" valueColor="text-terminal-gray" />}
             <hr className="border-terminal-green border-opacity-10 my-1"/>
             <h5 className="text-xs text-terminal-cyan font-semibold">Connections:</h5>
              {node.connections.length > 0 ? (
                <ul className="list-disc list-inside ml-1 text-terminal-gray-light">
                  {node.connections.map(connId => (
                    <li key={connId} className="truncate" title={mapNodes[connId]?.regionName || connId}>
                      {mapNodes[connId]?.label || connId} ({connId})
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-terminal-gray">None</p>
              )}
          </div>

          {/* Column 3: Status & Attackers */}
          <div className="space-y-0.5">
            <DetailItem label="Suppression" value={node.suppression || 0} valueColor={node.suppression ? 'text-terminal-red' : undefined} />
            <DetailItem label="Alarm Level" value={node.alarmLevel || 0} />
            <DetailItem label="Interdicted" value={`${node.interdictedTurns || 0} turns`} valueColor={node.interdictedTurns ? 'text-terminal-yellow' : undefined} />
            <DetailItem label="Low Supply" value={node.lowSupply ? 'YES' : 'NO'} valueColor={node.lowSupply ? 'text-terminal-red' : undefined} />

            {node.pendingAttackers && Object.keys(node.pendingAttackers).length > 0 && (
              <>
                <hr className="border-terminal-red border-opacity-20 my-1"/>
                <h5 className="text-xs text-terminal-red font-semibold">Pending Attackers:</h5>
                {Object.entries(node.pendingAttackers).map(([attackerId, data]) => (
                    <DetailItem
                        key={attackerId}
                        label={getFactionName(attackerId as PlayerId)}
                        value={`${data.units} units`}
                        valueColor={FACTION_COLORS[attackerId as PlayerId]?.primary} />
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  const maxOverallLosses = Math.max(factions[AI1_ID]?.totalUnitsLost || 0, factions[AI2_ID]?.totalUnitsLost || 0, 1);
  const maxOverallDeployed = Math.max(factions[AI1_ID]?.totalUnitsDeployed || 0, factions[AI2_ID]?.totalUnitsDeployed || 0, 1);
  const maxTotalNodes = Object.keys(mapNodes).length;
  const maxMATStockpile = Math.max(...Object.values(factions).map(f => f.MAT), ...Object.values(factionIntelSnapshots).map(s => s?.MAT || 0), 100);
  const maxSRDI = Math.max(...Object.values(factions).map(f => f.cumulativeMATDeniedToEnemyFromCaptures), ...Object.values(factionIntelSnapshots).map(s => 0), 100);
  const maxArtilleryKills = Math.max(...Object.values(factions).map(f => f.artilleryKills || 0), 1);
  const maxMatOnArtyAmmo = Math.max(...Object.values(factions).map(f => f.matSpentOnArtilleryAmmo || 0), 1);
  const maxMatDrainedSabotage = Math.max(...Object.values(factions).map(f => f.enemyMatDrainedBySabotage || 0), 1);
  const maxMatOnFortRepair = Math.max(...Object.values(factions).map(f => f.matSpentOnFortRepair || 0), 1);


  const metricTooltips: Record<string, string> = {
    "Units Deployed": "Total standard units deployed by the faction throughout the game (includes units from DEPLOY_UNITS action and automatic reinforcements).",
    "Units Lost": "Total standard units lost by the faction in combat or due to disbandment.",
    "Deployed/Lost Ratio": "Ratio of total units deployed (manual & automatic) to total units lost. Higher is generally better. 'INF' if no units lost but some deployed.",
    "Battles Won": "Total battles where this faction was declared the victor.",
    "Battles Lost": "Total battles where this faction was the loser or forced to retreat after a stalemate as attacker.",
    "Combat Success Rate": "(Battles Won / (Battles Won + Battles Lost)) * 100%. Bar shows percentage.",
    "Nodes Held": "Current number of map nodes controlled by the faction. Bar scaled against total map nodes.",
    "Current MAT": "Faction's current Materiel stockpile. Bar scaled against max MAT held by any faction.",
    "MAT Efficiency (MER)": "Materiel Efficiency Ratio: (Total MAT Generated / Total MAT Consumed). Higher indicates better resource management. Bar scaled 0-2.0 (1.0 is balanced).",
    "Force Projection Cost (FPC)": "((Total MAT for Deployment Action + Total MAT for Upkeep) / Total Unit-Turns). Average MAT cost to maintain one unit on the field for one turn. Lower is more efficient.",
    "Attrition Endurance (AEI)": "(Sum of Units Deployed via action in Last 3 Turns / Sum of Units Lost in Last 3 Turns). Recent resilience from active deployment choices.",
    "Territorial Econ Value (TEV)": "Sum of MAT Output + QR Output from all currently controlled nodes.",
    "Supply System Stress (SSS)": "Percentage of faction's total units currently on nodes suffering 'Low Supply'. Bar shows percentage, redder is worse.",
    "Fortification Focus": "(Total MAT Spent on Fortifications / Total MAT Generated) * 100%. Investment in defenses.",
    "Offensive Success (OSR)": "(Battles Won as Attacker / Total Battles Initiated as Attacker) * 100%. Effectiveness of offensive actions. Bar shows percentage.",
    "Blood Price of Territory": "(Units Lost by Faction in Battles Where They Captured a Node / Nodes Successfully Captured by Faction). Average own unit cost per captured node.",
    "Strategic Denial (SRDI)": "Cumulative MAT_output of nodes captured by this faction from an enemy. Bar scaled against max SRDI.",
    "Combat Overkill Index": "Average difference between own committed strength and enemy strength faced in initiated battles. Positive suggests overkill, negative suggests under-commitment.",
    "Recon Arrays Active": "Number of currently owned, activated, and Command Node-connected RECON_ARRAY nodes, indicating pulse capability.",
    "Recon Pulses Used": "Total number of successful recon pulses performed by the faction.",
    "Intel Advantage Turns": "Number of turns where this faction benefited from an active recon pulse, granting full map vision.",
    "QR Spent on Recon": "Total Quantum Resonance spent on activating recon arrays and performing pulses.",
    "MAT Spent on Recon": "Total Materiel spent on activating recon arrays, performing pulses, and upkeep for active arrays.",
    "Artillery Kills": "Total enemy units destroyed by this faction's artillery fire (combat support & strikes).",
    "MAT on Arty Ammo": "Total MAT spent by this faction on artillery ammunition for all types of fire.",
    "Sabotage Success Rate": "Ratio of successful sabotage attempts to total attempts by this faction. Bar shows percentage.",
    "MAT Drained (Sabotage)": "Total enemy MAT successfully drained by this faction's infiltrators.",
    "MAT on Fort Repairs": "Total MAT spent by this faction specifically on repairing existing fortification HP (distinct from fortification upgrade costs)."
  };

  const renderFactionMetrics = (factionId: PlayerId, isPlayerPerspective: boolean, page: number) => {
    const liveFactionData = factions[factionId];
    const data = liveFactionData;
    // const factionName = liveFactionData?.name || factionId; // Not used in current render

    if (!data) return null;

    const factionColorClass = FACTION_COLORS[factionId]?.primary.replace('text-', 'bg-') || 'bg-terminal-gray';
    const lossBarColor = FACTION_COLORS[factionId]?.primary.replace('text-', 'bg-').replace('cyan', 'red').replace('green', 'red') || 'bg-terminal-red';

    const liveBattlesWon = liveFactionData?.battlesWon || 0;
    const liveBattlesLost = liveFactionData?.battlesLost || 0;
    const successRateRaw = (liveBattlesWon + liveBattlesLost > 0)
        ? (liveBattlesWon / (liveBattlesWon + liveBattlesLost)) * 100
        : 0;
    const successRateDisplay = successRateRaw > 0 ? successRateRaw.toFixed(0) + '%' : 'N/A';

    const totalUnitsDeployed = data.totalUnitsDeployed ?? 0; // Now includes auto-reinforcements
    const totalUnitsLost = data.totalUnitsLost ?? 0;
    const deployedLostRatio = totalUnitsLost > 0 ? (totalUnitsDeployed / totalUnitsLost).toFixed(2) : (totalUnitsDeployed > 0 ? 'INF' : 'N/A');

    let tevMAT = 0;
    let tevQR = 0;
    Object.values(mapNodes).forEach(n => {
    if (n.owner === factionId) {
        tevMAT += n.MAT_output || 0;
        tevQR += n.qrOutput || 0;
    }
    });
    const tevDisplay = `MAT: ${tevMAT}, QR: ${tevQR}`;

    const nodesControlled = data.nodesControlled ?? 0;
    const currentMAT = data.MAT ?? 0;
    const totalMATGenerated = data.totalMATGenerated ?? 0;
    const totalMATConsumed = data.totalMATConsumed ?? 0;
    const merRaw = totalMATConsumed > 0 ? (totalMATGenerated / totalMATConsumed) : (totalMATGenerated > 0 ? 2.1 : 0);
    const merDisplay = totalMATConsumed > 0 ? merRaw.toFixed(2) : (totalMATGenerated > 0 ? 'INF' : 'N/A');

    const fpc = liveFactionData?.totalUnitTurns > 0 ? ((liveFactionData.totalMATSpentOnUnitDeployment + liveFactionData.totalMATSpentOnUnitUpkeep) / liveFactionData.totalUnitTurns).toFixed(2) : 'N/A';
    // AEI still uses unitsDeployedPerTurnHistory which is action-based deployment
    const sumDeployedHistory = liveFactionData?.unitsDeployedPerTurnHistory.reduce((a,b) => a+b, 0) || 0;
    const sumLostHistory = liveFactionData?.unitsLostPerTurnHistory.reduce((a,b) => a+b, 0) || 0;
    const aei = sumLostHistory > 0 ? (sumDeployedHistory / sumLostHistory).toFixed(2) : (sumDeployedHistory > 0 ? 'INF' : 'N/A');
    const fortFocusRaw = totalMATGenerated > 0 ? ((liveFactionData?.totalMATSpentOnFortifications || 0 / totalMATGenerated) * 100) : 0;
    const fortFocusDisplay = fortFocusRaw > 0 ? fortFocusRaw.toFixed(0) + '%' : 'N/A';
    const osrRaw = (liveFactionData?.battlesInitiated || 0) > 0 ? (((liveFactionData?.battlesWonAsAttacker || 0) / (liveFactionData?.battlesInitiated || 1)) * 100) : 0;
    const osrDisplay = osrRaw > 0 ? osrRaw.toFixed(0) + '%' : 'N/A';
    const bloodPrice = (liveFactionData?.nodesSuccessfullyCaptured || 0) > 0 ? ((liveFactionData?.unitsLostInSuccessfulCaptures || 0) / (liveFactionData?.nodesSuccessfullyCaptured || 1)).toFixed(2) : 'N/A';
    const srdi = liveFactionData?.cumulativeMATDeniedToEnemyFromCaptures || 0;
    const overkillIndex = (liveFactionData?.battlesInitiatedCountForOverkillIndex || 0) > 0 ?
        (((liveFactionData?.totalAttackerStrengthCommittedInInitiatedBattles || 0) - (liveFactionData?.totalDefenderStrengthFacedInInitiatedBattles || 0)) / (liveFactionData?.battlesInitiatedCountForOverkillIndex || 1)).toFixed(1)
        : 'N/A';

    let unitsUnderLowSupply = 0;
    Object.values(mapNodes).forEach(n => {
        if (n.owner === factionId && n.lowSupply) {
            unitsUnderLowSupply += n.standardUnits;
        }
    });
    const totalUnitsForSSS = data.totalUnits ?? 0;
    const sssRaw = totalUnitsForSSS > 0 ? (unitsUnderLowSupply / totalUnitsForSSS) * 100 : 0;
    const sssDisplay = sssRaw > 0 ? sssRaw.toFixed(0) + '%' : 'N/A';

    const activeReconArrays = data.activatedReconNodeIds.filter(nodeId =>
        mapNodes[nodeId]?.owner === factionId && isNodeConnectedToFactionCN(nodeId, factionId, mapNodes, factions)
    ).length;
    const pulsesUsed = data.pulsesPerformedCount;
    const intelAdvTurns = data.intelAdvantageTurnsCount;
    const qrReconSpent = data.qrSpentOnRecon;
    const matReconSpent = data.matSpentOnRecon;

    // New KPI calculations
    const artilleryKills = data.artilleryKills || 0;
    const matOnArtyAmmo = data.matSpentOnArtilleryAmmo || 0;
    const totalSabotageAttempts = data.totalSabotageAttempts || 0;
    const successfulSabotageAttempts = data.successfulSabotageAttempts || 0;
    const sabotageSuccessRateRaw = totalSabotageAttempts > 0 ? (successfulSabotageAttempts / totalSabotageAttempts) * 100 : 0;
    const sabotageSuccessRateDisplay = totalSabotageAttempts > 0 ? `${successfulSabotageAttempts}/${totalSabotageAttempts} (${sabotageSuccessRateRaw.toFixed(0)}%)` : 'N/A';
    const matDrainedBySabotage = data.enemyMatDrainedBySabotage || 0;
    const matOnFortRepairs = data.matSpentOnFortRepair || 0;


    const allMetricsConfig = [
        // Page 0 (Original Page 1)
        { label: "Deployed/Lost Ratio", value: deployedLostRatio, title: metricTooltips["Deployed/Lost Ratio"] },
        { label: "Battles Won", value: liveBattlesWon, barValue: liveBattlesWon, barMax: Math.max(10, liveBattlesWon + liveBattlesLost), title: metricTooltips["Battles Won"] },
        { label: "Battles Lost", value: liveBattlesLost, color: "text-terminal-red", barValue: liveBattlesLost, barMax: Math.max(10, liveBattlesWon + liveBattlesLost), title: metricTooltips["Battles Lost"] },
        { label: "Combat Success Rate", value: successRateDisplay, barValue: successRateRaw, barMax: 100, title: metricTooltips["Combat Success Rate"] },
        // Page 1 (Original Page 2)
        { label: "Nodes Held", value: nodesControlled, barValue: nodesControlled, barMax: Math.max(10, maxTotalNodes / 2), title: metricTooltips["Nodes Held"] },
        { label: "Current MAT", value: currentMAT.toFixed(2), barValue: currentMAT, barMax: maxMATStockpile, title: metricTooltips["Current MAT"] },
        { label: "MAT Efficiency (MER)", value: merDisplay, barValue: merRaw, barMax: 2.1, title: metricTooltips["MAT Efficiency (MER)"] },
        { label: "Force Projection Cost (FPC)", value: fpc, title: metricTooltips["Force Projection Cost (FPC)"] },
        { label: "Attrition Endurance (AEI)", value: aei, title: metricTooltips["Attrition Endurance (AEI)"] },
        { label: "Territorial Econ Value (TEV)", value: tevDisplay, title: metricTooltips["Territorial Econ Value (TEV)"] },
        // Page 2 (Recon Page)
        { label: "Recon Arrays Active", value: activeReconArrays, icon: <RadarDishIcon className="text-terminal-cyan" />, title: metricTooltips["Recon Arrays Active"], barValue: activeReconArrays, barMax: Math.max(1, Object.values(mapNodes).filter(n => n.nodeType === 'RECON_ARRAY').length / 2) },
        { label: "Recon Pulses Used", value: pulsesUsed, title: metricTooltips["Recon Pulses Used"] },
        { label: "Intel Advantage Turns", value: intelAdvTurns, title: metricTooltips["Intel Advantage Turns"] },
        { label: "QR Spent on Recon", value: qrReconSpent, title: metricTooltips["QR Spent on Recon"] },
        { label: "MAT Spent on Recon", value: matReconSpent.toFixed(2), title: metricTooltips["MAT Spent on Recon"] },
        // Page 3 (Advanced Attrition)
        { label: "Supply System Stress (SSS)", value: sssDisplay, color: sssRaw > 50 ? "text-terminal-red" : undefined, barValue: sssRaw, barMax: 100, title: metricTooltips["Supply System Stress (SSS)"] },
        { label: "Fortification Focus", value: fortFocusDisplay, barValue: fortFocusRaw, barMax: 100, title: metricTooltips["Fortification Focus"] },
        { label: "Offensive Success (OSR)", value: osrDisplay, barValue: osrRaw, barMax: 100, title: metricTooltips["Offensive Success (OSR)"] },
        { label: "Strategic Denial (SRDI)", value: srdi, barValue: srdi, barMax: maxSRDI, title: metricTooltips["Strategic Denial (SRDI)"] },
        { label: "Blood Price of Territory", value: bloodPrice, title: metricTooltips["Blood Price of Territory"] },
        { label: "Combat Overkill Index", value: overkillIndex, title: metricTooltips["Combat Overkill Index"] },
        // Page 4 (NEW - Operational Engagements)
        { label: "Artillery Kills", value: artilleryKills, barValue: artilleryKills, barMax: maxArtilleryKills, title: metricTooltips["Artillery Kills"] },
        { label: "MAT on Arty Ammo", value: matOnArtyAmmo.toFixed(2), barValue: matOnArtyAmmo, barMax: maxMatOnArtyAmmo, title: metricTooltips["MAT on Arty Ammo"] },
        { label: "Sabotage Success Rate", value: sabotageSuccessRateDisplay, barValue: sabotageSuccessRateRaw, barMax:100, title: metricTooltips["Sabotage Success Rate"] },
        { label: "MAT Drained (Sabotage)", value: matDrainedBySabotage.toFixed(2), barValue: matDrainedBySabotage, barMax: maxMatDrainedSabotage, title: metricTooltips["MAT Drained (Sabotage)"] },
        { label: "MAT on Fort Repairs", value: matOnFortRepairs.toFixed(2), barValue: matOnFortRepairs, barMax: maxMatOnFortRepair, title: metricTooltips["MAT on Fort Repairs"] },
    ];

    let pageMetrics;
    const pageMetricsPerPage = [TEXT_METRICS_PER_PAGE_PAGE1, TEXT_METRICS_PER_PAGE_OTHERS, 5, TEXT_METRICS_PER_PAGE_OTHERS, 5]; // Metrics per page
    let startIndex = 0;
    for(let i=0; i < page; i++) {
        startIndex += pageMetricsPerPage[i];
    }
    pageMetrics = allMetricsConfig.slice(startIndex, startIndex + pageMetricsPerPage[page]);


    return (
        <div className={`p-1.5 terminal-border border-opacity-30 ${FACTION_COLORS[factionId]?.border} rounded flex flex-col h-full justify-between`}>
            <div className="flex flex-col justify-around h-full">
                {page === 0 && (
                    <>
                        <DataBar
                            label="Units Lost"
                            currentValue={totalUnitsLost}
                            maxValue={maxOverallLosses}
                            colorClass={lossBarColor}
                            title={metricTooltips["Units Lost"]}
                            wrapperClassName="mb-1"
                        />
                        <DataBar
                            label="Units Deployed"
                            currentValue={totalUnitsDeployed}
                            maxValue={maxOverallDeployed}
                            colorClass={factionColorClass}
                            title={metricTooltips["Units Deployed"]}
                            wrapperClassName="mb-1"
                        />
                    </>
                )}
                <div className={`grid grid-cols-2 gap-x-2 gap-y-1 mt-1 flex-grow`}>
                    {pageMetrics.map((metric, index) => (
                        <div key={`${factionId}-${metric.label}-${index}`} className="flex flex-col">
                            {metric.barValue !== undefined && metric.barMax !== undefined && typeof metric.barValue === 'number' && page !==0 && ( 
                                <DataBar
                                    currentValue={metric.barValue}
                                    maxValue={metric.barMax}
                                    colorClass={metric.label === "Supply System Stress (SSS)" && metric.barValue > 50 ? 'bg-terminal-red' : (metric.label === "Battles Lost" ? lossBarColor : factionColorClass)}
                                    title={metric.title}
                                    showValueText={false}
                                    barHeight="h-2"
                                    wrapperClassName="mb-0.5"
                                />
                            )}
                            <DetailItem label={metric.label} value={metric.value} valueColor={metric.color} title={metric.title} icon={metric.icon} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
  };


  return (
    <div className="w-full h-full bg-terminal-gray-panel p-2 flex flex-col text-xs">
      <div className="flex justify-between items-center mb-1.5 flex-shrink-0">
        <button
          onClick={() => handleSharedNavigation('prev')}
          className="text-terminal-green hover:text-white p-1 bg-black bg-opacity-30 rounded-full text-xs"
          title="Previous Page"
          aria-label="Previous Attrition Page"
        >
          &lt;
        </button>
        <h3 className="text-sm font-semibold text-terminal-green uppercase text-center">STRATEGIC ATTRITION REPORT (TURN {currentTurn})</h3>
        <button
          onClick={() => handleSharedNavigation('next')}
          className="text-terminal-green hover:text-white p-1 bg-black bg-opacity-30 rounded-full text-xs"
          title="Next Page"
          aria-label="Next Attrition Page"
        >
          &gt;
        </button>
      </div>
      <div className="grid grid-cols-2 gap-x-2 flex-1 overflow-y-auto pr-1 min-h-0">
        {renderFactionMetrics(AI2_ID, playerFactionId === AI2_ID, currentReportPage)}
        {renderFactionMetrics(AI1_ID, playerFactionId === AI1_ID, currentReportPage)}
      </div>
    </div>
  );
};
