import React, { useState, useRef, useEffect } from 'react';
import { Player } from '../types';
import { COUNTRY_MAP, COLORS } from '../constants';
import { Plus, Play, User, Globe } from 'lucide-react';

interface LobbyProps {
  players: Player[];
  onAddPlayer: (name: string, code: string) => void;
  onStart: () => void;
}

const Lobby: React.FC<LobbyProps> = ({ players, onAddPlayer, onStart }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto scroll to bottom of list
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [players]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = input.trim().toLowerCase();
    
    if (!cleanName) return;

    const code = COUNTRY_MAP[cleanName];
    if (!code) {
      setError('Country not found! Try "USA", "Japan", etc.');
      setTimeout(() => setError(''), 2000);
      return;
    }

    onAddPlayer(input.trim(), code);
    setInput('');
  };

  const handleQuickAdd = () => {
     // Quick add logic for testing or lazy users
     const common = ['usa', 'canada', 'uk', 'france', 'germany', 'japan', 'brazil', 'australia'];
     const random = common[Math.floor(Math.random() * common.length)];
     onAddPlayer(random.toUpperCase(), COUNTRY_MAP[random]);
  };

  return (
    <div className="w-full md:w-96 bg-white/10 backdrop-blur-md border-r border-white/20 flex flex-col h-full shadow-2xl z-10">
      
      {/* Header */}
      <div className="p-6 border-b border-white/10 bg-black/20">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-500 mb-2">
          Flag Battle
        </h1>
        <p className="text-blue-100 text-sm opacity-80">
          Enter countries, start the chaos. Last flag standing wins!
        </p>
      </div>

      {/* Player List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2" ref={scrollRef}>
        {players.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-48 text-white/40 space-y-4">
              <Globe size={48} className="animate-pulse" />
              <p>No contenders yet...</p>
              <button 
                onClick={handleQuickAdd}
                className="text-xs border border-white/20 px-3 py-1 rounded-full hover:bg-white/10"
              >
                + Add Random Bot
              </button>
           </div>
        ) : (
          players.map((p) => (
            <div 
                key={p.id} 
                className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/5 animate-[fadeIn_0.3s_ease-out]"
            >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-black/50 border border-white/20 shadow-sm relative">
                    {p.image ? (
                        <img src={p.image.src} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full" style={{ backgroundColor: p.color }} />
                    )}
                </div>
                <span className="font-bold text-white truncate flex-1">{p.name}</span>
            </div>
          ))
        )}
      </div>

      {/* Controls */}
      <div className="p-4 bg-black/40 space-y-4 border-t border-white/10">
        <form onSubmit={handleSubmit} className="relative">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter Country Name..."
                className="w-full bg-slate-800 text-white pl-4 pr-10 py-3 rounded-xl border border-slate-600 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/50 outline-none transition-all"
            />
            <button 
                type="submit"
                className="absolute right-2 top-2 p-1.5 bg-blue-500 hover:bg-blue-400 rounded-lg text-white transition-colors"
            >
                <Plus size={18} />
            </button>
        </form>
        
        {error && (
            <div className="text-red-400 text-xs font-bold text-center animate-bounce">
                {error}
            </div>
        )}

        <button
            onClick={onStart}
            disabled={players.length < 2}
            className={`w-full py-4 rounded-xl font-black text-xl tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]
                ${players.length < 2 
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white shadow-green-900/50'
                }`}
        >
            <Play fill="currentColor" />
            START BATTLE
        </button>
      </div>
    </div>
  );
};

export default Lobby;
