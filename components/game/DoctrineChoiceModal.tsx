import React from 'react';
import { Modal } from '../common/Modal';
import { DoctrineDefinition } from '../../types';
import { Button } from '../common/Button';

interface DoctrineChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctrineChoices: DoctrineDefinition[];
  onDoctrineSelected: (doctrineId: string) => void;
}

export const DoctrineChoiceModal: React.FC<DoctrineChoiceModalProps> = ({
  isOpen,
  onClose,
  doctrineChoices,
  onDoctrineSelected,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Choose Your Doctrine">
      <div className="p-4 text-terminal-green">
        <p className="mb-4">As a new strategic directive is issued, your faction must choose a guiding doctrine. Select one of the following:</p>
        <div className="space-y-4">
          {doctrineChoices.map((doctrine) => (
            <div key={doctrine.id} className="terminal-border p-3 rounded-md">
              <h3 className="text-lg font-bold text-terminal-yellow mb-2">{doctrine.name}</h3>
              <p className="text-sm text-terminal-gray-light mb-1">Theme: {doctrine.theme} | Tier: {doctrine.tier}</p>
              <div className="mb-2">
                <h4 className="font-semibold text-terminal-green">Buffs:</h4>
                <ul className="list-disc list-inside text-xs">
                  {doctrine.buffs.map((buff, index) => (
                    <li key={index}>{buff.type}{buff.value ? `: ${buff.value}` : ''}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-terminal-red">Nerfs:</h4>
                <ul className="list-disc list-inside text-xs">
                  {doctrine.nerfs.map((nerf, index) => (
                    <li key={index}>{nerf.type}{nerf.value ? `: ${nerf.value}` : ''}</li>
                  ))}
                </ul>
              </div>
              <Button
                onClick={() => onDoctrineSelected(doctrine.id)}
                className="mt-4 bg-terminal-blue hover:bg-terminal-blue-dark text-white py-1 px-3 rounded"
              >
                Select {doctrine.name}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};