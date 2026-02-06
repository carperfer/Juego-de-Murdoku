/**
 * Tests de heurísticas de pistas y validez de soluciones.
 */

import { describe, test, expect } from 'vitest';

type Solution = Array<{ r: number; c: number; id: number }>;

function analyzeClues(clues: string[]): {
  strongClues: number;
  weakClues: number;
  riskLevel: 'SAFE' | 'MEDIUM' | 'HIGH';
} {
  let strongClues = 0;
  let weakClues = 0;

  for (const clue of clues) {
    const hasObject =
      clue.includes('ubicación con') ||
      clue.includes('donde hay') ||
      clue.includes('location with') ||
      clue.includes('where there is');
    const hasDimension =
      clue.includes('fila') ||
      clue.includes('columna') ||
      clue.includes('row') ||
      clue.includes('column');

    if (hasObject && hasDimension) {
      strongClues++;
    } else if (hasObject) {
      strongClues++;
    } else if (hasDimension) {
      weakClues++;
    }
  }

  let riskLevel: 'SAFE' | 'MEDIUM' | 'HIGH' = 'SAFE';
  if (strongClues === 0 && weakClues === 4) {
    riskLevel = 'HIGH';
  } else if (strongClues < 2) {
    riskLevel = 'MEDIUM';
  }

  return { strongClues, weakClues, riskLevel };
}

function isValidSolution(solution: Solution): boolean {
  if (solution.length !== 4) return false;

  const rows = new Set<number>();
  const cols = new Set<number>();
  const ids = new Set<number>();

  for (const { r, c, id } of solution) {
    if (r < 0 || r > 3 || c < 0 || c > 3) return false;
    rows.add(r);
    cols.add(c);
    ids.add(id);
  }

  return rows.size === 4 && cols.size === 4 && ids.size === 4;
}

function generateRandomSolution(): Solution {
  const cols = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
  const suspects = [1, 2, 3, 4].sort(() => Math.random() - 0.5);

  return [
    { r: 0, c: cols[0], id: suspects[0] },
    { r: 1, c: cols[1], id: suspects[1] },
    { r: 2, c: cols[2], id: suspects[2] },
    { r: 3, c: cols[3], id: suspects[3] },
  ];
}

describe('Murdoku Puzzle Generator', () => {
  test('las soluciones aleatorias deben ser válidas', () => {
    const solution = generateRandomSolution();
    expect(isValidSolution(solution)).toBe(true);
  });

  test('las pistas solo de filas/columnas son de alto riesgo', () => {
    const highRiskClues = [
      'Baron Rojo se está escondiendo en la columna 2.',
      'Conde Oro se está escondiendo en la fila 2.',
      'Dra. Esmeralda se está escondiendo en la columna 3.',
      'Dama Azul se está escondiendo en la fila 4.',
    ];

    const analysis = analyzeClues(highRiskClues);
    expect(analysis.strongClues).toBe(0);
    expect(analysis.weakClues).toBe(4);
    expect(analysis.riskLevel).toBe('HIGH');
  });

  test('las pistas con objeto + dimensión son seguras', () => {
    const safeClues = [
      'Baron Scarlet was found at the location with a Dagger.',
      'Lady Azure is in row 2 where there is a Secret Note.',
      'Dr. Emerald is in column 3 where there is a Fingerprint.',
      'Count Gold is hiding in row 4.',
    ];

    const analysis = analyzeClues(safeClues);
    expect(analysis.strongClues).toBeGreaterThanOrEqual(2);
    expect(['SAFE', 'MEDIUM']).toContain(analysis.riskLevel);
  });
});
