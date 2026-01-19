# 🔧 Neon Sentinel - Developer's Bible

> **Complete Technical Documentation & Architecture Guide**

This document provides comprehensive technical documentation for developers working on Neon Sentinel. It covers architecture, configuration, implementation details, and all technical aspects of the game.

---

## 📖 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Configuration System](#configuration-system)
4. [Game Systems](#game-systems)
5. [Scene Architecture](#scene-architecture)
6. [Physics & Collisions](#physics--collisions)
7. [State Management](#state-management)
8. [Asset Management](#asset-management)
9. [Performance Optimization](#performance-optimization)
10. [Mobile Support](#mobile-support)
11. [Integration Points](#integration-points)
12. [Build & Deployment](#build--deployment)

---

## 🎯 Project Overview

### Tech Stack

- **Framework**: React 18 + TypeScript
- **Game Engine**: Phaser 3.90.0
- **Build Tool**: Vite 5.1.4
- **Styling**: Tailwind CSS 3.4.0
- **Wallet Integration**: Dynamic Labs SDK v4 + Wagmi + viem
- **Routing**: React Router DOM 7.12.0
- **State Management**: Phaser Registry + React Context
- **Data**: TanStack Query 5
- **PWA**: Vite PWA + Workbox

### Project Structure

```
neon-sentinel/
├── src/
│   ├── game/              # Phaser game code
│   │   ├── config.ts      # All game configuration
│   │   ├── Game.ts        # Phaser game initialization
│   │   └── scenes/         # Phaser scenes
│   │       ├── BootScene.ts    # Asset loading
│   │       ├── GameScene.ts    # Main gameplay
│   │       └── UIScene.ts      # UI overlay
│   ├── pages/             # React pages
│   │   ├── LandingPage.tsx     # Main menu
│   │   ├── LeaderboardPage.tsx # Hall of Fame leaderboard view
│   │   └── GamePage.tsx        # Game container
│   ├── components/        # React components
│   │   ├── WalletConnectionModal.tsx
│   │   ├── StoryModal.tsx
│   │   └── Methods.tsx
│   ├── services/         # Business logic
│   │   ├── scoreService.ts     # Leaderboard logic
│   │   └── achievementService.ts # Achievement persistence + cosmetics
│   │   └── rotatingLayerService.ts # Rotating modifier schedule helper
│   └── assets/           # Static assets
│       └── sprites/       # SVG game sprites
├── public/               # Public assets
│   └── sprites/          # Sprite files served statically
└── dist/                 # Build output
```

---

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────┐
│         React Application               │
│  (LandingPage / GamePage)               │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         Phaser Game Instance            │
│  ┌──────────┬──────────┬──────────┐   │
│  │ BootScene│GameScene │ UIScene  │   │
│  │ (Assets) │(Gameplay)│  (UI)    │   │
│  └──────────┴──────────┴──────────┘   │
└─────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      Phaser Registry (State)            │
│  - score, lives, layer, gameOver, etc.  │
└─────────────────────────────────────────┘
```

### Scene Flow

1. **BootScene**: Loads all assets, then starts GameScene and launches UIScene
2. **GameScene**: Main gameplay loop, physics, collisions, enemy spawning
3. **UIScene**: Renders UI overlay, listens to registry changes, handles modals

### Communication Patterns

- **GameScene ↔ UIScene**: Phaser Registry (cross-scene state)
- **GameScene → React**: Custom events via `window` object
- **React → GameScene**: Exposed functions on game instance
- **Wallet → Game**: Wallet address passed via registry

---

## ⚙️ Configuration System

All game configuration is centralized in `src/game/config.ts`.

### Player Configuration

```typescript
PLAYER_CONFIG = {
    speed: 400,              // Movement speed (pixels/second)
    bulletSpeed: 600,       // Bullet velocity (pixels/second)
    fireRate: 150,          // Milliseconds between shots
    startX: 400,            // Initial X position (deprecated, now dynamic)
    startY: 550,            // Initial Y position (deprecated, now dynamic)
    initialLives: 1,        // Starting lives count
}
```

### Enemy Configuration

```typescript
ENEMY_CONFIG = {
    green: {
        points: 10,          // Score points
        speed: 150,          // Movement speed
        health: 2,           // Base health (scales with layer)
        spawnWeight: 5,       // Spawn probability weight
        canShoot: false,     // Can shoot bullets
    },
    yellow: {
        points: 25,
        speed: 200,
        health: 2,
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
        speed: 180,
        health: 4,
        spawnWeight: 2,
        canShoot: true,
        shootInterval: 1500, // Milliseconds between shots
        bulletSpeed: 250,    // Enemy bullet speed
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
        speed: 220,
        health: 6,
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
        speed: 120,
        health: 20,
        spawnWeight: 0,      // Boss - spawned separately
        canShoot: false,
    },
}
```

### Layer Configuration

```typescript
LAYER_CONFIG = {
    1: {
        name: "Boot Sector",
        scoreThreshold: 0,
        enemies: ["green"],
        bossChance: 0,
        gridColor: 0x00ff00,        // Hex color for grid
        healthMultiplier: 1.0,     // Enemy health multiplier
        spawnRateMultiplier: 1.0,  // Enemy spawn rate multiplier
    },
    // ... layers 2-6
}
```

### Prestige Configuration

```typescript
PRESTIGE_CONFIG = {
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
}
```

**Prestige Mechanics**:
- Unlocks after defeating the Layer 6 graduation boss
- Loops back to Layer 1 with higher difficulty + score multipliers
- Multipliers scale beyond the listed tiers

### Difficulty Evolution Configuration

```typescript
DIFFICULTY_EVOLUTION = {
    phase1: { startMs: 0, endMs: 180000, enemyBehaviors: ["basic_pursuit"] },
    phase2: { startMs: 180000, endMs: 480000, enemyBehaviors: ["predictive_movement"] },
    phase3: { startMs: 480000, endMs: 900000, enemyBehaviors: ["coordinated_fire"] },
    phase4: { startMs: 900000, endMs: Infinity, enemyBehaviors: ["adaptive_learning"] },
}

ENEMY_BEHAVIOR_CONFIG = {
    predictiveLeadTime: 0.7,
    adaptationThreshold: 30,
    formationSpawnChance: 0.3,
    coordinatedFireDistance: 400,
    behaviourResetInterval: 120000,
}
```

**Evolution Mechanics**:
- Phase selection is time-based (ms since run start)
- Predictive aiming uses player velocity with movement-stability dampening
- Coordinated fire triggers when blue enemies cluster within range
- Adaptive learning biases spawn lanes after threshold kills, resets every interval

### Corruption System Configuration

```typescript
CORRUPTION_SYSTEM = {
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
}
```

**Corruption Mechanics**:
- Timer-based tick (1s) applies passive rise, risk bonuses, and safe-play decay
- Score multiplier and enemy difficulty scale by corruption tier
- Corrupted zones are detected by nearby enemy density

### Overclock Configuration

```typescript
OVERCLOCK_CONFIG = {
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
}
```

**Overclock Mechanics**:
- Manual activation (`Q`) with cooldown + max charges per run
- Temporary multipliers for speed, fire rate, score, and spawn rate
- UI exposes remaining duration and cooldown

### Leaderboard Categories Configuration

```typescript
LEADERBOARD_CATEGORIES = {
    highestScore: { title: "Score Champion", metric: "finalScore" },
    longestSurvival: { title: "Endurance Sentinel", metric: "survivalTime" },
    highestCorruption: { title: "Risk Taker", metric: "maxCorruptionReached" },
    mostEnemiesDefeated: { title: "Swarm Slayer", metric: "totalEnemiesDefeated" },
    cleanRuns: { title: "Perfect Sentinel", metric: "runsWithoutDamage" },
    highestCombo: { title: "Rhythm Master", metric: "peakComboMultiplier" },
    deepestLayer: { title: "System Diver", metric: "deepestLayerWithPrestige" },
    speedrun: { title: "Speed Runner", metric: "timeToReachLayer6" },
}
```

**Leaderboard Mechanics**:
- Weekly featured categories rotate via deterministic selection
- All-time records shown for inactive categories on the Hall of Fame page
- Challenge leaderboard shows non-standard modifier runs

### Rotating Layer Modifier Configuration

```typescript
ROTATING_LAYER_MODIFIERS = {
    firewall: {
        name: "Firewall Layer",
        enemySpawnRate: 1.2,
        modifiers: [{ type: "speed_cap", value: 0.7 }],
    },
    memory_leak: {
        name: "Memory Leak",
        enemySpawnRate: 0.9,
        modifiers: [
            { type: "input_delay", value: 0.1, frequency: "random_5s" },
            { type: "screen_glitch", intensity: 0.3 },
        ],
    },
    // ... more modifiers
}

ROTATING_LAYER_SCHEDULE = {
    durationHours: 3.5,
    announceBeforeMinutes: 15,
    rotationOrder: ["standard", "firewall", "memory_leak", "encrypted", "lag_spike", "void", "temporal"],
}
```

**Modifier Mechanics**:
- Rotation is time-based and global (all players share the same modifier)
- Upcoming change announced 15 minutes before the switch
- Effects include input delay, random pauses, vision mask, and speed-linked scoring

### Mid-Run Challenges Configuration

```typescript
MID_RUN_CHALLENGES = {
    challenges: [
        { id: "no_shoot_20s", description: "Survive 20 seconds without shooting" },
        { id: "clean_10_enemies", description: "Destroy 10 enemies without taking damage" },
        { id: "survive_corruption_zone", description: "Stay in 80%+ corruption area for 15 seconds" },
        { id: "defeat_5_blue", description: "Defeat 5 blue enemies in 30 seconds" },
        { id: "chain_combo", description: "Maintain 3.0x+ combo for 30 seconds" },
        { id: "dodge_25_bullets", description: "Dodge 25 enemy bullets without taking damage" },
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
}
```

**Challenge Mechanics**:
- Triggered after an initial delay, then every interval without overlap
- Per-challenge trackers stored in `GameScene` and progress pushed to registry
- Rewards can be instant (score/lives) or timed modifiers

### Achievement Configuration

```typescript
ACHIEVEMENTS = {
    tier1_basic: [{ id: "first_blood", reward: "badge_first_blood" }],
    tier2_intermediate: [{ id: "5x_combo", reward: "badge_flow_master" }],
    tier3_advanced: [{ id: "prestige_1", reward: "cosmetic_prestige_glow" }],
    tier4_legendary: [{ id: "1m_points", reward: "badge_grid_slayer" }],
}
```

**Achievement Mechanics**:
- Progress tracked per run and persisted in localStorage
- Unlocks fire announcements and update pause menu progress
- Cosmetics are selectable on the Hall of Fame page

**Key Mechanics**:
- `healthMultiplier`: Applied to all enemy health when spawning
- `bossSpeedMultiplier`: Applied to boss base speed per layer
- `spawnRateMultiplier`: Applied to spawn timer intervals
- `scoreThreshold`: Score required to trigger graduation boss
- `gridColor`: Background grid line color (visual indicator)

### Spawn Configuration

```typescript
SPAWN_CONFIG = {
    initialDelay: 1500,           // First enemy spawn delay (ms)
    minInterval: 800,             // Minimum spawn interval (ms)
    maxInterval: 2000,             // Maximum spawn interval (ms)
    difficultyIncrease: 0.93,      // Spawn rate multiplier per spawn
    maxEnemies: 20,                // Max active enemies on screen
    baseMaxEnemies: 30,            // Base max enemies (scales with layer)
}
```

**Spawn Rate Calculation**:
```typescript
baseInterval = Phaser.Math.Between(minInterval, maxInterval);
adjustedInterval = baseInterval / (spawnRateMultiplier * difficultyIncrease^spawnCount);
```

### Power-Up Configuration

```typescript
POWERUP_CONFIG = {
    spawnChance: 0.25,            // 25% chance from purple/red enemies
    livesSpawnChance: 0.35,        // 35% chance for lives from all enemies
    firepowerSpawnChance: 0.08,    // 8% chance for firepower
    invisibilitySpawnChance: 0.15, // 15% chance for invisibility
    types: {
        speed: {
            key: "power_up",
            duration: 10000,       // 10 seconds
            speedMultiplier: 1.5,  // 1.5x movement speed
        },
        fireRate: {
            key: "power_up_2",
            duration: 10000,
            fireRateMultiplier: 0.5, // 0.5x fire rate (faster)
        },
        score: {
            key: "orb",
            duration: 15000,
            scoreMultiplier: 2,    // 2x score
        },
        autoShoot: {
            key: "power_up",
            duration: 5000,        // 5 seconds
        },
        lives: {
            key: "orb",
            livesGranted: 2,       // +2 lives
        },
        firepower: {
            key: "power_up_2",
            duration: 15000,
            fireRateMultiplier: 1.0,
            firepowerLevel: 0.5,   // +0.5 per power-up (2 for 1 level)
        },
        invisibility: {
            key: "power_up",
            duration: 10000,       // 10 seconds invincibility
        },
    },
}
```

### UI Configuration

```typescript
UI_CONFIG = {
    logoFont: "Bungee",            // Retro brutalist font
    menuFont: "Rajdhani",          // Geometric font
    scoreFont: "Share Tech Mono",   // Monospace tech font
    bodyFont: "JetBrains Mono",    // Clean monospace
    neonGreen: "#00ff00",
    fontSize: {
        small: 12,
        medium: 16,
        large: 24,
        xlarge: 32,
    },
}
```

### Mobile Configuration

```typescript
MOBILE_SCALE = isMobileDevice() ? 0.5 : 1.0;

// Mobile detection
function isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
    ) || window.innerWidth <= 768;
}
```

---

## 🎮 Game Systems

### Player System

**Location**: `GameScene.ts`

**Properties**:
- `player`: Phaser.Physics.Arcade.Sprite
- `speedMultiplier`: Applied to base speed from power-ups
- `isInvisible`: Boolean flag for invisibility power-up
- `lives`: Current lives count

**Movement**:
```typescript
// Desktop: WASD or Arrow Keys
// Mobile: Virtual joystick (multi-touch enabled)
// Sensitivity: registry key `joystickSensitivity` (0.5x - 2.0x), stored in localStorage
// Speed: PLAYER_CONFIG.speed * speedMultiplier
```

**Shooting**:
```typescript
// Manual: Spacebar or mouse click (desktop)
// Mobile: Fire button held down
// Auto: When autoShootEnabled flag is true
// Fire Rate: PLAYER_CONFIG.fireRate / fireRateMultiplier
// Bullet Count: 1 + Math.floor(firepowerLevel)
```

**Collision**:
- Player-enemy collision: Loses 1 life, enemy survives
- Invincibility period: 1000ms after taking damage
- Invisibility: Prevents all damage

### Enemy System

**Location**: `GameScene.ts`

**Spawn Logic**:
```typescript
// Weighted random selection based on layer
// Formation wave spawns based on difficulty phase and formation chance
// Health scaled by: baseHealth * layerConfig.healthMultiplier
// Spawns from right side only
// Moves toward player with slight randomness
```

**Enemy Types**:
- **Regular Enemies**: Green, Yellow, Blue, Purple
- **Synergy Enemies**: Shield drones, echo decoys, buff nodes, fragmenters
- **Bosses**: Red enemies (spawned separately)
- **Graduation Bosses**: Special bosses for layer progression

**Boss Spawning**:
```typescript
// Regular Boss: Random chance based on layerConfig.bossChance
// Graduation Boss: Spawns when score threshold reached
// Graduation Boss: 3x size, 10x health multiplier
```

**Enemy Behavior**:
- **Movement**: Pursuit + predictive movement in later phases
- **Graduation Boss Movement**: Bounces off all walls (including right edge)
- **Shooting**: Blue enemies shoot every 1.5 seconds; coordinated fire syncs in phase 3+
- **Space Denial**: Graduation bosses add spread bursts in later phases
- **Synergy Effects**:
  - Shield drones reduce damage for nearby enemies
  - Buff nodes increase nearby fire rate and damage
  - Fragmenters split into greens on death
  - Echo enemies spawn decoy after-images
- **Health Bars**: Dynamic health bars above all enemies
- **Destruction**: Destroyed when health reaches 0 or goes off-screen right

### Bullet System

**Location**: `GameScene.ts`

**Player Bullets**:
- **Group**: `bullets` (Phaser.Physics.Arcade.Group)
- **Max Size**: 100 (supports multiple bullets per shot)
- **Speed**: PLAYER_CONFIG.bulletSpeed (600)
- **Direction**: Forward with optional spread at higher firepower
- **Multi-shot**: Based on `firepowerLevel` (0.5 increments)

**Enemy Bullets**:
- **Group**: `enemyBullets` (Phaser.Physics.Arcade.Group)
- **Max Size**: 30
- **Speed**: ENEMY_CONFIG.blue.bulletSpeed (250)
- **Direction**: Toward player
- **Shooter**: Blue enemies and graduation bosses

### Power-Up System

**Location**: `GameScene.ts`

**Spawn Logic**:
```typescript
// From enemies: 25% chance from purple/red enemies
// Lives: 35% chance from all enemies
// Firepower: 8% chance from all enemies
// Invisibility: 15% chance from all enemies
// Other: Random from remaining types
```

**Power-Up Types**:
- **Speed**: Increases `speedMultiplier` to 1.5
- **Fire Rate**: Sets `fireRateMultiplier` to 0.5
- **Score**: Sets `scoreMultiplier` to 2
- **Auto-Shoot**: Sets `autoShootEnabled` to true
- **Lives**: Adds 2 to `lives` count
- **Firepower**: Increases `firepowerLevel` by 0.5
- **Invisibility**: Sets `isInvisible` to true, player alpha to 0.3

**Timer Management**:
```typescript
// Power-up timers stored in Map<string, TimerEvent>
// Auto-cleanup on expiration
// Despawn timer: 6 seconds for uncollected power-ups
// Fade-out: Starts at 5 seconds
```

### Scoring System

**Location**: `GameScene.ts`

**Score Calculation**:
```typescript
basePoints = enemy.points;
// addScore is called with basePoints * comboMultiplier
adjustedPoints = Math.floor(basePoints * comboMultiplier * scoreMultiplier * corruptionMultiplier);
totalScore += adjustedPoints;
```

**Combo System**:
```typescript
// Starts at 1.0x
// Increases by 0.1x per enemy destroyed
// Resets to 1.0x on player hit
// Slowly decays after 10s without scoring (combo *= 0.99 per update tick)
```

**Layer Progression**:
```typescript
// Checks score against LAYER_CONFIG thresholds
// If threshold reached and no graduation boss active:
//   - Spawns graduation boss
//   - Sets pendingLayer
// On graduation boss defeat:
//   - Updates currentLayer
//   - Updates deepestLayer
//   - Resumes normal spawning
// On Layer 6 graduation boss defeat:
//   - Enters prestige mode and loops back to Layer 1
```

### Lives System

**Location**: `GameScene.ts`

**Mechanics**:
- **Starting Lives**: 1 (PLAYER_CONFIG.initialLives)
- **Life Orbs**: Grant +2 lives each (no cap)
- **Damage**: Lose 1 life on enemy collision
- **Game Over**: When lives === 0
- **Invincibility**: 1000ms after taking damage

---

## 🎬 Scene Architecture

### BootScene

**Purpose**: Asset loading

**Key Methods**:
- `preload()`: Loads all sprites, fonts, assets
- `create()`: Starts GameScene and launches UIScene

**Assets Loaded**:
- Player sprites: `hero`, `hero_2`, `hero_3`, `sidekick`, `hero_sidekick_2`
- Enemy sprites: All enemy types and variants
- Bullet sprites: `greenBullet1`, `greenBullet2`, `yellowBullet`, `blueBullet`
- Explosion sprites: `smallFire`, `mediumFire`, `bigFire`, `greenFire`
- Power-up sprites: `power_up`, `power_up_2`, `orb`
- Boss sprites: All boss variants

### GameScene

**Purpose**: Main gameplay

**Key Properties**:
- `player`: Player sprite
- `bullets`: Player bullet group
- `enemyBullets`: Enemy bullet group
- `enemies`: Enemy group
- `powerUps`: Power-up group
- `explosions`: Explosion group
- `score`, `lives`, `currentLayer`, etc.

**Key Methods**:
- `create()`: Initializes game, shows instruction modal
- `update()`: Main game loop
- `spawnEnemy()`: Spawns enemies based on layer
- `spawnBoss()`: Spawns regular bosses
- `spawnGraduationBoss()`: Spawns layer progression bosses
- `shoot()`: Player shooting logic
- `handleBulletEnemyCollision()`: Bullet-enemy collision
- `handlePlayerEnemyCollision()`: Player-enemy collision
- `handlePlayerPowerUpCollision()`: Power-up collection
- `addScore()`: Score calculation and layer progression
- `updateLayer()`: Layer progression logic
- `drawBackgroundGrid()`: Background rendering
- `drawProgressBar()`: Progress bar rendering
- `createEnemyHealthBar()`: Health bar creation
- `updateEnemyHealthBar()`: Health bar updates
- `showAnnouncement()`: Announcement cards
- `showInstructionModal()`: Game start instructions

**Update Loop**:
```typescript
update() {
    if (gameOver || isPaused) return;
    
    // Handle input
    handlePlayerMovement();
    
    // Auto-shoot if enabled; otherwise use mobile fire button or desktop input
    if (autoShootEnabled || fireButtonHeld || spaceKeyDown || pointerDown) {
        shoot();
    }
    
    // Update enemies
    enemies.children.entries.forEach(enemy => {
        // Bounce logic
        // Shooting logic (blue enemies)
        // Health bar position updates
        // Off-screen cleanup
    });
    
    // Update power-ups
    // Update bullets
    // Update explosions
}
```

### UIScene

**Purpose**: UI overlay

**Key Properties**:
- `scoreText`, `comboText`, `layerText`: UI text elements
- `livesOrb`: Lives orb indicator graphic
- `gameOverContainer`: Game over modal
- `pauseContainer`: Pause modal
- `settingsContainer`: Joystick settings panel
- `leaderboardPanel`: Leaderboard display (auto-hide timer)
- `pauseButton`: Pause button

**Key Methods**:
- `create()`: Initializes UI elements
- `updateScore()`: Updates score display
- `updateCombo()`: Updates combo display
- `updateLayer()`: Updates layer display
- `updateLives()`: Updates lives display
- `onGameOver()`: Shows game over modal
- `onPauseChanged()`: Shows/hides pause modal
- `showLeaderboard()`: Displays leaderboard (auto-hides after delay)
- `createLeaderboardPanel()`: Creates leaderboard UI
- `createSettingsOverlay()`: Creates joystick sensitivity settings
- `adjustSensitivity()`: Updates sensitivity and localStorage
- `createPauseButton()`: Creates pause button
- `createButton()`: Button creation helper

**Registry Listeners**:
```typescript
registry.events.on('changedata-score', updateScore);
registry.events.on('changedata-comboMultiplier', updateCombo);
registry.events.on('changedata-layerName', updateLayer);
registry.events.on('changedata-lives', updateLives);
registry.events.on('changedata-gameOver', onGameOver);
registry.events.on('changedata-isPaused', onPauseChanged);
```

---

## 💥 Physics & Collisions

### Physics Engine

**Type**: Phaser Arcade Physics

**Configuration**:
```typescript
physics: {
    default: "arcade",
    arcade: {
        gravity: { x: 0, y: 0 },  // No gravity
        debug: false,              // Debug mode off
    },
}
```

### Collision Groups

1. **Player ↔ Enemies**: `physics.add.overlap(player, enemies)`
2. **Bullets ↔ Enemies**: `physics.add.overlap(bullets, enemies)`
3. **Player ↔ Enemy Bullets**: `physics.add.overlap(player, enemyBullets)`
4. **Player ↔ Power-ups**: `physics.add.overlap(player, powerUps)`

### Collision Handlers

**Bullet-Enemy Collision**:
```typescript
handleBulletEnemyCollision(bullet, enemy) {
    // Remove bullet
    // Reduce enemy health
    // Update health bar
    // If health <= 0: destroy enemy, add score, spawn power-up
    // If graduation boss: advance layer
}
```

**Player-Enemy Collision**:
```typescript
handlePlayerEnemyCollision(player, enemy) {
    // Check invincibility period
    // Check invisibility
    // Call takeDamage()
    // Enemy survives (doesn't die)
}
```

**Player-Power-up Collision**:
```typescript
handlePlayerPowerUpCollision(player, powerUp) {
    // Get power-up type
    // Apply effect based on type
    // Set timer for temporary effects
    // Destroy power-up
}
```

### Boundary Behavior

- **Player**: `setCollideWorldBounds(true)` - Stays on screen
- **Enemies**: Bounce off top, bottom, left walls; destroyed off right
- **Bullets**: Destroyed when off-screen
- **Power-ups**: Destroyed after 6 seconds if uncollected

---

## 📊 State Management

### Phaser Registry

**Purpose**: Cross-scene state communication

**Registry Keys**:
- `score`: Current score
- `comboMultiplier`: Current combo multiplier
- `layerName`: Current layer name
- `currentLayer`: Current layer number
- `lives`: Current lives count
- `gameOver`: Game over flag
- `finalScore`: Final score on game over
- `deepestLayer`: Deepest layer reached
- `isPaused`: Pause state
- `walletAddress`: Connected wallet address
- `joystickSensitivity`: Mobile joystick sensitivity (0.5x - 2.0x)
- `prestigeLevel`: Current prestige cycle
- `prestigeScoreMultiplier`: Current prestige score multiplier
- `prestigeDifficultyMultiplier`: Current prestige difficulty multiplier
- `prestigeChampion`: Boolean for Prestige 10 badge
- `corruption`: Current corruption level (0-100)
- `overclockActive`: Boolean for active overclock
- `overclockProgress`: Remaining duration (0-1)
- `overclockCooldown`: Remaining cooldown (0-1)
- `overclockCharges`: Remaining activations
- `challengeActive`: Whether a micro-challenge is live
- `challengeTitle`: UI banner title
- `challengeDescription`: UI banner description
- `challengeProgress`: Progress (0-1)

**Usage**:
```typescript
// Set value
registry.set("score", newScore);

// Get value
const score = registry.get("score");

// Listen to changes
registry.events.on('changedata-score', callback);
```

### GameScene State

**Properties**:
- `score`, `lives`, `currentLayer`, `deepestLayer`
- `prestigeLevel`, `prestigeScoreMultiplier`, `prestigeDifficultyMultiplier`
- `corruption`, `currentCorruptionTier`
- `comboMultiplier`, `speedMultiplier`, `fireRateMultiplier`, `scoreMultiplier`
- `autoShootEnabled`, `isInvisible`, `firepowerLevel`
- `gameOver`, `isPaused`, `graduationBossActive`, `pendingLayer`
- `powerUpTimers`: Map of active power-up timers

### React State

**LandingPage**:
- `leaderboard`: Leaderboard data
- `currentWeek`: Current ISO week number
- `showWalletModal`: Wallet modal visibility
- `showStoryModal`: Story modal visibility

**GamePage**:
- `gameRef`: Reference to Phaser game instance
- Exposes `returnToMenu` function to Phaser

---

## 🎨 Asset Management

### Sprite Loading

**Location**: `BootScene.ts`

**Sprite Paths**: All sprites loaded from `/sprites/` (public directory)

**Sprite Keys**:
- Player: `hero`, `hero_2`, `hero_3`, `sidekick`, `hero_sidekick_2`
- Enemies: `enemyGreen`, `enemyYellow`, `enemyBlue`, `enemyPurple`, etc.
- Bullets: `greenBullet1`, `greenBullet2`, `yellowBullet`, `blueBullet`
- Explosions: `smallFire`, `mediumFire`, `bigFire`, `greenFire`
- Power-ups: `power_up`, `power_up_2`, `orb`
- Bosses: `enemyPurpleBoss`, `miniFinalBoss`, `mediumFinalBoss`, `finalBoss`

### Sprite Scaling

**Base Scale**: 0.5 (50% of original size)
**Mobile Scale**: `MOBILE_SCALE` (0.5 on mobile, 1.0 on desktop)
**Final Scale**: `baseScale * MOBILE_SCALE`

**Examples**:
- Player: `0.5 * MOBILE_SCALE`
- Enemies: `0.5 * MOBILE_SCALE`
- Bullets: `0.3 * MOBILE_SCALE`
- Power-ups: `0.4 * MOBILE_SCALE`
- Bosses: `0.6 * MOBILE_SCALE` (regular), `0.7 * 3 * MOBILE_SCALE` (graduation)

### Font Loading

**Location**: `src/index.css`

**Fonts**:
- Bungee (logoFont)
- Rajdhani (menuFont)
- Share Tech Mono (scoreFont)
- JetBrains Mono (bodyFont)

**Usage**: Loaded via Google Fonts `@import`

---

## ⚡ Performance Optimization

### Object Pooling

**Bullets**: Phaser Groups with `maxSize` limit
- Player bullets: 100 max
- Enemy bullets: 30 max

**Enemies**: Dynamic group, cleaned up on destruction

**Power-ups**: Dynamic group, auto-despawn after 6 seconds

### Rendering Optimization

- **Background Grid**: Redrawn only on layer change
- **Health Bars**: Updated only when health changes
- **Progress Bar**: Redrawn on score changes
- **UI Elements**: Static, updated via registry listeners

### Mobile Optimizations

- **Sprite Scaling**: 50% size on mobile
- **UI Scaling**: 60-80% size on mobile
- **Reduced Effects**: Lower shadow/glow intensity
- **Touch Controls**: Simplified input handling

### Memory Management

- **Destroy on Off-screen**: Enemies destroyed when off-screen right
- **Timer Cleanup**: Power-up timers cleaned up on expiration
- **Graphics Cleanup**: Health bars destroyed with enemies
- **Event Cleanup**: Event listeners removed on scene shutdown

---

## 📱 Mobile Support

### Mobile Detection

```typescript
function isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
    ) || window.innerWidth <= 768;
}
```

### Mobile Scaling

**MOBILE_SCALE**: 0.5 on mobile, 1.0 on desktop

**Applied To**:
- All sprite scales
- UI font sizes
- UI element positions
- Button sizes

### Touch Controls

**Implementation**: `GameScene.ts`

**Touch Events**:
- `pointerdown`: Capture joystick or fire button pointer
- `pointermove`: Update joystick vector
- `pointerup`: Reset joystick or stop firing

**Behavior**:
- Player moves based on joystick vector
- Fire button enables continuous firing
- Multi-touch allows moving and firing simultaneously

**Settings**:
- Joystick sensitivity is adjustable (0.5x - 2.0x) and persisted in localStorage
- Movement speed: Same as keyboard input

### Mobile UI

**Scaling**:
- Score: 56px → 33.6px (60% scale)
- Combo: 24px → 14.4px
- Layer: 12px → 7.2px
- Lives: Orb indicators scale with UI (no numeric text)

**Opacity**: 85-90% on mobile to reduce obstruction

**Buttons**: Scaled to 70-80% size

---

## 🔌 Integration Points

### React ↔ Phaser

**React → Phaser**:
```typescript
// GamePage.tsx
const gameRef = useRef<Phaser.Game | null>(null);

// Expose function to Phaser
(window as any).returnToMenu = () => {
    navigate('/');
};
```

**Phaser → React**:
```typescript
// GameScene.ts
const returnToMenu = (window as any).returnToMenu;
if (returnToMenu) returnToMenu();
```

### Wallet Integration

**Dynamic Wallet**:
- Connected via `useDynamicContext()` hook
- Wallet address passed to Phaser via registry
- Score submission includes wallet address

**Anonymous Mode**:
- Stored in localStorage: `neon-sentinel-user-mode`
- Scores submitted without wallet address
- Leaderboard shows "Anonymous"

**Onboarding State**:
- Wallet modal seen: `neon-sentinel-wallet-modal-seen`
- Story modal seen: `neon-sentinel-story-modal-seen`
- Joystick sensitivity: `neon-sentinel-joystick-sensitivity`

### Score Service

**Location**: `src/services/scoreService.ts`

**Functions**:
- `submitScore(score, walletAddress?, deepestLayer?, prestigeLevel?, runMetrics?, modifierKey?)`: Submit score with run metrics + modifier
- `fetchWeeklyLeaderboard()`: Basic weekly score leaderboard for in-game UI
- `fetchWeeklyChallengeLeaderboard()`: Weekly leaderboard for modifier runs
- `fetchWeeklyCategoryLeaderboard(category)`: Weekly leaderboard by category
- `fetchAllTimeCategoryLeaderboard(category)`: All-time leaderboard by category
- `getFeaturedWeeklyCategories(week, count)`: Rotation helper for featured categories
- `getCurrentISOWeek()`: Get current ISO week number

**Storage**: localStorage (mock implementation)

**Weekly Reset**: Based on ISO week number

### Achievement Service

**Location**: `src/services/achievementService.ts`

**Responsibilities**:
- Persist unlocked achievements and progress
- Track lifetime totals (score/playtime)
- Provide unlocked badges/cosmetics and selection

---

## 🏗️ Build & Deployment

### Build Commands

```bash
# Development
yarn dev

# Production build
yarn build

# Preview production build
yarn preview
```

### Build Output

**Location**: `dist/`

**Structure**:
- `index.html`: Main HTML file
- `assets/`: Bundled JS/CSS files
- `sprites/`: Sprite files (copied from public)

### Vite Configuration

**Key Settings**:
- React plugin
- TypeScript support
- PostCSS for Tailwind
- Asset handling for SVGs
- PWA manifest + service worker via `vite-plugin-pwa`
- Dev server allowlist for ngrok

### PWA Support

- Service worker registered in `src/main.tsx` via `virtual:pwa-register`
- Auto-update enabled with `registerType: 'autoUpdate'`
- Icons and manifest defined in `vite.config.ts`

### Environment Variables

`VITE_DYNAMIC_ENVIRONMENT_ID` is required for Dynamic Labs wallet integration.

---

## 🐛 Debugging

### Phaser Debug Mode

**Enable**: Set `debug: true` in physics config

**Features**:
- Collision box visualization
- Velocity vectors
- Body bounds

### Console Logging

**Key Log Points**:
- Layer progression
- Boss spawning
- Score submission
- Power-up collection

### Registry Inspection

```typescript
// In browser console
const game = window.gameInstance;
const registry = game.scene.scenes[1].registry;
console.log(registry.getAll());
```

---

## 📝 Code Style

### TypeScript

- **Strict Mode**: Enabled
- **Type Safety**: All types explicitly defined
- **Interfaces**: Used for complex objects

### Naming Conventions

- **Classes**: PascalCase (`GameScene`)
- **Methods**: camelCase (`spawnEnemy`)
- **Constants**: UPPER_SNAKE_CASE (`PLAYER_CONFIG`)
- **Private Properties**: camelCase with `private` keyword

### File Organization

- **One class per file**: Each scene in separate file
- **Config centralized**: All config in `config.ts`
- **Services separated**: Business logic in `services/`

---

## 🔄 Future Enhancements

### Potential Improvements

1. **Backend Integration**: Replace localStorage with real API
2. **Multiplayer**: Add co-op or competitive modes
3. **Achievements**: Unlock system for milestones
4. **Sound Effects**: Audio feedback for actions
5. **Particle Effects**: Enhanced visual effects
6. **Save System**: Save progress between sessions
7. **Replay System**: Record and replay games
8. **Tournament Mode**: Time-limited competitions

---

## 📚 Additional Resources

### Phaser 3 Documentation
- https://photonstorm.github.io/phaser3-docs/

### React Documentation
- https://react.dev/

### Dynamic Labs Documentation
- https://docs.dynamic.xyz/

### TypeScript Documentation
- https://www.typescriptlang.org/docs/

---

*Last Updated: Game Version 1.8*
*Maintained by: Neon Sentinel Development Team*

