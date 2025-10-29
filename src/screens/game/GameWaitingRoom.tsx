import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '@/contexts/GameContext';
import { useGameState } from '@/hooks/useGameState';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedCard } from '@/components/ThemedCard';
import { useToast } from '@/hooks/use-toast';
import { Users, Copy, Settings } from 'lucide-react';

export const GameWaitingRoom = () => {
  const navigate = useNavigate();
  const { gameId, isVIP, isCreator } = useGame();
  const { game, players, currentRound, loading } = useGameState(gameId);
  const { toast } = useToast();

  useEffect(() => {
    if (!gameId) {
      navigate('/user/home');
      return;
    }

    // Auto-navigate based on round status
    if (currentRound) {
      switch (currentRound.status) {
        case 'topic_selection':
          if (isVIP) navigate('/game/topic-selection');
          break;
        case 'vip_ranking':
          if (isVIP) navigate('/game/vip-ranking');
          break;
        case 'player_guessing':
          if (!isVIP) navigate('/game/guessing');
          break;
        case 'revealing':
          navigate('/game/reveal');
          break;
        case 'complete':
          navigate('/game/scoreboard');
          break;
      }
    }
  }, [currentRound, isVIP, gameId]);

  const copyCode = () => {
    if (game?.code) {
      navigator.clipboard.writeText(game.code);
      toast({
        title: 'Code Copied',
        description: 'Game code copied to clipboard',
      });
    }
  };

  const handleStartGame = () => {
    if (isVIP) {
      navigate('/game/topic-selection');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Loading game...</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Game not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-4">Waiting Room</h1>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl text-muted-foreground">Game Code:</span>
            <span className="text-4xl font-bold text-primary">{game.code}</span>
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
              <h2 className="text-2xl font-bold">Players ({players.length})</h2>
            </div>
            <div className="space-y-3">
              {players.map((player) => (
                <div key={player.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-lg font-bold">{player.username[0]}</span>
                  </div>
                  <span className="text-lg font-semibold">{player.username}</span>
                  {player.user_id === game.current_vip_id && (
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
                <p className="text-lg font-semibold capitalize">{game.status.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Target Score</p>
                <p className="text-lg font-semibold">{game.target_score} points</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Points per Correct</p>
                <p className="text-lg font-semibold">{game.points_per_correct}</p>
              </div>
              {isCreator && (
                <ThemedButton 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/game/settings')}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Game Settings
                </ThemedButton>
              )}
            </div>
          </ThemedCard>
        </div>

        {isVIP && !currentRound && players.length >= 2 && (
          <ThemedButton
            gradient
            glow
            size="lg"
            className="w-full"
            onClick={handleStartGame}
          >
            Start Game
          </ThemedButton>
        )}

        {isVIP && players.length < 2 && (
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-muted-foreground">
              Waiting for at least 2 players to start the game...
            </p>
          </div>
        )}

        {!isVIP && (
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-muted-foreground">
              Waiting for VIP to start the game...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
