import { Link } from "react-router-dom";
import { LAYER_CONFIG } from "../game/config";
import { getProfileStats } from "../services/achievementService";
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

function ProfilePage() {
  const stats = getProfileStats();
  const achievementPercent = stats.achievementsTotal
    ? Math.round((stats.achievementsUnlocked / stats.achievementsTotal) * 100)
    : 0;
  const favoriteLayerName =
    LAYER_CONFIG[stats.favoriteLayer as keyof typeof LAYER_CONFIG]?.name ||
    "Boot Sector";

  return (
    <div className="min-h-screen bg-black text-neon-green relative overflow-hidden scanlines">
      <div className="fixed inset-0 opacity-8 pointer-events-none animated-grid" />
      <div className="relative z-10 container mx-auto px-4 md:px-8 py-8 md:py-12 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-menu text-xl md:text-2xl text-neon-green">
            PROFILE & STATS
          </h1>
          <Link
            to="/"
            className="font-menu text-sm text-neon-green hover:text-red-500 transition-all duration-200"
          >
            &gt; BACK
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="retro-panel">
            <h2 className="font-menu text-base mb-4 text-neon-green border-b-2 border-neon-green pb-2">
              LIFETIME STATS
            </h2>
            <div className="space-y-2 text-sm font-body">
              <div>Lifetime Score: {stats.lifetimeScore.toLocaleString()}</div>
              <div>Hours Played: {(stats.lifetimePlayMs / 3600000).toFixed(1)}</div>
              <div>Enemies Defeated: {stats.lifetimeEnemiesDefeated.toLocaleString()}</div>
              <div>
                Achievements Unlocked: {achievementPercent}% ({stats.achievementsUnlocked}/
                {stats.achievementsTotal})
              </div>
              <div>
                Favorite Layer: Layer {stats.favoriteLayer} ({favoriteLayerName})
              </div>
            </div>
          </div>

          <div className="retro-panel">
            <h2 className="font-menu text-base mb-4 text-neon-green border-b-2 border-neon-green pb-2">
              BEST RUN
            </h2>
            {stats.bestRunStats ? (
              <div className="space-y-2 text-sm font-body">
                <div>Survival Time: {formatTime(stats.bestRunStats.survivalTimeMs)}</div>
                <div>Final Score: {stats.bestRunStats.finalScore.toLocaleString()}</div>
                <div>
                  Deepest Layer: Layer {stats.bestRunStats.deepestLayer} (
                  {LAYER_CONFIG[stats.bestRunStats.deepestLayer as keyof typeof LAYER_CONFIG]
                    ?.name || "Boot Sector"})
                </div>
                <div>Max Corruption: {Math.round(stats.bestRunStats.maxCorruption)}%</div>
                <div>Enemies Defeated: {stats.bestRunStats.enemiesDefeated.toLocaleString()}</div>
                <div>Accuracy: {Math.round(stats.bestRunStats.accuracy * 100)}%</div>
                <div>Best Combo: {stats.bestRunStats.bestCombo.toFixed(1)}x</div>
                <div>Lives Used: {stats.bestRunStats.livesUsed.toLocaleString()}</div>
                <div>
                  Power-Ups Collected: {stats.bestRunStats.powerUpsCollected.toLocaleString()}
                </div>
                <div>Deaths: {stats.bestRunStats.deaths.toLocaleString()}</div>
              </div>
            ) : (
              <div className="font-body text-sm opacity-60">No runs recorded yet.</div>
            )}
          </div>
        </div>

        <div className="retro-panel">
          <h2 className="font-menu text-base mb-4 text-neon-green border-b-2 border-neon-green pb-2">
            RECENT PERSONAL RECORDS
          </h2>
          {stats.recentRecords.length > 0 ? (
            <div className="space-y-2 text-sm font-body">
              {stats.recentRecords.map((record, index) => (
                <div key={`${record.label}-${index}`}>
                  {record.label}: {record.value}
                </div>
              ))}
            </div>
          ) : (
            <div className="font-body text-sm opacity-60">No recent records yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;

