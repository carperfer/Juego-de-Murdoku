
import React from 'react';
import { motion } from 'motion/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SudokuCellProps {
  row: number;
  col: number;
  value: number | null;
  initial: boolean;
  isSelected: boolean;
  isRelated: boolean; // Same row/col/box
  isSameValue: boolean; // Same value as selected
  isError: boolean;
  notes: number[];
  onClick: (row: number, col: number) => void;
}

export const SudokuCell: React.FC<SudokuCellProps> = ({
  row,
  col,
  value,
  initial,
  isSelected,
  isRelated,
  isSameValue,
  isError,
  notes,
  onClick,
}) => {
  const borderRight = (col + 1) % 3 === 0 && col !== 8;
  const borderBottom = (row + 1) % 3 === 0 && row !== 8;

  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      onClick={() => onClick(row, col)}
      className={twMerge(
        "relative flex items-center justify-center w-full h-full text-2xl cursor-pointer select-none transition-colors duration-75",
        "border-r border-b border-gray-300 dark:border-gray-700",
        // Thicker borders for 3x3 grid
        borderRight && "border-r-2 border-r-gray-800 dark:border-r-gray-300",
        borderBottom && "border-b-2 border-b-gray-800 dark:border-b-gray-300",
        // Background states
        isSelected && "bg-blue-500 text-white!",
        !isSelected && isSameValue && value !== null && "bg-blue-200 dark:bg-blue-900",
        !isSelected && !isSameValue && isRelated && "bg-gray-100 dark:bg-gray-800",
        !isSelected && !isSameValue && !isRelated && "bg-white dark:bg-[#1a1a1a]",
        // Error state overrides
        isError && !isSelected && "bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-100",
        isError && isSelected && "bg-red-500",
        // Text styling
        initial ? "font-bold text-gray-900 dark:text-gray-100 font-mono" : "text-blue-600 dark:text-blue-400 font-handwriting"
      )}
    >
      {value !== null ? (
        <span className={clsx(
           "text-3xl sm:text-2xl md:text-3xl lg:text-4xl leading-none",
           initial ? "font-serif" : "font-sans" 
        )}>
          {value}
        </span>
      ) : (
        <div className="grid grid-cols-3 gap-0.5 p-0.5 w-full h-full pointer-events-none">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <div key={num} className="flex items-center justify-center">
              {notes.includes(num) && (
                <span className="text-[8px] sm:text-[10px] leading-none text-gray-500 dark:text-gray-400 font-mono">
                  {num}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
