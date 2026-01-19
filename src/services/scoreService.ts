// Score entry interface
export interface ScoreEntry {
  score: number;
  walletAddress?: string;
  playerName: string;
  timestamp: number;
  week: number;
  deepestLayer?: number;
  prestigeLevel?: number;
}

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
  prestigeLevel?: number
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
  const entry: ScoreEntry = {
    score,
    walletAddress,
    playerName,
    timestamp: Date.now(),
    week: currentWeek,
    deepestLayer: deepestLayer || 1,
    prestigeLevel: prestigeLevel || 0,
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

