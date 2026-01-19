import { SESSION_REWARDS } from "../game/config";
import { addExtraBadge, addExtraCosmetic } from "./achievementService";

type SessionRewardState = {
  lastPlayDate: string | null;
  lastSessionDate: string | null;
  streak: number;
  lifetimePlayMs: number;
  milestonesGranted: string[];
  sessionCount: number;
};

const STORAGE_KEY = "neon-sentinel-session-rewards";

function getDefaultState(): SessionRewardState {
  return {
    lastPlayDate: null,
    lastSessionDate: null,
    streak: 0,
    lifetimePlayMs: 0,
    milestonesGranted: [],
    sessionCount: 0,
  };
}

function loadState(): SessionRewardState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return getDefaultState();
    return { ...getDefaultState(), ...(JSON.parse(stored) as SessionRewardState) };
  } catch (error) {
    console.error("Error loading session rewards:", error);
    return getDefaultState();
  }
}

function saveState(state: SessionRewardState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Error saving session rewards:", error);
  }
}

function getDateKey(date: Date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function getYesterdayKey(date: Date = new Date()) {
  const yesterday = new Date(date);
  yesterday.setDate(date.getDate() - 1);
  return getDateKey(yesterday);
}

export function startSession() {
  const state = loadState();
  const todayKey = getDateKey();
  const yesterdayKey = getYesterdayKey();

  if (state.lastPlayDate === yesterdayKey) {
    state.streak += 1;
  } else if (state.lastPlayDate !== todayKey) {
    state.streak = 1;
  }
  state.lastPlayDate = todayKey;

  const isFirstSessionOfDay = state.lastSessionDate !== todayKey;
  state.lastSessionDate = todayKey;
  state.sessionCount += 1;

  if (state.streak >= 7) {
    addExtraBadge("week_warrior");
    addExtraCosmetic("week_warrior_skin");
  }

  saveState(state);

  return {
    streak: state.streak,
    isFirstSessionOfDay,
    sessionCount: state.sessionCount,
  };
}

export function updateLifetimePlaytime(deltaMs: number) {
  const state = loadState();
  state.lifetimePlayMs += deltaMs;
  const rewards: Array<{ bonusScore: number; type: string }> = [];

  SESSION_REWARDS.sessionMilestones.forEach((milestone) => {
    const key = milestone.reward.type;
    if (state.milestonesGranted.includes(key)) return;
    const requiredMs = milestone.hours * 3600000;
    if (state.lifetimePlayMs >= requiredMs) {
      state.milestonesGranted.push(key);
      rewards.push(milestone.reward);
    }
  });

  saveState(state);
  return rewards;
}

export function getSessionRewardState() {
  return loadState();
}

