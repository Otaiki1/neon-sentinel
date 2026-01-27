import { Link } from "react-router-dom";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { fetchWeeklyLeaderboard, getCurrentISOWeek } from '../services/scoreService';
import { CUSTOMIZABLE_SETTINGS, PLAYER_KERNELS } from '../game/config';
import { getKernelState, getKernelUnlocks, getSelectedKernelKey, setSelectedKernelKey } from '../services/kernelService';
import { getGameplaySettings, saveGameplaySettings, type GameplaySettings } from '../services/settingsService';
import { addCoins, getAvailableCoins, getDailyCoins } from '../services/coinService';
import { useState, useEffect } from 'react';
import logoImage from '../assets/logo.png';
import iconProfile from '../assets/icons/icon-profile.svg';
import iconHall from '../assets/icons/icon-hall.svg';
import iconSettings from '../assets/icons/icon-settings.svg';
import iconMarketplace from '../assets/icons/icon-marketplace.svg';
import iconLogin from '../assets/icons/icon-login.svg';
import WalletConnectionModal from '../components/WalletConnectionModal';
import StoryModal from '../components/StoryModal';
import AvatarSelectionModal from '../components/AvatarSelectionModal';
import { InventoryModal } from '../components/InventoryModal';
import { FirstTimeTooltip } from '../components/Tooltip';
import { KernelIcon } from '../components/KernelIcon';
import { getActiveAvatar, getAvatarConfig } from '../services/avatarService';
import { getCurrentRankFromStorage } from '../services/rankService';
import './LandingPage.css';

const WALLET_MODAL_SEEN_KEY = 'neon-sentinel-wallet-modal-seen';
const USER_MODE_KEY = 'neon-sentinel-user-mode';
const STORY_MODAL_SEEN_KEY = 'neon-sentinel-story-modal-seen';
const TOOLTIP_KEYS = [
  'nav-hall',
  'nav-profile',
  'nav-settings',
  'nav-marketplace',
  'nav-login',
  'start-game',
  'kernel-selection',
  'weekly-leaderboard',
  'system-depth',
  'champions',
  'daily-coins',
  'marketplace-daily-coins',
];
const TOOLTIP_SEEN_PREFIX = 'neon-sentinel-tooltip-seen-';

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
  const isWalletConnected = !!primaryWallet;
  const walletLabel = isWalletConnected
    ? `${primaryWallet!.address.slice(0, 6)}...${primaryWallet!.address.slice(-4)}`
    : 'LOGIN';
  const [leaderboard, setLeaderboard] = useState<
    Array<{ score: number; playerName: string; prestigeLevel?: number; currentRank?: string }>
  >([]);
  const [currentWeek, setCurrentWeek] = useState<number>(1);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showMarketplaceModal, setShowMarketplaceModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [activeAvatar, setActiveAvatar] = useState(getActiveAvatar());
  const [kernelUnlocks, setKernelUnlocks] = useState(getKernelUnlocks());
  const [selectedKernel, setSelectedKernel] = useState(getSelectedKernelKey());
  const [settings, setSettings] = useState<GameplaySettings>(getGameplaySettings());
  const [coins, setCoins] = useState(getAvailableCoins());
  const [currentRank, setCurrentRank] = useState(() => {
    const stored = getCurrentRankFromStorage();
    return stored ? stored.name : 'Initiate Sentinel';
  });
  const [currentTooltipId, setCurrentTooltipId] = useState<string | null>(() => {
    const unseen = TOOLTIP_KEYS.find(
      (id) => localStorage.getItem(`${TOOLTIP_SEEN_PREFIX}${id}`) !== 'true'
    );
    return unseen ?? null;
  });

  useEffect(() => {
    const scores = fetchWeeklyLeaderboard();
    setLeaderboard(scores.slice(0, 3)); // Top 3
    setCurrentWeek(getCurrentISOWeek());
    const kernelState = getKernelState();
    setKernelUnlocks(kernelState.unlocked);
    setSelectedKernel(kernelState.selectedKernel);
    setSettings(getGameplaySettings());
    setCoins(getAvailableCoins());
    
    // Update rank display
    const stored = getCurrentRankFromStorage();
    if (stored) {
      setCurrentRank(stored.name);
    } else {
      // Default to Initiate Sentinel - rank will update during gameplay
      setCurrentRank('Initiate Sentinel');
    }
  }, []);

  // Show wallet modal on first visit if wallet not connected
  useEffect(() => {
    const hasSeenModal = localStorage.getItem(WALLET_MODAL_SEEN_KEY) === 'true';
    const userMode = getUserMode();

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

  const handleOpenWalletModal = () => {
    setShowWalletModal(true);
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

  const handleOpenSettings = () => {
    setSettings(getGameplaySettings());
    setShowSettingsModal(true);
  };

  const handleCloseSettings = () => {
    setShowSettingsModal(false);
  };

  const handleSaveSettings = () => {
    saveGameplaySettings(settings);
    setShowSettingsModal(false);
  };

  const handleOpenMarketplace = () => {
    setCoins(getAvailableCoins());
    setShowMarketplaceModal(true);
  };

  const handleCloseMarketplace = () => {
    setShowMarketplaceModal(false);
  };

  const handleBuyCoins = (amount: number) => {
    const next = addCoins(amount);
    setCoins(next);
  };

  const handleOpenAvatarModal = () => {
    setCoins(getAvailableCoins());
    setShowAvatarModal(true);
  };

  const handleCloseAvatarModal = () => {
    setShowAvatarModal(false);
  };

  const handleAvatarChange = () => {
    setActiveAvatar(getActiveAvatar());
    setCoins(getAvailableCoins());
  };

  const advanceTooltip = () => {
    if (currentTooltipId === null) return;
    localStorage.setItem(`${TOOLTIP_SEEN_PREFIX}${currentTooltipId}`, 'true');
    const currentIndex = TOOLTIP_KEYS.indexOf(currentTooltipId);
    const next = TOOLTIP_KEYS.slice(currentIndex + 1).find(
      (id) => localStorage.getItem(`${TOOLTIP_SEEN_PREFIX}${id}`) !== 'true'
    );
    setCurrentTooltipId(next ?? null);
  };

  const skipTour = () => {
    TOOLTIP_KEYS.forEach((id) => localStorage.setItem(`${TOOLTIP_SEEN_PREFIX}${id}`, 'true'));
    setCurrentTooltipId(null);
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

    if (!hasSeenStory && !showWalletModal && (userMode || isWalletConnected)) {
      setShowStoryModal(true);
    }
  }, [isWalletConnected, showWalletModal]);

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
      {/* Background Image */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'url(/bg-img.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.3
        }}
      />
      {/* Animated Grid Background Overlay */}
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

      {currentTooltipId && (
        <div className="fixed top-4 right-4 z-50 flex gap-2">
          <button
            type="button"
            onClick={skipTour}
            className="font-body text-xs px-3 py-2 border border-neon-green text-neon-green bg-black bg-opacity-70 hover:bg-neon-green hover:text-black transition-all duration-150"
          >
            Skip tutorial
          </button>
        </div>
      )}

      <div className="relative z-10 container mx-auto px-4 md:px-8 py-8 md:py-12 max-w-7xl">
        <div className="landing-nav mb-6">
          <FirstTimeTooltip
            id="nav-hall"
            content="View the Hall of Fame - see top players across all leaderboard categories and your achievements."
            position="bottom"
            activeId={currentTooltipId}
            onNext={advanceTooltip}
            onSkip={skipTour}
          >
            <Link to="/leaderboards" className="nav-icon-button" aria-label="Hall of Fame">
              <img src={iconHall} alt="" className="nav-icon-image" />
              <span className="nav-icon-label">HALL</span>
            </Link>
          </FirstTimeTooltip>
          <FirstTimeTooltip
            id="nav-profile"
            content="View your profile - see your stats, achievements, unlocked kernels, and progression."
            position="bottom"
            activeId={currentTooltipId}
            onNext={advanceTooltip}
            onSkip={skipTour}
          >
            <Link to="/profile" className="nav-icon-button" aria-label="Profile">
              <img src={iconProfile} alt="" className="nav-icon-image" />
              <span className="nav-icon-label">PROFILE</span>
            </Link>
          </FirstTimeTooltip>
          <FirstTimeTooltip
            id="nav-settings"
            content="Adjust game settings - control volume, UI scale, accessibility options, and gameplay preferences."
            position="bottom"
            activeId={currentTooltipId}
            onNext={advanceTooltip}
            onSkip={skipTour}
          >
            <button type="button" className="nav-icon-button" onClick={handleOpenSettings} aria-label="Settings">
              <img src={iconSettings} alt="" className="nav-icon-image" />
              <span className="nav-icon-label">SETTINGS</span>
            </button>
          </FirstTimeTooltip>
          <FirstTimeTooltip
            id="nav-marketplace"
            content="Visit the marketplace - spend coins to unlock cosmetics, heroes, and other items."
            position="bottom"
            activeId={currentTooltipId}
            onNext={advanceTooltip}
            onSkip={skipTour}
          >
            <button type="button" className="nav-icon-button" onClick={handleOpenMarketplace} aria-label="Marketplace">
              <img src={iconMarketplace} alt="" className="nav-icon-image" />
              <span className="nav-icon-label">MARKET</span>
            </button>
          </FirstTimeTooltip>
          <FirstTimeTooltip
            id="nav-inventory"
            content="Manage your Mini-Me inventory - purchase and activate companions to help you in battle."
            position="bottom"
            activeId={currentTooltipId}
            onNext={advanceTooltip}
            onSkip={skipTour}
          >
            <button type="button" className="nav-icon-button" onClick={() => setShowInventoryModal(true)} aria-label="Inventory">
              <span className="nav-icon-text" style={{ fontSize: '1.5rem' }}>📦</span>
              <span className="nav-icon-label">INVENTORY</span>
            </button>
          </FirstTimeTooltip>
          <FirstTimeTooltip
            id="nav-login"
            content="Connect your wallet or play anonymously. Wallet connection enables additional features."
            position="bottom"
            activeId={currentTooltipId}
            onNext={advanceTooltip}
            onSkip={skipTour}
          >
            <button type="button" className="nav-icon-button" onClick={handleOpenWalletModal} aria-label="Login">
              <img src={iconLogin} alt="" className="nav-icon-image" />
              <span className="nav-icon-label">{walletLabel}</span>
            </button>
          </FirstTimeTooltip>
        </div>
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

        {/* Avatar Selector */}
        <div className="text-center mb-6 md:mb-8">
          <div className="retro-panel inline-block px-6 py-4">
            <div className="flex items-center gap-4 justify-center">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 md:w-20 md:h-20 border-2 border-neon-green bg-black mb-2 flex items-center justify-center">
                  <img 
                    src={`/sprites/${getAvatarConfig(activeAvatar).spriteKey}.svg`}
                    alt={getAvatarConfig(activeAvatar).displayName}
                    className="max-w-full max-h-full object-contain"
                    style={{ filter: 'drop-shadow(0 0 3px #00ff00)' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/sprites/hero.svg';
                    }}
                  />
                </div>
                <p className="font-menu text-xs text-neon-green">
                  {getAvatarConfig(activeAvatar).displayName}
                </p>
              </div>
              <button
                className="retro-button font-menu text-sm px-4 py-2"
                onClick={handleOpenAvatarModal}
              >
                CHANGE AVATAR
              </button>
            </div>
            <div className="mt-2 text-xs font-body text-neon-green opacity-70">
              Coins: {coins}
            </div>
          </div>
        </div>

        {/* START GAME Button */}
        <div className="text-center mb-12 md:mb-16">
          <FirstTimeTooltip
            id="start-game"
            content="Click to start playing! Use arrow keys or WASD to move, Spacebar to shoot. Destroy enemies to score points and survive as long as possible."
            position="bottom"
            activeId={currentTooltipId}
            onNext={advanceTooltip}
            onSkip={skipTour}
          >
            <Link to="/play" className="inline-block">
              <button className="retro-button font-logo text-xl md:text-3xl px-8 md:px-16 py-4 md:py-6">
                &gt;&gt; START GAME &lt;&lt;
              </button>
            </Link>
          </FirstTimeTooltip>
        </div>

        {/* Kernel Selection */}
        <FirstTimeTooltip
          id="kernel-selection"
          content="Choose your Kernel before each run. Each Kernel has different stats - speed, fire rate, and special abilities. Unlock new Kernels by achieving milestones. Hover over icons to see details."
          position="bottom"
          activeId={currentTooltipId}
          onNext={advanceTooltip}
          onSkip={skipTour}
        >
          <div className="retro-panel mb-10 md:mb-12">
            <h2 className="font-menu text-base md:text-lg mb-4 text-neon-green border-b-2 border-neon-green pb-2" style={{ 
              letterSpacing: '0.1em'
            }}>
              SELECT KERNEL
            </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {Object.entries(PLAYER_KERNELS).map(([key, kernel]) => {
              const kernelKey = key as keyof typeof PLAYER_KERNELS;
              const unlocked = kernelUnlocks[kernelKey];
              const isSelected = selectedKernel === kernelKey;
              
              // Map kernel keys to icon types
              let iconType: 'standard' | 'swift' | 'artillery' | 'sniper' | 'guardian' = 'standard';
              if (key === 'sentinel_standard') iconType = 'standard';
              else if (key === 'sentinel_speed') iconType = 'swift';
              else if (key === 'sentinel_firepower') iconType = 'artillery';
              else if (key === 'sentinel_precision') iconType = 'sniper';
              else if (key === 'sentinel_tanky') iconType = 'guardian';
              
              return (
                <KernelIcon
                  key={key}
                  type={iconType}
                  label={kernel.name}
                  description={kernel.description}
                  isSelected={isSelected}
                  isUnlocked={unlocked}
                  unlockCondition={kernel.unlockCondition}
                  onClick={() => unlocked && handleKernelSelect(kernelKey)}
                />
              );
            })}
          </div>
          </div>
        </FirstTimeTooltip>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Left Panel: Weekly Leaderboard */}
          <FirstTimeTooltip
            id="weekly-leaderboard"
            content="Weekly Leaderboard - Top scores for the current week. Leaderboards reset every week. Compete to reach the top!"
            position="right"
            activeId={currentTooltipId}
            onNext={advanceTooltip}
            onSkip={skipTour}
          >
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
                      {entry.currentRank && (
                        <span className="font-score text-xs md:text-sm text-cyan-400 ml-2">
                          {entry.currentRank}
                        </span>
                      )}
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
          </FirstTimeTooltip>

          {/* Middle Panel: System Depth & Rank */}
          <FirstTimeTooltip
            id="system-depth"
            content="System Depth = Current Layer + (Prestige × 6). This measures how deep you've penetrated The Grid. Higher depth = more challenge and rewards!"
            position="right"
            activeId={currentTooltipId}
            onNext={advanceTooltip}
            onSkip={skipTour}
          >
            <div className="retro-panel">
              <h2 className="font-menu text-base md:text-lg mb-4 text-neon-green border-b-2 border-neon-green pb-2" style={{ 
                letterSpacing: '0.1em'
              }}>
                SYSTEM DEPTH
              </h2>
            <div className="text-xs text-neon-green opacity-70 mb-2 font-body">
              Current Depth: <span className="text-red-500 font-semibold">LAYER {currentLayerIndex + 1}</span>
            </div>
            <div className="text-xs text-neon-green opacity-70 mb-4 font-body border-t border-neon-green border-opacity-30 pt-2 mt-2">
              Current Rank: <span className="text-cyan-400 font-semibold">{currentRank}</span>
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
          </FirstTimeTooltip>

          {/* Right Panel: Champions */}
          <FirstTimeTooltip
            id="champions"
            content="Champions - Top players for the current sector. See who's leading the weekly competition!"
            position="left"
            activeId={currentTooltipId}
            onNext={advanceTooltip}
            onSkip={skipTour}
          >
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
          </FirstTimeTooltip>
        </div>

        {/* Hall of Fame & About Links */}
        <div className="flex gap-4 justify-center mb-6">
          <Link
            to="/leaderboards"
            className="font-menu text-sm text-neon-green hover:text-red-500 transition-all duration-200 px-4 py-2 border border-neon-green hover:bg-neon-green hover:text-black"
          >
            &gt; HALL OF FAME
          </Link>
          <Link
            to="/about"
            className="font-menu text-sm text-neon-green hover:text-red-500 transition-all duration-200 px-4 py-2 border border-neon-green hover:bg-neon-green hover:text-black"
          >
            &gt; ABOUT
          </Link>
        </div>
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
          <p className="font-body text-xs text-neon-green opacity-70 mb-4">
            Systems unlock as you earn lifetime points. Some slots are visible now so you can
            see what will open next.
          </p>
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

        {/* How To Play */}
        <div className="retro-panel mb-8">
          <h2
            className="font-menu text-base md:text-lg mb-4 text-neon-green border-b-2 border-neon-green pb-2"
            style={{ letterSpacing: '0.1em' }}
          >
            HOW TO PLAY
          </h2>
          <div className="space-y-3 text-sm md:text-base font-body text-neon-green">
            <p className="opacity-90 leading-relaxed">
              Move to dodge, shoot to clear corrupted entities, and keep your combo alive for
              bonus score. Survive longer to reach deeper layers with tougher enemies and higher
              rewards.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <p>Desktop: WASD / Arrow Keys to move</p>
                <p>Desktop: Space / Click to fire</p>
                <p>Desktop: Hold Shift for focus movement</p>
              </div>
              <div className="space-y-1">
                <p>Mobile: Drag to move</p>
                <p>Auto-fire enabled on mobile</p>
                <p>Coins allow revives on death</p>
              </div>
            </div>
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
                The Grid is a collapsing megasystem. You are a Neon Sentinel tasked with pushing
                back a corruption called the Swarm. Every layer is deeper, darker, and more
                unstable.
              </p>
            </div>

            <div>
              <h3 className="font-menu text-base mb-2 text-red-500" style={{ letterSpacing: '0.1em' }}>
                THE MISSION
              </h3>
              <p className="opacity-90 leading-relaxed">
                Survive as long as possible, keep your combo alive, and farm points to unlock
                new kernels, heroes, and cosmetics. Weekly sectors rotate, so your ranking starts
                fresh each cycle.
              </p>
            </div>

            <div>
              <h3 className="font-menu text-base mb-2 text-red-500" style={{ letterSpacing: '0.1em' }}>
                THE LAYERS
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 text-xs">
                <div className="space-y-1">
                  <p><span className="text-green-500">Boot Sector</span> - Broken data fragments</p>
                  <p><span className="text-yellow-500">Firewall</span> - Recompiled attack routines</p>
                  <p><span className="text-blue-500">Security Core</span> - Hijacked security bots</p>
                </div>
                <div className="space-y-1">
                  <p><span className="text-purple-500">Corrupted AI</span> - High-level AI cores</p>
                  <p><span className="text-red-500">Kernel Breach</span> - System guardians taken over</p>
                  <p><span className="text-red-600">System Collapse</span> - Final boss territory</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4">
          <Link
            to="/leaderboards"
            className="font-menu text-base text-neon-green hover:text-red-500 transition-all duration-200 cursor-pointer"
            style={{ letterSpacing: '0.1em' }}
          >
            &gt; HALL OF FAME
          </Link>
          <button
            type="button"
            className="wallet-login-pill font-body text-xs text-neon-green px-4 py-2 border border-neon-green border-opacity-30 bg-black bg-opacity-50"
            style={{ letterSpacing: '0.05em' }}
            onClick={handleOpenWalletModal}
          >
            <span className="wallet-login-label">{walletLabel}</span>
          </button>
          <button
            className="font-menu text-base text-neon-green hover:text-red-500 transition-all duration-200 cursor-pointer"
            style={{ letterSpacing: '0.1em' }}
            onClick={handleOpenSettings}
          >
            &gt; SETTINGS
          </button>
          <button
            className="font-menu text-base text-neon-green hover:text-red-500 transition-all duration-200 cursor-pointer"
            style={{ letterSpacing: '0.1em' }}
            onClick={handleOpenMarketplace}
          >
            &gt; MARKETPLACE
          </button>
        </div>
      </div>

      {/* Wallet Connection Modal */}
      <WalletConnectionModal
        isOpen={showWalletModal}
        onClose={handleCloseModal}
        onAnonymous={handleAnonymous}
      />
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 px-4">
          <div className="retro-panel w-full max-w-2xl">
            <h2 className="font-menu text-base md:text-lg mb-4 text-neon-green border-b-2 border-neon-green pb-2" style={{ 
              letterSpacing: '0.1em'
            }}>
              SETTINGS
            </h2>
            <div className="space-y-6 text-sm text-neon-green">
              <div>
                <div className="font-menu text-xs mb-2">DIFFICULTY</div>
                <select
                  value={settings.difficulty}
                  onChange={(event) =>
                    setSettings({ ...settings, difficulty: event.target.value as GameplaySettings['difficulty'] })
                  }
                  className="w-full bg-black border border-neon-green px-3 py-2 font-body"
                >
                  <option value="normal">Normal</option>
                  <option value="easy">Easy</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <div className="font-menu text-xs mb-2">ACCESSIBILITY</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    { key: 'colorBlindMode', label: 'Color Blind Mode' },
                    { key: 'highContrast', label: 'High Contrast UI' },
                    { key: 'dyslexiaFont', label: 'Dyslexia-Friendly Font' },
                    { key: 'reduceMotion', label: 'Reduce Motion' },
                    { key: 'reduceFlash', label: 'Reduce Flash' },
                  ].map((option) => (
                    <label key={option.key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={settings.accessibility[option.key as keyof GameplaySettings['accessibility']]}
                        onChange={(event) =>
                          setSettings({
                            ...settings,
                            accessibility: {
                              ...settings.accessibility,
                              [option.key]: event.target.checked,
                            },
                          })
                        }
                      />
                      <span className="font-body">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div className="font-menu text-xs mb-2">VISUAL</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="flex flex-col gap-2">
                    <span>UI Scale</span>
                    <select
                      value={settings.visual.uiScale}
                      onChange={(event) =>
                        setSettings({
                          ...settings,
                          visual: { ...settings.visual, uiScale: Number(event.target.value) },
                        })
                      }
                      className="bg-black border border-neon-green px-3 py-2"
                    >
                      {CUSTOMIZABLE_SETTINGS.visual.uiScale.map((value) => (
                        <option key={value} value={value}>{value}x</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-2">
                    <span>UI Opacity</span>
                    <select
                      value={settings.visual.uiOpacity}
                      onChange={(event) =>
                        setSettings({
                          ...settings,
                          visual: { ...settings.visual, uiOpacity: Number(event.target.value) },
                        })
                      }
                      className="bg-black border border-neon-green px-3 py-2"
                    >
                      {CUSTOMIZABLE_SETTINGS.visual.uiOpacity.map((value) => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-2">
                    <span>Screen Shake</span>
                    <select
                      value={settings.visual.screenShakeIntensity}
                      onChange={(event) =>
                        setSettings({
                          ...settings,
                          visual: { ...settings.visual, screenShakeIntensity: Number(event.target.value) },
                        })
                      }
                      className="bg-black border border-neon-green px-3 py-2"
                    >
                      {CUSTOMIZABLE_SETTINGS.visual.screenShakeIntensity.map((value) => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-2">
                    <span>Grid Intensity</span>
                    <select
                      value={settings.visual.gridIntensity}
                      onChange={(event) =>
                        setSettings({
                          ...settings,
                          visual: { ...settings.visual, gridIntensity: Number(event.target.value) },
                        })
                      }
                      className="bg-black border border-neon-green px-3 py-2"
                    >
                      {CUSTOMIZABLE_SETTINGS.visual.gridIntensity.map((value) => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col md:flex-row gap-3 justify-end">
              <button
                className="retro-button font-menu text-sm px-6 py-3"
                onClick={handleSaveSettings}
              >
                SAVE
              </button>
              <button
                className="retro-button font-menu text-sm px-6 py-3"
                onClick={handleCloseSettings}
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
      {showMarketplaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 px-4">
          <div className="retro-panel w-full max-w-xl">
            <h2 className="font-menu text-base md:text-lg mb-4 text-neon-green border-b-2 border-neon-green pb-2" style={{ 
              letterSpacing: '0.1em'
            }}>
              MARKETPLACE
            </h2>
            <div className="text-sm font-body text-neon-green space-y-2">
              <FirstTimeTooltip
                id="marketplace-daily-coins"
                content="Daily Coins - You receive 3 coins every day. Use them to purchase items in the marketplace!"
                position="bottom"
                activeId={currentTooltipId}
                onNext={advanceTooltip}
                onSkip={skipTour}
              >
                <div>Daily Coins: {getDailyCoins()} (auto-refresh)</div>
              </FirstTimeTooltip>
              <div>Available Coins: {coins}</div>
              <div className="opacity-70">Crypto purchases are simulated.</div>
            </div>
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { amount: 5, label: 'Buy 5 Coins', price: '0.005 ETH' },
                { amount: 15, label: 'Buy 15 Coins', price: '0.012 ETH' },
              ].map((item) => (
                <button
                  key={item.amount}
                  className="retro-button font-menu text-sm px-6 py-3"
                  onClick={() => handleBuyCoins(item.amount)}
                >
                  {item.label} ({item.price})
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                className="retro-button font-menu text-sm px-6 py-3"
                onClick={handleCloseMarketplace}
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
      <StoryModal
        isOpen={showStoryModal}
        onClose={handleCloseStoryModal}
        storyText={storyText}
      />
      <AvatarSelectionModal
        isOpen={showAvatarModal}
        onClose={handleCloseAvatarModal}
        onAvatarChange={handleAvatarChange}
      />
      <InventoryModal
        isOpen={showInventoryModal}
        onClose={() => setShowInventoryModal(false)}
        onActivate={(type) => {
          // Mini-me activation will be handled by GameScene when game is running
          console.log('Mini-me activated:', type);
        }}
      />
    </div>
  );
}

export default LandingPage;
