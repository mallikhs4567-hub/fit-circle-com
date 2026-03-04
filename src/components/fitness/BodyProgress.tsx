import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BodyMetric {
  id: string;
  posture_score: number | null;
  weight: number | null;
  created_at: string;
}

export function BodyProgress() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [weight, setWeight] = useState('');
  const [postureScore, setPostureScore] = useState('');

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('body_metrics')
        .select('id, posture_score, weight, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(30);
      if (data) setMetrics(data);
    })();
  }, [user]);

  const handleAdd = async () => {
    if (!user || (!weight && !postureScore)) return;
    const { error } = await supabase.from('body_metrics').insert({
      user_id: user.id,
      weight: weight ? parseFloat(weight) : null,
      posture_score: postureScore ? parseFloat(postureScore) : null,
    });
    if (error) {
      toast.error('Failed to log metric');
      return;
    }
    toast.success('Metric logged!');
    setWeight('');
    setPostureScore('');
    setShowForm(false);
    // Refresh
    const { data } = await supabase
      .from('body_metrics')
      .select('id, posture_score, weight, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(30);
    if (data) setMetrics(data);
  };

  const chartData = metrics.map(m => ({
    date: new Date(m.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    weight: m.weight,
    posture: m.posture_score,
  }));

  return (
    <div className="card-elevated overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4"
      >
        <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
          <TrendingUp className="w-4 h-4 text-primary" />
        </div>
        <span className="flex-1 text-sm font-semibold text-foreground text-left">Body Progress</span>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 animate-fade-up">
          {chartData.length > 1 && (
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(220 10% 55%)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(220 10% 55%)' }} width={35} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(220 18% 10%)',
                      border: '1px solid hsl(220 15% 18%)',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                  />
                  <Line type="monotone" dataKey="weight" stroke="hsl(82, 85%, 55%)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="posture" stroke="hsl(25, 95%, 55%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {chartData.length <= 1 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Log at least 2 entries to see your progress chart
            </p>
          )}

          {showForm ? (
            <div className="space-y-2">
              <input
                type="number"
                placeholder="Weight (kg)"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                className="w-full bg-secondary rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              <input
                type="number"
                placeholder="Posture score (0-100)"
                value={postureScore}
                onChange={e => setPostureScore(e.target.value)}
                className="w-full bg-secondary rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              <div className="flex gap-2">
                <button onClick={handleAdd} className="flex-1 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold">Save</button>
                <button onClick={() => setShowForm(false)} className="py-2 px-4 rounded-xl bg-secondary text-sm text-muted-foreground">Cancel</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-1 py-2 rounded-xl bg-secondary hover:bg-muted text-sm text-muted-foreground transition-colors"
            >
              <Plus className="w-4 h-4" /> Log Measurement
            </button>
          )}
        </div>
      )}
    </div>
  );
}
