export type DifficultyMode = "normal" | "easy" | "hard";

export type GameplaySettings = {
  difficulty: DifficultyMode;
  accessibility: {
    colorBlindMode: boolean;
    highContrast: boolean;
    dyslexiaFont: boolean;
    reduceMotion: boolean;
    reduceFlash: boolean;
  };
  visual: {
    uiScale: number;
    uiOpacity: number;
    screenShakeIntensity: number;
    gridIntensity: number;
  };
};

const STORAGE_KEY = "neon-sentinel-settings";

const DEFAULT_SETTINGS: GameplaySettings = {
  difficulty: "normal",
  accessibility: {
    colorBlindMode: false,
    highContrast: false,
    dyslexiaFont: false,
    reduceMotion: false,
    reduceFlash: false,
  },
  visual: {
    uiScale: 1.0,
    uiOpacity: 1.0,
    screenShakeIntensity: 1.0,
    gridIntensity: 1.0,
  },
};

export function getGameplaySettings(): GameplaySettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { ...DEFAULT_SETTINGS };
    }
    const parsed = JSON.parse(stored) as GameplaySettings;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      accessibility: { ...DEFAULT_SETTINGS.accessibility, ...parsed.accessibility },
      visual: { ...DEFAULT_SETTINGS.visual, ...parsed.visual },
    };
  } catch (error) {
    console.error("Error loading settings:", error);
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveGameplaySettings(settings: GameplaySettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Error saving settings:", error);
  }
}

