import React, { useState, useEffect, useCallback } from 'react';
import { Skull, Gem, Footprints, Crown, Ghost, RotateCcw, HelpCircle, Eraser, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast, Toaster } from 'sonner';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utils ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Game Logic ---

type SuspectId = 1 | 2 | 3 | 4 | 5;

const SUSPECTS = [
  { id: 1, name: 'Baron Scarlet', color: 'text-red-500', bg: 'bg-red-500/20', border: 'border-red-500', icon: Skull },
  { id: 2, name: 'Lady Azure', color: 'text-blue-500', bg: 'bg-blue-500/20', border: 'border-blue-500', icon: Gem },
  { id: 3, name: 'Dr. Emerald', color: 'text-emerald-500', bg: 'bg-emerald-500/20', border: 'border-emerald-500', icon: Footprints },
  { id: 4, name: 'Count Gold', color: 'text-yellow-500', bg: 'bg-yellow-500/20', border: 'border-yellow-500', icon: Crown },
  { id: 5, name: 'Madame Violet', color: 'text-purple-500', bg: 'bg-purple-500/20', border: 'border-purple-500', icon: Ghost },
] as const;

type CellData = {
  value: SuspectId | null;
  isFixed: boolean; // Pre-filled by the puzzle generator
  isError?: boolean;
};

// Simple Latin Square Generator (Backtracking)
function generateLatinSquare(size: number): number[][] {
  const board = Array(size).fill(null).map(() => Array(size).fill(0));

  function isValid(board: number[][], row: number, col: number, num: number) {
    // Check Row
    for (let x = 0; x < size; x++) {
      if (board[row][x] === num) return false;
    }
    // Check Col
    for (let x = 0; x < size; x++) {
      if (board[x][col] === num) return false;
    }
    return true;
  }

  function solve(row: number, col: number): boolean {
    if (row === size) return true;
    
    const nextRow = col === size - 1 ? row + 1 : row;
    const nextCol = col === size - 1 ? 0 : col + 1;

    if (board[row][col] !== 0) {
      return solve(nextRow, nextCol);
    }

    // Try random order of numbers to vary the puzzle
    const nums = Array.from({ length: size }, (_, i) => i + 1).sort(() => Math.random() - 0.5);

    for (const num of nums) {
      if (isValid(board, row, col, num)) {
        board[row][col] = num;
        if (solve(nextRow, nextCol)) return true;
        board[row][col] = 0;
      }
    }
    return false;
  }

  solve(0, 0);
  return board;
}

function createPuzzle(size: number = 5, difficulty: number = 0.5): CellData[][] {
  const solution = generateLatinSquare(size);
  // Mask some cells
  const puzzle: CellData[][] = solution.map(row => 
    row.map(val => {
      const isFixed = Math.random() > difficulty; // Higher difficulty = more holes
      return {
        value: isFixed ? (val as SuspectId) : null,
        isFixed: isFixed,
      };
    })
  );
  return puzzle;
}

// --- Components ---

const SuspectIcon = ({ id, className }: { id: SuspectId, className?: string }) => {
  const suspect = SUSPECTS.find(s => s.id === id);
  if (!suspect) return null;
  const Icon = suspect.icon;
  return <Icon className={cn(suspect.color, className)} />;
};

export default function MurdokuGame() {
  const [grid, setGrid] = useState<CellData[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{r: number, c: number} | null>(null);
  const [selectedSuspect, setSelectedSuspect] = useState<SuspectId | null>(null);
  const [won, setWon] = useState(false);

  // Initialize game
  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    // Difficulty: 0.6 means 60% chance to be empty (hole)
    const newGrid = createPuzzle(5, 0.6);
    setGrid(newGrid);
    setWon(false);
    setSelectedCell(null);
    setSelectedSuspect(1); // Default select first suspect
  };

  const handleCellClick = (r: number, c: number) => {
    const cell = grid[r][c];
    if (cell.isFixed) return; // Cannot edit fixed cells

    if (selectedSuspect) {
        // Place the currently selected suspect
        const newGrid = grid.map(row => [...row]); // Deep copy rows
        const currentVal = newGrid[r][c].value;
        
        // Toggle if clicking same
        if (currentVal === selectedSuspect) {
           newGrid[r][c] = { ...newGrid[r][c], value: null };
        } else {
           newGrid[r][c] = { ...newGrid[r][c], value: selectedSuspect };
        }
        
        updateGameState(newGrid);
    } else {
        setSelectedCell({ r, c });
    }
  };

  const updateGameState = (currentGrid: CellData[][]) => {
    // 1. Reset errors
    const newGrid = currentGrid.map(row => row.map(cell => ({ ...cell, isError: false })));
    
    // 2. Check for conflicts
    let hasConflict = false;

    // Check Rows & Cols for duplicates
    for (let i = 0; i < 5; i++) {
        // Row check
        const rowBSuspects = new Map<SuspectId, number[]>(); // id -> col_indices
        for(let c=0; c<5; c++) {
            const val = newGrid[i][c].value;
            if(val) {
                if(!rowBSuspects.has(val)) rowBSuspects.set(val, []);
                rowBSuspects.get(val)?.push(c);
            }
        }
        rowBSuspects.forEach((cols) => {
            if(cols.length > 1) {
                hasConflict = true;
                cols.forEach(c => newGrid[i][c].isError = true);
            }
        });

        // Col check
        const colSuspects = new Map<SuspectId, number[]>(); // id -> row_indices
        for(let r=0; r<5; r++) {
            const val = newGrid[r][i].value;
            if(val) {
                if(!colSuspects.has(val)) colSuspects.set(val, []);
                colSuspects.get(val)?.push(r);
            }
        }
        colSuspects.forEach((rows) => {
            if(rows.length > 1) {
                hasConflict = true;
                rows.forEach(r => newGrid[r][i].isError = true);
            }
        });
    }

    setGrid(newGrid);

    // 3. Check Win (Full & No Conflicts)
    if (!hasConflict) {
        let isFull = true;
        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
                if (newGrid[r][c].value === null) {
                    isFull = false;
                    break;
                }
            }
        }

        if (isFull) {
            setWon(true);
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 }
            });
            toast.success("Case Closed! You found the solution.");
        }
    }
  };

  const handleSuspectSelect = (id: SuspectId) => {
      setSelectedSuspect(id);
      setSelectedCell(null); 
  };

  const handleClearBoard = () => {
      const newGrid = grid.map(row => row.map(cell => ({
          ...cell,
          value: cell.isFixed ? cell.value : null,
          isError: false
      })));
      setGrid(newGrid);
      setWon(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-purple-500/30 flex flex-col items-center py-8 px-4">
      <Toaster position="top-center" theme="dark" />
      
      {/* Header */}
      <div className="mb-8 text-center space-y-2">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-purple-400 to-blue-400 font-serif">
          MURDOKU
        </h1>
        <p className="text-slate-400 max-w-md mx-auto">
          Un rompecabezas de lógica deductiva. Coloca cada sospechoso exactamente una vez en cada fila y columna.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 items-start justify-center w-full max-w-5xl">
        
        {/* Main Game Area */}
        <div className="flex flex-col items-center gap-6">
          
          {/* The Board */}
          <div className="relative bg-slate-900 p-2 rounded-xl shadow-2xl border border-slate-800">
             {/* Grid */}
             <div className="grid grid-cols-5 gap-1.5 md:gap-2">
                {grid.map((row, rowIndex) => (
                    row.map((cell, colIndex) => (
                        <button
                            key={`${rowIndex}-${colIndex}`}
                            onClick={() => handleCellClick(rowIndex, colIndex)}
                            disabled={cell.isFixed || won}
                            className={cn(
                                "w-14 h-14 md:w-16 md:h-16 rounded-lg flex items-center justify-center text-2xl transition-all duration-200",
                                "border-2",
                                cell.isFixed 
                                    ? "bg-slate-900 border-slate-800/50 cursor-default" 
                                    : "bg-slate-800 border-slate-700 hover:border-slate-500 hover:bg-slate-750",
                                cell.isError && "bg-red-900/20 border-red-500/50 animate-pulse",
                                !cell.isFixed && cell.value && !cell.isError && "bg-slate-800 border-slate-600",
                                selectedCell?.r === rowIndex && selectedCell?.c === colIndex && "ring-2 ring-purple-500 ring-offset-2 ring-offset-slate-900",
                                won && "opacity-80"
                            )}
                        >
                            {cell.value ? (
                                <SuspectIcon id={cell.value} className={cn("w-8 h-8 md:w-9 md:h-9", cell.isFixed ? "opacity-40 grayscale-[0.3]" : "drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]")} />
                            ) : null}
                        </button>
                    ))
                ))}
             </div>
          </div>

          {/* Controls - Mobile/Desktop Unified */}
          <div className="w-full max-w-md bg-slate-900/50 p-4 rounded-xl border border-slate-800/50 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sospechosos</span>
                <span className="text-xs text-slate-500">Seleccionar para colocar</span>
            </div>
            
            <div className="flex justify-between gap-2">
                {SUSPECTS.map((suspect) => (
                    <button
                        key={suspect.id}
                        onClick={() => handleSuspectSelect(suspect.id)}
                        className={cn(
                            "group relative flex flex-col items-center justify-center p-2 rounded-lg transition-all",
                            "hover:bg-slate-800",
                            selectedSuspect === suspect.id 
                                ? "bg-slate-800 ring-1 ring-inset " + suspect.border 
                                : "opacity-70 hover:opacity-100"
                        )}
                        title={suspect.name}
                    >
                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-transform group-active:scale-95",
                            suspect.bg
                        )}>
                            <suspect.icon className={cn("w-6 h-6", suspect.color)} />
                        </div>
                        <div className={cn(
                            "w-1 h-1 rounded-full bg-current transition-opacity",
                            selectedSuspect === suspect.id ? "opacity-100 " + suspect.color : "opacity-0"
                        )} />
                    </button>
                ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button 
                onClick={handleClearBoard}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full text-sm font-medium transition-colors border border-slate-700"
            >
                <Eraser className="w-4 h-4" /> Reiniciar Tablero
            </button>
            <button 
                onClick={startNewGame}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full text-sm font-medium transition-colors border border-slate-700"
            >
                <RotateCcw className="w-4 h-4" /> Nuevo Juego
            </button>
          </div>

        </div>

        {/* Info / Instructions Panel */}
        <div className="w-full max-w-sm space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl">
                <h3 className="text-lg font-serif font-bold text-slate-200 mb-4 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-purple-400" />
                    Cómo jugar
                </h3>
                <ul className="space-y-3 text-sm text-slate-400">
                    <li className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">1</span>
                        <span>Cada <strong>Fila</strong> debe contener exactamente uno de cada sospechoso.</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">2</span>
                        <span>Cada <strong>Columna</strong> debe contener exactamente uno de cada sospechoso.</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">3</span>
                        <span>Usa la lógica para deducir dónde se esconden los sospechosos que faltan. ¡No se requiere adivinar!</span>
                    </li>
                </ul>
            </div>

            {/* Status Card */}
            {won ? (
                 <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 p-6 rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-green-500/20 rounded-full">
                            <Check className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-green-100">¡Caso resuelto!</h3>
                            <p className="text-xs text-green-400/80">Excelente trabajo de detective.</p>
                        </div>
                    </div>
                    <button 
                        onClick={startNewGame}
                        className="mt-4 w-full py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold text-sm transition-colors shadow-lg shadow-green-900/20"
                    >
                        Jugar de nuevo
                    </button>
                 </div>
            ) : (
                <div className="bg-slate-900/40 border border-slate-800/50 p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-slate-300">Dossier de Sospechosos</h4>
                    </div>
                    <div className="space-y-3">
                        {SUSPECTS.map(s => (
                            <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors cursor-help group">
                                <s.icon className={cn("w-4 h-4", s.color)} />
                                <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">{s.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

      </div>

      <footer className="mt-auto pt-12 pb-4 text-center text-slate-600 text-xs">
        <p>Inspirado en Murdoku.com y la mecánica del Sudoku.</p>
      </footer>
    </div>
  );
}
