import React, { useState, useCallback } from 'react';
import { GamePhase, Player } from './types';
import { COLORS } from './constants';
import Lobby from './components/Lobby';
import Arena from './components/Arena';
import WinnerModal from './components/WinnerModal';

// Utilities
const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

function App() {
  const [phase, setPhase] = useState<GamePhase>('LOBBY');
  const [players, setPlayers] = useState<Player[]>([]);
  const [winner, setWinner] = useState<Player | null>(null);

  // Preload image helper
  const preloadImage = (code: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
          const img = new Image();
          img.src = `https://flagcdn.com/w160/${code}.png`;
          img.crossOrigin = "Anonymous";
          img.onload = () => resolve(img);
          img.onerror = () => reject();
      });
  };

  const handleAddPlayer = async (name: string, code: string) => {
    // Generate ID
    const id = Date.now().toString() + Math.random().toString();
    const color = getRandomColor();
    
    // Optimistic Add
    const newPlayer: Player = { id, name, code, color };
    setPlayers(prev => [...prev, newPlayer]);

    try {
        const image = await preloadImage(code);
        setPlayers(prev => prev.map(p => p.id === id ? { ...p, image } : p));
    } catch (e) {
        console.warn(`Could not load flag for ${code}`);
    }
  };

  const handleStartGame = () => {
    if (players.length < 2) return;
    setWinner(null);
    setPhase('PLAYING');
  };

  const handleGameOver = useCallback((winningPlayer: Player) => {
    setWinner(winningPlayer);
    // Slight delay before showing modal to let the win sink in visually
    setTimeout(() => {
        setPhase('GAME_OVER');
    }, 1500);
  }, []);

  const handleReset = () => {
      setPhase('LOBBY');
      setWinner(null);
      // We keep the players for the next round (streamer convenience)
      // If they want to clear, they can refresh or we add a clear button later
  };

  return (
    <div className="flex h-screen w-screen bg-slate-900 overflow-hidden relative">
      
      {/* Background Gradient for Sky */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-400 to-blue-600 z-0" />
      
      {/* Sidebar / Lobby (Visible in Lobby phase, hidden or collapsed in game? Let's keep side-by-side for "Stream" look) */}
      <div className={`relative z-10 h-full transition-all duration-500 ease-in-out ${phase === 'LOBBY' ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-80 lg:w-96'} absolute md:relative`}>
        <Lobby 
            players={players} 
            onAddPlayer={handleAddPlayer} 
            onStart={handleStartGame} 
        />
      </div>

      {/* Main Game Area */}
      <div className="flex-1 relative z-0 h-full">
         <Arena 
            players={players} 
            isPlaying={phase === 'PLAYING'} 
            onGameOver={handleGameOver} 
         />
         
         {/* Instruction Overlay when Playing */}
         {phase === 'PLAYING' && (
             <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/50 text-sm font-bold tracking-widest pointer-events-none">
                 BATTLE IN PROGRESS
             </div>
         )}
      </div>

      {/* Winner Overlay */}
      {phase === 'GAME_OVER' && (
          <WinnerModal winner={winner} onReset={handleReset} />
      )}
    </div>
  );
}

export default App;
