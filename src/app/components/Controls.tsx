
import React from 'react';
import { Eraser, Pencil, RotateCcw, Lightbulb } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx } from 'clsx';

interface ControlsProps {
  onNumberClick: (num: number) => void;
  onErase: () => void;
  onUndo: () => void;
  onHint: () => void;
  noteMode: boolean;
  setNoteMode: (mode: boolean) => void;
}

export const Controls: React.FC<ControlsProps> = ({
  onNumberClick,
  onErase,
  onUndo,
  onHint,
  noteMode,
  setNoteMode,
}) => {
  return (
    <div className="flex flex-col gap-4 w-full max-w-lg mx-auto mt-6">
      {/* Tools Row */}
      <div className="flex justify-between px-4">
        <button
          onClick={onUndo}
          className="flex flex-col items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <div className="p-3 bg-gray-200 dark:bg-gray-800 rounded-full">
            <RotateCcw size={20} />
          </div>
          <span className="text-xs font-mono">UNDO</span>
        </button>

        <button
          onClick={() => setNoteMode(!noteMode)}
          className={clsx(
            "flex flex-col items-center gap-1 transition-colors relative",
            noteMode ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          )}
        >
          <div className={clsx("p-3 rounded-full transition-colors", noteMode ? "bg-blue-100 dark:bg-blue-900" : "bg-gray-200 dark:bg-gray-800")}>
            <Pencil size={20} />
            {noteMode && (
              <span className="absolute top-0 right-2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-gray-900" />
            )}
          </div>
          <span className="text-xs font-mono uppercase font-bold">{noteMode ? "ON" : "OFF"}</span>
        </button>

        <button
          onClick={onErase}
          className="flex flex-col items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          <div className="p-3 bg-gray-200 dark:bg-gray-800 rounded-full">
            <Eraser size={20} />
          </div>
          <span className="text-xs font-mono">ERASE</span>
        </button>

        <button
          onClick={onHint}
          className="flex flex-col items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors"
        >
          <div className="p-3 bg-gray-200 dark:bg-gray-800 rounded-full">
            <Lightbulb size={20} />
          </div>
          <span className="text-xs font-mono">HINT</span>
        </button>
      </div>

      {/* Numpad */}
      <div className="grid grid-cols-9 gap-1 sm:gap-2 px-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <motion.button
            key={num}
            whileTap={{ scale: 0.9 }}
            onClick={() => onNumberClick(num)}
            className="aspect-square flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-xl sm:text-2xl font-serif text-gray-900 dark:text-gray-100 shadow-sm border-b-4 border-gray-300 dark:border-gray-700 active:border-b-0 active:translate-y-1 transition-all"
          >
            {num}
          </motion.button>
        ))}
      </div>
    </div>
  );
};
