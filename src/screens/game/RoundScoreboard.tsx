import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedCard } from '@/components/ThemedCard';
import { useGame } from '@/contexts/GameContext';
import { useGameState } from '@/hooks/useGameState';
import { useGameActions } from '@/hooks/useGameActions';
import { useToast } from '@/hooks/use-toast';
import { Crown, Trophy } from 'lucide-react';

interface PlayerWithRoundPoints {
  id: string;
  username: string;
  score: number;
  previousScore: number;
  roundPoints: number;
}

export const RoundScoreboard = () => {
  const navigate = useNavigate();
  const { gameId, isVIP } = useGame();
  const { game, players, currentRound } = useGameState(gameId);
  const gameActions = useGameActions();
  const { toast } = useToast();
  const [playersWithPoints, setPlayersWithPoints] = useState<PlayerWithRoundPoints[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentRound || currentRound.status !== 'complete') {
      navigate('/game/waiting-room');
      return;
    }
    calculateRoundPoints();
  }, [currentRound, players]);

  const calculateRoundPoints = async () => {
    try {
      // For simplicity, we'll calculate round points as current score differences
      // In production, you'd fetch score history from a separate table
      const sorted = [...players]
        .map(p => ({
          id: p.id,
          username: p.username,
          score: p.score,
          previousScore: 0, // Would come from score history
          roundPoints: p.score, // Simplified
        }))
        .sort((a, b) => b.score - a.score);

      setPlayersWithPoints(sorted);
    } catch (error) {
      console.error('Error calculating points:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNextRound = async () => {
    if (!gameId) return;

    try {
      await gameActions.rotateVIP(gameId);
      
      toast({
        title: 'Next Round',
        description: 'New VIP selected',
      });
      
      navigate('/game/waiting-room');
    } catch (error) {
      console.error('Error starting next round:', error);
      toast({
        title: 'Error',
        description: 'Failed to start next round',
        variant: 'destructive',
      });
    }
  };

  const handleEndGame = async () => {
    if (!gameId) return;

    try {
      await gameActions.endGame(gameId);
      navigate('/game/game-over');
    } catch (error) {
      console.error('Error ending game:', error);
      toast({
        title: 'Error',
        description: 'Failed to end game',
        variant: 'destructive',
      });
    }
  };

  const checkForWinner = () => {
    if (!game) return false;
    return playersWithPoints.some(p => p.score >= game.target_score);
  };

  const hasWinner = checkForWinner();

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Calculating scores...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Trophy className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold gradient-text mb-2">
            {hasWinner ? 'Game Complete!' : 'Round Complete!'}
          </h1>
          <p className="text-muted-foreground">
            {hasWinner ? 'We have a winner!' : "Here's how everyone scored"}
          </p>
        </div>

        <div className="space-y-4 mb-8">
          {playersWithPoints.map((player, index) => (
            <ThemedCard
              key={player.id}
              glow={index === 0}
              className="hover:scale-[1.02] transition-transform"
            >
              <div className="flex items-center gap-4 p-6">
                <div className="relative">
                  {index === 0 && (
                    <Crown className="w-6 h-6 text-yellow-500 absolute -top-3 -left-2" />
                  )}
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xl font-bold">{player.username[0]}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{player.username}</h3>
                  <p className="text-sm text-muted-foreground">
                    +{player.roundPoints} points this round
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary">{player.score}</p>
                  <p className="text-sm text-muted-foreground">total</p>
                </div>
              </div>
            </ThemedCard>
          ))}
        </div>

        <div className="flex gap-4">
          {!hasWinner ? (
            <>
              <ThemedButton
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={handleNextRound}
              >
                Next Round
              </ThemedButton>
              <ThemedButton
                gradient
                glow
                size="lg"
                className="flex-1"
                onClick={handleEndGame}
              >
                End Game
              </ThemedButton>
            </>
          ) : (
            <ThemedButton
              gradient
              glow
              size="lg"
              className="w-full"
              onClick={handleEndGame}
            >
              View Final Results
            </ThemedButton>
          )}
        </div>
      </div>
    </div>
  );
};
