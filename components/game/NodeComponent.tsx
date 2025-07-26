
import React from 'react';
import { NodeData, PlayerId, NodeType } from '../../types';
import { FACTION_COLORS, NEUTRAL_STRONGHOLD_COLORS, AI1_ID, NEUTRAL_ID, RECON_ARRAY_NEUTRAL_COLORS, FORT_HP_PER_LEVEL } from '../../constants'; 

interface NodeComponentProps {
  node: NodeData;
  onNodeInteraction: (nodeId: string) => void; 
  isSelected?: boolean;
  isFogOfWarActive: boolean;
  isVisible: boolean;
}

const getNodeStyling = (owner: PlayerId, nodeType: NodeType, isVisible: boolean, isFogOfWarActive: boolean) => {
  if (isFogOfWarActive && !isVisible) {
    return { 
        primary: 'text-terminal-gray', 
        nodeBg: 'bg-terminal-gray-dark', 
        text: 'text-terminal-gray-light', 
        border: 'border-terminal-gray' 
    };
  }
  if (owner === 'NEUTRAL') {
    if (nodeType === 'RECON_ARRAY') return RECON_ARRAY_NEUTRAL_COLORS;
    return (nodeType === 'FORTRESS' || nodeType === 'CN' || nodeType === 'QN' || nodeType === 'INDUSTRIAL_HUB' || nodeType === 'URBAN') ? 
      NEUTRAL_STRONGHOLD_COLORS : FACTION_COLORS.NEUTRAL;
  }
  return FACTION_COLORS[owner];
};

// Artillery Icon for NodeComponent
const ArtilleryIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-3 h-3 ${className}`}>
    {/* Corrected path data - simple crosshair as placeholder */}
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 2 L10 18 M2 10 L18 10" stroke="currentColor" strokeWidth="2" />
  </svg>
);

export const NodeComponent: React.FC<NodeComponentProps> = ({ node, onNodeInteraction, isSelected, isFogOfWarActive, isVisible }) => {
  const styling = getNodeStyling(node.owner, node.nodeType, isVisible, isFogOfWarActive);
  const sizeClass = (node.nodeType === 'CN' || node.nodeType === 'FORTRESS' || node.nodeType === 'RECON_ARRAY') ? 'w-12 h-12 md:w-16 md:h-16' : 'w-10 h-10 md:w-12 md:h-12';
  
  let unitTextColor = styling.primary;
  if (isVisible && node.owner === AI1_ID) { 
    unitTextColor = 'text-white'; 
  } else if (!isVisible && isFogOfWarActive) {
    unitTextColor = 'text-terminal-gray-dark'; 
  }

  const unitTextSize = (node.nodeType === 'CN' || node.nodeType === 'FORTRESS' || node.nodeType === 'RECON_ARRAY') ? 'text-lg md:text-xl' : 'text-sm md:text-base';
  
  const isDiamond = isVisible && (['URBAN', 'INDUSTRIAL_HUB'].includes(node.nodeType) || (node.id === 'WG' || node.id === 'EG'));
  const isHexagon = isVisible && node.nodeType === 'RECON_ARRAY';

  const borderStyle = isSelected && isVisible ? `ring-4 ring-offset-1 ring-offset-black ${styling.primary.replace('text-','ring-').replace('gray','yellow')}` : `border-2 ${styling.border}`;

  const handleClick = () => {
    onNodeInteraction(node.id); 
  };
  
  const displayFortification = isVisible && node.fortificationLevel && node.fortificationLevel > 0;
  const fortificationIndicatorText = displayFortification ? 
    `L${node.fortificationLevel} (${node.fortificationHP || 0}HP)` : '';

  const fortificationIndicator = displayFortification ? (
    <div 
        className={`absolute -top-1.5 -right-1.5 ${styling.nodeBg} text-xs text-black rounded-full px-1.5 h-5 flex items-center justify-center font-bold border border-white whitespace-nowrap`} 
        title={`Fortification: L${node.fortificationLevel} (${node.fortificationHP}/${node.maxFortificationHP} HP)`}
    >
      {fortificationIndicatorText}
    </div>
  ) : null;

  const displayArtillery = isVisible && node.artilleryGarrison && node.artilleryGarrison > 0;
  const artilleryIndicator = displayArtillery ? (
    <div className={`absolute -bottom-1 -right-1.5 bg-black text-terminal-yellow rounded-full w-5 h-5 flex items-center justify-center border border-terminal-yellow p-0.5`} title={`Artillery: ${node.artilleryGarrison}`}>
       <ArtilleryIcon /> <span className="text-xs ml-0.5">{node.artilleryGarrison}</span>
    </div>
  ) : null;

  const nodeShapeAndContent = (
    <>
      <span className={`${unitTextSize} font-bold ${unitTextColor}`}>
        {isVisible ? node.standardUnits : '?'}
      </span>
      {fortificationIndicator}
      {artilleryIndicator}
    </>
  );
  
  let effectiveFortLevelForTooltip = 0;
  if (isVisible && node.fortificationLevel && node.fortificationLevel > 0 && node.fortificationHP && node.maxFortificationHP && node.maxFortificationHP > 0) {
      effectiveFortLevelForTooltip = Math.ceil((node.fortificationHP / node.maxFortificationHP) * node.fortificationLevel);
      effectiveFortLevelForTooltip = Math.min(effectiveFortLevelForTooltip, node.fortificationLevel); // Cap at actual level
  }

  const titleText = isFogOfWarActive && !isVisible ? 
    `Unknown Node (${node.id})` : 
    `${node.regionName} (${node.id})\nType: ${node.nodeType}\nOwner: ${isVisible ? node.owner : 'Unknown'}\nUnits: ${isVisible ? node.standardUnits : '?'}\nMAT Output: ${isVisible && node.nodeType !== 'RECON_ARRAY' ? node.MAT_output || 0 : 'N/A'}\nQR Output: ${isVisible && node.nodeType !== 'RECON_ARRAY' ? node.qrOutput : 'N/A'}\nFort Level: ${isVisible ? node.fortificationLevel || 0 : '?'}\nFort HP: ${isVisible ? `${node.fortificationHP || 0} / ${node.maxFortificationHP || 0}` : '?'}\nEffective Fort Lvl: ${isVisible ? effectiveFortLevelForTooltip : '?'}\nArtillery: ${isVisible ? node.artilleryGarrison || 0 : '?'}`;


  let shapeSpecificClasses = '';
  if (isDiamond) {
    shapeSpecificClasses = `${styling.nodeBg} transform rotate-45`;
  } else if (isHexagon) {
    shapeSpecificClasses = `${styling.nodeBg}`; 
  } else {
    shapeSpecificClasses = `${styling.nodeBg} rounded-full`;
  }


  return (
    <div
      className={`absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group transition-all duration-150 ${(isSelected && isVisible) ? 'scale-110 z-10' : 'z-0'}`}
      style={{ left: `${node.x}%`, top: `${node.y}%` }}
      onClick={handleClick} 
      title={titleText}
      role="button"
      aria-pressed={isSelected && isVisible}
      aria-label={`Game node ${node.label} (${node.id})`}
    >
      <div 
        className={`${sizeClass} relative flex items-center justify-center ${borderStyle} ${shapeSpecificClasses} ${isFogOfWarActive && !isVisible ? 'bg-opacity-50' : 'bg-opacity-80'} shadow-md`}
        style={isHexagon ? { clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' } : {}}
      >
        {isDiamond ? (
           <div className="transform -rotate-45 w-full h-full flex items-center justify-center">
             {nodeShapeAndContent}
           </div>
        ) : (
           nodeShapeAndContent
        )}
      </div>
      <div className={`mt-1.5 text-center text-xs ${styling.text} ${(isVisible || !isFogOfWarActive) ? 'group-hover:text-terminal-green' : ''} truncate w-28 px-1`}>
        ({node.id}) {isVisible || !isFogOfWarActive ? node.label : 'Hidden'}
      </div>
    </div>
  );
};
