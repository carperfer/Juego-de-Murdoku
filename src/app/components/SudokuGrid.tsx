
import React from 'react';
import { SudokuCell } from './SudokuCell';
import { Board } from '../utils/sudoku';

interface SudokuGridProps {
  board: Board;
  initialBoard: Board;
  selectedCell: { row: number; col: number } | null;
  errors: boolean[][];
  notes: Record<string, number[]>;
  onCellClick: (row: number, col: number) => void;
}

export const SudokuGrid: React.FC<SudokuGridProps> = ({
  board,
  initialBoard,
  selectedCell,
  errors,
  notes,
  onCellClick,
}) => {
  return (
    <div className="select-none p-1 bg-gray-800 dark:bg-gray-300 shadow-2xl rounded-sm">
      <div className="grid grid-cols-9 grid-rows-9 gap-0 border-2 border-gray-800 dark:border-gray-300 bg-gray-800 dark:bg-gray-300 w-full max-w-lg aspect-square mx-auto">
        {board.map((row, rowIndex) =>
          row.map((value, colIndex) => {
            const isInitial = initialBoard[rowIndex][colIndex] !== null;
            const cellKey = `${rowIndex}-${colIndex}`;
            
            const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
            
            // Check relationship (same row, col, or box)
            let isRelated = false;
            if (selectedCell) {
              const sameRow = selectedCell.row === rowIndex;
              const sameCol = selectedCell.col === colIndex;
              const sameBox = 
                Math.floor(selectedCell.row / 3) === Math.floor(rowIndex / 3) &&
                Math.floor(selectedCell.col / 3) === Math.floor(colIndex / 3);
              isRelated = sameRow || sameCol || sameBox;
            }

            const isSameValue = 
              selectedCell && 
              board[selectedCell.row][selectedCell.col] !== null && 
              board[selectedCell.row][selectedCell.col] === value;

            return (
              <SudokuCell
                key={cellKey}
                row={rowIndex}
                col={colIndex}
                value={value}
                initial={isInitial}
                isSelected={isSelected}
                isRelated={isRelated}
                isSameValue={!!isSameValue}
                isError={errors[rowIndex][colIndex]}
                notes={notes[cellKey] || []}
                onClick={onCellClick}
              />
            );
          })
        )}
      </div>
    </div>
  );
};
