import { useEffect, useRef, useState } from 'react';
import { Game } from './game/Game';
import { Trophy, Move, MousePointer2, Keyboard } from 'lucide-react';
import { Team } from './types';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState({ player: 0, bot: 0 });
  const [winner, setWinner] = useState<Team | null>(null);
  const gameRef = useRef<Game | null>(null);

  useEffect(() => {
    if (containerRef.current && !gameRef.current) {
      gameRef.current = new Game(
        containerRef.current, 
        (newScore) => setScore({ ...newScore }),
        (win) => setWinner(win)
      );
    }
  }, []);

  const restartGame = () => {
    window.location.reload();
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-sky-400 font-sans">
      {/* Game Canvas Container */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-8">
        
        {/* Score Board */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 flex items-center gap-12 shadow-2xl">
          <div className="text-center">
            <p className="text-xs uppercase tracking-widest text-white/60 font-semibold mb-1">Player</p>
            <p className="text-5xl font-black text-white tabular-nums">{score.player}</p>
          </div>
          <div className="h-12 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-xs uppercase tracking-widest text-white/60 font-semibold mb-1">Bot</p>
            <p className="text-5xl font-black text-white tabular-nums">{score.bot}</p>
          </div>
        </div>

        {/* Game Over Modal */}
        {winner && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center pointer-events-auto z-50">
            <div className="bg-white rounded-3xl p-12 text-center shadow-2xl max-w-md w-full mx-4">
              <Trophy size={80} className="mx-auto text-yellow-500 mb-6" />
              <h2 className="text-4xl font-black text-slate-900 mb-2">
                {winner === Team.PLAYER ? 'VICTORY!' : 'DEFEAT'}
              </h2>
              <p className="text-slate-500 mb-8 font-medium">
                {winner === Team.PLAYER 
                  ? 'You dominated the beach!' 
                  : 'The bot was too strong this time.'}
              </p>
              <button 
                onClick={restartGame}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/30"
              >
                PLAY AGAIN
              </button>
            </div>
          </div>
        )}

        {/* Controls Hint */}
        <div className="w-full max-w-4xl flex justify-between items-end">
          <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-white/10 text-white/90 space-y-3">
            <div className="flex items-center gap-3">
              <Move size={18} className="text-emerald-400" />
              <span className="text-sm font-medium">WASD / Arrows to Move</span>
            </div>
            <div className="flex items-center gap-3">
              <Keyboard size={18} className="text-emerald-400" />
              <span className="text-sm font-medium">Space to Jump | Q to Block | E to Set</span>
            </div>
            <div className="flex items-center gap-3">
              <MousePointer2 size={18} className="text-emerald-400" />
              <span className="text-sm font-medium">Click: Serve / Bump / Spike (Air)</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="bg-emerald-500 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg animate-bounce">
              <Trophy size={18} />
              <span className="font-bold text-sm uppercase tracking-tight">Beach Volley 3D</span>
            </div>
          </div>
        </div>
      </div>

      {/* Crosshair/Indicator for Serve */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-20">
        <div className="w-8 h-8 border-2 border-white rounded-full" />
      </div>
    </div>
  );
}
