import { PlayerId, NodeData, GameState, Faction } from '../types';

export const isNodeConnectedToFactionCN = (
    startNodeId: string,
    factionId: PlayerId,
    mapNodes: Record<string, NodeData>,
    factions: Record<PlayerId, Faction>
): boolean => {
    const startNode = mapNodes[startNodeId];
    if (!startNode || startNode.owner !== factionId) return false;
    const factionCNs = Object.values(mapNodes).filter(n => n.owner === factionId && n.isCN);
    if(factionCNs.length === 0) return false;

    const queue: string[] = [startNodeId];
    const visited: Set<string> = new Set([startNodeId]);
    while (queue.length > 0) {
        const currentNodeId = queue.shift()!;
        const currentNode = mapNodes[currentNodeId];
        if (currentNode.isCN && currentNode.owner === factionId) return true;
        currentNode.connections.forEach(neighborId => {
            const neighborNode = mapNodes[neighborId];
            if (neighborNode && neighborNode.owner === factionId && !visited.has(neighborId)) {
                visited.add(neighborId);
                queue.push(neighborId);
            }
        });
    }
    return false; 
};


export const isNodeVisibleForAI = (nodeId: string, viewingFactionId: PlayerId, currentGameState: GameState): boolean => {
    if (!currentGameState.isFogOfWarActive) return true;
    const node = currentGameState.mapNodes[nodeId];
    if (!node) return false;
    if (currentGameState.factions[viewingFactionId]?.hasActiveReconPulseThisTurn) return true;
    if (node.owner === viewingFactionId) return true;
    for (const ownedNodeId in currentGameState.mapNodes) {
        const ownedNode = currentGameState.mapNodes[ownedNodeId];
        if (ownedNode.owner === viewingFactionId) {
            if (ownedNode.connections.includes(nodeId)) return true;
        }
    }
    return false;
};