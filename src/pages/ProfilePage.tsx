import { useState } from "react";
import { Link } from "react-router-dom";
import {
  getProfileStats,
  getSelectedHero,
  setSelectedHero,
} from "../services/achievementService";
import { StatIcon } from "../components/StatIcon";
import { getRankHistory, getCurrentRankFromStorage, getCurrentPrestigeFromStorage, getCurrentLayerFromStorage, getRankTierName, getRankProgress } from "../services/rankService";
import { getCurrentBulletTier, getTierProgress } from "../services/bulletUpgradeService";
import { isAchievementUnlocked } from "../services/achievementService";
import { getAllAvatarsWithStatus, getActiveAvatar } from "../services/avatarService";
import { getTotalEarnedFromSource, getTotalSpentOnPurpose } from "../services/coinService";
import { getInventory } from "../services/inventoryService";
import "./LandingPage.css";
import "./ProfilePage.css";

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

  // Player's actual prestige/layer (for unlocks); rank object holds rank definition, not player progress
  const currentPrestige = getCurrentPrestigeFromStorage();
  const currentLayer = getCurrentLayerFromStorage();
  const currentBulletTier = getCurrentBulletTier(currentPrestige);
  const tierProgress = getTierProgress(currentPrestige);

  // Get rank progress using player's prestige and layer
  const rankProgress = getRankProgress(currentPrestige, currentLayer);

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
    <div className="profile-page min-h-screen bg-black text-neon-green relative overflow-hidden scanlines">
      {/* Background Image */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'url(/sentinel-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{ background: 'rgba(0, 0, 0, 0.8)' }}
        aria-hidden
      />
      <div className="fixed inset-0 opacity-8 pointer-events-none animated-grid" />
      <div className="relative z-10 profile-container">
        <header className="profile-header">
          <h1 className="profile-title">PROFILE & STATS</h1>
          <Link to="/" className="profile-back">
            &gt; BACK
          </Link>
        </header>

        {/* Top row: Rank + Bullet Tier */}
        <div className="profile-top-row">
          {currentRank && (
            <div className="profile-panel">
              <h2 className="profile-panel-title">
                <span className="profile-panel-icon"><StatIcon type="trophy" size={22} /></span>
                CURRENT RANK
              </h2>
              <div className="profile-rank-block">
                <div className="profile-rank-number">#{currentRank.number}</div>
                <div>
                  <div className="profile-rank-name">{currentRank.name}</div>
                  {isPrimeSentinel && (
                    <span className="text-xs font-menu text-cyan-400 border border-cyan-400 px-2 py-0.5 inline-block mt-1">PRIME SENTINEL</span>
                  )}
                  <div className="profile-rank-meta">{getRankTierName(currentRank.tier)} · P{currentPrestige} L{currentLayer}</div>
                </div>
              </div>
              {rankProgress && (
                <div className="profile-progress-wrap">
                  <div className="profile-label mb-1">Progress to next</div>
                  <div className="profile-progress-bar">
                    <div className="profile-progress-fill" style={{ width: `${rankProgress.progress * 100}%` }} />
                  </div>
                  {rankProgress.nextRank && (
                    <div className="profile-card-meta mt-1">Next: {rankProgress.nextRank.name}</div>
                  )}
                </div>
              )}
            </div>
          )}
          <div className="profile-panel">
            <h2 className="profile-panel-title">
              <span className="profile-panel-icon"><StatIcon type="target" size={22} /></span>
              BULLET TIER
            </h2>
            <div className="profile-rank-block">
              <div className="profile-rank-number">{currentBulletTier.tier}</div>
              <div>
                <div className="profile-rank-name">{currentBulletTier.name}</div>
                <div className="profile-rank-meta">{currentBulletTier.damageMultiplier}x DMG · {currentBulletTier.speedMultiplier}x SPD</div>
              </div>
            </div>
            <div className="profile-progress-wrap mt-2">
              <div className="profile-label mb-1">Tier progress</div>
              <div className="profile-progress-bar">
                <div className="profile-progress-fill" style={{ width: `${tierProgress.progress * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Avatar Gallery */}
        <div className="profile-panel">
          <h2 className="profile-panel-title">
            <span className="profile-panel-icon"><StatIcon type="shield" size={22} /></span>
            KERNELS
          </h2>
          <div className="profile-card-grid">
            {allAvatars.map((avatar) => {
              const isActive = avatar.id === activeAvatar;
              const isPurchased = avatar.isPurchased;
              return (
                <div
                  key={avatar.id}
                  className={`profile-card ${isActive ? 'active' : ''} ${isPurchased ? 'unlocked' : ''}`}
                >
                  <div className="profile-card-icon-cell">
                    {isPurchased ? (
                      <img
                        src={`/sprites/${avatar.config.spriteKey}.svg`}
                        alt=""
                        className="max-w-full max-h-full object-contain"
                        style={{ filter: isActive ? 'drop-shadow(0 0 6px #00ffff)' : 'drop-shadow(0 0 4px #00ff00)' }}
                        onError={(e) => { (e.target as HTMLImageElement).src = '/sprites/hero.svg'; }}
                      />
                    ) : (
                      <span className="text-neon-green opacity-50 text-lg">🔒</span>
                    )}
                  </div>
                  <div className="profile-card-label">{avatar.config.displayName}</div>
                  {isActive && <div className="profile-card-meta text-cyan-400">ACTIVE</div>}
                  {!isPurchased && (
                    <div className="profile-card-meta">P{avatar.config.unlockPrestige}+ · {avatar.config.unlockCostCoins} coins</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Statistics */}
        <div className="profile-panel">
          <h2 className="profile-panel-title">
            <span className="profile-panel-icon"><StatIcon type="cubes" size={22} /></span>
            STATISTICS
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <StatItem iconType="trophy" label="Coins earned" value={totalCoinsEarned} />
            <StatItem iconType="trophy" label="Coins spent" value={totalCoinsSpent} />
            <StatItem iconType="rocket" label="Prestige" value={currentPrestige} />
            <StatItem iconType="cubes" label="Mini-Mes used" value={totalMiniMesUsed} />
            <StatItem iconType="trophy" label="Prestige runs" value={
              (() => {
                try {
                  const completed = JSON.parse(localStorage.getItem('neonSentinel_prestigeCompleted') || '[]') as boolean[];
                  return completed.filter(Boolean).length;
                } catch { return 0; }
              })()
            } />
          </div>
        </div>
        
        {/* Prime Sentinel */}
        {isPrimeSentinel && (
          <div className="profile-panel profile-prime-panel">
            <h2 className="profile-panel-title">
              <span className="profile-panel-icon"><StatIcon type="trophy" size={22} /></span>
              PRIME SENTINEL
            </h2>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 border-2 border-cyan-400 bg-black flex items-center justify-center flex-shrink-0 text-2xl">👑</div>
              <div>
                <div className="profile-rank-name text-cyan-400">PRIME SENTINEL ACHIEVED</div>
                <div className="profile-card-meta text-cyan-400/90">Zrechostikal defeated · Transcendent Form unlocked</div>
              </div>
            </div>
          </div>
        )}

        {/* Lifetime & Best Run */}
        <div className="profile-stats-grid">
          <div className="profile-panel">
            <h2 className="profile-panel-title">
              <span className="profile-panel-icon"><StatIcon type="running" size={22} /></span>
              LIFETIME
            </h2>
            <div className="profile-stat-list space-y-0">
              <StatItem iconType="target" label="Total score" value={stats.lifetimeScore.toLocaleString()} />
              <StatItem iconType="rocket" label="High score" value={stats.bestRunStats?.finalScore || stats.lifetimeScore || 0} />
              <StatItem iconType="running" label="Runs" value={stats.recentRecords.length || 0} />
              <StatItem iconType="clock" label="Time played" value={formatTime(stats.lifetimePlayMs)} />
              <StatItem iconType="skull" label="Kills" value={stats.lifetimeEnemiesDefeated.toLocaleString()} />
              <StatItem iconType="shield" label="Fav layer" value={stats.favoriteLayer} />
              <StatItem iconType="cubes" label="Cubes" value={stats.bestRunStats?.powerUpsCollected || 0} />
            </div>
          </div>
          <div className="profile-panel">
            <h2 className="profile-panel-title">
              <span className="profile-panel-icon"><StatIcon type="trophy" size={22} /></span>
              BEST RUN
            </h2>
            {stats.bestRunStats ? (
              <div className="profile-stat-list space-y-0">
                <StatItem iconType="target" label="Score" value={stats.bestRunStats.finalScore.toLocaleString()} />
                <StatItem iconType="skull" label="Kills" value={stats.bestRunStats.enemiesDefeated.toLocaleString()} />
                <StatItem iconType="accuracy" label="Accuracy" value={`${Math.round(stats.bestRunStats.accuracy * 100)}%`} />
                <StatItem iconType="cubes" label="Cubes" value={stats.bestRunStats.powerUpsCollected.toLocaleString()} />
                <StatItem iconType="shield" label="Layer" value={stats.bestRunStats.deepestLayer} />
              </div>
            ) : (
              <div className="profile-value-dim py-4 text-center">No runs yet</div>
            )}
          </div>
        </div>

        {/* Rank History */}
        {rankHistory.length > 0 && (
          <div className="profile-panel">
            <h2 className="profile-panel-title">
              <span className="profile-panel-icon"><StatIcon type="clock" size={22} /></span>
              RANK HISTORY
            </h2>
            <div className="profile-card-grid">
              {rankHistory.slice(-6).reverse().map((rank) => (
                <div key={rank.number} className="profile-card unlocked">
                  <div className="profile-card-icon-cell">
                    <span className="profile-value">#{rank.number}</span>
                  </div>
                  <div className="profile-card-label">{rank.name}</div>
                  <div className="profile-card-meta">P{rank.prestige} L{rank.layer}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Heroes & Skins */}
        <div className="profile-panel">
          <h2 className="profile-panel-title">
            <span className="profile-panel-icon"><StatIcon type="rocket" size={22} /></span>
            HEROES & SKINS
          </h2>
          <div className="profile-card-grid">
            {heroOptions.map((hero) => {
              const unlocked = stats.lifetimeScore >= hero.unlockScore;
              const isSelected = selectedHero === hero.key;
              const heroKills = unlocked ? Math.floor(stats.lifetimeEnemiesDefeated * 0.3) : 0;
              const heroLayer = unlocked ? stats.favoriteLayer : 1;
              return (
                <div
                  key={hero.key}
                  className={`profile-card ${unlocked ? 'unlocked' : ''} ${isSelected ? 'active' : ''}`}
                >
                  <div className="profile-card-icon-cell">
                    <img src={hero.sprite} alt="" className="max-w-full max-h-full object-contain" style={{ filter: unlocked ? "drop-shadow(0 0 5px #00ff00)" : "grayscale(1) opacity(0.5)" }} />
                  </div>
                  <div className="profile-card-label">{hero.name}</div>
                  {unlocked && <div className="profile-card-meta">Kills: {heroKills.toLocaleString()} · L{heroLayer}</div>}
                  {unlocked && (
                    <button type="button" className="w-full mt-1 text-[10px] font-menu text-neon-green border border-neon-green/50 px-2 py-1 hover:bg-neon-green/10 transition-all" onClick={() => { setSelectedHero(hero.key); setSelectedHeroState(hero.key); }}>
                      {isSelected ? "EQUIPPED" : "Equip"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Bests */}
        <div className="profile-panel">
          <h2 className="profile-panel-title">
            <span className="profile-panel-icon"><StatIcon type="target" size={22} /></span>
            QUICK BESTS
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="profile-stat-row">
              <div className="stat-icon-wrap"><StatIcon type="trophy" size={20} /></div>
              <div>
                <div className="profile-label">High score</div>
                <div className="profile-value">{stats.bestRunStats?.finalScore || stats.lifetimeScore || 0}</div>
              </div>
            </div>
            <div className="profile-stat-row">
              <div className="stat-icon-wrap"><StatIcon type="accuracy" size={20} /></div>
              <div>
                <div className="profile-label">Accuracy</div>
                <div className="profile-value">{stats.bestRunStats ? `${Math.round(stats.bestRunStats.accuracy * 100)}%` : '0%'}</div>
              </div>
            </div>
            <div className="profile-stat-row">
              <div className="stat-icon-wrap"><StatIcon type="cubes" size={20} /></div>
              <div>
                <div className="profile-label">Cubes</div>
                <div className="profile-value">{stats.bestRunStats?.powerUpsCollected || 0}</div>
              </div>
            </div>
            <div className="profile-stat-row">
              <div className="stat-icon-wrap"><StatIcon type="skull" size={20} /></div>
              <div>
                <div className="profile-label">Kills</div>
                <div className="profile-value">{stats.bestRunStats?.enemiesDefeated || stats.lifetimeEnemiesDefeated || 0}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
