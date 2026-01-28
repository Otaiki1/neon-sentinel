// Game configuration constants

// Mobile detection utility
export function isMobileDevice(): boolean {
    if (typeof window === "undefined") return false;
    return (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
        ) || window.innerWidth <= 768
    );
}

// Mobile scale multiplier (50% size on mobile)
export const MOBILE_SCALE = isMobileDevice() ? 0.5 : 1.0;

export const GAME_CONFIG = {
    width: 800,
    height: 600,
    backgroundColor: "#000000",
} as const;

export const PLAYER_CONFIG = {
    speed: 400, // Increased from 300 for more challenge
    bulletSpeed: 600, // Increased from 500
    fireRate: 150, // Faster fire rate (was 200)
    startX: 400,
    startY: 550,
    initialHealthBars: 5, // Player starts with 5 health bars
    maxHealthBars: 5, // Maximum health bars (cannot exceed)
} as const;

export const ENEMY_CONFIG = {
    green: {
        points: 10,
        speed: 150, // Increased from 100
        health: 2, // Doubled from 1
        spawnWeight: 5,
        canShoot: false,
    },
    yellow: {
        points: 25,
        speed: 200, // Increased from 150
        health: 2, // Doubled from 1
        spawnWeight: 3,
        canShoot: false,
    },
    yellowShield: {
        points: 15,
        speed: 100,
        health: 3,
        spawnWeight: 2,
        canShoot: false,
        shieldRadius: 100, // Halved from 200
        shieldDamageReduction: 0.5,
    },
    yellowEcho: {
        points: 25,
        speed: 180,
        health: 2,
        spawnWeight: 2,
        canShoot: false,
        echoCount: 2,
        echoDuration: 2000,
    },
    blue: {
        points: 50,
        speed: 180, // Increased from 120
        health: 4, // Doubled from 2
        spawnWeight: 2,
        canShoot: true,
        shootInterval: 1500, // Faster shooting (was 2000)
        bulletSpeed: 250, // Faster bullets (was 200)
    },
    blueBuff: {
        points: 50,
        speed: 150,
        health: 3,
        spawnWeight: 1,
        canShoot: true,
        shootInterval: 1700,
        bulletSpeed: 240,
        buffRadius: 250,
        buffShootingSpeed: 1.3,
        buffDamage: 1.2,
    },
    purple: {
        points: 100,
        speed: 220, // Increased from 180
        health: 6, // Doubled from 3
        spawnWeight: 1,
        canShoot: false,
    },
    purpleFragmenter: {
        points: 100,
        speed: 200,
        health: 4,
        spawnWeight: 1,
        canShoot: false,
        fragmentsOnDeath: 3,
        fragmentType: "green",
        fragmentHealth: 1,
    },
    red: {
        points: 500,
        speed: 120, // Boss speed
        health: 20, // Doubled from 10
        spawnWeight: 0, // Boss - spawned separately
        canShoot: false,
    },
} as const;

// Layer progression system - score thresholds (exponential scaling for harder progression)
export const LAYER_CONFIG = {
    1: {
        name: "Boot Sector",
        scoreThreshold: 0,
        enemies: ["green"],
        bossChance: 0,
        gridColor: 0x00ff00, // Green
        healthMultiplier: 1.0, // Base health
        bossSpeedMultiplier: 0.5, // Slower bosses for early sector pacing
        spawnRateMultiplier: 3.0, // Base spawn rate
    },
    2: {
        name: "Firewall",
        scoreThreshold: 500,
        enemies: ["green", "yellow", "yellowShield", "yellowEcho"],
        bossChance: 0,
        gridColor: 0xffff00, // Yellow
        healthMultiplier: 1.3, // 30% more health
        bossSpeedMultiplier: 0.85,
        spawnRateMultiplier: 3.2, // 20% more enemies
    },
    3: {
        name: "Security Core",
        scoreThreshold: 1500,
        enemies: ["green", "yellow", "yellowEcho", "blue", "blueBuff"],
        bossChance: 0,
        gridColor: 0x00aaff, // Blue
        healthMultiplier: 1.6, // 60% more health
        bossSpeedMultiplier: 0.95,
        spawnRateMultiplier: 3.5, // 50% more enemies
    },
    4: {
        name: "Corrupted AI",
        scoreThreshold: 4000,
        enemies: [
            "green",
            "yellow",
            "yellowEcho",
            "blue",
            "blueBuff",
            "purple",
            "purpleFragmenter",
        ],
        bossChance: 0.01, // 1% chance for purple boss
        gridColor: 0xaa00ff, // Purple
        healthMultiplier: 2.0, // 2x health
        bossSpeedMultiplier: 1.05,
        spawnRateMultiplier: 4.0, // 2x enemies
    },
    5: {
        name: "Kernel Breach",
        scoreThreshold: 10000,
        enemies: [
            "green",
            "yellow",
            "yellowShield",
            "yellowEcho",
            "blue",
            "blueBuff",
            "purple",
            "purpleFragmenter",
        ],
        bossChance: 0.05, // 5% chance for mini/medium boss
        gridColor: 0xff3333, // Red
        healthMultiplier: 2.5, // 2.5x health
        bossSpeedMultiplier: 1.15,
        spawnRateMultiplier: 4.5, // 2.5x enemies
    },
    6: {
        name: "System Collapse",
        scoreThreshold: 25000,
        enemies: [
            "green",
            "yellow",
            "yellowShield",
            "yellowEcho",
            "blue",
            "blueBuff",
            "purple",
            "purpleFragmenter",
        ],
        bossChance: 0.1, // 10% chance for final boss
        gridColor: 0xff0000, // Bright red
        healthMultiplier: 3.0, // 3x health
        bossSpeedMultiplier: 1.25,
        spawnRateMultiplier: 5.0, // 3x enemies
    },
} as const;

export const MAX_LAYER = 6;

export const PRESTIGE_CONFIG = {
    maxPrestige: 8,
    finalBossPrestige: 8,
    prestigeTiers: [
        {
            level: 0,
            name: "The Entry",
            storyArc: "the_entry",
            overlordId: "green_boss",
            avatarUnlock: "default_sentinel",
            difficultyMultiplier: 1.0,
            scoreMultiplier: 1.0,
            coinReward: 2, // 2 * (2^0)
        },
        {
            level: 1,
            name: "The Entry",
            storyArc: "the_entry",
            overlordId: "yellow_boss",
            avatarUnlock: "swift_interceptor",
            difficultyMultiplier: 1.5,
            scoreMultiplier: 1.3,
            coinReward: 4, // 2 * (2^1)
        },
        {
            level: 2,
            name: "The Awakening",
            storyArc: "the_awakening",
            overlordId: "blue_boss",
            avatarUnlock: "guardian_core",
            difficultyMultiplier: 2.0,
            scoreMultiplier: 1.6,
            coinReward: 8, // 2 * (2^2)
        },
        {
            level: 3,
            name: "The Awakening",
            storyArc: "the_awakening",
            overlordId: "blue_boss",
            avatarUnlock: "assault_nexus",
            difficultyMultiplier: 2.5,
            scoreMultiplier: 2.0,
            coinReward: 16, // 2 * (2^3)
        },
        {
            level: 4,
            name: "The Revelation",
            storyArc: "the_revelation",
            overlordId: "purple_boss",
            avatarUnlock: "neon_guardian",
            difficultyMultiplier: 3.0,
            scoreMultiplier: 2.5,
            coinReward: 32, // 2 * (2^4)
        },
        {
            level: 5,
            name: "The Revelation",
            storyArc: "the_revelation",
            overlordId: "purple_boss",
            avatarUnlock: "plasma_core",
            difficultyMultiplier: 3.5,
            scoreMultiplier: 3.0,
            coinReward: 64, // 2 * (2^5)
        },
        {
            level: 6,
            name: "The Confrontation",
            storyArc: "the_confrontation",
            overlordId: "purple_boss",
            avatarUnlock: "prime_sentinel",
            difficultyMultiplier: 4.0,
            scoreMultiplier: 4.0,
            coinReward: 128, // 2 * (2^6)
        },
        {
            level: 7,
            name: "The Confrontation",
            storyArc: "the_confrontation",
            overlordId: "purple_boss",
            avatarUnlock: null, // No new avatar, preparing for final
            difficultyMultiplier: 4.5,
            scoreMultiplier: 5.0,
            coinReward: 256, // 2 * (2^7)
        },
        {
            level: 8,
            name: "Prime Sentinel",
            storyArc: "prime_sentinel",
            overlordId: "zrechostikal",
            avatarUnlock: "transcendent_form",
            difficultyMultiplier: 5.0,
            scoreMultiplier: 7.0,
            coinReward: 512, // 2 * (2^8) - Final boss reward
        },
    ],
    visualEffects: {
        gridGlitchIntensity: 0.3,
        screenFlashFrequency: 1.2,
        corruptionVFX: true,
    },
} as const;

/**
 * Get prestige tier configuration for a given prestige level
 */
export function getPrestigeTierConfig(prestigeLevel: number) {
    return PRESTIGE_CONFIG.prestigeTiers.find(tier => tier.level === prestigeLevel) || PRESTIGE_CONFIG.prestigeTiers[0];
}

/**
 * Calculate coin reward for completing a prestige level
 */
export function getPrestigeCoinReward(prestigeLevel: number): number {
    return 2 * Math.pow(2, prestigeLevel);
}

export const RANK_CONFIG = {
    ranks: [
        // Entry Ranks (Prestige 0-1)
        {
            number: 1,
            prestige: 0,
            layer: 1,
            name: "Initiate Sentinel",
            badge: "badge_1",
            tier: "entry",
        },
        {
            number: 2,
            prestige: 0,
            layer: 3,
            name: "Trial Sentinel",
            badge: "badge_2",
            tier: "entry",
        },
        {
            number: 3,
            prestige: 0,
            layer: 6,
            name: "Boot Master",
            badge: "badge_3",
            tier: "entry",
        },
        {
            number: 4,
            prestige: 1,
            layer: 3,
            name: "Advancing Sentinel",
            badge: "badge_4",
            tier: "entry",
        },
        {
            number: 5,
            prestige: 1,
            layer: 6,
            name: "Firewall Breaker",
            badge: "badge_5",
            tier: "entry",
        },
        // Intermediate Ranks (Prestige 2-3)
        {
            number: 6,
            prestige: 2,
            layer: 3,
            name: "Security Breaker",
            badge: "badge_6",
            tier: "intermediate",
        },
        {
            number: 7,
            prestige: 2,
            layer: 6,
            name: "Core Liberator",
            badge: "badge_7",
            tier: "intermediate",
        },
        {
            number: 8,
            prestige: 3,
            layer: 3,
            name: "Revelation Seeker",
            badge: "badge_8",
            tier: "intermediate",
        },
        {
            number: 9,
            prestige: 3,
            layer: 6,
            name: "AI Executor",
            badge: "badge_9",
            tier: "intermediate",
        },
        // Advanced Ranks (Prestige 4-5)
        {
            number: 10,
            prestige: 4,
            layer: 3,
            name: "Corruption Master",
            badge: "badge_10",
            tier: "advanced",
        },
        {
            number: 11,
            prestige: 4,
            layer: 6,
            name: "Kernel Shatterer",
            badge: "badge_11",
            tier: "advanced",
        },
        {
            number: 12,
            prestige: 5,
            layer: 3,
            name: "System Ascendant",
            badge: "badge_12",
            tier: "advanced",
        },
        {
            number: 13,
            prestige: 5,
            layer: 6,
            name: "Breach Master",
            badge: "badge_13",
            tier: "advanced",
        },
        // Elite Ranks (Prestige 6-7)
        {
            number: 14,
            prestige: 6,
            layer: 3,
            name: "Neon Defender",
            badge: "badge_14",
            tier: "elite",
        },
        {
            number: 15,
            prestige: 6,
            layer: 6,
            name: "Terminal Guardian",
            badge: "badge_15",
            tier: "elite",
        },
        {
            number: 16,
            prestige: 7,
            layer: 3,
            name: "Void Walker",
            badge: "badge_16",
            tier: "elite",
        },
        {
            number: 17,
            prestige: 7,
            layer: 6,
            name: "Sentinel Prime-Elect",
            badge: "badge_17",
            tier: "elite",
        },
        // Legendary Rank
        {
            number: 18,
            prestige: 8,
            layer: 6,
            name: "Prime Sentinel",
            badge: "badge_18",
            tier: "legendary",
        },
    ],
} as const;

/**
 * Enemy Variant Mapping Configuration
 * Maps enemy colors and types to sprite keys and display names based on prestige
 */
export const ENEMY_VARIANT_MAP = {
    green: {
        pawn: {
            prestige0_1: "greenPawn1",
            prestige2_3: "greenPawn2",
            prestige4_5: "greenPawn3",
            prestige6: "greenPawnCorrupted",
        },
        boss: {
            prestige0_1: "greenBoss1",
            prestige2_3: "greenBoss2",
            prestige4_5: "greenBoss3",
            prestige6: "greenBossCorrupted",
        },
    },
    yellow: {
        pawn: {
            prestige0_1: "yellowRoutine1",
            prestige2_3: "yellowRoutine2",
            prestige4_5: "yellowRoutine3",
            prestige6: "yellowRoutineCorrupted",
        },
        boss: {
            prestige0_1: "yellowBoss1",
            prestige2_3: "yellowBoss2",
            prestige4_5: "yellowFinalBoss",
            prestige6: "yellowFinalBossCorrupted",
        },
    },
    blue: {
        pawn: {
            prestige0_1: "blueBot1",
            prestige2_3: "blueBot2",
            prestige4_5: "blueBot3",
            prestige6: "blueBotCorrupted",
        },
        boss: {
            prestige0_1: "blueBoss1",
            prestige2_3: "blueBoss2",
            prestige4_5: "blueBoss3",
            prestige6: "blueBossCorrupted",
        },
    },
    purple: {
        pawn: {
            prestige0_1: "purpleCore1",
            prestige2_3: "purpleCore2",
            prestige4_5: "purpleCore3",
            prestige6: "purpleCoreCorrupted",
        },
        boss: {
            prestige0_1: "purpleBoss1",
            prestige2_3: "purpleBoss2",
            prestige4_5: "purpleBoss3",
            prestige6: "purpleBossCorrupted",
        },
    },
} as const;

/**
 * Enemy Display Names Mapping
 */
export const ENEMY_NAMES = {
    green: {
        pawn: {
            prestige0_1: "Green Pawn",
            prestige2_3: "Jade Sentinel",
            prestige4_5: "Emerald Vanguard",
            prestige6: "Abyssal Fragment",
        },
        boss: {
            prestige0_1: "Green Guardian 1",
            prestige2_3: "Jade Guardian 2",
            prestige4_5: "Emerald Guardian 3",
            prestige6: "Abyssal Overlord",
        },
    },
    yellow: {
        pawn: {
            prestige0_1: "Yellow Routine",
            prestige2_3: "Amber Striker",
            prestige4_5: "Golden Assault",
            prestige6: "Corrupted Sentinel",
        },
        boss: {
            prestige0_1: "Yellow Sentinel 1",
            prestige2_3: "Amber Sentinel 2",
            prestige4_5: "Golden Overlord",
            prestige6: "Corrupted Prime",
        },
    },
    blue: {
        pawn: {
            prestige0_1: "Blue Bot",
            prestige2_3: "Cyan Enforcer",
            prestige4_5: "Azure Guardian",
            prestige6: "Void Entity",
        },
        boss: {
            prestige0_1: "Blue Hijack-Core 1",
            prestige2_3: "Cyan Command 2",
            prestige4_5: "Azure Authority 3",
            prestige6: "Void Entity Prime",
        },
    },
    purple: {
        pawn: {
            prestige0_1: "Purple Core",
            prestige2_3: "Violet Intelligence",
            prestige4_5: "Magenta Overlord",
            prestige6: "Infernal Mind",
        },
        boss: {
            prestige0_1: "Purple Core-Emperor 1",
            prestige2_3: "Violet Intellect 2",
            prestige4_5: "Magenta Sovereign 3",
            prestige6: "Infernal Overlord",
        },
    },
} as const;

/**
 * Dialogue Configuration
 * Defines all dialogues with their triggers and conditions
 */
export const DIALOGUE_CONFIG = {
    dialogues: [
        {
            id: "game_start",
            speaker: "White Sentinel",
            text: "Sentinel, you have been assigned to liberate Neon Terminal. The Swarm has corrupted this system for 50 aeons. Proceed with caution.",
            trigger: "gameStart",
            conditions: { firstRun: true },
        },
        {
            id: "prestige0_layer1",
            speaker: "White Sentinel",
            text: "You have entered the Boot Sector. Basic corrupted fragments detected. Begin your infiltration.",
            trigger: "layerStart",
            prestige: 0,
            layer: 1,
        },
        {
            id: "final_boss_encounter",
            speaker: "Zrechostikal",
            text: "You dare challenge me? I am the Swarm.",
            trigger: "finalBossEncounter",
            prestige: 8,
            layer: 6,
        },
        {
            id: "final_boss_defeat",
            speaker: "Prime Sentinel",
            text: "Rise, Sentinel. You have liberated Terminal Neon. You are now Prime Sentinel - Rank: Prime Sentinel.",
            trigger: "finalBossDefeat",
            prestige: 8,
            layer: 6,
        },
        // Additional dialogues can be added here
    ],
} as const;

/**
 * Bullet Upgrade Configuration
 * Defines bullet tiers with stats and unlock requirements
 */
export const BULLET_UPGRADE_CONFIG = {
    tiers: [
        {
            tier: 1,
            name: "Standard Bullet",
            spriteKey: "bullet",
            damageMultiplier: 1.0,
            speedMultiplier: 1.0,
            unlockPrestige: 0,
            effects: {
                trail: false,
                glow: false,
                piercing: 0,
            },
        },
        {
            tier: 2,
            name: "Enhanced Bullet",
            spriteKey: "bulletTier2",
            damageMultiplier: 1.2,
            speedMultiplier: 1.1,
            unlockPrestige: 1,
            effects: {
                trail: true,
                glow: true,
                piercing: 0,
            },
        },
        {
            tier: 3,
            name: "Accelerated Bullet",
            spriteKey: "bulletTier3",
            damageMultiplier: 1.4,
            speedMultiplier: 1.3,
            unlockPrestige: 3,
            effects: {
                trail: true,
                glow: true,
                piercing: 0,
            },
        },
        {
            tier: 4,
            name: "Plasma Bullet",
            spriteKey: "bulletTier4",
            damageMultiplier: 1.6,
            speedMultiplier: 1.5,
            unlockPrestige: 5,
            effects: {
                trail: true,
                glow: true,
                piercing: 2, // Pierce through 2 enemies
            },
        },
        {
            tier: 5,
            name: "Transcendent Bullet",
            spriteKey: "bulletTier5",
            damageMultiplier: 2.0,
            speedMultiplier: 1.8,
            unlockPrestige: 7,
            effects: {
                trail: true,
                glow: true,
                piercing: -1, // Infinite piercing
            },
        },
    ],
} as const;

/**
 * Coin Economy Configuration
 */
export const COIN_CONFIG = {
    prestigeRewardFormula: "2 * (2^prestigeLevel)",
    dailyPrimeSentinelBonus: 3,
    revivalBaseCost: 100,
    revivalCostMultiplier: 2,
    miniMeCosts: {
        scout: 50,
        gunner: 75,
        shield: 100,
        decoy: 100,
        collector: 75,
        stun: 125,
        healer: 125,
    },
} as const;

/**
 * Mini-Me Configuration
 * Defines all mini-me types with their properties
 */
export const MINI_ME_CONFIG_UPDATED = {
    maxActive: 7,
    types: {
        scout: {
            cost: 50,
            duration: 15000, // 15 seconds
            spriteKey: "miniMeScout",
            behavior: {
                visionRange: 200,
                scanEffect: true,
            },
        },
        gunner: {
            cost: 75,
            duration: 12000, // 12 seconds
            spriteKey: "miniMeGunner",
            behavior: {
                fireRate: 0.5, // 50% of player fire rate
                bulletSpeed: 600,
            },
        },
        shield: {
            cost: 100,
            duration: 10000, // 10 seconds
            spriteKey: "miniMeShield",
            behavior: {
                damageReduction: 1,
            },
        },
        decoy: {
            cost: 100,
            duration: 12000, // 12 seconds
            spriteKey: "miniMeDecoy",
            behavior: {
                damageReduction: 0.3, // 30% less damage
                priority: 0.7, // Enemies prioritize decoy 70% of the time
            },
        },
        collector: {
            cost: 75,
            duration: 15000, // 15 seconds
            spriteKey: "miniMeCollector",
            behavior: {
                collectionRadius: 300,
            },
        },
        stun: {
            cost: 125,
            duration: 10000, // 10 seconds
            spriteKey: "miniMeStun",
            behavior: {
                stunDuration: 1000, // 1 second
                pulseInterval: 2000, // Every 2 seconds
                stunRadius: 150,
            },
        },
        healer: {
            cost: 125,
            duration: 12000, // 12 seconds
            spriteKey: "miniMeHealer",
            behavior: {
                healAmount: 1, // 1 health bar
                healInterval: 3000, // Every 3 seconds
            },
        },
    },
    maxHits: 3, // Mini-me survives 3 enemy hits before despawning
} as const;

/**
 * Registry Keys Documentation
 * 
 * These keys are used in Phaser's registry system to track game state
 * and communicate between scenes.
 * 
 * Core Game State:
 * - healthBars: number (0-5) - Current health bars
 * - currentPrestige: number - Current prestige level (0-8)
 * - currentLayer: number - Current layer (1-6)
 * - currentRank: string - Current rank name
 * - currentRankNumber: number - Current rank number (1-18)
 * - currentAvatar: string - Active avatar ID
 * - bulletTier: number - Current bullet upgrade tier (1-5)
 * - reviveCount: number - Revives used in current run
 * - miniMeCount: number - Active mini-mes count (0-7)
 * - coinBalance: number - Current coins
 * - isPrimeSentinel: boolean - Flag for Prime Sentinel status
 * - prestigeCompleted: boolean[] - Array of completed prestiges (length 9)
 * 
 * Gameplay State:
 * - score: number - Current score
 * - comboMultiplier: number - Current combo multiplier
 * - gameOver: boolean - Game over state
 * - isPaused: boolean - Pause state
 * - finalBossVictory: boolean - Final boss victory flag
 * 
 * Progression:
 * - deepestLayer: number - Deepest layer reached
 * - previousPrestige: number - Previous prestige level
 * - layerName: string - Current layer name
 * 
 * Settings:
 * - gameplaySettings: object - Gameplay settings
 * - walletAddress: string - Wallet address (if connected)
 */
export const REGISTRY_KEYS = {
    // Core Game State
    healthBars: "healthBars",
    currentPrestige: "currentPrestige",
    currentLayer: "currentLayer",
    currentRank: "currentRank",
    currentRankNumber: "currentRankNumber",
    currentAvatar: "currentAvatar",
    bulletTier: "bulletTier",
    reviveCount: "reviveCount",
    miniMeCount: "miniMeCount",
    coinBalance: "coinBalance",
    isPrimeSentinel: "isPrimeSentinel",
    prestigeCompleted: "prestigeCompleted",
    
    // Gameplay State
    score: "score",
    comboMultiplier: "comboMultiplier",
    gameOver: "gameOver",
    isPaused: "isPaused",
    finalBossVictory: "finalBossVictory",
    
    // Progression
    deepestLayer: "deepestLayer",
    previousPrestige: "previousPrestige",
    layerName: "layerName",
    
    // Settings
    gameplaySettings: "gameplaySettings",
    walletAddress: "walletAddress",
} as const;

/**
 * Get rank configuration for a given prestige and layer
 */
export function getRankForProgress(prestige: number, layer: number) {
    return RANK_CONFIG.ranks.find(
        (rank) => rank.prestige === prestige && rank.layer === layer
    );
}

/**
 * Get the highest rank achieved for given prestige/layer
 */
export function getHighestRank(prestige: number, layer: number) {
    // Find the highest rank that the player has reached or exceeded
    let highestRank = null;
    for (const rank of RANK_CONFIG.ranks) {
        if (prestige > rank.prestige || (prestige === rank.prestige && layer >= rank.layer)) {
            highestRank = rank;
        } else {
            break;
        }
    }
    return highestRank || RANK_CONFIG.ranks[0];
}

export const DIFFICULTY_EVOLUTION = {
    phase1: {
        timeRange: "0-3 minutes",
        startMs: 0,
        endMs: 180000,
        enemyBehaviors: ["basic_pursuit"],
        spawnPatterns: ["random"],
        description: "Learning phase - simple pursuit",
    },
    phase2: {
        timeRange: "3-8 minutes",
        startMs: 180000,
        endMs: 480000,
        enemyBehaviors: ["basic_pursuit", "predictive_movement"],
        spawnPatterns: ["random", "loose_formations"],
        description: "Enemies begin predicting player movement",
    },
    phase3: {
        timeRange: "8-15 minutes",
        startMs: 480000,
        endMs: 900000,
        enemyBehaviors: ["predictive_movement", "space_denial", "coordinated_fire"],
        spawnPatterns: ["formations", "ambush_waves"],
        description: "Coordinated attacks, enemies force risky positioning",
    },
    phase4: {
        timeRange: "15+ minutes",
        startMs: 900000,
        endMs: Number.POSITIVE_INFINITY,
        enemyBehaviors: ["adaptive_learning", "flanking", "synchronized_patterns"],
        spawnPatterns: ["boss_rushes", "complex_formations"],
        description: "Enemies adapt to player strategy mid-run",
    },
} as const;

export const ENEMY_BEHAVIOR_CONFIG = {
    predictiveLeadTime: 0.7,
    adaptationThreshold: 30,
    formationSpawnChance: 0.3,
    coordinatedFireDistance: 400,
    behaviourResetInterval: 120000,
} as const;

export const CORRUPTION_SYSTEM = {
    currentCorruption: 0,
    maxCorruption: 100,
    passiveIncreaseRate: 0.5,
    safePlayDecay: -0.2,
    riskPlayBonus: {
        enterCorruptedZone: 5,
        defeatBoss: 10,
        noHitStreak: 1,
        comboMultiplier: 2,
    },
    scoreMultiplier: {
        low: 1.0,
        medium: 1.5,
        high: 2.0,
        critical: 3.0,
    },
    enemyDifficultyMultiplier: {
        low: 1.0,
        medium: 1.3,
        high: 1.7,
        critical: 2.2,
    },
} as const;

export const OVERCLOCK_CONFIG = {
    activationKey: "Q",
    cooldownBetweenActivations: 60000,
    maxActivationsPerRun: 5,
    duration: 15000,
    effects: {
        playerSpeedMultiplier: 1.4,
        scoreMultiplier: 2.0,
        fireRateMultiplier: 0.6,
        enemySpawningMultiplier: 1.8,
        playerVisibility: 1.0,
    },
    indicators: {
        overclockBar: true,
        screenBurnEffect: true,
        playerGlowEffect: true,
    },
} as const;

export const SHOCK_BOMB_CONFIG = {
    activationKey: "B",
    fillRate: 0.5, // Percentage per second (fills in ~2 seconds of gameplay)
    killPercentage: 0.7, // Kill 70% of enemies
    cooldownAfterUse: 30000, // 30 seconds to refill after use
    unlockScore: 10000, // Unlock at 10,000 lifetime score
} as const;

export const GOD_MODE_CONFIG = {
    activationKey: "Q",
    fillRate: 0.3, // Percentage per second (fills in ~3.3 seconds of gameplay)
    duration: 10000, // 10 seconds invincibility
    cooldownAfterUse: 40000, // 40 seconds to refill after use
    unlockScore: 25000, // Unlock at 25,000 lifetime score
} as const;

export const LEADERBOARD_CATEGORIES = {
    highestScore: {
        title: "Score Champion",
        metric: "finalScore",
        reward: "👑 Crown Badge",
    },
    longestSurvival: {
        title: "Endurance Sentinel",
        metric: "survivalTime",
        unit: "seconds",
        reward: "⏱️ Clock Badge",
    },
    highestCorruption: {
        title: "Risk Taker",
        metric: "maxCorruptionReached",
        unit: "percentage",
        reward: "🔥 Danger Badge",
    },
    mostEnemiesDefeated: {
        title: "Swarm Slayer",
        metric: "totalEnemiesDefeated",
        reward: "⚔️ Slayer Badge",
    },
    cleanRuns: {
        title: "Perfect Sentinel",
        metric: "runsWithoutDamage",
        note: "Runs completed without taking damage",
        reward: "✨ Flawless Badge",
    },
    highestCombo: {
        title: "Rhythm Master",
        metric: "peakComboMultiplier",
        reward: "🎵 Combo Badge",
    },
    deepestLayer: {
        title: "System Diver",
        metric: "deepestLayerWithPrestige",
        reward: "🌀 Depth Badge",
    },
    speedrun: {
        title: "Speed Runner",
        metric: "timeToReachLayer6",
        unit: "seconds",
        reward: "⚡ Speed Badge",
    },
} as const;

export const FEATURED_LEADERBOARD_COUNT = 4;

export const MID_RUN_CHALLENGES = {
    challenges: [
        {
            id: "no_shoot_20s",
            title: "Radio Silence",
            description: "Survive 20 seconds without shooting",
            reward: { bonusScore: 500, comboMultiplier: 1.5 },
            penalty: "none",
        },
        {
            id: "clean_10_enemies",
            title: "Perfect Strike",
            description: "Destroy 10 enemies without taking damage",
            reward: { bonusScore: 300, extraLife: 1 },
            penalty: "none",
        },
        {
            id: "survive_corruption_zone",
            title: "Corruption Dive",
            description: "Stay in 80%+ corruption area for 15 seconds",
            reward: { bonusScore: 1000, corruptionMultiplier: 1.2 },
            penalty: "none",
        },
        {
            id: "defeat_5_blue",
            title: "Blue Squadron",
            description: "Defeat 5 blue enemies in 30 seconds",
            reward: { bonusScore: 400, fireRateBoost: 0.8 },
            penalty: "none",
        },
        {
            id: "chain_combo",
            title: "Flow State",
            description: "Maintain 3.0x+ combo for 30 seconds",
            reward: { bonusScore: 600, scoreMultiplier: 1.2 },
            penalty: "none",
        },
        {
            id: "dodge_25_bullets",
            title: "Bullet Hell",
            description: "Dodge 25 enemy bullets without taking damage",
            reward: { bonusScore: 300, invincibilityFrame: 0.5 },
            penalty: "none",
        },
    ],
    triggerIntervals: {
        firstChallenge: 60000,
        subsequentChallenges: 120000,
        minTimeBetweenChallenges: 45000,
    },
    display: {
        announcementCard: true,
        progressBar: true,
        celebrationOnCompletion: true,
    },
} as const;

export const ACHIEVEMENTS = {
    tier1_basic: [
        {
            id: "first_blood",
            name: "First Blood",
            description: "Defeat your first enemy",
            reward: "badge_first_blood",
        },
        {
            id: "layer_2",
            name: "Ascending",
            description: "Reach Layer 2",
            reward: "badge_ascending",
        },
        {
            id: "first_boss",
            name: "Boss Slayer",
            description: "Defeat your first boss",
            reward: "badge_slayer",
        },
        {
            id: "collect_5_lives",
            name: "Resilient",
            description: "Collect 5 life orbs in one run",
            reward: "badge_resilient",
        },
        {
            id: "10k_points",
            name: "Millionaire",
            description: "Earn 10,000 points",
            reward: "badge_millionaire",
        },
    ],
    tier2_intermediate: [
        {
            id: "layer_5",
            name: "Deep Diver",
            description: "Reach Layer 5",
            reward: "badge_deep_diver",
        },
        {
            id: "clean_run_layer_3",
            name: "Flawless",
            description: "Complete Layer 3 without taking damage",
            reward: "badge_flawless",
        },
        {
            id: "5x_combo",
            name: "Flow Master",
            description: "Achieve 5.0x combo multiplier",
            reward: "badge_flow_master",
        },
        {
            id: "defeat_5_bosses",
            name: "Guardian",
            description: "Defeat 5 bosses in one run",
            reward: "badge_guardian",
        },
        {
            id: "100k_points",
            name: "Legend",
            description: "Earn 100,000 points",
            reward: "badge_legend",
        },
    ],
    tier3_advanced: [
        {
            id: "prestige_1",
            name: "Ascended",
            description: "Reach Prestige Level 1",
            reward: "cosmetic_prestige_glow",
        },
        {
            id: "prestige_5",
            name: "System Master",
            description: "Reach Prestige Level 5",
            reward: "cosmetic_corrupted_theme",
        },
        {
            id: "all_leaderboards",
            name: "Decathlete",
            description: "Top 10 in all leaderboard categories",
            reward: "cosmetic_champion_skin",
        },
        {
            id: "corruption_100",
            name: "Corruption Sage",
            description: "Survive with 100% corruption",
            reward: "badge_corruption_sage",
        },
    ],
    tier4_legendary: [
        {
            id: "prime_sentinel",
            name: "Prime Sentinel",
            description: "Defeat Zrechostikal and achieve Prime Sentinel rank",
            requirement: "Defeat the final boss at Prestige 8, Layer 6",
            points: 10000,
        },
        {
            id: "prestige_10",
            name: "Sentinel Prime",
            description: "Reach Prestige Level 10",
            reward: "cosmetic_legendary_aura",
        },
        {
            id: "1m_points",
            name: "The Grid Slayer",
            description: "Earn 1,000,000 lifetime points",
            reward: "badge_grid_slayer",
        },
        {
            id: "1000_hours",
            name: "Eternal Sentinel",
            description: "Play 1000 hours",
            reward: "cosmetic_eternal_theme",
        },
    ],
} as const;

export const SESSION_REWARDS = {
    firstSessionOfDay: {
        durationMinutes: 0.5,
        scoreMultiplier: 1.2,
        comboStartBoost: 1.5,
        description: "Daily Awakening - First 30 seconds get 1.2x score",
    },
    sessionMilestones: [
        { hours: 1, reward: { bonusScore: 500, type: "session_1h" } },
        { hours: 5, reward: { bonusScore: 2500, type: "session_5h" } },
        { hours: 10, reward: { bonusScore: 5000, type: "session_10h" } },
        { hours: 50, reward: { bonusScore: 25000, type: "session_50h" } },
        { hours: 100, reward: { bonusScore: 50000, type: "session_100h" } },
    ],
    streakBonuses: {
        playThreeDaysInRow: { comboMultiplier: 1.1, duration: "full_run" },
        playSixDaysInRow: { scoreMultiplier: 1.15, duration: "full_run" },
        playSevnDaysInRow: {
            specialBadge: "week_warrior",
            cosmetic: "week_warrior_skin",
        },
    },
} as const;

export const ROTATING_LAYER_MODIFIERS = {
    standard: {
        name: "Standard Grid",
        description: "Normal gameplay",
        enemySpawnRate: 1.0,
        modifiers: [],
    },
    firewall: {
        name: "Firewall Layer",
        description: "Movement restricted - speed capped at 70%",
        enemySpawnRate: 1.2,
        modifiers: [{ type: "speed_cap", value: 0.7 }],
    },
    memory_leak: {
        name: "Memory Leak",
        description: "Random glitches - periodic input lag",
        enemySpawnRate: 0.9,
        modifiers: [
            { type: "input_delay", value: 0.1, frequency: "random_5s" },
            { type: "screen_glitch", intensity: 0.3 },
        ],
    },
    encrypted: {
        name: "Encrypted Zone",
        description: "Delayed feedback - input responds 200ms later",
        enemySpawnRate: 1.1,
        modifiers: [{ type: "input_lag", value: 0.2 }],
    },
    lag_spike: {
        name: "Lag Spike",
        description: "Occasional freezes - game pauses for 0.5s randomly",
        enemySpawnRate: 1.3,
        modifiers: [{ type: "random_pause", duration: 0.5, frequency: "every_30s" }],
    },
    void: {
        name: "The Void",
        description: "Screen partially darkened - only center 60% visible",
        enemySpawnRate: 1.0,
        modifiers: [{ type: "vision_limit", radius: 200 }],
    },
    temporal: {
        name: "Temporal Anomaly",
        description: "Time warps - score multiplier tied to speed (faster = better)",
        enemySpawnRate: 1.0,
        modifiers: [{ type: "speed_score_link", ratio: 0.1 }],
    },
} as const;

export const ROTATING_LAYER_SCHEDULE = {
    durationHours: 3.5,
    announceBeforeMinutes: 15,
    rotationOrder: [
        "standard",
        "firewall",
        "memory_leak",
        "encrypted",
        "lag_spike",
        "void",
        "temporal",
    ],
} as const;

export const FAILURE_FEEDBACK = {
    displayMetrics: [
        { metric: "pointsToNextMilestone", color: "red" },
        { metric: "layerProgress", color: "yellow" },
        { metric: "personalBest", color: "blue" },
        { metric: "leaderboardProximity", color: "purple" },
        { metric: "riskReward", color: "orange" },
    ],
    celebrationMetrics: [
        "Best run this week",
        "New personal best enemy kills",
        "Highest corruption survived",
        "New personal best combo",
    ],
    scoreMilestones: [10000, 50000, 100000],
} as const;

export const PLAYER_KERNELS = {
    sentinel_standard: {
        name: "Azure Core",
        description: "Balanced speed and firepower - Blue variant",
        baseSpeed: 1.0,
        fireRate: 1.0,
        unlocked: true,
        unlockCondition: "default",
        spriteVariant: "blue", // Maps to heroGrade1Blue
    },
    sentinel_speed: {
        name: "Violet Interceptor",
        description: "30% faster movement, 20% slower fire rate - Purple variant",
        baseSpeed: 1.3,
        fireRate: 1.2,
        unlocked: false,
        unlockCondition: "reach_layer_3",
        spriteVariant: "purple", // Maps to heroGrade2Purple
    },
    sentinel_firepower: {
        name: "Crimson Artillery",
        description: "40% faster fire rate, 15% slower movement - Red variant",
        baseSpeed: 0.85,
        fireRate: 0.6,
        unlocked: false,
        unlockCondition: "accumulate_1000_kills",
        spriteVariant: "red", // Maps to heroGrade3Red
    },
    sentinel_tanky: {
        name: "Amber Guardian",
        description: "20% more health per life, 20% slower speed - Orange variant",
        baseSpeed: 0.8,
        fireRate: 1.0,
        healthPerLife: 1.2,
        unlocked: false,
        unlockCondition: "survive_100_hits",
        spriteVariant: "orange", // Maps to heroGrade4Orange
    },
    sentinel_precision: {
        name: "Alabaster Sniper",
        description: "Bullets pierce through enemies, 50% slower fire rate - White variant",
        baseSpeed: 1.0,
        fireRate: 2.0,
        bulletPiercing: true,
        unlocked: false,
        unlockCondition: "achieve_90%_accuracy",
        spriteVariant: "white", // Maps to heroGrade5White
    },
} as const;

/**
 * Avatar Configuration - Organized by tiers
 * Each avatar contains: name, description, unlockPrestige, unlockCostCoins, stats, sprite
 */
export const AVATAR_CONFIG = {
    tier1: {
        default_sentinel: {
        id: "default_sentinel",
        name: "Default Sentinel",
        displayName: "Azure Core",
        description: "Balanced stats - your starting avatar",
        tier: 1,
        unlockPrestige: 0,
        unlockCostCoins: 0, // Always owned
        spriteKey: "heroGrade1Blue",
        stats: {
            speedMult: 1.0,
            fireRateMult: 1.0,
            healthMult: 1.0,
            damageMult: 1.0,
        },
    },
    swift_interceptor: {
        id: "swift_interceptor",
        name: "Swift Interceptor",
        displayName: "Violet Prototype",
        description: "+20% speed, -10% fire rate, standard health",
        tier: 1,
        unlockPrestige: 1,
        unlockCostCoins: 500,
        spriteKey: "heroGrade2Purple",
        stats: {
            speedMult: 1.2,
            fireRateMult: 0.9, // Slower fire rate
            healthMult: 1.0,
            damageMult: 1.0,
        },
    },
    artillery_unit: {
        id: "artillery_unit",
        name: "Artillery Unit",
        displayName: "Crimson Prototype",
        description: "-15% speed, +25% fire rate, standard health",
        tier: 1,
        unlockPrestige: 1,
        unlockCostCoins: 500,
        spriteKey: "heroGrade3Red",
        stats: {
            speedMult: 0.85,
            fireRateMult: 1.25, // Faster fire rate
            healthMult: 1.0,
            damageMult: 1.0,
        },
    },
    },
    tier2: {
        guardian_core: {
        id: "guardian_core",
        name: "Guardian Core",
        displayName: "Amber Veteran",
        description: "+15% speed, +15% fire rate, +30% health",
        tier: 2,
        unlockPrestige: 2,
        unlockCostCoins: 1500,
        spriteKey: "heroGrade4Orange",
        stats: {
            speedMult: 1.15,
            fireRateMult: 1.15,
            healthMult: 1.3,
            damageMult: 1.0,
        },
    },
    sniper_kernel: {
        id: "sniper_kernel",
        name: "Sniper Kernel",
        displayName: "Alabaster Veteran",
        description: "Standard speed, -10% fire rate, piercing bullets",
        tier: 2,
        unlockPrestige: 2,
        unlockCostCoins: 1500,
        spriteKey: "heroGrade5White",
        stats: {
            speedMult: 1.0,
            fireRateMult: 0.9,
            healthMult: 1.0,
            damageMult: 1.0,
        },
        special: "piercing", // Special ability
    },
    assault_nexus: {
        id: "assault_nexus",
        name: "Assault Nexus",
        displayName: "Orange Veteran",
        description: "+25% speed, +20% fire rate, +20% health, burst fire",
        tier: 2,
        unlockPrestige: 3,
        unlockCostCoins: 2000,
        spriteKey: "heroGrade4Orange",
        stats: {
            speedMult: 1.25,
            fireRateMult: 1.2,
            healthMult: 1.2,
            damageMult: 1.0,
        },
        special: "burst_fire", // Special ability
    },
    },
    tier3: {
        neon_guardian: {
        id: "neon_guardian",
        name: "Neon Guardian",
        displayName: "Cyan Elite",
        description: "+30% all stats, special aura effect",
        tier: 3,
        unlockPrestige: 4,
        unlockCostCoins: 3000,
        spriteKey: "heroGrade5White", // Placeholder - use cyan variant if available
        stats: {
            speedMult: 1.3,
            fireRateMult: 1.3,
            healthMult: 1.3,
            damageMult: 1.0,
        },
        special: "aura_effect",
    },
    void_sentinel: {
        id: "void_sentinel",
        name: "Void Sentinel",
        displayName: "Black Elite",
        description: "+40% speed, enhanced invisibility, shadow effect",
        tier: 3,
        unlockPrestige: 4,
        unlockCostCoins: 3500,
        spriteKey: "heroGrade5White", // Placeholder
        stats: {
            speedMult: 1.4,
            fireRateMult: 1.0,
            healthMult: 1.0,
            damageMult: 1.0,
        },
        special: "enhanced_invisibility",
    },
    plasma_core: {
        id: "plasma_core",
        name: "Plasma Core",
        displayName: "White Elite",
        description: "+35% fire rate, +25% damage, energy effect",
        tier: 3,
        unlockPrestige: 5,
        unlockCostCoins: 4000,
        spriteKey: "heroGrade5White",
        stats: {
            speedMult: 1.0,
            fireRateMult: 1.35,
            healthMult: 1.0,
            damageMult: 1.25,
        },
        special: "energy_effect",
    },
    },
    tier4: {
        prime_sentinel: {
        id: "prime_sentinel",
        name: "Prime Sentinel",
        displayName: "Gold Ascended",
        description: "+50% all stats, maximum power",
        tier: 4,
        unlockPrestige: 6,
        unlockCostCoins: 5000,
        spriteKey: "heroGrade5White", // Placeholder - use gold variant if available
        stats: {
            speedMult: 1.5,
            fireRateMult: 1.5,
            healthMult: 1.5,
            damageMult: 1.5,
        },
        special: "maximum_power",
    },
    transcendent_form: {
        id: "transcendent_form",
        name: "Transcendent Form",
        displayName: "Platinum Ascended",
        description: "+60% all stats, legendary effects, special sprite. Unlock after defeating Zrechostikal.",
        tier: 4,
        unlockPrestige: 8,
        unlockCostCoins: 7500,
        requiresFinalBoss: true, // Special requirement
        spriteKey: "heroGrade5White", // Placeholder - use platinum variant if available
        stats: {
            speedMult: 1.6,
            fireRateMult: 1.6,
            healthMult: 1.6,
            damageMult: 1.6,
        },
        special: "legendary_effects",
    },
    },
} as const;

/**
 * Flattened avatar config for backward compatibility
 * Maps avatar IDs to their configurations
 */
export const AVATAR_CONFIG_FLAT = {
    ...AVATAR_CONFIG.tier1,
    ...AVATAR_CONFIG.tier2,
    ...AVATAR_CONFIG.tier3,
    ...AVATAR_CONFIG.tier4,
} as const;

export const SENSORY_ESCALATION = {
    musicTempo: {
        baseBeatsPerMinute: 120,
        increasePerMinute: 2,
        maxBeatsPerMinute: 160,
    },
    screenEffects: {
        baseGridOpacity: 1.0,
        scanlineIntensity: {
            layer1: 0.0,
            layer3: 0.1,
            layer5: 0.3,
            layer6: 0.5,
        },
        screenDistortion: {
            layer1: 0.0,
            layer3: 0.05,
            layer5: 0.15,
            layer6: 0.25,
        },
    },
    uiGlitching: {
        enabledAt: "layer_4",
        glitchIntensity: {
            low: 0.1,
            medium: 0.3,
            high: 0.6,
        },
    },
    hapticFeedback: {
        onEnemyKill: { duration: 50, intensity: 0.6 },
        onBossDefeat: { duration: 300, intensity: 1.0 },
        onPowerUpCollect: { duration: 100, intensity: 0.8 },
        onDamage: { duration: 200, intensity: 0.9 },
        onCorruptionCritical: { duration: 1000, pattern: "pulse" },
    },
} as const;

export const CUSTOMIZABLE_SETTINGS = {
    difficulty: {
        easyMode: { enemySpeedReduction: 0.8, spawnRateReduction: 0.7 },
        hardMode: { enemySpeedIncrease: 1.3, spawnRateIncrease: 1.5 },
    },
    accessibility: {
        colorBlindMode: true,
        highContrast: true,
        dyslexiaFont: true,
        reduceMotion: true,
        reduceFlash: true,
    },
    visual: {
        uiScale: [0.5, 1.0, 1.5, 2.0],
        uiOpacity: [0.5, 1.0],
        screenShakeIntensity: [0.0, 0.5, 1.0],
        gridIntensity: [0.3, 0.7, 1.0],
    },
} as const;

export const SPAWN_CONFIG = {
    initialDelay: 1500, // Faster start (was 2000)
    minInterval: 800, // Much faster spawns (was 1500)
    maxInterval: 2000, // Faster max (was 3000)
    difficultyIncrease: 0.93, // Faster difficulty scaling (was 0.95)
    maxEnemies: 20, // More enemies (was 15)
    baseMaxEnemies: 30, // Increased by 1.5x (was 20)
} as const;

export const MINI_ME_CONFIG = {
    maxActive: 7,
    duration: {
        min: 10000, // 10 seconds
        max: 15000, // 15 seconds
    },
    costs: {
        scout: 50,
        gunner: 75,
        shield: 100,
        decoy: 100,
        collector: 75,
        stun: 125,
        healer: 125,
    },
    behaviors: {
        scout: {
            visionRange: 200,
            scanEffect: true,
        },
        gunner: {
            fireRate: 0.5, // 50% of player fire rate
            bulletSpeed: 600,
        },
        shield: {
            damageReduction: 1,
        },
        decoy: {
            damageReduction: 0.3, // 30% less damage
            priority: 0.7, // Enemies prioritize decoy 70% of the time
        },
        collector: {
            collectionRadius: 300,
        },
        stun: {
            stunDuration: 1000, // 1 second
            pulseInterval: 2000, // Every 2 seconds
            stunRadius: 150,
        },
        healer: {
            healAmount: 1, // 1 health bar
            healInterval: 3000, // Every 3 seconds
        },
    },
    maxHits: 3, // Mini-me survives 3 enemy hits before despawning
} as const;

export const POWERUP_CONFIG = {
    spawnChance: 0.15, // Reduced from 0.25 (less frequent)
    livesSpawnChance: 0.12, // 12% chance for lives power-up from all enemies (reduced from 20%)
    firepowerSpawnChance: 0.05, // 5% chance for firepower power-up from all enemies (reduced from 8%)
    invisibilitySpawnChance: 0.10, // 10% chance for invisibility power-up from all enemies (reduced from 15%)
    types: {
        speed: {
            key: "powerupShield", // Shield icon for speed boost
            duration: 10000, // 10 seconds
            speedMultiplier: 1.5,
        },
        fireRate: {
            key: "powerupBulletFireRate", // Fire rate icon
            duration: 10000,
            fireRateMultiplier: 0.5, // Half fire rate (faster)
        },
        score: {
            key: "powerupCoin", // Coin icon for score multiplier
            duration: 15000,
            scoreMultiplier: 2,
        },
        autoShoot: {
            key: "powerupBulletFireRate", // Fire rate icon for auto-shoot
            duration: 5000, // 5 seconds
        },
        lives: {
            key: "powerupHealth", // Health icon for lives
            livesGranted: 2, // Grants 2 lives
        },
        firepower: {
            key: "powerupBulletDamage", // Bullet damage icon
            duration: 15000, // 15 seconds
            fireRateMultiplier: 1.0, // Normal fire rate (2.5x slower than previous 0.4)
            firepowerLevel: 0.5, // Increases firepower level by 0.5 (requires 2 power-ups for 1 full level)
        },
        invisibility: {
            key: "powerupInvincibility", // Invincibility icon
            duration: 10000, // 10 seconds of invincibility
        },
        bomb: {
            key: "powerupBomb", // Bomb icon
            // Instant effect - no duration
        },
        miniMe: {
            key: "powerupMiniMe", // Mini-me icon
            duration: 15000, // 15 seconds
        },
        prestige: {
            key: "powerupPrestige", // Prestige star icon
            duration: 20000, // 20 seconds
            scoreMultiplier: 1.5, // 50% score boost
            coinBonus: 5, // Grants 5 coins
        },
        primeSentinel: {
            key: "powerupPrimeSentinel", // Prime sentinel icon
            duration: 20000, // 20 seconds
        },
        comboRate: {
            key: "powerupComboRate", // Combo rate icon
            duration: 15000, // 15 seconds
            comboMultiplier: 10, // 10x combo multiplier
        },
        crown: {
            key: "powerupCrown", // Crown icon
            duration: 30000, // 30 seconds
            scoreMultiplier: 3, // 3x score multiplier
            coinBonus: 20, // Grants 20 coins
        },
    },
} as const;

export const UI_CONFIG = {
    logoFont: "Bungee", // Bold, blocky, brutalist
    menuFont: "Rajdhani", // Geometric, bold
    scoreFont: "Share Tech Mono", // Tech monospace
    bodyFont: "JetBrains Mono", // Clean monospace
    neonGreen: "#00ff00",
    fontSize: {
        small: 12,
        medium: 16,
        large: 24,
        xlarge: 32,
    },
} as const;
