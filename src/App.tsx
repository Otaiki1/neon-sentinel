import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import LandingPage from "./pages/LandingPage";
import GamePage from "./pages/GamePage";
import LeaderboardPage from "./pages/LeaderboardPage";
import ProfilePage from "./pages/ProfilePage";
import AboutPage from "./pages/AboutPage";
import { soundManager } from "./utils/soundUtils";

function App() {
  // Global DOM click listener for UI sounds
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('a') || target.closest('.retro-button') || target.closest('[role="button"]')) {
        soundManager.playClick();
      }
    };
    
    document.addEventListener('click', handleGlobalClick, true); // Use capture phase
    return () => document.removeEventListener('click', handleGlobalClick, true);
  }, []);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/play" element={<GamePage />} />
      <Route path="/leaderboards" element={<LeaderboardPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/about" element={<AboutPage />} />
    </Routes>
  );
}

export default App;