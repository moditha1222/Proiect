import { describe, it, expect } from 'vitest';
import { generateDeterministicWorkers } from '../services/seedService';
import { CityGraph } from '../graph/cityGraph';

describe('Reproducibility Tests', () => {
  it('same seed generates identical workers dataset', () => {
    const run1 = generateDeterministicWorkers(50, 4242, 16.3067, 80.4365);
    const run2 = generateDeterministicWorkers(50, 4242, 16.3067, 80.4365);

    expect(run1).toEqual(run2);
  });

  it('different seed generates different workers dataset', () => {
    const run1 = generateDeterministicWorkers(50, 1111, 16.3067, 80.4365);
    const run2 = generateDeterministicWorkers(50, 2222, 16.3067, 80.4365);

    expect(run1[0].name).not.toEqual(run2[0].name);
  });

  it('same seed generates identical city graph', () => {
    const g1 = new CityGraph({ rows: 10, cols: 10, seed: 99 });
    const g2 = new CityGraph({ rows: 10, cols: 10, seed: 99 });

    expect(g1.nodes.length).toBe(g2.nodes.length);
    expect(g1.nodes[5].lat).toBe(g2.nodes[5].lat);
    expect(g1.adjacency.get(5)).toEqual(g2.adjacency.get(5));
  });
});

