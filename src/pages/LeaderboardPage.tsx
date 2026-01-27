import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import logoImage from '../assets/logo.png';
import {
  fetchWeeklyCategoryLeaderboard,
  fetchAllTimeCategoryLeaderboard,
  fetchWeeklyChallengeLeaderboard,
  getFeaturedWeeklyCategories,
  getCurrentISOWeek,
  getOverallRanking,
  getWeeklyRanking,
  type LeaderboardCategoryKey,
  type ScoreEntry,
} from '../services/scoreService';
import { LEADERBOARD_CATEGORIES, FEATURED_LEADERBOARD_COUNT } from '../game/config';
import {
  getUnlockedBadges,
  getUnlockedCosmetics,
  getSelectedCosmetic,
  setSelectedCosmetic,
} from '../services/achievementService';
import './LandingPage.css';

type CategoryBoard = { key: LeaderboardCategoryKey; entries: ScoreEntry[] };

function LeaderboardPage() {
  const { primaryWallet } = useDynamicContext();
  const [currentWeek, setCurrentWeek] = useState<number>(1);
  const [featuredBoards, setFeaturedBoards] = useState<CategoryBoard[]>([]);
  const [allTimeBoards, setAllTimeBoards] = useState<CategoryBoard[]>([]);
  const [challengeLeaders, setChallengeLeaders] = useState<ScoreEntry[]>([]);
  const [badges, setBadges] = useState<string[]>([]);
  const [cosmetics, setCosmetics] = useState<string[]>([]);
  const [selectedCosmetic, setSelectedCosmeticState] = useState<string>('none');
  const overallRanking = primaryWallet
    ? getOverallRanking({ walletAddress: primaryWallet.address })
    : null;
  const weeklyRanking = primaryWallet
    ? getWeeklyRanking({ walletAddress: primaryWallet.address })
    : null;

  useEffect(() => {
    const week = getCurrentISOWeek();
    setCurrentWeek(week);
    const featured = getFeaturedWeeklyCategories(week, FEATURED_LEADERBOARD_COUNT);
    setFeaturedBoards(
      featured.map((key) => ({
        key,
        entries: fetchWeeklyCategoryLeaderboard(key),
      }))
    );

    const inactive = Object.keys(LEADERBOARD_CATEGORIES).filter(
      (key) => !featured.includes(key as LeaderboardCategoryKey)
    ) as LeaderboardCategoryKey[];
    setAllTimeBoards(
      inactive.map((key) => ({
        key,
        entries: fetchAllTimeCategoryLeaderboard(key),
      }))
    );
    setChallengeLeaders(fetchWeeklyChallengeLeaderboard());
    setBadges(getUnlockedBadges());
    setCosmetics(getUnlockedCosmetics());
    setSelectedCosmeticState(getSelectedCosmetic());
  }, []);

  const getValueLabel = (key: LeaderboardCategoryKey, entry: ScoreEntry) => {
    switch (key) {
      case 'highestScore':
        return `${(entry.finalScore ?? entry.score ?? 0).toLocaleString()} pts`;
      case 'longestSurvival':
        return `${Math.round(entry.survivalTime ?? 0)}s`;
      case 'highestCorruption':
        return `${Math.round(entry.maxCorruptionReached ?? 0)}%`;
      case 'mostEnemiesDefeated':
        return `${entry.totalEnemiesDefeated ?? 0} kills`;
      case 'cleanRuns':
        return entry.runsWithoutDamage ? 'Flawless' : '0';
      case 'highestCombo':
        return `${Number(entry.peakComboMultiplier ?? 0).toFixed(1)}x`;
      case 'deepestLayer': {
        const depth =
          entry.deepestLayerWithPrestige ??
          (entry.deepestLayer ?? 0) + (entry.prestigeLevel ?? 0);
        return `Depth ${depth}`;
      }
      case 'speedrun':
        return entry.timeToReachLayer6
          ? `${Math.round(entry.timeToReachLayer6)}s`
          : 'N/A';
      default:
        return `${entry.score?.toLocaleString() ?? 0}`;
    }
  };

  const renderBoard = (board: CategoryBoard, label: string) => {
    const category = LEADERBOARD_CATEGORIES[board.key];
    const entries = board.entries.slice(0, 5);
    return (
      <div key={`${board.key}-${label}`} className="retro-panel">
        <div className="flex items-center justify-between mb-3 border-b-2 border-neon-green pb-2">
          <h2 className="font-menu text-base md:text-lg text-neon-green" style={{ letterSpacing: '0.1em' }}>
            {category.title}
          </h2>
          <span className="font-body text-xs text-neon-green opacity-70">{label}</span>
        </div>
        <div className="text-xs text-neon-green opacity-70 mb-3 font-body">
          Reward: <span className="text-red-500">{category.reward}</span>
        </div>
        {("note" in category && (category as any).note) && (
          <div className="text-xs text-neon-green opacity-60 mb-3 font-body">{(category as any).note}</div>
        )}
        {entries.length ? (
          <div className="space-y-2">
            {entries.map((entry, index) => (
              <div key={`${board.key}-${label}-${index}`} className="leaderboard-entry">
                <div className="flex items-center justify-between">
                  <span>
                    <span className="rank-badge font-score text-base">{index + 1}</span>
                    <span className="font-score text-base md:text-lg">
                      {entry.playerName || 'Anonymous'}
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
                    {getValueLabel(board.key, entry)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="leaderboard-entry text-center py-4">
            <div className="font-body text-sm text-neon-green opacity-50">NO RUNS YET</div>
          </div>
        )}
      </div>
    );
  };

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
            backgroundImage:
              'linear-gradient(rgba(0, 255, 0, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 0, 0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>
      <div
        className="fixed inset-0 pointer-events-none z-40"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.5) 100%)',
        }}
      />

      <div className="relative z-10 container mx-auto px-4 md:px-8 py-8 md:py-12 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="font-menu text-base text-neon-green hover:text-red-500">
            &lt; RETURN TO MENU
          </Link>
          <div className="text-center">
            <img
              src={logoImage}
              alt="Neon Sentinel"
              className="max-w-full h-auto"
              style={{ maxHeight: '90px', imageRendering: 'auto' }}
            />
          </div>
          <div className="font-body text-xs text-neon-green opacity-70">
            Week {currentWeek}
          </div>
        </div>

        <div className="retro-panel mb-8">
          <h2 className="font-menu text-base md:text-lg mb-3 text-neon-green border-b-2 border-neon-green pb-2">
            MY RANKING
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-body">
            <div>
              <div className="text-xs text-neon-green opacity-70 mb-1">Weekly Rank</div>
              <div className="font-score text-lg text-neon-green">
                {weeklyRanking ? `#${weeklyRanking.rank}` : 'LOGIN TO VIEW'}
              </div>
              {weeklyRanking && (
                <div className="text-xs text-neon-green opacity-60">
                  Score: {weeklyRanking.score.toLocaleString()}
                </div>
              )}
            </div>
            <div>
              <div className="text-xs text-neon-green opacity-70 mb-1">Overall Rank</div>
              <div className="font-score text-lg text-neon-green">
                {overallRanking ? `#${overallRanking.rank}` : 'LOGIN TO VIEW'}
              </div>
              {overallRanking && (
                <div className="text-xs text-neon-green opacity-60">
                  Score: {overallRanking.score.toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="retro-panel mb-8">
          <h2 className="font-menu text-base md:text-lg mb-3 text-neon-green border-b-2 border-neon-green pb-2">
            YOUR ACHIEVEMENTS
          </h2>
          <div className="mb-4">
            <div className="font-body text-xs text-neon-green opacity-70 mb-2">Badges</div>
            {badges.length ? (
              <div className="flex flex-wrap gap-2">
                {badges.map((badge) => (
                  <span
                    key={badge}
                    className="font-score text-xs text-neon-green border border-neon-green px-2 py-1"
                  >
                    {badge.replace('badge_', '').replace(/_/g, ' ').toUpperCase()}
                  </span>
                ))}
              </div>
            ) : (
              <div className="font-body text-sm text-neon-green opacity-50">NO BADGES YET</div>
            )}
          </div>
          <div>
            <div className="font-body text-xs text-neon-green opacity-70 mb-2">Cosmetic Loadout</div>
            <select
              className="bg-black text-neon-green border border-neon-green px-2 py-1 font-body text-sm"
              value={selectedCosmetic}
              onChange={(event) => {
                const value = event.target.value;
                setSelectedCosmeticState(value);
                setSelectedCosmetic(value);
              }}
            >
              <option value="none">NONE</option>
              {cosmetics.map((cosmetic) => (
                <option key={cosmetic} value={cosmetic}>
                  {cosmetic.replace('cosmetic_', '').replace(/_/g, ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="retro-panel mb-8">
          <h2 className="font-menu text-base md:text-lg mb-3 text-neon-green border-b-2 border-neon-green pb-2">
            CHALLENGE LEADERBOARD
          </h2>
          {challengeLeaders.length ? (
            <div className="space-y-2">
              {challengeLeaders.map((entry, index) => (
                <div key={`${entry.playerName}-${index}`} className="leaderboard-entry">
                  <div className="flex items-center justify-between">
                    <span>
                      <span className="rank-badge font-score text-base">{index + 1}</span>
                      <span className="font-score text-base md:text-lg">
                        {entry.playerName || 'Anonymous'}
                      </span>
                      <span className="font-score text-xs md:text-sm text-red-500 ml-2">
                        P{entry.prestigeLevel ?? 0}
                      </span>
                    </span>
                    <span className="font-score text-base md:text-lg text-neon-green">
                      {entry.score.toLocaleString()}
                    </span>
                  </div>
                  <div className="font-body text-xs text-neon-green opacity-60 mt-1">
                    Modifier: {entry.modifierKey ?? 'standard'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="leaderboard-entry text-center py-4">
              <div className="font-body text-sm text-neon-green opacity-50">NO RUNS YET</div>
            </div>
          )}
        </div>

        <div className="text-center mb-10">
          <h1 className="font-menu text-2xl md:text-3xl text-neon-green tracking-widest">
            HALL OF FAME
          </h1>
          <p className="font-body text-sm text-neon-green opacity-70 mt-2">
            Featured categories rotate weekly. All-time records stay locked in.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-8">
          {featuredBoards.map((board) => renderBoard(board, `Week ${currentWeek}`))}
        </div>

        <div className="text-center mb-6">
          <h2 className="font-menu text-xl text-neon-green tracking-widest">
            ALL-TIME RECORDS
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {allTimeBoards.map((board) => renderBoard(board, 'All-Time'))}
        </div>
      </div>
    </div>
  );
}

export default LeaderboardPage;

