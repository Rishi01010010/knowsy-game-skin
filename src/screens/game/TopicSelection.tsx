import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedCard } from '@/components/ThemedCard';
import { useGame } from '@/contexts/GameContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useGameActions } from '@/hooks/useGameActions';
import { useGameState } from '@/hooks/useGameState';
import { useToast } from '@/hooks/use-toast';
import { Edit } from 'lucide-react';

interface Topic {
  id: string;
  name: string;
  is_editable: boolean;
  created_by: string | null;
  item_count?: number;
}

export const TopicSelection = () => {
  const navigate = useNavigate();
  const { gameId, isVIP } = useGame();
  const { user } = useAuth();
  const { game } = useGameState(gameId);
  const gameActions = useGameActions();
  const { toast } = useToast();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isVIP) {
      navigate('/game/waiting-room');
      return;
    }
    fetchTopics();
  }, [isVIP]);

  const fetchTopics = async () => {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*, topic_items(count)');
      
      if (error) throw error;
      
      const formattedTopics: Topic[] = data.map((topic: any) => ({
        id: topic.id,
        name: topic.name,
        is_editable: topic.is_editable,
        created_by: topic.created_by,
        item_count: topic.topic_items[0]?.count || 0,
      }));
      
      setTopics(formattedTopics);
    } catch (error) {
      console.error('Error fetching topics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load topics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTopicSelect = async (topicId: string) => {
    if (!gameId || !user) return;

    try {
      const round = await gameActions.createRound(gameId, topicId, user.id);
      if (round) {
        navigate('/game/vip-ranking');
      }
    } catch (error) {
      console.error('Error selecting topic:', error);
      toast({
        title: 'Error',
        description: 'Failed to start round',
        variant: 'destructive',
      });
    }
  };

  const handlePassTurn = async () => {
    if (!gameId) return;
    
    try {
      await gameActions.rotateVIP(gameId);
      toast({
        title: 'VIP Passed',
        description: 'Next player is now VIP',
      });
      navigate('/game/waiting-room');
    } catch (error) {
      console.error('Error passing turn:', error);
      toast({
        title: 'Error',
        description: 'Failed to pass turn',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Loading topics...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">Choose Topic</h1>
          <p className="text-muted-foreground">VIP: Select the topic for this round</p>
        </div>

        <div className="space-y-4 mb-6">
          {topics.map((topic) => (
            <ThemedCard key={topic.id} glow className="hover:scale-[1.02] transition-transform">
              <button 
                onClick={() => handleTopicSelect(topic.id)} 
                className="w-full text-left p-6 flex items-center justify-between"
              >
                <div>
                  <h3 className="text-2xl font-bold">{topic.name}</h3>
                  <p className="text-muted-foreground">{topic.item_count} items to rank</p>
                </div>
                {topic.is_editable && game?.creator_id === user?.id && (
                  <Edit className="w-5 h-5 text-primary" />
                )}
              </button>
            </ThemedCard>
          ))}
        </div>

        <ThemedButton
          variant="outline"
          size="lg"
          className="w-full"
          onClick={handlePassTurn}
        >
          Pass Turn
        </ThemedButton>
      </div>
    </div>
  );
};
