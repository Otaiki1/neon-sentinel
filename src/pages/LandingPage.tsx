import { Link } from "react-router-dom";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { fetchWeeklyLeaderboard, getCurrentISOWeek } from '../services/scoreService';
import { PLAYER_KERNELS } from '../game/config';
import { getKernelState, getKernelUnlocks, getSelectedKernelKey, setSelectedKernelKey } from '../services/kernelService';
import { useState, useEffect } from 'react';
import logoImage from '../assets/logo.png';
import WalletConnectionModal from '../components/WalletConnectionModal';
import StoryModal from '../components/StoryModal';
import './LandingPage.css';

const WALLET_MODAL_SEEN_KEY = 'neon-sentinel-wallet-modal-seen';
const USER_MODE_KEY = 'neon-sentinel-user-mode';
const STORY_MODAL_SEEN_KEY = 'neon-sentinel-story-modal-seen';

export type UserMode = 'wallet' | 'anonymous';

export function getUserMode(): UserMode | null {
  const stored = localStorage.getItem(USER_MODE_KEY);
  return (stored === 'wallet' || stored === 'anonymous') ? stored : null;
}

export function setUserMode(mode: UserMode): void {
  localStorage.setItem(USER_MODE_KEY, mode);
}

function LandingPage() {
  const { primaryWallet } = useDynamicContext();
  const [leaderboard, setLeaderboard] = useState<
    Array<{ score: number; playerName: string; prestigeLevel?: number }>
  >([]);
  const [currentWeek, setCurrentWeek] = useState<number>(1);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [kernelUnlocks, setKernelUnlocks] = useState(getKernelUnlocks());
  const [selectedKernel, setSelectedKernel] = useState(getSelectedKernelKey());

  useEffect(() => {
    const scores = fetchWeeklyLeaderboard();
    setLeaderboard(scores.slice(0, 3)); // Top 3
    setCurrentWeek(getCurrentISOWeek());
    const kernelState = getKernelState();
    setKernelUnlocks(kernelState.unlocked);
    setSelectedKernel(kernelState.selectedKernel);
  }, []);

  // Show wallet modal on first visit if wallet not connected
  useEffect(() => {
    const hasSeenModal = localStorage.getItem(WALLET_MODAL_SEEN_KEY) === 'true';
    const userMode = getUserMode();
    const isWalletConnected = !!primaryWallet;

    // Show modal if:
    // 1. User hasn't seen the modal before
    // 2. No wallet is connected
    // 3. No user mode is set (first visit)
    if (!hasSeenModal && !isWalletConnected && !userMode) {
      setShowWalletModal(true);
    }
  }, [primaryWallet]);

  const handleCloseModal = () => {
    setShowWalletModal(false);
    localStorage.setItem(WALLET_MODAL_SEEN_KEY, 'true');
  };

  const handleAnonymous = () => {
    setUserMode('anonymous');
    handleCloseModal();
  };

  const handleCloseStoryModal = () => {
    setShowStoryModal(false);
    localStorage.setItem(STORY_MODAL_SEEN_KEY, 'true');
  };

  const handleKernelSelect = (key: keyof typeof PLAYER_KERNELS) => {
    const next = setSelectedKernelKey(key);
    setSelectedKernel(next);
  };


  // Update user mode when wallet connects
  useEffect(() => {
    if (primaryWallet) {
      setUserMode('wallet');
    }
  }, [primaryWallet]);

  useEffect(() => {
    const hasSeenStory = localStorage.getItem(STORY_MODAL_SEEN_KEY) === 'true';
    const userMode = getUserMode();
    const isWalletConnected = !!primaryWallet;

    if (!hasSeenStory && !showWalletModal && (userMode || isWalletConnected)) {
      setShowStoryModal(true);
    }
  }, [primaryWallet, showWalletModal]);

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

  // Layer configuration - matching the design
  const layers = [
    { name: 'Boot Sector', threshold: 0 },
    { name: 'Firewall', threshold: 500 },
    { name: 'Security Core', threshold: 1500 },
    { name: 'Kernel Breach', threshold: 10000 },
    { name: 'System Collapse', threshold: 25000 },
  ];
  const currentLayerIndex = 1; // Currently at Layer 2 (Firewall)
  const nextLayerThreshold = layers[currentLayerIndex + 1]?.threshold || 1000;
  const storyText = [
    '> BOOT SECTOR ONLINE...',
    '> THE GRID IS COLLAPSING UNDER A CORRUPTION KNOWN AS THE SWARM.',
    '> YOU ARE A NEON SENTINEL, A SECURITY PROGRAM BUILT TO CONTAIN IT.',
    '> EACH LAYER YOU ENTER IS DEEPER, DARKER, AND MORE DEADLY.',
    '> DESTROY CORRUPTED ENTITIES. SURVIVE. PUSH THE SYSTEM BACK.',
    '> SIGNAL LOST IN: 00:00:03...'
  ].join('\n');

  return (
    <div className="min-h-screen bg-black text-neon-green relative overflow-hidden scanlines">
      {/* Animated Grid Background */}
      <div className="fixed inset-0 opacity-8 pointer-events-none animated-grid">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: 'linear-gradient(rgba(0, 255, 0, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 0, 0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* Vignette Effect */}
      <div className="fixed inset-0 pointer-events-none z-40" style={{
        background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.5) 100%)'
      }} />

      <div className="relative z-10 container mx-auto px-4 md:px-8 py-8 md:py-12 max-w-7xl">
        {/* Logo & Sector Section */}
        <div className="text-center mb-10 md:mb-12">
          <div className="logo-container mb-6 flex justify-center">
            <img 
              src={logoImage} 
              alt="Neon Sentinel" 
              className="max-w-full h-auto"
              style={{
                maxHeight: '140px',
                imageRendering: 'auto'
              }}
            />
          </div>
          <div>
            <p className="text-xl md:text-2xl font-menu text-red-500" style={{ letterSpacing: '0.15em' }}>
              WEEKLY SECTOR: {sectorName}
            </p>
            <p className="text-sm md:text-base font-body text-neon-green opacity-70 mt-2" style={{ letterSpacing: '0.1em' }}>
              Week {currentWeek} • Grid Status: ACTIVE
            </p>
          </div>
        </div>

        {/* START GAME Button */}
        <div className="text-center mb-12 md:mb-16">
          <Link to="/play" className="inline-block">
            <button className="retro-button font-logo text-xl md:text-3xl px-8 md:px-16 py-4 md:py-6">
              &gt;&gt; START GAME &lt;&lt;
            </button>
          </Link>
        </div>

        {/* Kernel Selection */}
        <div className="retro-panel mb-10 md:mb-12">
          <h2 className="font-menu text-base md:text-lg mb-4 text-neon-green border-b-2 border-neon-green pb-2" style={{ 
            letterSpacing: '0.1em'
          }}>
            SELECT KERNEL
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(PLAYER_KERNELS).map(([key, kernel]) => {
              const kernelKey = key as keyof typeof PLAYER_KERNELS;
              const unlocked = kernelUnlocks[kernelKey];
              const isSelected = selectedKernel === kernelKey;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => unlocked && handleKernelSelect(kernelKey)}
                  className={`text-left border-2 p-3 transition-all duration-200 ${
                    unlocked
                      ? isSelected
                        ? 'border-neon-green bg-black bg-opacity-80'
                        : 'border-neon-green border-opacity-40 hover:border-opacity-100'
                      : 'border-gray-600 border-opacity-40 cursor-not-allowed opacity-50'
                  }`}
                >
                  <div className="font-menu text-sm text-neon-green">{kernel.name}</div>
                  <div className="font-body text-xs text-neon-green opacity-70 mt-1">
                    {kernel.description}
                  </div>
                  <div className="font-body text-[10px] text-neon-green opacity-50 mt-2">
                    {unlocked ? (isSelected ? 'SELECTED' : 'UNLOCKED') : `LOCKED • ${kernel.unlockCondition}`}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Left Panel: Weekly Leaderboard */}
          <div className="retro-panel">
            <h2 className="font-menu text-base md:text-lg mb-4 text-neon-green border-b-2 border-neon-green pb-2" style={{ 
              letterSpacing: '0.1em'
            }}>
              WEEKLY LEADERBOARD
            </h2>
            <div className="text-xs text-neon-green opacity-70 mb-3 font-body">Week {currentWeek}</div>
            <div className="space-y-2 mb-4">
              {leaderboard.length > 0 ? (
                leaderboard.map((entry, index) => (
                  <div key={index} className="leaderboard-entry">
                    <div className="flex items-center justify-between">
                      <span>
                        <span className="rank-badge font-score text-base">{index + 1}</span>
                      <span className="font-score text-base md:text-lg">
                        {entry.playerName}
                      </span>
                      <span className="font-score text-xs md:text-sm text-red-500 ml-2">
                        P{entry.prestigeLevel ?? 0}
                      </span>
                      </span>
                      <span className="font-score text-base md:text-lg text-neon-green">
                        {entry.score.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="leaderboard-entry text-center py-4">
                  <div className="font-body text-sm text-neon-green opacity-50">
                    NO SCORES YET
                  </div>
                </div>
              )}
            </div>
            <div className="border-t-2 border-neon-green pt-3 mt-4">
              <div className="font-score text-sm text-neon-green">
                TOP: {topPlayer} - {topScore.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Middle Panel: System Depth */}
          <div className="retro-panel">
            <h2 className="font-menu text-base md:text-lg mb-4 text-neon-green border-b-2 border-neon-green pb-2" style={{ 
              letterSpacing: '0.1em'
            }}>
              SYSTEM DEPTH
            </h2>
            <div className="text-xs text-neon-green opacity-70 mb-4 font-body">
              Current Depth: <span className="text-red-500 font-semibold">LAYER {currentLayerIndex + 1}</span>
            </div>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {layers.map((layer, index) => {
                const isActive = index === currentLayerIndex;
                const isUnlocked = index <= currentLayerIndex;
                return (
                  <div key={index} className={`layer-indicator ${isActive ? 'active' : ''}`}>
                    <div className="w-full h-12 mb-2 border-2 bg-black flex items-center justify-center" style={{
                      background: isActive 
                        ? 'radial-gradient(circle, rgba(255, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0.9) 100%)'
                        : 'radial-gradient(circle, rgba(0, 255, 0, 0.05) 0%, rgba(0, 0, 0, 0.9) 100%)',
                      borderColor: isActive ? '#ff0000' : isUnlocked ? '#00ff00' : '#333333'
                    }}>
                      <div className="w-8 h-8 border" style={{
                        borderColor: isActive ? '#ff0000' : isUnlocked ? '#00ff00' : '#333333'
                      }} />
                    </div>
                    <p className={`font-menu text-xs ${isActive ? 'text-red-500' : isUnlocked ? 'text-neon-green' : 'text-gray-500'}`}>
                      {layer.name}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="space-y-1 text-xs font-body text-neon-green">
              <div>Hive Code Attacks Increasing</div>
              <div className="opacity-70">Next Layer at {nextLayerThreshold.toLocaleString()} Points</div>
            </div>
          </div>

          {/* Right Panel: Champions */}
          <div className="retro-panel">
            <h2 className="font-menu text-base md:text-lg mb-4 text-neon-green border-b-2 border-neon-green pb-2" style={{ 
              letterSpacing: '0.1em'
            }}>
              CHAMPIONS
            </h2>
            <div className="space-y-3">
              <div className="py-2 border-b border-neon-green border-opacity-30">
                <div className="font-body text-xs text-neon-green opacity-70 mb-1">SECTOR CHAMPION</div>
                <div className="font-score text-lg text-neon-green">
                  {topPlayer || 'NONE'}
                </div>
              </div>
              <div className="py-2 border-b border-neon-green border-opacity-30">
                <div className="font-body text-xs text-neon-green opacity-70 mb-1">PREVIOUS</div>
                <div className="font-body text-sm text-neon-green opacity-50">Coming Soon</div>
              </div>
              <div className="py-2">
                <div className="font-body text-xs text-neon-green opacity-70 mb-1">STATUS</div>
                <div className="font-body text-sm text-green-500">
                  ACTIVE
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hall of Fame Link */}
        <div className="mb-4 md:mb-6">
          <Link
            to="/leaderboards"
            className="font-menu text-base text-neon-green hover:text-red-500 transition-all duration-200 cursor-pointer"
            style={{ letterSpacing: '0.1em' }}
          >
            &gt; HALL OF FAME
          </Link>
        </div>

        {/* Bottom Section: Unlocked Systems */}
        <div className="retro-panel mb-8">
          <h2 className="font-menu text-base md:text-lg mb-4 text-neon-green border-b-2 border-neon-green pb-2" style={{ 
            letterSpacing: '0.1em'
          }}>
            UNLOCKED SYSTEMS
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* Kernel Walker */}
            <div className="text-center">
              <div className="w-full h-20 md:h-24 mx-auto border-2 border-neon-green bg-black mb-2 flex items-center justify-center relative overflow-hidden" style={{
                background: 'linear-gradient(135deg, rgba(0, 255, 0, 0.05) 0%, rgba(0, 0, 0, 0.95) 100%)'
              }}>
                <img 
                  src="/sprites/hero_2.svg" 
                  alt="Kernel Walker"
                  className="max-w-full max-h-full object-contain"
                  style={{ filter: 'drop-shadow(0 0 3px #00ff00)' }}
                />
              </div>
              <p className="font-menu text-xs text-neon-green">Kernel Walker</p>
            </div>

            {/* Drone */}
            <div className="text-center">
              <div className="w-full h-20 md:h-24 mx-auto border-2 border-neon-green bg-black mb-2 flex items-center justify-center relative overflow-hidden" style={{
                background: 'linear-gradient(135deg, rgba(0, 255, 0, 0.05) 0%, rgba(0, 0, 0, 0.95) 100%)'
              }}>
                <img 
                  src="/sprites/drone.svg" 
                  alt="Drone"
                  className="max-w-full max-h-full object-contain"
                  style={{ filter: 'drop-shadow(0 0 3px #00ff00)' }}
                />
              </div>
              <p className="font-menu text-xs text-neon-green">Drone</p>
            </div>

            {/* Locked Items */}
            {[1, 2, 3].map((item) => (
              <div key={item} className="text-center">
                <div className="w-full h-20 md:h-24 mx-auto border-2 border-gray-600 bg-black mb-2 flex items-center justify-center relative overflow-hidden" style={{
                  background: 'linear-gradient(135deg, rgba(100, 100, 100, 0.05) 0%, rgba(0, 0, 0, 0.95) 100%)'
                }}>
                  <div className="w-12 h-12 border border-gray-600 opacity-30" />
                </div>
                <p className="font-menu text-xs text-gray-500">Locked</p>
              </div>
            ))}
          </div>
        </div>

        {/* About Section */}
        <div className="retro-panel mb-8">
          <h2 className="font-menu text-base md:text-lg mb-4 text-neon-green border-b-2 border-neon-green pb-2" style={{ 
            letterSpacing: '0.1em'
          }}>
            ABOUT
          </h2>
          <div className="space-y-4 text-sm md:text-base font-body text-neon-green">
            <div>
              <h3 className="font-menu text-base mb-2 text-red-500" style={{ letterSpacing: '0.1em' }}>
                THE GRID
              </h3>
              <p className="opacity-90 leading-relaxed">
                Inside a collapsing digital megasystem called <strong>The Grid</strong>, autonomous security programs—<strong>Neon Sentinels</strong>—fight to contain a spreading corruption known as <strong>The Swarm</strong>.
              </p>
            </div>
            
            <div>
              <h3 className="font-menu text-base mb-2 text-red-500" style={{ letterSpacing: '0.1em' }}>
                THE INFECTION
              </h3>
              <p className="opacity-90 leading-relaxed">
                Each enemy color represents a deeper layer of system corruption. You don't "beat levels"—you push deeper into infected layers of the system until you hit a system collapse (death). The deeper you go, the more dangerous the corruption becomes.
              </p>
            </div>

            <div>
              <h3 className="font-menu text-base mb-2 text-red-500" style={{ letterSpacing: '0.1em' }}>
                THE LAYERS
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                <div className="space-y-1 text-xs">
                  <p><span className="text-green-500">🟢 Boot Sector</span> - Broken data fragments</p>
                  <p><span className="text-yellow-500">🟡 Firewall</span> - Recompiled attack routines</p>
                  <p><span className="text-blue-500">🔵 Security Core</span> - Hijacked security bots</p>
                </div>
                <div className="space-y-1 text-xs">
                  <p><span className="text-purple-500">🟣 Corrupted AI</span> - High-level AI cores</p>
                  <p><span className="text-red-500">🔴 Kernel Breach</span> - System guardians taken over</p>
                  <p><span className="text-red-600">⚫ System Collapse</span> - Final boss territory</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-menu text-base mb-2 text-red-500" style={{ letterSpacing: '0.1em' }}>
                YOUR MISSION
              </h3>
              <p className="opacity-90 leading-relaxed">
                Survive as long as possible. Push deeper into the system. Score points by eliminating corrupted entities. Each layer introduces new enemy types and increasing difficulty. Build combos by staying alive. Reach the deepest layer and become a legend.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4">
          <button className="font-menu text-base text-neon-green hover:text-red-500 transition-all duration-200 cursor-pointer" style={{
            letterSpacing: '0.1em'
          }}>
            &gt; HALL OF FAME
          </button>
          <div className="font-body text-xs text-neon-green opacity-60 px-4 py-2 border border-neon-green border-opacity-30 bg-black bg-opacity-50" style={{
            letterSpacing: '0.05em'
          }}>
            {primaryWallet ? `CONNECTED: ${primaryWallet.address.slice(0, 6)}...${primaryWallet.address.slice(-4)}` : 'NOT CONNECTED'}
          </div>
          <button className="font-menu text-base text-neon-green hover:text-red-500 transition-all duration-200 cursor-pointer" style={{
            letterSpacing: '0.1em'
          }}>
            &gt; SETTINGS
          </button>
        </div>
      </div>

      {/* Wallet Connection Modal */}
      <WalletConnectionModal
        isOpen={showWalletModal}
        onClose={handleCloseModal}
        onAnonymous={handleAnonymous}
      />
      <StoryModal
        isOpen={showStoryModal}
        onClose={handleCloseStoryModal}
        storyText={storyText}
      />
    </div>
  );
}

export default LandingPage;
