import { useState } from "react";
import { Link } from "react-router-dom";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { LAYER_CONFIG } from "../game/config";
import {
  getAllAchievements,
  getProfileStats,
  getSelectedHero,
  getSelectedSkin,
  loadAchievementState,
  setSelectedHero,
  setSelectedSkin,
} from "../services/achievementService";
import { getOverallRanking } from "../services/scoreService";
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

function StatItem({ icon, label, value }: { icon?: string; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-neon-green border-opacity-20 last:border-0">
      {icon && (
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
          <img src={icon} alt="" className="w-6 h-6 opacity-80" style={{ filter: "drop-shadow(0 0 3px #00ff99)" }} />
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
  const { primaryWallet } = useDynamicContext();
  const stats = getProfileStats();
  const achievementState = loadAchievementState();
  const achievements = getAllAchievements();
  const overallRanking = primaryWallet
    ? getOverallRanking({ walletAddress: primaryWallet.address })
    : null;
  const [selectedHero, setSelectedHeroState] = useState(getSelectedHero());
  const [selectedSkin, setSelectedSkinState] = useState(getSelectedSkin());
  const achievementPercent = stats.achievementsTotal
    ? Math.round((stats.achievementsUnlocked / stats.achievementsTotal) * 100)
    : 0;
  const favoriteLayerName =
    LAYER_CONFIG[stats.favoriteLayer as keyof typeof LAYER_CONFIG]?.name ||
    "Boot Sector";

  const heroOptions = [
    {
      key: "sentinel_standard",
      name: "Sentinel Standard",
      sprite: "/sprites/hero.svg",
      unlockScore: 0,
    },
    {
      key: "sentinel_vanguard",
      name: "Sentinel Vanguard",
      sprite: "/sprites/hero_2.svg",
      unlockScore: 25000,
    },
    {
      key: "sentinel_ghost",
      name: "Sentinel Ghost",
      sprite: "/sprites/hero_3.svg",
      unlockScore: 75000,
    },
    {
      key: "sentinel_drone",
      name: "Sentinel Drone",
      sprite: "/sprites/hero_sidekick_2.svg",
      unlockScore: 150000,
    },
  ];

  const skinOptions = [
    { key: "skin_default", name: "Default", filter: "none", unlockScore: 0 },
    {
      key: "skin_crimson",
      name: "Crimson",
      filter: "hue-rotate(320deg) saturate(1.2)",
      unlockScore: 30000,
    },
    {
      key: "skin_aurora",
      name: "Aurora",
      filter: "hue-rotate(120deg) saturate(1.3)",
      unlockScore: 90000,
    },
    {
      key: "skin_void",
      name: "Void",
      filter: "grayscale(0.2) contrast(1.3)",
      unlockScore: 160000,
    },
  ];

  return (
    <div className="min-h-screen bg-black text-neon-green relative overflow-hidden scanlines">
      <div className="fixed inset-0 opacity-8 pointer-events-none animated-grid" />
      <div className="relative z-10 container mx-auto px-4 md:px-8 py-8 md:py-12 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-menu text-2xl md:text-3xl text-neon-green tracking-wider">
            PROFILE & STATS
          </h1>
          <Link
            to="/"
            className="font-menu text-sm text-neon-green hover:text-red-500 transition-all duration-200 px-4 py-2 border border-neon-green hover:bg-neon-green hover:text-black"
          >
            &gt; BACK
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Lifetime Stats */}
          <div className="retro-panel">
            <h2 className="font-menu text-lg mb-4 text-neon-green border-b-2 border-neon-green pb-2 flex items-center gap-2">
              <span className="text-red-500">&gt;</span>
              LIFETIME STATS
            </h2>
            <div className="space-y-1">
              <StatItem 
                icon="/sprites/orb.svg"
                label="Lifetime Score" 
                value={stats.lifetimeScore.toLocaleString()} 
              />
              <StatItem 
                icon="/sprites/power_up.svg"
                label="Hours Played" 
                value={(stats.lifetimePlayMs / 3600000).toFixed(1)} 
              />
              <StatItem 
                icon="/sprites/enemy_green.svg"
                label="Enemies Defeated" 
                value={stats.lifetimeEnemiesDefeated.toLocaleString()} 
              />
              <StatItem 
                label="Achievements" 
                value={`${achievementPercent}% (${stats.achievementsUnlocked}/${stats.achievementsTotal})`} 
              />
              <StatItem 
                label="Favorite Layer" 
                value={`Layer ${stats.favoriteLayer} (${favoriteLayerName})`} 
              />
              <StatItem 
                label="Overall Rank" 
                value={overallRanking ? `#${overallRanking.rank}` : "LOGIN TO VIEW"} 
              />
            </div>
          </div>

          {/* Best Run */}
          <div className="retro-panel">
            <h2 className="font-menu text-lg mb-4 text-neon-green border-b-2 border-neon-green pb-2 flex items-center gap-2">
              <span className="text-red-500">&gt;</span>
              BEST RUN
            </h2>
            {stats.bestRunStats ? (
              <div className="space-y-1">
                <StatItem 
                  icon="/sprites/power_up_2.svg"
                  label="Survival Time" 
                  value={formatTime(stats.bestRunStats.survivalTimeMs)} 
                />
                <StatItem 
                  label="Final Score" 
                  value={stats.bestRunStats.finalScore.toLocaleString()} 
                />
                <StatItem 
                  label="Deepest Layer" 
                  value={`Layer ${stats.bestRunStats.deepestLayer} (${LAYER_CONFIG[stats.bestRunStats.deepestLayer as keyof typeof LAYER_CONFIG]?.name || "Boot Sector"})`} 
                />
                <StatItem 
                  label="Max Corruption" 
                  value={`${Math.round(stats.bestRunStats.maxCorruption)}%`} 
                />
                <StatItem 
                  icon="/sprites/enemy_green.svg"
                  label="Enemies Defeated" 
                  value={stats.bestRunStats.enemiesDefeated.toLocaleString()} 
                />
                <StatItem 
                  label="Accuracy" 
                  value={`${Math.round(stats.bestRunStats.accuracy * 100)}%`} 
                />
                <StatItem 
                  label="Best Combo" 
                  value={`${stats.bestRunStats.bestCombo.toFixed(1)}x`} 
                />
                <StatItem 
                  label="Lives Used" 
                  value={stats.bestRunStats.livesUsed.toLocaleString()} 
                />
                <StatItem 
                  label="Power-Ups Collected" 
                  value={stats.bestRunStats.powerUpsCollected.toLocaleString()} 
                />
                <StatItem 
                  label="Deaths" 
                  value={stats.bestRunStats.deaths.toLocaleString()} 
                />
              </div>
            ) : (
              <div className="font-body text-sm opacity-60 py-8 text-center">No runs recorded yet.</div>
            )}
          </div>
        </div>

        {/* Achievements */}
        <div className="retro-panel mb-6">
          <h2 className="font-menu text-lg mb-4 text-neon-green border-b-2 border-neon-green pb-2 flex items-center gap-2">
            <span className="text-red-500">&gt;</span>
            MY ACHIEVEMENTS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {achievements.map((achievement) => {
              const unlocked = achievementState.unlocked.includes(achievement.id);
              const progress = achievementState.progress[achievement.id] ?? 0;
              return (
                <div
                  key={achievement.id}
                  className={`border p-3 transition-all ${
                    unlocked 
                      ? "border-neon-green bg-neon-green bg-opacity-5" 
                      : "border-gray-700 border-opacity-50 opacity-70"
                  } hover:border-opacity-100`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-menu text-xs flex-1 leading-tight">{achievement.name}</span>
                    <span className={`text-xs font-menu flex-shrink-0 ${unlocked ? "text-neon-green" : "text-red-500"}`}>
                      {unlocked ? "✓" : `${progress}%`}
                    </span>
                  </div>
                  <div className="text-xs opacity-80 mb-2 leading-relaxed">{achievement.description}</div>
                  {!unlocked && progress > 0 && (
                    <div className="w-full bg-gray-800 bg-opacity-50 h-1 mb-2">
                      <div 
                        className="bg-neon-green h-full transition-all" 
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                  <div className="text-[10px] text-neon-green opacity-60 uppercase tracking-wider">
                    {achievement.reward.replace(/_/g, " ")}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Heroes & Skins */}
        <div className="retro-panel mb-6">
          <h2 className="font-menu text-lg mb-4 text-neon-green border-b-2 border-neon-green pb-2 flex items-center gap-2">
            <span className="text-red-500">&gt;</span>
            HEROES & SKINS
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hero Selection */}
            <div>
              <div className="font-menu text-sm mb-3 text-neon-green opacity-90">HERO SELECTION</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {heroOptions.map((hero) => {
                  const unlocked = stats.lifetimeScore >= hero.unlockScore;
                  const isSelected = selectedHero === hero.key;
                  return (
                    <button
                      key={hero.key}
                      type="button"
                      className={`border p-3 text-left transition-all ${
                        unlocked 
                          ? isSelected 
                            ? "border-neon-green bg-neon-green bg-opacity-10" 
                            : "border-neon-green border-opacity-50 hover:border-opacity-100 hover:bg-neon-green hover:bg-opacity-5"
                          : "border-gray-700 border-opacity-50 opacity-60 cursor-not-allowed"
                      }`}
                      onClick={() => {
                        if (!unlocked) return;
                        setSelectedHero(hero.key);
                        setSelectedHeroState(hero.key);
                      }}
                      disabled={!unlocked}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={hero.sprite}
                          alt={hero.name}
                          className="w-10 h-10 flex-shrink-0"
                          style={{ 
                            filter: unlocked 
                              ? "drop-shadow(0 0 6px #00ff99)" 
                              : "grayscale(1) opacity(0.5)"
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-menu text-xs mb-1 truncate">{hero.name}</div>
                          <div className="text-[10px] opacity-70">
                            {unlocked
                              ? isSelected
                                ? <span className="text-neon-green">SELECTED</span>
                                : "UNLOCKED"
                              : `LOCKED • ${hero.unlockScore.toLocaleString()} pts`}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Skin Selection */}
            <div>
              <div className="font-menu text-sm mb-3 text-neon-green opacity-90">SKIN SELECTION</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {skinOptions.map((skin) => {
                  const unlocked = stats.lifetimeScore >= skin.unlockScore;
                  const isSelected = selectedSkin === skin.key;
                  return (
                    <button
                      key={skin.key}
                      type="button"
                      className={`border p-3 text-left transition-all ${
                        unlocked 
                          ? isSelected 
                            ? "border-neon-green bg-neon-green bg-opacity-10" 
                            : "border-neon-green border-opacity-50 hover:border-opacity-100 hover:bg-neon-green hover:bg-opacity-5"
                          : "border-gray-700 border-opacity-50 opacity-60 cursor-not-allowed"
                      }`}
                      onClick={() => {
                        if (!unlocked) return;
                        setSelectedSkin(skin.key);
                        setSelectedSkinState(skin.key);
                      }}
                      disabled={!unlocked}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src="/sprites/hero.svg"
                          alt={skin.name}
                          className="w-10 h-10 flex-shrink-0"
                          style={{ 
                            filter: unlocked 
                              ? `${skin.filter} drop-shadow(0 0 6px #00ff99)` 
                              : "grayscale(1) opacity(0.5)"
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-menu text-xs mb-1 truncate">{skin.name}</div>
                          <div className="text-[10px] opacity-70">
                            {unlocked
                              ? isSelected
                                ? <span className="text-neon-green">SELECTED</span>
                                : "UNLOCKED"
                              : `LOCKED • ${skin.unlockScore.toLocaleString()} pts`}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Records */}
        <div className="retro-panel">
          <h2 className="font-menu text-lg mb-4 text-neon-green border-b-2 border-neon-green pb-2 flex items-center gap-2">
            <span className="text-red-500">&gt;</span>
            RECENT PERSONAL RECORDS
          </h2>
          {stats.recentRecords.length > 0 ? (
            <div className="space-y-2">
              {stats.recentRecords.map((record, index) => (
                <div key={`${record.label}-${index}`} className="flex items-center justify-between py-2 border-b border-neon-green border-opacity-20 last:border-0">
                  <span className="text-xs text-neon-green opacity-70 font-menu uppercase tracking-wider">{record.label}</span>
                  <span className="text-sm font-body text-neon-green">{record.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="font-body text-sm opacity-60 py-8 text-center">No recent records yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
