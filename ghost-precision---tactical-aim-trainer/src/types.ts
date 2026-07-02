/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameMode = 'grid' | 'tracking' | 'microflex';

export type MovementPattern = 'linear' | 'circular' | 'erratic' | 'sine';

export interface Target {
  id: string;
  x: number;
  y: number;
  size: number;
  startTime: number;
  duration: number;
  vx?: number;
  vy?: number;
  pattern: MovementPattern;
  originX: number;
  originY: number;
  phase?: number;
  speed?: number;
}

export interface GameState {
  isPlaying: boolean;
  score: number;
  targetsHit: number;
  totalMisses: number;
  totalShots: number;
  mode: GameMode;
  preferredPattern: MovementPattern | 'random';
  timeLeft: number;
  maxTime: number;
  settings: {
    showSnaplines: boolean;
    showBoxes: boolean;
    showSkeleton: boolean;
  };
}

export interface Settings {
  sensitivity: number;
  soundEnabled: boolean;
  targetColor: string;
  crosshairType: 'dot' | 'cross' | 'circle';
}
