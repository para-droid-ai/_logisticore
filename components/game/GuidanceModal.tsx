
import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Faction } from '../../types';

interface GuidanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (note: string) => void;
  faction: Faction | null;
}

export const GuidanceModal: React.FC<GuidanceModalProps> = ({ isOpen, onClose, onSubmit, faction }) => {
  const [note, setNote] = useState('');

  if (!faction) return null;

  const handleSubmit = () => {
    onSubmit(note);
    onClose();
    setNote('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Provide Strategic Guidance for ${faction.name}`}>
      <div className="space-y-4 p-4">
        <p className="text-sm text-terminal-gray-light">
          Enter a high-level strategic directive for {faction.name}. This note will be passed to the AI during its next planning phase (FLUCTUATION) to influence its Operational Plan.
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={6}
          className="w-full bg-terminal-gray-darker p-2 border border-terminal-green/50 rounded text-terminal-green focus:ring-terminal-cyan focus:border-terminal-cyan placeholder-terminal-gray-dark text-sm"
          placeholder="e.g., 'Focus all efforts on capturing the Tractor Factory. Do not get bogged down in other fights.' or 'Adopt a purely defensive stance and build up fortifications on all border nodes.'"
          aria-label={`Strategic guidance input for ${faction.name}`}
        />
        <div className="flex justify-end space-x-2">
          <Button onClick={onClose} variant="secondary">Cancel</Button>
          <Button onClick={handleSubmit} variant="primary" disabled={!note.trim()}>
            Queue Guidance
          </Button>
        </div>
      </div>
    </Modal>
  );
};
