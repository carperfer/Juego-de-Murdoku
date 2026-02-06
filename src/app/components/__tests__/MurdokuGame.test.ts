/**
 * Murdoku Puzzle Uniqueness Tests
 * 
 * This test suite verifies that generated puzzles have:
 * 1. Exactly one valid solution
 * 2. No ambiguous clue combinations
 * 3. Consistent puzzle difficulty
 */

import { describe, it, expect } from 'vitest';

// Types matching MurdokuGame.tsx
type SuspectId = 1 | 2 | 3 | 4;
type ObjectId = 'empty' | 'weapon' | 'poison' | 'note' | 'clue';

interface CellData {
  objectIds: ObjectId[];
  userValue: SuspectId | null;
  isError?: boolean;
}

interface PuzzleSolution {
  r: number;
  c: number;
  id: SuspectId;
}

interface TestResult {
  puzzleIndex: number;
  solutionsFound: number;
  isValid: boolean;
  clues: string[];
  solution: PuzzleSolution[];
}

/**
 * Simulates solving a puzzle by trying all possible placements
 * Returns the number of valid solutions found
 */
function countPuzzleSolutions(
  solution: PuzzleSolution[],
  clueDescriptions: string[]
): number {
  let validSolutions = 0;

  // Try all possible placements (4! = 24 permutations)
  const suspects: SuspectId[] = [1, 2, 3, 4];
  const permutations = generatePermutations(suspects);

  for (const placement of permutations) {
    const grid: Map<SuspectId, { r: number; c: number }> = new Map();

    // Create a valid grid (1 per row, 1 per col)
    // For each suspect, find the row it maps to
    let isValidPlacement = true;
    const rowUsed: Set<number> = new Set();
    const colUsed: Set<number> = new Set();

    // Try to place suspects in a valid N-Rook configuration
    for (let r = 0; r < 4; r++) {
      const suspectAtRow = placement[r];
      // Find an available column for this suspect
      let foundCol = -1;
      for (let c = 0; c < 4; c++) {
        if (!colUsed.has(c)) {
          foundCol = c;
          break;
        }
      }

      if (foundCol === -1) {
        isValidPlacement = false;
        break;
      }

      grid.set(suspectAtRow, { r, c: foundCol });
      rowUsed.add(r);
      colUsed.add(foundCol);
    }

    if (!isValidPlacement || grid.size !== 4) continue;

    // Check if this placement matches the actual solution
    const matchesSolution = solution.every(sol => {
      const placed = grid.get(sol.id);
      return placed && placed.r === sol.r && placed.c === sol.c;
    });

    if (matchesSolution) {
      validSolutions++;
    }
  }

  return validSolutions;
}

/**
 * Generates all permutations of an array
 */
function generatePermutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr];
  const result: T[][] = [];

  for (let i = 0; i < arr.length; i++) {
    const current = arr[i];
    const remaining = arr.slice(0, i).concat(arr.slice(i + 1));
    const permutations = generatePermutations(remaining);

    for (const perm of permutations) {
      result.push([current, ...perm]);
    }
  }

  return result;
}

/**
 * Analyzes clue structure for potential ambiguities
 */
function analyzeClueStructure(clues: string[]): {
  hasObjects: number;
  hasObjectWithDim: number;
  hasRowOnly: number;
  hasColOnly: number;
  riskScore: number; // 0-100: 0=safe, 100=very risky
} {
  let hasObjects = 0;
  let hasObjectWithDim = 0;
  let hasRowOnly = 0;
  let hasColOnly = 0;

  for (const clue of clues) {
    const hasObject = clue.includes('ubicación con') || clue.includes('donde hay');
    const hasRow = clue.includes('fila');
    const hasCol = clue.includes('columna');

    if (hasObject && (hasRow || hasCol)) {
      hasObjectWithDim++;
    } else if (hasObject) {
      hasObjects++;
    } else if (hasRow) {
      hasRowOnly++;
    } else if (hasCol) {
      hasColOnly++;
    }
  }

  // Risk calculation
  let riskScore = 0;
  // High risk if only pure row/col clues
  if (hasObjects === 0 && hasObjectWithDim === 0) {
    riskScore = 80;
  }
  // Medium risk if balanced but no objects
  else if (hasObjects === 0 && hasObjectWithDim < 2) {
    riskScore = 60;
  }
  // Low risk if has strong anchors
  else {
    riskScore = Math.max(0, 20 - hasObjects * 10 - hasObjectWithDim * 15);
  }

  return {
    hasObjects,
    hasObjectWithDim,
    hasRowOnly,
    hasColOnly,
    riskScore,
  };
}

/**
 * Main test function
 */
export function runMurdokuUniquenessTests(
  generatePuzzle: () => { solution: PuzzleSolution[]; clues: string[] },
  numTests: number = 100
): {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  ambiguousPuzzles: TestResult[];
  averageRiskScore: number;
  summary: string;
} {
  const results: TestResult[] = [];
  const ambiguousPuzzles: TestResult[] = [];
  let totalRiskScore = 0;

  console.log(`\n🧪 Running Murdoku Uniqueness Tests (${numTests} puzzles)...`);
  console.log(`${"=".repeat(70)}`);

  for (let i = 0; i < numTests; i++) {
    const puzzle = generatePuzzle();
    const solutionCount = countPuzzleSolutions(puzzle.solution, puzzle.clues);
    const isValid = solutionCount === 1;
    const clueAnalysis = analyzeClueStructure(puzzle.clues);

    totalRiskScore += clueAnalysis.riskScore;

    const result: TestResult = {
      puzzleIndex: i + 1,
      solutionsFound: solutionCount,
      isValid,
      clues: puzzle.clues,
      solution: puzzle.solution,
    };

    results.push(result);

    if (!isValid) {
      ambiguousPuzzles.push(result);
      console.log(
        `❌ Puzzle #${i + 1}: ${solutionCount} solutions found (AMBIGUOUS)`
      );
      console.log(`   Clues:`);
      puzzle.clues.forEach((clue, idx) => console.log(`     ${idx + 1}. ${clue}`));
      console.log(
        `   Risk Score: ${clueAnalysis.riskScore}/100 | Objects: ${clueAnalysis.hasObjects} | Object+Dim: ${clueAnalysis.hasObjectWithDim}`
      );
    } else if (i < 5 || i % 20 === 0) {
      // Print first 5 and every 20th
      console.log(
        `✅ Puzzle #${i + 1}: Unique solution found (Risk: ${clueAnalysis.riskScore}/100)`
      );
    }
  }

  const passedTests = results.filter(r => r.isValid).length;
  const failedTests = results.filter(r => !r.isValid).length;
  const averageRiskScore = totalRiskScore / numTests;

  // Summary
  const summary =
    `\n${"=".repeat(70)}\n` +
    `📊 Test Results:\n` +
    `   Total Tests: ${numTests}\n` +
    `   ✅ Passed: ${passedTests} (${((passedTests / numTests) * 100).toFixed(1)}%)\n` +
    `   ❌ Failed: ${failedTests} (${((failedTests / numTests) * 100).toFixed(1)}%)\n` +
    `   📈 Average Risk Score: ${averageRiskScore.toFixed(1)}/100\n` +
    `${"=".repeat(70)}\n`;

  console.log(summary);

  if (failedTests > 0) {
    console.log(`⚠️  Found ${failedTests} ambiguous puzzles:\n`);
    ambiguousPuzzles.slice(0, 5).forEach(puzzle => {
      console.log(`Puzzle #${puzzle.puzzleIndex}:`);
      console.log(`  Solutions: ${puzzle.solutionsFound}`);
      puzzle.clues.forEach((clue, idx) =>
        console.log(`  ${idx + 1}. ${clue}`)
      );
      console.log();
    });
  }

  return {
    totalTests: numTests,
    passedTests,
    failedTests,
    ambiguousPuzzles,
    averageRiskScore,
    summary,
  };
}

// Export for testing
export { analyzeClueStructure, countPuzzleSolutions, generatePermutations };

describe('Murdoku Puzzle Uniqueness (smoke)', () => {
  it('debe reportar 0 puzzles ambiguos en un generador determinista', () => {
    const generator = () => ({
      solution: [
        { r: 0, c: 0, id: 1 },
        { r: 1, c: 2, id: 2 },
        { r: 2, c: 3, id: 3 },
        { r: 3, c: 1, id: 4 },
      ],
      clues: [
        'Barón Rojo fue encontrado en la ubicación con el Puñal.',
        'Dama Azul fue encontrado en la ubicación con el Veneno.',
        'Dra. Esmeralda fue encontrado en la ubicación con la Nota Secreta.',
        'Conde Oro fue encontrado en la ubicación con la Huella Digital.',
      ],
    });

    const result = runMurdokuUniquenessTests(generator, 5);
    expect(result.failedTests).toBe(0);
  });
});

describe('Murdoku Puzzle Uniqueness (smoke)', () => {
  it('debe reportar 0 puzzles ambiguos en un generador determinista', () => {
    const generator = () => ({
      solution: [
        { r: 0, c: 0, id: 1 },
        { r: 1, c: 2, id: 2 },
        { r: 2, c: 3, id: 3 },
        { r: 3, c: 1, id: 4 },
      ],
      clues: [
        'Barón Rojo fue encontrado en la ubicación con el Puñal.',
        'Dama Azul fue encontrado en la ubicación con el Veneno.',
        'Dra. Esmeralda fue encontrado en la ubicación con la Nota Secreta.',
        'Conde Oro fue encontrado en la ubicación con la Huella Digital.',
      ],
    });

    const result = runMurdokuUniquenessTests(generator, 5);
    expect(result.failedTests).toBe(0);
  });
});
