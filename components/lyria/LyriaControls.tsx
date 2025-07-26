
import React, { useState } from 'react';
// Removed Modal import from common
import { Button } from '../common/Button'; // Adjust path
import { LyriaPrompt, LiveMusicGenerationConfig, LyriaPlaybackState, LyriaScale } from '../../types'; // Adjust path
import WeightSlider from './WeightSlider'; // Adjust path
import { MAX_LYRIA_PROMPTS, LYRIA_SCALES } from '../../constants'; // Adjust path

interface LyriaControlsProps {
  // isOpen and onClose removed as it's no longer a modal
  prompts: LyriaPrompt[];
  config: LiveMusicGenerationConfig;
  onAddPrompt: () => void;
  onRemovePrompt: (id: string) => void;
  onPromptTextChange: (id: string, text: string) => void;
  onPromptWeightChange: (id: string, weight: number) => void;
  onConfigChange: (key: keyof LiveMusicGenerationConfig, value: any) => void;
  statusMessage: string;
  onPlayPauseClick: () => void;
  onResetContextClick: () => void;
  currentPlaybackState: LyriaPlaybackState;
  isLyriaReady: boolean;
  onOpenSaveLoadModal: () => void;
}

const PlayIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 ${className || ''}`}>
    <path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11V15.89a1.5 1.5 0 0 0 2.3 1.269l9.344-5.89a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z" />
  </svg>
);

const PauseIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 ${className || ''}`}>
    <path d="M5.75 3a.75.75 0 0 0-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75V3.75A.75.75 0 0 0 7.25 3h-1.5ZM12.75 3a.75.75 0 0 0-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75V3.75A.75.75 0 0 0 14.25 3h-1.5Z" />
  </svg>
);
const LoadingIcon: React.FC<{className?: string}> = ({className}) => (
  <svg className={`w-5 h-5 animate-spin ${className || ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);


const LyriaControls: React.FC<LyriaControlsProps> = ({
  prompts, config, onAddPrompt, onRemovePrompt,
  onPromptTextChange, onPromptWeightChange, onConfigChange, statusMessage,
  onPlayPauseClick, onResetContextClick, currentPlaybackState, isLyriaReady, onOpenSaveLoadModal
}) => {
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  const renderPlaybackIcon = () => {
    if (currentPlaybackState === 'loading') return <LoadingIcon />;
    if (currentPlaybackState === 'playing') return <PauseIcon />;
    return <PlayIcon />;
  };
  
  const playPauseButtonText = currentPlaybackState === 'playing' || currentPlaybackState === 'loading' ? 'PAUSE MUSIC' : 'PLAY MUSIC';

  return (
    // Removed Modal shell. This is now a panel of controls.
    <div className="flex flex-col gap-4 py-3"> {/* Added padding for when embedded */}
      {/* Prompts Section */}
      <div className="space-y-3 pb-2">
        <h4 className="text-md font-semibold text-terminal-cyan">Music Prompts</h4>
        {prompts.map((prompt) => (
          <div key={prompt.promptId} className="flex items-center gap-2 p-2 rounded terminal-border border-terminal-gray-dark hover:border-terminal-green/50 transition-colors"
               style={{borderColor: prompt.color || 'var(--color-border-muted)'}}>
            <WeightSlider
              promptId={prompt.promptId}
              initialWeight={prompt.weight}
              color={prompt.color}
              onWeightChange={onPromptWeightChange}
            />
            <input
              type="text"
              value={prompt.text}
              onChange={(e) => onPromptTextChange(prompt.promptId, e.target.value)}
              placeholder="Enter music prompt..."
              className="flex-grow bg-black bg-opacity-40 p-2 border border-terminal-green border-opacity-30 rounded text-terminal-green text-sm focus:border-terminal-cyan focus:ring-terminal-cyan placeholder-terminal-gray"
              aria-label={`Prompt text for ${prompt.promptId}`}
            />
            <button
              onClick={() => onRemovePrompt(prompt.promptId)}
              className="p-1 text-terminal-red hover:text-red-400 text-lg"
              aria-label={`Remove prompt ${prompt.promptId}`}
            >
              &times;
            </button>
          </div>
        ))}
        <Button
          variant="secondary"
          onClick={onAddPrompt}
          disabled={prompts.length >= MAX_LYRIA_PROMPTS}
          className="w-full text-xs"
        >
          Add Music Prompt (Max: {MAX_LYRIA_PROMPTS})
        </Button>
      </div>

      {/* Settings & Controls Section */}
      <div className="w-full space-y-3 pb-2">
         <Button variant="ghost" onClick={() => setShowAdvancedSettings(!showAdvancedSettings)} className="w-full text-xs mb-1">
          {showAdvancedSettings ? 'Hide' : 'Show'} Advanced Settings
        </Button>

        {showAdvancedSettings && (
          <div className="space-y-2 p-2 terminal-border border-terminal-gray-dark rounded text-xs">
            <h5 className="text-sm font-semibold text-terminal-cyan mb-1">Advanced Controls</h5>
            {[
              { label: 'Temperature', key: 'temperature', min: 0, max: 3, step: 0.1, value: config.temperature },
              { label: 'Guidance', key: 'guidance', min: 0, max: 6, step: 0.1, value: config.guidance },
              { label: 'Density', key: 'density', min: 0, max: 1, step: 0.05, value: config.density },
              { label: 'Brightness', key: 'brightness', min: 0, max: 1, step: 0.05, value: config.brightness },
            ].map(item => (
              <div key={item.key}>
                <label htmlFor={item.key} className="block text-terminal-gray-light">{item.label}: {Number(item.value)?.toFixed(item.step >= 0.1 ? 1 : 2) ?? 'N/A'}</label>
                <input
                  type="range"
                  id={item.key}
                  min={item.min}
                  max={item.max}
                  step={item.step}
                  value={item.value ?? (item.min + (item.max - item.min) / 2)}
                  onChange={(e) => onConfigChange(item.key as keyof LiveMusicGenerationConfig, parseFloat(e.target.value))}
                  className="w-full h-2 bg-terminal-gray-dark rounded-lg appearance-none cursor-pointer range-sm accent-terminal-green"
                />
              </div>
            ))}
            <div>
              <label htmlFor="bpm" className="block text-terminal-gray-light">BPM: {config.bpm ?? 'N/A'}</label>
              <input
                type="number"
                id="bpm"
                min="60" max="200" step="1"
                value={config.bpm ?? ''}
                onChange={(e) => onConfigChange('bpm', e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                className="w-full bg-terminal-gray-darker p-1 border border-terminal-gray-dark rounded text-terminal-green focus:border-terminal-cyan"
              />
            </div>
            <div>
              <label htmlFor="scale" className="block text-terminal-gray-light">Scale:</label>
              <select
                id="scale"
                value={config.scale ?? LYRIA_SCALES.find(s=>s.value === undefined)?.value}
                onChange={(e) => onConfigChange('scale', e.target.value as LyriaScale)}
                className="w-full bg-terminal-gray-darker p-1 border border-terminal-gray-dark rounded text-terminal-green focus:border-terminal-cyan"
              >
                {LYRIA_SCALES.map(s => <option key={s.value} value={s.value}>{s.name}</option>)}
              </select>
            </div>
             <div>
              <label htmlFor="seed" className="block text-terminal-gray-light">Seed (Optional): {config.seed ?? 'Random'}</label>
              <input
                type="number"
                id="seed"
                min="0" max="2147483647" step="1"
                placeholder="Leave empty for random"
                value={config.seed ?? ''}
                onChange={(e) => onConfigChange('seed', e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                className="w-full bg-terminal-gray-darker p-1 border border-terminal-gray-dark rounded text-terminal-green focus:border-terminal-cyan"
              />
            </div>
            <div className="grid grid-cols-1 gap-1 pt-1">
              {['muteBass', 'muteDrums', 'onlyBassAndDrums'].map(key => (
                <label key={key} className="flex items-center space-x-2 text-terminal-gray-light">
                  <input
                    type="checkbox"
                    checked={!!config[key as keyof LiveMusicGenerationConfig]}
                    onChange={(e) => onConfigChange(key as keyof LiveMusicGenerationConfig, e.target.checked)}
                    className="form-checkbox bg-terminal-gray-dark border-terminal-green text-terminal-green focus:ring-terminal-green"
                  />
                  <span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        
        <div className="pt-2 space-y-2 border-t border-terminal-green/30">
          <p className="text-xs text-terminal-gray text-center min-h-[2.5em] flex items-center justify-center p-1 bg-black/20 rounded">
            {statusMessage}
          </p>
          <Button
              variant={currentPlaybackState === 'playing' || currentPlaybackState === 'loading' ? 'secondary' : 'primary'}
              onClick={onPlayPauseClick}
              disabled={!isLyriaReady && currentPlaybackState !== 'error'}
              className="w-full flex items-center justify-center gap-2"
            >
              {renderPlaybackIcon()} {playPauseButtonText}
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="ghost" onClick={onResetContextClick} disabled={!isLyriaReady || currentPlaybackState === 'stopped'} className="text-xs">Reset Context</Button>
            <Button variant="ghost" onClick={onOpenSaveLoadModal} disabled={!isLyriaReady} className="text-xs">Save/Load</Button>
          </div>
        </div>
      </div>
      {/* Removed main modal close button from here */}
    </div>
  );
};

export default LyriaControls;
