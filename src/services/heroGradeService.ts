export type HeroGrade = 1 | 2 | 3 | 4 | 5;

export interface HeroGradeConfig {
  grade: HeroGrade;
  name: string;
  description: string;
  unlockCondition: {
    type: "playtime" | "kills" | "score" | "layers" | "default";
    value: number;
  };
  specialFeature: {
    name: string;
    description: string;
    speedBonus?: number; // Percentage bonus
    fireRateBonus?: number; // Percentage bonus
    healthBonus?: number; // Multiplier
    damageBonus?: number; // Multiplier
    specialAbility?: string;
  };
}

export const HERO_GRADES: Record<HeroGrade, HeroGradeConfig> = {
  1: {
    grade: 1,
    name: "Initiate Sentinel",
    description: "The beginning of your journey",
    unlockCondition: { type: "default", value: 0 },
    specialFeature: {
      name: "Basic Training",
      description: "Standard capabilities",
      speedBonus: 0,
      fireRateBonus: 0,
      healthBonus: 1.0,
      damageBonus: 1.0,
    },
  },
  2: {
    grade: 2,
    name: "Veteran Sentinel",
    description: "Proven in combat",
    unlockCondition: { type: "playtime", value: 3600000 }, // 1 hour
    specialFeature: {
      name: "Combat Experience",
      description: "+10% movement speed",
      speedBonus: 0.1,
      fireRateBonus: 0,
      healthBonus: 1.0,
      damageBonus: 1.0,
    },
  },
  3: {
    grade: 3,
    name: "Elite Sentinel",
    description: "Master of the battlefield",
    unlockCondition: { type: "kills", value: 5000 }, // 5000 kills
    specialFeature: {
      name: "Rapid Fire",
      description: "+20% fire rate",
      speedBonus: 0.1,
      fireRateBonus: 0.2,
      healthBonus: 1.0,
      damageBonus: 1.0,
    },
  },
  4: {
    grade: 4,
    name: "Legendary Sentinel",
    description: "A force to be reckoned with",
    unlockCondition: { type: "score", value: 100000 }, // 100k score
    specialFeature: {
      name: "Enhanced Resilience",
      description: "+1 health per life, +15% damage",
      speedBonus: 0.1,
      fireRateBonus: 0.2,
      healthBonus: 1.2,
      damageBonus: 1.15,
    },
  },
  5: {
    grade: 5,
    name: "Transcendent Sentinel",
    description: "Beyond mortal limits",
    unlockCondition: { type: "layers", value: 6 }, // Reach layer 6
    specialFeature: {
      name: "Mastery",
      description: "+25% speed, +30% fire rate, +1.5x health, +25% damage",
      speedBonus: 0.25,
      fireRateBonus: 0.3,
      healthBonus: 1.5,
      damageBonus: 1.25,
      specialAbility: "Bullet piercing",
    },
  },
};

type HeroGradeState = {
  unlockedGrades: HeroGrade[];
  currentGrade: HeroGrade;
};

const STORAGE_KEY = "neon-sentinel-hero-grades";

const DEFAULT_STATE: HeroGradeState = {
  unlockedGrades: [1], // Grade 1 unlocked by default
  currentGrade: 1,
};

function loadState(): HeroGradeState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(stored) as HeroGradeState;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      unlockedGrades: parsed.unlockedGrades || [1],
    };
  } catch (error) {
    console.error("Error loading hero grade state:", error);
    return { ...DEFAULT_STATE };
  }
}

function saveState(state: HeroGradeState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Error saving hero grade state:", error);
  }
}

export function getCurrentHeroGrade(): HeroGrade {
  return loadState().currentGrade;
}

export function setCurrentHeroGrade(grade: HeroGrade): void {
  const state = loadState();
  if (state.unlockedGrades.includes(grade)) {
    state.currentGrade = grade;
    saveState(state);
  }
}

export function getUnlockedHeroGrades(): HeroGrade[] {
  return loadState().unlockedGrades;
}

export function isHeroGradeUnlocked(grade: HeroGrade): boolean {
  return loadState().unlockedGrades.includes(grade);
}

export function checkAndUnlockHeroGrades(stats: {
  lifetimePlayMs: number;
  lifetimeEnemiesDefeated: number;
  lifetimeScore: number;
  deepestLayer: number;
}): HeroGrade[] {
  const state = loadState();
  const newlyUnlocked: HeroGrade[] = [];

  // Check each grade's unlock condition
  for (const grade of [2, 3, 4, 5] as HeroGrade[]) {
    if (state.unlockedGrades.includes(grade)) continue; // Already unlocked

    const config = HERO_GRADES[grade];
    let shouldUnlock = false;

    switch (config.unlockCondition.type) {
      case "playtime":
        shouldUnlock = stats.lifetimePlayMs >= config.unlockCondition.value;
        break;
      case "kills":
        shouldUnlock = stats.lifetimeEnemiesDefeated >= config.unlockCondition.value;
        break;
      case "score":
        shouldUnlock = stats.lifetimeScore >= config.unlockCondition.value;
        break;
      case "layers":
        shouldUnlock = stats.deepestLayer >= config.unlockCondition.value;
        break;
      case "default":
        shouldUnlock = true;
        break;
    }

    if (shouldUnlock) {
      state.unlockedGrades.push(grade);
      newlyUnlocked.push(grade);
    }
  }

  if (newlyUnlocked.length > 0) {
    saveState(state);
  }

  return newlyUnlocked;
}

export function getHeroGradeConfig(grade: HeroGrade): HeroGradeConfig {
  return HERO_GRADES[grade];
}

