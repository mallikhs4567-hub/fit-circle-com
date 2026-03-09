import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGroups, Group } from '@/hooks/useGroups';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Users, Lock, Globe, Dumbbell, PersonStanding, Bike, Flame, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const categoryIcons: Record<string, any> = {
  gym: Dumbbell,
  running: Bike,
  yoga: PersonStanding,
  calisthenics: Flame,
};

const categoryColors: Record<string, string> = {
  gym: 'bg-blue-500/20 text-blue-400',
  running: 'bg-green-500/20 text-green-400',
  yoga: 'bg-purple-500/20 text-purple-400',
  calisthenics: 'bg-orange-500/20 text-orange-400',
};

function GroupCard({ group, onJoin, isMember }: { group: Group; onJoin: (g: Group) => void; isMember: boolean }) {
  const navigate = useNavigate();
  const Icon = categoryIcons[group.category] || Dumbbell;

  return (
    <div
      onClick={() => isMember ? navigate(`/groups/${group.id}`) : undefined}
      className={`p-4 rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm space-y-3 ${isMember ? 'cursor-pointer hover:border-primary/40 transition-colors' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${categoryColors[group.category] || 'bg-primary/20 text-primary'}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm">{group.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                {group.category}
              </Badge>
              {group.privacy === 'private' ? (
                <Lock className="w-3 h-3 text-muted-foreground" />
              ) : (
                <Globe className="w-3 h-3 text-muted-foreground" />
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground text-xs">
          <Users className="w-3.5 h-3.5" />
          {group.member_count}
        </div>
      </div>
      {group.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{group.description}</p>
      )}
      {!isMember && (
        <Button
          size="sm"
          className="w-full h-8 text-xs font-semibold"
          onClick={(e) => { e.stopPropagation(); onJoin(group); }}
        >
          {group.privacy === 'public' ? 'Join' : 'Request to Join'}
        </Button>
      )}
      {isMember && (
        <Button
          size="sm"
          variant="secondary"
          className="w-full h-8 text-xs font-semibold"
          onClick={(e) => { e.stopPropagation(); navigate(`/groups/${group.id}`); }}
        >
          Open Group
        </Button>
      )}
    </div>
  );
}

export default function Groups() {
  const { groups, myGroups, loading, createGroup, joinGroup } = useGroups();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('gym');
  const [newPrivacy, setNewPrivacy] = useState('public');
  const [creating, setCreating] = useState(false);

  const myGroupIds = new Set(myGroups.map(g => g.id));
  const discoverGroups = groups.filter(g => !myGroupIds.has(g.id));
  const filtered = search
    ? discoverGroups.filter(g => g.name.toLowerCase().includes(search.toLowerCase()))
    : discoverGroups;

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const result = await createGroup(newName.trim(), newDesc.trim(), newCategory, newPrivacy);
    setCreating(false);
    if (result) {
      setShowCreate(false);
      setNewName('');
      setNewDesc('');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/40 px-4 pt-12 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold text-foreground tracking-tight" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Communities
          </h1>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 gap-1.5 text-xs font-bold rounded-xl">
                <Plus className="w-4 h-4" /> Create
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm mx-auto">
              <DialogHeader>
                <DialogTitle>Create Community</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                <Input placeholder="Group name" value={newName} onChange={e => setNewName(e.target.value)} maxLength={50} />
                <Textarea placeholder="Description (optional)" value={newDesc} onChange={e => setNewDesc(e.target.value)} maxLength={200} className="min-h-[60px] rounded-xl border-2 border-border bg-secondary" />
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gym">🏋️ Gym</SelectItem>
                    <SelectItem value="running">🏃 Running</SelectItem>
                    <SelectItem value="yoga">🧘 Yoga</SelectItem>
                    <SelectItem value="calisthenics">💪 Calisthenics</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={newPrivacy} onValueChange={setNewPrivacy}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">🌍 Public</SelectItem>
                    <SelectItem value="private">🔒 Private</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="w-full font-bold" onClick={handleCreate} disabled={creating || !newName.trim()}>
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Community'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : myGroups.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <Users className="w-12 h-12 text-muted-foreground/40 mx-auto" />
            <p className="text-sm text-muted-foreground">No communities yet</p>
            <p className="text-xs text-muted-foreground/60">Create or join a fitness community</p>
          </div>
        ) : (
          myGroups.map(g => <GroupCard key={g.id} group={g} onJoin={() => {}} isMember />)
        )}
      </div>
    </div>
  );
}
