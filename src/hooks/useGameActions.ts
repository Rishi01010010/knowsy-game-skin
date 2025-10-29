import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useGameActions = () => {
  const { toast } = useToast();

  const createGame = async (userId: string, settings?: {
    target_score?: number;
    points_per_correct?: number;
    bonus_all_correct?: number;
    penalty_all_wrong?: number;
  }) => {
    try {
      // Generate unique 6-character code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert({
          code,
          creator_id: userId,
          current_vip_id: userId,
          ...settings,
        })
        .select()
        .single();

      if (gameError) throw gameError;

      // Get user profile for username
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single();

      // Add creator as first player
      const { error: playerError } = await supabase
        .from('game_players')
        .insert({
          game_id: game.id,
          user_id: userId,
          username: profile?.username || 'Player',
        });

      if (playerError) throw playerError;

      return game;
    } catch (error) {
      console.error('Error creating game:', error);
      toast({
        title: 'Error',
        description: 'Failed to create game',
        variant: 'destructive',
      });
      return null;
    }
  };

  const joinGame = async (code: string, userId: string) => {
    try {
      // Find game by code
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('id')
        .eq('code', code)
        .single();

      if (gameError) throw new Error('Game not found');

      // Check if already in game
      const { data: existing } = await supabase
        .from('game_players')
        .select('id')
        .eq('game_id', game.id)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        return game;
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single();

      // Join game
      const { error: joinError } = await supabase
        .from('game_players')
        .insert({
          game_id: game.id,
          user_id: userId,
          username: profile?.username || 'Player',
        });

      if (joinError) throw joinError;

      return game;
    } catch (error) {
      console.error('Error joining game:', error);
      toast({
        title: 'Error',
        description: 'Failed to join game',
        variant: 'destructive',
      });
      return null;
    }
  };

  const startRound = async (gameId: string, vipId: string, roundNumber: number) => {
    try {
      // Update game status to playing
      await supabase
        .from('games')
        .update({ status: 'playing' })
        .eq('id', gameId);

      return true;
    } catch (error) {
      console.error('Error starting round:', error);
      toast({
        title: 'Error',
        description: 'Failed to start round',
        variant: 'destructive',
      });
      return false;
    }
  };

  const selectTopic = async (
    gameId: string,
    topicId: string,
    vipId: string,
    roundNumber: number
  ) => {
    try {
      const { data, error } = await supabase
        .from('rounds')
        .insert({
          game_id: gameId,
          topic_id: topicId,
          vip_id: vipId,
          round_number: roundNumber,
          status: 'vip_ranking',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error selecting topic:', error);
      toast({
        title: 'Error',
        description: 'Failed to select topic',
        variant: 'destructive',
      });
      return null;
    }
  };

  const submitVIPRanking = async (roundId: string, rankings: { itemId: string; position: number }[]) => {
    try {
      // Insert rankings
      const { error: rankError } = await supabase
        .from('rankings')
        .insert(
          rankings.map((r) => ({
            round_id: roundId,
            item_id: r.itemId,
            position: r.position,
          }))
        );

      if (rankError) throw rankError;

      // Update round status
      const { error: updateError } = await supabase
        .from('rounds')
        .update({ status: 'player_guessing' })
        .eq('id', roundId);

      if (updateError) throw updateError;

      return true;
    } catch (error) {
      console.error('Error submitting VIP ranking:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit ranking',
        variant: 'destructive',
      });
      return false;
    }
  };

  const submitGuess = async (
    roundId: string,
    userId: string,
    guesses: { itemId: string; position: number }[]
  ) => {
    try {
      // Get VIP rankings to compare
      const { data: rankings } = await supabase
        .from('rankings')
        .select('item_id, position')
        .eq('round_id', roundId);

      if (!rankings) throw new Error('Rankings not found');

      // Calculate correctness
      const guessesWithCorrectness = guesses.map((g) => {
        const correctRanking = rankings.find((r) => r.item_id === g.itemId);
        return {
          round_id: roundId,
          user_id: userId,
          item_id: g.itemId,
          position: g.position,
          is_correct: correctRanking?.position === g.position,
        };
      });

      // Insert guesses
      const { error } = await supabase
        .from('guesses')
        .insert(guessesWithCorrectness);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error submitting guess:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit guess',
        variant: 'destructive',
      });
      return false;
    }
  };

  const startReveal = async (roundId: string) => {
    try {
      const { error } = await supabase
        .from('rounds')
        .update({ status: 'revealing', reveal_index: 1 })
        .eq('id', roundId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error starting reveal:', error);
      toast({
        title: 'Error',
        description: 'Failed to start reveal',
        variant: 'destructive',
      });
      return false;
    }
  };

  const revealNext = async (roundId: string, currentIndex: number, totalItems: number) => {
    try {
      const nextIndex = currentIndex + 1;

      if (nextIndex > totalItems) {
        // Round complete
        await supabase
          .from('rounds')
          .update({ status: 'complete' })
          .eq('id', roundId);

        // Calculate and update scores
        await calculateScores(roundId);
      } else {
        await supabase
          .from('rounds')
          .update({ reveal_index: nextIndex })
          .eq('id', roundId);
      }

      return true;
    } catch (error) {
      console.error('Error revealing next:', error);
      toast({
        title: 'Error',
        description: 'Failed to reveal next item',
        variant: 'destructive',
      });
      return false;
    }
  };

  const calculateScores = async (roundId: string) => {
    try {
      // Get round and game info
      const { data: round } = await supabase
        .from('rounds')
        .select('game_id')
        .eq('id', roundId)
        .single();

      if (!round) throw new Error('Round not found');

      const { data: game } = await supabase
        .from('games')
        .select('points_per_correct, bonus_all_correct, penalty_all_wrong')
        .eq('id', round.game_id)
        .single();

      if (!game) throw new Error('Game not found');

      // Get all guesses
      const { data: guesses } = await supabase
        .from('guesses')
        .select('user_id, is_correct')
        .eq('round_id', roundId);

      if (!guesses) return;

      // Calculate scores per player
      const scoreUpdates: { [userId: string]: number } = {};

      guesses.forEach((guess) => {
        if (!scoreUpdates[guess.user_id]) {
          scoreUpdates[guess.user_id] = 0;
        }

        if (guess.is_correct) {
          scoreUpdates[guess.user_id] += game.points_per_correct;
        }
      });

      // Apply bonuses/penalties
      Object.keys(scoreUpdates).forEach((userId) => {
        const userGuesses = guesses.filter((g) => g.user_id === userId);
        const allCorrect = userGuesses.every((g) => g.is_correct);
        const allWrong = userGuesses.every((g) => !g.is_correct);

        if (allCorrect) {
          scoreUpdates[userId] += game.bonus_all_correct;
        } else if (allWrong) {
          scoreUpdates[userId] += game.penalty_all_wrong;
        }
      });

      // Update player scores
      for (const [userId, scoreChange] of Object.entries(scoreUpdates)) {
        const { data: player } = await supabase
          .from('game_players')
          .select('score')
          .eq('game_id', round.game_id)
          .eq('user_id', userId)
          .single();

        if (player) {
          await supabase
            .from('game_players')
            .update({ score: player.score + scoreChange })
            .eq('game_id', round.game_id)
            .eq('user_id', userId);
        }
      }

      // Check if game is over
      const { data: players } = await supabase
        .from('game_players')
        .select('score')
        .eq('game_id', round.game_id);

      const { data: fullGame } = await supabase
        .from('games')
        .select('target_score')
        .eq('id', round.game_id)
        .single();

      const targetScore = fullGame?.target_score || 1000;
      if (players && players.some((p) => p.score >= targetScore)) {
        await supabase
          .from('games')
          .update({ status: 'finished' })
          .eq('id', round.game_id);
      }
    } catch (error) {
      console.error('Error calculating scores:', error);
    }
  };

  const rotateVIP = async (gameId: string, players: { user_id: string }[]) => {
    try {
      const { data: game } = await supabase
        .from('games')
        .select('current_vip_id')
        .eq('id', gameId)
        .single();

      if (!game || !game.current_vip_id) return false;

      const currentIndex = players.findIndex((p) => p.user_id === game.current_vip_id);
      const nextIndex = (currentIndex + 1) % players.length;
      const nextVIP = players[nextIndex].user_id;

      const { error } = await supabase
        .from('games')
        .update({ current_vip_id: nextVIP })
        .eq('id', gameId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error rotating VIP:', error);
      return false;
    }
  };

  const passVIP = async (gameId: string, players: { user_id: string }[]) => {
    return rotateVIP(gameId, players);
  };

  return {
    createGame,
    joinGame,
    startRound,
    selectTopic,
    submitVIPRanking,
    submitGuess,
    startReveal,
    revealNext,
    rotateVIP,
    passVIP,
  };
};
