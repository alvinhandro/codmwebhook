/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, GameMode, Target, MovementPattern } from './types';
import HUD from './components/HUD';
import TrainerStage from './components/TrainerStage';
import { audioService } from './services/audioService';

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    score: 0,
    targetsHit: 0,
    totalMisses: 0,
    totalShots: 0,
    mode: 'grid',
    preferredPattern: 'random',
    timeLeft: 60,
    maxTime: 60,
    settings: {
      showSnaplines: true,
      showBoxes: true,
      showSkeleton: false,
    }
  });

  const [countdown, setCountdown] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);

  const setPattern = useCallback((pattern: MovementPattern | 'random') => {
    setGameState(prev => ({ ...prev, preferredPattern: pattern }));
  }, []);

  const toggleSetting = useCallback((key: keyof GameState['settings']) => {
    setGameState(prev => ({
      ...prev,
      settings: { ...prev.settings, [key]: !prev.settings[key] }
    }));
  }, []);

  const startGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCountdown(3);
    setGameState(prev => ({
      ...prev,
      isPlaying: false,
      score: 0,
      targetsHit: 0,
      totalMisses: 0,
      totalShots: 0,
      timeLeft: 60,
    }));
  }, []);

  // Handle Countdown
  useEffect(() => {
    if (countdown === null) return;
    
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
        audioService.playHit(); // Simple tick sound
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      audioService.playStart();
      setGameState(prev => ({ ...prev, isPlaying: true }));
      const timer = setTimeout(() => setCountdown(null), 500);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleHit = useCallback((target: Target) => {
    setGameState(prev => {
      const timeBonus = Math.max(0, 1000 - (Date.now() - target.startTime));
      const points = Math.round(100 + timeBonus / 10);
      return {
        ...prev,
        score: prev.score + points,
        targetsHit: prev.targetsHit + 1,
      };
    });
  }, []);

  const handleMiss = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      totalMisses: prev.totalMisses + 1,
      score: Math.max(0, prev.score - 50),
    }));
  }, []);

  const handleShot = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      totalShots: prev.totalShots + 1,
    }));
  }, []);

  useEffect(() => {
    if (gameState.isPlaying && gameState.timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setGameState(prev => {
          if (prev.timeLeft <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
            return { ...prev, timeLeft: 0, isPlaying: false };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    } else if (!gameState.isPlaying && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState.isPlaying]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,243,255,0.05),transparent_70%)]" />
      </div>

      <TrainerStage 
        isPlaying={gameState.isPlaying}
        preferredPattern={gameState.preferredPattern}
        settings={gameState.settings}
        onHit={handleHit}
        onMiss={handleMiss}
        onShot={handleShot}
      />

      <HUD 
        state={gameState}
        onStart={startGame}
        onReset={() => setGameState(prev => ({ ...prev, isPlaying: false }))}
        onSetPattern={setPattern}
        onToggleSetting={toggleSetting}
      />

      {/* Countdown Overlay */}
      {countdown !== null && countdown > 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="text-[12rem] font-black italic text-[#00f3ff] animate-ping opacity-50 font-mono">
            {countdown}
          </div>
        </div>
      )}

      {/* Crosshair Overlay (Visual only, to help alignment) */}
      {gameState.isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center">
               <div className="w-[2px] h-5 bg-[#00f3ff]/60 absolute top-0" />
               <div className="w-[2px] h-5 bg-[#00f3ff]/60 absolute bottom-0" />
               <div className="h-[2px] w-5 bg-[#00f3ff]/60 absolute left-0" />
               <div className="h-[2px] w-5 bg-[#00f3ff]/60 absolute right-0" />
               <div className="w-1 h-1 bg-[#00f3ff] rounded-full shadow-[0_0_4px_#00f3ff]" />
            </div>
            
            {/* HUD Bounds Indicators */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] border border-[#00f3ff]/5 pointer-events-none" />
          </div>
        </div>
      )}
    </div>
  );
}

