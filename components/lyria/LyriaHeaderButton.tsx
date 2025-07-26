
import React from 'react';
import { LyriaPlaybackState } from '../../types'; // Adjust path as needed

interface LyriaHeaderButtonProps {
  playbackState: LyriaPlaybackState;
  onPlayPause: () => void;
  // onOpenModal prop removed
  isLyriaReady: boolean;
  className?: string;
}

const PlayIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 ${className || ''}`}>
    <path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11V15.89a1.5 1.5 0 0 0 2.3 1.269l9.344-5.89a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z" />
  </svg>
);

const PauseIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 ${className || ''}`}>
    <path d="M5.75 3a.75.75 0 0 0-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75V3.75A.75.75 0 0 0 7.25 3h-1.5ZM12.75 3a.75.75 0 0 0-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75V3.75A.75.75 0 0 0 14.25 3h-1.5Z" />
  </svg>
);

const LoadingIcon: React.FC<{className?: string}> = ({className}) => (
  <svg className={`w-4 h-4 animate-spin ${className || ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const MusicNoteIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 ${className || ''}`}>
    <path d="M10 3.5A1.5 1.5 0 0 1 11.5 2h.05a1.5 1.5 0 0 1 1.45 1.5V11a3 3 0 1 1-2.5-2.917V3.5ZM9 14.5A1.5 1.5 0 1 0 12 13a1.5 1.5 0 0 0-3 1.5Z" />
  </svg>
);


const LyriaHeaderButton: React.FC<LyriaHeaderButtonProps> = ({
  playbackState,
  onPlayPause,
  isLyriaReady,
  className = '',
}) => {
  // Button is disabled if Lyria is not ready AND not in an error state.
  // If in error state, it's not "disabled" but its click action might be nullified.
  const isButtonEffectivelyDisabled = !isLyriaReady && playbackState !== 'error';
  
  let title = "Play Lyria Music";
  if (playbackState === 'playing' || playbackState === 'loading') title = "Pause Lyria Music";
  else if (playbackState === 'error') title = "Lyria Error - Check Lyria Settings in Game Guide";
  else if (playbackState === 'stopped' || playbackState === 'paused') title = "Play Lyria Music";


  const buttonBaseStyle = "p-1.5 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-black transition-colors duration-150 h-[30px] w-[30px] flex items-center justify-center";
  const enabledStyle = "bg-terminal-cyan hover:bg-cyan-400 focus:ring-terminal-cyan text-black";
  const playingStyle = "bg-green-500 hover:bg-green-400 focus:ring-green-500 text-white";
  const errorStyle = "bg-terminal-red hover:bg-red-400 focus:ring-terminal-red text-white";
  const disabledStyle = "bg-terminal-gray-dark text-terminal-gray opacity-60 cursor-not-allowed";

  let currentActionStyle = disabledStyle;
  if (playbackState === 'error') {
     currentActionStyle = errorStyle;
  } else if (isLyriaReady) {
    if (playbackState === 'playing' || playbackState === 'loading') {
        currentActionStyle = playingStyle;
    } else if (playbackState === 'stopped' || playbackState === 'paused') {
        currentActionStyle = enabledStyle; 
    }
  }
  
  const handleActionButtonClick = () => {
    // Only call onPlayPause if Lyria is ready and not in an error state.
    // Clicking in error state does nothing here; user must go to Info Modal -> Lyria Settings.
    if (isLyriaReady && playbackState !== 'error') { 
        onPlayPause();
    }
  };
  
  const renderMainIcon = () => {
    if (playbackState === 'loading') return <LoadingIcon />;
    if (playbackState === 'playing') return <PauseIcon />;
    if (playbackState === 'stopped' || playbackState === 'paused') return <PlayIcon />;
    return <MusicNoteIcon />; // For 'error' state on the action button
  };

  return (
    <div className={`relative flex items-center ${className}`}>
        <button
            onClick={handleActionButtonClick}
            disabled={isButtonEffectivelyDisabled} // Visually disabled if not ready and not error
            className={`${buttonBaseStyle} ${currentActionStyle}`}
            title={title}
            aria-label={title}
        >
            {renderMainIcon()}
        </button>
        {/* Settings button part is removed */}
    </div>
  );
};

export default LyriaHeaderButton;
