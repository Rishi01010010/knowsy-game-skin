import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedCard } from '@/components/ThemedCard';
import { RevealCard } from '@/components/game/RevealCard';
import { useGame } from '@/contexts/GameContext';
import { useGameState } from '@/hooks/useGameState';
import { useGameActions } from '@/hooks/useGameActions';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Trophy } from 'lucide-react';

interface RankingWithItem {
  position: number;
  item_name: string;
  item_id: string;
}

interface GuessWithItem {
  user_id: string;
  username: string;
  position: number;
  item_name: string;
  is_correct: boolean | null;
}

export const RevealAnimation = () => {
  const navigate = useNavigate();
  const { gameId, isVIP } = useGame();
  const { currentRound } = useGameState(gameId);
  const gameActions = useGameActions();
  const { toast } = useToast();
  const [rankings, setRankings] = useState<RankingWithItem[]>([]);
  const [guesses, setGuesses] = useState<GuessWithItem[]>([]);
  const [revealIndex, setRevealIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentRound) {
      navigate('/game/waiting-room');
      return;
    }
    if (currentRound.status !== 'revealing') {
      navigate('/game/waiting-room');
      return;
    }
    fetchRevealData();
    subscribeToReveal();
  }, [currentRound]);

  const fetchRevealData = async () => {
    if (!currentRound) return;

    try {
      // Fetch rankings with item names
      const { data: rankingsData, error: rankingsError } = await supabase
        .from('rankings')
        .select('position, item_id, topic_items(name)')
        .eq('round_id', currentRound.id)
        .order('position', { ascending: true });

      if (rankingsError) throw rankingsError;

      const formattedRankings: RankingWithItem[] = (rankingsData || []).map((r: any) => ({
        position: r.position,
        item_name: r.topic_items?.name || 'Unknown',
        item_id: r.item_id,
      }));

      setRankings(formattedRankings);

      // Fetch guesses with usernames
      const { data: guessesData, error: guessesError } = await supabase
        .from('guesses')
        .select('user_id, position, item_id, is_correct, game_players(username)')
        .eq('round_id', currentRound.id);

      if (guessesError) throw guessesError;

      const { data: itemsData } = await supabase
        .from('topic_items')
        .select('id, name')
        .in('id', guessesData?.map((g: any) => g.item_id) || []);

      const itemsMap = new Map(itemsData?.map(i => [i.id, i.name]) || []);

      const formattedGuesses: GuessWithItem[] = (guessesData || []).map((g: any) => ({
        user_id: g.user_id,
        username: g.game_players?.username || 'Unknown',
        position: g.position,
        item_name: itemsMap.get(g.item_id) || 'Unknown',
        is_correct: g.is_correct,
      }));

      setGuesses(formattedGuesses);
      setRevealIndex(currentRound.reveal_index);
    } catch (error) {
      console.error('Error fetching reveal data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reveal data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToReveal = () => {
    if (!currentRound) return;

    const channel = supabase
      .channel(`round-${currentRound.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rounds',
          filter: `id=eq.${currentRound.id}`,
        },
        (payload: any) => {
          setRevealIndex(payload.new.reveal_index);
          if (payload.new.status === 'complete') {
            navigate('/game/scoreboard');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleRevealNext = async () => {
    if (!currentRound || revealIndex >= rankings.length) return;

    try {
      const newIndex = revealIndex + 1;
      await gameActions.updateRevealIndex(currentRound.id, newIndex);

      if (newIndex >= rankings.length) {
        await gameActions.calculateScores(currentRound.id);
        await gameActions.updateRoundStatus(currentRound.id, 'complete');
      }
    } catch (error) {
      console.error('Error revealing next:', error);
      toast({
        title: 'Error',
        description: 'Failed to reveal next item',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Loading results...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Trophy className="w-16 h-16 text-primary mx-auto mb-4 animate-bounce" />
          <h1 className="text-4xl font-bold gradient-text mb-2">The Results Are In!</h1>
          <p className="text-muted-foreground">Revealing the correct ranking...</p>
        </div>

        <div className="space-y-6 mb-8">
          {rankings.map((ranking, index) => {
            const isRevealed = index < revealIndex;
            const positionGuesses = guesses.filter(g => g.position === ranking.position + 1);

            return (
              <div key={ranking.position}>
                <ThemedCard
                  glow={isRevealed}
                  className={`transition-all duration-500 ${
                    isRevealed ? 'animate-fade-in' : 'opacity-50'
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-2xl">
                        {ranking.position + 1}
                      </div>
                      <span className="text-2xl font-bold flex-1">
                        {isRevealed ? ranking.item_name : '???'}
                      </span>
                    </div>

                    {isRevealed && positionGuesses.length > 0 && (
                      <div className="space-y-2 mt-4 pt-4 border-t border-border">
                        {positionGuesses.map((guess, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span>{guess.username}: {guess.item_name}</span>
                            <span className={guess.is_correct ? 'text-green-500' : 'text-red-500'}>
                              {guess.is_correct ? '✓' : '✗'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ThemedCard>
              </div>
            );
          })}
        </div>

        {isVIP && revealIndex < rankings.length && (
          <ThemedButton
            gradient
            glow
            size="lg"
            className="w-full"
            onClick={handleRevealNext}
          >
            Reveal Next
          </ThemedButton>
        )}

        {revealIndex >= rankings.length && (
          <ThemedButton
            gradient
            glow
            size="lg"
            className="w-full"
            onClick={() => navigate('/game/scoreboard')}
          >
            View Scoreboard
          </ThemedButton>
        )}
      </div>
    </div>
  );
};
