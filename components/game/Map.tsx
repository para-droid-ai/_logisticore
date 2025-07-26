import React, { useCallback } from 'react';
import { NodeData, Faction, PlayerId, GameState } from '../../types';
import { NodeComponent } from './NodeComponent';
import { FACTION_COLORS, NEUTRAL_STRONGHOLD_COLORS } from '../../constants';

interface MapViewport {
  scale: number;
  translateX: number;
  translateY: number;
}

interface MapProps {
  gameState: GameState;
  selectedNodeId?: string | null;
  onNodeClick: (nodeId: string) => void;
  mapViewport: MapViewport;
  setMapViewport: React.Dispatch<React.SetStateAction<MapViewport>>;
  mapContainerRef: React.RefObject<HTMLDivElement>;
  onMouseDown: (event: React.MouseEvent) => void;
  onMouseMove: (event: React.MouseEvent) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  onWheel: (event: React.WheelEvent) => void;
}

export const Map: React.FC<MapProps> = ({
    gameState,
    selectedNodeId,
    onNodeClick,
    mapViewport,
    setMapViewport,
    mapContainerRef,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave,
    onWheel,
}) => {
  const { mapNodes, factions, isFogOfWarActive } = gameState;

  const isNodeVisible = useCallback((nodeId: string) => {
    // For the UI map, all nodes are always visible.
    // The actual fog of war logic is handled in the backend and intel snapshots.
    return true;
  }, []);

  const nodes = Object.values(mapNodes);

  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    onWheel(event);
  };

  return (
    <div
        className={`w-full h-full ${mapViewport.isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{
            transform: `translate(${mapViewport.translateX}px, ${mapViewport.translateY}px) scale(${mapViewport.scale})`,
            transformOrigin: 'center center',
            transition: mapViewport.isPanning ? 'none' : 'transform 0.2s ease-out',
            overflow: 'hidden'
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onWheel={handleWheel}
    >
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {/* Defs for arrowheads are not currently used but kept for potential future use */}
            <defs>
            <marker id="arrowhead-axiom" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                <polygon points="0 0, 6 2, 0 4" fill={FACTION_COLORS.AXIOM.actualHex || '#00FFFF'} />
            </marker>
            <marker id="arrowhead-gemq" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                <polygon points="0 0, 6 2, 0 4" fill={FACTION_COLORS['GEM-Q'].actualHex || '#FF003F'} />
            </marker>
            <marker id="arrowhead-neutral" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                <polygon points="0 0, 6 2, 0 4" fill={FACTION_COLORS.NEUTRAL.actualHex || '#808080'} />
            </marker>
            </defs>
            {nodes.map(node => {
                // Since isNodeVisible is () => true for UI, nodeIsVisible and targetIsVisible will be true.
                // The FoW checks on visibility for drawing lines are effectively bypassed for the UI map.
                return node.connections.map(targetId => {
                    const targetNode = mapNodes[targetId];
                    if (!targetNode || node.id > targetId) return null; // Draw each line once

                    const x1 = node.x;
                    const y1 = node.y;
                    const x2 = targetNode.x;
                    const y2 = targetNode.y;

                    let lineColor = "rgba(128, 128, 128, 0.3)";
                    let lineWidth = "1.5";
                    let lineOpacity = "0.6";

                    const isConnectedToSelectedNode = selectedNodeId && (node.id === selectedNodeId || targetNode.id === selectedNodeId);

                    if (isConnectedToSelectedNode) {
                        const yellowHex = NEUTRAL_STRONGHOLD_COLORS.actualHex || '#FFFF00';
                        const r = parseInt(yellowHex.slice(1, 3), 16);
                        const g = parseInt(yellowHex.slice(3, 5), 16);
                        const b = parseInt(yellowHex.slice(5, 7), 16);
                        lineColor = `rgba(${r}, ${g}, ${b}, 0.8)`;
                        lineWidth = "2.5";
                        lineOpacity = "0.9";
                    } else {
                        // Default line coloring (FoW state doesn't change UI line colors directly, only AI perception)
                        if (node.owner !== 'NEUTRAL' && node.owner === targetNode.owner) {
                            const ownerColorHex = FACTION_COLORS[node.owner]?.actualHex;
                            if (ownerColorHex) {
                                const r = parseInt(ownerColorHex.slice(1, 3), 16);
                                const g = parseInt(ownerColorHex.slice(3, 5), 16);
                                const b = parseInt(ownerColorHex.slice(5, 7), 16);
                                lineColor = `rgba(${r}, ${g}, ${b}, 0.4)`;
                            }
                        }
                        // Default gray for neutral-neutral or mixed ownership lines
                    }

                    return (
                    <line
                        key={`${node.id}-${targetId}`}
                        x1={`${x1}%`}
                        y1={`${y1}%`}
                        x2={`${x2}%`}
                        y2={`${y2}%`}
                        stroke={lineColor}
                        strokeWidth={lineWidth}
                        opacity={lineOpacity}
                    />
                    );
                })
            }
            )}
        </svg>
        {nodes.map(node => (
            <NodeComponent
                key={node.id}
                node={node}
                onNodeInteraction={onNodeClick}
                isSelected={selectedNodeId === node.id}
                isFogOfWarActive={isFogOfWarActive}
                isVisible={isNodeVisible(node.id)}
            />
        ))}
    </div>
  );
};