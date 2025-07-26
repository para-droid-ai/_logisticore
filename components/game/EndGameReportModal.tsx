
import React from 'react';
import { Modal } from '../common/Modal';
import { GameState, PlayerId, Faction, BattleLogEntry, OpPlanHistoryEntry } from '../../types';
import { FACTION_COLORS, AI1_ID, AI2_ID, NEUTRAL_ID, MAX_TURNS } from '../../constants';
import { Button } from '../common/Button';

interface EndGameReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState | null;
}

const DetailItem: React.FC<{ label: string; value: string | number; valueColor?: string; className?: string }> = ({ label, value, valueColor, className }) => (
  <div className={`text-sm ${className || 'mb-1'}`}>
    <span className="text-terminal-gray-light">{label}: </span>
    <span className={`${valueColor || 'text-terminal-green'} font-semibold`}>{value}</span>
  </div>
);

const calculateWinLossStreak = (battleLog: BattleLogEntry[], factionId: PlayerId) => {
  let maxWinStreak = 0;
  let currentWinStreak = 0;
  let maxLossStreak = 0;
  let currentLossStreak = 0;

  for (const battle of battleLog) {
    if (battle.attacker === factionId || battle.defender === factionId) {
      const won = (battle.attacker === factionId && battle.outcome === 'ATTACKER_WINS') ||
                  (battle.defender === factionId && battle.outcome === 'DEFENDER_WINS');
      const lost = (battle.attacker === factionId && battle.outcome === 'DEFENDER_WINS') ||
                   (battle.defender === factionId && battle.outcome === 'ATTACKER_WINS') ||
                   (battle.attacker === factionId && battle.outcome === 'STALEMATE'); // Stalemate as attacker counts as a strategic loss for streak

      if (won) {
        currentWinStreak++;
        currentLossStreak = 0;
      } else if (lost) {
        currentLossStreak++;
        currentWinStreak = 0;
      } else { // No Combat or Mutual Losses - reset streaks for simplicity
        currentWinStreak = 0;
        currentLossStreak = 0;
      }
      maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
      maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
    }
  }
  return { winStreak: maxWinStreak, lossStreak: maxLossStreak };
};

const generateTextReport = (gameState: GameState, winner: PlayerId | 'DRAW' | null): string => {
  if (!gameState) return "No game data available.";

  let report = `Logisticore: End Game Report\n`;
  report += `================================\n`;
  report += `Game Ended: Turn ${gameState.turn}\n`;
  
  if (winner === 'DRAW') {
    report += `Outcome: DRAW\n`;
  } else if (winner) {
    report += `Winner: ${gameState.factions[winner]?.name || winner}\n`;
  } else {
    report += `Outcome: Undetermined (Game may not have concluded conventionally)\n`;
  }
  report += `\n--- Faction Performance ---\n`;

  ([AI2_ID, AI1_ID] as PlayerId[]).forEach(factionId => {
    const faction = gameState.factions[factionId];
    if (!faction) return;
    const { winStreak, lossStreak } = calculateWinLossStreak(gameState.battleLog, factionId);
    const winPercentage = (faction.battlesWon + faction.battlesLost > 0) ? ((faction.battlesWon / (faction.battlesWon + faction.battlesLost)) * 100).toFixed(1) + '%' : 'N/A';
    const eloPlaceholder = 1000 + (faction.battlesWon * 10) - (faction.battlesLost * 5) - ((faction.id === AI1_ID && winner === AI2_ID) || (faction.id === AI2_ID && winner === AI1_ID) ? 50 : 0) + (winner === faction.id ? 100 : 0) ;
    const avgFightingStrength = faction.battlesInitiated > 0 ? (faction.totalAttackerStrengthCommittedInInitiatedBattles / faction.battlesInitiated).toFixed(1) : 'N/A';


    report += `\nFaction: ${faction.name} (${faction.id})\n`;
    report += `  Total Units Deployed: ${faction.totalUnitsDeployed}\n`;
    report += `  Total Units Lost: ${faction.totalUnitsLost}\n`;
    report += `  MAT Generated/Consumed: ${faction.totalMATGenerated} / ${faction.totalMATConsumed}\n`;
    report += `  Battles Won/Lost: ${faction.battlesWon} / ${faction.battlesLost}\n`;
    report += `  Win Percentage: ${winPercentage}\n`;
    report += `  Nodes Captured: ${faction.nodesSuccessfullyCaptured}\n`;
    report += `  ELO Rating (Est.): ${eloPlaceholder}\n`;
    report += `  Longest Win Streak: ${winStreak}\n`;
    report += `  Longest Loss Streak: ${lossStreak}\n`;
    report += `  Avg. Fighting Strength (Attacker): ${avgFightingStrength}\n`;

    report += `  OpPlan Trajectory:\n`;
    gameState.opPlanHistory[factionId]?.slice().reverse().forEach(op => {
      report += `    T${op.turnGenerated}: ${op.operation} - ${op.objective}\n`;
    });
    report += `    Current: ${faction.currentOpPlan?.operation || 'N/A'} - ${faction.currentOpPlan?.objective || 'N/A'}\n`;
  });

  report += `\n--- Battle Log Summary ---\n`;
  gameState.battleLog.forEach(b => {
    report += `T${b.turn}: ${b.nodeName} - ${gameState.factions[b.attacker]?.name} vs ${gameState.factions[b.defender]?.name} | Outcome: ${b.outcome.replace('_', ' ')} | Losses: A:${b.attackerLosses}, D:${b.defenderLosses}${b.nodeCaptured ? ' (Node Captured by Attacker)' : ''}\n`;
  });
  
  report += `\nReport Generated: ${new Date().toLocaleString()}\n`;
  return report;
};


export const EndGameReportModal: React.FC<EndGameReportModalProps> = ({ isOpen, onClose, gameState }) => {
  if (!isOpen || !gameState) {
    return null;
  }

  const axiomCNCount = Object.values(gameState.mapNodes).filter(n => n.owner === AI2_ID && n.isCN).length;
  const gemqCNCount = Object.values(gameState.mapNodes).filter(n => n.owner === AI1_ID && n.isCN).length;
  let winner: PlayerId | 'DRAW' | null = null;
  let gameOverReason = "";

  if (gameState.turn >= MAX_TURNS) {
    gameOverReason = `Maximum turns (${MAX_TURNS}) reached.`;
    // Determine winner by node count or other tie-breaker
    if (gameState.factions[AI2_ID].nodesControlled > gameState.factions[AI1_ID].nodesControlled) winner = AI2_ID;
    else if (gameState.factions[AI1_ID].nodesControlled > gameState.factions[AI2_ID].nodesControlled) winner = AI1_ID;
    else winner = 'DRAW';
  } else if (axiomCNCount === 0 && gemqCNCount > 0) {
    winner = AI1_ID;
    gameOverReason = `${gameState.factions[AI1_ID].name} wins by Command Node elimination!`;
  } else if (gemqCNCount === 0 && axiomCNCount > 0) {
    winner = AI2_ID;
    gameOverReason = `${gameState.factions[AI2_ID].name} wins by Command Node elimination!`;
  } else if (axiomCNCount === 0 && gemqCNCount === 0) {
    winner = 'DRAW';
    gameOverReason = "Mutual Command Node destruction! Stalemate!";
  }

  const winnerName = winner === 'DRAW' ? 'DRAW' : (winner ? gameState.factions[winner]?.name : 'Undetermined');
  const winnerColor = winner === 'DRAW' ? 'text-terminal-yellow' : (winner ? FACTION_COLORS[winner]?.primary : 'text-terminal-gray');

  const handleExportPNG = () => {
    console.log("Export to PNG functionality to be implemented. This would typically involve a library like html2canvas.");
    // For now, just log. Actual implementation is complex.
  };

  const handleExportText = () => {
    const reportText = generateTextReport(gameState, winner);
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logisticore_end_game_report_${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="End Game Battle Report">
      <div className="space-y-3 text-sm">
        <div className="text-center p-3 terminal-border border-terminal-green rounded">
          <h3 className={`text-xl font-bold ${winnerColor}`}>
            {winner === 'DRAW' ? 'Game Over: DRAW!' : `Game Over: ${winnerName} Victorious!`}
          </h3>
          <p className="text-terminal-gray-light">Final Turn: {gameState.turn}</p>
          <p className="text-xs text-terminal-gray">{gameOverReason}</p>
        </div>

        {([AI2_ID, AI1_ID] as PlayerId[]).map(factionId => {
          const faction = gameState.factions[factionId];
          if (!faction) return null;
          const factionTheme = FACTION_COLORS[factionId];
          const { winStreak, lossStreak } = calculateWinLossStreak(gameState.battleLog, factionId);
          const winPercentage = (faction.battlesWon + faction.battlesLost > 0) ? ((faction.battlesWon / (faction.battlesWon + faction.battlesLost)) * 100).toFixed(1) + '%' : 'N/A';
          const eloPlaceholder = 1000 + (faction.battlesWon * 10) - (faction.battlesLost * 5) - ((faction.id === AI1_ID && winner === AI2_ID) || (faction.id === AI2_ID && winner === AI1_ID) ? 50 : 0) + (winner === faction.id ? 100 : 0) ;
          const avgFightingStrength = faction.battlesInitiated > 0 ? (faction.totalAttackerStrengthCommittedInInitiatedBattles / faction.battlesInitiated).toFixed(1) : 'N/A';

          return (
            <div key={factionId} className={`p-2 terminal-border ${factionTheme.border} rounded`}>
              <h4 className={`text-md font-semibold mb-1 ${factionTheme.primary}`}>{faction.name} Performance</h4>
              <div className="grid grid-cols-2 gap-x-3">
                <DetailItem label="Units Deployed" value={faction.totalUnitsDeployed} />
                <DetailItem label="Units Lost" value={faction.totalUnitsLost} valueColor="text-terminal-red" />
                <DetailItem label="MAT Gen/Consumed" value={`${faction.totalMATGenerated} / ${faction.totalMATConsumed}`} />
                <DetailItem label="Battles Won/Lost" value={`${faction.battlesWon} / ${faction.battlesLost}`} />
                <DetailItem label="Win %" value={winPercentage} />
                <DetailItem label="Nodes Captured" value={faction.nodesSuccessfullyCaptured} />
                <DetailItem label="ELO (Est.)" value={eloPlaceholder} />
                <DetailItem label="Win Streak" value={winStreak} />
                <DetailItem label="Loss Streak" value={lossStreak} />
                <DetailItem label="Avg. Fight Strength" value={avgFightingStrength} />
              </div>
              <div className="mt-2">
                <p className="text-xs text-terminal-gray-light mb-0.5">OpPlan Trajectory (Last 5):</p>
                <ul className="text-xs list-disc list-inside ml-2 max-h-20 overflow-y-auto">
                  {gameState.opPlanHistory[factionId]?.slice(0, 5).map(op => (
                    <li key={op.id} className="truncate" title={`${op.operation}: ${op.objective}`}>
                        <span className="text-terminal-gray-light">T{op.turnGenerated}:</span> {op.operation}
                    </li>
                  ))}
                   {faction.currentOpPlan && <li className="truncate" title={`${faction.currentOpPlan.operation}: ${faction.currentOpPlan.objective}`}><span className="text-terminal-gray-light">Current:</span> {faction.currentOpPlan.operation}</li>}
                </ul>
              </div>
            </div>
          );
        })}
        
        <div>
          <h4 className="text-md font-semibold text-terminal-green mb-1">Battle Log Summary</h4>
          <div className="max-h-40 overflow-y-auto terminal-border border-terminal-gray-dark p-2 rounded text-xs space-y-1">
            {gameState.battleLog.length === 0 && <p className="text-terminal-gray-light">No battles occurred.</p>}
            {gameState.battleLog.slice().reverse().map(b => (
              <p key={b.id} className="border-b border-terminal-gray-dark border-opacity-50 pb-0.5">
                <span className="text-terminal-gray-light">T{b.turn}:</span> {b.nodeName} - 
                <span className={FACTION_COLORS[b.attacker]?.primary}> {gameState.factions[b.attacker]?.name}</span> vs 
                <span className={FACTION_COLORS[b.defender]?.primary}> {gameState.factions[b.defender]?.name}</span> | 
                <span className={b.outcome === 'ATTACKER_WINS' ? 'text-terminal-green' : b.outcome === 'DEFENDER_WINS' ? 'text-terminal-red' : 'text-terminal-yellow'}> {b.outcome.replace('_',' ')} </span> 
                (Losses A:{b.attackerLosses},D:{b.defenderLosses})
                {b.nodeCaptured ? <span className="text-terminal-green"> [Captured]</span> : ''}
              </p>
            ))}
          </div>
        </div>

        <div>
            <p className="text-xs text-terminal-gray mt-1">Graph Placeholders:</p>
            <div className="p-2 terminal-border border-dashed border-terminal-gray text-center text-terminal-gray">Units Deployed/Lost Over Time Graph (Future)</div>
            <div className="p-2 terminal-border border-dashed border-terminal-gray text-center text-terminal-gray mt-1">MAT Economy Over Time Graph (Future)</div>
        </div>
        
        <div className="flex space-x-2 mt-3 pt-2 border-t border-terminal-green border-opacity-20">
          <Button onClick={onClose} variant="primary" className="flex-1">Close Report</Button>
          <Button onClick={handleExportText} variant="secondary" className="flex-1">Export Text</Button>
          <Button onClick={handleExportPNG} variant="secondary" className="flex-1">Export PNG (WIP)</Button>
        </div>
      </div>
    </Modal>
  );
};
