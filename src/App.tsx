import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SkinProvider } from "@/contexts/SkinContext";
import { GameProvider } from "@/contexts/GameContext";

// Auth Screens
import { SplashScreen } from "@/screens/auth/SplashScreen";
import { LoginScreen } from "@/screens/auth/LoginScreen";
import { SignupScreen } from "@/screens/auth/SignupScreen";

// Entity Screens
import { EntityDashboard } from "@/screens/entity/EntityDashboard";
import { TopicList } from "@/screens/entity/TopicList";
import { TopicForm } from "@/screens/entity/TopicForm";
import { SkinningScraping } from "@/screens/entity/SkinningScraping";
import { EntityQRCode } from "@/screens/entity/EntityQRCode";
import { DataMiningDashboard } from "@/screens/entity/DataMiningDashboard";

// User Screens
import { UserHome } from "@/screens/user/UserHome";
import { EntitySpaceLanding } from "@/screens/user/EntitySpaceLanding";
import { GameLobby } from "@/screens/user/GameLobby";
import { CreateGameScreen } from "@/screens/user/CreateGameScreen";

// Game Screens
import { JoinGameInput } from "@/screens/game/JoinGameInput";
import { GameWaitingRoom } from "@/screens/game/GameWaitingRoom";
import { TopicSelection } from "@/screens/game/TopicSelection";
import { VIPRanking } from "@/screens/game/VIPRanking";
import { PlayerGuessing } from "@/screens/game/PlayerGuessing";
import { RevealAnimation } from "@/screens/game/RevealAnimation";
import { RoundScoreboard } from "@/screens/game/RoundScoreboard";
import { GameOverScreen } from "@/screens/game/GameOverScreen";
import { GameSettings } from "@/screens/game/GameSettings";
import { InvitePlayers } from "@/screens/game/InvitePlayers";
import { InGameChat } from "@/screens/game/InGameChat";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/splash" element={<SplashScreen />} />
      <Route path="/login" element={!user ? <LoginScreen /> : <Navigate to={user.isEntity ? "/entity/dashboard" : "/user/home"} />} />
      <Route path="/signup" element={!user ? <SignupScreen /> : <Navigate to={user.isEntity ? "/entity/dashboard" : "/user/home"} />} />

      {/* Entity Routes */}
      <Route path="/entity/dashboard" element={user?.isEntity ? <EntityDashboard /> : <Navigate to="/login" />} />
      <Route path="/entity/topics" element={user?.isEntity ? <TopicList /> : <Navigate to="/login" />} />
      <Route path="/entity/topics/new" element={user?.isEntity ? <TopicForm /> : <Navigate to="/login" />} />
      <Route path="/entity/topics/:topicId" element={user?.isEntity ? <TopicForm /> : <Navigate to="/login" />} />
      <Route path="/entity/skinning" element={user?.isEntity ? <SkinningScraping /> : <Navigate to="/login" />} />
      <Route path="/entity/qr-code" element={user?.isEntity ? <EntityQRCode /> : <Navigate to="/login" />} />
      <Route path="/entity/analytics" element={user?.isEntity ? <DataMiningDashboard /> : <Navigate to="/login" />} />

      {/* User Routes */}
      <Route path="/user/home" element={user && !user.isEntity ? <UserHome /> : <Navigate to="/login" />} />
      <Route path="/entity-space/:entityId" element={user ? <EntitySpaceLanding /> : <Navigate to="/login" />} />
      <Route path="/game-lobby/:entityId" element={user ? <GameLobby /> : <Navigate to="/login" />} />
      <Route path="/create-game/:entityId" element={user ? <CreateGameScreen /> : <Navigate to="/login" />} />
      <Route path="/join-game/:entityId" element={user ? <JoinGameInput /> : <Navigate to="/login" />} />

      {/* Game Routes */}
      <Route path="/game/waiting-room" element={user ? <GameWaitingRoom /> : <Navigate to="/login" />} />
      <Route path="/game/topic-selection" element={user ? <TopicSelection /> : <Navigate to="/login" />} />
      <Route path="/game/vip-ranking" element={user ? <VIPRanking /> : <Navigate to="/login" />} />
      <Route path="/game/guessing" element={user ? <PlayerGuessing /> : <Navigate to="/login" />} />
      <Route path="/game/reveal" element={user ? <RevealAnimation /> : <Navigate to="/login" />} />
      <Route path="/game/scoreboard" element={user ? <RoundScoreboard /> : <Navigate to="/login" />} />
      <Route path="/game/game-over" element={user ? <GameOverScreen /> : <Navigate to="/login" />} />
      <Route path="/game/settings" element={user ? <GameSettings /> : <Navigate to="/login" />} />
      <Route path="/game/invite" element={user ? <InvitePlayers /> : <Navigate to="/login" />} />
      <Route path="/game/chat" element={user ? <InGameChat /> : <Navigate to="/login" />} />

      {/* Root Redirect */}
      <Route path="/" element={<Navigate to={user ? (user.isEntity ? "/entity/dashboard" : "/user/home") : "/login"} />} />
      
      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SkinProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <GameProvider>
              <AppRoutes />
            </GameProvider>
          </BrowserRouter>
        </TooltipProvider>
      </SkinProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
