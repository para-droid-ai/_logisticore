
import React from 'react';
import { Modal } from '../common/Modal';
import { BattleLogEntry, Faction, PlayerId } from '../../types';
import { FACTION_COLORS } from '../../constants';

interface BattleReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  battleReport: BattleLogEntry | null;
  factions: Record<PlayerId, Faction>;
}

const DetailItem: React.FC<{ label: string; value: string | number; valueColor?: string; className?: string }> = ({ label, value, valueColor, className }) => (
  <div className={`text-sm ${className || 'mb-1'}`}>
    <span className="text-terminal-gray-light">{label}: </span>
    <span className={`${valueColor || 'text-terminal-green'} font-semibold`}>{value}</span>
  </div>
);

export const BattleReportModal: React.FC<BattleReportModalProps> = ({ isOpen, onClose, battleReport, factions }) => {
  if (!isOpen || !battleReport) {
    return null;
  }

  const attackerName = factions[battleReport.attacker]?.name || battleReport.attacker;
  const defenderName = factions[battleReport.defender]?.name || battleReport.defender;
  const attackerColor = FACTION_COLORS[battleReport.attacker]?.primary || 'text-terminal-cyan';
  const defenderColor = FACTION_COLORS[battleReport.defender]?.primary || 'text-terminal-red';

  const outcomeColor = battleReport.outcome === 'ATTACKER_WINS' ? 'text-terminal-green' : 
                       battleReport.outcome === 'DEFENDER_WINS' ? 'text-terminal-red' : 
                       'text-terminal-yellow';
  
  const attackerLossesToDefensiveArtillery = battleReport.attackerLossesFromDefensiveArtillery || 0;
  const defenderLossesToOffensiveArtillery = battleReport.defenderLossesFromOffensiveArtillery || 0;

  const attackerCombatLosses = battleReport.attackerLosses - attackerLossesToDefensiveArtillery;
  const defenderCombatLosses = battleReport.defenderLosses - defenderLossesToOffensiveArtillery;

  const wasArtilleryFired = (battleReport.attackerArtilleryFired || 0) > 0 || (battleReport.defenderArtilleryFired || 0) > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Battle Report: ${battleReport.nodeName} (Turn ${battleReport.turn})`} className="max-w-xl"> {/* Slightly wider for more info */}
      <div className="space-y-3 p-4"> {/* Added padding to the main content area */}
        <div className="grid grid-cols-2 gap-4 p-2 terminal-border border-terminal-gray-dark rounded">
          <div>
            <h4 className={`text-md font-semibold mb-1 ${attackerColor}`}>{attackerName} (Attacker)</h4>
            <DetailItem label="Units Before" value={battleReport.attackerUnitsBefore} />
            {attackerLossesToDefensiveArtillery > 0 && (
              <DetailItem label="Losses to Arty" value={attackerLossesToDefensiveArtillery} valueColor="text-terminal-red" />
            )}
            <DetailItem label="Combat Losses" value={attackerCombatLosses} valueColor="text-terminal-red" />
            <DetailItem label="Total Losses" value={battleReport.attackerLosses} valueColor="text-terminal-red" />
            <DetailItem label="Units After" value={battleReport.attackerUnitsBefore - battleReport.attackerLosses} />
          </div>
          <div>
            <h4 className={`text-md font-semibold mb-1 ${defenderColor}`}>{defenderName} (Defender)</h4>
            <DetailItem label="Units Before" value={battleReport.defenderUnitsBefore} />
             {defenderLossesToOffensiveArtillery > 0 && (
              <DetailItem label="Losses to Arty" value={defenderLossesToOffensiveArtillery} valueColor="text-terminal-red" />
            )}
            <DetailItem label="Combat Losses" value={defenderCombatLosses} valueColor="text-terminal-red" />
            <DetailItem label="Total Losses" value={battleReport.defenderLosses} valueColor="text-terminal-red" />
            <DetailItem label="Units After" value={battleReport.defenderUnitsBefore - battleReport.defenderLosses} />
          </div>
        </div>

        <div className="p-2 terminal-border border-terminal-gray-dark rounded">
          <DetailItem label="Node" value={`${battleReport.nodeName} (${battleReport.nodeId})`} />
          <DetailItem label="Outcome" value={battleReport.outcome.replace('_', ' ')} valueColor={outcomeColor} />
          {battleReport.nodeCaptured && <DetailItem label="Node Status" value="Captured by Attacker" valueColor="text-terminal-green" />}
          {battleReport.fortificationBonusUsed !== undefined && battleReport.fortificationBonusUsed > 0 && <DetailItem label="Defender Fort Lvl Used" value={battleReport.fortificationBonusUsed} />}
        </div>
        
        {wasArtilleryFired && (
           <div className="p-2 terminal-border border-terminal-gray-dark rounded">
            <h4 className="text-md font-semibold text-terminal-yellow mb-1">Artillery Exchange Phase:</h4>
            {battleReport.attackerArtilleryFired !== undefined && battleReport.attackerArtilleryFired > 0 && (
              <p className="text-xs text-terminal-gray-light">
                {attackerName} fired <span className={`${attackerColor} font-semibold`}>{battleReport.attackerArtilleryFired}</span> artillery pieces.
                {defenderLossesToOffensiveArtillery > 0 && (
                  <span className="text-terminal-red"> Inflicted <span className="font-semibold">{defenderLossesToOffensiveArtillery}</span> casualties on {defenderName}.</span>
                )}
              </p>
            )}
            {battleReport.defenderArtilleryFired !== undefined && battleReport.defenderArtilleryFired > 0 && (
              <p className="text-xs text-terminal-gray-light">
                {defenderName} fired <span className={`${defenderColor} font-semibold`}>{battleReport.defenderArtilleryFired}</span> artillery pieces.
                {attackerLossesToDefensiveArtillery > 0 && (
                  <span className="text-terminal-red"> Inflicted <span className="font-semibold">{attackerLossesToDefensiveArtillery}</span> casualties on {attackerName}.</span>
                )}
              </p>
            )}
          </div>
        )}
        
        {battleReport.rounds && battleReport.rounds.length > 0 ? (
          <div>
            <h4 className="text-md font-semibold text-terminal-green mb-1">Combat Rounds {wasArtilleryFired ? '(Post-Artillery)' : ''}:</h4>
            <div className="max-h-[250px] overflow-y-auto space-y-2 pr-2 custom-scrollbar-battlereport">
              {battleReport.rounds.map((round, index) => (
                <div key={index} className="p-2 terminal-border border-terminal-gray-dark rounded-sm">
                  <p className="text-sm font-semibold text-terminal-cyan mb-1">Round {round.roundNumber}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <DetailItem label="Attacker Units" value={`${round.attackerUnitsStart} -> ${round.attackerUnitsEnd}`} />
                      <DetailItem label="Att. Dice" value={round.attackerDiceRolls.join(', ')} />
                      {round.attackerBonusesApplied && round.attackerBonusesApplied.length > 0 && <DetailItem label="Att. Bonuses" value={round.attackerBonusesApplied.join(', ')} />}
                      <DetailItem label="Att. Final Rolls" value={round.attackerFinalRolls.join(', ')} />
                      <DetailItem label="Att. Losses This Rd" value={round.attackerLossesThisRound} valueColor="text-terminal-red" />
                    </div>
                    <div>
                      <DetailItem label="Defender Units" value={`${round.defenderUnitsStart} -> ${round.defenderUnitsEnd}`} />
                      <DetailItem label="Def. Dice" value={round.defenderDiceRolls.join(', ')} />
                      {round.defenderBonusesApplied && round.defenderBonusesApplied.length > 0 && <DetailItem label="Def. Bonuses" value={round.defenderBonusesApplied.join(', ')} />}
                      <DetailItem label="Def. Final Rolls" value={round.defenderFinalRolls.join(', ')} />
                      <DetailItem label="Def. Losses This Rd" value={round.defenderLossesThisRound} valueColor="text-terminal-red" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
           <p className="text-terminal-gray-light text-center text-xs italic py-2">
            {wasArtilleryFired ? 'No conventional combat rounds after artillery exchange.' : 'No conventional combat rounds took place.'}
           </p>
        )}
      </div>
       <style>{`
        .custom-scrollbar-battlereport::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar-battlereport::-webkit-scrollbar-track { background: #181c22; }
        .custom-scrollbar-battlereport::-webkit-scrollbar-thumb { background: #2ea043; border-radius: 2px; }
        .custom-scrollbar-battlereport::-webkit-scrollbar-thumb:hover { background: #3ccb53; }
      `}</style>
    </Modal>
  );
};
