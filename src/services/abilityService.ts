import { SHOCK_BOMB_CONFIG, GOD_MODE_CONFIG } from "../game/config";
import { getLifetimeStats } from "./achievementService";

/**
 * Check if Shock Bomb is unlocked
 */
export function isShockBombUnlocked(): boolean {
  const stats = getLifetimeStats();
  return stats.lifetimeScore >= SHOCK_BOMB_CONFIG.unlockScore;
}

/**
 * Check if God Mode is unlocked
 */
export function isGodModeUnlocked(): boolean {
  const stats = getLifetimeStats();
  return stats.lifetimeScore >= GOD_MODE_CONFIG.unlockScore;
}

/**
 * Get unlock progress for Shock Bomb (0-1)
 */
export function getShockBombUnlockProgress(): number {
  const stats = getLifetimeStats();
  if (isShockBombUnlocked()) return 1;
  return Math.min(1, stats.lifetimeScore / SHOCK_BOMB_CONFIG.unlockScore);
}

/**
 * Get unlock progress for God Mode (0-1)
 */
export function getGodModeUnlockProgress(): number {
  const stats = getLifetimeStats();
  if (isGodModeUnlocked()) return 1;
  return Math.min(1, stats.lifetimeScore / GOD_MODE_CONFIG.unlockScore);
}

/**
 * Get remaining score needed to unlock Shock Bomb
 */
export function getShockBombRemainingScore(): number {
  const stats = getLifetimeStats();
  if (isShockBombUnlocked()) return 0;
  return Math.max(0, SHOCK_BOMB_CONFIG.unlockScore - stats.lifetimeScore);
}

/**
 * Get remaining score needed to unlock God Mode
 */
export function getGodModeRemainingScore(): number {
  const stats = getLifetimeStats();
  if (isGodModeUnlocked()) return 0;
  return Math.max(0, GOD_MODE_CONFIG.unlockScore - stats.lifetimeScore);
}


