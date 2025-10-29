import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedCard } from '@/components/ThemedCard';
import { DraggableItemList } from '@/components/game/DraggableItemList';
import { useGame } from '@/contexts/GameContext';
import { useGameState } from '@/hooks/useGameState';
import { useGameActions } from '@/hooks/useGameActions';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TopicItem {
  id: string;
  name: string;
}

export const VIPRanking = () => {
  const navigate = useNavigate();
  const { gameId, isVIP } = useGame();
  const { currentRound } = useGameState(gameId);
  const gameActions = useGameActions();
  const { toast } = useToast();
  const [items, setItems] = useState<TopicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isVIP) {
      navigate('/game/waiting-room');
      return;
    }
    if (!currentRound) {
      navigate('/game/topic-selection');
      return;
    }
    fetchTopicItems();
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

  const handleReorder = (reorderedItems: TopicItem[]) => {
    setItems(reorderedItems);
  };

  const handleSubmit = async () => {
    if (!currentRound || items.length === 0) return;

    setSubmitting(true);
    try {
      await gameActions.submitRanking(currentRound.id, items);
      await gameActions.updateRoundStatus(currentRound.id, 'player_guessing');
      
      toast({
        title: 'Ranking Submitted',
        description: 'Waiting for players to guess',
      });
      
      navigate('/game/waiting-room');
    } catch (error) {
      console.error('Error submitting ranking:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit ranking',
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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">Rank the Items</h1>
          <p className="text-muted-foreground">As VIP, set the correct order from highest to lowest</p>
        </div>

        <ThemedCard glow>
          <DraggableItemList
            items={items}
            onReorder={handleReorder}
          />

          <ThemedButton
            gradient
            glow
            size="lg"
            className="w-full mt-6"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Confirm Ranking'}
          </ThemedButton>
        </ThemedCard>
      </div>
    </div>
  );
};
