import { PLAYER_KERNELS } from "../game/config";

export type KernelKey = keyof typeof PLAYER_KERNELS;

type KernelState = {
  selectedKernel: KernelKey;
  unlocked: Record<KernelKey, boolean>;
  totalKills: number;
  totalHitsTaken: number;
  totalShotsFired: number;
  totalShotsHit: number;
};

const STORAGE_KEY = "neon-sentinel-kernels";

const DEFAULT_STATE: KernelState = {
  selectedKernel: "sentinel_standard",
  unlocked: Object.keys(PLAYER_KERNELS).reduce((acc, key) => {
    const kernelKey = key as KernelKey;
    acc[kernelKey] = PLAYER_KERNELS[kernelKey].unlocked ?? false;
    return acc;
  }, {} as Record<KernelKey, boolean>),
  totalKills: 0,
  totalHitsTaken: 0,
  totalShotsFired: 0,
  totalShotsHit: 0,
};

function loadState(): KernelState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { ...DEFAULT_STATE };
    }
    const parsed = JSON.parse(stored) as KernelState;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      unlocked: { ...DEFAULT_STATE.unlocked, ...(parsed.unlocked || {}) },
    };
  } catch (error) {
    console.error("Error loading kernel state:", error);
    return { ...DEFAULT_STATE };
  }
}

function saveState(state: KernelState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Error saving kernel state:", error);
  }
}

export function getKernelState(): KernelState {
  return loadState();
}

export function getSelectedKernelKey(): KernelKey {
  return loadState().selectedKernel || "sentinel_standard";
}

export function setSelectedKernelKey(key: KernelKey): KernelKey {
  const state = loadState();
  if (!state.unlocked[key]) {
    return state.selectedKernel;
  }
  state.selectedKernel = key;
  saveState(state);
  return state.selectedKernel;
}

export function getKernelUnlocks(): Record<KernelKey, boolean> {
  return loadState().unlocked;
}

export function recordKernelRunStats(input: {
  deepestLayer: number;
  kills: number;
  hitsTaken: number;
  shotsFired: number;
  shotsHit: number;
}) {
  const state = loadState();
  state.totalKills += input.kills;
  state.totalHitsTaken += input.hitsTaken;
  state.totalShotsFired += input.shotsFired;
  state.totalShotsHit += input.shotsHit;

  const newlyUnlocked: KernelKey[] = [];

  if (input.deepestLayer >= 3 && !state.unlocked.sentinel_speed) {
    state.unlocked.sentinel_speed = true;
    newlyUnlocked.push("sentinel_speed");
  }
  if (state.totalKills >= 1000 && !state.unlocked.sentinel_firepower) {
    state.unlocked.sentinel_firepower = true;
    newlyUnlocked.push("sentinel_firepower");
  }
  if (state.totalHitsTaken >= 100 && !state.unlocked.sentinel_tanky) {
    state.unlocked.sentinel_tanky = true;
    newlyUnlocked.push("sentinel_tanky");
  }

  const runAccuracy =
    input.shotsFired > 0 ? input.shotsHit / input.shotsFired : 0;
  if (
    runAccuracy >= 0.9 &&
    input.shotsFired >= 50 &&
    !state.unlocked.sentinel_precision
  ) {
    state.unlocked.sentinel_precision = true;
    newlyUnlocked.push("sentinel_precision");
  }

  saveState(state);
  return { state, newlyUnlocked, runAccuracy };
}

