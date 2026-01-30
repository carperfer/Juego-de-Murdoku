
import React from 'react';
import { Search } from 'lucide-react';

interface GameHeaderProps {
  difficulty: string;
  mistakes: number;
  time: string;
}

export const GameHeader: React.FC<GameHeaderProps> = ({ difficulty, mistakes, time }) => {
  return (
    <div className="w-full max-w-4xl mx-auto flex items-center justify-between py-4 px-4 sm:px-0 border-b-2 border-gray-800 dark:border-gray-200 mb-6">
      <div className="flex items-center gap-3">
        <div className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 p-2 rounded-md">
           <Search size={24} strokeWidth={3} />
        </div>
        <div>
            <h1 className="text-2xl font-bold font-serif tracking-tighter uppercase leading-none">Murdoku</h1>
            <span className="text-xs font-mono uppercase text-gray-500 dark:text-gray-400">Case File #8492</span>
        </div>
      </div>
      
      <div className="flex items-center gap-6 font-mono text-sm sm:text-base">
        <div className="flex flex-col items-end">
            <span className="text-gray-500 text-xs uppercase">Difficulty</span>
            <span className="font-bold uppercase">{difficulty}</span>
        </div>
        <div className="flex flex-col items-end">
            <span className="text-gray-500 text-xs uppercase">Mistakes</span>
            <span className={mistakes > 2 ? "text-red-600 font-bold" : "font-bold"}>{mistakes}/3</span>
        </div>
        <div className="hidden sm:flex flex-col items-end w-20">
            <span className="text-gray-500 text-xs uppercase">Time</span>
            <span className="font-bold">{time}</span>
        </div>
      </div>
    </div>
  );
};
