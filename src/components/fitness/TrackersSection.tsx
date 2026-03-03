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
        className="flex items-center justify-between w-full"
      >
        <h2 className="text-sm font-semibold text-foreground">Daily Trackers</h2>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Compact tracker row always visible */}
      <div className="grid grid-cols-4 gap-2">
        <TrackerChip
          icon={<Droplets className="w-3.5 h-3.5" />}
          value={`${water}/8`}
          label="Water"
          active={water >= 8}
          onClick={onAddWater}
        />
        <TrackerChip
          icon={<Footprints className="w-3.5 h-3.5" />}
          value={steps >= 1000 ? `${(steps / 1000).toFixed(1)}k` : `${steps}`}
          label="Steps"
          active={steps >= 8000}
        />
        <TrackerChip
          icon={<Moon className="w-3.5 h-3.5" />}
          value={`${sleep}h`}
          label="Sleep"
          active={sleep >= 7}
        />
        <TrackerChip
          icon={<Scale className="w-3.5 h-3.5" />}
          value={weightLog.length > 0 ? `${weightLog[weightLog.length - 1].value}` : '—'}
          label="Weight"
          active={false}
        />
      </div>

      {expanded && (
        <div className="space-y-3 animate-fade-up">
          {/* Water */}
          <div className="card-elevated p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-foreground">Water Intake</span>
              </div>
              <span className="text-xs text-muted-foreground">{water} / 8 glasses</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onRemoveWater} className="p-1.5 rounded-lg bg-secondary hover:bg-muted transition-colors">
                <Minus className="w-3 h-3 text-muted-foreground" />
              </button>
              <div className="flex-1 flex gap-1">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex-1 h-4 rounded-sm transition-all",
                      i < water ? "bg-primary/60" : "bg-secondary"
                    )}
                  />
                ))}
              </div>
              <button onClick={onAddWater} className="p-1.5 rounded-lg bg-secondary hover:bg-muted transition-colors">
                <Plus className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Steps */}
          <div className="card-elevated p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Footprints className="w-4 h-4 text-accent" />
                <span className="text-xs font-medium text-foreground">Steps</span>
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
              className="w-full h-1.5 bg-secondary rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>

          {/* Sleep */}
          <div className="card-elevated p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">Sleep</span>
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
              className="w-full h-1.5 bg-secondary rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>

          {/* Weight log */}
          <div className="card-elevated p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-success" />
                <span className="text-xs font-medium text-foreground">Weight Log</span>
              </div>
            </div>
            {weightLog.length > 1 && (
              <div className="flex items-end gap-1 h-12 mb-2">
                {weightLog.slice(-7).map((w, i, arr) => {
                  const min = Math.min(...arr.map(a => a.value));
                  const max = Math.max(...arr.map(a => a.value));
                  const range = max - min || 1;
                  const height = ((w.value - min) / range) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end">
                      <div
                        className="w-full rounded-t bg-primary/40"
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
                className="flex-1 bg-secondary rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary transition-colors"
              />
              <button
                onClick={() => {
                  const v = parseFloat(weightInput);
                  if (v > 0) { onLogWeight(v); setWeightInput(''); }
                }}
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium"
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
        "card-elevated p-2.5 flex flex-col items-center gap-1 transition-all",
        active && "border-primary/30"
      )}
    >
      <div className={cn("text-muted-foreground", active && "text-primary")}>{icon}</div>
      <span className="text-xs font-semibold text-foreground">{value}</span>
      <span className="text-[9px] text-muted-foreground">{label}</span>
    </button>
  );
}
