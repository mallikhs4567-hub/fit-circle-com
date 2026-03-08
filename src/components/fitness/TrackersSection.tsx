import { Droplets, Footprints, Moon, Scale, Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface TrackersSectionProps {
  water: number;
  steps: number;
  sleep: number;
  weightLog: { date: string; value: number }[];
  onAddWater: () => void;
  onRemoveWater: () => void;
  onSetSteps: (v: number) => void;
  onSetSleep: (v: number) => void;
  onLogWeight: (v: number) => void;
}

export function TrackersSection({
  water, steps, sleep, weightLog,
  onAddWater, onRemoveWater, onSetSteps, onSetSleep, onLogWeight,
}: TrackersSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [weightInput, setWeightInput] = useState('');

  return (
    <div className="space-y-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full px-1 press-effect"
      >
        <h2 className="text-sm font-display uppercase tracking-wide text-foreground">Daily Trackers</h2>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Compact tracker row */}
      <div className="grid grid-cols-4 gap-2">
        <TrackerChip
          icon={<Droplets className="w-4 h-4" />}
          value={`${water}/8`}
          label="Water"
          active={water >= 8}
          onClick={onAddWater}
        />
        <TrackerChip
          icon={<Footprints className="w-4 h-4" />}
          value={steps >= 1000 ? `${(steps / 1000).toFixed(1)}k` : `${steps}`}
          label="Steps"
          active={steps >= 8000}
        />
        <TrackerChip
          icon={<Moon className="w-4 h-4" />}
          value={`${sleep}h`}
          label="Sleep"
          active={sleep >= 7}
        />
        <TrackerChip
          icon={<Scale className="w-4 h-4" />}
          value={weightLog.length > 0 ? `${weightLog[weightLog.length - 1].value}` : '—'}
          label="Weight"
          active={false}
        />
      </div>

      {expanded && (
        <div className="space-y-3 animate-fade-up">
          {/* Water */}
          <div className="card-elevated p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-primary" />
                <span className="text-xs font-display uppercase tracking-wider text-foreground">Water</span>
              </div>
              <span className="text-xs text-muted-foreground">{water} / 8</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onRemoveWater} className="p-2 rounded-lg bg-secondary hover:bg-muted transition-colors press-effect">
                <Minus className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <div className="flex-1 flex gap-1">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex-1 h-5 rounded transition-all duration-300",
                      i < water ? "gradient-primary" : "bg-secondary"
                    )}
                  />
                ))}
              </div>
              <button onClick={onAddWater} className="p-2 rounded-lg bg-secondary hover:bg-muted transition-colors press-effect">
                <Plus className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Steps */}
          <div className="card-elevated p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Footprints className="w-4 h-4 text-streak" />
                <span className="text-xs font-display uppercase tracking-wider text-foreground">Steps</span>
              </div>
              <span className="text-xs text-muted-foreground">{steps.toLocaleString()} / 8,000</span>
            </div>
            <input
              type="range"
              min={0}
              max={15000}
              step={500}
              value={steps}
              onChange={e => onSetSteps(Number(e.target.value))}
              className="range-slider w-full"
            />
          </div>

          {/* Sleep */}
          <div className="card-elevated p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-display uppercase tracking-wider text-foreground">Sleep</span>
              </div>
              <span className="text-xs text-muted-foreground">{sleep}h / 8h</span>
            </div>
            <input
              type="range"
              min={0}
              max={12}
              step={0.5}
              value={sleep}
              onChange={e => onSetSleep(Number(e.target.value))}
              className="range-slider w-full"
            />
          </div>

          {/* Weight */}
          <div className="card-elevated p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-success" />
                <span className="text-xs font-display uppercase tracking-wider text-foreground">Weight</span>
              </div>
            </div>
            {weightLog.length > 1 && (
              <div className="flex items-end gap-1 h-12 mb-3">
                {weightLog.slice(-7).map((w, i, arr) => {
                  const min = Math.min(...arr.map(a => a.value));
                  const max = Math.max(...arr.map(a => a.value));
                  const range = max - min || 1;
                  const height = ((w.value - min) / range) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end">
                      <div
                        className="w-full rounded-sm gradient-primary"
                        style={{ height: `${Math.max(height, 10)}%` }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="number"
                value={weightInput}
                onChange={e => setWeightInput(e.target.value)}
                placeholder="kg"
                className="flex-1 bg-secondary rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary transition-colors"
              />
              <button
                onClick={() => {
                  const v = parseFloat(weightInput);
                  if (v > 0) { onLogWeight(v); setWeightInput(''); }
                }}
                className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold press-effect"
              >
                Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TrackerChip({
  icon, value, label, active, onClick,
}: {
  icon: React.ReactNode; value: string; label: string; active: boolean; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "card-elevated p-3 flex flex-col items-center gap-1.5 transition-all press-effect",
        active && "border-primary/25 bg-primary/5"
      )}
    >
      <div className={cn("text-muted-foreground", active && "text-primary")}>{icon}</div>
      <span className="stat-value text-base text-foreground">{value}</span>
      <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</span>
    </button>
  );
}
