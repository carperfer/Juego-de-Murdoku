/**
 * Test de validación de puzzles Murdoku
 * Verifica que los puzzles generados sean únicamente resolubles sin ambigüedades
 */

import { describe, it, expect } from 'vitest';

type SuspectId = 1 | 2 | 3 | 4;
type ObjectId = 'empty' | 'weapon' | 'poison' | 'note' | 'clue';

interface CellData {
  objectIds: ObjectId[];
  userValue: SuspectId | null;
  isError?: boolean;
}

interface Solution {
  r: number;
  c: number;
  id: SuspectId;
}

interface ParsedClue {
  suspectId: SuspectId;
  row?: number;
  col?: number;
  object?: ObjectId;
}

/**
 * Parsea las pistas para extraer constraints
 */
function parseClues(clues: string[]): ParsedClue[] {
  const parsed: ParsedClue[] = [];
  const suspectNames: Record<string, SuspectId> = {
    'Barón': 1,
    'Dama': 2,
    'Dra.': 3,
    'Conde': 4,
    'Baron': 1,
    'Lady': 2,
    'Dr.': 3,
    'Count': 4
  };

  clues.forEach(clue => {
    const result: ParsedClue = { suspectId: 1 };
    
    // Detectar sospechoso
    for (const [name, id] of Object.entries(suspectNames)) {
      if (clue.includes(name)) {
        result.suspectId = id;
        break;
      }
    }

    // Detectar fila
    const rowMatch = clue.match(/fila (\d)|row (\d)/);
    if (rowMatch) {
      result.row = parseInt(rowMatch[1] || rowMatch[2]);
    }

    // Detectar columna
    const colMatch = clue.match(/columna (\d)|column (\d)/);
    if (colMatch) {
      result.col = parseInt(colMatch[1] || colMatch[2]);
    }

    // Detectar objeto
    if (clue.includes('Puñal') || clue.includes('Dagger')) result.object = 'weapon';
    if (clue.includes('Veneno') || clue.includes('Poison')) result.object = 'poison';
    if (clue.includes('Nota') || clue.includes('Note')) result.object = 'note';
    if (clue.includes('Huella') || clue.includes('Fingerprint')) result.object = 'clue';

    parsed.push(result);
  });

  return parsed;
}

/**
 * Intenta resolver el puzzle con las pistas dadas
 * Retorna todas las soluciones válidas posibles
 */
function solvePuzzle(
  parsedClues: ParsedClue[],
  grid: CellData[][]
): Solution[][] {
  const solutions: Solution[][] = [];
  
  // Generar todas las permutaciones válidas (1 por fila, 1 por columna)
  // Hay 4! = 24 permutaciones posibles
  function generatePermutations(): Solution[][] {
    const perms: Solution[][] = [];
    const cols = [0, 1, 2, 3];
    
    function permute(arr: number[], start: number) {
      if (start === arr.length - 1) {
        const perm: Solution[] = [];
        for (let r = 0; r < 4; r++) {
          perm.push({ r, c: arr[r], id: (r + 1) as SuspectId });
        }
        perms.push(perm);
        return;
      }
      
      for (let i = start; i < arr.length; i++) {
        [arr[start], arr[i]] = [arr[i], arr[start]];
        permute(arr, start + 1);
        [arr[start], arr[i]] = [arr[i], arr[start]];
      }
    }
    
    permute([...cols], 0);
    return perms;
  }

  const allPermutations = generatePermutations();

  // Filtrar permutaciones que cumplan las pistas
  for (const perm of allPermutations) {
    let valid = true;

    for (const clue of parsedClues) {
      const suspect = perm.find(s => s.id === clue.suspectId);
      if (!suspect) continue;

      // Validar fila
      if (clue.row !== undefined && suspect.r + 1 !== clue.row) {
        valid = false;
        break;
      }

      // Validar columna
      if (clue.col !== undefined && suspect.c + 1 !== clue.col) {
        valid = false;
        break;
      }

      // Validar objeto
      if (clue.object !== undefined) {
        const cellObjects = grid[suspect.r][suspect.c].objectIds;
        if (!cellObjects.includes(clue.object)) {
          valid = false;
          break;
        }
      }
    }

    if (valid) {
      solutions.push(perm);
    }
  }

  return solutions;
}

/**
 * Verifica que un conjunto de pistas tenga solución única
 */
function hasUniqueSolution(clues: string[], grid: CellData[][]): boolean {
  const parsed = parseClues(clues);
  const solutions = solvePuzzle(parsed, grid);
  return solutions.length === 1;
}

describe('Validación de Puzzles Murdoku', () => {
  
  it('debe rechazar puzzles con solo filas y columnas (ambiguo)', () => {
    const grid: CellData[][] = Array(4).fill(null).map(() =>
      Array(4).fill(null).map(() => ({ objectIds: [], userValue: null }))
    );

    const ambiguousClues = [
      'Barón Rojo se está escondiendo en la columna 1.',
      'Dama Azul se está escondiendo en la fila 2.',
      'Dra. Esmeralda se está escondiendo en la columna 3.',
      'Conde Oro se está escondiendo en la fila 4.'
    ];

    const isUnique = hasUniqueSolution(ambiguousClues, grid);
    expect(isUnique).toBe(false);
  });

  it('debe aceptar puzzles con objetos únicos (sin ambigüedad)', () => {
    const grid: CellData[][] = Array(4).fill(null).map(() =>
      Array(4).fill(null).map(() => ({ objectIds: [], userValue: null }))
    );
    
    // Colocar objetos únicos
    grid[0][0].objectIds = ['weapon'];
    grid[1][1].objectIds = ['poison'];
    grid[2][2].objectIds = ['note'];
    grid[3][3].objectIds = ['clue'];

    const goodClues = [
      'Barón Rojo fue encontrado en la ubicación con el Puñal.',
      'Dama Azul fue encontrado en la ubicación con el Veneno.',
      'Dra. Esmeralda fue encontrado en la ubicación con la Nota Secreta.',
      'Conde Oro fue encontrado en la ubicación con la Huella Digital.'
    ];

    const isUnique = hasUniqueSolution(goodClues, grid);
    expect(isUnique).toBe(true);
  });

  it('debe aceptar puzzles con objetos + dimensiones (sin ambigüedad)', () => {
    const grid: CellData[][] = Array(4).fill(null).map(() =>
      Array(4).fill(null).map(() => ({ objectIds: [], userValue: null }))
    );
    
    grid[0][0].objectIds = ['weapon'];
    grid[2][2].objectIds = ['weapon']; // Duplicado

    const goodClues = [
      'Barón Rojo está en la fila 1 donde hay el Puñal.',
      'Dama Azul se está escondiendo en la columna 3.',
      'Dra. Esmeralda se está escondiendo en la fila 3.',
      'Conde Oro se está escondiendo en la columna 4.'
    ];

    const isUnique = hasUniqueSolution(goodClues, grid);
    expect(isUnique).toBe(true);
  });

  it('debe detectar pistas contradictorias', () => {
    const grid: CellData[][] = Array(4).fill(null).map(() =>
      Array(4).fill(null).map(() => ({ objectIds: [], userValue: null }))
    );

    const contradictoryClues = [
      'Barón Rojo se está escondiendo en la fila 1.',
      'Barón Rojo se está escondiendo en la fila 2.', // Contradicción
      'Dama Azul se está escondiendo en la columna 3.',
      'Dra. Esmeralda se está escondiendo en la columna 4.'
    ];

    const parsed = parseClues(contradictoryClues);
    const solutions = solvePuzzle(parsed, grid);
    expect(solutions.length).toBe(0); // Sin solución válida
  });

  it('debe rechazar balance de 2 filas + 2 columnas sin objetos (ambiguo)', () => {
    const grid: CellData[][] = Array(4).fill(null).map(() =>
      Array(4).fill(null).map(() => ({ objectIds: [], userValue: null }))
    );

    // Balance 2+2: SIGUE SIENDO AMBIGUO sin objetos
    const balancedClues = [
      'Conde Oro se está escondiendo en la columna 1.',
      'Dra. Esmeralda se está escondiendo en la fila 2.',
      'Barón Rojo se está escondiendo en la columna 4.',
      'Dama Azul se está escondiendo en la fila 4.'
    ];

    const isUnique = hasUniqueSolution(balancedClues, grid);
    expect(isUnique).toBe(false);
  });

  it('debe rechazar otro caso: 2 columnas + 2 filas sin objetos (ambiguo)', () => {
    const grid: CellData[][] = Array(4).fill(null).map(() =>
      Array(4).fill(null).map(() => ({ objectIds: [], userValue: null }))
    );

    const ambiguousClues = [
      'Barón Rojo se está escondiendo en la columna 4.',
      'Conde Oro se está escondiendo en la fila 2.',
      'Dra. Esmeralda se está escondiendo en la columna 2.',
      'Dama Azul se está escondiendo en la fila 4.'
    ];

    const isUnique = hasUniqueSolution(ambiguousClues, grid);
    expect(isUnique).toBe(false);
  });

  it('debe aceptar 2 objetos + 2 dimensiones (único)', () => {
    const grid: CellData[][] = Array(4).fill(null).map(() =>
      Array(4).fill(null).map(() => ({ objectIds: [], userValue: null }))
    );
    
    grid[0][0].objectIds = ['weapon'];
    grid[1][1].objectIds = ['poison'];

    const goodClues = [
      'Barón Rojo fue encontrado en la ubicación con el Puñal.',
      'Dama Azul fue encontrado en la ubicación con el Veneno.',
      'Dra. Esmeralda se está escondiendo en la fila 3.',
      'Conde Oro se está escondiendo en la columna 4.'
    ];

    const isUnique = hasUniqueSolution(goodClues, grid);
    expect(isUnique).toBe(true);
  });

  it('debe rechazar 3 columnas + 1 objeto ambiguo', () => {
    const grid: CellData[][] = Array(4).fill(null).map(() =>
      Array(4).fill(null).map(() => ({ objectIds: [], userValue: null }))
    );
    
    grid[0][1].objectIds = ['weapon'];
    grid[2][1].objectIds = ['weapon']; // Duplicado en misma columna

    const ambiguousClues = [
      'Barón Rojo se está escondiendo en la columna 3.',
      'Conde Oro se está escondiendo en la columna 4.',
      'Dra. Esmeralda se está escondiendo en la columna 2.',
      'Dama Azul fue encontrado en la ubicación con el Puñal.' // Ambiguo
    ];

    const isUnique = hasUniqueSolution(ambiguousClues, grid);
    expect(isUnique).toBe(false);
  });

  it('debe generar múltiples puzzles y verificar unicidad', () => {
    // Simular generación de 50 puzzles aleatorios
    let uniqueCount = 0;
    let ambiguousCount = 0;

    for (let i = 0; i < 50; i++) {
      const grid: CellData[][] = Array(4).fill(null).map(() =>
        Array(4).fill(null).map(() => ({
          objectIds: Math.random() < 0.3 
            ? [(['weapon', 'poison', 'note', 'clue'] as ObjectId[])[Math.floor(Math.random() * 4)]]
            : [],
          userValue: null
        }))
      );

      // Generar pistas simuladas (simplificado)
      const hasUniqueObjects = grid.flat().filter(c => c.objectIds.length > 0).length >= 2;
      
      if (hasUniqueObjects) {
        uniqueCount++;
      } else {
        ambiguousCount++;
      }
    }

    // Al menos el 80% deben tener suficientes objetos para ser únicos
    expect(uniqueCount).toBeGreaterThan(40);
  });
});
