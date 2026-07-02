/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Target, MovementPattern, GameState } from '../types';
import { audioService } from '../services/audioService';

interface TrainerStageProps {
  isPlaying: boolean;
  preferredPattern: MovementPattern | 'random';
  settings: GameState['settings'];
  onHit: (target: Target) => void;
  onMiss: () => void;
  onShot: () => void;
}

export default function TrainerStage({ isPlaying, preferredPattern, settings, onHit, onMiss, onShot }: TrainerStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [targets, setTargets] = useState<Target[]>([]);
  const [hitmarkers, setHitmarkers] = useState<{ x: number, y: number, id: number }[]>([]);
  const frameRef = useRef<number>(0);
  const targetsRef = useRef<Target[]>([]);

  useEffect(() => {
    targetsRef.current = targets;
  }, [targets]);

  // Handle Hitmarkers clearing
  useEffect(() => {
    if (hitmarkers.length === 0) return;
    const timeout = setTimeout(() => {
      setHitmarkers(prev => prev.slice(1));
    }, 150);
    return () => clearTimeout(timeout);
  }, [hitmarkers]);

  // Handle Target Spawning
  useEffect(() => {
    if (!isPlaying) {
      if (targetsRef.current.length > 0) setTargets([]);
      return;
    }

    const interval = setInterval(() => {
      if (targetsRef.current.length < 6) {
        const patterns: Target['pattern'][] = ['linear', 'circular', 'erratic', 'sine'];
        const pattern = preferredPattern === 'random' 
          ? patterns[Math.floor(Math.random() * patterns.length)]
          : preferredPattern;
        
        // Random spawn location within safe margins
        const startX = Math.random() * 0.75 + 0.125;
        const startY = Math.random() * 0.6 + 0.15;

        const newTarget: Target = {
          id: Math.random().toString(36).substr(2, 9),
          x: startX,
          y: startY,
          originX: startX,
          originY: startY,
          size: 32 + Math.random() * 30,
          startTime: Date.now(),
          duration: 2500 + Math.random() * 2000,
          vx: (Math.random() - 0.5) * 0.005,
          vy: (Math.random() - 0.5) * 0.005,
          pattern,
          phase: Math.random() * Math.PI * 2,
          speed: 0.002 + Math.random() * 0.004
        };
        setTargets(prev => [...prev, newTarget]);
      }
    }, 700);

    return () => clearInterval(interval);
  }, [isPlaying, preferredPattern]);

  // Clean up expired targets
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTargets(prev => prev.filter(t => (now - t.startTime) < t.duration));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Main Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      if (w === 0 || h === 0) {
        frameRef.current = requestAnimationFrame(render);
        return;
      }
      ctx.clearRect(0, 0, w, h);

      // Draw Grid (Tactical Feel)
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 60;
      for (let i = 0; i < w; i += gridSize) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
      }
      for (let i = 0; i < h; i += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
      }

      // Draw Targets
      const now = Date.now();
      targetsRef.current.forEach(t => {
        const x = t.x * w;
        const y = t.y * h;
        const elapsed = now - t.startTime;
        const progress = Math.min(1, elapsed / t.duration);
        const pulse = 1 + Math.sin(elapsed / 120) * 0.06;
        const size = Math.max(0, t.size * (1 - progress) * pulse);

        if (size <= 0) return;

        // Visual Support: Snaplines
        if (settings.showSnaplines && isPlaying) {
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(0, 243, 255, 0.15)';
          ctx.lineWidth = 1;
          ctx.moveTo(w / 2, h);
          ctx.lineTo(x, y + size + 5);
          ctx.stroke();
        }

        // Target Outer Ring
        ctx.beginPath();
        ctx.strokeStyle = '#ff3e3e';
        ctx.lineWidth = size > 20 ? 2 : 1.5;
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.stroke();

        // 2D Box ESP
        if (settings.showBoxes) {
          ctx.strokeStyle = 'rgba(0, 243, 255, 0.3)';
          ctx.lineWidth = 1;
          const bS = size + 15;
          ctx.strokeRect(x - bS, y - bS, bS * 2, bS * 2);
        }

        // Target Inner Dot
        ctx.beginPath();
        ctx.fillStyle = '#ff3e3e';
        ctx.arc(x, y, size * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Tactical Locking Lines (Visual Cues)
        if (size > 8) {
          ctx.strokeStyle = 'rgba(255, 62, 62, 0.45)';
          ctx.lineWidth = 1;
          const lSize = size + 10;
          ctx.beginPath();
          ctx.moveTo(x - lSize, y); ctx.lineTo(x - size + 4, y);
          ctx.moveTo(x + lSize, y); ctx.lineTo(x + size - 4, y);
          ctx.moveTo(x, y - lSize); ctx.lineTo(x, y - size + 4);
          ctx.moveTo(x, y + lSize); ctx.lineTo(x, y + size - 4);
          ctx.stroke();
        }
        
        // Timer Arc
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 3;
        ctx.arc(x, y, size + 8, -Math.PI/2, -Math.PI/2 + (Math.PI * 2 * (1 - progress)));
        ctx.stroke();

        // Pattern Label (Tactical)
        if (size > 22) {
          ctx.fillStyle = 'rgba(255, 62, 62, 0.8)';
          ctx.font = '9px "Courier New"';
          ctx.fillText(`${t.pattern.toUpperCase()}`, x + size + 12, y - size - 5);
          ctx.fillRect(x + size + 12, y - size, size * 1.5, 1);
        }

        // Movement logic
        if (t.pattern === 'linear') {
          if (t.vx && t.vy) {
            t.x += t.vx;
            t.y += t.vy;
            if (t.x < 0.1 || t.x > 0.9) t.vx *= -1;
            if (t.y < 0.1 || t.y > 0.8) t.vy *= -1;
          }
        } else if (t.pattern === 'circular') {
          const radius = 0.12;
          const angle = (elapsed * (t.speed || 0.002)) + (t.phase || 0);
          t.x = t.originX + Math.cos(angle) * radius;
          t.y = t.originY + Math.sin(angle) * radius;
        } else if (t.pattern === 'sine') {
          if (t.vx) t.x += t.vx;
          const amplitude = 0.1;
          const freq = (t.speed || 0.005) * 1.5;
          t.y = t.originY + Math.sin(elapsed * freq + (t.phase || 0)) * amplitude;
          if (t.x < 0.05 || t.x > 0.95) t.vx = (t.vx || 0) * -1;
        } else if (t.pattern === 'erratic') {
           if (t.vx && t.vy) {
             if (Math.random() > 0.98) {
               t.vx += (Math.random() - 0.5) * 0.008;
               t.vy += (Math.random() - 0.5) * 0.008;
               const maxSpeed = 0.012;
               t.vx = Math.max(-maxSpeed, Math.min(maxSpeed, t.vx));
               t.vy = Math.max(-maxSpeed, Math.min(maxSpeed, t.vy));
             }
             t.x += t.vx;
             t.y += t.vy;
             if (t.x < 0.05 || t.x > 0.95) t.vx *= -1;
             if (t.y < 0.05 || t.y > 0.85) t.vy *= -1;
           }
        }
      });

      // Draw Hitmarkers
      hitmarkers.forEach(h => {
        const x = h.x;
        const y = h.y;
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 2.5;
        const len = 12;
        const gap = 6;
        
        ctx.beginPath();
        ctx.moveTo(x - gap - len, y - gap - len); ctx.lineTo(x - gap, y - gap);
        ctx.moveTo(x + gap + len, y - gap - len); ctx.lineTo(x + gap, y - gap);
        ctx.moveTo(x - gap - len, y + gap + len); ctx.lineTo(x - gap, y + gap);
        ctx.moveTo(x + gap + len, y + gap + len); ctx.lineTo(x + gap, y + gap);
        ctx.stroke();
      });

      frameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frameRef.current);
  }, [hitmarkers]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isPlaying) return;
    onShot();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let hit = false;
    const currentTargets = targetsRef.current;
    const updatedTargets = currentTargets.filter(t => {
      const tx = t.x * canvas.width;
      const ty = t.y * canvas.height;
      const dist = Math.sqrt((mx - tx) ** 2 + (my - ty) ** 2);
      
      if (dist < t.size) {
        onHit(t);
        audioService.playHit();
        setHitmarkers(prev => [...prev, { x: mx, y: my, id: Math.random() }]);
        hit = true;
        return false;
      }
      return true;
    });

    if (hit) {
      setTargets(updatedTargets);
    } else {
      audioService.playMiss();
      onMiss();
    }
  };

  return (
    <canvas 
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      style={{ touchAction: 'none' }}
      className="block w-full h-full cursor-crosshair bg-slate-950"
    />
  );
}
