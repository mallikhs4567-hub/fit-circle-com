import { UserDiscovery } from '@/components/discover/UserDiscovery';
import { useNavigate } from 'react-router-dom';

export default function Search() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border safe-top">
        <div className="px-4 py-3">
          <h1 className="text-xl font-display font-bold text-foreground">Discover</h1>
          <p className="text-sm text-muted-foreground">Find and connect with people</p>
        </div>
      </header>

      {/* User Discovery Component */}
      <UserDiscovery 
        onSelectUser={(userId) => {
          navigate('/chat', { state: { selectedUserId: userId } });
        }} 
      />
    </div>
  );
}
