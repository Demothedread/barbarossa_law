/**
 * Compute simple radial positions for nodes.
 * Positions are used for deterministic testing without Three.js context.
 * @param {Array} data - Root level nodes.
 * @returns {Record<string,{x:number,y:number,z:number}>} Map of node id to position.
 */
export function computeNodePositions(data) {
  const positions = {};
  const radiusStep = 400;

  const place = (nodes, depth, parentAngle) => {
    const angleStep = (Math.PI * 2) / Math.max(nodes.length, 1);
    nodes.forEach((n, i) => {
      const angle = parentAngle + i * angleStep;
      const r = (depth + 1) * radiusStep;
      positions[n.id] = {
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
        z: depth * radiusStep,
      };
      if (n.children) place(n.children, depth + 1, angle);
    });
  };

  data.forEach((n, idx) => {
    positions[n.id] = { x: 0, y: 0, z: 0 };
    if (n.children) place(n.children, 0, idx);
  });

  return positions;
}
