
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string; // Allow passing custom classes for width, etc.
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, className }) => {
  if (!isOpen) return null;

  // Default max-w-lg, can be overridden by className
  const modalSizeClass = className && (className.includes('max-w-') || className.includes('w-')) ? '' : 'max-w-lg';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div className={`bg-terminal-gray-panel terminal-border rounded-lg shadow-xl w-full ${modalSizeClass} max-h-[85vh] flex flex-col ${className}`}>
        <div className="flex items-center justify-between p-4 border-b border-terminal-green border-opacity-30">
          <h2 className="text-xl font-semibold text-terminal-green">{title}</h2>
          <button
            onClick={onClose}
            className="text-terminal-gray-light hover:text-terminal-red text-2xl"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>
        <div className="pt-0 pb-4 px-0 overflow-y-auto flex-1"> {/* Adjusted padding to px-0, specific components will add their own */}
          {children}
        </div>
      </div>
    </div>
  );
};
