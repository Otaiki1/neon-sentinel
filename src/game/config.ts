// Game configuration constants

export const GAME_CONFIG = {
  width: 800,
  height: 600,
  backgroundColor: '#000000',
} as const;

export const PLAYER_CONFIG = {
  speed: 300,
  bulletSpeed: 500,
  fireRate: 200, // milliseconds between shots
  startX: 400,
  startY: 550,
} as const;

export const ENEMY_CONFIG = {
  green: {
    points: 10,
    speed: 100,
    health: 1,
    spawnWeight: 5,
    canShoot: false,
  },
  yellow: {
    points: 25,
    speed: 150,
    health: 1,
    spawnWeight: 3,
    canShoot: false,
  },
  blue: {
    points: 50,
    speed: 120,
    health: 2,
    spawnWeight: 2,
    canShoot: true,
    shootInterval: 2000,
    bulletSpeed: 200,
  },
  purple: {
    points: 100,
    speed: 180,
    health: 3,
    spawnWeight: 1,
    canShoot: false,
  },
  red: {
    points: 500,
    speed: 100,
    health: 10,
    spawnWeight: 0, // Boss - spawned separately
    canShoot: false,
  },
} as const;

// Layer progression system - score thresholds
export const LAYER_CONFIG = {
  1: {
    name: 'Boot Sector',
    scoreThreshold: 0,
    enemies: ['green'],
    bossChance: 0,
  },
  2: {
    name: 'Firewall',
    scoreThreshold: 500,
    enemies: ['green', 'yellow'],
    bossChance: 0,
  },
  3: {
    name: 'Security Core',
    scoreThreshold: 1500,
    enemies: ['green', 'yellow', 'blue'],
    bossChance: 0,
  },
  4: {
    name: 'Corrupted AI',
    scoreThreshold: 4000,
    enemies: ['green', 'yellow', 'blue', 'purple'],
    bossChance: 0.01, // 1% chance for purple boss
  },
  5: {
    name: 'Kernel Breach',
    scoreThreshold: 10000,
    enemies: ['green', 'yellow', 'blue', 'purple'],
    bossChance: 0.05, // 5% chance for mini/medium boss
  },
  6: {
    name: 'System Collapse',
    scoreThreshold: 25000,
    enemies: ['green', 'yellow', 'blue', 'purple'],
    bossChance: 0.1, // 10% chance for final boss
  },
} as const;

export const SPAWN_CONFIG = {
  initialDelay: 2000, // Start spawning after 2 seconds
  minInterval: 1500, // Minimum time between spawns (ms)
  maxInterval: 3000, // Maximum time between spawns (ms)
  difficultyIncrease: 0.95, // Multiply interval by this each wave (makes it faster)
  maxEnemies: 15, // Maximum enemies on screen at once
} as const;

export const UI_CONFIG = {
  pixelFont: 'Press Start 2P',
  neonGreen: '#00ff00',
  fontSize: {
    small: 12,
    medium: 16,
    large: 24,
    xlarge: 32,
  },
} as const;

