import React, { useState, useEffect, useCallback } from 'react';
import { Skull, Gem, Footprints, Crown, RotateCcw, HelpCircle, Eraser, Check, Sword, FlaskRound, ScrollText, ScanFace } from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast, Toaster } from 'sonner';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utils ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Game Logic ---

type SuspectId = 1 | 2 | 3 | 4;
type ObjectId = 'empty' | 'weapon' | 'poison' | 'note' | 'clue';

const SUSPECTS = [
  { id: 1, name: 'Baron Scarlet', color: 'text-red-500', bg: 'bg-red-500/20', border: 'border-red-500', icon: Skull },
  { id: 2, name: 'Lady Azure', color: 'text-blue-500', bg: 'bg-blue-500/20', border: 'border-blue-500', icon: Gem },
  { id: 3, name: 'Dr. Emerald', color: 'text-emerald-500', bg: 'bg-emerald-500/20', border: 'border-emerald-500', icon: Footprints },
  { id: 4, name: 'Count Gold', color: 'text-yellow-500', bg: 'bg-yellow-500/20', border: 'border-yellow-500', icon: Crown },
] as const;

const OBJECTS = [
    { id: 'weapon', name: 'Daga', icon: Sword, color: 'text-slate-500' },
    { id: 'poison', name: 'Veneno', icon: FlaskRound, color: 'text-green-700' },
    { id: 'note', name: 'Nota Secreta', icon: ScrollText, color: 'text-amber-700' },
    { id: 'clue', name: 'Huella Digital', icon: ScanFace, color: 'text-indigo-400' },
] as const;

type CellData = {
  objectId: ObjectId | null; // Background object
  userValue: SuspectId | null; // User placed suspect
  isError?: boolean;
};

type PuzzleState = {
    grid: CellData[][];
    solution: { r: number, c: number, id: SuspectId }[];
    clues: string[];
};

// --- Generators ---

function generateSolution(size: number): { r: number, c: number, id: SuspectId }[] {
    // Generate a valid N-Rook placement (1 per row, 1 per col)
    // We simply shuffle the columns indices for each row index 0..3
    const cols = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
    const solution = [];
    
    // Assign random suspects to these positions
    // We have suspects 1, 2, 3, 4
    const suspectIds = [1, 2, 3, 4].sort(() => Math.random() - 0.5) as SuspectId[];

    for(let i=0; i<size; i++) {
        solution.push({
            r: i,
            c: cols[i],
            id: suspectIds[i]
        });
    }
    return solution;
}

function generateClues(solution: { r: number, c: number, id: SuspectId }[], grid: CellData[][]): string[] {
    const clues: string[] = [];
    
    // Helper to get suspect name
    const getName = (id: SuspectId) => SUSPECTS.find(s => s.id === id)?.name || 'Someone';
    const getObjName = (objId: ObjectId) => OBJECTS.find(o => o.id === objId)?.name || 'nothing';

    solution.forEach(sol => {
        const suspect = SUSPECTS.find(s => s.id === sol.id)!;
        const cellObj = grid[sol.r][sol.c].objectId;
        
        // Clue Type 1: Object Location (Strongest)
        if (cellObj && Math.random() > 0.3) {
            clues.push(`${suspect.name} fue encontrado en el lugar ${getObjName(cellObj)}.`);
            return;
        }

        // Clue Type 2: Row/Col (Medium)
        if (Math.random() > 0.5) {
            clues.push(`${suspect.name} se está escondiendo en la fila ${sol.r + 1}.`);
            return;
        } else {
             clues.push(`${suspect.name} se está escondiendo en la columna ${sol.c + 1}.`);
             return;
        }
    });

    // Add some random relative clues if we need more variety
    // (Simplification for now: ensure we have 4 direct clues so it is solvable)
    
    return clues.sort(() => Math.random() - 0.5);
}

function createPuzzle(): PuzzleState {
    const size = 4;
    
    // 1. Generate Background Grid (Objects)
    const grid: CellData[][] = Array(size).fill(null).map(() => 
        Array(size).fill(null).map(() => {
            // 40% chance of an object
            const hasObj = Math.random() < 0.4;
            let objId: ObjectId | null = null;
            if(hasObj) {
                const randomObj = OBJECTS[Math.floor(Math.random() * OBJECTS.length)];
                objId = randomObj.id as ObjectId;
            }
            return { objectId: objId, userValue: null };
        })
    );

    // 2. Generate Solution (Where the suspects actually are)
    const solution = generateSolution(size);

    // 3. Generate Clues based on the solution and grid
    const clues = generateClues(solution, grid);

    return { grid, solution, clues };
}

// --- Components ---

const SuspectIcon = ({ id, className }: { id: SuspectId, className?: string }) => {
  const suspect = SUSPECTS.find(s => s.id === id);
  if (!suspect) return null;
  const Icon = suspect.icon;
  return <Icon className={cn(suspect.color, className)} />;
};

const ObjectIcon = ({ id, className }: { id: ObjectId, className?: string }) => {
    const obj = OBJECTS.find(o => o.id === id);
    if (!obj) return null;
    const Icon = obj.icon;
    return <Icon className={cn(obj.color, className)} />;
};

export default function MurdokuGame() {
  const [grid, setGrid] = useState<CellData[][]>([]);
  const [solution, setSolution] = useState<{ r: number, c: number, id: SuspectId }[]>([]);
  const [clues, setClues] = useState<string[]>([]);
  const [selectedCell, setSelectedCell] = useState<{r: number, c: number} | null>(null);
  const [selectedSuspect, setSelectedSuspect] = useState<SuspectId | null>(null);
  const [won, setWon] = useState(false);

  // Initialize game
  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    const puzzle = createPuzzle();
    setGrid(puzzle.grid);
    setSolution(puzzle.solution);
    setClues(puzzle.clues);
    setWon(false);
    setSelectedCell(null);
    setSelectedSuspect(1); 
  };

  const handleCellClick = (r: number, c: number) => {
    if (won) return;

    if (selectedSuspect) {
        const newGrid = grid.map(row => [...row]);
        const currentVal = newGrid[r][c].userValue;
        
        // Remove suspect from previous location if it exists (Unique Suspect Rule)
        for(let i=0; i<4; i++) {
            for(let j=0; j<4; j++) {
                if (newGrid[i][j].userValue === selectedSuspect) {
                    newGrid[i][j] = { ...newGrid[i][j], userValue: null };
                }
            }
        }

        // Toggle: if clicking same cell with same suspect, remove it. Else place it.
        if (currentVal === selectedSuspect) {
           newGrid[r][c] = { ...newGrid[r][c], userValue: null };
        } else {
           newGrid[r][c] = { ...newGrid[r][c], userValue: selectedSuspect };
        }
        
        setGrid(newGrid);
        checkWin(newGrid);
    } else {
        setSelectedCell({ r, c });
    }
  };

  const checkWin = (currentGrid: CellData[][]) => {
    // Check constraints: 1 per row, 1 per col
    // And Match Solution
    
    // We can simply check if every placed suspect matches the solution
    // First, count placed suspects
    let placedCount = 0;
    for(let r=0; r<4; r++) {
        for(let c=0; c<4; c++) {
            if(currentGrid[r][c].userValue) placedCount++;
        }
    }

    if (placedCount !== 4) return; // Not finished

    // Check validity
    let correct = true;
    const newGrid = currentGrid.map(row => row.map(cell => ({ ...cell, isError: false })));

    // Verify against solution
    for (const sol of solution) {
        if (newGrid[sol.r][sol.c].userValue !== sol.id) {
            correct = false;
            // Highlight error? 
            // In a strict logic puzzle, maybe we don't show exactly WHICH one is wrong,
            // but for this game let's highlight collisions.
        }
    }
    
    // Basic Rule Check (Row/Col uniqueness) for visual feedback
    // Since our UI forces 1 instance of each suspect, we only need to check Row/Col collisions between different suspects
    let collision = false;
    for(let i=0; i<4; i++) {
        // Row check
        const rowItems = newGrid[i].filter(c => c.userValue !== null);
        if(rowItems.length > 1) collision = true;
        
        // Col check
        let colCount = 0;
        for(let r=0; r<4; r++) {
            if(newGrid[r][i].userValue) colCount++;
        }
        if(colCount > 1) collision = true;
    }

    setGrid(newGrid);

    if (correct) {
        setWon(true);
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
        });
        toast.success("¡Caso Cerrado! Todos los sospechosos ubicados correctamente.");
    } else if (placedCount === 4 && collision) {
         toast.error("¡Colocación inválida! Los sospechosos no pueden compartir fila o columna.");
    } else if (placedCount === 4) {
         toast.error("La evidencia no coincide... revisa las pistas de nuevo.");
    }
  };

  const handleSuspectSelect = (id: SuspectId) => {
      setSelectedSuspect(id);
      setSelectedCell(null); 
  };

  const handleClearBoard = () => {
      const newGrid = grid.map(row => row.map(cell => ({
          ...cell,
          userValue: null,
          isError: false
      })));
      setGrid(newGrid);
      setWon(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-purple-500/30 flex flex-col items-center py-8 px-4">
      <Toaster position="top-center" theme="dark" />
      
      {/* Header */}
      <div className="mb-6 text-center space-y-2">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-purple-400 to-blue-400 font-serif">
          MURDOKU
        </h1>
        <p className="text-slate-400 max-w-lg mx-auto text-sm md:text-base">
          Puzle Lógico: Localiza los 3 sospechosos y el muerto. Solo <strong>uno por fila</strong> y <strong>uno por columna</strong>. Sigue las pistas para encontrar sus ubicaciones verdaderas.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start justify-center w-full max-w-6xl">
        
        {/* LEFT: Clues Panel */}
        <div className="w-full lg:w-1/3 order-2 lg:order-1 bg-slate-900/60 border border-slate-800 p-5 rounded-2xl shadow-lg backdrop-blur-sm">
             <h3 className="text-lg font-serif font-bold text-amber-500 mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
                <ScrollText className="w-5 h-5" />
                Cuaderno del Detective
            </h3>
            <ul className="space-y-4">
                {clues.map((clue, idx) => (
                    <li key={idx} className="flex gap-3 text-sm text-slate-300 leading-relaxed">
                        <span className="font-mono text-slate-600 font-bold select-none">{idx + 1}.</span>
                        <span>{clue}</span>
                    </li>
                ))}
            </ul>
             <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-500 italic">
                * Nota: Las filas van del 1-4 (Arriba a Abajo). Las columnas van del 1-4 (Izquierda a Derecha).
            </div>
        </div>

        {/* CENTER: Game Board */}
        <div className="flex flex-col items-center gap-6 order-1 lg:order-2">
          
          <div className="relative bg-slate-900 p-3 rounded-xl shadow-2xl border border-slate-800">
             {/* Grid */}
             <div className="grid grid-cols-4 gap-2">
                {grid.map((row, rowIndex) => (
                    row.map((cell, colIndex) => (
                        <button
                            key={`${rowIndex}-${colIndex}`}
                            onClick={() => handleCellClick(rowIndex, colIndex)}
                            disabled={won}
                            className={cn(
                                "relative w-20 h-20 md:w-24 md:h-24 rounded-lg flex items-center justify-center transition-all duration-200",
                                "border-2",
                                "bg-slate-800 border-slate-700 hover:border-slate-500 hover:bg-slate-750",
                                cell.isError && "bg-red-900/20 border-red-500/50 animate-pulse",
                                selectedCell?.r === rowIndex && selectedCell?.c === colIndex && "ring-2 ring-purple-500 ring-offset-2 ring-offset-slate-900",
                                won && "opacity-90 border-green-500/50 bg-green-900/10"
                            )}
                        >
                            {/* Background Object */}
                            {cell.objectId && (
                                <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                                    <ObjectIcon id={cell.objectId} className="w-12 h-12" />
                                </div>
                            )}

                            {/* Coordinate Label (Tiny) */}
                            <div className="absolute top-1 left-1.5 text-[9px] text-slate-600 font-mono select-none">
                                {rowIndex+1},{colIndex+1}
                            </div>

                            {/* Placed Suspect */}
                            {cell.userValue && (
                                <div className="z-10 animate-in zoom-in duration-200">
                                     <SuspectIcon id={cell.userValue} className={cn("w-12 h-12 md:w-14 md:h-14 drop-shadow-lg")} />
                                </div>
                            )}
                        </button>
                    ))
                ))}
             </div>
          </div>

          {/* Controls */}
          <div className="w-full max-w-md bg-slate-900/50 p-4 rounded-xl border border-slate-800/50 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sospechosos (1 asesinado)</span>
            </div>
            
            <div className="flex justify-between gap-2">
                {SUSPECTS.map((suspect) => {
                    // Check if this suspect is already placed
                    let isPlaced = false;
                    grid.forEach(r => r.forEach(c => { if(c.userValue === suspect.id) isPlaced = true; }));

                    return (
                        <button
                            key={suspect.id}
                            onClick={() => handleSuspectSelect(suspect.id)}
                            className={cn(
                                "group relative flex flex-col items-center justify-center p-2 rounded-lg transition-all",
                                "hover:bg-slate-800",
                                selectedSuspect === suspect.id 
                                    ? "bg-slate-800 ring-1 ring-inset " + suspect.border 
                                    : "opacity-100 hover:opacity-100"
                            )}
                            title={suspect.name}
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-transform group-active:scale-95",
                                suspect.bg,
                                isPlaced && selectedSuspect !== suspect.id && "opacity-40 grayscale"
                            )}>
                                <suspect.icon className={cn("w-6 h-6", suspect.color)} />
                            </div>
                            {isPlaced && (
                                <div className="absolute top-1 right-1 w-3 h-3 bg-slate-900 rounded-full border border-slate-600 flex items-center justify-center">
                                    <Check className="w-2 h-2 text-green-500" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button 
                onClick={handleClearBoard}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full text-sm font-medium transition-colors border border-slate-700"
            >
                <Eraser className="w-4 h-4" /> Borrar
            </button>
            <button 
                onClick={startNewGame}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full text-sm font-medium transition-colors border border-slate-700"
            >
                <RotateCcw className="w-4 h-4" /> Nuevo Caso
            </button>
          </div>

        </div>

        {/* RIGHT: Legend / Help */}
        <div className="w-full lg:w-1/4 order-3 text-sm text-slate-400 space-y-6">
            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800">
                <h4 className="font-bold text-slate-300 mb-3 text-center">Objetos</h4>
                <div className="grid grid-cols-2 gap-3">
                     {OBJECTS.map(obj => (
                         <div key={obj.id} className="flex items-center gap-2">
                             <obj.icon className={cn("w-4 h-4", obj.color)} />
                             <span>{obj.name}</span>
                         </div>
                     ))}
                </div>
            </div>
            
            {won && (
                <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-xl text-center">
                    <h4 className="font-bold text-green-400 mb-1">¡Excelente Trabajo!</h4>
                    <p className="text-green-300/80 text-xs">El misterio ha sido resuelto.</p>
                </div>
            )}
        </div>

      </div>
    </div>
  );
}
