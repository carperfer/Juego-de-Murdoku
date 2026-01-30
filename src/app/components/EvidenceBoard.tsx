
import React from 'react';
import { User, Skull, Briefcase, Syringe, Gavel, ChefHat, Spade, Gem, Search } from 'lucide-react';
import { clsx } from 'clsx';

const SUSPECTS = [
  { num: 1, role: "The Butler", item: "Candlestick", icon: User },
  { num: 2, role: "The Duchess", item: "Diamond", icon: Gem },
  { num: 3, role: "The Doctor", item: "Poison", icon: Syringe },
  { num: 4, role: "The General", item: "Revolver", icon: Skull },
  { num: 5, role: "The Lawyer", item: "Briefcase", icon: Briefcase },
  { num: 6, role: "The Chef", item: "Knife", icon: ChefHat },
  { num: 7, role: "The Judge", item: "Gavel", icon: Gavel },
  { num: 8, role: "The Gardener", item: "Trowel", icon: Spade },
  { num: 9, role: "The PI", item: "Magnifier", icon: Search },
];

interface EvidenceBoardProps {
  completedNumbers: number[];
}

export const EvidenceBoard: React.FC<EvidenceBoardProps> = ({ completedNumbers }) => {
  return (
    <div className="hidden lg:flex flex-col w-64 bg-yellow-50 dark:bg-[#1e1e1e] p-4 border border-gray-300 shadow-sm rotate-1 transform">
      <div className="border-b-2 border-gray-400 dark:border-gray-600 mb-4 pb-2">
        <h2 className="text-xl font-serif font-bold text-gray-800 dark:text-gray-200">SUSPECTS</h2>
        <p className="text-xs font-mono text-gray-500">Classified Information</p>
      </div>

      <ul className="space-y-3">
        {SUSPECTS.map((suspect) => {
            const isCompleted = completedNumbers.includes(suspect.num);
            const Icon = suspect.icon;
            
            return (
                <li key={suspect.num} className={clsx(
                    "flex items-center gap-3 p-2 border-b border-gray-200 dark:border-gray-700 transition-all duration-500",
                    isCompleted ? "opacity-30 line-through grayscale" : "opacity-100"
                )}>
                    <div className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded-full font-bold font-mono text-lg text-gray-700 dark:text-gray-300">
                        {suspect.num}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-1 font-bold text-sm text-gray-800 dark:text-gray-200">
                            {suspect.role}
                        </div>
                        <div className="text-xs text-gray-500 font-mono flex items-center gap-1">
                            <Icon size={10} />
                            {suspect.item}
                        </div>
                    </div>
                </li>
            );
        })}
      </ul>
      
      <div className="mt-auto pt-4 border-t-2 border-gray-300 dark:border-gray-600">
        <div className="text-xs font-mono text-center text-gray-400">
            CONFIDENTIAL
        </div>
      </div>
    </div>
  );
};
