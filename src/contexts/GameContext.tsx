import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useGameState } from '@/hooks/useGameState';
import { useGameActions } from '@/hooks/useGameActions';
import { useNavigate } from 'react-router-dom';

interface GameContextType {
  gameId: string | null;
  isVIP: boolean;
  isCreator: boolean;
  createGame: (settings?: { target_score?: number; points_per_correct?: number }) => Promise<void>;
  joinGame: (code: string) => Promise<void>;
  leaveGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [gameId, setGameId] = useState<string | null>(null);
  const { user } = useAuth();
  const { game, players } = useGameState(gameId);
  const gameActions = useGameActions();
  const navigate = useNavigate();

  const isVIP = game?.current_vip_id === user?.id;
  const isCreator = game?.creator_id === user?.id;

  const createGame = async (settings?: { target_score?: number; points_per_correct?: number }) => {
    if (!user) return;

    const newGame = await gameActions.createGame(user.id, settings);
    if (newGame) {
      setGameId(newGame.id);
      navigate('/game/waiting-room');
    }
  };

  const joinGame = async (code: string) => {
    if (!user) return;

    const game = await gameActions.joinGame(code, user.id);
    if (game) {
      setGameId(game.id);
      navigate('/game/waiting-room');
    }
  };

  const leaveGame = () => {
    setGameId(null);
    navigate('/user/home');
  };

  return (
    <GameContext.Provider
      value={{
        gameId,
        isVIP,
        isCreator,
        createGame,
        joinGame,
        leaveGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
