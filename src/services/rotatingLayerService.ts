import { ROTATING_LAYER_SCHEDULE } from "../game/config";

const HOUR_MS = 3600000;

export function getRotationInfo(timeMs: number = Date.now()) {
  const durationMs = ROTATING_LAYER_SCHEDULE.durationHours * HOUR_MS;
  const rotationIndex = Math.floor(timeMs / durationMs);
  const rotationOrder = ROTATING_LAYER_SCHEDULE.rotationOrder;
  const currentKey = rotationOrder[rotationIndex % rotationOrder.length];
  const nextKey = rotationOrder[(rotationIndex + 1) % rotationOrder.length];
  const nextChangeTime = (rotationIndex + 1) * durationMs;
  const announceBeforeMs = ROTATING_LAYER_SCHEDULE.announceBeforeMinutes * 60000;

  return {
    currentKey,
    nextKey,
    nextChangeTime,
    announceBeforeMs,
  };
}

