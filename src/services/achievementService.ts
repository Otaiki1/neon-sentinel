import { ACHIEVEMENTS } from "../game/config";
import {
  fetchAllTimeCategoryLeaderboard,
  type LeaderboardCategoryKey,
  type ScoreEntry,
} from "./scoreService";

type AchievementDefinition = {
  id: string;
  name: string;
  description: string;
  reward: string;
};

type AchievementState = {
  unlocked: string[];
  progress: Record<string, number>;
  notified: string[];
  lifetimeScore: number;
  lifetimePlayMs: number;
  selectedCosmetic: string;
  extraBadges: string[];
  extraCosmetics: string[];
};

const STORAGE_KEY = "neon-sentinel-achievements";

const ALL_CATEGORIES: LeaderboardCategoryKey[] = [
  "highestScore",
  "longestSurvival",
  "highestCorruption",
  "mostEnemiesDefeated",
  "cleanRuns",
  "highestCombo",
  "deepestLayer",
  "speedrun",
];

function getDefaultState(): AchievementState {
  return {
    unlocked: [],
    progress: {},
    notified: [],
    lifetimeScore: 0,
    lifetimePlayMs: 0,
    selectedCosmetic: "none",
    extraBadges: [],
    extraCosmetics: [],
  };
}

export function getAllAchievements(): AchievementDefinition[] {
  return [
    ...ACHIEVEMENTS.tier1_basic,
    ...ACHIEVEMENTS.tier2_intermediate,
    ...ACHIEVEMENTS.tier3_advanced,
    ...ACHIEVEMENTS.tier4_legendary,
  ];
}

export function loadAchievementState(): AchievementState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return getDefaultState();
    const parsed = JSON.parse(stored) as AchievementState;
    return { ...getDefaultState(), ...parsed };
  } catch (error) {
    console.error("Error loading achievements:", error);
    return getDefaultState();
  }
}

function saveAchievementState(state: AchievementState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Error saving achievements:", error);
  }
}

export function unlockAchievement(id: string): boolean {
  const state = loadAchievementState();
  if (state.unlocked.includes(id)) {
    return false;
  }
  state.unlocked.push(id);
  saveAchievementState(state);
  return true;
}

export function setAchievementProgress(id: string, value: number, target: number) {
  const state = loadAchievementState();
  if (target <= 0) {
    state.progress[id] = 0;
  } else {
    const percent = Math.min(100, Math.round((value / target) * 100));
    state.progress[id] = percent;
  }
  saveAchievementState(state);
}

export function addLifetimeScore(points: number) {
  const state = loadAchievementState();
  state.lifetimeScore += points;
  saveAchievementState(state);
}

export function addLifetimePlayMs(durationMs: number) {
  const state = loadAchievementState();
  state.lifetimePlayMs += durationMs;
  saveAchievementState(state);
}

export function shouldNotifyAboutToUnlock(id: string, current: number, target: number) {
  if (target <= 0) return false;
  const state = loadAchievementState();
  const progress = current / target;
  if (progress < 0.7) return false;
  if (state.unlocked.includes(id) || state.notified.includes(id)) return false;
  state.notified.push(id);
  saveAchievementState(state);
  return true;
}

export function getAchievementProgressSummary(limit: number) {
  const state = loadAchievementState();
  const entries = getAllAchievements().map((achievement) => {
    const progressValue = state.progress[achievement.id] ?? 0;
    const unlocked = state.unlocked.includes(achievement.id);
    return {
      ...achievement,
      progressValue,
      unlocked,
    };
  });
  entries.sort((a, b) => {
    if (a.unlocked !== b.unlocked) {
      return a.unlocked ? 1 : -1;
    }
    return (b.progressValue || 0) - (a.progressValue || 0);
  });
  return entries.slice(0, limit);
}

export function getUnlockedBadges(): string[] {
  const state = loadAchievementState();
  const rewards = getAllAchievements().reduce((acc, achievement) => {
    if (state.unlocked.includes(achievement.id) && achievement.reward.startsWith("badge_")) {
      acc.push(achievement.reward);
    }
    return acc;
  }, [] as string[]);
  return [...rewards, ...state.extraBadges];
}

export function getUnlockedCosmetics(): string[] {
  const state = loadAchievementState();
  const rewards = getAllAchievements().reduce((acc, achievement) => {
    if (state.unlocked.includes(achievement.id) && achievement.reward.startsWith("cosmetic_")) {
      acc.push(achievement.reward);
    }
    return acc;
  }, [] as string[]);
  return [...rewards, ...state.extraCosmetics];
}

export function getSelectedCosmetic(): string {
  return loadAchievementState().selectedCosmetic || "none";
}

export function setSelectedCosmetic(cosmetic: string) {
  const state = loadAchievementState();
  state.selectedCosmetic = cosmetic;
  saveAchievementState(state);
}

export function addExtraBadge(badge: string) {
  const state = loadAchievementState();
  if (!state.extraBadges.includes(badge)) {
    state.extraBadges.push(badge);
    saveAchievementState(state);
  }
}

export function addExtraCosmetic(cosmetic: string) {
  const state = loadAchievementState();
  if (!state.extraCosmetics.includes(cosmetic)) {
    state.extraCosmetics.push(cosmetic);
    saveAchievementState(state);
  }
}

export function getLifetimeStats() {
  const state = loadAchievementState();
  return {
    lifetimeScore: state.lifetimeScore,
    lifetimePlayMs: state.lifetimePlayMs,
  };
}

export function checkAllLeaderboardsTop10(playerKey: string, playerName: string) {
  const matchesEntry = (entry: ScoreEntry) => {
    if (playerKey && entry.walletAddress) {
      return entry.walletAddress === playerKey;
    }
    return entry.playerName === playerName;
  };

  const hasAll = ALL_CATEGORIES.every((category) => {
    const scores = fetchAllTimeCategoryLeaderboard(category);
    return scores.some(matchesEntry);
  });

  return hasAll;
}

