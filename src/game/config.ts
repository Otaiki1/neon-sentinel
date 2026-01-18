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
    blue: {
        points: 50,
        speed: 180, // Increased from 120
        health: 4, // Doubled from 2
        spawnWeight: 2,
        canShoot: true,
        shootInterval: 1500, // Faster shooting (was 2000)
        bulletSpeed: 250, // Faster bullets (was 200)
    },
    purple: {
        points: 100,
        speed: 220, // Increased from 180
        health: 6, // Doubled from 3
        spawnWeight: 1,
        canShoot: false,
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
        bossSpeedMultiplier: 0.75, // Slower bosses for early sector pacing
        spawnRateMultiplier: 1.0, // Base spawn rate
    },
    2: {
        name: "Firewall",
        scoreThreshold: 500,
        enemies: ["green", "yellow"],
        bossChance: 0,
        gridColor: 0xffff00, // Yellow
        healthMultiplier: 1.3, // 30% more health
        bossSpeedMultiplier: 0.85,
        spawnRateMultiplier: 1.2, // 20% more enemies
    },
    3: {
        name: "Security Core",
        scoreThreshold: 1500,
        enemies: ["green", "yellow", "blue"],
        bossChance: 0,
        gridColor: 0x00aaff, // Blue
        healthMultiplier: 1.6, // 60% more health
        bossSpeedMultiplier: 0.95,
        spawnRateMultiplier: 1.5, // 50% more enemies
    },
    4: {
        name: "Corrupted AI",
        scoreThreshold: 4000,
        enemies: ["green", "yellow", "blue", "purple"],
        bossChance: 0.01, // 1% chance for purple boss
        gridColor: 0xaa00ff, // Purple
        healthMultiplier: 2.0, // 2x health
        bossSpeedMultiplier: 1.05,
        spawnRateMultiplier: 2.0, // 2x enemies
    },
    5: {
        name: "Kernel Breach",
        scoreThreshold: 10000,
        enemies: ["green", "yellow", "blue", "purple"],
        bossChance: 0.05, // 5% chance for mini/medium boss
        gridColor: 0xff3333, // Red
        healthMultiplier: 2.5, // 2.5x health
        bossSpeedMultiplier: 1.15,
        spawnRateMultiplier: 2.5, // 2.5x enemies
    },
    6: {
        name: "System Collapse",
        scoreThreshold: 25000,
        enemies: ["green", "yellow", "blue", "purple"],
        bossChance: 0.1, // 10% chance for final boss
        gridColor: 0xff0000, // Bright red
        healthMultiplier: 3.0, // 3x health
        bossSpeedMultiplier: 1.25,
        spawnRateMultiplier: 3.0, // 3x enemies
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
