import { useState } from "react";
import { Link } from "react-router-dom";
import {
  getProfileStats,
  getSelectedHero,
  setSelectedHero,
} from "../services/achievementService";
import { StatIcon } from "../components/StatIcon";
import { getRankHistory, getCurrentRankFromStorage, getRankTierName, getRankProgress } from "../services/rankService";
import { getCurrentBulletTier, getTierProgress, BULLET_TIERS } from "../services/bulletUpgradeService";
import { isAchievementUnlocked } from "../services/achievementService";
import { getAllAvatarsWithStatus, getActiveAvatar } from "../services/avatarService";
import { getTotalEarnedFromSource, getTotalSpentOnPurpose } from "../services/coinService";
import { getInventory } from "../services/inventoryService";
import "./LandingPage.css";

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m ${seconds}s`;
}

function StatItem({ iconType, label, value }: { iconType?: 'target' | 'rocket' | 'running' | 'clock' | 'skull' | 'shield' | 'cubes' | 'trophy' | 'accuracy' | 'biohazard'; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-neon-green border-opacity-20 last:border-0">
      {iconType && (
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
          <StatIcon type={iconType} size={20} />
        </div>
      )}
      <div className="flex-1">
        <div className="text-xs text-neon-green opacity-70 font-menu uppercase tracking-wider">{label}</div>
        <div className="text-sm font-body text-neon-green mt-0.5">{typeof value === 'number' ? value.toLocaleString() : value}</div>
      </div>
    </div>
  );
}

function ProfilePage() {
  const stats = getProfileStats();
  const [selectedHero, setSelectedHeroState] = useState(getSelectedHero());
  const rankHistory = getRankHistory();
  const currentRank = getCurrentRankFromStorage();
  const isPrimeSentinel = isAchievementUnlocked("prime_sentinel");
  
  // Get bullet tier info (use prestige from current rank or 0)
  const currentPrestige = currentRank?.prestige || 0;
  const currentBulletTier = getCurrentBulletTier(currentPrestige);
  const tierProgress = getTierProgress(currentPrestige);
  
  // Get rank progress
  const rankProgress = currentRank ? getRankProgress(currentRank.prestige, currentRank.layer) : null;
  
  // Get avatar gallery
  const allAvatars = getAllAvatarsWithStatus(currentPrestige);
  const activeAvatar = getActiveAvatar();
  
  // Get coin statistics
  const totalCoinsEarned = getTotalEarnedFromSource('prestige') + getTotalEarnedFromSource('daily') + getTotalEarnedFromSource('prime_sentinel');
  const totalCoinsSpent = getTotalSpentOnPurpose('avatar') + getTotalSpentOnPurpose('revive') + getTotalSpentOnPurpose('mini_me');
  
  // Get mini-me statistics
  const miniMeInventory = getInventory();
  const totalMiniMesUsed = Object.values(miniMeInventory).reduce((sum, count) => sum + (20 - count), 0); // Assuming max 20 per type

  const heroOptions = [
    {
      key: "sentinel_standard",
      name: "Sentinel Standard",
      sprite: "/hero/hero-grade-1.svg",
      unlockScore: 0,
    },
    {
      key: "sentinel_vanguard",
      name: "Sentinel Vanguard",
      sprite: "/hero/hero-grade-2.svg",
      unlockScore: 25000,
    },
    {
      key: "sentinel_ghost",
      name: "Sentinel Ghost",
      sprite: "/hero/hero-grade-3.svg",
      unlockScore: 75000,
    },
    {
      key: "sentinel_drone",
      name: "Sentinel Drone",
      sprite: "/hero/hero-grade-4.svg",
      unlockScore: 150000,
    },
  ];

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
      <div className="fixed inset-0 opacity-8 pointer-events-none animated-grid" />
      <div className="relative z-10 container mx-auto px-4 md:px-8 py-8 md:py-12 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-menu text-3xl md:text-4xl text-neon-green tracking-wider mb-2 text-center md:text-left">
            PROFILE & STATS
          </h1>
          <div className="flex justify-end">
            <Link
              to="/"
              className="font-menu text-sm text-neon-green hover:text-red-500 transition-all duration-200 px-4 py-2 border border-neon-green hover:bg-neon-green hover:text-black"
            >
              &gt; BACK
            </Link>
          </div>
        </div>

        {/* Current Rank Display */}
        {currentRank && (
          <div className="retro-panel mb-8">
            <h2 className="font-menu text-base md:text-lg mb-4 text-neon-green border-b-2 border-neon-green pb-2">
              CURRENT RANK
            </h2>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 border-2 border-neon-green bg-black flex items-center justify-center">
                <div className="text-2xl font-menu text-neon-green">#{currentRank.number}</div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-menu text-lg text-neon-green">{currentRank.name}</div>
                  {isPrimeSentinel && (
                    <div className="text-xs font-menu text-cyan-400 border border-cyan-400 px-2 py-1">
                      PRIME SENTINEL
                    </div>
                  )}
                </div>
                <div className="font-body text-sm text-neon-green opacity-70">
                  {getRankTierName(currentRank.tier)} • Prestige {currentRank.prestige}, Layer {currentRank.layer}
                </div>
              </div>
            </div>
            
            {/* Rank Progress */}
            {rankProgress && (
              <div className="mt-4 pt-4 border-t border-neon-green border-opacity-30">
                <div className="font-body text-xs text-neon-green opacity-70 mb-2">
                  Progress to Next Rank
                </div>
                <div className="w-full bg-black border border-neon-green border-opacity-30 h-4 mb-2">
                  <div 
                    className="h-full bg-neon-green transition-all duration-300"
                    style={{ width: `${rankProgress.progress * 100}%` }}
                  />
                </div>
                {rankProgress.nextRank && (
                  <div className="font-body text-xs text-neon-green opacity-70">
                    Next: {rankProgress.nextRank.name} (Rank {rankProgress.nextRank.number})
                  </div>
                )}
              </div>
            )}
            
            {/* Rank History Link */}
            {rankHistory.length > 0 && (
              <div className="mt-4 pt-4 border-t border-neon-green border-opacity-30">
                <div className="font-body text-xs text-neon-green opacity-70 mb-2">
                  Rank History Timeline
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {rankHistory.slice(-5).reverse().map((rank, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs font-body text-neon-green opacity-60">
                      <span>#{rank.number}</span>
                      <span>{rank.name}</span>
                      <span className="opacity-50">P{rank.prestige} L{rank.layer}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Avatar Gallery */}
        <div className="retro-panel mb-8">
          <h2 className="font-menu text-base md:text-lg mb-4 text-neon-green border-b-2 border-neon-green pb-2">
            AVATAR GALLERY
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {allAvatars.map((avatar) => {
              const isActive = avatar.id === activeAvatar;
              const isPurchased = avatar.isPurchased;
              const canAfford = avatar.canAfford;
              
              return (
                <div
                  key={avatar.id}
                  className={`border-2 p-3 bg-black ${
                    isActive 
                      ? 'border-cyan-400 bg-cyan-400 bg-opacity-10' 
                      : isPurchased 
                      ? 'border-neon-green border-opacity-50' 
                      : 'border-gray-600 border-opacity-30'
                  }`}
                >
                  <div className="w-full h-20 border border-neon-green border-opacity-30 bg-black mb-2 flex items-center justify-center">
                    {isPurchased ? (
                      <img 
                        src={`/sprites/${avatar.config.spriteKey}.svg`}
                        alt={avatar.config.displayName}
                        className="max-w-full max-h-full object-contain"
                        style={{ filter: isActive ? 'drop-shadow(0 0 5px #00ffff)' : 'drop-shadow(0 0 3px #00ff00)' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/sprites/hero.svg';
                        }}
                      />
                    ) : (
                      <div className="text-gray-500 text-xs">🔒</div>
                    )}
                  </div>
                  <div className="font-menu text-xs text-neon-green mb-1">
                    {avatar.config.displayName}
                  </div>
                  {isActive && (
                    <div className="text-xs font-body text-cyan-400 mb-1">ACTIVE</div>
                  )}
                  {!isPurchased && (
                    <div className="text-xs font-body text-neon-green opacity-70">
                      <div>Prestige {avatar.config.unlockPrestige}+</div>
                      <div>{avatar.config.unlockCostCoins} coins</div>
                      {!canAfford && (
                        <div className="text-red-500">Cannot afford</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Statistics Section */}
        <div className="retro-panel mb-8">
          <h2 className="font-menu text-base md:text-lg mb-4 text-neon-green border-b-2 border-neon-green pb-2">
            STATISTICS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatItem iconType="trophy" label="Total Coins Earned" value={totalCoinsEarned} />
            <StatItem iconType="trophy" label="Total Coins Spent" value={totalCoinsSpent} />
            <StatItem iconType="rocket" label="Highest Prestige" value={currentPrestige} />
            <StatItem iconType="cubes" label="Mini-Mes Used (Lifetime)" value={totalMiniMesUsed} />
            <StatItem iconType="trophy" label="Prestige Completions" value={
              (() => {
                try {
                  const completed = JSON.parse(localStorage.getItem('neonSentinel_prestigeCompleted') || '[]') as boolean[];
                  return completed.filter(Boolean).length;
                } catch {
                  return 0;
                }
              })()
            } />
          </div>
        </div>
        
        {/* Prime Sentinel Badge */}
        {isPrimeSentinel && (
          <div className="retro-panel mb-8 border-2 border-cyan-400 bg-cyan-400 bg-opacity-10">
            <h2 className="font-menu text-base md:text-lg mb-4 text-cyan-400 border-b-2 border-cyan-400 pb-2">
              PRIME SENTINEL
            </h2>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 border-2 border-cyan-400 bg-black flex items-center justify-center">
                <div className="text-4xl">👑</div>
              </div>
              <div className="flex-1">
                <div className="font-menu text-xl text-cyan-400 mb-2">
                  PRIME SENTINEL ACHIEVED
                </div>
                <div className="font-body text-sm text-cyan-400 opacity-80">
                  You have defeated Zrechostikal and achieved the highest rank. Terminal Neon is liberated.
                </div>
                <div className="mt-2 font-body text-xs text-cyan-400 opacity-60">
                  Legendary status • All systems unlocked • Transcendent Form available
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Bullet Tier Display */}
        <div className="retro-panel mb-8">
          <h2 className="font-menu text-base md:text-lg mb-4 text-neon-green border-b-2 border-neon-green pb-2">
            BULLET TIER
          </h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 border-2 border-neon-green bg-black flex items-center justify-center">
              <div className="text-2xl font-menu text-neon-green">{currentBulletTier.tier}</div>
            </div>
            <div>
              <div className="font-menu text-lg text-neon-green">{currentBulletTier.name}</div>
              <div className="font-body text-sm text-neon-green opacity-70">
                Tier {currentBulletTier.tier}/{BULLET_TIERS.length} • {currentBulletTier.damageMultiplier}x Damage • {currentBulletTier.speedMultiplier}x Speed
              </div>
            </div>
          </div>
          
          {/* Tier Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-neon-green opacity-70 mb-2">
              <span>Progress</span>
              <span>{tierProgress.currentTier}/{tierProgress.maxTier}</span>
            </div>
            <div className="w-full bg-black border-2 border-neon-green border-opacity-30 h-4">
              <div 
                className="h-full bg-neon-green transition-all duration-300"
                style={{ width: `${tierProgress.progress * 100}%` }}
              />
            </div>
          </div>
          
          {/* Next Tier Unlock */}
          {tierProgress.nextTier && (
            <div className="text-xs text-neon-green opacity-70">
              Next: <span className="font-menu">{tierProgress.nextTier.name}</span> at Prestige {tierProgress.nextTier.unlockPrestige}
            </div>
          )}
          
          {/* All Tiers List */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
            {BULLET_TIERS.map((tier) => {
              const isUnlocked = currentPrestige >= tier.unlockPrestige;
              const isCurrent = tier.tier === currentBulletTier.tier;
              
              return (
                <div
                  key={tier.tier}
                  className={`border-2 p-2 text-center ${
                    isCurrent
                      ? 'border-neon-green bg-neon-green bg-opacity-10'
                      : isUnlocked
                      ? 'border-neon-green border-opacity-40'
                      : 'border-gray-700 border-opacity-50 opacity-60'
                  }`}
                >
                  <div className="text-xs font-menu text-neon-green mb-1">
                    Tier {tier.tier}
                  </div>
                  <div className="text-[10px] text-neon-green opacity-70 mb-1">
                    {tier.name}
                  </div>
                  {isUnlocked ? (
                    <div className="text-[10px] text-neon-green opacity-60">
                      {tier.damageMultiplier}x DMG
                    </div>
                  ) : (
                    <div className="text-[10px] text-neon-green opacity-50">
                      P{tier.unlockPrestige}+
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Lifetime Stats */}
          <div className="retro-panel">
            <h2 className="font-menu text-base md:text-lg mb-4 text-neon-green border-b-2 border-neon-green pb-2">
              LIFETIME STATS
            </h2>
            <div className="space-y-1">
              <StatItem 
                iconType="target"
                label="Total score" 
                value={stats.lifetimeScore.toLocaleString()} 
              />
              <StatItem 
                iconType="rocket"
                label="High score" 
                value={stats.bestRunStats?.finalScore || stats.lifetimeScore || 0} 
              />
              <StatItem 
                iconType="running"
                label="Total runs" 
                value={stats.recentRecords.length || 0} 
              />
              <StatItem 
                iconType="clock"
                label="Time played" 
                value={formatTime(stats.lifetimePlayMs)} 
              />
              <StatItem 
                iconType="skull"
                label="Kills" 
                value={stats.lifetimeEnemiesDefeated.toLocaleString()} 
              />
              <StatItem 
                iconType="shield"
                label={`Layer ${stats.favoriteLayer}`} 
                value={stats.favoriteLayer} 
              />
              <StatItem 
                iconType="cubes"
                label="Data cubes collected" 
                value={stats.bestRunStats?.powerUpsCollected || 0} 
              />
            </div>
          </div>

          {/* Best Run */}
          <div className="retro-panel">
            <h2 className="font-menu text-base md:text-lg mb-4 text-neon-green border-b-2 border-neon-green pb-2">
              BEST RUN
            </h2>
            {stats.bestRunStats ? (
              <div className="space-y-1">
                <div className="flex items-center gap-3 py-2 border-b border-neon-green border-opacity-20">
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                    <StatIcon type="target" size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-neon-green opacity-70 font-menu uppercase tracking-wider">Character</div>
                    <div className="text-sm font-body text-neon-green mt-0.5">Standard Sentinel</div>
                  </div>
                </div>
                <StatItem 
                  iconType="clock"
                  label="HIGH SCORE" 
                  value={stats.bestRunStats.finalScore.toLocaleString()} 
                />
                <StatItem 
                  iconType="skull"
                  label="KILLS" 
                  value={stats.bestRunStats.enemiesDefeated.toLocaleString()} 
                />
                <StatItem 
                  iconType="accuracy"
                  label="ACCURACY" 
                  value={`${Math.round(stats.bestRunStats.accuracy * 100)}%`} 
                />
                <StatItem 
                  iconType="cubes"
                  label="DATA CUBES COLLECTED" 
                  value={stats.bestRunStats.powerUpsCollected.toLocaleString()} 
                />
                <StatItem 
                  iconType="shield"
                  label="DEEPEST LAYER" 
                  value={`Layer ${stats.bestRunStats.deepestLayer}`} 
                />
                <StatItem 
                  iconType="shield"
                  label="LAYER REACHED" 
                  value={`Layer ${stats.bestRunStats.deepestLayer}`} 
                />
                <div className="flex items-center gap-3 py-2 border-b border-neon-green border-opacity-20 last:border-0">
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                    <StatIcon type="biohazard" size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-neon-green opacity-70 font-menu uppercase tracking-wider">Pandemic (Level 1)</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="font-body text-sm opacity-60 py-8 text-center">No runs recorded yet.</div>
            )}
          </div>
        </div>

        {/* Rank History Timeline */}
        {rankHistory.length > 0 && (
          <div className="retro-panel mb-8">
            <h2 className="font-menu text-base md:text-lg mb-4 text-neon-green border-b-2 border-neon-green pb-2">
              RANK HISTORY
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rankHistory.map((rank) => (
                <div
                  key={rank.number}
                  className="border-2 border-neon-green border-opacity-30 p-3"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 border border-neon-green bg-black flex items-center justify-center">
                      <div className="text-sm font-menu text-neon-green">#{rank.number}</div>
                    </div>
                    <div className="flex-1">
                      <div className="font-menu text-sm text-neon-green">{rank.name}</div>
                      <div className="font-body text-xs text-neon-green opacity-70">
                        P{rank.prestige} L{rank.layer}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-body text-neon-green opacity-60">
                    {getRankTierName(rank.tier)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Heroes & Skins */}
        <div className="retro-panel mb-8">
          <h2 className="font-menu text-base md:text-lg mb-4 text-neon-green border-b-2 border-neon-green pb-2">
            HEROES & SKINS
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {heroOptions.map((hero) => {
              const unlocked = stats.lifetimeScore >= hero.unlockScore;
              const isSelected = selectedHero === hero.key;
              const heroKills = unlocked ? Math.floor(stats.lifetimeEnemiesDefeated * 0.3) : 0;
              const heroLayer = unlocked ? stats.favoriteLayer : 1;
              
              return (
                <div
                  key={hero.key}
                  className={`border-2 p-3 text-left transition-all relative ${
                    unlocked 
                      ? isSelected 
                        ? "border-neon-green bg-neon-green bg-opacity-10" 
                        : "border-neon-green border-opacity-40 hover:border-opacity-100 hover:bg-neon-green hover:bg-opacity-5"
                      : "border-gray-700 border-opacity-50 opacity-60"
                  }`}
                >
                  <div className="flex items-start gap-3 mb-2">
                    <img
                      src={hero.sprite}
                      alt={hero.name}
                      className="w-12 h-12 flex-shrink-0"
                      style={{ 
                        filter: unlocked 
                          ? "drop-shadow(0 0 6px #00ff99)" 
                          : "grayscale(1) opacity(0.5)"
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-menu text-xs mb-1">{hero.name}</div>
                    </div>
                  </div>
                  {unlocked && (
                    <div className="space-y-1 text-[10px] text-neon-green opacity-70 mb-2">
                      <div>Kills: {heroKills.toLocaleString()}</div>
                      <div>layer: {heroLayer}</div>
                    </div>
                  )}
                  {unlocked && (
                    <button
                      type="button"
                      className="w-full text-xs font-menu text-neon-green border border-neon-green border-opacity-50 px-2 py-1 hover:bg-neon-green hover:bg-opacity-10 transition-all"
                      onClick={() => {
                        setSelectedHero(hero.key);
                        setSelectedHeroState(hero.key);
                      }}
                    >
                      {isSelected ? "EQUIPPED" : "Equip"}
                    </button>
                  )}
                </div>
              );
            })}
            {/* Show "+12 more" placeholder */}
            <div className="border-2 border-neon-green border-opacity-20 p-3 flex items-center justify-center">
              <div className="text-xs font-menu text-neon-green opacity-50">+12 more</div>
            </div>
          </div>
        </div>

        {/* Recent Personal Records */}
        <div className="retro-panel mb-8">
          <h2 className="font-menu text-base md:text-lg mb-4 text-neon-green border-b-2 border-neon-green pb-2">
            RECENT PERSONAL RECORDS
          </h2>
          {/* First Row - Character-specific records */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {heroOptions.slice(0, 4).map((hero) => {
              const unlocked = stats.lifetimeScore >= hero.unlockScore;
              const heroKills = unlocked ? Math.floor(stats.lifetimeEnemiesDefeated * 0.25) : 0;
              const heroLayer = unlocked ? Math.max(1, stats.favoriteLayer - 1) : 1;
              
              return (
                <div
                  key={hero.key}
                  className="border-2 border-neon-green border-opacity-30 p-3"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <img
                      src={hero.sprite}
                      alt={hero.name}
                      className="w-8 h-8 flex-shrink-0"
                      style={{ 
                        filter: unlocked 
                          ? "drop-shadow(0 0 4px #00ff99)" 
                          : "grayscale(1) opacity(0.5)"
                      }}
                    />
                    <div className="flex-1">
                      <div className="font-menu text-xs text-neon-green">{hero.name}</div>
                    </div>
                  </div>
                  {unlocked ? (
                    <>
                      <div className="text-[10px] text-neon-green opacity-70 mb-1">Kills: {heroKills.toLocaleString()}</div>
                      <div className="text-[10px] text-neon-green opacity-70 mb-2">Layer: {heroLayer}</div>
                      <button
                        type="button"
                        className="text-[10px] font-menu text-neon-green border border-neon-green border-opacity-50 px-2 py-1 hover:bg-neon-green hover:bg-opacity-10 transition-all"
                        onClick={() => {
                          setSelectedHero(hero.key);
                          setSelectedHeroState(hero.key);
                        }}
                      >
                        Equip
                      </button>
                    </>
                  ) : (
                    <div className="text-[10px] text-neon-green opacity-50">Locked</div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Second Row - Overall personal bests */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 py-2 border-b border-neon-green border-opacity-20">
              <StatIcon type="trophy" size={20} />
              <div className="flex-1">
                <div className="text-xs text-neon-green opacity-70 font-menu uppercase tracking-wider">Highest Score</div>
                <div className="text-sm font-body text-neon-green mt-0.5">
                  {stats.bestRunStats?.finalScore || stats.lifetimeScore || 0}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 py-2 border-b border-neon-green border-opacity-20">
              <StatIcon type="accuracy" size={20} />
              <div className="flex-1">
                <div className="text-xs text-neon-green opacity-70 font-menu uppercase tracking-wider">Best Accuracy</div>
                <div className="text-sm font-body text-neon-green mt-0.5">
                  {stats.bestRunStats ? `${Math.round(stats.bestRunStats.accuracy * 100)}%` : '0%'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 py-2 border-b border-neon-green border-opacity-20">
              <StatIcon type="cubes" size={20} />
              <div className="flex-1">
                <div className="text-xs text-neon-green opacity-70 font-menu uppercase tracking-wider">Best Data Collected</div>
                <div className="text-sm font-body text-neon-green mt-0.5">
                  {stats.bestRunStats?.powerUpsCollected || 0}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 py-2 border-b border-neon-green border-opacity-20">
              <StatIcon type="skull" size={20} />
              <div className="flex-1">
                <div className="text-xs text-neon-green opacity-70 font-menu uppercase tracking-wider">Most Kills</div>
                <div className="text-sm font-body text-neon-green mt-0.5">
                  {stats.bestRunStats?.enemiesDefeated || stats.lifetimeEnemiesDefeated || 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
