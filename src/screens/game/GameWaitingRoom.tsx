import { useNavigate } from 'react-router-dom';
import { useGame } from '@/contexts/GameContext';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedCard } from '@/components/ThemedCard';
import { Users, Copy, Settings } from 'lucide-react';

export const GameWaitingRoom = () => {
  const navigate = useNavigate();
  const { gameId, isVIP, isCreator } = useGame();

  const mockPlayers = [
    { id: '1', name: 'John', avatar: '🎮' },
    { id: '2', name: 'Sarah', avatar: '🎯' },
    { id: '3', name: 'Mike', avatar: '🎲' },
  ];

  const copyCode = () => {
    navigator.clipboard.writeText('ABC123');
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-4">Waiting Room</h1>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl text-muted-foreground">Game Code:</span>
            <span className="text-4xl font-bold text-primary">ABC123</span>
            <ThemedButton variant="outline" size="icon" onClick={copyCode}>
              <Copy className="w-4 h-4" />
            </ThemedButton>
          </div>
          <p className="text-muted-foreground">Share this code with players to join</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <ThemedCard glow>
            <div className="flex items-center gap-4 mb-4">
              <Users className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Players ({mockPlayers.length})</h2>
            </div>
            <div className="space-y-3">
              {mockPlayers.map((player) => (
                <div key={player.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <span className="text-3xl">{player.avatar}</span>
                  <span className="text-lg font-semibold">{player.name}</span>
                  {player.id === '1' && (
                    <span className="ml-auto text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                      VIP
                    </span>
                  )}
                </div>
              ))}
            </div>
          </ThemedCard>

          <ThemedCard glow>
            <h2 className="text-2xl font-bold mb-4">Game Info</h2>
            <div className="space-y-4">
              <div>
                <p className="text-muted-foreground mb-1">Status</p>
                <p className="text-lg font-semibold">Waiting for players...</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Topic</p>
                <p className="text-lg font-semibold">Movies 2023</p>
              </div>
              {isVIP && (
                <ThemedButton variant="outline" className="w-full">
                  <Settings className="w-4 h-4 mr-2" />
                  Game Settings
                </ThemedButton>
              )}
            </div>
          </ThemedCard>
        </div>

        {isVIP && (
          <ThemedButton
            gradient
            glow
            size="lg"
            className="w-full"
            onClick={() => navigate('/game/topic-selection')}
          >
            Start Game
          </ThemedButton>
        )}
      </div>
    </div>
  );
};
