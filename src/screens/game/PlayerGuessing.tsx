import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedCard } from '@/components/ThemedCard';
import { DraggableItemList } from '@/components/game/DraggableItemList';
import { useGame } from '@/contexts/GameContext';
import { useAuth } from '@/contexts/AuthContext';
import { useGameState } from '@/hooks/useGameState';
import { useGameActions } from '@/hooks/useGameActions';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TopicItem {
  id: string;
  name: string;
}

export const PlayerGuessing = () => {
  const navigate = useNavigate();
  const { gameId, isVIP } = useGame();
  const { user } = useAuth();
  const { currentRound, players } = useGameState(gameId);
  const gameActions = useGameActions();
  const { toast } = useToast();
  const [items, setItems] = useState<TopicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submittedCount, setSubmittedCount] = useState(0);

  useEffect(() => {
    if (isVIP) {
      navigate('/game/waiting-room');
      return;
    }
    if (!currentRound) {
      navigate('/game/waiting-room');
      return;
    }
    fetchTopicItems();
    checkSubmissionStatus();
    subscribeToGuesses();
  }, [isVIP, currentRound]);

  const fetchTopicItems = async () => {
    if (!currentRound?.topic_id) return;

    try {
      const { data, error } = await supabase
        .from('topic_items')
        .select('*')
        .eq('topic_id', currentRound.topic_id)
        .order('position', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load items',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const checkSubmissionStatus = async () => {
    if (!currentRound || !user) return;

    try {
      const { data, error } = await supabase
        .from('guesses')
        .select('user_id')
        .eq('round_id', currentRound.id);

      if (error) throw error;

      const userIds = data?.map(g => g.user_id) || [];
      setHasSubmitted(userIds.includes(user.id));
      setSubmittedCount(new Set(userIds).size);
    } catch (error) {
      console.error('Error checking submission:', error);
    }
  };

  const subscribeToGuesses = () => {
    if (!currentRound) return;

    const channel = supabase
      .channel(`guesses-${currentRound.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'guesses',
          filter: `round_id=eq.${currentRound.id}`,
        },
        () => {
          checkSubmissionStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleReorder = (reorderedItems: TopicItem[]) => {
    setItems(reorderedItems);
  };

  const handleSubmit = async () => {
    if (!currentRound || !user || items.length === 0) return;

    setSubmitting(true);
    try {
      await gameActions.submitGuess(currentRound.id, user.id, items);
      setHasSubmitted(true);
      
      toast({
        title: 'Guess Submitted',
        description: 'Waiting for other players',
      });
    } catch (error) {
      console.error('Error submitting guess:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit guess',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Loading items...</p>
      </div>
    );
  }

  const nonVIPCount = players.filter(p => p.user_id !== currentRound?.vip_id).length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">Guess the Ranking</h1>
          <p className="text-muted-foreground">Drag to arrange from highest to lowest</p>
        </div>

        <ThemedCard glow>
          <DraggableItemList
            items={items}
            onReorder={handleReorder}
            disabled={hasSubmitted}
          />

          <ThemedButton
            gradient
            glow
            size="lg"
            className="w-full mt-6"
            onClick={handleSubmit}
            disabled={submitting || hasSubmitted}
          >
            {hasSubmitted ? 'Submitted!' : submitting ? 'Submitting...' : 'Submit Ranking'}
          </ThemedButton>
        </ThemedCard>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg text-center">
          <p className="text-sm text-muted-foreground">
            {submittedCount} of {nonVIPCount} players have submitted
            {submittedCount < nonVIPCount && ' • Waiting for others...'}
          </p>
        </div>
      </div>
    </div>
  );
};
