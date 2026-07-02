/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Activity, Cpu, Wifi, Battery, ChevronRight, ChevronLeft } from 'lucide-react';
import { GameState, MovementPattern } from '../types';

interface HUDProps {
  state: GameState;
  onStart: () => void;
  onReset: () => void;
  onSetPattern: (pattern: MovementPattern | 'random') => void;
  onToggleSetting: (key: keyof GameState['settings']) => void;
}

export default function HUD({ state, onStart, onReset, onSetPattern, onToggleSetting }: HUDProps) {
  const accuracy = state.totalShots > 0 
    ? Math.round((state.targetsHit / state.totalShots) * 100) 
    : 0;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col font-sans text-[#e0e6ed]">
      {/* Header */}
      <header className="h-[48px] bg-[#111216] border-b border-[#22252b] flex items-center px-5 justify-between pointer-events-auto">
        <div className="font-mono font-extrabold text-[#00f3ff] tracking-[2px] text-sm">
          SENTINEL-X // AIS INTERNAL
        </div>
        <div className="flex gap-6 font-mono text-[11px] uppercase text-[#808d9e]">
          <HeaderStat label="BATT" value="98%" icon={<Battery size={12} />} />
          <HeaderStat label="LATENCY" value="8ms" icon={<Wifi size={12} />} />
          <HeaderStat label="FPS" value="144.0" icon={<Activity size={12} />} />
          <HeaderStat label="TEMP" value="34°C" icon={<Cpu size={12} />} />
        </div>
      </header>

      {/* Main Grid Area */}
      <div className="flex-1 flex justify-between p-1 overflow-hidden">
        {/* Left Stats Panel */}
        <aside className="w-[260px] bg-[#111216] p-4 flex flex-col gap-5 border border-[#22252b] pointer-events-auto">
          <SectionTitle title="AIMBOT [01]" subtitle="V2.4.1" />
          <div className="flex flex-col gap-4">
            <div onClick={() => onStart()} className="cursor-pointer">
              <Toggle label="Simulation Active" active={state.isPlaying} />
            </div>
            <PatternSelector 
              current={state.preferredPattern} 
              onSelect={onSetPattern} 
            />
            <div className="space-y-2">
              <div className="flex justify-between text-[12px]">
                <span>Accuracy Focus</span>
                <span className="text-[#00f3ff]">{accuracy}%</span>
              </div>
              <div className="h-1 bg-[#2a2d35] rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-[#00f3ff]"
                  animate={{ width: `${accuracy}%` }}
                />
              </div>
            </div>
          </div>

          <SectionTitle title="SIMULATION [02]" />
          <div className="flex flex-col gap-4">
            <StatRow label="Targets Hit" value={state.targetsHit} />
            <StatRow label="Precision" value={`${accuracy}%`} />
            <StatRow label="Total Score" value={state.score.toLocaleString()} highlight />
          </div>
        </aside>

        {/* Dynamic HUD Overlays (Viewport Space) */}
        <div className="flex-1 relative flex flex-col items-center justify-center p-6">
           {/* Viewport Overlay Text */}
           <div className="absolute top-4 left-4 border border-[#00f3ff]/30 p-3 font-mono text-[10px] text-[#00f3ff] bg-black/20 backdrop-blur-sm">
             PREVIEW MODE: OVERLAY ACTIVE<br/>
             SCANNING_NODES... DONE<br/>
             TIME_REMAINING: {state.timeLeft}S
           </div>

           {!state.isPlaying && (
             <motion.div 
               initial={{ scale: 0.95, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="bg-[#111216] border border-[#22252b] p-8 max-w-sm w-full space-y-6 pointer-events-auto text-center"
             >
                <div className="space-y-1">
                  <h1 className="text-2xl font-black tracking-tighter text-[#e0e6ed] uppercase">
                    {state.timeLeft === 0 ? 'Simulation' : 'Protocol'} <span className="text-[#00f3ff]">{state.timeLeft === 0 ? 'Complete' : 'Sentinel'}</span>
                  </h1>
                  <p className="text-[10px] text-[#808d9e] uppercase tracking-widest font-mono">
                    {state.timeLeft === 0 ? 'Reviewing Tactical Data' : 'System Integrity Verified'}
                  </p>
                </div>

                <div className="py-4 border-y border-[#22252b] grid grid-cols-2 gap-4">
                   <div>
                     <div className="text-[10px] text-[#808d9e] uppercase mb-1">{state.timeLeft === 0 ? 'Final Score' : 'Last Score'}</div>
                     <div className="text-xl font-bold font-mono text-[#e0e6ed]">{state.score.toLocaleString()}</div>
                   </div>
                   <div>
                     <div className="text-[10px] text-[#808d9e] uppercase mb-1">Precision</div>
                     <div className="text-xl font-bold font-mono text-[#00f3ff]">{accuracy}%</div>
                   </div>
                </div>

                {state.timeLeft === 0 && (
                  <div className="flex flex-col gap-2 text-left">
                     <StatRow label="Targets Eliminated" value={state.targetsHit} />
                     <StatRow label="Projectiles Fired" value={state.totalShots} />
                     <StatRow label="Critical Misses" value={state.totalMisses} />
                  </div>
                )}

                <button 
                  onClick={onStart}
                  className="w-full py-4 bg-[#00f3ff] hover:bg-[#00f3ff]/80 text-[#050608] font-bold uppercase tracking-widest text-xs transition-colors shadow-[0_0_20px_rgba(0,243,255,0.2)]"
                >
                  {state.timeLeft === 0 ? 'Restart Simulation' : 'Authorize Simulation'}
                </button>
             </motion.div>
           )}
        </div>

        {/* Right Stats Panel */}
        <aside className="w-[260px] bg-[#111216] p-4 flex flex-col gap-5 border border-[#22252b] pointer-events-auto">
          <SectionTitle title="VISUALS [03]" />
          <div className="flex flex-col gap-3">
            <div onClick={() => onToggleSetting('showSnaplines')} className="cursor-pointer">
              <Toggle label="Snaplines" active={state.settings.showSnaplines} />
            </div>
            <div onClick={() => onToggleSetting('showBoxes')} className="cursor-pointer">
              <Toggle label="2D Box" active={state.settings.showBoxes} />
            </div>
            <div onClick={() => onToggleSetting('showSkeleton')} className="cursor-pointer">
              <Toggle label="Skeleton ESP" active={state.settings.showSkeleton} />
            </div>
          </div>

          <SectionTitle title="RADAR [04]" />
          <div className="aspect-square bg-[#0d0e12] border border-[#22252b] rounded relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-[#00f3ff] rounded-full shadow-[0_0_8px_#00f3ff]" />
            {state.isPlaying && (
              <motion.div 
                animate={{ 
                  x: [10, 40, 20], 
                  y: [-30, 20, -10] 
                }}
                transition={{ repeat: Infinity, duration: 4 }}
                className="absolute top-1/2 left-1/2 w-1 h-1 bg-[#ff3e3e] rounded-full" 
              />
            )}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #22252b 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="h-[32px] bg-[#111216] border-t border-[#22252b] flex items-center px-5 text-[10px] text-[#808d9e] gap-5 font-mono pointer-events-auto">
        <div className="flex items-center gap-2 text-[#e0e6ed]">
          <div className="w-1.5 h-1.5 bg-[#00ff00] rounded-full animate-pulse shadow-[0_0_6px_#00ff00]" />
          CONNECTION: SECURE
        </div>
        <div>BYPASS: ACTIVE</div>
        <div className="opacity-40 italic">ID: AIS-{Math.random().toString(36).substr(2, 4).toUpperCase()}</div>
        <div className="ml-auto">HOLD [TAB] TO TOGGLE INTERFACE</div>
      </footer>
    </div>
  );
}

function HeaderStat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[#808d9e]">{label}:</span>
      <span className="text-[#e0e6ed]">{value}</span>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string, subtitle?: string }) {
  return (
    <div className="font-sans text-[10px] font-bold text-[#808d9e] uppercase tracking-[1.5px] border-b border-[#22252b] pb-1.5 mb-2 flex justify-between">
      <span>{title}</span>
      {subtitle && <span>{subtitle}</span>}
    </div>
  );
}

function Toggle({ label, active }: { label: string, active: boolean }) {
  return (
    <div className="flex items-center justify-between text-[12px] text-[#e0e6ed]">
      <span>{label}</span>
      <div className={`w-8 h-4 rounded-full border border-[#22252b] relative transition-colors ${active ? 'bg-[#00f3ff]' : 'bg-[#2a2d35]'}`}>
        <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all ${active ? 'left-4.5 bg-[#050608]' : 'left-0.5 bg-[#808d9e]'}`} />
      </div>
    </div>
  );
}

function StatRow({ label, value, highlight = false }: { label: string, value: string | number, highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between text-[12px]">
      <span className="text-[#808d9e]">{label}</span>
      <span className={`font-mono font-bold ${highlight ? 'text-[#00f3ff]' : 'text-[#e0e6ed]'}`}>{value}</span>
    </div>
  );
}

function PatternSelector({ current, onSelect }: { current: MovementPattern | 'random', onSelect: (p: MovementPattern | 'random') => void }) {
  const patterns: (MovementPattern | 'random')[] = ['random', 'linear', 'circular', 'sine', 'erratic'];
  const index = patterns.indexOf(current);

  const next = () => onSelect(patterns[(index + 1) % patterns.length]);
  const prev = () => onSelect(patterns[(index - 1 + patterns.length) % patterns.length]);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-[10px] text-[#808d9e] uppercase tracking-wider">Movement Pattern</div>
      <div className="flex items-center justify-between bg-[#0d0e12] border border-[#22252b] p-1 h-8">
        <button onClick={prev} className="p-1 hover:text-[#00f3ff] transition-colors"><ChevronLeft size={14}/></button>
        <span className="text-[11px] font-mono uppercase text-[#00f3ff] px-2">{current}</span>
        <button onClick={next} className="p-1 hover:text-[#00f3ff] transition-colors"><ChevronRight size={14}/></button>
      </div>
    </div>
  );
}
