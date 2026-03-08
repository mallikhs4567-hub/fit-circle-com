import { useWearables } from '@/hooks/useWearables';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Watch, RefreshCw, Unplug, Plus, Loader2, Footprints, Heart, Flame, Moon, Route } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function ConnectedDevices() {
  const { devices, todayActivity, loading, syncing, connectDevice, disconnectDevice, syncDevice, providers } = useWearables();

  const connectedProviders = new Set(devices.map(d => d.provider));

  return (
    <div className="space-y-4">
      {/* Connected devices */}
      {devices.length > 0 && (
        <div className="space-y-2">
          {devices.map(device => (
            <div key={device.id} className="p-3.5 rounded-xl border border-border/60 bg-card/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
                    <Watch className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{device.device_name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {device.last_sync_at
                        ? `Synced ${formatDistanceToNow(new Date(device.last_sync_at), { addSuffix: true })}`
                        : 'Never synced'}
                    </p>
                  </div>
                </div>
                <Badge variant={device.is_connected ? 'default' : 'secondary'} className="text-[10px] h-5">
                  {device.is_connected ? '● Connected' : 'Disconnected'}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-1 h-8 text-xs font-bold gap-1"
                  onClick={() => syncDevice(device.id, device.provider)}
                  disabled={syncing === device.id}
                >
                  {syncing === device.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  {syncing === device.id ? 'Syncing...' : 'Sync Now'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs text-destructive hover:text-destructive gap-1"
                  onClick={() => disconnectDevice(device.id)}
                >
                  <Unplug className="w-3.5 h-3.5" />
                  Disconnect
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Today's synced data summary */}
      {todayActivity && (
        <div className="p-3.5 rounded-xl border border-border/40 bg-card/60 space-y-2">
          <p className="text-xs font-bold text-foreground">Today's Wearable Data</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/60">
              <Footprints className="w-4 h-4 text-green-400" />
              <div>
                <p className="text-xs font-black text-foreground">{todayActivity.steps?.toLocaleString()}</p>
                <p className="text-[9px] text-muted-foreground">Steps</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/60">
              <Flame className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs font-black text-foreground">{todayActivity.calories}</p>
                <p className="text-[9px] text-muted-foreground">Calories</p>
              </div>
            </div>
            {todayActivity.heart_rate && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/60">
                <Heart className="w-4 h-4 text-red-400" />
                <div>
                  <p className="text-xs font-black text-foreground">{todayActivity.heart_rate} bpm</p>
                  <p className="text-[9px] text-muted-foreground">Heart Rate</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/60">
              <Route className="w-4 h-4 text-blue-400" />
              <div>
                <p className="text-xs font-black text-foreground">{todayActivity.distance} km</p>
                <p className="text-[9px] text-muted-foreground">Distance</p>
              </div>
            </div>
            {todayActivity.sleep_minutes && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/60 col-span-2">
                <Moon className="w-4 h-4 text-purple-400" />
                <div>
                  <p className="text-xs font-black text-foreground">
                    {Math.floor(todayActivity.sleep_minutes / 60)}h {todayActivity.sleep_minutes % 60}m
                  </p>
                  <p className="text-[9px] text-muted-foreground">Sleep</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add new device */}
      {providers.filter(p => !connectedProviders.has(p.id)).length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Add Device</p>
          {providers
            .filter(p => !connectedProviders.has(p.id))
            .map(p => (
              <button
                key={p.id}
                onClick={() => connectDevice(p.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-border/60 hover:border-primary/40 transition-colors"
              >
                <span className="text-xl">{p.icon}</span>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-foreground">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground">{p.brand}</p>
                </div>
                <Plus className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
        </div>
      )}

      {loading && devices.length === 0 && (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      )}

      {!loading && devices.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          Connect a wearable to auto-import fitness data
        </p>
      )}
    </div>
  );
}
