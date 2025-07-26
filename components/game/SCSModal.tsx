
import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { CommLogEntry, PlayerId, Faction } from '../../types';
import { FACTION_COLORS, AI1_ID, AI2_ID, COMMAND_CONSOLE_ID } from '../../constants';

interface SCSModalProps {
  isOpen: boolean;
  onClose: () => void;
  commLog: CommLogEntry[];
  onSendDirective: (message: string, target: PlayerId | 'BROADCAST') => void;
  factions: Record<PlayerId, Faction>;
  className?: string;
  onDockToSidebar: () => void; 
}

const DockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
  </svg>
);


export const SCSModal: React.FC<SCSModalProps> = ({ isOpen, onClose, commLog, onSendDirective, factions, className, onDockToSidebar }) => {
  const [directiveMessage, setDirectiveMessage] = useState('');
  const [directiveTarget, setDirectiveTarget] = useState<PlayerId | 'BROADCAST'>('BROADCAST');
  const commLogEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && commLogEndRef.current) {
      commLogEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [commLog, isOpen]);

  const handleSubmitDirective = () => {
    if (directiveMessage.trim() === '') return;
    onSendDirective(directiveMessage, directiveTarget);
    setDirectiveMessage('');
  };

  const handleDockClick = () => {
    onDockToSidebar();
    // onClose(); // App.tsx will handle closing the modal when docking
  };

  const getSenderStyleClasses = (senderId: PlayerId): { nameClass: string; messageClass: string } => {
    const factionTheme = FACTION_COLORS[senderId];
    if (factionTheme) {
      if (senderId === COMMAND_CONSOLE_ID) {
        return { nameClass: `font-semibold ${factionTheme.primary}`, messageClass: factionTheme.primary };
      }
      return { nameClass: `font-semibold ${factionTheme.primary}`, messageClass: factionTheme.primary };
    }
    return { nameClass: 'font-semibold text-terminal-gray-light', messageClass: 'text-gray-300' };
  };

  const formatTargetInfo = (entry: CommLogEntry): string => {
    if (entry.senderId === COMMAND_CONSOLE_ID && entry.targetFactionId && entry.targetFactionId !== 'BROADCAST') {
      const targetFactionName = factions[entry.targetFactionId as PlayerId]?.name || entry.targetFactionId;
      return ` to ${targetFactionName}`;
    }
    return '';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Strategic Communication Subsystem (SCS)" className={className}>
      <div className="absolute top-4 right-12"> 
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDockClick}
            className="p-1 text-terminal-blue hover:text-terminal-cyan"
            title="Dock SCS Log to Sidebar"
            aria-label="Dock SCS Log to Sidebar"
          >
            <DockIcon />
          </Button>
        </div>
      <div className="flex flex-col h-[70vh] sm:h-[75vh] text-sm w-full">
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5 bg-terminal-gray-darker terminal-border border-terminal-gray-dark rounded mb-3 custom-scrollbar-scs">
          {commLog.length === 0 && (
            <p className="text-terminal-gray-light italic text-center py-4 text-base">No communications logged yet.</p>
          )}
          {commLog.map((entry) => {
            const { nameClass, messageClass } = getSenderStyleClasses(entry.senderId);
            const targetInfo = formatTargetInfo(entry);
            return (
              <div key={entry.id} className="flex text-sm leading-relaxed">
                <span className={`${nameClass} mr-1.5 whitespace-nowrap`}>
                  {entry.senderName} (T{entry.turn}{targetInfo}):
                </span>
                <p className={`${messageClass} whitespace-pre-wrap break-words`}>
                  {entry.message}
                </p>
              </div>
            );
          })}
          <div ref={commLogEndRef} />
        </div>

        <div className="p-3 border-t border-terminal-green/30 space-y-3">
          <textarea
            value={directiveMessage}
            onChange={(e) => setDirectiveMessage(e.target.value)}
            rows={2}
            className="w-full bg-black bg-opacity-50 p-2 border border-terminal-gray rounded text-terminal-gray-light focus:ring-1 focus:ring-terminal-cyan focus:border-terminal-cyan placeholder-terminal-gray text-sm"
            placeholder="Type directive..."
            aria-label="Directive message input"
          />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="directiveTargetSCSModal" className="text-terminal-gray-light text-sm">Target:</label>
              <select
                id="directiveTargetSCSModal"
                value={directiveTarget}
                onChange={(e) => setDirectiveTarget(e.target.value as PlayerId | 'BROADCAST')}
                className="bg-terminal-gray-dark border border-terminal-green text-terminal-green rounded p-1.5 text-sm focus:ring-1 focus:ring-terminal-cyan focus:border-terminal-cyan"
              >
                <option value="BROADCAST">Broadcast</option>
                <option value={AI2_ID}>{factions[AI2_ID]?.name || AI2_ID}</option>
                <option value={AI1_ID}>{factions[AI1_ID]?.name || AI1_ID}</option>
              </select>
            </div>
            <Button
              onClick={handleSubmitDirective}
              variant="primary"
              size="md"
              className="px-3 py-1.5 bg-terminal-green text-black hover:bg-green-400 text-sm"
              disabled={!directiveMessage.trim()}
              title="Send Directive"
            >
              Send Directive
            </Button>
          </div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar-scs::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar-scs::-webkit-scrollbar-track {
          background: #161b22;
        }
        .custom-scrollbar-scs::-webkit-scrollbar-thumb {
          background: #2ea043;
          border-radius: 3px;
        }
        .custom-scrollbar-scs::-webkit-scrollbar-thumb:hover {
          background: #3ccb53; 
        }
      `}</style>
    </Modal>
  );
};