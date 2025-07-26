
import React, { useRef } from 'react';
import { Modal } from '../common/Modal'; // Adjust path as needed
import { Button } from '../common/Button'; // Adjust path as needed

interface LyriaSaveLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onLoad: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const LyriaSaveLoadModal: React.FC<LyriaSaveLoadModalProps> = ({ isOpen, onClose, onSave, onLoad }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerLoadFile = () => {
    fileInputRef.current?.click();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Lyria Music Settings">
      <div className="space-y-4">
        <Button 
          variant="primary" 
          onClick={() => { onSave(); onClose(); }} 
          className="w-full"
          aria-label="Save current Lyria settings to a file"
        >
          Save Current Settings
        </Button>
        <Button 
          variant="secondary" 
          onClick={triggerLoadFile} 
          className="w-full"
          aria-label="Load Lyria settings from a file"
        >
          Load Settings from File
        </Button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={(e) => { onLoad(e); onClose(); if(e.target) e.target.value = ''; }} // Clear file input after selection
          accept=".json" 
          style={{ display: 'none' }} 
          aria-hidden="true"
        />
        <p className="text-xs text-terminal-gray text-center">
          Settings include prompts and advanced generation parameters.
        </p>
      </div>
    </Modal>
  );
};

export default LyriaSaveLoadModal;
