import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GameState {
  id: string;
  code: string;
  creator_id: string;
  current_vip_id: string | null;
  status: 'waiting' | 'playing' | 'finished';
  target_score: number;
  points_per_correct: number;
  bonus_all_correct: number;
  penalty_all_wrong: number;
  created_at?: string;
  updated_at?: string;
}

export interface Player {
  id: string;
  user_id: string;
  username: string;
  score: number;
  joined_at: string;
}

export interface Round {
  id: string;
  game_id: string;
  round_number: number;
  topic_id: string;
  vip_id: string;
  status: 'topic_selection' | 'vip_ranking' | 'player_guessing' | 'revealing' | 'complete';
  reveal_index: number;
  created_at?: string;
}

export const useGameState = (gameId: string | null) => {
  const [game, setGame] = useState<GameState | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!gameId) {
      setLoading(false);
      return;
    }

    // Initial fetch
    fetchGameData();

    // Set up real-time subscriptions
    const gameChannel = supabase
      .channel(`game-${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setGame(payload.new as GameState);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_players',
          filter: `game_id=eq.${gameId}`,
        },
        () => {
          fetchPlayers();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rounds',
          filter: `game_id=eq.${gameId}`,
        },
        () => {
          fetchCurrentRound();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(gameChannel);
    };
  }, [gameId]);

  const fetchGameData = async () => {
    if (!gameId) return;

    try {
      await Promise.all([
        fetchGame(),
        fetchPlayers(),
        fetchCurrentRound(),
      ]);
    } catch (error) {
      console.error('Error fetching game data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load game data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchGame = async () => {
    if (!gameId) return;

    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (error) throw error;
    setGame(data as GameState);
  };

  const fetchPlayers = async () => {
    if (!gameId) return;

    const { data, error } = await supabase
      .from('game_players')
      .select('*')
      .eq('game_id', gameId)
      .order('joined_at', { ascending: true });

    if (error) throw error;
    setPlayers(data || []);
  };

  const fetchCurrentRound = async () => {
    if (!gameId) return;

    const { data, error } = await supabase
      .from('rounds')
      .select('*')
      .eq('game_id', gameId)
      .order('round_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    setCurrentRound(data as Round | null);
  };

  return {
    game,
    players,
    currentRound,
    loading,
    refetch: fetchGameData,
  };
};
