import { computeNodePositions } from '../src/js/lq-mindmap-utils.js';

test('computeNodePositions assigns positions', () => {
  const data = [{ id: 'root', children: [{ id: 'child' }] }];
  const pos = computeNodePositions(data);
  expect(pos.root).toEqual({ x: 0, y: 0, z: 0 });
  expect(pos.child).toBeDefined();
});
