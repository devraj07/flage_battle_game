import React from 'react';
import { Player } from '../types';
import { Trophy, RefreshCw, Share2 } from 'lucide-react';

interface WinnerModalProps {
  winner: Player | null;
  onReset: () => void;
}

const WinnerModal: React.FC<WinnerModalProps> = ({ winner, onReset }) => {
  if (!winner) return null;

  const handleShare = () => {
    // Simple mock share
    const text = `🏆 ${winner.name} won the Flag Battle Royale! 🚩 Play now!`;
    navigator.clipboard.writeText(text);
    alert('Result copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-[fadeIn_0.5s_ease-out]">
      <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl text-center max-w-md w-full shadow-2xl relative overflow-hidden">
        {/* Confetti BG effect (CSS driven) */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-yellow-500/50 via-transparent to-transparent animate-pulse"></div>

        <div className="relative z-10 flex flex-col items-center">
            <div className="mb-6 relative">
                <div className="absolute -inset-4 bg-yellow-500/20 blur-xl rounded-full animate-pulse"></div>
                <Trophy size={80} className="text-yellow-400 wiggle" />
            </div>
            
            <h2 className="text-yellow-500 font-bold tracking-widest uppercase mb-2">Champion</h2>
            <h1 className="text-5xl font-black text-white mb-8 drop-shadow-lg break-words w-full">
                {winner.name}
            </h1>

            <div className="w-32 h-32 rounded-full border-4 border-yellow-400 overflow-hidden mb-8 shadow-xl bg-black">
                 {winner.image && (
                     <img src={winner.image.src} className="w-full h-full object-cover" alt="Winner" />
                 )}
            </div>

            <div className="flex gap-4 w-full">
                <button 
                    onClick={onReset}
                    className="flex-1 bg-white text-slate-900 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors"
                >
                    <RefreshCw size={20} />
                    Again
                </button>
                <button 
                    onClick={handleShare}
                    className="flex-1 bg-slate-800 text-white border border-slate-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors"
                >
                    <Share2 size={20} />
                    Share
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default WinnerModal;
