import { Link } from "react-router-dom";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { fetchWeeklyLeaderboard, getCurrentISOWeek } from '../services/scoreService';
import { useState, useEffect } from 'react';
import './LandingPage.css';

function LandingPage() {
  const { primaryWallet } = useDynamicContext();
  const [leaderboard, setLeaderboard] = useState<Array<{ score: number; playerName: string }>>([]);
  const [currentWeek, setCurrentWeek] = useState<number>(1);

  useEffect(() => {
    const scores = fetchWeeklyLeaderboard();
    setLeaderboard(scores.slice(0, 3)); // Top 3
    setCurrentWeek(getCurrentISOWeek());
  }, []);

  // Generate weekly sector name based on week number
  const weeklySectorNames = [
    'Crimson Virus', 'Void Protocol', 'Dark Matrix', 'Neon Flux',
    'System Breach', 'Quantum Core', 'Data Storm', 'Cyber Pulse',
    'Grid Lock', 'Binary Warp', 'Code Cascade', 'Signal Void',
    'Neural Mesh', 'Pixel Rift', 'Vector Shift', 'Kernel Wave',
    'Digital Tide', 'Byte Storm', 'Frame Flux', 'Grid Surge',
    'Circuit Fire', 'Data Flow', 'Signal Peak', 'Neon Wave',
    'Cyber Pulse', 'Void Core', 'Matrix Lock', 'Binary Flow',
    'Quantum Flux', 'Neural Storm', 'Code Rift', 'System Core',
    'Grid Warp', 'Pixel Void', 'Vector Mesh', 'Kernel Surge',
    'Digital Peak', 'Byte Flux', 'Frame Shift', 'Circuit Tide',
    'Data Pulse', 'Signal Core', 'Neon Lock', 'Cyber Flow',
    'Void Mesh', 'Matrix Warp', 'Binary Rift', 'Quantum Lock',
    'Neural Core', 'Code Surge', 'System Flux', 'Grid Storm',
    'Pixel Core', 'Vector Lock', 'Kernel Flow', 'Digital Mesh'
  ];
  const sectorName = weeklySectorNames[(currentWeek - 1) % weeklySectorNames.length];

  const topScore = leaderboard[0]?.score || 0;
  const topPlayer = leaderboard[0]?.playerName || 'None';

  return (
    <div className="min-h-screen bg-black text-neon-green relative overflow-hidden">
      {/* Scanline overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-30">
        <div 
          className="w-full h-full"
          style={{
            background: 'repeating-linear-gradient(0deg, rgba(0, 255, 0, 0.03) 0px, rgba(0, 255, 0, 0.03) 1px, transparent 1px, transparent 2px)'
          }}
        />
      </div>

      {/* Grid background */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: 'linear-gradient(rgba(0, 255, 0, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 0, 0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-8 py-12">
        {/* Title Section */}
        <div className="text-center mb-8">
          <h1 className="text-6xl md:text-8xl font-pixel mb-4 text-neon-green" style={{ 
            textShadow: '0 0 10px #00ff00, 0 0 20px #00ff00',
            letterSpacing: '0.1em'
          }}>
            NEON SENTINEL
          </h1>
          <p className="text-xl md:text-2xl font-pixel text-red-500" style={{ letterSpacing: '0.1em' }}>
            Weekly Sector: {sectorName}
          </p>
        </div>

        {/* START GAME Button */}
        <div className="text-center mb-12">
          <Link to="/play">
            <button className="px-12 py-6 border-4 border-neon-green text-neon-green font-pixel text-2xl md:text-3xl bg-black hover:bg-neon-green hover:text-black transition-all duration-200" style={{
              textShadow: '0 0 10px #00ff00',
              boxShadow: '0 0 20px rgba(0, 255, 0, 0.3), inset 0 0 20px rgba(0, 255, 0, 0.1)',
              letterSpacing: '0.1em'
            }}>
              &gt;&gt; START GAME &lt;&lt;
            </button>
          </Link>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Left Panel: Weekly Leaderboard */}
          <div className="border-2 border-neon-green p-6 bg-black bg-opacity-50">
            <h2 className="font-pixel text-lg mb-4 text-neon-green border-b-2 border-neon-green pb-2">
              WEEKLY LEADERBOARD (Week {currentWeek})
            </h2>
            <div className="space-y-3 mb-4">
              {leaderboard.length > 0 ? (
                leaderboard.map((entry, index) => (
                  <div key={index} className="font-pixel text-sm text-neon-green">
                    {index + 1}. {entry.playerName} - {entry.score.toLocaleString()}
                  </div>
                ))
              ) : (
                <div className="font-pixel text-sm text-neon-green opacity-50">
                  No scores yet
                </div>
              )}
            </div>
            <div className="font-pixel text-xs text-neon-green border-t-2 border-neon-green pt-2">
              TOP SCORE OF THE WEEK: {topPlayer} {topScore.toLocaleString()}
            </div>
          </div>

          {/* Middle Panel: Current Depth */}
          <div className="border-2 border-neon-green p-6 bg-black bg-opacity-50">
            <h2 className="font-pixel text-lg mb-4 text-neon-green border-b-2 border-neon-green pb-2">
              Current Depth: 2 ~ FIREWALL
            </h2>
            <div className="grid grid-cols-4 gap-2">
              {['Boot Sector', 'Firewall', 'Security Core', 'Kernel Breach'].map((layer, index) => (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 border-2 border-neon-green bg-black opacity-50 flex items-center justify-center">
                    <div className="w-8 h-8 border border-neon-green" />
                  </div>
                  <p className={`font-pixel text-xs ${index === 1 ? 'text-red-500' : 'text-neon-green'}`}>
                    {layer}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel: Tournament Champions */}
          <div className="border-2 border-neon-green p-6 bg-black bg-opacity-50">
            <h2 className="font-pixel text-lg mb-4 text-neon-green border-b-2 border-neon-green pb-2">
              TOURNAMENT CHAMPIONS
            </h2>
            <div className="space-y-2 font-pixel text-sm text-neon-green">
              <div>Sector Champion: {topPlayer || 'None'}</div>
              <div className="opacity-50">Previous: Coming Soon</div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Unlocked Items */}
        <div className="border-2 border-neon-green p-6 bg-black bg-opacity-50 mb-8">
          <h2 className="font-pixel text-lg mb-4 text-neon-green border-b-2 border-neon-green pb-2">
            Unlocked: Kernel Walker &amp; Drone
          </h2>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="text-center">
                <div className="w-16 h-16 mx-auto border-2 border-neon-green bg-black opacity-50" />
                <p className="font-pixel text-xs text-neon-green mt-2">Item {item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex justify-between items-center">
          <button className="font-pixel text-neon-green hover:text-red-500 transition-colors cursor-pointer">
            &gt; HALL OF FAME
          </button>
          <div className="font-pixel text-xs text-neon-green opacity-50">
            {primaryWallet ? `Connected: ${primaryWallet.address.slice(0, 6)}...${primaryWallet.address.slice(-4)}` : 'Not Connected'}
          </div>
          <button className="font-pixel text-neon-green hover:text-red-500 transition-colors cursor-pointer">
            &gt; SETTINGS
          </button>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
