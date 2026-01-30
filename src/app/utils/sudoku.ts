
// Sudoku generation logic

export type CellValuevx = number | null;
export type Board = CellValuevx[][];

const BLANK: CellValuevx = null;

export const isValid = (board: Board, row: number, col: number, num: number): boolean => {
  // Check row
  for (let x = 0; x < 9; x++) {
    if (board[row][x] === num) return false;
  }

  // Check column
  for (let x = 0; x < 9; x++) {
    if (board[x][col] === num) return false;
  }

  // Check 3x3 box
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[startRow + i][startCol + j] === num) return false;
    }
  }

  return true;
};

const solveBoard = (board: Board): boolean => {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === BLANK) {
        // Try numbers 1-9
        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
        for (const num of nums) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num;
            if (solveBoard(board)) return true;
            board[row][col] = BLANK;
          }
        }
        return false;
      }
    }
  }
  return true;
};

export const generateSolvedBoard = (): Board => {
  const board: Board = Array.from({ length: 9 }, () => Array(9).fill(BLANK));
  solveBoard(board);
  return board;
};

export const generatePuzzle = (difficulty: 'easy' | 'medium' | 'hard' = 'medium'): { initial: Board, solved: Board } => {
  const solved = generateSolvedBoard();
  // Deep copy for the puzzle
  const initial = solved.map(row => [...row]);
  
  let attempts = difficulty === 'easy' ? 30 : difficulty === 'medium' ? 45 : 55;
  
  while (attempts > 0) {
    let row = Math.floor(Math.random() * 9);
    let col = Math.floor(Math.random() * 9);
    while (initial[row][col] === BLANK) {
      row = Math.floor(Math.random() * 9);
      col = Math.floor(Math.random() * 9);
    }
    initial[row][col] = BLANK;
    attempts--;
  }

  return { initial, solved };
};
