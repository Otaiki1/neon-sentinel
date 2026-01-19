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
    initialLives: 1, // Player starts with 1 life
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
        shieldRadius: 200,
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
        spawnRateMultiplier: 1.0, // Base spawn rate
    },
    2: {
        name: "Firewall",
        scoreThreshold: 500,
        enemies: ["green", "yellow", "yellowShield", "yellowEcho"],
        bossChance: 0,
        gridColor: 0xffff00, // Yellow
        healthMultiplier: 1.3, // 30% more health
        bossSpeedMultiplier: 0.85,
        spawnRateMultiplier: 1.2, // 20% more enemies
    },
    3: {
        name: "Security Core",
        scoreThreshold: 1500,
        enemies: ["green", "yellow", "yellowEcho", "blue", "blueBuff"],
        bossChance: 0,
        gridColor: 0x00aaff, // Blue
        healthMultiplier: 1.6, // 60% more health
        bossSpeedMultiplier: 0.95,
        spawnRateMultiplier: 1.5, // 50% more enemies
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
        spawnRateMultiplier: 2.0, // 2x enemies
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
        spawnRateMultiplier: 2.5, // 2.5x enemies
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
        spawnRateMultiplier: 3.0, // 3x enemies
    },
} as const;

export const MAX_LAYER = 6;

export const PRESTIGE_CONFIG = {
    prestigeLevels: [
        { level: 1, difficultyMultiplier: 1.5, scoreMultiplier: 1.0 },
        { level: 2, difficultyMultiplier: 2.0, scoreMultiplier: 1.5 },
        { level: 3, difficultyMultiplier: 2.5, scoreMultiplier: 2.0 },
        { level: 4, difficultyMultiplier: 3.0, scoreMultiplier: 2.5 },
    ],
    prestigeResetThreshold: 100000,
    visualEffects: {
        gridGlitchIntensity: 0.3,
        screenFlashFrequency: 1.2,
        corruptionVFX: true,
    },
} as const;

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

export const SPAWN_CONFIG = {
    initialDelay: 1500, // Faster start (was 2000)
    minInterval: 800, // Much faster spawns (was 1500)
    maxInterval: 2000, // Faster max (was 3000)
    difficultyIncrease: 0.93, // Faster difficulty scaling (was 0.95)
    maxEnemies: 20, // More enemies (was 15)
    baseMaxEnemies: 30, // Increased by 1.5x (was 20)
} as const;

export const POWERUP_CONFIG = {
    spawnChance: 0.25, // Increased from 0.15 to 0.25 (more frequent)
    livesSpawnChance: 0.35, // 35% chance for lives power-up from all enemies
    firepowerSpawnChance: 0.08, // 8% chance for firepower power-up from all enemies (reduced from 15%)
    invisibilitySpawnChance: 0.15, // 15% chance for invisibility power-up from all enemies
    types: {
        speed: {
            key: "power_up",
            duration: 10000, // 10 seconds
            speedMultiplier: 1.5,
        },
        fireRate: {
            key: "power_up_2",
            duration: 10000,
            fireRateMultiplier: 0.5, // Half fire rate (faster)
        },
        score: {
            key: "orb",
            duration: 15000,
            scoreMultiplier: 2,
        },
        autoShoot: {
            key: "power_up", // Using same sprite for now, can be changed
            duration: 5000, // 5 seconds
        },
        lives: {
            key: "orb", // Using orb sprite for lives power-up
            livesGranted: 2, // Grants 2 lives
        },
        firepower: {
            key: "power_up_2", // Yellow power-up sprite
            duration: 15000, // 15 seconds
            fireRateMultiplier: 1.0, // Normal fire rate (2.5x slower than previous 0.4)
            firepowerLevel: 0.5, // Increases firepower level by 0.5 (requires 2 power-ups for 1 full level)
        },
        invisibility: {
            key: "power_up", // Using power_up sprite
            duration: 10000, // 10 seconds of invincibility
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
