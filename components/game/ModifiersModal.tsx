
import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { GameSettings } from '../../types';

interface ModifiersModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: GameSettings;
  onSettingsChange: (newSettings: GameSettings) => void;
  onNewSetupRequired: () => void;
  isGemmaModelActive: boolean;
}

export const ModifiersModal: React.FC<ModifiersModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onSettingsChange,
  onNewSetupRequired,
  isGemmaModelActive
}) => {

  const handleFoWToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFoWState = event.target.checked;
    onSettingsChange({
      ...currentSettings,
      isFoWEnabledForNewGame: newFoWState,
    });
    onNewSetupRequired();
  };

  const handleSanitizerToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSanitizerState = event.target.checked;
    onSettingsChange({
      ...currentSettings,
      isAggressiveSanitizationEnabled: newSanitizerState,
    });
  };

  const handleStructuredOutputToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newStructuredOutputState = event.target.checked;
    onSettingsChange({
      ...currentSettings,
      isStructuredOutputEnabled: newStructuredOutputState,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Game Modifiers">
      <div className="space-y-4 text-sm p-4">
        <div>
          <h4 className="font-semibold text-terminal-cyan mb-2">Gameplay Modifiers</h4>
          <label className="flex items-center space-x-3 p-2 terminal-border border-terminal-gray-dark rounded hover:border-terminal-green transition-colors mb-3 cursor-pointer">
            <input
              type="checkbox"
              className="form-checkbox h-5 w-5 bg-terminal-gray-dark border-terminal-green text-terminal-green focus:ring-terminal-green focus:ring-offset-0 rounded"
              checked={currentSettings.isFoWEnabledForNewGame}
              onChange={handleFoWToggle}
              aria-label="Enable Fog of War for new game"
            />
            <span className="text-terminal-gray-light">
              Enable Fog of War
              <p className="text-xs text-terminal-gray mt-0.5">
                Reduces visibility to owned and adjacent nodes. Applies to the next new game automatically.
              </p>
            </span>
          </label>
        </div>

        <div>
          <h4 className="font-semibold text-terminal-cyan mb-2">AI & JSON Handling</h4>
          <label className="flex items-center space-x-3 p-2 terminal-border border-terminal-gray-dark rounded hover:border-terminal-green transition-colors mb-3 cursor-pointer">
            <input
              type="checkbox"
              className="form-checkbox h-5 w-5 bg-terminal-gray-dark border-terminal-green text-terminal-green focus:ring-terminal-green focus:ring-offset-0 rounded"
              checked={currentSettings.isAggressiveSanitizationEnabled}
              onChange={handleSanitizerToggle}
              aria-label="Enable Aggressive JSON Sanitization"
            />
            <span className="text-terminal-gray-light">
              Enable Aggressive JSON Sanitization
              <p className="text-xs text-terminal-gray mt-0.5">
                More forcefully attempts to correct malformed JSON from AI. May alter data.
              </p>
            </span>
          </label>

          <label className={`flex items-center space-x-3 p-2 terminal-border border-terminal-gray-dark rounded ${isGemmaModelActive ? 'opacity-60 cursor-not-allowed' : 'hover:border-terminal-green transition-colors cursor-pointer'}`}>
            <input
              type="checkbox"
              className="form-checkbox h-5 w-5 bg-terminal-gray-dark border-terminal-green text-terminal-green focus:ring-terminal-green focus:ring-offset-0 rounded"
              checked={!isGemmaModelActive && currentSettings.isStructuredOutputEnabled}
              onChange={handleStructuredOutputToggle}
              disabled={isGemmaModelActive}
              aria-label="Enable Structured Gemini Output"
            />
            <span className="text-terminal-gray-light">
              Enable Structured Gemini Output
              <p className="text-xs text-terminal-gray mt-0.5">
                Instructs Gemini models to return JSON structured according to a schema.
                {isGemmaModelActive && (
                  <span className="block text-terminal-yellow text-xs mt-1">
                    (Note: Not applicable for Gemma models. JSON output is handled via text prompting.)
                  </span>
                )}
              </p>
            </span>
          </label>
        </div>

        <div className="pt-4 border-t border-terminal-green/30">
          <Button variant="primary" onClick={onClose} className="w-full">
            Close Modifiers
          </Button>
        </div>
      </div>
    </Modal>
  );
};
