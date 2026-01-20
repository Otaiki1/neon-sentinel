// Score entry interface
export interface ScoreEntry {
  score: number;
  finalScore: number;
  walletAddress?: string;
  playerName: string;
  timestamp: number;
  week: number;
  deepestLayer?: number;
  prestigeLevel?: number;
  modifierKey?: string;
  survivalTime?: number;
  maxCorruptionReached?: number;
  totalEnemiesDefeated?: number;
  runsWithoutDamage?: number;
  peakComboMultiplier?: number;
  timeToReachLayer6?: number;
  deepestLayerWithPrestige?: number;
}

export interface RunMetrics {
  survivalTime: number;
  maxCorruptionReached: number;
  totalEnemiesDefeated: number;
  runsWithoutDamage: number;
  peakComboMultiplier: number;
  timeToReachLayer6?: number;
  deepestLayerWithPrestige: number;
}

export type LeaderboardCategoryKey =
  | 'highestScore'
  | 'longestSurvival'
  | 'highestCorruption'
  | 'mostEnemiesDefeated'
  | 'cleanRuns'
  | 'highestCombo'
  | 'deepestLayer'
  | 'speedrun';

const STORAGE_KEY = 'neon_sentinel_scores';
const WEEK_KEY = 'neon_sentinel_current_week';

/**
 * Calculate ISO week number from a date
 * ISO 8601 week numbering: Week 1 is the week with the year's first Thursday
 */
export function getCurrentISOWeek(date: Date = new Date()): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Get the stored current week number
 */
function getStoredWeek(): number | null {
  const stored = localStorage.getItem(WEEK_KEY);
  return stored ? parseInt(stored, 10) : null;
}

/**
 * Set the stored current week number
 */
function setStoredWeek(week: number): void {
  localStorage.setItem(WEEK_KEY, week.toString());
}

/**
 * Check if the leaderboard should be reset (week has changed)
 */
export function shouldResetLeaderboard(): boolean {
  const currentWeek = getCurrentISOWeek();
  const storedWeek = getStoredWeek();
  
  if (storedWeek === null) {
    // First time - set current week
    setStoredWeek(currentWeek);
    return false;
  }
  
  if (storedWeek !== currentWeek) {
    return true;
  }
  
  return false;
}

/**
 * Reset leaderboard by removing scores from previous weeks
 */
export function resetWeeklyLeaderboard(): void {
  const currentWeek = getCurrentISOWeek();
  const allScores = getAllScores();
  const currentWeekScores = allScores.filter(score => score.week === currentWeek);
  
  // Save only current week scores
  localStorage.setItem(STORAGE_KEY, JSON.stringify(currentWeekScores));
  
  // Update stored week
  setStoredWeek(currentWeek);
}

/**
 * Get all scores from localStorage
 */
function getAllScores(): ScoreEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as ScoreEntry[];
  } catch (error) {
    console.error('Error reading scores from localStorage:', error);
    return [];
  }
}

/**
 * Save scores to localStorage
 */
function saveScores(scores: ScoreEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  } catch (error) {
    console.error('Error saving scores to localStorage:', error);
  }
}

/**
 * Submit a score to the leaderboard
 */
export function submitScore(
  score: number,
  walletAddress?: string,
  deepestLayer?: number,
  prestigeLevel?: number,
  runMetrics?: RunMetrics,
  modifierKey?: string
): void {
  // Check if we need to reset leaderboard
  if (shouldResetLeaderboard()) {
    resetWeeklyLeaderboard();
  }
  
  const currentWeek = getCurrentISOWeek();
  
  // Create player name from wallet address or use anonymous
  const playerName = walletAddress 
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : 'Anonymous';
  
  // Create score entry
  const safeDeepestLayer = deepestLayer || 1;
  const safePrestigeLevel = prestigeLevel || 0;
  const entry: ScoreEntry = {
    score,
    finalScore: score,
    walletAddress,
    playerName,
    timestamp: Date.now(),
    week: currentWeek,
    deepestLayer: safeDeepestLayer,
    prestigeLevel: safePrestigeLevel,
    modifierKey,
    survivalTime: runMetrics?.survivalTime,
    maxCorruptionReached: runMetrics?.maxCorruptionReached,
    totalEnemiesDefeated: runMetrics?.totalEnemiesDefeated,
    runsWithoutDamage: runMetrics?.runsWithoutDamage,
    peakComboMultiplier: runMetrics?.peakComboMultiplier,
    timeToReachLayer6: runMetrics?.timeToReachLayer6,
    deepestLayerWithPrestige:
      runMetrics?.deepestLayerWithPrestige ?? safeDeepestLayer + safePrestigeLevel,
  };
  
  // Get existing scores
  const allScores = getAllScores();
  
  // Add new score
  allScores.push(entry);
  
  // Save scores
  saveScores(allScores);
}

/**
 * Fetch weekly leaderboard (top 10 scores for current week)
 */
export function fetchWeeklyLeaderboard(): ScoreEntry[] {
  // Check if we need to reset leaderboard
  if (shouldResetLeaderboard()) {
    resetWeeklyLeaderboard();
  }
  
  const currentWeek = getCurrentISOWeek();
  const allScores = getAllScores();
  
  // Filter by current week and sort by score (descending)
  const weeklyScores = allScores
    .filter(score => score.week === currentWeek)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10); // Top 10
  
  return weeklyScores;
}

export function fetchWeeklyChallengeLeaderboard(): ScoreEntry[] {
  if (shouldResetLeaderboard()) {
    resetWeeklyLeaderboard();
  }

  const currentWeek = getCurrentISOWeek();
  const allScores = getAllScores();

  return allScores
    .filter(score => score.week === currentWeek && score.modifierKey && score.modifierKey !== 'standard')
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

export function fetchWeeklyCategoryLeaderboard(
  category: LeaderboardCategoryKey
): ScoreEntry[] {
  if (shouldResetLeaderboard()) {
    resetWeeklyLeaderboard();
  }

  const currentWeek = getCurrentISOWeek();
  const allScores = getAllScores();

  return sortScoresByCategory(
    allScores.filter(score => score.week === currentWeek),
    category
  ).slice(0, 10);
}

export function fetchAllTimeCategoryLeaderboard(
  category: LeaderboardCategoryKey
): ScoreEntry[] {
  const allScores = getAllScores();
  return sortScoresByCategory(allScores, category).slice(0, 10);
}

export function getFeaturedWeeklyCategories(
  week: number,
  count: number
): LeaderboardCategoryKey[] {
  const categories: LeaderboardCategoryKey[] = [
    'highestScore',
    'longestSurvival',
    'highestCorruption',
    'mostEnemiesDefeated',
    'cleanRuns',
    'highestCombo',
    'deepestLayer',
    'speedrun',
  ];
  const shuffled = [...categories];
  for (let i = 0; i < shuffled.length; i += 1) {
    const j = (week + i * 7) % shuffled.length;
    const temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function getMetricValue(entry: ScoreEntry, category: LeaderboardCategoryKey): number {
  switch (category) {
    case 'highestScore':
      return entry.finalScore ?? entry.score;
    case 'longestSurvival':
      return entry.survivalTime ?? 0;
    case 'highestCorruption':
      return entry.maxCorruptionReached ?? 0;
    case 'mostEnemiesDefeated':
      return entry.totalEnemiesDefeated ?? 0;
    case 'cleanRuns':
      return entry.runsWithoutDamage ?? 0;
    case 'highestCombo':
      return entry.peakComboMultiplier ?? 0;
    case 'deepestLayer':
      return entry.deepestLayerWithPrestige ?? ((entry.deepestLayer ?? 0) + (entry.prestigeLevel ?? 0));
    case 'speedrun':
      return entry.timeToReachLayer6 ?? Number.POSITIVE_INFINITY;
    default:
      return 0;
  }
}

function sortScoresByCategory(
  scores: ScoreEntry[],
  category: LeaderboardCategoryKey
): ScoreEntry[] {
  const isAscending = category === 'speedrun';
  return [...scores].sort((a, b) => {
    const aValue = getMetricValue(a, category);
    const bValue = getMetricValue(b, category);
    if (aValue === bValue) {
      return (b.finalScore ?? b.score) - (a.finalScore ?? a.score);
    }
    return isAscending ? aValue - bValue : bValue - aValue;
  });
}

/**
 * Get current week number (for display)
 */
export function getCurrentWeekNumber(): number {
  // Ensure week is stored
  const currentWeek = getCurrentISOWeek();
  if (shouldResetLeaderboard()) {
    resetWeeklyLeaderboard();
  }
  return currentWeek;
}

export function getOverallRanking(input: {
  walletAddress?: string;
  playerName?: string;
}): { rank: number; score: number } | null {
  const allScores = getAllScores();
  if (!allScores.length) return null;
  const sorted = [...allScores].sort((a, b) => (b.finalScore ?? b.score) - (a.finalScore ?? a.score));

  const matchIndex = sorted.findIndex((entry) => {
    if (input.walletAddress) {
      return entry.walletAddress === input.walletAddress;
    }
    if (input.playerName) {
      return entry.playerName === input.playerName;
    }
    return false;
  });

  if (matchIndex === -1) return null;
  const entry = sorted[matchIndex];
  return { rank: matchIndex + 1, score: entry.finalScore ?? entry.score };
}

export function getWeeklyRanking(input: {
  walletAddress?: string;
  playerName?: string;
}): { rank: number; score: number } | null {
  if (shouldResetLeaderboard()) {
    resetWeeklyLeaderboard();
  }
  const currentWeek = getCurrentISOWeek();
  const allScores = getAllScores();
  const weeklyScores = allScores
    .filter((score) => score.week === currentWeek)
    .sort((a, b) => (b.finalScore ?? b.score) - (a.finalScore ?? a.score));

  if (!weeklyScores.length) return null;
  const matchIndex = weeklyScores.findIndex((entry) => {
    if (input.walletAddress) {
      return entry.walletAddress === input.walletAddress;
    }
    if (input.playerName) {
      return entry.playerName === input.playerName;
    }
    return false;
  });
  if (matchIndex === -1) return null;
  const entry = weeklyScores[matchIndex];
  return { rank: matchIndex + 1, score: entry.finalScore ?? entry.score };
}

