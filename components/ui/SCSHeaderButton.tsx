
import React from 'react';
import { Button } from '../common/Button'; // Adjust path as needed

interface SCSHeaderButtonProps {
  onClick: () => void;
  hasNewSCSMessage: boolean;
  className?: string;
}

const SCSHeaderButton: React.FC<SCSHeaderButtonProps> = ({
  onClick,
  hasNewSCSMessage,
  className = '',
}) => {
  return (
    <Button
      onClick={onClick}
      variant="secondary" // Matching FOW ACTIVE, NEW SETUP styling
      size="sm" 
      className={`px-2.5 ${className} relative`}
      title="Strategic Communication Subsystem"
      aria-label="Open Strategic Communication Subsystem"
    >
      SCS
      {hasNewSCSMessage && (
        <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white bg-red-500" />
      )}
    </Button>
  );
};

export default SCSHeaderButton;
