import Phaser from "phaser";
import {
    PLAYER_CONFIG,
    ENEMY_CONFIG,
    SPAWN_CONFIG,
    LAYER_CONFIG,
    POWERUP_CONFIG,
    MOBILE_SCALE,
    UI_CONFIG,
    MAX_LAYER,
    PRESTIGE_CONFIG,
    getPrestigeTierConfig,
    getPrestigeCoinReward,
    DIFFICULTY_EVOLUTION,
    ENEMY_BEHAVIOR_CONFIG,
    OVERCLOCK_CONFIG,
    SHOCK_BOMB_CONFIG,
    GOD_MODE_CONFIG,
    MID_RUN_CHALLENGES,
    ACHIEVEMENTS,
    ROTATING_LAYER_MODIFIERS,
    PLAYER_KERNELS,
    SENSORY_ESCALATION,
    CUSTOMIZABLE_SETTINGS,
    SESSION_REWARDS,
} from "../config";
import {
    addLifetimePlayMs,
    addLifetimeScore,
    getLifetimeStats,
    getSelectedCosmetic,
    getSelectedSkin,
    recordProfileRunStats,
    setAchievementProgress,
    shouldNotifyAboutToUnlock,
    unlockAchievement,
} from "../../services/achievementService";
import {
    startSession,
    updateLifetimePlaytime,
} from "../../services/sessionRewardService";
import { getRotationInfo } from "../../services/rotatingLayerService";
import type { RunMetrics } from "../../services/scoreService";
import {
    getSelectedKernelKey,
    recordKernelRunStats,
} from "../../services/kernelService";
import {
    getCurrentHeroGrade,
    getHeroGradeConfig,
    checkAndUnlockHeroGrades,
} from "../../services/heroGradeService";
import {
    getAvailableCoins,
    addCoins,
    spendCoins,
    grantPrestigeReward,
    getReviveCost,
    checkAndGrantPrimeSentinelBonus,
} from "../../services/coinService";
import {
    activateMiniMe,
    type MiniMeType,
} from "../../services/inventoryService";
import {
    getEnemySpriteKey,
    getEnemyDisplayName,
    getEnemyStats,
    getEnemyColorFromType,
    getGraduationBossName,
    getGraduationBossSpriteKey,
} from "../../services/enemyService";
import { MINI_ME_CONFIG } from "../config";
import { isShockBombUnlocked, isGodModeUnlocked } from "../../services/abilityService";
import {
    getMilestoneForProgress,
    shouldTriggerMilestone,
    completeMilestone,
    updateStoryState,
} from "../../services/storyService";
import {
    getActiveAvatar,
    getActiveAvatarStats,
    getAvatarConfig,
} from "../../services/avatarService";
import {
    getRankName,
    updateCurrentRank,
    calculateRankMilestone,
} from "../../services/rankService";
import {
    getDialogueForTrigger,
    type DialogueState,
} from "../lore/dialogues";
import {
    markDialogueAsViewed,
    hasViewedDialogue,
    isFirstRun,
} from "../../services/dialogueService";
import {
    getCurrentBulletTier,
    getBulletStats,
    type BulletTier,
} from "../../services/bulletUpgradeService";

export class GameScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
    private bullets!: Phaser.Physics.Arcade.Group;
    private enemies!: Phaser.Physics.Arcade.Group;
    private explosions!: Phaser.GameObjects.Group;

    private lastFired = 0;
    private spawnTimer: Phaser.Time.TimerEvent | null = null;
    private nextSpawnTime = SPAWN_CONFIG.initialDelay;
    private gameOver = false;
    private score = 0;
    private comboMultiplier = 1;
    private healthBars: number = PLAYER_CONFIG.initialHealthBars;
    private lastHitTime = 0;
    private backgroundGrid!: Phaser.GameObjects.Graphics;
    private layerBackgroundImage!: Phaser.GameObjects.Image;
    private darkOverlay!: Phaser.GameObjects.Graphics;
    private currentLayer = 1;
    private deepestLayer = 1;
    private prestigeLevel = 0;
    private prestigeDifficultyMultiplier = 1;
    private prestigeScoreMultiplier = 1;
    private prestigeFlashTimer: Phaser.Time.TimerEvent | null = null;
    private prestigeGlitchTimer: Phaser.Time.TimerEvent | null = null;
    // @ts-ignore - Used in enterPrestigeMode but TypeScript doesn't detect it
    private prestigeResetAvailable = true;
    private overclockKey!: Phaser.Input.Keyboard.Key;
    private overclockActive = false;
    private overclockReadyAt = 0;
    private overclockActivations = 0;
    private overclockTimer: Phaser.Time.TimerEvent | null = null;
    private overclockEndTime = 0;
    private overclockScoreMultiplier = 1;
    private overclockFireRateMultiplier = 1;
    private overclockSpeedMultiplier = 1;
    private overclockSpawnMultiplier = 1;
    // Shock bomb system
    private shockBombKey!: Phaser.Input.Keyboard.Key;
    private shockBombProgress = 0;
    private shockBombReady = false;
    private shockBombCooldownUntil = 0;
    private shockBombStreaks: Phaser.GameObjects.Graphics[] = [];
    // God mode system
    private godModeKey!: Phaser.Input.Keyboard.Key;
    private godModeProgress = 0;
    private godModeReady = false;
    private godModeActive = false;
    private godModeEndTime = 0;
    private godModeCooldownUntil = 0;
    private godModeTimer: Phaser.Time.TimerEvent | null = null;
    private godModeGlow!: Phaser.GameObjects.Graphics;
    private originalPlayerTexture: string = "hero";
    private totalEnemiesDefeated = 0;
    private tookDamageThisRun = false;
    private peakComboMultiplier = 1;
    private timeToReachLayer6: number | null = null;
    private nextChallengeTime = 0;
    private lastChallengeEndTime = 0;
    private activeChallenge:
        | (typeof MID_RUN_CHALLENGES.challenges)[number]
        | null = null;
    private enemiesKilledThisLayer = 0;
    private enemiesRequiredBeforeBoss = 0;
    private challengeStartTime = 0;
    private challengeWindowEnd = 0;
    private challengeKills = 0;
    private challengeBlueKills = 0;
    private challengeZoneTime = 0;
    private challengeComboTime = 0;
    private challengeBulletsDodged = 0;
    private challengeDamageTaken = false;
    private challengeScoreMultiplier = 1;
    private challengeFireRateMultiplier = 1;
    private challengeCorruptionMultiplier = 1;
    private challengeInvincibilityBonusMs = 0;
    private challengeRewardTimers = new Map<string, Phaser.Time.TimerEvent>();
    private runLifeOrbs = 0;
    private runBossesDefeated = 0;
    private tookDamageBeforeLayer3 = false;
    private sessionScoreMultiplier = 1;
    private sessionStreakScoreMultiplier = 1;
    private sessionComboStartBoost = 1;
    private sessionBoostEndTime = 0;
    private sessionLastTick = 0;
    private currentModifierKey: keyof typeof ROTATING_LAYER_MODIFIERS = "standard";
    // @ts-expect-error - Set by initRotatingModifier/updateRotatingModifier
    private nextModifierKey: keyof typeof ROTATING_LAYER_MODIFIERS = "standard";
    // @ts-expect-error - Set by initRotatingModifier/updateRotatingModifier
    private nextModifierChangeTime = 0;
    private modifierAnnouncementShown = false;
    private modifierSpawnMultiplier = 1;
    private modifierSpeedCap = 1;
    private modifierInputDelayMs = 0;
    private modifierBaseInputDelayMs = 0;
    private modifierInputQueue: Array<{ time: number; vx: number; vy: number }> = [];
    private modifierLastAppliedVelocity = { vx: 0, vy: 0 };
    private modifierPauseActive = false;
    private modifierPauseCooldown = 0;
    private modifierVisionOverlay: Phaser.GameObjects.Graphics | null = null;
    private modifierVisionMask: Phaser.Display.Masks.GeometryMask | null = null;
    private modifierSpeedScoreRatio = 0;
    private modifierInputDelayRandom = false;
    private modifierInputDelayNextToggle = 0;
    private modifierInputDelayEndTime = 0;
    private modifierPauseDurationMs = 0;
    private modifierPauseIntervalMs = 0;
    private modifierGlitchIntensity = 0;
    private lastRunMetrics: RunMetrics | null = null;
    private kernelSpeedMultiplier = 1;
    private kernelFireRateMultiplier = 1;
    private kernelHealthMultiplier = 1;
    private kernelBulletPiercing = false;
    private kernelDamageAccumulator = 0;
    private heroGradeSpeedMultiplier = 1;
    private heroGradeFireRateMultiplier = 1;
    // Health bars are always 5, not affected by hero grade
    private heroGradeDamageMultiplier = 1;
    private heroGradeBulletPiercing = false;
    private avatarSpeedMultiplier = 1;
    private avatarFireRateMultiplier = 1;
    private avatarHealthMultiplier = 1;
    private avatarDamageMultiplier = 1;
    private shotsFiredThisRun = 0;
    private shotsHitThisRun = 0;
    private hitsTakenThisRun = 0;
    private enemyUidCounter = 0;
    // private lastRiskyKillTime = 0; // Unused
    // private lastNoHitRewardTime = 0; // Unused
    private scanlineOverlay?: Phaser.GameObjects.Graphics;
    private gridOpacityMultiplier = 1;
    private scanlineIntensity = 0;
    private distortionIntensity = 0;
    private uiGlitchIntensity = 0;
    private lastMusicTempoUpdate = 0;
    private distortionCooldown = 0;
    private comboShakeCooldown = 0;
    private powerUpsCollected = 0;
    private totalBulletsDodged = 0;
    private totalHealthBarsLost = 0;
    private lastRunStatsUpdate = 0;
    private settingsEnemySpeedMultiplier = 1;
    private settingsSpawnRateMultiplier = 1;
    private settingsGridIntensity = 1;
    private settingsScreenShakeMultiplier = 1;
    private settingsReduceMotion = false;
    private settingsReduceFlash = false;
    private settingsColorBlindMode = false;
    private reviveCount = 0;
    private runStartTime = 0;
    private currentDifficultyPhase: keyof typeof DIFFICULTY_EVOLUTION = "phase1";
    private lastMovementSampleTime = 0;
    private lastMovementDirection = new Phaser.Math.Vector2(0, 0);
    private directionChangeCount = 0;
    private directionSampleCount = 0;
    private movementDirectionSum = new Phaser.Math.Vector2(0, 0);
    private adaptationKillCount = 0;
    private adaptiveSpawnBias: { yMin: number; yMax: number } | null = null;
    private edgeHoldTime = { top: 0, bottom: 0, left: 0, right: 0 };
    private lastEdgeSampleTime = 0;
    private lastCoordinatedFireTime = 0;
    private behaviorResetTimer: Phaser.Time.TimerEvent | null = null;
    private enemyBullets!: Phaser.Physics.Arcade.Group;
    private isPaused = false;
    private graduationBossActive = false; // Track if graduation boss is active
    private pendingLayer = 1; // Layer waiting to be unlocked after boss defeat
    private powerUps!: Phaser.Physics.Arcade.Group;
    private miniMes!: Phaser.Physics.Arcade.Group;
    private speedMultiplier = 1;
    private fireRateMultiplier = 1;
    private layerFireRateMultiplier = 1; // Increases slightly with each layer
    private scoreMultiplier = 1;
    private powerUpTimers: Map<string, Phaser.Time.TimerEvent> = new Map();
    private autoShootEnabled = false;
    private firepowerLevel = 0; // 0 = normal, 1+ = increased firepower (multiple bullets)
    private isInvisible = false; // Invisibility power-up state
    private isStunned = false; // Stunned state (cannot move or shoot)
    private stunEndTime = 0; // When stun effect ends
    private shockwaves!: Phaser.Physics.Arcade.Group; // Group for shockwave effects
    private totalFirepowerUpgrades = 0; // Track total number of firepower upgrades collected
    private enemyBulletHits = 0; // Track number of hits from enemy bullets
    private baseFireRateMultiplier = 1; // Base fire rate multiplier from firepower upgrades (separate from other multipliers)
    private spaceKey!: Phaser.Input.Keyboard.Key;
    // Mobile touch controls
    private joystickBase?: Phaser.GameObjects.Arc;
    private joystickThumb?: Phaser.GameObjects.Arc;
    private joystickPointerId: number | null = null;
    private joystickVector = new Phaser.Math.Vector2(0, 0);
    private joystickTargetVector = new Phaser.Math.Vector2(0, 0);
    private joystickBaseX = 0;
    private joystickBaseY = 0;
    private joystickBaseRadius = 0;
    private joystickThumbRadius = 0;
    private fireButton?: Phaser.GameObjects.Arc;
    private fireButtonText?: Phaser.GameObjects.Text;
    private firePointerId: number | null = null;
    private isFiringButtonDown = false;
    private readonly joystickSensitivityKey =
        "neon-sentinel-joystick-sensitivity";

    constructor() {
        super({ key: "GameScene" });
    }

    create() {
        this.applyGameplaySettings();
        // Draw background grid
        this.drawBackgroundGrid();
        this.createSensoryOverlays();
        
        // White Sentinel introduction sequence
        this.time.delayedCall(500, () => {
            this.introduceWhiteSentinel();
        });
        
        // Trigger dialogue on game start
        this.time.delayedCall(1000, () => {
            this.triggerDialogue('game_start');
        });
        
        // Trigger layer start dialogue
        this.time.delayedCall(1500, () => {
            this.triggerDialogue('layer_start');
        });
        
        // Update story state
        updateStoryState(this.prestigeLevel, this.currentLayer);
        
        // Apply avatar stats
        this.applyAvatarStats();
        
        // Initialize rank display
        const initialRankName = getRankName(this.prestigeLevel, this.currentLayer);
        this.registry.set("currentRank", initialRankName);
        
        // Initialize coin balance in registry
        this.registry.set("coinBalance", getAvailableCoins());
        
        // Initialize health bars in registry
        this.registry.set("healthBars", this.healthBars);
        
        // Initialize mini-me active count
        this.registry.set("activeMiniMes", 0);
        
        // Check and grant Prime Sentinel bonus if eligible
        if (checkAndGrantPrimeSentinelBonus(this.prestigeLevel)) {
            this.time.delayedCall(2000, () => {
                this.showAnnouncement(
                    "PRIME SENTINEL BONUS",
                    "Prime Sentinel has sent you 3 coins!",
                    0x00ffff
                );
            });
        }

        // Create player at dynamic position based on screen size
        const gameWidth = this.scale.width;
        const gameHeight = this.scale.height;
        const startX = gameWidth * 0.1; // 10% from left
        const startY = gameHeight * 0.9; // 90% from top (near bottom)
        const heroTexture = this.getSelectedHeroTextureKey();
        this.player = this.physics.add.sprite(startX, startY, heroTexture);
        this.player.setCollideWorldBounds(true);
        this.player.setScale(0.5 * MOBILE_SCALE);
        this.player.setDepth(100); // Ensure player is above all backgrounds
        this.player.setAlpha(1); // Ensure player is fully opaque
        this.originalPlayerTexture = heroTexture; // Store original texture
        this.applySelectedAppearance();
        
        // Create god mode glow effect (hidden initially)
        this.godModeGlow = this.add.graphics();
        this.godModeGlow.setDepth(this.player.depth - 1);
        this.godModeGlow.setVisible(false);

        // Create groups
        this.bullets = this.physics.add.group({
            defaultKey: "greenBullet1",
            maxSize: 100, // Increased to support multiple bullets per shot
        });

        this.enemyBullets = this.physics.add.group({
            defaultKey: "blueBullet",
            maxSize: 30,
        });

        this.enemies = this.physics.add.group();

        this.explosions = this.add.group();

        this.powerUps = this.physics.add.group();
        this.miniMes = this.physics.add.group({
            defaultKey: 'power_up', // Use power-up sprite as placeholder
            maxSize: MINI_ME_CONFIG.maxActive,
        });

        // Shockwaves group (for blue zigzag lines from bosses)
        this.shockwaves = this.physics.add.group();

        // Input setup
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.wasd = this.input.keyboard!.addKeys("W,S,A,D") as Record<
            string,
            Phaser.Input.Keyboard.Key
        >;

        this.spaceKey = this.input.keyboard!.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE
        );
        this.overclockKey = this.input.keyboard!.addKey(
            Phaser.Input.Keyboard.KeyCodes[OVERCLOCK_CONFIG.activationKey]
        );
        
        // Hide tooltips when player starts playing
        let tooltipsHidden = false;
        const hideTooltips = () => {
            if (!tooltipsHidden) {
                const uiScene = this.scene.get('UIScene');
                if (uiScene) {
                    uiScene.events.emit('hide-tooltips');
                    tooltipsHidden = true;
                }
            }
        };
        this.spaceKey.on("down", hideTooltips);
        this.cursors.left?.on("down", hideTooltips);
        this.cursors.right?.on("down", hideTooltips);
        this.cursors.up?.on("down", hideTooltips);
        this.cursors.down?.on("down", hideTooltips);
        this.wasd.A?.on("down", hideTooltips);
        this.wasd.D?.on("down", hideTooltips);
        this.wasd.W?.on("down", hideTooltips);
        this.wasd.S?.on("down", hideTooltips);
        
        this.overclockKey.on("down", () => {
            this.tryActivateOverclock();
        });

        // Shock bomb key (B)
        this.shockBombKey = this.input.keyboard!.addKey(
            Phaser.Input.Keyboard.KeyCodes[SHOCK_BOMB_CONFIG.activationKey]
        );
        this.shockBombKey.on("down", () => {
            this.tryActivateShockBomb();
        });

        // God mode key (Q)
        this.godModeKey = this.input.keyboard!.addKey(
            Phaser.Input.Keyboard.KeyCodes[GOD_MODE_CONFIG.activationKey]
        );
        this.godModeKey.on("down", () => {
            this.tryActivateGodMode();
        });

        // Mobile touch controls: joystick + fire button
        if (MOBILE_SCALE < 1.0) {
            this.createMobileControls();
        } else {
            // Desktop: mouse click for shooting
            this.input.on("pointerdown", () => {
                if (!this.isPaused && !this.gameOver) {
                    this.shoot();
                }
            });
        }

        // Collisions
        this.physics.add.overlap(
            this.bullets,
            this.enemies,
            this
                .handleBulletEnemyCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
            undefined,
            this
        );

        this.physics.add.overlap(
            this.player,
            this.enemies,
            this
                .handlePlayerEnemyCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
            undefined,
            this
        );

        // Collision between player and enemy bullets
        this.physics.add.overlap(
            this.player,
            this.enemyBullets,
            this
                .handlePlayerEnemyBulletCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
            undefined,
            this
        );

        // Collision between player and power-ups
        this.physics.add.overlap(
            this.player,
            this.powerUps,
            this
                .handlePlayerPowerUpCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
            undefined,
            this
        );
        
        // Collision between enemies and mini-mes
        this.physics.add.overlap(
            this.enemies,
            this.miniMes,
            this.handleEnemyMiniMeCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
            undefined,
            this
        );

        // Collision between player and shockwaves
        this.physics.add.overlap(
            this.player,
            this.shockwaves,
            this
                .handlePlayerShockwaveCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
            undefined,
            this
        );

        // Spawn timer - will be created after initial delay
        this.time.delayedCall(this.nextSpawnTime, () => {
            this.spawnEnemy();
            this.updateSpawnTimer();
        });

        // Register scene with registry for UI communication
        this.registry.set("score", this.score);
        this.registry.set("gameOver", false);
        this.registry.set("comboMultiplier", this.comboMultiplier);
        this.registry.set("currentLayer", this.currentLayer);
        this.registry.set("layerName", LAYER_CONFIG[1].name);
        this.registry.set("isPaused", false);
        this.registry.set("prestigeChampion", false);
        this.registry.set("prestigeLevel", this.prestigeLevel);
        this.registry.set("currentPrestige", this.prestigeLevel);
        this.registry.set("previousPrestige", -1);
        this.registry.set("prestigeCompleted", new Array(9).fill(false));
        this.registry.set("isPrimeSentinel", false);
        
        // Initialize rank (already set in create method)
        
        // Initialize coin balance
        this.registry.set("coinBalance", getAvailableCoins());
        
        this.registry.set(
            "prestigeScoreMultiplier",
            this.prestigeScoreMultiplier
        );
        this.registry.set(
            "prestigeDifficultyMultiplier",
            this.prestigeDifficultyMultiplier
        );
        this.registry.set("overclockActive", false);
        this.registry.set("overclockProgress", 0);
        this.registry.set("overclockCooldown", 0);
        this.registry.set(
            "overclockCharges",
            OVERCLOCK_CONFIG.maxActivationsPerRun - this.overclockActivations
        );
        // Initialize shock bomb and god mode
        this.shockBombProgress = 0;
        this.shockBombReady = false;
        this.shockBombCooldownUntil = 0;
        this.registry.set("shockBombProgress", 0);
        this.registry.set("shockBombReady", false);
        this.godModeProgress = 0;
        this.godModeReady = false;
        this.godModeActive = false;
        this.godModeCooldownUntil = 0;
        this.registry.set("godModeProgress", 0);
        this.registry.set("godModeReady", false);
        this.registry.set("godModeActive", false);
        this.registry.set("challengeActive", false);
        this.registry.set("challengeTitle", "");
        this.registry.set("challengeDescription", "");
        this.registry.set("challengeProgress", 0);
        this.registry.set("runStats", {
            survivalTimeMs: 0,
            enemiesDefeated: 0,
            shotsFired: 0,
            shotsHit: 0,
            accuracy: 0,
            bulletsDodged: 0,
            powerUpsCollected: 0,
            livesUsed: 0,
            deaths: 0,
            bestCombo: 1,
        });
        this.registry.set("uiGlitchIntensity", 0);
        this.registry.set("reviveCount", 0);
        this.registry.set("runStats", {
            survivalTimeMs: 0,
            enemiesDefeated: 0,
            shotsFired: 0,
            shotsHit: 0,
            accuracy: 0,
            bulletsDodged: 0,
            powerUpsCollected: 0,
            livesUsed: 0,
            deaths: 0,
            bestCombo: 1,
        });
        this.lastRunMetrics = null;
        this.registry.set("runMetrics", null);
        this.lastRunMetrics = null;
        this.registry.set("runMetrics", null);
        this.runStartTime = this.time.now;
        this.totalEnemiesDefeated = 0;
        this.tookDamageThisRun = false;
        this.peakComboMultiplier = this.comboMultiplier;
        this.timeToReachLayer6 = null;
        this.challengeDamageTaken = false;
        this.runLifeOrbs = 0;
        this.runBossesDefeated = 0;
        this.tookDamageBeforeLayer3 = false;
        this.shotsFiredThisRun = 0;
        this.shotsHitThisRun = 0;
        this.hitsTakenThisRun = 0;
        this.enemyUidCounter = 0;
        this.powerUpsCollected = 0;
        this.totalBulletsDodged = 0;
        this.totalHealthBarsLost = 0;
        this.lastRunStatsUpdate = this.runStartTime;
        this.reviveCount = 0;
        this.reviveCount = 0;
        this.enemyUidCounter = 0;
        this.sessionScoreMultiplier = 1;
        this.sessionStreakScoreMultiplier = 1;
        this.sessionComboStartBoost = 1;
        this.sessionBoostEndTime = 0;
        this.sessionLastTick = this.runStartTime;
        this.nextChallengeTime =
            this.runStartTime + MID_RUN_CHALLENGES.triggerIntervals.firstChallenge;
        this.lastChallengeEndTime = this.runStartTime;
        this.applySessionRewards(this.runStartTime);
        this.applySelectedKernel();
        this.distortionCooldown = 0;
        // Initialize enemy count tracking for boss spawn
        this.enemiesKilledThisLayer = 0;
        // Require significantly more enemies before boss spawn: 50 base + 50 per level
        this.enemiesRequiredBeforeBoss = 50 + (50 * this.currentLayer);
        this.comboShakeCooldown = 0;
        this.lastMusicTempoUpdate = 0;
        this.createSensoryOverlays();
        this.updateSensoryEscalation(this.runStartTime);
        this.initRotatingModifier(this.runStartTime);
        this.resetAdaptiveLearning();
        this.startBehaviorResetTimer();
        if (this.registry.get("joystickSensitivity") === undefined) {
            const stored = Number(
                localStorage.getItem(this.joystickSensitivityKey)
            );
            const sensitivity = Number.isFinite(stored)
                ? Phaser.Math.Clamp(stored, 0.5, 2)
                : 1;
            this.registry.set("joystickSensitivity", sensitivity);
        }

        // Show instruction modal on game start
        this.showInstructionModal();

        // Start prestige visual effects (idle for prestige 0)
        this.updatePrestigeEffects();
    }

    private drawBackgroundGrid() {
        const width = this.scale.width;
        const height = this.scale.height;
        const gridSize = 40;

        // Get grid color based on current layer
        const layerConfig =
            LAYER_CONFIG[this.currentLayer as keyof typeof LAYER_CONFIG];
        const baseGridColor = layerConfig?.gridColor || 0x00ff00;
        const gridColor = this.getPrestigeGridColor(
            this.getGridColorForLayer(this.currentLayer, baseGridColor)
        );

        // Destroy old grid if it exists
        if (this.backgroundGrid) {
            this.backgroundGrid.destroy();
        }

        this.backgroundGrid = this.add.graphics();
        this.backgroundGrid.lineStyle(1, gridColor, 0.3 * this.settingsGridIntensity);

        // Vertical lines
        for (let x = 0; x <= width; x += gridSize) {
            this.backgroundGrid.lineBetween(x, 0, x, height);
        }

        // Horizontal lines
        for (let y = 0; y <= height; y += gridSize) {
            this.backgroundGrid.lineBetween(0, y, width, y);
        }

        this.backgroundGrid.setAlpha(this.gridOpacityMultiplier);
        
        // Update layer background image
        this.updateLayerBackground();

        // Draw faint progress bar at the bottom
        this.drawProgressBar();
    }
    
    private updateLayerBackground() {
        const width = this.scale.width;
        const height = this.scale.height;
        
        // Map layer number to background image key
        const layerImageMap: Record<number, string> = {
            1: '', // Boot Sector - no image, use default grid
            2: 'layerFirewall',
            3: 'layerSecurityCore',
            4: 'layerCorruptedAI',
            5: 'layerKernelBreach',
            6: 'layerSystemCollapse',
        };
        
        const imageKey = layerImageMap[this.currentLayer];
        
        // If no image for this layer, hide the background image and overlay
        if (!imageKey) {
            if (this.layerBackgroundImage) {
                this.layerBackgroundImage.setVisible(false);
            }
            if (this.darkOverlay) {
                this.darkOverlay.setVisible(false);
            }
            // Ensure player is always fully opaque
            if (this.player && this.player.active) {
                this.player.setAlpha(1);
                this.player.setDepth(100);
            }
            return;
        }
        
        // Create or update the background image
        if (!this.layerBackgroundImage) {
            this.layerBackgroundImage = this.add.image(width / 2, height / 2, imageKey);
            this.layerBackgroundImage.setDepth(-1000); // Behind everything
            this.layerBackgroundImage.setAlpha(0.3); // Reduced opacity for background image
            this.layerBackgroundImage.setDisplaySize(width, height);
            this.layerBackgroundImage.setBlendMode(Phaser.BlendModes.NORMAL); // Ensure normal blend mode
            this.layerBackgroundImage.setScrollFactor(0); // Fixed position
            
            // Add dark overlay on top of background image to make it darker
            this.darkOverlay = this.add.graphics();
            this.darkOverlay.fillStyle(0x000000, 0.7); // 70% black overlay for darker effect
            this.darkOverlay.fillRect(0, 0, width, height);
            this.darkOverlay.setDepth(-999); // Just above background image, below grid
            this.darkOverlay.setScrollFactor(0); // Fixed position
            this.darkOverlay.setBlendMode(Phaser.BlendModes.NORMAL); // Ensure normal blend mode
        } else {
            // Update existing image
            this.layerBackgroundImage.setTexture(imageKey);
            this.layerBackgroundImage.setVisible(true);
            this.layerBackgroundImage.setDisplaySize(width, height);
            
            // Update dark overlay size if it exists
            if (this.darkOverlay) {
                this.darkOverlay.clear();
                this.darkOverlay.fillStyle(0x000000, 0.7); // 70% black overlay for darker effect
                this.darkOverlay.fillRect(0, 0, width, height);
            }
        }
        
        // Ensure player is always fully opaque and at correct depth
        if (this.player && this.player.active) {
            this.player.setAlpha(1);
            this.player.setDepth(100);
        }
    }
    
    private showPrestigeLayerBriefly() {
        const width = this.scale.width;
        const height = this.scale.height;
        
        // Create prestige layer image overlay
        const prestigeImage = this.add.image(width / 2, height / 2, 'layerPrestige');
        prestigeImage.setDepth(-999); // Just above regular background
        prestigeImage.setAlpha(0);
        prestigeImage.setDisplaySize(width, height);
        
        // Fade in
        this.tweens.add({
            targets: prestigeImage,
            alpha: 0.6,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                // Hold for 2 seconds
                this.time.delayedCall(2000, () => {
                    // Fade out
                    this.tweens.add({
                        targets: prestigeImage,
                        alpha: 0,
                        duration: 500,
                        ease: 'Power2',
                        onComplete: () => {
                            prestigeImage.destroy();
                        }
                    });
                });
            }
        });
    }

    private drawProgressBar() {
        const width = this.scale.width;
        const height = this.scale.height;
        const progressBarHeight = 4;
        const progressBarY = height - 20;
        const progressBarWidth = width * 0.8; // 80% of screen width
        const progressBarX = width * 0.1; // 10% from left

        // Calculate progress based on score thresholds (not just current layer)
        const maxLayer = MAX_LAYER;
        
        // Determine what layer the player has reached based on score
        let reachedLayer = 1;
        for (let layer = MAX_LAYER; layer >= 1; layer--) {
            if (
                this.score >=
                LAYER_CONFIG[layer as keyof typeof LAYER_CONFIG].scoreThreshold
            ) {
                reachedLayer = layer;
                break;
            }
        }
        
        // Calculate progress within the reached layer
        const currentLayerConfig =
            LAYER_CONFIG[reachedLayer as keyof typeof LAYER_CONFIG];
        const nextLayerConfig =
            reachedLayer < maxLayer
                ? LAYER_CONFIG[
                      (reachedLayer + 1) as keyof typeof LAYER_CONFIG
                  ]
                : null;

        let progress = 0;
        if (nextLayerConfig) {
            // Progress within current reached layer
            const currentThreshold = currentLayerConfig.scoreThreshold || 0;
            const nextThreshold = nextLayerConfig.scoreThreshold || 0;
            const progressInLayer =
                (this.score - currentThreshold) /
                (nextThreshold - currentThreshold);
            progress =
                (reachedLayer - 1) / maxLayer + progressInLayer / maxLayer;
        } else {
            // Max layer reached
            progress = 1.0;
        }

        progress = Math.max(0, Math.min(1, progress)); // Clamp between 0 and 1

        // Background bar (red - contrasting with green fill)
        this.backgroundGrid.fillStyle(0xff0000, 0.3);
        this.backgroundGrid.fillRect(
            progressBarX,
            progressBarY,
            progressBarWidth,
            progressBarHeight
        );

        // Progress fill (green - contrasting with red background)
        this.backgroundGrid.fillStyle(0x00ff00, 0.8);
        this.backgroundGrid.fillRect(
            progressBarX,
            progressBarY,
            progressBarWidth * progress,
            progressBarHeight
        );

        // Layer markers (faint vertical lines - green)
        this.backgroundGrid.lineStyle(1, 0x00ff00, 0.4);
        for (let layer = 1; layer <= maxLayer; layer++) {
            const markerX =
                progressBarX +
                (progressBarWidth * (layer - 1)) / (maxLayer - 1);
            this.backgroundGrid.lineBetween(
                markerX,
                progressBarY - 2,
                markerX,
                progressBarY + progressBarHeight + 2
            );
        }
    }

    private createSensoryOverlays() {
        const width = this.scale.width;
        const height = this.scale.height;

        if (this.scanlineOverlay) {
            this.scanlineOverlay.destroy();
        }
        this.scanlineOverlay = this.add.graphics();
        this.scanlineOverlay.setDepth(1000);
        this.scanlineOverlay.setScrollFactor(0);
        this.scanlineOverlay.fillStyle(0x00ff00, 0.12);
        for (let y = 0; y < height; y += 3) {
            this.scanlineOverlay.fillRect(0, y, width, 1);
        }
        this.scanlineOverlay.setAlpha(0);

    }

    private getLayerEffectIntensity(
        layer: number,
        values: { layer1: number; layer3: number; layer5: number; layer6: number }
    ) {
        if (layer >= 6) return values.layer6;
        if (layer >= 5) return values.layer5;
        if (layer >= 3) return values.layer3;
        return values.layer1;
    }

    private updateSensoryEscalation(time: number) {
        const elapsedMinutes = Math.max(0, (time - this.runStartTime) / 60000);
        const tempo = Phaser.Math.Clamp(
            SENSORY_ESCALATION.musicTempo.baseBeatsPerMinute +
                elapsedMinutes * SENSORY_ESCALATION.musicTempo.increasePerMinute,
            SENSORY_ESCALATION.musicTempo.baseBeatsPerMinute,
            SENSORY_ESCALATION.musicTempo.maxBeatsPerMinute
        );

        if (time - this.lastMusicTempoUpdate > 1000) {
            this.lastMusicTempoUpdate = time;
            this.registry.set("musicBpm", Math.round(tempo));
        }

        const scanlines = this.getLayerEffectIntensity(
            this.currentLayer,
            SENSORY_ESCALATION.screenEffects.scanlineIntensity
        );
        if (this.scanlineIntensity !== scanlines) {
            this.scanlineIntensity = scanlines;
            if (this.scanlineOverlay) {
                this.scanlineOverlay.setAlpha(scanlines);
            }
        }

        const distortion = this.getLayerEffectIntensity(
            this.currentLayer,
            SENSORY_ESCALATION.screenEffects.screenDistortion
        );
        this.distortionIntensity = this.settingsReduceMotion ? 0 : distortion;

        const baseGridOpacity = SENSORY_ESCALATION.screenEffects.baseGridOpacity;
        if (this.gridOpacityMultiplier !== baseGridOpacity) {
            this.gridOpacityMultiplier = baseGridOpacity;
            // Corruption system removed
        }

        let glitchIntensity = 0;
        if (this.currentLayer >= 4) {
            if (this.currentLayer >= 6) {
                glitchIntensity = SENSORY_ESCALATION.uiGlitching.glitchIntensity.high;
            } else if (this.currentLayer >= 5) {
                glitchIntensity = SENSORY_ESCALATION.uiGlitching.glitchIntensity.medium;
            } else {
                glitchIntensity = SENSORY_ESCALATION.uiGlitching.glitchIntensity.low;
            }
        }
        if (this.uiGlitchIntensity !== glitchIntensity) {
            this.uiGlitchIntensity = glitchIntensity;
            this.registry.set("uiGlitchIntensity", glitchIntensity);
        }

        if (this.distortionIntensity > 0 && time > this.distortionCooldown) {
            if (Math.random() < 0.3) {
            this.applyCameraShake(
                    120,
                    this.distortionIntensity * 0.01
                );
            }
            this.distortionCooldown = time + Phaser.Math.Between(500, 1200);
        }

        if (this.comboMultiplier >= 3 && time > this.comboShakeCooldown) {
            this.applyCameraShake(
                80,
                Math.min(0.02, this.comboMultiplier * 0.0015)
            );
            this.comboShakeCooldown = time + 800;
        }
    }

    private updateRunStats(time: number) {
        if (time - this.lastRunStatsUpdate < 500) {
            return;
        }
        this.lastRunStatsUpdate = time;
        const survivalTimeMs = Math.max(0, time - this.runStartTime);
        const accuracy =
            this.shotsFiredThisRun > 0
                ? this.shotsHitThisRun / this.shotsFiredThisRun
                : 0;
        this.registry.set("runStats", {
            survivalTimeMs,
            enemiesDefeated: this.totalEnemiesDefeated,
            shotsFired: this.shotsFiredThisRun,
            shotsHit: this.shotsHitThisRun,
            accuracy,
            bulletsDodged: this.totalBulletsDodged,
            powerUpsCollected: this.powerUpsCollected,
            livesUsed: this.totalHealthBarsLost,
            deaths: this.hitsTakenThisRun,
            bestCombo: this.peakComboMultiplier,
        });
    }

    public tryReviveWithCoin() {
        if (!this.gameOver) {
            return false;
        }
        const cost = getReviveCost(this.reviveCount);
        if (!spendCoins(cost, 'revive')) {
            return false;
        }
        this.reviveCount += 1;
        this.gameOver = false;
        this.registry.set("gameOver", false);
        
        // Clean up mini-mes on restart
        this.cleanupMiniMes();
        this.registry.set("coinBalance", getAvailableCoins());
        this.registry.set("reviveCount", this.reviveCount);
        this.isPaused = false;
        this.player.setVelocity(0, 0);
        // Restore all 5 health bars on revival
        this.healthBars = PLAYER_CONFIG.initialHealthBars;
        this.registry.set("healthBars", this.healthBars);
        this.lastHitTime = this.time.now;

        this.enemyBullets.clear(true, true);
        this.bullets.clear(true, true);

        this.enemies.children.entries.forEach((enemy) => {
            const e = enemy as Phaser.Physics.Arcade.Sprite;
            const velocity = e.getData("preReviveVelocity") as
                | { x: number; y: number }
                | undefined;
            if (velocity) {
                e.setVelocity(velocity.x, velocity.y);
            }
        });

        this.physics.resume();
        this.updateSpawnTimer();
        return true;
    }

    private applyGameplaySettings() {
        const settings = this.registry.get("gameplaySettings") as
            | {
                  difficulty?: "normal" | "easy" | "hard";
                  accessibility?: {
                      colorBlindMode?: boolean;
                      highContrast?: boolean;
                      dyslexiaFont?: boolean;
                      reduceMotion?: boolean;
                      reduceFlash?: boolean;
                  };
                  visual?: {
                      uiScale?: number;
                      uiOpacity?: number;
                      screenShakeIntensity?: number;
                      gridIntensity?: number;
                  };
              }
            | undefined;
        const difficulty = settings?.difficulty ?? "normal";
        if (difficulty === "easy") {
            this.settingsEnemySpeedMultiplier =
                CUSTOMIZABLE_SETTINGS.difficulty.easyMode.enemySpeedReduction;
            this.settingsSpawnRateMultiplier =
                CUSTOMIZABLE_SETTINGS.difficulty.easyMode.spawnRateReduction;
        } else if (difficulty === "hard") {
            this.settingsEnemySpeedMultiplier =
                CUSTOMIZABLE_SETTINGS.difficulty.hardMode.enemySpeedIncrease;
            this.settingsSpawnRateMultiplier =
                CUSTOMIZABLE_SETTINGS.difficulty.hardMode.spawnRateIncrease;
        } else {
            this.settingsEnemySpeedMultiplier = 1;
            this.settingsSpawnRateMultiplier = 1;
        }

        this.settingsColorBlindMode =
            settings?.accessibility?.colorBlindMode ?? false;
        this.settingsReduceMotion =
            settings?.accessibility?.reduceMotion ?? false;
        this.settingsReduceFlash =
            settings?.accessibility?.reduceFlash ?? false;

        this.settingsGridIntensity =
            settings?.visual?.gridIntensity ?? 1;
        this.settingsScreenShakeMultiplier =
            settings?.visual?.screenShakeIntensity ?? 1;

        this.registry.set(
            "uiScale",
            settings?.visual?.uiScale ?? 1
        );
        this.registry.set(
            "uiOpacity",
            settings?.visual?.uiOpacity ?? 1
        );
        this.registry.set(
            "uiHighContrast",
            settings?.accessibility?.highContrast ?? false
        );
        this.registry.set(
            "uiDyslexiaFont",
            settings?.accessibility?.dyslexiaFont ?? false
        );
    }

    private getGridColorForLayer(layer: number, defaultColor: number) {
        if (!this.settingsColorBlindMode) {
            return defaultColor;
        }
        const palette: Record<number, number> = {
            1: 0x00b7ff,
            2: 0xffb703,
            3: 0x9b5de5,
            4: 0x00f5d4,
            5: 0xff006e,
            6: 0xffffff,
        };
        return palette[layer] ?? defaultColor;
    }

    private applyCameraShake(duration: number, intensity: number) {
        if (this.settingsReduceMotion || this.settingsScreenShakeMultiplier <= 0) {
            return;
        }
        this.cameras.main.shake(
            duration,
            intensity * this.settingsScreenShakeMultiplier
        );
    }

    private applyCameraFlash(
        duration: number,
        red: number,
        green: number,
        blue: number
    ) {
        if (this.settingsReduceFlash) {
            return;
        }
        this.cameras.main.flash(duration, red, green, blue, false);
    }

    private createFloatingText(
        x: number,
        y: number,
        text: string,
        options?: {
            color?: string;
            fontSize?: number;
            duration?: number;
            rise?: number;
            fixed?: boolean;
        }
    ) {
        const fontSize = options?.fontSize ?? 18 * MOBILE_SCALE;
        const dyslexiaFont = !!this.registry.get("uiDyslexiaFont");
        const label = this.add.text(x, y, text, {
            fontFamily: dyslexiaFont ? "Arial" : UI_CONFIG.scoreFont,
            fontSize,
            color: options?.color ?? UI_CONFIG.neonGreen,
            stroke: "#000000",
            strokeThickness: 3,
        });
        label.setOrigin(0.5, 0.5);
        label.setDepth(900);
        if (options?.fixed) {
            label.setScrollFactor(0);
        }
        this.tweens.add({
            targets: label,
            y: y - (options?.rise ?? 30),
            alpha: 0,
            duration: options?.duration ?? 700,
            ease: "Sine.easeOut",
            onComplete: () => label.destroy(),
        });
    }

    update(time: number) {
        // Pause/resume is handled by UIScene ESC key handler
        // GameScene update continues to run even when paused so UIScene can handle input

        if (this.gameOver || this.isPaused) return;
        
        // Ensure player is always fully opaque and at correct depth (safeguard against background effects)
        // This is especially important when background images are active (layer 2+)
        if (this.player && this.player.active && this.currentLayer >= 2) {
            if (this.player.alpha !== 1) {
                this.player.setAlpha(1);
            }
            if (this.player.depth !== 100) {
                this.player.setDepth(100);
            }
        }

        this.updateDifficultyPhase(time);
        this.samplePlayerMovement(time);
        this.updateAdaptiveLearning(time);
        this.updateSessionRewards(time);
        this.updateRotatingModifier(time);
        this.updateSensoryEscalation(time);
        this.updateRunStats(time);
        this.updateMeters(time);
        if (this.godModeActive) {
            this.updateGodModeGlow();
        }
        if (this.modifierPauseActive) {
            return;
        }

        // Player movement
        this.handlePlayerMovement();
        
        // Update mini-mes
        if (!this.gameOver) {
            this.updateMiniMes(time);
        }

        // Shooting - manual or auto-shoot power-up
        const currentFireRate =
            PLAYER_CONFIG.fireRate *
            this.avatarFireRateMultiplier *
            this.fireRateMultiplier *
            this.overclockFireRateMultiplier *
            this.challengeFireRateMultiplier *
            this.kernelFireRateMultiplier *
            this.heroGradeFireRateMultiplier *
            this.layerFireRateMultiplier;

        // Check stun status
        if (this.isStunned && time >= this.stunEndTime) {
            this.isStunned = false;
            this.createFloatingText(
                this.player.x,
                this.player.y - 30,
                "STUN ENDED",
                { color: "#00ff00", fontSize: 18 }
            );
        }

        if (this.autoShootEnabled && !this.isStunned) {
            // Auto-shoot when power-up is active (but not when stunned)
            if (time > this.lastFired) {
                this.shoot();
                this.lastFired = time + currentFireRate;
            }
        } else {
            // Mobile: auto-shoot when touch is held
            // Desktop: manual shooting with spacebar or mouse
            const shouldShoot =
                MOBILE_SCALE < 1.0
                    ? this.isFiringButtonDown // Mobile: fire button held
                    : this.spaceKey.isDown || this.input.activePointer.isDown; // Desktop: manual

            if (shouldShoot && time > this.lastFired) {
                this.shoot();
                this.lastFired = time + currentFireRate;
            }
        }

        // Remove bullets that are off screen (right edge)
        // Also cleanup trail timers for bullets
        const gameWidth = this.scale.width;
        const gameHeight = this.scale.height;
        this.bullets.children.entries.forEach((bullet) => {
            const b = bullet as Phaser.Physics.Arcade.Sprite;
            if (b.x > gameWidth + 50 || b.x < -50) {
                // Cleanup trail timer if exists
                const trailTimer = b.getData('trailTimer') as Phaser.Time.TimerEvent | undefined;
                if (trailTimer) {
                    trailTimer.remove();
                }
                b.destroy();
            }
        });

        // Remove enemy bullets that are off screen
        this.enemyBullets.children.entries.forEach((bullet) => {
            const b = bullet as Phaser.Physics.Arcade.Sprite;
            if (
                b.x < -50 ||
                b.x > gameWidth + 50 ||
                b.y < -50 ||
                b.y > gameHeight + 50
            ) {
                this.totalBulletsDodged += 1;
                b.destroy();
                if (
                    this.activeChallenge?.id === "dodge_25_bullets" &&
                    !this.challengeDamageTaken
                ) {
                    this.challengeBulletsDodged += 1;
                }
            }
        });

        // Remove power-ups that are off screen
        this.powerUps.children.entries.forEach((powerUp) => {
            const p = powerUp as Phaser.Physics.Arcade.Sprite;
            if (
                p.x < -50 ||
                p.x > gameWidth + 50 ||
                p.y < -50 ||
                p.y > gameHeight + 50
            ) {
                p.destroy();
            }
        });

        // Handle blue enemy shooting and wall bouncing
        this.enemies.children.entries.forEach((enemyObj) => {
            const enemy = enemyObj as Phaser.Physics.Arcade.Sprite;
            // Check if enemy is stunned
            const isStunned = enemy.getData('stunned') as boolean || false;
            const stunEndTime = enemy.getData('stunEndTime') as number || 0;
            if (isStunned && time < stunEndTime) {
                // Enemy is stunned - don't update movement or shooting
                enemy.setVelocity(0, 0);
                return;
            }
            const isGraduationBoss = enemy.getData("isGraduationBoss") || false;
            const behaviors =
                (enemy.getData("behaviors") as string[] | undefined) || [];

            // Update health bar position to follow enemy
            if (enemy.active) {
                this.updateEnemyHealthBar(enemy);
                const aura = enemy.getData("aura") as
                    | Phaser.GameObjects.Graphics
                    | undefined;
                if (aura) {
                    aura.setPosition(enemy.x, enemy.y);
                }
                
                // Check shield proximity damage for yellowShield enemies
                if (enemy.getData("type") === "yellowShield") {
                    this.checkShieldProximityDamage(enemy, time);
                }
            }

            // Graduation bosses track player movement to maintain line of sight
            if (isGraduationBoss) {
                // Boss tracks player's Y position to maintain line of sight
                const bossSpeed = enemy.getData("speed") || 100;
                const targetY = this.player.y; // Track player's Y position
                const currentY = enemy.y;
                const distanceY = targetY - currentY;
                
                // Move boss vertically to maintain line of sight with player
                // Use smooth movement (not instant snap)
                const moveSpeed = Math.min(Math.abs(distanceY), bossSpeed * 0.5); // Slower vertical tracking
                if (Math.abs(distanceY) > 5) { // Only move if significant distance
                    const directionY = distanceY > 0 ? 1 : -1;
                    enemy.setVelocityY(moveSpeed * directionY);
                } else {
                    enemy.setVelocityY(0);
                }
                
                // Keep boss at fixed X position (right side)
                const targetX = gameWidth * 0.85;
                const currentX = enemy.x;
                const distanceX = targetX - currentX;
                if (Math.abs(distanceX) > 5) {
                    enemy.setVelocityX(distanceX * 0.1); // Smooth return to position
                } else {
                    enemy.setVelocityX(0);
                }
                
                // Keep boss within screen bounds
                if (enemy.y < 50) {
                    enemy.setY(50);
                    enemy.setVelocityY(0);
                }
                if (enemy.y > gameHeight - 50) {
                    enemy.setY(gameHeight - 50);
                    enemy.setVelocityY(0);
                }
                
                // Manage assault/rest phases
                const assaultPhase = enemy.getData("assaultPhase") || "assault";
                const assaultStartTime = enemy.getData("assaultStartTime") || time;
                const assaultDuration = enemy.getData("assaultDuration") || 10000;
                const restDuration = enemy.getData("restDuration") || 5000;
                
                const timeInPhase = time - assaultStartTime;
                
                if (assaultPhase === "assault") {
                    // During assault phase: shoot and spawn pawns
                    if (timeInPhase >= assaultDuration) {
                        // Switch to rest phase
                        enemy.setData("assaultPhase", "rest");
                        enemy.setData("assaultStartTime", time);
                }
            } else {
                    // During rest phase: no shooting, no pawns
                    if (timeInPhase >= restDuration) {
                        // Switch back to assault phase
                        enemy.setData("assaultPhase", "assault");
                        enemy.setData("assaultStartTime", time);
                    }
                }
                
                // Spawn pawn enemies during assault phase
                if (assaultPhase === "assault") {
                    const lastPawnSpawn = enemy.getData("lastPawnSpawn") || 0;
                    const pawnSpawnInterval = enemy.getData("pawnSpawnInterval") || 3000;
                    
                    if (time - lastPawnSpawn >= pawnSpawnInterval) {
                        this.spawnBossPawn(enemy);
                        enemy.setData("lastPawnSpawn", time);
                    }
                }
            } else {
                if (behaviors.includes("predictive_movement")) {
                    const speed = enemy.getData("speed") || 100;
                    const target = this.getTargetPositionForEnemy(
                        behaviors,
                        false
                    );
                    const angle = Phaser.Math.Angle.Between(
                        enemy.x,
                        enemy.y,
                        target.x,
                        target.y
                    );
                    enemy.setVelocity(
                        Math.cos(angle) * speed,
                        Math.sin(angle) * speed
                    );
                }
                // Normal enemies: remove if they go off the right edge
                if (enemy.x > gameWidth + 100) {
                    // Clean up health bar
                    const healthBarBg = enemy.getData("healthBarBg") as
                        | Phaser.GameObjects.Graphics
                        | undefined;
                    const healthBarFill = enemy.getData("healthBarFill") as
                        | Phaser.GameObjects.Graphics
                        | undefined;
                    if (healthBarBg) healthBarBg.destroy();
                    if (healthBarFill) healthBarFill.destroy();
                    this.cleanupEnemyEffects(enemy);
                    enemy.destroy();
                    return;
                }

                // Bounce off left, top, and bottom walls
                if (enemy.x < 0) {
                    enemy.setVelocityX(Math.abs(enemy.body!.velocity.x));
                }
                if (enemy.y < 0) {
                    enemy.setVelocityY(Math.abs(enemy.body!.velocity.y));
                }
                if (enemy.y > gameHeight) {
                    enemy.setVelocityY(-Math.abs(enemy.body!.velocity.y));
                }
            }

            const canShoot = enemy.getData("canShoot");

            if (canShoot && enemy.active) {
                // Graduation bosses only shoot during assault phase
                let canShootNow = true;
                if (isGraduationBoss) {
                    const assaultPhase = enemy.getData("assaultPhase") || "assault";
                    if (assaultPhase !== "assault") {
                        // Skip shooting during rest phase
                        canShootNow = false;
                    }
                }
                
                if (!canShootNow) {
                    // Continue to next enemy if boss is in rest phase
                    return;
                }
                
                const lastShot = enemy.getData("lastShot") || 0;
                const baseShootInterval =
                    enemy.getData("baseShootInterval") ||
                    enemy.getData("shootInterval") ||
                    2000;
                const shootSpeedMultiplier =
                    (enemy.getData("shootSpeedMultiplier") as number) || 1;
                const shootInterval = baseShootInterval / shootSpeedMultiplier;

                if (time - lastShot > shootInterval) {
                    // Graduation bosses shoot more frequently and with multiple bullets during assault
                    if (isGraduationBoss) {
                        // Track player movement and shoot toward current position
                        this.enemyShoot(enemy, 0); // Center bullet toward player
                        // Shoot 2 additional bullets in spread pattern
                        this.time.delayedCall(100, () => {
                            if (enemy.active) this.enemyShoot(enemy, -15); // Left angle
                        });
                        this.time.delayedCall(200, () => {
                            if (enemy.active) this.enemyShoot(enemy, 15); // Right angle
                        });
                    } else {
                        this.enemyShoot(enemy, 0);
                    }
                    enemy.setData("lastShot", time);
                }
            }

            if (
                isGraduationBoss &&
                behaviors.includes("space_denial") &&
                this.currentDifficultyPhase !== "phase1" &&
                this.currentDifficultyPhase !== "phase2"
            ) {
                const lastDenial = enemy.getData("lastSpaceDenial") || 0;
                if (time - lastDenial > 4500) {
                    [-45, -20, 0, 20, 45].forEach((angleOffset) => {
                        this.enemyShoot(enemy, angleOffset);
                    });
                    enemy.setData("lastSpaceDenial", time);
                }
            }

            // Fire shockwaves for graduation bosses and final bosses
            const bossKey = enemy.getData("bossKey") as string | undefined;
            const isFinalBoss = bossKey === "finalBoss";
            if ((isGraduationBoss || isFinalBoss) && enemy.active) {
                const lastShockwave = enemy.getData("lastShockwave") || 0;
                const shockwaveInterval = 8000; // Fire shockwave every 8 seconds
                if (time - lastShockwave >= shockwaveInterval) {
                    this.fireShockwave(enemy);
                    enemy.setData("lastShockwave", time);
                }
            }
        });

        // Clean up shockwaves that go off screen
        this.shockwaves.children.entries.forEach((shockwaveObj) => {
            const shockwave = shockwaveObj as Phaser.Physics.Arcade.Sprite;
            if (!shockwave.active) return;
            
            const gameWidth = this.scale.width;
            const gameHeight = this.scale.height;
            
            // Remove if off screen
            if (shockwave.x < -50 || shockwave.x > gameWidth + 50 ||
                shockwave.y < -50 || shockwave.y > gameHeight + 50) {
                const graphics = shockwave.getData("graphics") as Phaser.GameObjects.Graphics | undefined;
                const updateEvt = shockwave.getData("updateEvent") as Phaser.Time.TimerEvent | undefined;
                if (graphics) graphics.destroy();
                if (updateEvt) updateEvt.remove();
                shockwave.destroy();
            }
        });

        if (
            this.currentDifficultyPhase === "phase3" ||
            this.currentDifficultyPhase === "phase4"
        ) {
            this.handleCoordinatedFire(time);
        }
        this.updateBuffEffects();
        this.updateOverclockProgress(time);
        this.updateChallenges(time);

        // Update combo multiplier (reset if player hasn't been hit in a while)
        const timeSinceLastHit = time - this.lastHitTime;
        if (timeSinceLastHit > 10000 && this.comboMultiplier > 1) {
            // Reduce combo over time if not getting hit
            this.comboMultiplier = Math.max(1, this.comboMultiplier * 0.99);
            this.registry.set("comboMultiplier", this.comboMultiplier);
        }
    }

    private handlePlayerMovement() {
        let velocityX = 0;
        let velocityY = 0;

        // Calculate speed with power-up multiplier (avatar stats applied first)
        const currentSpeed =
            PLAYER_CONFIG.speed *
            this.avatarSpeedMultiplier *
            this.speedMultiplier *
            this.overclockSpeedMultiplier *
            this.kernelSpeedMultiplier *
            this.heroGradeSpeedMultiplier *
            this.modifierSpeedCap;

        // Mobile joystick controls
        if (MOBILE_SCALE < 1.0) {
            const sensitivity = Phaser.Math.Clamp(
                (this.registry.get("joystickSensitivity") as number) || 1,
                0.5,
                2
            );
            // Smooth joystick movement for more fluid control
            this.joystickVector.lerp(this.joystickTargetVector, 0.2);
            const magnitude = this.joystickVector.length();
            if (magnitude > 0.05) {
                velocityX = this.joystickVector.x * currentSpeed * sensitivity;
                velocityY = this.joystickVector.y * currentSpeed * sensitivity;
            }
        } else {
            // Desktop: Arrow keys or WASD
            // Check if player is stunned
            if (!this.isStunned) {
                if (this.cursors.left!.isDown || this.wasd["A"].isDown) {
                    velocityX = -currentSpeed;
                } else if (this.cursors.right!.isDown || this.wasd["D"].isDown) {
                    velocityX = currentSpeed;
                }

                if (this.cursors.up!.isDown || this.wasd["W"].isDown) {
                    velocityY = -currentSpeed;
                } else if (this.cursors.down!.isDown || this.wasd["S"].isDown) {
                    velocityY = currentSpeed;
                }
            }

            // Normalize diagonal movement
            if (velocityX !== 0 && velocityY !== 0) {
                velocityX *= 0.707; // 1/sqrt(2)
                velocityY *= 0.707;
            }
        }

        if (this.modifierInputDelayMs > 0) {
            const now = this.time.now;
            this.modifierInputQueue.push({ time: now, vx: velocityX, vy: velocityY });
            while (this.modifierInputQueue.length > 20) {
                this.modifierInputQueue.shift();
            }
            while (
                this.modifierInputQueue.length > 0 &&
                now - this.modifierInputQueue[0].time >= this.modifierInputDelayMs
            ) {
                const next = this.modifierInputQueue.shift()!;
                this.modifierLastAppliedVelocity = { vx: next.vx, vy: next.vy };
            }
            velocityX = this.modifierLastAppliedVelocity.vx;
            velocityY = this.modifierLastAppliedVelocity.vy;
        } else {
            this.modifierInputQueue = [];
            this.modifierLastAppliedVelocity = { vx: velocityX, vy: velocityY };
        }

        this.player.setVelocity(velocityX, velocityY);
    }

    private createMobileControls() {
        const width = this.scale.width;
        const height = this.scale.height;
        const uiScale = MOBILE_SCALE < 1.0 ? 0.9 : 1.0;

        // Enable multi-touch so joystick + fire can be used together
        this.input.addPointer(2);

        this.joystickBaseRadius = 55 * uiScale;
        this.joystickThumbRadius = 22 * uiScale;
        this.joystickBaseX = 90 * uiScale;
        this.joystickBaseY = height - 90 * uiScale;

        this.joystickBase = this.add.circle(
            this.joystickBaseX,
            this.joystickBaseY,
            this.joystickBaseRadius,
            0x001100,
            0.6
        );
        this.joystickBase.setStrokeStyle(2, 0x00ff00, 0.7);
        this.joystickBase.setScrollFactor(0);
        this.joystickBase.setDepth(1000);
        this.joystickBase.setInteractive(
            new Phaser.Geom.Circle(0, 0, this.joystickBaseRadius),
            Phaser.Geom.Circle.Contains
        );

        this.joystickThumb = this.add.circle(
            this.joystickBaseX,
            this.joystickBaseY,
            this.joystickThumbRadius,
            0x00ff00,
            0.8
        );
        this.joystickThumb.setScrollFactor(0);
        this.joystickThumb.setDepth(1001);
        this.joystickThumb.setInteractive(
            new Phaser.Geom.Circle(0, 0, this.joystickThumbRadius),
            Phaser.Geom.Circle.Contains
        );

        const fireRadius = 45 * uiScale;
        const fireX = width - 90 * uiScale;
        const fireY = height - 90 * uiScale;
        this.fireButton = this.add.circle(fireX, fireY, fireRadius, 0x003300, 0.8);
        this.fireButton.setStrokeStyle(2, 0x00ff00, 0.8);
        this.fireButton.setScrollFactor(0);
        this.fireButton.setDepth(1000);
        this.fireButton.setInteractive(
            new Phaser.Geom.Circle(0, 0, fireRadius),
            Phaser.Geom.Circle.Contains
        );

        this.fireButtonText = this.add.text(fireX, fireY, "FIRE", {
            fontFamily: UI_CONFIG.menuFont,
            fontSize: 16 * uiScale,
            color: UI_CONFIG.neonGreen,
            stroke: "#000000",
            strokeThickness: 3,
        });
        this.fireButtonText.setOrigin(0.5, 0.5);
        this.fireButtonText.setScrollFactor(0);
        this.fireButtonText.setDepth(1001);
        this.fireButtonText.setInteractive({ useHandCursor: true });

        this.joystickBase.on(
            "pointerdown",
            (pointer: Phaser.Input.Pointer) => {
                if (this.isPaused || this.gameOver) return;
                this.joystickPointerId = pointer.id;
                this.updateJoystick(pointer);
            }
        );

        this.joystickThumb.on(
            "pointerdown",
            (pointer: Phaser.Input.Pointer) => {
                if (this.isPaused || this.gameOver) return;
                this.joystickPointerId = pointer.id;
                this.updateJoystick(pointer);
            }
        );

        this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
            if (this.joystickPointerId === pointer.id) {
                this.updateJoystick(pointer);
            }
        });

        this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
            if (this.joystickPointerId === pointer.id) {
                this.resetJoystick();
            }
            if (this.firePointerId === pointer.id) {
                this.isFiringButtonDown = false;
                this.firePointerId = null;
                this.fireButton?.setFillStyle(0x003300, 0.8);
            }
        });

        this.input.on("pointerupoutside", (pointer: Phaser.Input.Pointer) => {
            if (this.joystickPointerId === pointer.id) {
                this.resetJoystick();
            }
            if (this.firePointerId === pointer.id) {
                this.isFiringButtonDown = false;
                this.firePointerId = null;
                this.fireButton?.setFillStyle(0x003300, 0.8);
            }
        });

        const handleFireDown = (pointer: Phaser.Input.Pointer) => {
            if (this.isPaused || this.gameOver) return;
            this.isFiringButtonDown = true;
            this.firePointerId = pointer.id;
            this.fireButton?.setFillStyle(0x00ff00, 0.9);
        };

        this.fireButton.on("pointerdown", handleFireDown);
        this.fireButtonText.on("pointerdown", handleFireDown);
    }

    private updateJoystick(pointer: Phaser.Input.Pointer) {
        if (!this.joystickBase || !this.joystickThumb) return;

        const dx = pointer.x - this.joystickBaseX;
        const dy = pointer.y - this.joystickBaseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = this.joystickBaseRadius - this.joystickThumbRadius;
        const clampedDistance = Math.min(distance, maxDistance);
        const angle = Math.atan2(dy, dx);
        const offsetX = Math.cos(angle) * clampedDistance;
        const offsetY = Math.sin(angle) * clampedDistance;

        this.joystickThumb.setPosition(
            this.joystickBaseX + offsetX,
            this.joystickBaseY + offsetY
        );
        this.joystickTargetVector.set(
            offsetX / maxDistance,
            offsetY / maxDistance
        );
    }

    private resetJoystick() {
        this.joystickPointerId = null;
        this.joystickTargetVector.set(0, 0);
        if (this.joystickThumb) {
            this.joystickThumb.setPosition(
                this.joystickBaseX,
                this.joystickBaseY
            );
        }
    }

    private shoot() {
        if (this.gameOver) return;
        if (this.isStunned) return; // Cannot shoot when stunned
        if (this.activeChallenge?.id === "no_shoot_20s") {
            this.failChallenge();
        }

        const playerX = this.player.x + 30;
        const playerY = this.player.y;

        // God mode: use fire blasts
        if (this.godModeActive) {
            const bullet = this.bullets.get(
                playerX,
                playerY
            ) as Phaser.Physics.Arcade.Sprite;
            if (bullet) {
                bullet.setActive(true);
                bullet.setVisible(true);
                bullet.setScale(1.2 * MOBILE_SCALE); // Larger fire blast
                bullet.setTexture("smallFire"); // Fire blast sprite
                bullet.setVelocityX(PLAYER_CONFIG.bulletSpeed * 1.2); // Slightly faster
                bullet.setVelocityY(0);
                this.shotsFiredThisRun += 1;
            }
            return;
        }

        // Get current bullet tier based on prestige
        const bulletTier = getCurrentBulletTier(this.prestigeLevel);
        const bulletStats = getBulletStats(bulletTier.tier);
        if (!bulletStats) {
            return; // Fallback to default if stats not found
        }

        // Base firepower: single bullet
        if (this.firepowerLevel === 0) {
            const bullet = this.bullets.get(
                playerX,
                playerY
            ) as Phaser.Physics.Arcade.Sprite;
            if (bullet) {
                bullet.setActive(true);
                bullet.setVisible(true);
                
                // Apply bullet tier sprite and scale
                const baseScale = 0.5 * MOBILE_SCALE;
                const tierScale = baseScale * (0.8 + (bulletTier.tier - 1) * 0.1); // Slightly larger per tier
                bullet.setScale(tierScale);
                bullet.setTexture(bulletStats.spriteKey);
                
                // Apply bullet tier speed multiplier
                const bulletSpeed = PLAYER_CONFIG.bulletSpeed * bulletStats.speedMultiplier;
                bullet.setVelocityX(bulletSpeed);
                bullet.setVelocityY(0);
                
                // Store bullet tier data for collision handling
                bullet.setData('bulletTier', bulletTier.tier);
                bullet.setData('damageMultiplier', bulletStats.damageMultiplier);
                bullet.setData('piercing', bulletStats.effects.piercing);
                bullet.setData('pierceCount', 0); // Track how many enemies pierced
                
                // Add visual effects
                this.addBulletVisualEffects(bullet, bulletTier);
                
                this.shotsFiredThisRun += 1;
            }
        } else {
            // Increased firepower: multiple bullets with spread
            // Round firepower level down to integer for bullet count
            const firepowerLevelInt = Math.floor(this.firepowerLevel);
            const bulletCount = 1 + firepowerLevelInt; // 2 bullets at level 1, 3 at level 2, etc.
            const spreadAngle = Math.min(15 * firepowerLevelInt, 30); // Max 30 degree spread

            for (let i = 0; i < bulletCount; i++) {
                const bullet = this.bullets.get(
                    playerX,
                    playerY
                ) as Phaser.Physics.Arcade.Sprite;
                if (bullet) {
                    bullet.setActive(true);
                    bullet.setVisible(true);
                    
                    // Apply bullet tier sprite and scale
                    const baseScale = 0.6 * MOBILE_SCALE;
                    const tierScale = baseScale * (0.9 + (bulletTier.tier - 1) * 0.1); // Slightly larger per tier
                    bullet.setScale(tierScale);
                    bullet.setTexture(bulletStats.spriteKey);

                    // Calculate spread angle
                    const angleOffset =
                        (i - (bulletCount - 1) / 2) *
                        (spreadAngle / (bulletCount - 1 || 1));
                    const angle = Phaser.Math.DegToRad(angleOffset);

                    // Apply bullet tier speed multiplier
                    const bulletSpeed = PLAYER_CONFIG.bulletSpeed * bulletStats.speedMultiplier;
                    const velocityX = Math.cos(angle) * bulletSpeed;
                    const velocityY = Math.sin(angle) * bulletSpeed;
                    bullet.setVelocity(velocityX, velocityY);
                    
                    // Store bullet tier data for collision handling
                    bullet.setData('bulletTier', bulletTier.tier);
                    bullet.setData('damageMultiplier', bulletStats.damageMultiplier);
                    bullet.setData('piercing', bulletStats.effects.piercing);
                    bullet.setData('pierceCount', 0); // Track how many enemies pierced
                    
                    // Add visual effects
                    this.addBulletVisualEffects(bullet, bulletTier);
                    
                    this.shotsFiredThisRun += 1;
                }
            }
        }
    }
    
    /**
     * Add visual effects to bullet based on tier
     */
    private addBulletVisualEffects(bullet: Phaser.Physics.Arcade.Sprite, tier: BulletTier): void {
        // Add glow effect for tiers 2+
        if (tier.effects.glow) {
            bullet.setTint(0xffffff);
            this.tweens.add({
                targets: bullet,
                alpha: { from: 1, to: 0.7 },
                duration: 200,
                yoyo: true,
                repeat: -1,
            });
        }
        
        // Add trail effect for tiers 2+
        if (tier.effects.trail) {
            // Create a trail particle effect
            const trailColor = tier.tier >= 5 ? 0x00ffff : tier.tier >= 4 ? 0x0088ff : 0x00ff00;
            const trailTimer = this.time.addEvent({
                delay: 50,
                callback: () => {
                    if (!bullet.active) {
                        trailTimer.remove();
                        return;
                    }
                    const trail = this.add.circle(bullet.x, bullet.y, 3, trailColor, 0.5);
                    this.tweens.add({
                        targets: trail,
                        alpha: 0,
                        scale: 0,
                        duration: 200,
                        onComplete: () => trail.destroy(),
                    });
                },
                loop: true,
            });
            bullet.setData('trailTimer', trailTimer);
        }
    }

    private getSelectedHeroTextureKey() {
        // Avatar system takes priority:
        // - Avatar selection determines sprite and stats
        // - Falls back to kernel/grade system if no avatar selected
        
        const activeAvatar = getActiveAvatar();
        const avatarConfig = getAvatarConfig(activeAvatar);
        
        if (avatarConfig && avatarConfig.spriteKey) {
            return avatarConfig.spriteKey;
        }
        
        // Fallback to kernel/grade system
        const kernelKey = getSelectedKernelKey();
        const currentGrade = getCurrentHeroGrade();
        
        // Get kernel config to determine colored variant
        const kernelConfig = PLAYER_KERNELS[kernelKey];
        const spriteVariant = (kernelConfig as any).spriteVariant || "default";
        
        // Map kernel variant to sprite key
        // Grade determines which base sprite, variant determines color
        switch (currentGrade) {
            case 1:
                if (spriteVariant === "blue") return "heroGrade1Blue";
                return "heroGrade1";
            case 2:
                if (spriteVariant === "purple") return "heroGrade2Purple";
                return "heroGrade2";
            case 3:
                if (spriteVariant === "red") return "heroGrade3Red";
                return "heroGrade3";
            case 4:
                if (spriteVariant === "orange") return "heroGrade4Orange";
                return "heroGrade4";
            case 5:
                if (spriteVariant === "white") return "heroGrade5White";
                return "heroGrade5";
            default:
                return "heroGrade1";
        }
    }

    private getSkinTint(skinKey: string) {
        // Colored variants are now determined by kernel selection, not skins
        // Skins are kept for backward compatibility but don't affect sprite color
        // Only apply tint for legacy skins that don't have kernel variants
        switch (skinKey) {
            case "skin_crimson":
                return 0xff3366;
            case "skin_aurora":
                return 0x33ffcc;
            case "skin_void":
                return 0x8888ff;
            default:
                return null;
        }
    }

    /**
     * Apply avatar stats to player
     */
    private applyAvatarStats(): void {
        const avatarStats = getActiveAvatarStats();
        this.avatarSpeedMultiplier = avatarStats.speedMultiplier;
        this.avatarFireRateMultiplier = avatarStats.fireRateMultiplier;
        this.avatarHealthMultiplier = avatarStats.healthMultiplier;
        this.avatarDamageMultiplier = avatarStats.damageMultiplier;
        
        // Store in registry for UI access
        this.registry.set("avatarSpeedMultiplier", this.avatarSpeedMultiplier);
        this.registry.set("avatarFireRateMultiplier", this.avatarFireRateMultiplier);
        this.registry.set("avatarHealthMultiplier", this.avatarHealthMultiplier);
        this.registry.set("avatarDamageMultiplier", this.avatarDamageMultiplier);
        this.registry.set("activeAvatarId", getActiveAvatar());
    }

    private applySelectedAppearance() {
        const skin = getSelectedSkin();
        const skinTint = this.getSkinTint(skin);
        if (skinTint !== null) {
            this.player.setTint(skinTint);
            return;
        }

        const cosmetic = getSelectedCosmetic();
        if (cosmetic === "cosmetic_prestige_glow") {
            this.player.setTint(0x66ffff);
        } else if (cosmetic === "cosmetic_corrupted_theme") {
            this.player.setTint(0xff66cc);
        } else if (cosmetic === "cosmetic_champion_skin") {
            this.player.setTint(0xffcc33);
        } else if (cosmetic === "cosmetic_legendary_aura") {
            this.player.setTint(0xffffff);
        } else if (cosmetic === "cosmetic_eternal_theme") {
            this.player.setTint(0x66ff66);
        } else {
            this.player.clearTint();
        }
    }

    private getAchievementDefinition(id: string) {
        const all = [
            ...ACHIEVEMENTS.tier1_basic,
            ...ACHIEVEMENTS.tier2_intermediate,
            ...ACHIEVEMENTS.tier3_advanced,
            ...ACHIEVEMENTS.tier4_legendary,
        ];
        return all.find((achievement) => achievement.id === id);
    }

    private unlockAchievementWithAnnouncement(id: string) {
        const unlocked = unlockAchievement(id);
        if (!unlocked) return;
        const def = this.getAchievementDefinition(id);
        setAchievementProgress(id, 1, 1);
        if (def) {
            this.showAnnouncement("ACHIEVEMENT UNLOCKED", def.name, 0xffcc33);
        }
    }

    private updateAchievementProgress(id: string, current: number, target: number) {
        setAchievementProgress(id, current, target);
        if (shouldNotifyAboutToUnlock(id, current, target)) {
            const def = this.getAchievementDefinition(id);
            if (def) {
                this.showAnnouncement(
                    "ALMOST THERE",
                    `${def.name} is 70% complete`,
                    0x00ffff
                );
            }
        }
    }

    private spawnEnemy() {
        if (this.gameOver) return;

        // Don't spawn normal enemies if graduation boss is active
        if (this.graduationBossActive) {
            return;
        }

        // Get max enemies based on current layer
        // Safety check: ensure currentLayer is valid
        if (this.currentLayer < 1 || this.currentLayer > MAX_LAYER) {
            console.warn(`[Spawn] Invalid currentLayer: ${this.currentLayer}, resetting to 1`);
            this.currentLayer = 1;
        }
        
        const currentLayerConfig =
            LAYER_CONFIG[this.currentLayer as keyof typeof LAYER_CONFIG];
        if (!currentLayerConfig) {
            console.error(`[Spawn] No layer config found for layer ${this.currentLayer}`);
            return;
        }
        
        const maxEnemiesMultiplier =
            currentLayerConfig.spawnRateMultiplier || 1.0;
        const currentMaxEnemies = Math.floor(
            SPAWN_CONFIG.baseMaxEnemies *
                maxEnemiesMultiplier *
                Math.max(1, this.prestigeDifficultyMultiplier)
        );

        const activeEnemies = this.enemies.children.size;
        if (activeEnemies >= currentMaxEnemies) {
            return;
        }

        // Check for boss spawn based on layer and enemy count requirement
        if (
            currentLayerConfig.bossChance > 0 &&
            this.enemiesKilledThisLayer >= this.enemiesRequiredBeforeBoss &&
            Math.random() < currentLayerConfig.bossChance
        ) {
            this.spawnBoss();
            // Reset counter after boss spawn
            this.enemiesKilledThisLayer = 0;
            // Require significantly more enemies before next boss: 50 base + 50 per level
            this.enemiesRequiredBeforeBoss = 50 + (50 * this.currentLayer);
            return;
        }

        const phaseConfig = this.getCurrentPhaseConfig();
        const spawnPatterns = phaseConfig.spawnPatterns as readonly string[];
        const allowFormations =
            (spawnPatterns as string[]).includes("loose_formations") ||
            (spawnPatterns as string[]).includes("formations") ||
            (spawnPatterns as string[]).includes("ambush_waves") ||
            (spawnPatterns as string[]).includes("complex_formations") ||
            (spawnPatterns as string[]).includes("boss_rushes");

        if (
            allowFormations &&
            Math.random() < ENEMY_BEHAVIOR_CONFIG.formationSpawnChance
        ) {
            this.spawnFormationWave(spawnPatterns);
            return;
        }

        // Safety check: ensure currentLayerConfig exists and has enemies
        if (!currentLayerConfig || !currentLayerConfig.enemies) {
            console.warn(`[Spawn] Invalid layer config for layer ${this.currentLayer}, cannot spawn enemies`);
            return;
        }

        const selectedType = this.getWeightedEnemyType(
            currentLayerConfig.enemies
        );
        if (!selectedType) return;

        this.spawnEnemyOfType(selectedType);
    }

    private getCurrentPhaseConfig() {
        return DIFFICULTY_EVOLUTION[this.currentDifficultyPhase];
    }

    private getWeightedEnemyType(
        enemies: readonly string[]
    ): keyof typeof ENEMY_CONFIG | null {
        const availableEnemies = [...enemies] as Array<keyof typeof ENEMY_CONFIG>;
        const weights = availableEnemies.map(
            (type) => ENEMY_CONFIG[type].spawnWeight
        );
        const totalWeight = weights.reduce((a: number, b: number) => a + b, 0);
        if (totalWeight === 0) return null;

        let random = Phaser.Math.Between(0, totalWeight - 1);
        let selectedType: keyof typeof ENEMY_CONFIG = availableEnemies[0];

        for (let i = 0; i < availableEnemies.length; i++) {
            random -= weights[i];
            if (random < 0) {
                selectedType = availableEnemies[i];
                break;
            }
        }

        return selectedType;
    }

    private spawnBossPawn(boss: Phaser.Physics.Arcade.Sprite) {
        // Spawn a weaker enemy (pawn) near the boss to attack the player
        // Choose pawn type based on boss layer (weaker enemies)
        let pawnType: keyof typeof ENEMY_CONFIG = "green";
        if (this.currentLayer >= 4) {
            pawnType = "yellow";
        } else if (this.currentLayer >= 3) {
            pawnType = "blue";
        } else if (this.currentLayer >= 2) {
            pawnType = "yellow";
        }
        
        // Spawn pawn near boss position
        const spawnX = boss.x - 40;
        const spawnY = boss.y + Phaser.Math.Between(-30, 30);
        
        this.spawnEnemyOfType(pawnType, {
            absoluteX: spawnX,
            y: spawnY,
            healthMultiplier: 0.5, // Pawns have half health
            speedMultiplier: 1.2, // Pawns are slightly faster
            isFormation: false,
        });
    }

    private getSpawnY() {
        const gameHeight = this.scale.height;
        if (this.adaptiveSpawnBias) {
            return Phaser.Math.Between(
                this.adaptiveSpawnBias.yMin,
                this.adaptiveSpawnBias.yMax
            );
        }
        return Phaser.Math.Between(50, gameHeight - 50);
    }

    /**
     * Get enemy sprite key using enemy service
     * @deprecated Use getEnemySpriteKey from enemyService directly
     */
    private getEnemySpriteKey(
        enemyType: keyof typeof ENEMY_CONFIG | "red",
        isBoss: boolean = false,
        layer: number = 1,
        prestigeLevel?: number
    ): string {
        // Handle red bosses (final bosses) - use old sprite system as fallback
        if (enemyType === "red") {
            if (layer >= 6) {
                return "finalBoss";
            } else if (layer >= 5) {
                return "mediumFinalBoss";
            } else {
                return "miniFinalBoss";
            }
        }
        
        // Get enemy color from type
        const color = getEnemyColorFromType(enemyType);
        const prestige = prestigeLevel !== undefined ? prestigeLevel : this.prestigeLevel;
        
        // Use enemy service to get sprite key
        return getEnemySpriteKey(color, prestige, isBoss);
    }

    private spawnEnemyOfType(
        selectedType: keyof typeof ENEMY_CONFIG,
        options?: {
            absoluteX?: number;
            xOffset?: number;
            y?: number;
            healthMultiplier?: number;
            speedMultiplier?: number;
            isFormation?: boolean;
            overrideHealth?: number;
            overridePoints?: number;
            isFragment?: boolean;
            isBoss?: boolean;
        }
    ) {
        const config = ENEMY_CONFIG[selectedType];
        const isBoss = options?.isBoss || false;
        const key = this.getEnemySpriteKey(selectedType, isBoss, this.currentLayer, this.prestigeLevel);

        const gameWidth = this.scale.width;
        const x =
            options?.absoluteX !== undefined
                ? options.absoluteX
                : gameWidth + 50 + (options?.xOffset || 0);
        const y = options?.y ?? this.getSpawnY();

        const enemy = this.physics.add.sprite(x, y, key);
        enemy.setScale(0.5 * MOBILE_SCALE);

        if (selectedType === "yellowShield") {
            enemy.setTint(0xffcc33);
            const shieldConfig = ENEMY_CONFIG.yellowShield;
            // Set type before creating aura so it can detect it
            enemy.setData("type", selectedType);
            this.createEnemyAura(enemy, 0xffcc33, shieldConfig.shieldRadius || 100);
        } else if (selectedType === "yellowEcho") {
            enemy.setTint(0xffff66);
            const echoConfig = ENEMY_CONFIG.yellowEcho;
            this.startEchoTrail(enemy, echoConfig.echoCount || 2, echoConfig.echoDuration || 2000);
        } else if (selectedType === "blueBuff") {
            enemy.setTint(0x66ccff);
            const buffConfig = ENEMY_CONFIG.blueBuff;
            this.createEnemyAura(enemy, 0x66ccff, buffConfig.buffRadius || 250);
        } else if (selectedType === "purpleFragmenter") {
            enemy.setTint(0xcc66ff);
        }

        const layerConfig =
            LAYER_CONFIG[this.currentLayer as keyof typeof LAYER_CONFIG];
        const baseHealthMultiplier = layerConfig?.healthMultiplier || 1.0;
        const extraHealthMultiplier = options?.healthMultiplier || 1.0;
        const corruptionDifficultyMultiplier =
            1.0; // Corruption system removed
        const baseHealth =
            options?.overrideHealth !== undefined
                ? options.overrideHealth
                : config.health;
        
        // Use enemy service for stat scaling
        const enemyColor = getEnemyColorFromType(selectedType);
        const enemyStats = getEnemyStats(
            baseHealth,
            config.speed,
            config.points,
            this.prestigeLevel,
            baseHealthMultiplier * extraHealthMultiplier
        );
        
        // Apply additional multipliers
        const scaledHealth = Math.ceil(
            enemyStats.health *
                this.prestigeDifficultyMultiplier *
                corruptionDifficultyMultiplier
        );

        const baseSpeedMultiplier = options?.speedMultiplier || 1.0;
        const scaledSpeed = Math.round(
            enemyStats.speed *
                baseSpeedMultiplier *
                this.prestigeDifficultyMultiplier *
                corruptionDifficultyMultiplier *
                this.settingsEnemySpeedMultiplier
        );
        
        // Use scaled points from enemy service
        const scaledPoints = Math.round(
            enemyStats.points *
                this.prestigeScoreMultiplier
        );

        const behaviors = this.getBehaviorsForEnemy(
            selectedType,
            options?.isFormation || false,
            false
        );

        // Only set type if not already set (yellowShield sets it earlier)
        if (!enemy.getData("type")) {
            enemy.setData("type", selectedType);
        }
        enemy.setData("uid", this.enemyUidCounter++);
        enemy.setData(
            "points",
            options?.overridePoints !== undefined
                ? options.overridePoints
                : scaledPoints
        );
        
        // Store enemy display name for UI/debugging
        const displayName = getEnemyDisplayName(enemyColor, this.prestigeLevel, isBoss);
        enemy.setData("displayName", displayName);
        enemy.setData("speed", scaledSpeed);
        enemy.setData("health", scaledHealth);
        enemy.setData("maxHealth", scaledHealth);
        enemy.setData("canShoot", config.canShoot || false);
        enemy.setData("behaviors", behaviors);
        enemy.setData("isFragment", options?.isFragment || false);
        enemy.setData("shootSpeedMultiplier", 1);
        enemy.setData("damageMultiplier", 1);

        if (selectedType === "yellowShield") {
            const shieldConfig = ENEMY_CONFIG.yellowShield;
            enemy.setData("shieldRadius", shieldConfig.shieldRadius);
            enemy.setData("shieldDamageReduction", shieldConfig.shieldDamageReduction);
        } else if (selectedType === "yellowEcho") {
            const echoConfig = ENEMY_CONFIG.yellowEcho;
            enemy.setData("echoCount", echoConfig.echoCount);
            enemy.setData("echoDuration", echoConfig.echoDuration);
        } else if (selectedType === "blueBuff") {
            const buffConfig = ENEMY_CONFIG.blueBuff;
            enemy.setData("buffRadius", buffConfig.buffRadius);
            enemy.setData("buffShootingSpeed", buffConfig.buffShootingSpeed);
            enemy.setData("buffDamage", buffConfig.buffDamage);
        } else if (selectedType === "purpleFragmenter") {
            const fragmenterConfig = ENEMY_CONFIG.purpleFragmenter;
            enemy.setData("fragmentsOnDeath", fragmenterConfig.fragmentsOnDeath);
            enemy.setData("fragmentType", fragmenterConfig.fragmentType);
            enemy.setData("fragmentHealth", fragmenterConfig.fragmentHealth);
        }

        const corruptionRatio = 0; // Corruption system removed
        if (false) { // Corruption system removed
            const startColor = Phaser.Display.Color.ValueToColor(0x00ff00);
            const endColor = Phaser.Display.Color.ValueToColor(0xff0000);
            const tint = Phaser.Display.Color.Interpolate.ColorWithColor(
                startColor,
                endColor,
                100,
                Math.round(corruptionRatio * 100)
            );
            const tintObj = tint as { r: number; g: number; b: number };
            enemy.setTint(
                Phaser.Display.Color.GetColor(tintObj.r, tintObj.g, tintObj.b)
            );
        }

        if (config.canShoot) {
            const baseShootInterval = (config as any).shootInterval || 2000;
            enemy.setData("lastShot", 0);
            enemy.setData("baseShootInterval", baseShootInterval);
            enemy.setData("shootInterval", baseShootInterval);
        }

        this.createEnemyHealthBar(enemy);
        this.enemies.add(enemy);

        const target = this.getTargetPositionForEnemy(behaviors, false);
        const angle =
            Phaser.Math.Angle.Between(enemy.x, enemy.y, target.x, target.y) +
            Phaser.Math.FloatBetween(-0.2, 0.2);

        const velocityX = Math.cos(angle) * scaledSpeed;
        const velocityY = Math.sin(angle) * scaledSpeed;
        enemy.setVelocity(velocityX, velocityY);
    }

    private spawnFormationWave(patterns: readonly string[]) {
        const gameHeight = this.scale.height;
        const centerY = Phaser.Math.Clamp(this.player.y, 80, gameHeight - 80);
        const availableEnemies = [...LAYER_CONFIG[
            this.currentLayer as keyof typeof LAYER_CONFIG
        ].enemies] as Array<keyof typeof ENEMY_CONFIG>;
        const hasBlue = availableEnemies.includes("blue");
        const hasPurple = availableEnemies.includes("purple");

        const pattern = patterns[Phaser.Math.Between(0, patterns.length - 1)];
        const stagger = 120;

        if (pattern === "loose_formations" || pattern === "formations") {
            const offsets = [-140, -60, 0, 60, 140];
            offsets.forEach((offset, index) => {
                const type =
                    index === 2 && hasBlue
                        ? "blue"
                        : index % 2 === 0
                          ? "green"
                          : "yellow";
                this.time.delayedCall(index * 120, () => {
                    this.spawnEnemyOfType(type as keyof typeof ENEMY_CONFIG, {
                        y: Phaser.Math.Clamp(centerY + offset, 50, gameHeight - 50),
                        isFormation: true,
                    });
                });
            });
            return;
        }

        if (pattern === "ambush_waves") {
            for (let i = 0; i < 8; i++) {
                this.time.delayedCall(i * 90, () => {
                    this.spawnEnemyOfType("green", {
                        y: Phaser.Math.Between(50, gameHeight - 50),
                        isFormation: true,
                    });
                });
            }
            return;
        }

        if (pattern === "boss_rushes" || pattern === "complex_formations") {
            const eliteType = hasPurple ? "purple" : hasBlue ? "blue" : "yellow";
            const yOffsets = [-100, 0, 100];
            yOffsets.forEach((offset, index) => {
                this.time.delayedCall(index * stagger, () => {
                    this.spawnEnemyOfType(eliteType as keyof typeof ENEMY_CONFIG, {
                        y: Phaser.Math.Clamp(centerY + offset, 50, gameHeight - 50),
                        healthMultiplier: 1.4,
                        speedMultiplier: 1.05,
                        isFormation: true,
                    });
                });
            });
            this.time.delayedCall(stagger * 2, () => {
                this.spawnEnemyOfType("yellow", {
                    y: Phaser.Math.Between(60, gameHeight - 60),
                    healthMultiplier: 1.2,
                    isFormation: true,
                });
            });
        }
    }

    private getBehaviorsForEnemy(
        type: keyof typeof ENEMY_CONFIG,
        isFormation: boolean,
        isBoss: boolean
    ): string[] {
        const phaseBehaviors = [...this.getCurrentPhaseConfig().enemyBehaviors] as unknown as string[];
        const behaviors: string[] = ["basic_pursuit"];

        if (
            phaseBehaviors.includes("predictive_movement") &&
            (type === "blue" || type === "purple" || isBoss)
        ) {
            behaviors.push("predictive_movement");
        }

        if (phaseBehaviors.includes("coordinated_fire") && type === "blue") {
            behaviors.push("coordinated_fire");
        }

        if (phaseBehaviors.includes("space_denial") && (isBoss || isFormation)) {
            behaviors.push("space_denial");
        }

        if (phaseBehaviors.includes("adaptive_learning")) {
            behaviors.push("adaptive_learning");
        }

        if (phaseBehaviors.includes("flanking") && isFormation) {
            behaviors.push("flanking");
        }

        return behaviors;
    }

    private getMovementStability() {
        if (this.directionSampleCount < 5) return 1;
        const changeRatio = this.directionChangeCount / this.directionSampleCount;
        return Phaser.Math.Clamp(1 - changeRatio, 0.4, 1);
    }

    private getPredictedPlayerPosition(leadTimeSeconds: number) {
        const velocity = this.player.body?.velocity;
        const leadX = velocity ? velocity.x * leadTimeSeconds : 0;
        const leadY = velocity ? velocity.y * leadTimeSeconds : 0;
        const targetX = Phaser.Math.Clamp(
            this.player.x + leadX,
            20,
            this.scale.width - 20
        );
        const targetY = Phaser.Math.Clamp(
            this.player.y + leadY,
            20,
            this.scale.height - 20
        );
        return { x: targetX, y: targetY };
    }

    private getPredictiveLeadTime(isBoss: boolean) {
        const stability = this.getMovementStability();
        const bossMultiplier = isBoss ? 1.2 : 1;
        return ENEMY_BEHAVIOR_CONFIG.predictiveLeadTime * stability * bossMultiplier;
    }

    private getTargetPositionForEnemy(behaviors: string[], isBoss: boolean) {
        if (
            behaviors.includes("predictive_movement") ||
            behaviors.includes("adaptive_learning")
        ) {
            return this.getPredictedPlayerPosition(
                this.getPredictiveLeadTime(isBoss)
            );
        }
        return { x: this.player.x, y: this.player.y };
    }

    private updateDifficultyPhase(time: number) {
        const elapsed = time - this.runStartTime;
        const nextPhase =
            elapsed >= DIFFICULTY_EVOLUTION.phase4.startMs
                ? "phase4"
                : elapsed >= DIFFICULTY_EVOLUTION.phase3.startMs
                  ? "phase3"
                  : elapsed >= DIFFICULTY_EVOLUTION.phase2.startMs
                    ? "phase2"
                    : "phase1";

        if (nextPhase !== this.currentDifficultyPhase) {
            this.currentDifficultyPhase = nextPhase;
        }
    }

    private samplePlayerMovement(time: number) {
        if (time - this.lastMovementSampleTime < 200) return;
        // const delta = time - this.lastMovementSampleTime; // Unused
        this.lastMovementSampleTime = time;

        const velocity = this.player.body?.velocity;
        if (!velocity) return;
        const speed = Math.hypot(velocity.x, velocity.y);
        if (speed < 5) return;

        const direction = new Phaser.Math.Vector2(
            velocity.x / speed,
            velocity.y / speed
        );

        if (this.directionSampleCount > 0) {
            const dot = Phaser.Math.Clamp(
                direction.dot(this.lastMovementDirection),
                -1,
                1
            );
            if (dot < 0.7) {
                this.directionChangeCount += 1;
            }
        }

        this.directionSampleCount += 1;
        this.movementDirectionSum.add(direction);
        this.lastMovementDirection.copy(direction);

        if (time - this.lastEdgeSampleTime >= 200) {
            const edgeDelta = time - this.lastEdgeSampleTime;
            this.lastEdgeSampleTime = time;
            const width = this.scale.width;
            const height = this.scale.height;
            const edgeThresholdX = width * 0.15;
            const edgeThresholdY = height * 0.15;

            if (this.player.x <= edgeThresholdX) {
                this.edgeHoldTime.left += edgeDelta;
            } else if (this.player.x >= width - edgeThresholdX) {
                this.edgeHoldTime.right += edgeDelta;
            }

            if (this.player.y <= edgeThresholdY) {
                this.edgeHoldTime.top += edgeDelta;
            } else if (this.player.y >= height - edgeThresholdY) {
                this.edgeHoldTime.bottom += edgeDelta;
            }
        }
    }

    private updateAdaptiveLearning(_time: number) {
        if (this.currentDifficultyPhase !== "phase4") return;
        if (this.adaptationKillCount < ENEMY_BEHAVIOR_CONFIG.adaptationThreshold) {
            return;
        }

        // const width = this.scale.width; // Unused
        const height = this.scale.height;
        const edgeTimes = this.edgeHoldTime;
        const maxEdgeTime = Math.max(
            edgeTimes.top,
            edgeTimes.bottom,
            edgeTimes.left,
            edgeTimes.right
        );

        if (maxEdgeTime > 3000) {
            if (edgeTimes.top === maxEdgeTime) {
                this.adaptiveSpawnBias = { yMin: 40, yMax: height * 0.3 };
            } else if (edgeTimes.bottom === maxEdgeTime) {
                this.adaptiveSpawnBias = {
                    yMin: height * 0.7,
                    yMax: height - 40,
                };
            } else {
                const focusY = Phaser.Math.Clamp(this.player.y, 60, height - 60);
                this.adaptiveSpawnBias = {
                    yMin: Math.max(40, focusY - 140),
                    yMax: Math.min(height - 40, focusY + 140),
                };
            }
        } else {
            const direction = this.movementDirectionSum
                .clone()
                .normalize()
                .scale(140);
            const focusY = Phaser.Math.Clamp(
                this.player.y + direction.y,
                60,
                height - 60
            );
            this.adaptiveSpawnBias = {
                yMin: Math.max(40, focusY - 120),
                yMax: Math.min(height - 40, focusY + 120),
            };
        }

        this.adaptationKillCount = 0;
    }

    private resetAdaptiveLearning() {
        this.directionChangeCount = 0;
        this.directionSampleCount = 0;
        this.movementDirectionSum.set(0, 0);
        this.lastMovementDirection.set(0, 0);
        this.edgeHoldTime = { top: 0, bottom: 0, left: 0, right: 0 };
        this.adaptiveSpawnBias = null;
        this.adaptationKillCount = 0;
    }

    private startBehaviorResetTimer() {
        if (this.behaviorResetTimer) {
            this.behaviorResetTimer.remove();
        }
        this.behaviorResetTimer = this.time.addEvent({
            delay: ENEMY_BEHAVIOR_CONFIG.behaviourResetInterval,
            loop: true,
            callback: () => {
                this.resetAdaptiveLearning();
            },
        });
    }

    private handleCoordinatedFire(time: number) {
        if (time - this.lastCoordinatedFireTime < 3500) return;
        const blueEnemies = this.enemies.children.entries.filter((enemyObj) => {
            const enemy = enemyObj as Phaser.Physics.Arcade.Sprite;
            return (
                enemy.active &&
                enemy.getData("type") === "blue" &&
                enemy.getData("canShoot")
            );
        }) as Phaser.Physics.Arcade.Sprite[];

        if (blueEnemies.length < 2) return;
        let shouldFire = false;

        for (let i = 0; i < blueEnemies.length; i++) {
            for (let j = i + 1; j < blueEnemies.length; j++) {
                const distance = Phaser.Math.Distance.Between(
                    blueEnemies[i].x,
                    blueEnemies[i].y,
                    blueEnemies[j].x,
                    blueEnemies[j].y
                );
                if (distance <= ENEMY_BEHAVIOR_CONFIG.coordinatedFireDistance) {
                    shouldFire = true;
                    break;
                }
            }
            if (shouldFire) break;
        }

        if (!shouldFire) return;

        blueEnemies.forEach((enemy) => {
            this.enemyShoot(enemy, 0);
            enemy.setData("lastShot", time);
        });
        this.lastCoordinatedFireTime = time;
    }

    private updateBuffEffects() {
        const buffEnemies = this.enemies.children.entries.filter((enemyObj) => {
            const enemy = enemyObj as Phaser.Physics.Arcade.Sprite;
            return enemy.active && enemy.getData("type") === "blueBuff";
        }) as Phaser.Physics.Arcade.Sprite[];

        const defaultShootMultiplier = 1;
        const defaultDamageMultiplier = 1;

        this.enemies.children.entries.forEach((enemyObj) => {
            const enemy = enemyObj as Phaser.Physics.Arcade.Sprite;
            if (!enemy.active) return;
            enemy.setData("shootSpeedMultiplier", defaultShootMultiplier);
            enemy.setData("damageMultiplier", defaultDamageMultiplier);
        });

        buffEnemies.forEach((buffEnemy) => {
            const buffRadius =
                (buffEnemy.getData("buffRadius") as number) || 250;
            const buffShootingSpeed =
                (buffEnemy.getData("buffShootingSpeed") as number) || 1.3;
            const buffDamage =
                (buffEnemy.getData("buffDamage") as number) || 1.2;

            this.enemies.children.entries.forEach((enemyObj) => {
                const enemy = enemyObj as Phaser.Physics.Arcade.Sprite;
                if (!enemy.active) return;
                const distance = Phaser.Math.Distance.Between(
                enemy.x,
                enemy.y,
                    buffEnemy.x,
                    buffEnemy.y
                );
                if (distance <= buffRadius) {
                    const currentSpeedMultiplier =
                        (enemy.getData("shootSpeedMultiplier") as number) || 1;
                    const currentDamageMultiplier =
                        (enemy.getData("damageMultiplier") as number) || 1;
                    enemy.setData(
                        "shootSpeedMultiplier",
                        Math.max(currentSpeedMultiplier, buffShootingSpeed)
                    );
                    enemy.setData(
                        "damageMultiplier",
                        Math.max(currentDamageMultiplier, buffDamage)
                    );
                }
            });
        });
    }

    private createEnemyAura(
        enemy: Phaser.Physics.Arcade.Sprite,
        color: number,
        radius: number
    ) {
        const aura = this.add.graphics();
        // For yellowShield, make it more visible and dangerous looking (red tint)
        const isShield = enemy.getData("type") === "yellowShield";
        const auraColor = isShield ? 0xff0000 : color; // Red for shield (dangerous)
        const auraOpacity = isShield ? 0.7 : 0.4; // More visible for shield
        const lineWidth = isShield ? 2 : 1; // Thicker line for shield
        
        aura.lineStyle(lineWidth, auraColor, auraOpacity);
        aura.strokeCircle(0, 0, radius * MOBILE_SCALE);
        aura.setPosition(enemy.x, enemy.y);
        aura.setDepth(enemy.depth - 1);
        aura.setBlendMode(Phaser.BlendModes.ADD);
        
        // Add pulsing animation for shield aura to indicate danger
        if (isShield) {
            this.tweens.add({
                targets: aura,
                alpha: { from: auraOpacity * 0.6, to: auraOpacity },
                duration: 400,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
        
        enemy.setData("aura", aura);
    }

    private startEchoTrail(
        enemy: Phaser.Physics.Arcade.Sprite,
        echoCount: number,
        echoDuration: number
    ) {
        const echoTimer = this.time.addEvent({
            delay: 900,
            loop: true,
            callback: () => {
                if (!enemy.active) return;
                for (let i = 0; i < echoCount; i++) {
                    const echo = this.add.sprite(
                        enemy.x + Phaser.Math.Between(-20, 20),
                        enemy.y + Phaser.Math.Between(-20, 20),
                        enemy.texture.key
                    );
                    echo.setScale(enemy.scaleX, enemy.scaleY);
                    echo.setAlpha(0.35);
                    echo.setTint(0xffffaa);
                    this.tweens.add({
                        targets: echo,
                        alpha: 0,
                        duration: echoDuration,
                        onComplete: () => {
                            echo.destroy();
                        },
                    });
                }
            },
        });
        enemy.setData("echoTimer", echoTimer);
    }

    private cleanupEnemyEffects(enemy: Phaser.Physics.Arcade.Sprite) {
        const aura = enemy.getData("aura") as
            | Phaser.GameObjects.Graphics
            | undefined;
        if (aura) {
            aura.destroy();
        }
        const echoTimer = enemy.getData("echoTimer") as
            | Phaser.Time.TimerEvent
            | undefined;
        if (echoTimer) {
            echoTimer.remove();
        }
    }

    private getShieldDamageReduction(enemy: Phaser.Physics.Arcade.Sprite) {
        if (enemy.getData("type") === "yellowShield") {
            return 0;
        }
        let maxReduction = 0;
        this.enemies.children.entries.forEach((enemyObj) => {
            const shieldEnemy = enemyObj as Phaser.Physics.Arcade.Sprite;
            if (!shieldEnemy.active) return;
            if (shieldEnemy.getData("type") !== "yellowShield") return;
            const radius = shieldEnemy.getData("shieldRadius") || 200;
            const reduction =
                (shieldEnemy.getData("shieldDamageReduction") as number) || 0.5;
            const distance = Phaser.Math.Distance.Between(
                enemy.x,
                enemy.y,
                shieldEnemy.x,
                shieldEnemy.y
            );
            if (distance <= radius) {
                maxReduction = Math.max(maxReduction, reduction);
            }
        });
        return maxReduction;
    }

    private checkShieldProximityDamage(enemy: Phaser.Physics.Arcade.Sprite, time: number) {
        // Skip if god mode is active
        if (this.godModeActive) {
            return;
        }
        
        // Skip if player is invisible
        if (this.isInvisible) {
            return;
        }
        
        const shieldRadius = enemy.getData("shieldRadius") as number || 100;
        const lastDamageTime = enemy.getData("lastShieldProximityDamage") as number || 0;
        const damageInterval = 500; // Damage every 500ms to prevent spam
        
        // Calculate distance between player and enemy
        const distance = Phaser.Math.Distance.Between(
            this.player.x,
            this.player.y,
            enemy.x,
            enemy.y
        );
        
        // Check if player is within shield radius
        if (distance <= shieldRadius) {
            // Apply damage if enough time has passed
            if (time - lastDamageTime >= damageInterval) {
                enemy.setData("lastShieldProximityDamage", time);
                
                // Deal one life of damage (lethal)
                this.takeDamage(3);
                
                // Visual feedback
                this.createFloatingText(
                    this.player.x,
                    this.player.y - 30,
                    "SHIELD DAMAGE!",
                    { color: "#ff0000", fontSize: 24 }
                );
            }
        }
    }

    private spawnFragments(
        enemy: Phaser.Physics.Arcade.Sprite,
        fragmentsOnDeath: number,
        fragmentType: keyof typeof ENEMY_CONFIG,
        fragmentHealth: number
    ) {
        for (let i = 0; i < fragmentsOnDeath; i++) {
            this.spawnEnemyOfType(fragmentType, {
                absoluteX: enemy.x + Phaser.Math.Between(-20, 20),
                y: enemy.y + Phaser.Math.Between(-20, 20),
                overrideHealth: fragmentHealth,
                isFragment: true,
            });
        }
    }


    private triggerHaptic(effect: {
        duration: number;
        intensity?: number;
        pattern?: string;
    }) {
        if (typeof navigator === "undefined" || !navigator.vibrate) {
            return;
        }
        const intensity = Phaser.Math.Clamp(effect.intensity ?? 1, 0.1, 1);
        const duration = Math.max(10, Math.round(effect.duration * intensity));
        if (effect.pattern === "pulse") {
            const pulse = Math.max(30, Math.round(duration / 4));
            navigator.vibrate([pulse, 60, pulse, 60, pulse]);
            return;
        }
        navigator.vibrate(duration);
    }

    private tryActivateOverclock() {
        if (this.gameOver || this.isPaused) return;
        if (this.overclockActive) return;
        if (this.overclockActivations >= OVERCLOCK_CONFIG.maxActivationsPerRun) {
            return;
        }
        if (this.time.now < this.overclockReadyAt) return;

        this.overclockActive = true;
        this.overclockActivations += 1;
        this.overclockReadyAt =
            this.time.now + OVERCLOCK_CONFIG.cooldownBetweenActivations;
        this.overclockEndTime = this.time.now + OVERCLOCK_CONFIG.duration;
        this.overclockScoreMultiplier =
            OVERCLOCK_CONFIG.effects.scoreMultiplier;
        this.overclockFireRateMultiplier =
            OVERCLOCK_CONFIG.effects.fireRateMultiplier;
        this.overclockSpeedMultiplier =
            OVERCLOCK_CONFIG.effects.playerSpeedMultiplier;
        this.overclockSpawnMultiplier =
            OVERCLOCK_CONFIG.effects.enemySpawningMultiplier;

        this.registry.set("overclockActive", true);
        this.registry.set("overclockProgress", 1);
        this.registry.set("overclockCooldown", 1);
        this.registry.set(
            "overclockCharges",
            OVERCLOCK_CONFIG.maxActivationsPerRun - this.overclockActivations
        );

        if (OVERCLOCK_CONFIG.indicators.screenBurnEffect) {
            this.applyCameraFlash(500, 255, 255, 255);
        }
        if (OVERCLOCK_CONFIG.indicators.playerGlowEffect) {
            this.player.setTint(0xffffff);
            this.player.setAlpha(OVERCLOCK_CONFIG.effects.playerVisibility);
        }

        this.updateSpawnTimer();

        if (this.overclockTimer) {
            this.overclockTimer.remove();
        }
        this.overclockTimer = this.time.addEvent({
            delay: OVERCLOCK_CONFIG.duration,
            callback: () => {
                this.endOverclock();
            },
        });
    }

    private updateMeters(time: number) {
        const delta = time - (this.lastMeterUpdate || time);
        this.lastMeterUpdate = time;

        // Update shock bomb meter (fills over time) - only if unlocked
        if (isShockBombUnlocked() && time >= this.shockBombCooldownUntil) {
            if (this.shockBombProgress < 1) {
                this.shockBombProgress = Math.min(
                    1,
                    this.shockBombProgress + (SHOCK_BOMB_CONFIG.fillRate * delta) / 1000
                );
                this.registry.set("shockBombProgress", this.shockBombProgress);
            }
            if (this.shockBombProgress >= 1 && !this.shockBombReady) {
                this.shockBombReady = true;
                this.registry.set("shockBombReady", true);
            }
        } else if (!isShockBombUnlocked()) {
            // Keep meter at 0 if not unlocked
            this.registry.set("shockBombProgress", 0);
            this.registry.set("shockBombReady", false);
        }

        // Update god mode meter (fills over time) - only if unlocked
        if (isGodModeUnlocked() && time >= this.godModeCooldownUntil) {
            if (this.godModeProgress < 1) {
                this.godModeProgress = Math.min(
                    1,
                    this.godModeProgress + (GOD_MODE_CONFIG.fillRate * delta) / 1000
                );
                this.registry.set("godModeProgress", this.godModeProgress);
            }
            if (this.godModeProgress >= 1 && !this.godModeReady) {
                this.godModeReady = true;
                this.registry.set("godModeReady", true);
            }
        } else if (!isGodModeUnlocked()) {
            // Keep meter at 0 if not unlocked
            this.registry.set("godModeProgress", 0);
            this.registry.set("godModeReady", false);
        }

        // Check god mode timer
        if (this.godModeActive && time >= this.godModeEndTime) {
            this.endGodMode();
        }
    }

    private lastMeterUpdate = 0;

    public tryActivateShockBomb(): boolean {
        if (this.gameOver || this.isPaused) return false;
        if (!isShockBombUnlocked()) {
            this.showAnnouncement("LOCKED", "Reach 10,000 lifetime score to unlock Shock Bomb", 0xff0000);
            return false;
        }
        if (!this.shockBombReady) return false;
        if (this.time.now < this.shockBombCooldownUntil) return false;

        // Slow down time for dramatic effect
        this.time.timeScale = 0.3; // Slow to 30% speed
        
        // Get all enemies on screen
        const enemyArray = this.enemies.children.entries as Phaser.Physics.Arcade.Sprite[];
        const activeEnemies = enemyArray.filter(e => e.active);
        
        // Create blue streak effects that strike all enemies
        this.createShockBombStreaks(activeEnemies);

        // After a brief delay (in slowed time), deal damage to all enemies
        this.time.delayedCall(500, () => {
            let totalDamage = 0;
            activeEnemies.forEach((enemy) => {
                if (enemy.active) {
                    let health = enemy.getData("health") || 1;
                    const damage = 50;
                    health -= damage;
                    enemy.setData("health", health);
                    
                    // Create vaporization effect
                    this.createExplosion(enemy.x, enemy.y, "medium");
                    this.createFloatingText(
                        enemy.x,
                        enemy.y - 20,
                        "-50",
                        {
                            color: "#00aaff",
                            fontSize: 24,
                        }
                    );
                    
                    // Award score for damage
                    this.score += 10;
                    totalDamage += damage;
                    
                    // If enemy dies, destroy it
                    if (health <= 0) {
                        this.totalEnemiesDefeated += 1;
                        // Clean up enemy effects (aura, echo timer, etc.)
                        this.cleanupEnemyEffects(enemy);
                        this.destroyEnemyHealthBar(enemy);
                        enemy.destroy();
                    } else {
                        // Update health bar for surviving enemies
                        this.updateEnemyHealthBar(enemy);
                    }
                }
            });

            // Restore normal time speed
            this.time.timeScale = 1.0;
            
            // Clean up streaks after animation
            this.time.delayedCall(1000, () => {
                this.cleanupShockBombStreaks();
            });

            // Reset meter
            this.shockBombProgress = 0;
            this.shockBombReady = false;
            this.shockBombCooldownUntil = this.time.now + SHOCK_BOMB_CONFIG.cooldownAfterUse;
            this.registry.set("shockBombProgress", 0);
            this.registry.set("shockBombReady", false);

            // Visual feedback
            this.applyCameraFlash(300, 0, 170, 255);
            this.showAnnouncement("SHOCKWAVE!", `${totalDamage} damage dealt!`, 0x00aaff);
        });

        return true;
    }

    private createShockBombStreaks(enemies: Phaser.Physics.Arcade.Sprite[]) {
        const width = this.scale.width;
        // const height = this.scale.height; // Unused
        const playerX = this.player.x;
        const playerY = this.player.y;

        // Clear any existing streaks
        this.cleanupShockBombStreaks();

        // Create multiple blue streaks that strike enemies
        enemies.forEach((enemy) => {
            const streak = this.add.graphics();
            streak.setDepth(1000); // Above most game objects
            
            const startX = playerX;
            const startY = playerY;
            const endX = enemy.x;
            const endY = enemy.y;
            
            // Animate streak appearing
            streak.lineStyle(4, 0x00aaff, 1);
            streak.lineStyle(6, 0x00ffff, 0.8);
            
            // Draw streak with animation
            this.tweens.add({
                targets: {},
                duration: 200,
                onUpdate: (tween) => {
                    const progress = tween.progress;
                    const currentX = startX + (endX - startX) * progress;
                    const currentY = startY + (endY - startY) * progress;
                    
                    streak.clear();
                    streak.lineStyle(6, 0x00ffff, 0.9);
                    streak.lineBetween(startX, startY, currentX, currentY);
                    
                    // Add glow effect
                    streak.lineStyle(10, 0x00aaff, 0.4);
                    streak.lineBetween(startX, startY, currentX, currentY);
                },
                onComplete: () => {
                    // Keep streak visible briefly, then fade out
                    this.tweens.add({
                        targets: streak,
                        alpha: 0,
                        duration: 300,
                        onComplete: () => {
                            streak.destroy();
                        }
                    });
                }
            });
            
            this.shockBombStreaks.push(streak);
        });

        // Also create radial shockwave effect
        const shockwave = this.add.graphics();
        shockwave.setDepth(999);
        shockwave.lineStyle(8, 0x00aaff, 0.8);
        shockwave.strokeCircle(playerX, playerY, 0);
        
        this.tweens.add({
            targets: {},
            duration: 400,
            onUpdate: (tween) => {
                const radius = width * tween.progress;
                shockwave.clear();
                shockwave.lineStyle(8, 0x00aaff, 0.8 * (1 - tween.progress));
                shockwave.strokeCircle(playerX, playerY, radius);
                shockwave.lineStyle(4, 0x00ffff, 0.6 * (1 - tween.progress));
                shockwave.strokeCircle(playerX, playerY, radius);
            },
            onComplete: () => {
                shockwave.destroy();
            }
        });
    }

    private cleanupShockBombStreaks() {
        this.shockBombStreaks.forEach(streak => {
            if (streak && streak.active) {
                streak.destroy();
            }
        });
        this.shockBombStreaks = [];
    }

    public tryActivateGodMode(): boolean {
        if (this.gameOver || this.isPaused) return false;
        if (!this.godModeReady) return false;
        if (this.time.now < this.godModeCooldownUntil) return false;
        if (this.godModeActive) return false;

        // Activate god mode (invincibility)
        this.godModeActive = true;
        this.godModeEndTime = this.time.now + GOD_MODE_CONFIG.duration;
        this.registry.set("godModeActive", true);

        // Reset meter
        this.godModeProgress = 0;
        this.godModeReady = false;
        this.godModeCooldownUntil = this.time.now + GOD_MODE_CONFIG.cooldownAfterUse;
        this.registry.set("godModeProgress", 0);
        this.registry.set("godModeReady", false);

        // Store original texture before switching
        this.originalPlayerTexture = this.player.texture.key;

        // Switch to god mode sprite
        // Check if texture exists before switching
        if (this.textures.exists("heroGodMode")) {
            this.player.setTexture("heroGodMode");
            this.player.clearTint(); // Clear any existing tint
        } else {
            console.warn("[God Mode] heroGodMode texture not found, using original texture with glow effect");
            // Keep original texture but add a strong tint to indicate god mode
            this.player.setTint(0x00aaff);
        }

        // Visual feedback
        this.applyCameraFlash(500, 0, 170, 255);
        this.showAnnouncement("GOD MODE!", "Invincible for 10 seconds!", 0x00aaff);
        
        // Create super glowing effect around player
        this.createGodModeGlow();

        // Set timer to end god mode
        if (this.godModeTimer) {
            this.godModeTimer.remove();
        }
        this.godModeTimer = this.time.addEvent({
            delay: GOD_MODE_CONFIG.duration,
            callback: () => {
                this.endGodMode();
            },
        });

        return true;
    }

    private createGodModeGlow() {
        this.godModeGlow.setVisible(true);
        
        // Animated pulsing glow effect
        this.tweens.add({
            targets: this.godModeGlow,
            alpha: { from: 0.6, to: 1.0 },
            duration: 300,
            yoyo: true,
            repeat: -1,
        });

        // Update glow position to follow player
        this.updateGodModeGlow();
    }

    private updateGodModeGlow() {
        if (!this.godModeActive || !this.godModeGlow.visible) return;

        const playerX = this.player.x;
        const playerY = this.player.y;
        const glowRadius = 50;
        
        this.godModeGlow.clear();
        
        // Outer glow (larger, more transparent)
        this.godModeGlow.fillStyle(0x00aaff, 0.4);
        this.godModeGlow.fillCircle(playerX, playerY, glowRadius + 20);
        
        // Middle glow
        this.godModeGlow.fillStyle(0x00ccff, 0.6);
        this.godModeGlow.fillCircle(playerX, playerY, glowRadius + 10);
        
        // Inner bright glow
        this.godModeGlow.fillStyle(0x00ffff, 0.8);
        this.godModeGlow.fillCircle(playerX, playerY, glowRadius);
        
        // Bright center
        this.godModeGlow.fillStyle(0xffffff, 1.0);
        this.godModeGlow.fillCircle(playerX, playerY, glowRadius * 0.3);
    }

    private endGodMode() {
        this.godModeActive = false;
        this.godModeEndTime = 0;
        this.registry.set("godModeActive", false);
        
        // Restore original player sprite
        this.player.setTexture(this.originalPlayerTexture);
        this.applySelectedAppearance(); // Re-apply skin/cosmetic
        
        // Remove glow effect
        this.godModeGlow.setVisible(false);
        this.godModeGlow.clear();
        this.tweens.killTweensOf(this.godModeGlow);
        
        if (this.godModeTimer) {
            this.godModeTimer.remove();
            this.godModeTimer = null;
        }
    }

    private endOverclock() {
        this.overclockActive = false;
        this.overclockEndTime = 0;
        this.overclockScoreMultiplier = 1;
        this.overclockFireRateMultiplier = 1;
        this.overclockSpeedMultiplier = 1;
        this.overclockSpawnMultiplier = 1;
        this.totalEnemiesDefeated = 0;
        this.tookDamageThisRun = false;
        this.peakComboMultiplier = this.comboMultiplier;
        this.timeToReachLayer6 = null;
        this.activeChallenge = null;
        this.challengeStartTime = 0;
        this.challengeWindowEnd = 0;
        this.challengeKills = 0;
        this.challengeBlueKills = 0;
        this.challengeZoneTime = 0;
        this.challengeComboTime = 0;
        this.challengeBulletsDodged = 0;
        this.challengeDamageTaken = false;
        this.challengeDamageTaken = false;
        this.challengeScoreMultiplier = 1;
        this.challengeFireRateMultiplier = 1;
        this.challengeCorruptionMultiplier = 1;
        this.challengeInvincibilityBonusMs = 0;
        this.challengeRewardTimers.forEach((timer) => timer.remove());
        this.challengeRewardTimers.clear();
        this.player.clearTint();
        this.player.setAlpha(1);
        this.applySelectedAppearance();
        this.registry.set("overclockActive", false);
        this.registry.set("overclockProgress", 0);
        this.registry.set("overclockCooldown", 1);
        this.updateSpawnTimer();
    }

    private updateOverclockProgress(time: number) {
        if (this.overclockActive && this.overclockEndTime > 0) {
            const remaining = Math.max(0, this.overclockEndTime - time);
            const progress = remaining / OVERCLOCK_CONFIG.duration;
            this.registry.set("overclockProgress", progress);
        }

        const cooldownRemaining = Math.max(0, this.overclockReadyAt - time);
        const cooldownProgress =
            cooldownRemaining / OVERCLOCK_CONFIG.cooldownBetweenActivations;
        this.registry.set("overclockCooldown", cooldownProgress);
    }

    private updateChallenges(time: number) {
        if (this.activeChallenge) {
            this.updateActiveChallenge(time);
            return;
        }

        const minGap =
            this.lastChallengeEndTime +
            MID_RUN_CHALLENGES.triggerIntervals.minTimeBetweenChallenges;
        if (time < this.nextChallengeTime || time < minGap) {
            return;
        }

        const options = MID_RUN_CHALLENGES.challenges;
        const challenge = options[Phaser.Math.Between(0, options.length - 1)];
        this.startChallenge(challenge, time);
    }

    private startChallenge(
        challenge: (typeof MID_RUN_CHALLENGES.challenges)[number],
        time: number
    ) {
        this.activeChallenge = challenge;
        this.challengeStartTime = time;
        this.challengeWindowEnd = 0;
        this.challengeKills = 0;
        this.challengeBlueKills = 0;
        this.challengeZoneTime = 0;
        this.challengeComboTime = 0;
        this.challengeBulletsDodged = 0;
        this.challengeDamageTaken = false;

        if (challenge.id === "no_shoot_20s") {
            this.challengeWindowEnd = time + 20000;
        } else if (challenge.id === "defeat_5_blue") {
            this.challengeWindowEnd = time + 30000;
        } else if (challenge.id === "chain_combo") {
            this.challengeWindowEnd = time + 30000;
        }

        this.registry.set("challengeActive", true);
        this.registry.set("challengeTitle", `Challenge: ${challenge.title}`);
        this.registry.set("challengeDescription", challenge.description);
        this.registry.set("challengeProgress", 0);

        if (MID_RUN_CHALLENGES.display.announcementCard) {
            this.showAnnouncement(
                "CHALLENGE START",
                challenge.description,
                0x00ffff
            );
        }
    }

    private updateActiveChallenge(time: number) {
        const challenge = this.activeChallenge;
        if (!challenge) return;

        if (this.challengeWindowEnd > 0 && time > this.challengeWindowEnd) {
            this.failChallenge();
            return;
        }

        let progress = 0;
        switch (challenge.id) {
            case "no_shoot_20s":
                progress = Phaser.Math.Clamp(
                    (time - this.challengeStartTime) / 20000,
                    0,
                    1
                );
                break;
            case "clean_10_enemies":
                progress = Phaser.Math.Clamp(this.challengeKills / 10, 0, 1);
                break;
            case "survive_corruption_zone": {
                if (false) { // Corruption system removed
                    this.challengeZoneTime += this.game.loop.delta;
                } else {
                    this.challengeZoneTime = 0;
                }
                progress = Phaser.Math.Clamp(
                    this.challengeZoneTime / 15000,
                    0,
                    1
                );
                break;
            }
            case "defeat_5_blue":
                progress = Phaser.Math.Clamp(this.challengeBlueKills / 5, 0, 1);
                break;
            case "chain_combo": {
                if (this.comboMultiplier >= 3) {
                    this.challengeComboTime += this.game.loop.delta;
                } else {
                    this.challengeComboTime = 0;
                }
                progress = Phaser.Math.Clamp(
                    this.challengeComboTime / 30000,
                    0,
                    1
                );
                break;
            }
            case "dodge_25_bullets":
                progress = Phaser.Math.Clamp(
                    this.challengeBulletsDodged / 25,
                    0,
                    1
                );
                break;
            default:
                break;
        }

        this.registry.set("challengeProgress", progress);

        if (progress >= 1) {
            this.completeChallenge();
        }
    }

    private completeChallenge() {
        const challenge = this.activeChallenge;
        if (!challenge) return;

        this.applyChallengeReward(challenge.reward);
        this.activeChallenge = null;
        this.lastChallengeEndTime = this.time.now;
        this.nextChallengeTime =
            this.time.now + MID_RUN_CHALLENGES.triggerIntervals.subsequentChallenges;
        this.registry.set("challengeActive", false);
        this.registry.set("challengeProgress", 0);

        if (MID_RUN_CHALLENGES.display.celebrationOnCompletion) {
            this.applyCameraFlash(250, 0, 255, 255);
            this.applyCameraShake(200, 0.01);
        }
        this.showAnnouncement(
            "CHALLENGE COMPLETE",
            `${challenge.title} cleared!`,
            0x00ff99
        );
    }

    private failChallenge() {
        if (!this.activeChallenge) return;
        this.activeChallenge = null;
        this.lastChallengeEndTime = this.time.now;
        this.nextChallengeTime =
            this.time.now + MID_RUN_CHALLENGES.triggerIntervals.subsequentChallenges;
        this.registry.set("challengeActive", false);
        this.registry.set("challengeProgress", 0);
    }

    private applyChallengeReward(reward: {
        bonusScore?: number;
        comboMultiplier?: number;
        extraLife?: number;
        corruptionMultiplier?: number;
        fireRateBoost?: number;
        scoreMultiplier?: number;
        invincibilityFrame?: number;
    }) {
        if (reward.bonusScore) {
            this.score += reward.bonusScore;
            this.registry.set("score", this.score);
        }
        if (reward.comboMultiplier) {
            this.comboMultiplier = Math.max(
                this.comboMultiplier,
                reward.comboMultiplier
            );
            this.registry.set("comboMultiplier", this.comboMultiplier);
        }
        if (reward.extraLife) {
            // Restore 1 health bar per life orb (max 5 health bars)
            this.healthBars = Math.min(this.healthBars + 1, PLAYER_CONFIG.maxHealthBars);
            this.registry.set("healthBars", this.healthBars);
            
            // Show floating text for health restoration
            this.createFloatingText(this.player.x, this.player.y - 20, "+1 Health", { color: "#00ff00" });
        }

        const duration = 10000;
        if (reward.fireRateBoost) {
            this.applyChallengeMultiplier(
                "fireRate",
                () => {
                    this.challengeFireRateMultiplier = Math.min(
                        this.challengeFireRateMultiplier,
                        reward.fireRateBoost || 1
                    );
                },
                () => {
                    this.challengeFireRateMultiplier = 1;
                },
                duration
            );
        }
        if (reward.scoreMultiplier) {
            this.applyChallengeMultiplier(
                "score",
                () => {
                    this.challengeScoreMultiplier = Math.max(
                        this.challengeScoreMultiplier,
                        reward.scoreMultiplier || 1
                    );
                },
                () => {
                    this.challengeScoreMultiplier = 1;
                },
                duration
            );
        }
        if (reward.corruptionMultiplier) {
            this.applyChallengeMultiplier(
                "corruption",
                () => {
                    this.challengeCorruptionMultiplier = Math.max(
                        this.challengeCorruptionMultiplier,
                        reward.corruptionMultiplier || 1
                    );
                },
                () => {
                    this.challengeCorruptionMultiplier = 1;
                },
                duration
            );
        }
        if (reward.invincibilityFrame !== undefined) {
            const invincibilityMs = reward.invincibilityFrame * 1000;
            this.applyChallengeMultiplier(
                "invincibility",
                () => {
                    this.challengeInvincibilityBonusMs = Math.max(
                        this.challengeInvincibilityBonusMs,
                        invincibilityMs
                    );
                },
                () => {
                    this.challengeInvincibilityBonusMs = 0;
                },
                duration
            );
        }
    }

    private applyChallengeMultiplier(
        key: string,
        apply: () => void,
        reset: () => void,
        duration: number
    ) {
        if (this.challengeRewardTimers.has(key)) {
            this.challengeRewardTimers.get(key)!.remove();
        }
        apply();
        const timer = this.time.delayedCall(duration, () => {
            reset();
            this.challengeRewardTimers.delete(key);
        });
        this.challengeRewardTimers.set(key, timer);
    }

    private applySessionRewards(startTime: number) {
        const session = startSession();
        this.sessionScoreMultiplier = 1;
        this.sessionStreakScoreMultiplier = 1;
        this.sessionComboStartBoost = 1;
        this.sessionBoostEndTime = 0;
        this.sessionLastTick = startTime;

        if (session.isFirstSessionOfDay) {
            this.sessionScoreMultiplier =
                SESSION_REWARDS.firstSessionOfDay.scoreMultiplier;
            this.sessionComboStartBoost =
                SESSION_REWARDS.firstSessionOfDay.comboStartBoost;
            const sessionMultiplier = Math.pow(
                1.5,
                Math.floor((session.sessionCount - 1) / 2)
            );
            this.sessionBoostEndTime =
                startTime +
                SESSION_REWARDS.firstSessionOfDay.durationMinutes *
                    60 *
                    1000 *
                    sessionMultiplier;
            this.showAnnouncement(
                "DAILY AWAKENING",
                SESSION_REWARDS.firstSessionOfDay.description,
                0x00ffff
            );
        }

        if (session.streak >= 3) {
            this.sessionComboStartBoost = Math.max(
                this.sessionComboStartBoost,
                SESSION_REWARDS.streakBonuses.playThreeDaysInRow.comboMultiplier
            );
        }
        if (session.streak >= 6) {
            this.sessionStreakScoreMultiplier =
                SESSION_REWARDS.streakBonuses.playSixDaysInRow.scoreMultiplier;
        }

        this.comboMultiplier = Math.max(
            this.comboMultiplier,
            this.sessionComboStartBoost
        );
        this.registry.set("comboMultiplier", this.comboMultiplier);
    }

    private updateSessionRewards(time: number) {
        if (this.sessionBoostEndTime > 0 && time > this.sessionBoostEndTime) {
            this.sessionScoreMultiplier = 1;
            this.sessionBoostEndTime = 0;
        }

        const delta = time - this.sessionLastTick;
        if (delta > 0) {
            const rewards = updateLifetimePlaytime(delta);
            this.sessionLastTick = time;
            rewards.forEach((reward) => {
                this.score += reward.bonusScore;
                this.registry.set("score", this.score);
                this.showAnnouncement(
                    "SESSION REWARD",
                    `+${reward.bonusScore} bonus`,
                    0x00ff99
                );
            });
        }
    }

    private buildRunMetrics(): RunMetrics {
        const survivalTime = Math.round((this.time.now - this.runStartTime) / 1000);
        return {
            survivalTime,
            totalEnemiesDefeated: this.totalEnemiesDefeated,
            runsWithoutDamage: this.tookDamageThisRun ? 0 : 1,
            peakComboMultiplier: Number(this.peakComboMultiplier.toFixed(2)),
            timeToReachLayer6: this.timeToReachLayer6 || undefined,
            deepestLayerWithPrestige: this.deepestLayer + this.prestigeLevel,
            maxCorruptionReached: 0, // Corruption system removed
        };
    }

    private applySelectedKernel() {
        const selectedKey = getSelectedKernelKey();
        const kernel = PLAYER_KERNELS[selectedKey] ?? PLAYER_KERNELS.sentinel_standard;
        // this.kernelKey = selectedKey; // Unused
        this.kernelSpeedMultiplier = kernel.baseSpeed ?? 1;
        this.kernelFireRateMultiplier = kernel.fireRate ?? 1;
        this.kernelHealthMultiplier = ("healthPerLife" in kernel && kernel.healthPerLife) ? kernel.healthPerLife : 1;
        this.kernelBulletPiercing = ("bulletPiercing" in kernel && kernel.bulletPiercing) ? kernel.bulletPiercing : false;
        this.kernelDamageAccumulator = 0;
        
        // Apply hero grade bonuses
        this.applyHeroGradeBonuses();
    }
    
    private applyHeroGradeBonuses() {
        const currentGrade = getCurrentHeroGrade();
        const gradeConfig = getHeroGradeConfig(currentGrade);
        const feature = gradeConfig.specialFeature;
        
        // Apply speed bonus (additive with kernel)
        this.heroGradeSpeedMultiplier = 1 + (feature.speedBonus || 0);
        
        // Apply fire rate bonus (additive with kernel)
        this.heroGradeFireRateMultiplier = 1 + (feature.fireRateBonus || 0);
        
        // Apply health bonus (multiplicative with kernel)
        // Health bars are always 5, not affected by hero grade
        
        // Apply damage bonus
        this.heroGradeDamageMultiplier = feature.damageBonus || 1;
        
        // Apply special abilities
        this.heroGradeBulletPiercing = feature.specialAbility === "Bullet piercing" || false;
    }

    private initRotatingModifier(time: number) {
        const rotation = getRotationInfo(time);
        this.currentModifierKey =
            rotation.currentKey as keyof typeof ROTATING_LAYER_MODIFIERS;
        this.nextModifierKey =
            rotation.nextKey as keyof typeof ROTATING_LAYER_MODIFIERS;
        this.nextModifierChangeTime = rotation.nextChangeTime;
        this.modifierAnnouncementShown = false;
        this.applyRotatingModifier(this.currentModifierKey);
    }

    private updateRotatingModifier(time: number) {
        const rotation = getRotationInfo(time);
        const currentKey =
            rotation.currentKey as keyof typeof ROTATING_LAYER_MODIFIERS;
        if (currentKey !== this.currentModifierKey) {
            this.currentModifierKey = currentKey;
            this.nextModifierKey =
                rotation.nextKey as keyof typeof ROTATING_LAYER_MODIFIERS;
            this.nextModifierChangeTime = rotation.nextChangeTime;
            this.modifierAnnouncementShown = false;
            this.applyRotatingModifier(this.currentModifierKey);
            const modifier = ROTATING_LAYER_MODIFIERS[this.currentModifierKey];
            this.showAnnouncement(
                "LAYER SHIFT",
                `${modifier.name}: ${modifier.description}`,
                0xffaa00
            );
        }

        const timeUntilChange = rotation.nextChangeTime - time;
        if (
            !this.modifierAnnouncementShown &&
            timeUntilChange <= rotation.announceBeforeMs
        ) {
            this.modifierAnnouncementShown = true;
            const upcoming =
                ROTATING_LAYER_MODIFIERS[
                    rotation.nextKey as keyof typeof ROTATING_LAYER_MODIFIERS
                ];
            this.showAnnouncement(
                "UPCOMING SHIFT",
                `${upcoming.name} in 15 minutes`,
                0x00ffff
            );
        }

        this.updateModifierEffects(time);
    }

    private applyRotatingModifier(
        key: keyof typeof ROTATING_LAYER_MODIFIERS
    ) {
        const modifier = ROTATING_LAYER_MODIFIERS[key];
        this.modifierSpawnMultiplier = modifier.enemySpawnRate || 1;
        this.modifierSpeedCap = 1;
        this.modifierInputDelayMs = 0;
        this.modifierBaseInputDelayMs = 0;
        this.modifierInputDelayRandom = false;
        this.modifierInputDelayNextToggle = 0;
        this.modifierInputDelayEndTime = 0;
        this.modifierPauseDurationMs = 0;
        this.modifierPauseIntervalMs = 0;
        this.modifierPauseCooldown = 0;
        this.modifierSpeedScoreRatio = 0;
        this.modifierGlitchIntensity = 0;

        modifier.modifiers.forEach((entry: any) => {
            if (entry.type === "speed_cap") {
                this.modifierSpeedCap = entry.value ?? 1;
            }
            if (entry.type === "input_lag") {
                this.modifierBaseInputDelayMs = Math.round(
                    (entry.value ?? 0) * 1000
                );
                this.modifierInputDelayMs = this.modifierBaseInputDelayMs;
            }
            if (entry.type === "input_delay") {
                this.modifierBaseInputDelayMs = Math.round(
                    (entry.value ?? 0) * 1000
                );
                this.modifierInputDelayMs = this.modifierBaseInputDelayMs;
                this.modifierInputDelayRandom = true;
                this.modifierInputDelayNextToggle = this.time.now + 5000;
            }
            if (entry.type === "random_pause") {
                this.modifierPauseDurationMs = Math.round(
                    (entry.duration ?? 0.5) * 1000
                );
                this.modifierPauseIntervalMs = 30000;
                this.modifierPauseCooldown = this.time.now + 30000;
            }
            if (entry.type === "vision_limit") {
                this.applyVisionLimit(entry.radius ?? 200);
            }
            if (entry.type === "speed_score_link") {
                this.modifierSpeedScoreRatio = entry.ratio ?? 0;
            }
            if (entry.type === "screen_glitch") {
                this.modifierGlitchIntensity = entry.intensity ?? 0;
            }
        });

        if (modifier.modifiers.length === 0 && this.modifierVisionOverlay) {
            this.modifierVisionOverlay.destroy();
            this.modifierVisionOverlay = null;
            this.modifierVisionMask = null;
        }

        this.updateSpawnTimer();
    }

    private updateModifierEffects(time: number) {
        if (this.modifierInputDelayRandom && time >= this.modifierInputDelayNextToggle) {
            this.modifierInputDelayNextToggle = time + 5000;
            if (Math.random() < 0.5) {
                this.modifierInputDelayEndTime = time + 1000;
            }
        }
        if (this.modifierInputDelayEndTime > 0 && time > this.modifierInputDelayEndTime) {
            this.modifierInputDelayEndTime = 0;
        }
        if (this.modifierInputDelayRandom) {
            this.modifierInputDelayMs =
                this.modifierInputDelayEndTime > time
                    ? this.modifierBaseInputDelayMs
                    : 0;
        }

        if (
            this.modifierPauseDurationMs > 0 &&
            time >= this.modifierPauseCooldown &&
            !this.modifierPauseActive
        ) {
            this.modifierPauseActive = true;
            this.physics.pause();
            this.time.delayedCall(this.modifierPauseDurationMs, () => {
                this.modifierPauseActive = false;
                if (!this.isPaused && !this.gameOver) {
                    this.physics.resume();
                }
            });
            this.modifierPauseCooldown = time + this.modifierPauseIntervalMs;
        }

        if (this.modifierVisionOverlay && this.modifierVisionMask) {
            this.modifierVisionOverlay.setPosition(0, 0);
            const maskGraphics = this.modifierVisionMask.geometryMask as
                | Phaser.GameObjects.Graphics
                | undefined;
            if (maskGraphics) {
                const radius = (maskGraphics.getData("radius") as number) || 200;
                maskGraphics.clear();
                maskGraphics.fillStyle(0xffffff);
                maskGraphics.fillCircle(this.player.x, this.player.y, radius);
            }
        }

        if (this.modifierGlitchIntensity > 0 && Math.random() < 0.02) {
        this.applyCameraShake(100, this.modifierGlitchIntensity * 0.002);
        }
    }

    private applyVisionLimit(radius: number) {
        if (!this.modifierVisionOverlay) {
            this.modifierVisionOverlay = this.add.graphics();
            this.modifierVisionOverlay.fillStyle(0x000000, 0.7);
            this.modifierVisionOverlay.fillRect(
                0,
                0,
                this.scale.width,
                this.scale.height
            );
        }

        const maskGraphics = this.make.graphics({ x: 0, y: 0 });
        maskGraphics.fillStyle(0xffffff);
        maskGraphics.fillCircle(this.player.x, this.player.y, radius);
        maskGraphics.setData("radius", radius);

        const mask = maskGraphics.createGeometryMask();
        this.modifierVisionOverlay.setMask(mask);
        this.modifierVisionMask = mask;
    }

    private updateSpawnTimer() {
        // Safety check: ensure currentLayer is valid
        if (this.currentLayer < 1 || this.currentLayer > MAX_LAYER) {
            console.warn(`[Spawn Timer] Invalid currentLayer: ${this.currentLayer}, resetting to 1`);
            this.currentLayer = 1;
        }
        
        // Get spawn rate multiplier based on current layer
        let layerConfig =
            LAYER_CONFIG[this.currentLayer as keyof typeof LAYER_CONFIG];
        if (!layerConfig) {
            console.error(`[Spawn Timer] No layer config found for layer ${this.currentLayer}, using layer 1 config`);
            layerConfig = LAYER_CONFIG[1];
            if (!layerConfig) {
                console.error(`[Spawn Timer] Layer 1 config also not found, using default multiplier`);
            }
        }
        const spawnRateMultiplier = layerConfig?.spawnRateMultiplier || 1.0;
        const prestigeSpawnMultiplier = Math.max(
            1,
            this.prestigeDifficultyMultiplier
        );
        const overclockSpawnMultiplier = this.overclockSpawnMultiplier;
        const modifierSpawnMultiplier = this.modifierSpawnMultiplier;
        const settingsSpawnMultiplier = this.settingsSpawnRateMultiplier;

        // Calculate spawn interval (faster spawns = lower delay)
        // Base interval is middle of min/max, then divided by multiplier
        const baseInterval =
            (SPAWN_CONFIG.minInterval + SPAWN_CONFIG.maxInterval) / 2;
        const adjustedInterval = Math.max(
            SPAWN_CONFIG.minInterval,
            baseInterval /
                (spawnRateMultiplier *
                    prestigeSpawnMultiplier *
                    overclockSpawnMultiplier *
                    modifierSpawnMultiplier *
                    settingsSpawnMultiplier)
        );

        // Remove existing timer if any
        if (this.spawnTimer) {
            this.spawnTimer.remove();
            this.spawnTimer = null;
        }

        // Create new timer with adjusted interval
        this.spawnTimer = this.time.addEvent({
            delay: adjustedInterval,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true,
        });
    }

    private spawnBoss() {
        let bossKey = "";
        let bossType = "";
        let points = 0;
        let health = 0;
        let speed = 0;

        // Use enemy service for boss selection
        if (this.currentLayer >= 6) {
            // Layer 6: Prestige boss (yellow) or final boss (Zrechostikal)
            if (this.prestigeLevel === 8) {
                // Final boss: Zrechostikal
                bossKey = "zrechostikal"; // Special final boss sprite
                bossType = "red";
                points = 1000;
                health = 50;
                speed = 100;
            } else {
                // Prestige boss: yellow variant
                bossKey = getGraduationBossSpriteKey(6, this.prestigeLevel);
                bossType = "yellow";
                const baseStats = getEnemyStats(16, 130, 400, this.prestigeLevel, 10);
                points = baseStats.points;
                health = baseStats.health;
                speed = baseStats.speed;
            }
        } else if (this.currentLayer >= 5) {
            // Layer 5: Green variant (wraps)
            bossKey = getGraduationBossSpriteKey(5, this.prestigeLevel);
            bossType = "green";
            const baseStats = getEnemyStats(14, 140, 300, this.prestigeLevel, 10);
            points = baseStats.points;
            health = baseStats.health;
            speed = baseStats.speed;
        } else if (this.currentLayer >= 4) {
            // Layer 4: Purple boss
            bossKey = getGraduationBossSpriteKey(4, this.prestigeLevel);
            bossType = "purple";
            const baseStats = getEnemyStats(12, 150, 250, this.prestigeLevel, 10);
            points = baseStats.points;
            health = baseStats.health;
            speed = baseStats.speed;
        } else if (this.currentLayer >= 3) {
            // Layer 3: Blue boss
            bossKey = getGraduationBossSpriteKey(3, this.prestigeLevel);
            bossType = "blue";
            const baseStats = getEnemyStats(10, 120, 150, this.prestigeLevel, 10);
            points = baseStats.points;
            health = baseStats.health;
            speed = baseStats.speed;
        } else if (this.currentLayer >= 2) {
            // Layer 2: Yellow boss
            bossKey = getGraduationBossSpriteKey(2, this.prestigeLevel);
            bossType = "yellow";
            const baseStats = getEnemyStats(6, 150, 100, this.prestigeLevel, 10);
            points = baseStats.points;
            health = baseStats.health;
            speed = baseStats.speed;
        } else if (this.currentLayer >= 1) {
            // Layer 1: Green boss
            bossKey = getGraduationBossSpriteKey(1, this.prestigeLevel);
            bossType = "green";
            const baseStats = getEnemyStats(4, 100, 50, this.prestigeLevel, 10);
            points = baseStats.points;
            health = baseStats.health;
            speed = baseStats.speed;
        } else {
            return; // No boss for invalid layers
        }

        const gameWidth = this.scale.width;
        const gameHeight = this.scale.height;
        const x = gameWidth + 50;
        const y = gameHeight / 2;

        const boss = this.physics.add.sprite(x, y, bossKey);
        boss.setScale(0.6 * MOBILE_SCALE);

        // Scale boss health and speed based on current layer using enemy service
        const layerConfig =
            LAYER_CONFIG[this.currentLayer as keyof typeof LAYER_CONFIG];
        const healthMultiplier = layerConfig?.healthMultiplier || 1.0;
        const corruptionDifficultyMultiplier =
            1.0; // Corruption system removed
        
        // Use enemy service for stat scaling
        const bossStats = getEnemyStats(
            health,
            speed,
            points,
            this.prestigeLevel,
            healthMultiplier
        );
        
        const scaledHealth = Math.ceil(
            bossStats.health *
                this.prestigeDifficultyMultiplier *
                corruptionDifficultyMultiplier
        );
        const speedMultiplier = layerConfig?.bossSpeedMultiplier || 1.0;
        const scaledSpeed = Math.max(
            40,
            Math.round(
                bossStats.speed *
                    speedMultiplier *
                    this.prestigeDifficultyMultiplier *
                    corruptionDifficultyMultiplier *
                    this.settingsEnemySpeedMultiplier
            )
        );
        
        // Use scaled points
        const scaledPoints = Math.round(
            bossStats.points *
                this.prestigeScoreMultiplier
        );

        boss.setData("type", bossType);
        boss.setData("uid", this.enemyUidCounter++);
        boss.setData("uid", this.enemyUidCounter++);
        boss.setData("points", scaledPoints);
        
        // Store boss display name
        if (this.currentLayer === 6 && this.prestigeLevel === 8) {
            boss.setData("displayName", "Zrechostikal - The Swarm Overlord");
        } else {
            const bossDisplayName = getGraduationBossName(this.currentLayer, this.prestigeLevel);
            boss.setData("displayName", bossDisplayName);
        }
        boss.setData("speed", scaledSpeed);
        boss.setData("health", scaledHealth);
        boss.setData("maxHealth", scaledHealth);
        boss.setData("canShoot", false);
        boss.setData("isBoss", true);
        boss.setData("bossKey", bossKey); // Store boss key for identification
        boss.setData(
            "behaviors",
            this.getBehaviorsForEnemy(
                bossType as keyof typeof ENEMY_CONFIG,
                false,
                true
            )
        );

        // Create health bar for boss
        this.createEnemyHealthBar(boss);

        this.enemies.add(boss);

        // Boss movement is handled in update loop to maintain line of sight
        boss.setVelocity(0, 0);

        // Show announcement card for regular boss incoming
        const bossDisplayName = boss.getData("displayName") as string || "Boss";
        this.showAnnouncement(
            "BOSS INCOMING!",
            `${bossDisplayName} detected`,
            0xff8800 // Orange color for warning
        );
    }

    private spawnGraduationBoss(targetLayer: number) {
        // Mark that a graduation boss is active
        this.graduationBossActive = true;

        // Stop normal enemy spawning
        if (this.spawnTimer) {
            this.spawnTimer.remove();
            this.spawnTimer = null;
        }

        // Determine boss type based on target layer
        // Layer 1 = green, Layer 2 = yellow, Layer 3 = blue, Layer 4 = purple
        // Layer 5 = green (wraps), Layer 6 = yellow (wraps)
        let bossType = "";
        let points = 0;
        let health = 0;
        let speed = 0;

        const layerColorMap: Record<number, "green" | "yellow" | "blue" | "purple"> = {
            1: "green",
            2: "yellow",
            3: "blue",
            4: "purple",
            5: "green",
            6: "yellow",
        };

        bossType = layerColorMap[targetLayer] || "green";

        // Base stats based on layer
        if (targetLayer === 1) {
            points = 50;
            health = 4;
            speed = 100;
        } else if (targetLayer === 2) {
            points = 100;
            health = 6;
            speed = 150;
        } else if (targetLayer === 3) {
            points = 150;
            health = 10;
            speed = 120;
        } else if (targetLayer === 4) {
            points = 250;
            health = 12;
            speed = 150;
        } else if (targetLayer === 5) {
            points = 300;
            health = 14;
            speed = 140;
        } else if (targetLayer === 6) {
            points = 400;
            health = 16;
            speed = 130;
        }

        const gameWidth = this.scale.width;
        const gameHeight = this.scale.height;
        // Position boss at fixed location (right side, center) - they will track player movement
        const x = gameWidth * 0.85; // 85% from left (near right edge)
        const y = gameHeight / 2; // Center vertically

        // Use enemy service for graduation boss sprite and name
        const bossSpriteKey = getGraduationBossSpriteKey(targetLayer, this.prestigeLevel);
        const bossName = getGraduationBossName(targetLayer, this.prestigeLevel);
        const boss = this.physics.add.sprite(x, y, bossSpriteKey);
        // Reduced scaling: 1.5x instead of 3x for better visual balance
        boss.setScale(0.7 * 1.5 * MOBILE_SCALE);
        boss.setImmovable(false); // Boss can move to maintain line of sight

        // Scale boss health and speed based on target layer using enemy service
        const layerConfig =
            LAYER_CONFIG[targetLayer as keyof typeof LAYER_CONFIG];
        const healthMultiplier = layerConfig?.healthMultiplier || 1.0;
        const corruptionDifficultyMultiplier =
            1.0; // Corruption system removed
        
        // Use enemy service for stat scaling (10x toughness for graduation bosses)
        const baseEnemyStats = getEnemyStats(
            health,
            speed,
            points,
            this.prestigeLevel,
            healthMultiplier * 10 // 10x toughness for graduation bosses
        );
        
        const scaledHealth = Math.ceil(
            baseEnemyStats.health *
                this.prestigeDifficultyMultiplier *
                corruptionDifficultyMultiplier
        );
        const speedMultiplier = layerConfig?.bossSpeedMultiplier || 1.0;
        const scaledSpeed = Math.max(
            40,
            Math.round(
                baseEnemyStats.speed *
                    speedMultiplier *
                    this.prestigeDifficultyMultiplier *
                    corruptionDifficultyMultiplier *
                    this.settingsEnemySpeedMultiplier
            )
        );
        
        // Use scaled points from enemy service
        const scaledPoints = Math.round(
            baseEnemyStats.points *
                this.prestigeScoreMultiplier
        );

        boss.setData("type", bossType);
        boss.setData("points", scaledPoints);
        boss.setData("displayName", bossName);
        boss.setData("speed", scaledSpeed);
        boss.setData("health", scaledHealth);
        boss.setData("maxHealth", scaledHealth);
        boss.setData("canShoot", true); // Graduation bosses can shoot
        boss.setData("isBoss", true);
        boss.setData("isGraduationBoss", true); // Mark as graduation boss
        boss.setData("bossKey", bossSpriteKey); // Store boss sprite key for identification
        boss.setData("lastShockwave", 0); // Track last shockwave time
        // Varying damage levels based on layer (1-6)
        const bossDamage = Math.min(1 + (targetLayer * 0.5), 4); // 1.5, 2, 2.5, 3, 3.5, 4 damage
        boss.setData("damage", bossDamage);
        boss.setData("lastShot", 0);
        boss.setData("baseShootInterval", 1500);
        boss.setData("shootInterval", 1500);
        // Assault/rest phase system
        boss.setData("assaultPhase", "assault"); // "assault" or "rest"
        boss.setData("assaultStartTime", this.time.now);
        boss.setData("assaultDuration", 15000); // 15 seconds assault (increased from 10)
        boss.setData("restDuration", 3000); // 3 seconds rest (reduced from 5)
        boss.setData("lastPawnSpawn", 0);
        boss.setData("pawnSpawnInterval", 3000); // Spawn pawn every 3 seconds during assault
        boss.setData(
            "behaviors",
            this.getBehaviorsForEnemy(
                bossType as keyof typeof ENEMY_CONFIG,
                false,
                true
            )
        );

        // Create health bar for graduation boss
        this.createEnemyHealthBar(boss);

        this.enemies.add(boss);

        // Boss movement is handled in update loop to maintain line of sight
        boss.setVelocity(0, 0);

        // Visual effect - screen flash and shake
        this.applyCameraFlash(300, 255, 0, 0); // Red flash
        this.applyCameraShake(500, 0.02);

        // Show announcement card for boss incoming (using enemy service name)
        this.showAnnouncement(
            "GRADUATION BOSS INCOMING!",
            `Defeat ${bossName} to advance`,
            0xff0000 // Red color for warning
        );
        
        // Trigger boss encounter dialogue
        if (targetLayer === 6 && this.prestigeLevel === 8) {
            this.triggerDialogue('final_boss_encounter');
        } else {
            this.triggerDialogue('boss_encounter');
        }

        // Show warning message (could be enhanced with UI text)
        console.log(
            `GRADUATION BOSS SPAWNED! Defeat it to advance to ${
                LAYER_CONFIG[targetLayer as keyof typeof LAYER_CONFIG].name
            }`
        );
    }

    private handleBulletEnemyCollision(
        bullet: Phaser.Types.Physics.Arcade.GameObjectWithBody,
        enemy: Phaser.Types.Physics.Arcade.GameObjectWithBody
    ) {
        const b = bullet as Phaser.Physics.Arcade.Sprite;
        const e = enemy as Phaser.Physics.Arcade.Sprite;

        if (this.gameOver) {
            b.destroy();
            return;
        }

        // Prevent enemies from being hit before they appear on screen
        // Enemies spawn from the right and move left, so check if right edge is on screen
        const gameWidth = this.scale.width;
        const enemyHalfWidth = e.displayWidth / 2;
        // Enemy is only hittable when its right edge has entered the screen (x + halfWidth <= gameWidth)
        if (e.x + enemyHalfWidth > gameWidth) {
            return; // Enemy hasn't appeared on screen yet, ignore collision
        }

        // Check piercing mechanics (bullet tier or kernel/hero grade)
        const bulletPiercing = b.getData('piercing') as number || 0;
        const pierceCount = b.getData('pierceCount') as number || 0;
        const hasTierPiercing = bulletPiercing !== 0;
        const hasOtherPiercing = this.kernelBulletPiercing || this.heroGradeBulletPiercing;
        
        // Handle piercing logic
        if (hasTierPiercing || hasOtherPiercing) {
            const enemyUid = e.getData("uid");
            const lastHitEnemy = b.getData("lastHitEnemy");
            const lastHitTime = (b.getData("lastHitTime") as number) || 0;
            
            // Prevent hitting same enemy multiple times quickly
            if (enemyUid === lastHitEnemy && this.time.now - lastHitTime < 80) {
                return;
            }
            b.setData("lastHitEnemy", enemyUid);
            b.setData("lastHitTime", this.time.now);
            
            // Check if bullet should continue piercing (tier-based)
            if (hasTierPiercing) {
                if (bulletPiercing === -1) {
                    // Infinite piercing (Tier 5) - bullet never stops
                    // Don't destroy bullet
                } else if (bulletPiercing > 0) {
                    // Limited piercing (Tier 4) - pierce through N enemies
                    const newPierceCount = pierceCount + 1;
                    b.setData('pierceCount', newPierceCount);
                    
                    if (newPierceCount >= bulletPiercing) {
                        // Reached pierce limit, destroy bullet
                        b.destroy();
                    }
                    // Otherwise, bullet continues
                }
            }
            // If only other piercing (kernel/hero grade), keep existing behavior
        } else {
            // No piercing - remove bullet
            b.destroy();
        }

        // Get enemy data
        const enemyType = e.getData("type");
        const points = e.getData("points");
        let health = e.getData("health") || 1;
        const isBoss = e.getData("isBoss") || false;

        // Deal damage (apply shield drone reduction if applicable)
        this.shotsHitThisRun += 1;
        const shieldReduction = this.getShieldDamageReduction(e);
        
        // Get bullet tier damage multiplier
        const bulletDamageMultiplier = b.getData('damageMultiplier') as number || 1.0;
        const damage = 1 * (1 - shieldReduction) * this.heroGradeDamageMultiplier * bulletDamageMultiplier;
        const isCriticalHit = isBoss || this.comboMultiplier >= 3;
        const damageText = Number.isInteger(damage)
            ? `${damage}`
            : damage.toFixed(1);
        this.createFloatingText(
            e.x,
            e.y - 20,
            damageText,
            {
                color: isCriticalHit ? "#ff4d6d" : "#ffd166",
                fontSize: isCriticalHit ? 22 : 16,
            }
        );
        health -= damage;
        e.setData("health", health);

        // Update health bar
        this.updateEnemyHealthBar(e);

        if (health <= 0) {
            // Track enemy kill for boss spawn requirement
            if (!isBoss) {
                this.enemiesKilledThisLayer += 1;
            }
            // Check if this was a graduation boss BEFORE adding score
            const isGraduationBoss = e.getData("isGraduationBoss") || false;
            this.totalEnemiesDefeated += 1;
            this.createFloatingText(
                e.x,
                e.y - 40,
                "COMBO +1",
                { color: "#00ff99", fontSize: 14 }
            );
            if (this.totalEnemiesDefeated === 1) {
                this.unlockAchievementWithAnnouncement("first_blood");
            }
            if (this.activeChallenge?.id === "clean_10_enemies") {
                this.challengeKills += 1;
            }
            if (
                this.activeChallenge?.id === "defeat_5_blue" &&
                enemyType === "blue"
            ) {
                this.challengeBlueKills += 1;
            }

            // If graduation boss, set flag to false BEFORE addScore (which calls updateLayer)
            if (isGraduationBoss) {
                this.graduationBossActive = false;
            }

            // Destroy health bar and special effects before destroying enemy
            const healthBarBg = e.getData("healthBarBg") as
                | Phaser.GameObjects.Graphics
                | undefined;
            const healthBarFill = e.getData("healthBarFill") as
                | Phaser.GameObjects.Graphics
                | undefined;
            if (healthBarBg) healthBarBg.destroy();
            if (healthBarFill) healthBarFill.destroy();
            this.cleanupEnemyEffects(e);

            // Enemy destroyed
            this.addScore(points * this.comboMultiplier);
            this.adaptationKillCount += 1;
            if (enemyType !== "green" || isBoss || isGraduationBoss) {
                // this.lastRiskyKillTime = this.time.now; // Unused
            }
            if (isBoss || isGraduationBoss) {
                // Corruption system removed
                this.runBossesDefeated += 1;
                this.triggerHaptic(
                    SENSORY_ESCALATION.hapticFeedback.onBossDefeat
                );
                if (this.runBossesDefeated === 1) {
                    this.unlockAchievementWithAnnouncement("first_boss");
                }
                this.updateAchievementProgress(
                    "defeat_5_bosses",
                    this.runBossesDefeated,
                    5
                );
                if (this.runBossesDefeated >= 5) {
                    this.unlockAchievementWithAnnouncement("defeat_5_bosses");
                }
            }
            if (!isBoss && !isGraduationBoss) {
                this.triggerHaptic(
                    SENSORY_ESCALATION.hapticFeedback.onEnemyKill
                );
                
                // Update challenge tracking for current gameplay
                if (this.activeChallenge?.id === "clean_10_enemies") {
                    this.challengeKills += 1;
                }
                if (this.activeChallenge?.id === "defeat_5_blue" && enemyType === "blue") {
                    this.challengeBlueKills += 1;
                }
            }

            // Create explosion based on enemy type and layer
            const explosionSize = this.getExplosionSize(enemyType, isBoss);
            this.createExplosion(e.x, e.y, explosionSize);

            // Show announcement for regular boss defeat (non-graduation)
            if (isBoss && !isGraduationBoss) {
                this.showAnnouncement(
                    "BOSS DEFEATED!",
                    `+${points} points`,
                    0x00ff00 // Green color for success
                );
            }

            // If fragmenter was defeated, spawn fragments
            if (
                enemyType === "purpleFragmenter" &&
                !e.getData("isFragment")
            ) {
                const fragmentConfig = ENEMY_CONFIG.purpleFragmenter;
                this.spawnFragments(
                    e,
                    fragmentConfig.fragmentsOnDeath,
                    fragmentConfig.fragmentType as keyof typeof ENEMY_CONFIG,
                    fragmentConfig.fragmentHealth
                );
            }

            // If graduation boss was defeated, advance to next layer
            if (isGraduationBoss) {
                // Trigger boss defeat story dialogue
                const isFinalBoss = this.prestigeLevel === 8 && this.currentLayer === 6;
                if (isFinalBoss) {
                    this.triggerStoryDialogue('final_boss');
                } else {
                    this.triggerStoryDialogue('boss_defeat');
                }
                
                // Check if we should advance to next prestige or if we're at final boss
                if (this.prestigeLevel === PRESTIGE_CONFIG.maxPrestige && this.currentLayer === MAX_LAYER) {
                    // Final boss defeated - game complete!
                    this.handleFinalBossDefeat();
                } else if (this.pendingLayer >= MAX_LAYER) {
                    // Advance to next prestige (if not at max)
                    if (this.prestigeLevel < PRESTIGE_CONFIG.maxPrestige) {
                        this.enterPrestigeMode(e.x, e.y);
                    } else {
                        // At max prestige, cannot advance further
                        this.showAnnouncement(
                            "MAX PRESTIGE REACHED!",
                            "You have reached the final prestige level",
                            0xffff00
                        );
                    }
                } else {
                    // Advance to the pending layer
                    // Safety check: ensure pendingLayer is valid
                    if (this.pendingLayer < 1 || this.pendingLayer > MAX_LAYER) {
                        console.error(`[Layer Progression] Invalid pendingLayer: ${this.pendingLayer}, resetting to currentLayer`);
                        this.pendingLayer = this.currentLayer;
                    }
                    this.currentLayer = this.pendingLayer;
                    this.graduationBossActive = false; // Clear the flag so layer updates can continue
                if (this.pendingLayer > this.deepestLayer) {
                    this.deepestLayer = this.pendingLayer;
                }
                    
                    // Increase firepower slightly with each layer (5% per layer, up to 30% at layer 6)
                    // Layer 1: 1.0, Layer 2: 1.05, Layer 3: 1.10, Layer 4: 1.15, Layer 5: 1.20, Layer 6: 1.25
                    this.layerFireRateMultiplier = 1.0 + (this.currentLayer - 1) * 0.05;
                    console.log(`[Firepower] Layer ${this.currentLayer} - Fire rate multiplier: ${this.layerFireRateMultiplier.toFixed(2)}`);
                    if (this.currentLayer >= 2) {
                        this.unlockAchievementWithAnnouncement("layer_2");
                    }
                    if (this.currentLayer >= 5) {
                        this.unlockAchievementWithAnnouncement("layer_5");
                    }
                    if (this.currentLayer >= 3 && !this.tookDamageBeforeLayer3) {
                        this.unlockAchievementWithAnnouncement(
                            "clean_run_layer_3"
                        );
                    }
                    if (
                        this.currentLayer >= MAX_LAYER &&
                        this.timeToReachLayer6 === null
                    ) {
                        this.timeToReachLayer6 = Math.round(
                            (this.time.now - this.runStartTime) / 1000
                        );
                    }
                this.registry.set("currentLayer", this.currentLayer);
                this.registry.set(
                    "layerName",
                            LAYER_CONFIG[
                                this.currentLayer as keyof typeof LAYER_CONFIG
                            ].name
                    );
                    
                    // Update story state and trigger layer complete dialogue
                    updateStoryState(this.prestigeLevel, this.currentLayer);
                    
                    // Update rank and check for rank achievement
                    const previousLayer = this.currentLayer - 1;
                    const previousPrestige = this.prestigeLevel;
                    const newRank = updateCurrentRank(this.prestigeLevel, this.currentLayer);
                    const rankMilestone = calculateRankMilestone(
                        this.prestigeLevel,
                        this.currentLayer,
                        previousPrestige,
                        previousLayer
                    );
                    
                    if (rankMilestone) {
                        // New rank achieved!
                        this.showRankAchievement(rankMilestone);
                    }
                    
                    if (newRank) {
                        this.registry.set("currentRank", newRank.name);
                    }
                    
                    this.time.delayedCall(500, () => {
                        this.triggerStoryDialogue('layer_complete');
                    });

                    // Reset enemy count tracking for new layer
                    this.enemiesKilledThisLayer = 0;
                    // Note: enemiesRequiredBeforeBoss is for regular bosses, not graduation bosses
                    // Graduation boss requirement is calculated in updateLayer() as: 30 + (15 * nextLayer)
                    
                    // Resume enemy spawning for the new layer
                    this.updateSpawnTimer();
                    
                    // Debug: Log layer advancement
                    console.log(`[Layer Progression] Advanced to layer ${this.currentLayer}. Next layer will be ${this.currentLayer + 1}. Need to kill ${30 + (15 * (this.currentLayer + 1))} enemies to spawn next graduation boss.`);
                    
                    // Force update layer to check if we can progress further
                    // Note: This won't spawn the next boss immediately since enemiesKilledThisLayer is 0,
                    // but it will be called again as enemies are killed and score increases
                    this.updateLayer();

                // Update grid color when layer changes
                this.drawBackgroundGrid();

                // Visual effect for layer transition
                    this.applyCameraFlash(500, 0, 255, 0); // Green flash for success
                    this.applyCameraShake(300, 0.01);

                // Show announcement card for boss defeated and layer advanced
                const layerName =
                            LAYER_CONFIG[
                                this.currentLayer as keyof typeof LAYER_CONFIG
                            ].name;
                this.showAnnouncement(
                    "BOSS DEFEATED!",
                    `Advanced to ${layerName}`,
                    0x00ff00 // Green color for success
                );

                // Debug log to verify layer progression
                console.log(
                    `Graduation boss defeated! Advanced to layer ${
                        this.currentLayer
                    }: ${
                        LAYER_CONFIG[
                            this.currentLayer as keyof typeof LAYER_CONFIG
                        ].name
                    }`
                );

                // Spawn multiple power-ups as reward
                for (let i = 0; i < 3; i++) {
                    this.time.delayedCall(i * 200, () => {
                        this.spawnLivesPowerUp(
                            e.x + Phaser.Math.Between(-50, 50),
                            e.y + Phaser.Math.Between(-50, 50)
                        );
                    });
                    }
                }
            } else {
                // Normal enemy - spawn power-ups as usual
                // Spawn lives power-up (35% chance from all enemies)
                if (Math.random() < POWERUP_CONFIG.livesSpawnChance) {
                    this.spawnLivesPowerUp(e.x, e.y);
                }
                // Spawn firepower power-up (15% chance from all enemies)
                else if (Math.random() < POWERUP_CONFIG.firepowerSpawnChance) {
                    this.spawnFirepowerPowerUp(e.x, e.y);
                }
                // Spawn invisibility power-up (15% chance from all enemies)
                else if (
                    Math.random() < POWERUP_CONFIG.invisibilitySpawnChance
                ) {
                    this.spawnInvisibilityPowerUp(e.x, e.y);
                }
                // Spawn other power-ups from purple/red enemies (25% chance)
                else if (
                    (enemyType === "purple" || enemyType === "red" || isBoss) &&
                    Math.random() < POWERUP_CONFIG.spawnChance
                ) {
                    this.spawnPowerUp(e.x, e.y);
                }
            }

            // Remove enemy
            e.destroy();
        } else {
            // Enemy still alive - show small hit effect
            this.createExplosion(e.x, e.y, "small");
        }
    }

    private getExplosionSize(
        enemyType: string,
        isBoss: boolean
    ): "small" | "medium" | "large" {
        if (isBoss || enemyType === "red") {
            return "large";
        } else if (enemyType === "purple" || enemyType === "blue") {
            return "medium";
        } else if (this.currentLayer >= 5) {
            return "medium"; // Bigger explosions in later layers
        }
        return "small";
    }

    private handlePlayerEnemyBulletCollision(
        _player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
        bullet: Phaser.Types.Physics.Arcade.GameObjectWithBody
    ) {
        if (this.gameOver) return;

        const b = bullet as Phaser.Physics.Arcade.Sprite;

        // Remove bullet
        b.destroy();

        // Track enemy bullet hit for upgrade degradation
        this.enemyBulletHits++;
        
        // Every 2 hits, reduce firepower and fire rate upgrades
        if (this.enemyBulletHits >= 2 && (this.firepowerLevel > 0 || this.baseFireRateMultiplier < 1)) {
            this.degradeFirepowerUpgrades();
            this.enemyBulletHits = 0; // Reset counter
        }

        // Calculate damage based on bullet type
        // Regular bullet: 1 health bar
        // Boss/graduation boss bullet: 2 health bars
        // Prestige 5+ boss bullet: 2.5 health bars
        let bulletDamage = 1;
        const isBossBullet = b.getData("isBossBullet") || false;
        const isGraduationBossBullet = b.getData("isGraduationBossBullet") || false;
        
        if (isBossBullet || isGraduationBossBullet) {
            if (this.prestigeLevel >= 5) {
                bulletDamage = 2.5; // Prestige 5+ boss bullets deal 2.5 health bars
            } else {
                bulletDamage = 2; // Regular boss bullets deal 2 health bars
            }
        }
        
        // Take damage
        this.takeDamage(bulletDamage);
    }

    private handlePlayerEnemyCollision(
        _player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
        _enemy: Phaser.Types.Physics.Arcade.GameObjectWithBody
    ) {
        if (this.gameOver) return;
        const enemy = _enemy as Phaser.Physics.Arcade.Sprite;
        
        // Prevent enemies from colliding with player before they appear on screen
        // Enemies spawn from the right and move left, so check if right edge is on screen
        const gameWidth = this.scale.width;
        const enemyHalfWidth = enemy.displayWidth / 2;
        // Enemy is only collidable when its right edge has entered the screen (x + halfWidth <= gameWidth)
        if (enemy.x + enemyHalfWidth > gameWidth) {
            return; // Enemy hasn't appeared on screen yet, ignore collision
        }
        
        // Graduation bosses don't cause collision damage - they only shoot
        const isGraduationBoss = enemy.getData("isGraduationBoss") || false;
        if (isGraduationBoss) {
            // Graduation bosses pass through player without causing damage
            // They only damage via bullets
            return;
        }
        
        const damageMultiplier =
            (enemy.getData("damageMultiplier") as number) || 1;

        // Push player and enemy apart to prevent passing through
        const dx = this.player.x - enemy.x;
        const dy = this.player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const pushForce = 5;
            const pushX = (dx / distance) * pushForce;
            const pushY = (dy / distance) * pushForce;
            
            // Push player away from enemy
            this.player.setVelocity(
                this.player.body!.velocity.x + pushX,
                this.player.body!.velocity.y + pushY
            );
            
            // Push enemy away from player
            enemy.setVelocity(
                enemy.body!.velocity.x - pushX,
                enemy.body!.velocity.y - pushY
            );
        }

        // Player takes damage (loses 1 life)
        // The takeDamage() method already creates an explosion at player position
        this.takeDamage(damageMultiplier);

        // Enemy is NOT destroyed - it continues to exist and can damage player again
        // This makes enemies more dangerous and requires players to shoot them
    }

    private takeDamage(damageMultiplier: number = 1) {
        // God mode makes player invincible
        if (this.godModeActive) {
            return;
        }
        // If player has invisibility power-up, ignore damage
        if (this.isInvisible) {
            return; // Invisible, no damage taken
        }
        
        // Check for shield mini-me (reduces damage by 1)
        let hasShield = false;
        let hasDecoy = false;
        this.miniMes.children.entries.forEach((miniMeObj) => {
            const miniMe = miniMeObj as Phaser.Physics.Arcade.Sprite;
            if (!miniMe.active) return;
            const type = miniMe.getData('type') as MiniMeType;
            if (type === 'shield') {
                hasShield = true;
            }
            if (type === 'decoy') {
                hasDecoy = true;
            }
        });
        
        // Apply shield damage reduction
        if (hasShield) {
            damageMultiplier = Math.max(0, damageMultiplier - MINI_ME_CONFIG.behaviors.shield.damageReduction);
            if (damageMultiplier <= 0) {
                // Shield absorbed all damage
                this.createFloatingText(this.player.x, this.player.y - 20, "SHIELD BLOCKED", { color: "#00ffff" });
                return;
            }
        }
        
        // Apply decoy damage reduction (30% less damage)
        if (hasDecoy) {
            damageMultiplier *= (1 - MINI_ME_CONFIG.behaviors.decoy.damageReduction);
        }

        // Prevent multiple damage calls within invincibility period
        // This matches the visual flash duration and prevents rapid damage
        const timeSinceLastHit = this.time.now - this.lastHitTime;
        const invincibilityWindow = 1000 + this.challengeInvincibilityBonusMs;
        if (timeSinceLastHit < invincibilityWindow) {
            return; // Still in invincibility period, ignore damage
        }

        // Safety check: ensure healthBars is a valid number
        if (this.healthBars <= 0) {
            return; // Already dead, don't process damage
        }

        // Reset combo
        this.comboMultiplier = 1;
        this.tookDamageThisRun = true;
        if (this.activeChallenge) {
            this.challengeDamageTaken = true;
        }
        if (this.currentLayer < 3) {
            this.tookDamageBeforeLayer3 = true;
        }
        this.lastHitTime = this.time.now;
        this.registry.set("comboMultiplier", this.comboMultiplier);
        if (
            this.activeChallenge?.id === "clean_10_enemies" ||
            this.activeChallenge?.id === "dodge_25_bullets"
        ) {
            this.failChallenge();
        }

        // Create explosion
        this.createExplosion(this.player.x, this.player.y, "medium");
        this.triggerHaptic(SENSORY_ESCALATION.hapticFeedback.onDamage);

        // Calculate health bar damage based on damage multiplier
        const previousHealthBars = this.healthBars;
        let damageBars = 1; // Default: -1 health bar
        
        // Boss/graduation boss bullets: -2 health bars
        if (damageMultiplier >= 2) {
            damageBars = 2;
        }
        // Prestige 5+ boss bullets: -2.5 health bars (rounds down to 2, but can accumulate)
        if (damageMultiplier >= 2.5 && this.prestigeLevel >= 5) {
            // For prestige 5+, boss bullets deal 2.5 bars
            // We'll track fractional damage and apply it as whole bars
            this.kernelDamageAccumulator += 2.5 / this.kernelHealthMultiplier;
            const accumulatedDamage = Math.floor(this.kernelDamageAccumulator);
            if (accumulatedDamage > 0) {
                damageBars = accumulatedDamage;
                this.kernelDamageAccumulator -= accumulatedDamage;
            } else {
                damageBars = 2; // At least 2 bars for prestige 5+ boss bullets
            }
        } else {
            // Regular damage: just apply the damage multiplier as whole bars
            damageBars = Math.floor(damageMultiplier);
        }
        
        this.hitsTakenThisRun += 1;
        if (damageBars > 0) {
            this.totalHealthBarsLost += damageBars;
        }
        this.healthBars = Math.max(0, this.healthBars - damageBars);
        this.healthBars = Math.min(this.healthBars, PLAYER_CONFIG.maxHealthBars); // Cap at max
        this.registry.set("healthBars", this.healthBars);

        // Debug: Log health bars to help diagnose
        console.log(
            `Player took damage. Health Bars: ${previousHealthBars} -> ${this.healthBars} (damage: ${damageBars} bars)`
        );

        // Game over only when health bars equals 0
        if (this.healthBars === 0) {
            // Game over
            this.gameOver = true;
            
            // Clean up mini-mes on game over
            this.cleanupMiniMes();
            this.registry.set("finalScore", this.score);
            this.registry.set("gameOver", true);
            this.registry.set("deepestLayer", this.deepestLayer);
            this.lastRunMetrics = this.buildRunMetrics();
            this.registry.set("runMetrics", this.lastRunMetrics);
            this.activeChallenge = null;
            this.registry.set("challengeActive", false);
            this.registry.set("challengeProgress", 0);
            const kernelResult = recordKernelRunStats({
                deepestLayer: this.deepestLayer,
                kills: this.totalEnemiesDefeated,
                hitsTaken: this.hitsTakenThisRun,
                shotsFired: this.shotsFiredThisRun,
                shotsHit: this.shotsHitThisRun,
            });
            kernelResult.newlyUnlocked.forEach((key) => {
                const kernel = PLAYER_KERNELS[key];
                this.showAnnouncement(
                    "KERNEL UNLOCKED",
                    kernel?.name ?? key,
                    0x00ffff
                );
            });
            addLifetimeScore(this.score);
            addLifetimePlayMs(this.time.now - this.runStartTime);
            const lifetime = getLifetimeStats();
            
            // Check and unlock hero grades
            const newlyUnlockedGrades = checkAndUnlockHeroGrades({
                lifetimePlayMs: lifetime.lifetimePlayMs,
                lifetimeEnemiesDefeated: lifetime.lifetimeEnemiesDefeated,
                lifetimeScore: lifetime.lifetimeScore,
                deepestLayer: this.deepestLayer,
            });
            newlyUnlockedGrades.forEach((grade) => {
                const gradeConfig = getHeroGradeConfig(grade);
                this.showAnnouncement(
                    "HERO GRADE UNLOCKED",
                    `${gradeConfig.name}: ${gradeConfig.specialFeature.name}`,
                    0x00ff99
                );
            });
            this.updateAchievementProgress(
                "1m_points",
                lifetime.lifetimeScore,
                1000000
            );
            this.updateAchievementProgress(
                "1000_hours",
                lifetime.lifetimePlayMs / 3600000,
                1000
            );
            if (lifetime.lifetimeScore >= 1000000) {
                this.unlockAchievementWithAnnouncement("1m_points");
            }
            if (lifetime.lifetimePlayMs >= 1000 * 3600000) {
                this.unlockAchievementWithAnnouncement("1000_hours");
            }

            const runStats = this.registry.get("runStats") as
                | {
                      survivalTimeMs?: number;
                      enemiesDefeated?: number;
                      shotsFired?: number;
                      shotsHit?: number;
                      accuracy?: number;
                      bulletsDodged?: number;
                      powerUpsCollected?: number;
                      livesUsed?: number;
                      deaths?: number;
                      maxCorruption?: number;
                      bestCombo?: number;
                  }
                | undefined;
            if (runStats) {
                recordProfileRunStats({
                    survivalTimeMs: runStats.survivalTimeMs ?? 0,
                    finalScore: this.score,
                    deepestLayer: this.deepestLayer,
                    maxCorruption: runStats.maxCorruption ?? 0,
                    enemiesDefeated: runStats.enemiesDefeated ?? 0,
                    accuracy: runStats.accuracy ?? 0,
                    bestCombo: runStats.bestCombo ?? 1,
                    livesUsed: runStats.livesUsed ?? 0,
                    powerUpsCollected: runStats.powerUpsCollected ?? 0,
                    deaths: runStats.deaths ?? 0,
                });
            }

            // Stop all movement and touch controls
            this.player.setVelocity(0, 0);
            this.enemies.children.entries.forEach((enemy) => {
                const e = enemy as Phaser.Physics.Arcade.Sprite;
                if (e.body) {
                    e.setData("preReviveVelocity", {
                        x: e.body.velocity.x,
                        y: e.body.velocity.y,
                    });
                }
                e.setVelocity(0, 0);
            });
            this.enemyBullets.children.entries.forEach((bullet) => {
                const b = bullet as Phaser.Physics.Arcade.Sprite;
                b.setVelocity(0, 0);
            });

            // Remove health bars so they don't linger after game over
            this.destroyAllEnemyHealthBars();

            // Pause physics
            this.physics.pause();

            // Submit score after a short delay
            this.time.delayedCall(500, () => {
                const walletAddress = this.registry.get("walletAddress");
                const runMetrics = this.lastRunMetrics ?? this.buildRunMetrics();
                // Communicate to UIScene via game events
                const uiScene = this.scene.get("UIScene");
                if (uiScene && uiScene.scene.isActive()) {
                    const currentRank = this.registry.get("currentRank") as string || getRankName(this.prestigeLevel, this.currentLayer);
                    uiScene.events.emit(
                        "submitScore",
                        this.score,
                        walletAddress,
                        this.deepestLayer,
                        this.prestigeLevel,
                        runMetrics,
                        this.currentModifierKey,
                        currentRank
                    );
                }
            });
        } else {
            // Brief invincibility flash
            this.tweens.add({
                targets: this.player,
                alpha: 0.5,
                duration: 100,
                yoyo: true,
                repeat: 3,
                onComplete: () => {
                    this.player.setAlpha(1);
                },
            });
        }
    }

    /**
     * Handle collision between enemies and mini-mes
     */
    private handleEnemyMiniMeCollision(
        _enemy: Phaser.Types.Physics.Arcade.GameObjectWithBody,
        _miniMe: Phaser.Types.Physics.Arcade.GameObjectWithBody
    ) {
        const miniMe = _miniMe as Phaser.Physics.Arcade.Sprite;
        const hits = (miniMe.getData('hits') as number) || 0;
        const newHits = hits + 1;
        miniMe.setData('hits', newHits);
        
        if (newHits >= MINI_ME_CONFIG.maxHits) {
            // Mini-me destroyed
            this.destroyMiniMe(miniMe);
        }
    }

    private createEnemyHealthBar(enemy: Phaser.Physics.Arcade.Sprite) {
        // Create health bar container (background + fill)
        const healthBarBg = this.add.graphics();
        const healthBarFill = this.add.graphics();

        // Store health bar graphics with enemy
        enemy.setData("healthBarBg", healthBarBg);
        enemy.setData("healthBarFill", healthBarFill);

        // Initial health bar update
        this.updateEnemyHealthBar(enemy);
    }

    private destroyEnemyHealthBar(enemy: Phaser.Physics.Arcade.Sprite) {
        const healthBarBg = enemy.getData("healthBarBg") as
            | Phaser.GameObjects.Graphics
            | undefined;
        const healthBarFill = enemy.getData("healthBarFill") as
            | Phaser.GameObjects.Graphics
            | undefined;

        if (healthBarBg) healthBarBg.destroy();
        if (healthBarFill) healthBarFill.destroy();

        enemy.setData("healthBarBg", undefined);
        enemy.setData("healthBarFill", undefined);
    }

    private destroyAllEnemyHealthBars() {
        this.enemies.children.entries.forEach((enemy) => {
            const sprite = enemy as Phaser.Physics.Arcade.Sprite;
            this.destroyEnemyHealthBar(sprite);
            this.cleanupEnemyEffects(sprite);
        });
    }

    private updateEnemyHealthBar(enemy: Phaser.Physics.Arcade.Sprite) {
        const healthBarBg = enemy.getData("healthBarBg") as
            | Phaser.GameObjects.Graphics
            | undefined;
        const healthBarFill = enemy.getData("healthBarFill") as
            | Phaser.GameObjects.Graphics
            | undefined;

        if (!healthBarBg || !healthBarFill || !enemy.active) {
            return;
        }

        const health = enemy.getData("health") || 1;
        const maxHealth = enemy.getData("maxHealth") || 1;
        const healthPercent = Math.max(0, Math.min(1, health / maxHealth));

        const healthBarWidth = 40 * MOBILE_SCALE;
        const healthBarHeight = 4 * MOBILE_SCALE;
        const offsetY = -25 * MOBILE_SCALE; // Position above enemy

        // Clear previous drawings
        healthBarBg.clear();
        healthBarFill.clear();

        // Draw background (dark red/black)
        healthBarBg.fillStyle(0x330000, 0.8);
        healthBarBg.fillRect(
            enemy.x - healthBarWidth / 2,
            enemy.y + offsetY,
            healthBarWidth,
            healthBarHeight
        );

        // Draw health fill (green, transitioning to red/yellow as health decreases)
        let fillColor = 0x00ff00; // Green
        if (healthPercent < 0.3) {
            fillColor = 0xff0000; // Red when low
        } else if (healthPercent < 0.6) {
            fillColor = 0xffff00; // Yellow when medium
        }

        healthBarFill.fillStyle(fillColor, 1);
        healthBarFill.fillRect(
            enemy.x - healthBarWidth / 2,
            enemy.y + offsetY,
            healthBarWidth * healthPercent,
            healthBarHeight
        );
    }

    private showInstructionModal() {
        const width = this.scale.width;
        const height = this.scale.height;
        const uiScale = MOBILE_SCALE < 1.0 ? 0.8 : 1.0;

        // Pause the game
        this.physics.pause();
        this.isPaused = true;
        this.registry.set("isPaused", true);

        // Dark overlay
        const overlay = this.add.rectangle(
            width / 2,
            height / 2,
            width,
            height,
            0x000000,
            0.8
        );

        // Modal background
        const modalWidth = Math.min(500 * uiScale, width - 40);
        const modalHeight = Math.min(400 * uiScale, height - 40);
        const modalBg = this.add.rectangle(
            width / 2,
            height / 2,
            modalWidth,
            modalHeight,
            0x000000,
            0.95
        );
        modalBg.setStrokeStyle(3, 0x00ff00);

        // Title
        const title = this.add.text(
            width / 2,
            height / 2 - 150 * uiScale,
            "HOW TO PLAY",
            {
                fontFamily: UI_CONFIG.logoFont,
                fontSize: 32 * uiScale,
                color: UI_CONFIG.neonGreen,
                stroke: "#000000",
                strokeThickness: 4,
            }
        );
        title.setOrigin(0.5, 0.5);

        // Instructions
        const instructions =
            MOBILE_SCALE < 1.0
                ? [
                      "Joystick: Move",
                      "Fire button: Shoot",
                      "Defeat enemies to score points",
                      "Collect power-ups for bonuses",
                      "Survive as long as possible!",
                  ]
                : [
                      "WASD or Arrow Keys: Move",
                      "Spacebar or Click: Shoot",
                      "Defeat enemies to score points",
                      "Collect power-ups for bonuses",
                      "Survive as long as possible!",
                  ];

        const instructionTexts: Phaser.GameObjects.Text[] = [];
        instructions.forEach((instruction, index) => {
            const text = this.add.text(
                width / 2,
                height / 2 - 80 * uiScale + index * 30 * uiScale,
                instruction,
                {
                    fontFamily: UI_CONFIG.menuFont,
                    fontSize: 16 * uiScale,
                    color: UI_CONFIG.neonGreen,
                    stroke: "#000000",
                    strokeThickness: 2,
                }
            );
            text.setOrigin(0.5, 0.5);
            instructionTexts.push(text);
        });

        // Mobile landscape mode advice
        let landscapeText: Phaser.GameObjects.Text | null = null;
        if (MOBILE_SCALE < 1.0) {
            landscapeText = this.add.text(
                width / 2,
                height / 2 + 100 * uiScale,
                "💡 Landscape mode recommended for better gameplay",
                {
                    fontFamily: UI_CONFIG.menuFont,
                    fontSize: 14 * uiScale,
                    color: "#ffaa00", // Orange/yellow for attention
                    stroke: "#000000",
                    strokeThickness: 2,
                    align: "center",
                }
            );
            landscapeText.setOrigin(0.5, 0.5);
        }

        // Start button
        const buttonWidth = 200 * uiScale;
        const buttonHeight = 50 * uiScale;
        const buttonBg = this.add.rectangle(
            width / 2,
            height / 2 + 150 * uiScale,
            buttonWidth,
            buttonHeight,
            0x001100,
            0.9
        );
        buttonBg.setStrokeStyle(2, 0x00ff00);
        buttonBg.setInteractive({ useHandCursor: true });

        const buttonText = this.add.text(
            width / 2,
            height / 2 + 150 * uiScale,
            "START GAME",
            {
                fontFamily: UI_CONFIG.menuFont,
                fontSize: 20 * uiScale,
                color: UI_CONFIG.neonGreen,
                stroke: "#000000",
                strokeThickness: 2,
            }
        );
        buttonText.setOrigin(0.5, 0.5);

        // Hover effects
        buttonBg.on("pointerover", () => {
            buttonBg.setFillStyle(0x003300, 0.95);
            buttonBg.setStrokeStyle(3, 0x00ff00);
        });

        buttonBg.on("pointerout", () => {
            buttonBg.setFillStyle(0x001100, 0.9);
            buttonBg.setStrokeStyle(2, 0x00ff00);
        });

        // Click handler to start game
        const startGame = () => {
            // Remove all modal elements
            overlay.destroy();
            modalBg.destroy();
            title.destroy();
            instructionTexts.forEach((text) => text.destroy());
            if (landscapeText) landscapeText.destroy();
            buttonBg.destroy();
            buttonText.destroy();

            // Resume game
            this.physics.resume();
            this.isPaused = false;
            this.registry.set("isPaused", false);
        };

        buttonBg.on("pointerdown", startGame);

        // Also allow ESC or Space to start
        const escKey = this.input.keyboard!.addKey(
            Phaser.Input.Keyboard.KeyCodes.ESC
        );
        const spaceKey = this.input.keyboard!.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE
        );

        const handleKey = () => {
            escKey.off("down", handleKey);
            spaceKey.off("down", handleKey);
            startGame();
        };

        escKey.once("down", handleKey);
        spaceKey.once("down", handleKey);
    }

    private showAnnouncement(
        title: string,
        subtitle: string,
        color: number = 0x00ff00
    ) {
        const width = this.scale.width;
        const height = this.scale.height;
        const uiScale = MOBILE_SCALE < 1.0 ? 0.8 : 1.0;

        // Create announcement container
        const cardWidth = 400 * uiScale;
        const cardHeight = 120 * uiScale;
        const cardX = width / 2;
        const cardY = height / 2 - 100 * uiScale;

        // Background card
        const cardBg = this.add.rectangle(
            cardX,
            cardY,
            cardWidth,
            cardHeight,
            0x000000,
            0.95
        );
        cardBg.setStrokeStyle(3, color);

        // Title text
        const titleText = this.add.text(cardX, cardY - 20 * uiScale, title, {
            fontFamily: UI_CONFIG.logoFont,
            fontSize: 32 * uiScale,
            color: `#${color.toString(16).padStart(6, "0")}`,
            stroke: "#000000",
            strokeThickness: 4,
        });
        titleText.setOrigin(0.5, 0.5);

        // Subtitle text
        const subtitleText = this.add.text(
            cardX,
            cardY + 20 * uiScale,
            subtitle,
            {
                fontFamily: UI_CONFIG.menuFont,
                fontSize: 18 * uiScale,
                color: UI_CONFIG.neonGreen,
                stroke: "#000000",
                strokeThickness: 2,
            }
        );
        subtitleText.setOrigin(0.5, 0.5);

        // Create container for easy cleanup
        const container = this.add.container(0, 0, [
            cardBg,
            titleText,
            subtitleText,
        ]);

        // Animation: slide in from top, then fade out
        container.setY(-200);
        container.setAlpha(0);

        // Slide in
        this.tweens.add({
            targets: container,
            y: cardY,
            alpha: 1,
            duration: 500,
            ease: "Back.easeOut",
        });

        // Hold for 3 seconds, then fade out
        this.tweens.add({
            targets: container,
            alpha: 0,
            y: cardY - 50,
            duration: 500,
            delay: 3000,
            ease: "Power2",
            onComplete: () => {
                container.destroy();
            },
        });
    }

    private createExplosion(
        x: number,
        y: number,
        size: "small" | "medium" | "large"
    ) {
        let key = "smallFire";
        let scale = 0.5;

        if (size === "large") {
            key = "bigFire";
            scale = 0.8;
        } else if (size === "medium") {
            key = "mediumFire";
            scale = 0.6;
        }

        const explosion = this.add.sprite(x, y, key);
        explosion.setScale(scale * MOBILE_SCALE);

        this.tweens.add({
            targets: explosion,
            alpha: 0,
            scale: explosion.scale * 1.5,
            duration: 300,
            onComplete: () => {
                explosion.destroy();
            },
        });
    }

    private enemyShoot(
        enemy: Phaser.Physics.Arcade.Sprite,
        angleOffset: number = 0
    ) {
        const bullet = this.enemyBullets.get(
            enemy.x - 30,
            enemy.y
        ) as Phaser.Physics.Arcade.Sprite;

        if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.setScale(0.4 * MOBILE_SCALE);

            // Assign different bullet sprites based on enemy type for variety
            const enemyType = enemy.getData("type") as keyof typeof ENEMY_CONFIG;
            const enemyIsBoss = !!enemy.getData("isBoss");
            
            // Use different sprites to showcase different impacts
            if (enemyIsBoss) {
                bullet.setTexture("yellowBullet");
                bullet.setScale(0.6 * MOBILE_SCALE);
            } else if (enemyType === "blue" || enemyType === "blueBuff") {
                bullet.setTexture("blueBullet");
            } else if (enemyType === "purple" || enemyType === "purpleFragmenter") {
                bullet.setTexture("yellowBullet");
            } else {
                const bulletVariant = Math.random() < 0.5 ? "greenBullet1" : "greenBullet2";
                bullet.setTexture(bulletVariant);
            }

            const behaviors =
                (enemy.getData("behaviors") as string[] | undefined) || [];
            const target = this.getTargetPositionForEnemy(behaviors, enemyIsBoss);
            const angle =
                Phaser.Math.Angle.Between(
                    enemy.x,
                    enemy.y,
                    target.x,
                    target.y
                ) + Phaser.Math.DegToRad(angleOffset);

            const config =
                ENEMY_CONFIG[
                    enemy.getData("type") as keyof typeof ENEMY_CONFIG
                ];
            const bulletSpeed =
                ((config as any).bulletSpeed || 200) *
                this.prestigeDifficultyMultiplier *
                1.0; // Corruption system removed
            const damageMultiplier =
                (enemy.getData("damageMultiplier") as number) || 1;
            // Use boss damage if set (for graduation bosses with varying damage levels)
            const bossDamage = enemy.getData("damage") as number | undefined;
            let finalDamage = bossDamage !== undefined ? bossDamage : damageMultiplier;
            
            // Make boss bullets 3x more lethal and scale with progression
            const bulletIsBoss = !!enemy.getData("isBoss");
            const bulletIsGraduationBoss = !!enemy.getData("isGraduationBoss");
            const bulletBossKey = enemy.getData("bossKey") as string | undefined;
            const bulletIsFinalBoss = bulletBossKey === "finalBoss";
            
            if (bulletIsBoss || bulletIsGraduationBoss || bulletIsFinalBoss) {
                // Base 3x multiplier
                finalDamage = finalDamage * 3;
                // Scale with layer progression (add 0.5x per layer after layer 1)
                const layerMultiplier = 1 + ((this.currentLayer - 1) * 0.5);
                finalDamage = finalDamage * layerMultiplier;
                // Scale with prestige level (add 0.3x per prestige)
                if (this.prestigeLevel > 0) {
                    finalDamage = finalDamage * (1 + (this.prestigeLevel * 0.3));
                }
            }

            const velocityX = Math.cos(angle) * bulletSpeed;
            const velocityY = Math.sin(angle) * bulletSpeed;
            bullet.setVelocity(velocityX, velocityY);
            bullet.setData("damageMultiplier", finalDamage);
        }
    }

    private fireShockwave(enemy: Phaser.Physics.Arcade.Sprite) {
        // Create moving zigzag blue shockwave from boss to player
        const startX = enemy.x;
        const startY = enemy.y;
        const targetX = this.player.x;
        const targetY = this.player.y;
        
        // Calculate angle and distance
        const dx = targetX - startX;
        const dy = targetY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        // Shockwave speed (fast but dodgeable)
        const shockwaveSpeed = 400; // Fast but not instant
        const travelTime = (distance / shockwaveSpeed) * 1000; // Time in ms
        
        // Create graphics object for zigzag visual
        const graphics = this.add.graphics();
        graphics.lineStyle(4, 0x00ffff, 0.9); // Bright cyan/blue
        graphics.setBlendMode(Phaser.BlendModes.ADD);
        graphics.setDepth(1000); // Render on top
        
        // Create physics sprite for collision (starts at boss position)
        const shockwave = this.physics.add.sprite(startX, startY, "blueBullet");
        shockwave.setScale(0.1); // Small invisible sprite for collision
        shockwave.setAlpha(0); // Invisible
        shockwave.setData("graphics", graphics);
        shockwave.setData("targetX", targetX);
        shockwave.setData("targetY", targetY);
        shockwave.setData("startX", startX);
        shockwave.setData("startY", startY);
        shockwave.setData("startTime", this.time.now);
        shockwave.setData("travelTime", travelTime);
        shockwave.setData("angle", angle);
        shockwave.setData("distance", distance);
        this.shockwaves.add(shockwave);
        
        // Set velocity to move towards player
        const velocityX = Math.cos(angle) * shockwaveSpeed;
        const velocityY = Math.sin(angle) * shockwaveSpeed;
        shockwave.setVelocity(velocityX, velocityY);
        
        // Update zigzag visual on each frame
        const updateZigzag = () => {
            if (!shockwave.active) {
                graphics.destroy();
                return;
            }
            
            const currentX = shockwave.x;
            const currentY = shockwave.y;
            const elapsed = this.time.now - shockwave.getData("startTime");
            const progress = Math.min(elapsed / travelTime, 1);
            
            // Clear previous frame
            graphics.clear();
            graphics.lineStyle(4, 0x00ffff, 0.9);
            
            // Calculate zigzag path from start to current position
            const segments = 8;
            const path: { x: number; y: number }[] = [];
            path.push({ x: startX, y: startY });
            
            for (let i = 1; i < segments; i++) {
                const t = i / segments;
                const baseX = Phaser.Math.Linear(startX, currentX, t);
                const baseY = Phaser.Math.Linear(startY, currentY, t);
                // Add zigzag offset perpendicular to the line
                const perpX = -Math.sin(angle);
                const perpY = Math.cos(angle);
                const zigzagAmount = 30 * Math.sin(i * Math.PI * 2 + progress * Math.PI * 4); // Animated zigzag
                path.push({
                    x: baseX + perpX * zigzagAmount,
                    y: baseY + perpY * zigzagAmount
                });
            }
            path.push({ x: currentX, y: currentY });
            
            // Draw the zigzag line
            graphics.moveTo(path[0].x, path[0].y);
            for (let i = 1; i < path.length; i++) {
                graphics.lineTo(path[i].x, path[i].y);
            }
            graphics.strokePath();
        };
        
        // Update zigzag visual every frame
        const updateEvent = this.time.addEvent({
            delay: 16, // ~60fps
            callback: updateZigzag,
            repeat: Math.ceil(travelTime / 16)
        });
        shockwave.setData("updateEvent", updateEvent);
        
        // Clean up when shockwave reaches target or goes off screen
        this.time.delayedCall(travelTime + 500, () => {
            if (shockwave.active) {
                graphics.destroy();
                const updateEvt = shockwave.getData("updateEvent");
                if (updateEvt) updateEvt.remove();
                shockwave.destroy();
            }
        });
    }

    private handlePlayerShockwaveCollision(
        _player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
        shockwave: Phaser.Types.Physics.Arcade.GameObjectWithBody
    ) {
        if (this.gameOver) return;
        if (this.isStunned) return; // Already stunned
        
        const s = shockwave as Phaser.Physics.Arcade.Sprite;
        
        // Stun player for 3 seconds
        this.isStunned = true;
        this.stunEndTime = this.time.now + 3000;
        
        // Visual feedback
        this.createFloatingText(
            this.player.x,
            this.player.y - 30,
            "STUNNED!",
            { color: "#00ffff", fontSize: 24 }
        );
        
        // Stop player movement
        this.player.setVelocity(0, 0);
        
        // Destroy shockwave
        const graphics = s.getData("graphics") as Phaser.GameObjects.Graphics;
        const updateEvt = s.getData("updateEvent") as Phaser.Time.TimerEvent | undefined;
        if (graphics) {
            graphics.destroy();
        }
        if (updateEvt) {
            updateEvt.remove();
        }
        s.destroy();
    }

    private degradeFirepowerUpgrades() {
        // Only degrade if player has upgrades
        if (this.firepowerLevel <= 0 && this.baseFireRateMultiplier >= 1) {
            return;
        }

        // Get the power-up config to know how much to reduce
        const firepowerConfig = POWERUP_CONFIG.types.firepower;
        
        // Reduce firepower level (minimum 0)
        if (this.firepowerLevel > 0) {
            const reduction = firepowerConfig.firepowerLevel;
            this.firepowerLevel = Math.max(0, this.firepowerLevel - reduction);
        }
        
        // Reduce fire rate multiplier (make firing slower)
        // fireRateMultiplier is used as: shootInterval = baseInterval / fireRateMultiplier
        // So higher multiplier = slower firing, lower multiplier = faster firing
        // Since firepower upgrades use fireRateMultiplier: 1.0, they don't change fire rate
        // But we still want to reduce fire rate when hit as a penalty
        // We'll increase the multiplier to make firing slower
        if (this.baseFireRateMultiplier < 1) {
            // If base is below 1 (from other upgrades like fireRate power-up), restore it
            const previousBase = this.baseFireRateMultiplier;
            this.baseFireRateMultiplier = Math.min(1, this.baseFireRateMultiplier / firepowerConfig.fireRateMultiplier);
            // Recalculate fireRateMultiplier preserving other multipliers
            const ratio = this.baseFireRateMultiplier / previousBase;
            this.fireRateMultiplier = this.fireRateMultiplier * ratio;
        } else {
            // If firepower upgrades don't affect fire rate (1.0), we still reduce fire rate as penalty
            // Increase multiplier by 10% to make firing 10% slower (multiplier closer to 1.0 or above)
            this.fireRateMultiplier = Math.min(2.0, this.fireRateMultiplier * 1.1);
        }
        
        // Reduce total upgrade count
        this.totalFirepowerUpgrades = Math.max(0, this.totalFirepowerUpgrades - 1);
        
        // Visual feedback
        this.createFloatingText(
            this.player.x,
            this.player.y - 50,
            "UPGRADE DEGRADED!",
            { color: "#ff6600", fontSize: 20 }
        );
    }

    /*
    private updateBossRhythmicMovement(boss: Phaser.Physics.Arcade.Sprite, baseSpeed: number) {
        const currentTime = this.time.now;
        const rhythmTime = boss.getData("rhythmTime") || currentTime;
        const rhythmPhase = boss.getData("rhythmPhase") || 0;
        
        // Update phase based on time (rhythmic pattern)
        const timeDelta = currentTime - rhythmTime;
        const newPhase = (rhythmPhase + timeDelta * 0.001) % (Math.PI * 2);
        boss.setData("rhythmPhase", newPhase);
        boss.setData("rhythmTime", currentTime);
        
        // Calculate target position (player position)
        const targetX = this.player.x;
        const targetY = this.player.y;
        
        // Base angle toward player
        const baseAngle = Phaser.Math.Angle.Between(
            boss.x,
            boss.y,
            targetX,
            targetY
        );
        
        // Add rhythmic oscillation for more dynamic movement
        const rhythmIntensity = Math.sin(newPhase) * 0.3;
        const rhythmOffset = Math.cos(newPhase * 2) * 0.2;
        
        // Calculate rhythmic movement offset
        const perpAngle = baseAngle + Math.PI / 2;
        
        // Speed variation based on rhythm (faster when closer to player)
        const distanceToPlayer = Phaser.Math.Distance.Between(
            boss.x, boss.y, targetX, targetY
        );
        const speedMultiplier = 1 + (1 - Math.min(distanceToPlayer / 400, 1)) * 0.5;
        const effectiveSpeed = baseSpeed * (1 + rhythmIntensity * 0.3) * speedMultiplier;
        
        // Calculate final velocity with rhythmic pattern
        const finalAngle = baseAngle + rhythmOffset * 0.5;
        const velocityX = Math.cos(finalAngle) * effectiveSpeed;
        const velocityY = Math.sin(finalAngle) * effectiveSpeed;
        
        // Add perpendicular component for figure-8 pattern
        const perpVelocityX = Math.cos(perpAngle) * rhythmIntensity * baseSpeed * 0.4;
        const perpVelocityY = Math.sin(perpAngle) * rhythmIntensity * baseSpeed * 0.4;
        
        boss.setVelocity(velocityX + perpVelocityX, velocityY + perpVelocityY);
    }
    */

    private spawnPowerUp(x: number, y: number) {
        // Random power-up type (excluding lives - lives are spawned separately)
        const types = Object.keys(POWERUP_CONFIG.types).filter(
            (type) => type !== "lives"
        ) as Array<keyof typeof POWERUP_CONFIG.types>;
        const randomType = types[Phaser.Math.Between(0, types.length - 1)];
        const powerUpConfig = POWERUP_CONFIG.types[randomType];

        const powerUp = this.physics.add.sprite(x, y, powerUpConfig.key);
        powerUp.setScale(0.4 * MOBILE_SCALE);
        powerUp.setData("type", randomType);
        powerUp.setData("config", powerUpConfig);

        // Add floating animation
        this.tweens.add({
            targets: powerUp,
            y: powerUp.y - 10,
            duration: 500,
            yoyo: true,
            repeat: -1,
        });

        // Set timer to destroy power-up after 6 seconds if not consumed
        // Start fade-out at 5 seconds, destroy at 6 seconds
        const fadeOutTimer = this.time.delayedCall(5000, () => {
            if (powerUp.active) {
                // Fade out effect
                this.tweens.add({
                    targets: powerUp,
                    alpha: 0,
                    duration: 1000,
                });
            }
        });

        const despawnTimer = this.time.delayedCall(6000, () => {
            if (powerUp && powerUp.active) {
                powerUp.destroy();
            }
        });
        powerUp.setData("despawnTimer", despawnTimer);
        powerUp.setData("fadeOutTimer", fadeOutTimer);

        this.powerUps.add(powerUp);
    }

    private spawnLivesPowerUp(x: number, y: number) {
        const powerUpConfig = POWERUP_CONFIG.types.lives;

        const powerUp = this.physics.add.sprite(x, y, powerUpConfig.key);
        powerUp.setScale(0.5 * MOBILE_SCALE); // Slightly larger for visibility
        powerUp.setTint(0xff00ff); // Purple/magenta tint to distinguish from other power-ups
        powerUp.setData("type", "lives");
        powerUp.setData("config", powerUpConfig);

        // Add floating animation
        this.tweens.add({
            targets: powerUp,
            y: powerUp.y - 10,
            duration: 500,
            yoyo: true,
            repeat: -1,
        });

        // Set timer to destroy power-up after 6 seconds if not consumed
        // Start fade-out at 5 seconds, destroy at 6 seconds
        const fadeOutTimer = this.time.delayedCall(5000, () => {
            if (powerUp.active) {
                // Fade out effect
                this.tweens.add({
                    targets: powerUp,
                    alpha: 0,
                    duration: 1000,
                });
            }
        });

        const despawnTimer = this.time.delayedCall(6000, () => {
            if (powerUp && powerUp.active) {
                powerUp.destroy();
            }
        });
        powerUp.setData("despawnTimer", despawnTimer);
        powerUp.setData("fadeOutTimer", fadeOutTimer);

        this.powerUps.add(powerUp);
    }

    private spawnFirepowerPowerUp(x: number, y: number) {
        const powerUpConfig = POWERUP_CONFIG.types.firepower;

        const powerUp = this.physics.add.sprite(x, y, powerUpConfig.key);
        powerUp.setScale(0.5 * MOBILE_SCALE);
        powerUp.setTint(0xffff00); // Yellow tint to distinguish as firepower power-up
        powerUp.setData("type", "firepower");
        powerUp.setData("config", powerUpConfig);

        // Add floating animation
        this.tweens.add({
            targets: powerUp,
            y: powerUp.y - 10,
            duration: 500,
            yoyo: true,
            repeat: -1,
        });

        // Set timer to destroy power-up after 6 seconds if not consumed
        // Start fade-out at 5 seconds, destroy at 6 seconds
        const fadeOutTimer = this.time.delayedCall(5000, () => {
            if (powerUp.active) {
                // Fade out effect
                this.tweens.add({
                    targets: powerUp,
                    alpha: 0,
                    duration: 1000,
                });
            }
        });

        const despawnTimer = this.time.delayedCall(6000, () => {
            if (powerUp && powerUp.active) {
                powerUp.destroy();
            }
        });
        powerUp.setData("despawnTimer", despawnTimer);
        powerUp.setData("fadeOutTimer", fadeOutTimer);

        this.powerUps.add(powerUp);
    }

    private spawnInvisibilityPowerUp(x: number, y: number) {
        const powerUpConfig = POWERUP_CONFIG.types.invisibility;

        const powerUp = this.physics.add.sprite(x, y, powerUpConfig.key);
        powerUp.setScale(0.5 * MOBILE_SCALE);
        powerUp.setTint(0x00ffff); // Cyan tint to distinguish as invisibility power-up
        powerUp.setData("type", "invisibility");
        powerUp.setData("config", powerUpConfig);

        // Add floating animation
        this.tweens.add({
            targets: powerUp,
            y: powerUp.y - 10,
            duration: 500,
            yoyo: true,
            repeat: -1,
        });

        // Set timer to destroy power-up after 6 seconds if not consumed
        // Start fade-out at 5 seconds, destroy at 6 seconds
        const fadeOutTimer = this.time.delayedCall(5000, () => {
            if (powerUp.active) {
                // Fade out effect
                this.tweens.add({
                    targets: powerUp,
                    alpha: 0,
                    duration: 1000,
                });
            }
        });

        const despawnTimer = this.time.delayedCall(6000, () => {
            if (powerUp && powerUp.active) {
                powerUp.destroy();
            }
        });
        powerUp.setData("despawnTimer", despawnTimer);
        powerUp.setData("fadeOutTimer", fadeOutTimer);

        this.powerUps.add(powerUp);
    }

    private handlePlayerPowerUpCollision(
        _player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
        powerUp: Phaser.Types.Physics.Arcade.GameObjectWithBody
    ) {
        const p = powerUp as Phaser.Physics.Arcade.Sprite;
        const powerUpType = p.getData("type") as string;
        const config = p.getData("config");

        // Clear despawn and fade-out timers if they exist
        const despawnTimer = p.getData("despawnTimer") as
            | Phaser.Time.TimerEvent
            | undefined;
        if (despawnTimer) {
            despawnTimer.remove();
        }

        const fadeOutTimer = p.getData("fadeOutTimer") as
            | Phaser.Time.TimerEvent
            | undefined;
        if (fadeOutTimer) {
            fadeOutTimer.remove();
        }

        // Remove power-up
        p.destroy();
        this.triggerHaptic(
            SENSORY_ESCALATION.hapticFeedback.onPowerUpCollect
        );
        this.powerUpsCollected += 1;

        // Apply power-up effect
        if (powerUpType === "speed") {
            // Cancel existing speed timer if any
            if (this.powerUpTimers.has("speed")) {
                this.powerUpTimers.get("speed")!.remove();
            }
            this.speedMultiplier = config.speedMultiplier;
            const timer = this.time.delayedCall(config.duration, () => {
                this.speedMultiplier = 1;
                this.powerUpTimers.delete("speed");
            });
            this.powerUpTimers.set("speed", timer);
        } else if (powerUpType === "fireRate") {
            // Cancel existing fireRate timer if any
            if (this.powerUpTimers.has("fireRate")) {
                this.powerUpTimers.get("fireRate")!.remove();
            }
            this.fireRateMultiplier = config.fireRateMultiplier;
            const timer = this.time.delayedCall(config.duration, () => {
                this.fireRateMultiplier = 1;
                this.powerUpTimers.delete("fireRate");
            });
            this.powerUpTimers.set("fireRate", timer);
        } else if (powerUpType === "score") {
            // Cancel existing score timer if any
            if (this.powerUpTimers.has("score")) {
                this.powerUpTimers.get("score")!.remove();
            }
            this.scoreMultiplier = config.scoreMultiplier;
            const timer = this.time.delayedCall(config.duration, () => {
                this.scoreMultiplier = 1;
                this.powerUpTimers.delete("score");
            });
            this.powerUpTimers.set("score", timer);
        } else if (powerUpType === "autoShoot") {
            // Cancel existing autoShoot timer if any
            if (this.powerUpTimers.has("autoShoot")) {
                this.powerUpTimers.get("autoShoot")!.remove();
            }
            this.autoShootEnabled = true;
            const timer = this.time.delayedCall(config.duration, () => {
                this.autoShootEnabled = false;
                this.powerUpTimers.delete("autoShoot");
            });
            this.powerUpTimers.set("autoShoot", timer);
        } else if (powerUpType === "lives") {
            // Restore 1 health bar (max 5)
            if (this.healthBars < PLAYER_CONFIG.maxHealthBars) {
                this.healthBars = Math.min(this.healthBars + 1, PLAYER_CONFIG.maxHealthBars);
                this.registry.set("healthBars", this.healthBars);
                this.createFloatingText(this.player.x, this.player.y - 20, "+1 Health", { color: "#00ff00" });
            }
            // Health restoration already handled above
            this.updateAchievementProgress(
                "collect_5_lives",
                this.runLifeOrbs,
                5
            );
            if (this.runLifeOrbs >= 5) {
                this.unlockAchievementWithAnnouncement("collect_5_lives");
            }

            // Visual feedback with larger explosion
            this.createExplosion(this.player.x, this.player.y, "medium");
            return; // Early return - no need for small explosion
        } else if (powerUpType === "firepower") {
            // Cancel existing firepower timer if any
            if (this.powerUpTimers.has("firepower")) {
                this.powerUpTimers.get("firepower")!.remove();
            }

            // Track total upgrades collected
            this.totalFirepowerUpgrades++;

            // Increase firepower level and fire rate
            this.firepowerLevel += config.firepowerLevel;
            this.baseFireRateMultiplier *= config.fireRateMultiplier;
            this.fireRateMultiplier *= config.fireRateMultiplier;

            const timer = this.time.delayedCall(config.duration, () => {
                // Reset firepower level (round down to handle fractional levels)
                this.firepowerLevel = Math.max(
                    0,
                    Math.floor(
                        (this.firepowerLevel - config.firepowerLevel) * 10
                    ) / 10
                );
                // Reset fire rate multiplier (divide by the same amount)
                this.baseFireRateMultiplier /= config.fireRateMultiplier;
                this.fireRateMultiplier /= config.fireRateMultiplier;
                this.totalFirepowerUpgrades = Math.max(0, this.totalFirepowerUpgrades - 1);
                this.powerUpTimers.delete("firepower");
            });
            this.powerUpTimers.set("firepower", timer);

            // Visual feedback with larger explosion
            this.createExplosion(this.player.x, this.player.y, "medium");
            return; // Early return - no need for small explosion
        } else if (powerUpType === "invisibility") {
            // Cancel existing invisibility timer if any
            if (this.powerUpTimers.has("invisibility")) {
                this.powerUpTimers.get("invisibility")!.remove();
            }
            this.isInvisible = true;

            // Visual effect: make player semi-transparent and pulsing
            this.tweens.add({
                targets: this.player,
                alpha: 0.3,
                duration: 200,
                yoyo: true,
                repeat: -1,
            });

            const timer = this.time.delayedCall(config.duration, () => {
                this.isInvisible = false;
                this.player.setAlpha(1);
                this.powerUpTimers.delete("invisibility");
            });
            this.powerUpTimers.set("invisibility", timer);

            // Visual feedback with larger explosion
            this.createExplosion(this.player.x, this.player.y, "medium");
            return; // Early return - no need for small explosion
        }

        // Visual feedback
        this.createExplosion(this.player.x, this.player.y, "small");
    }

    private addScore(points: number) {
        if (this.gameOver) {
            return;
        }
        const previousScore = this.score;
        // Apply score multiplier from power-ups
        const corruptionMultiplier =
            1.0 * this.challengeCorruptionMultiplier; // Corruption system removed
        const velocity = this.player.body?.velocity;
        const speedRatio = velocity
            ? Math.min(2, Math.hypot(velocity.x, velocity.y) / PLAYER_CONFIG.speed)
            : 0;
        const speedScoreMultiplier =
            this.modifierSpeedScoreRatio > 0
                ? 1 + this.modifierSpeedScoreRatio * speedRatio
                : 1;

        const adjustedPoints = Math.floor(
            points *
                this.scoreMultiplier *
                this.comboMultiplier *
                this.prestigeScoreMultiplier *
                corruptionMultiplier *
                this.overclockScoreMultiplier *
                this.challengeScoreMultiplier *
                this.sessionScoreMultiplier *
                this.sessionStreakScoreMultiplier *
                speedScoreMultiplier
        );
        this.score += adjustedPoints;
        const milestoneStep = 500;
        if (
            Math.floor(previousScore / milestoneStep) <
            Math.floor(this.score / milestoneStep)
        ) {
            const milestone =
                Math.floor(this.score / milestoneStep) * milestoneStep;
            this.createFloatingText(
                this.scale.width / 2,
                120,
                `${milestone.toLocaleString()} POINTS!`,
                {
                    color: "#ffffff",
                    fontSize: 20,
                    duration: 900,
                    fixed: true,
                }
            );
        }
        this.comboMultiplier += 0.1;
        this.lastHitTime = this.time.now;
        this.peakComboMultiplier = Math.max(
            this.peakComboMultiplier,
            this.comboMultiplier
        );

        this.updateAchievementProgress("10k_points", this.score, 10000);
        this.updateAchievementProgress("100k_points", this.score, 100000);
        if (this.score >= 10000) {
            this.unlockAchievementWithAnnouncement("10k_points");
        }
        if (this.score >= 100000) {
            this.unlockAchievementWithAnnouncement("100k_points");
        }
        this.updateAchievementProgress("5x_combo", this.comboMultiplier, 5);
        if (this.comboMultiplier >= 5) {
            this.unlockAchievementWithAnnouncement("5x_combo");
        }

        if (this.comboMultiplier > 2) {
            // Corruption system removed
        }

        // Update layer based on score
        this.updateLayer();

        // Update progress bar
        this.drawProgressBar();

        this.registry.set("score", this.score);
        this.registry.set("comboMultiplier", this.comboMultiplier);
    }

    private updateLayer() {
        // Don't progress if a graduation boss is active
        if (this.graduationBossActive) {
            return;
        }

        // Determine what layer the score qualifies for
        let scoreBasedLayer = 1;
        for (let layer = MAX_LAYER; layer >= 1; layer--) {
            if (
                this.score >=
                LAYER_CONFIG[layer as keyof typeof LAYER_CONFIG].scoreThreshold
            ) {
                scoreBasedLayer = layer;
                break;
            }
        }

        // ENFORCE SEQUENTIAL PROGRESSION: Only allow advancing to the next layer (currentLayer + 1)
        // Players must defeat each graduation boss before moving to the next layer
        const nextLayer = this.currentLayer + 1;
        
        // Only check for graduation boss if:
        // 1. Score qualifies for at least the next layer
        // 2. We haven't reached max layer yet
        if (scoreBasedLayer >= nextLayer && nextLayer <= MAX_LAYER) {
            // Require enemies before graduation boss can spawn
            const requiredEnemiesForGraduation = 30 + (15 * nextLayer);
            if (this.enemiesKilledThisLayer >= requiredEnemiesForGraduation) {
                if (nextLayer === MAX_LAYER) {
                    console.log(`[Prestige] Spawning final graduation boss for layer ${nextLayer} - will trigger prestige when defeated`);
                } else {
                    console.log(`[Graduation Boss] Spawning graduation boss for layer ${nextLayer}`);
                }
                this.pendingLayer = nextLayer;
                this.spawnGraduationBoss(nextLayer);
                // Reset counter after graduation boss spawn
                this.enemiesKilledThisLayer = 0;
            } else {
                // Debug: Log progress towards next graduation boss
                const progress = Math.floor((this.enemiesKilledThisLayer / requiredEnemiesForGraduation) * 100);
                if (this.enemiesKilledThisLayer % 5 === 0 || progress >= 90) {
                    console.log(`[Layer Progression] Layer ${this.currentLayer} -> ${nextLayer}: ${this.enemiesKilledThisLayer}/${requiredEnemiesForGraduation} enemies (${progress}%)`);
                }
            }
        } else if (nextLayer <= MAX_LAYER) {
            // Debug: Log why next boss isn't spawning
            const nextLayerConfig = LAYER_CONFIG[nextLayer as keyof typeof LAYER_CONFIG];
            if (nextLayerConfig) {
                const scoreThreshold = nextLayerConfig.scoreThreshold;
                console.log(`[Layer Progression] Need ${scoreThreshold - this.score} more score to qualify for layer ${nextLayer} (current: ${this.score}, required: ${scoreThreshold})`);
            }
        } else {
            // nextLayer > MAX_LAYER - we've reached the maximum layer
            // This should only happen if currentLayer is already MAX_LAYER
            // In this case, we should still allow enemies to spawn for the current layer
            if (this.currentLayer === MAX_LAYER) {
                // At max layer, enemies should continue spawning normally
                // No need to log anything, this is expected behavior
            } else {
                console.warn(`[Layer Progression] Invalid state: currentLayer=${this.currentLayer}, nextLayer=${nextLayer}, MAX_LAYER=${MAX_LAYER}`);
            }
        }
    }

    public togglePause() {
        this.isPaused = !this.isPaused;
        this.registry.set("isPaused", this.isPaused);

        if (this.isPaused) {
            this.physics.pause();
            // Stop all movement and touch controls
            this.player.setData("prePauseVelocity", {
                x: this.player.body?.velocity.x || 0,
                y: this.player.body?.velocity.y || 0,
            });
            this.player.setVelocity(0, 0);
            this.enemies.children.entries.forEach((enemy) => {
                const e = enemy as Phaser.Physics.Arcade.Sprite;
                e.setData("prePauseVelocity", {
                    x: e.body?.velocity.x || 0,
                    y: e.body?.velocity.y || 0,
                });
                e.setVelocity(0, 0);
            });
            this.bullets.children.entries.forEach((bullet) => {
                const b = bullet as Phaser.Physics.Arcade.Sprite;
                b.setData("prePauseVelocity", {
                    x: b.body?.velocity.x || 0,
                    y: b.body?.velocity.y || 0,
                });
                b.setVelocity(0, 0);
            });
            this.enemyBullets.children.entries.forEach((bullet) => {
                const b = bullet as Phaser.Physics.Arcade.Sprite;
                b.setData("prePauseVelocity", {
                    x: b.body?.velocity.x || 0,
                    y: b.body?.velocity.y || 0,
                });
                b.setVelocity(0, 0);
            });
            this.powerUps.children.entries.forEach((powerUp) => {
                const p = powerUp as Phaser.Physics.Arcade.Sprite;
                p.setData("prePauseVelocity", {
                    x: p.body?.velocity.x || 0,
                    y: p.body?.velocity.y || 0,
                });
                p.setVelocity(0, 0);
            });
            this.isFiringButtonDown = false;
            this.firePointerId = null;
            this.fireButton?.setFillStyle(0x003300, 0.8);
            this.resetJoystick();
        } else {
            this.physics.resume();
            const playerVelocity = this.player.getData("prePauseVelocity") as
                | { x: number; y: number }
                | undefined;
            if (playerVelocity) {
                this.player.setVelocity(playerVelocity.x, playerVelocity.y);
            }
            this.enemies.children.entries.forEach((enemy) => {
                const e = enemy as Phaser.Physics.Arcade.Sprite;
                const velocity = e.getData("prePauseVelocity") as
                    | { x: number; y: number }
                    | undefined;
                if (velocity) {
                    e.setVelocity(velocity.x, velocity.y);
                }
            });
            this.bullets.children.entries.forEach((bullet) => {
                const b = bullet as Phaser.Physics.Arcade.Sprite;
                const velocity = b.getData("prePauseVelocity") as
                    | { x: number; y: number }
                    | undefined;
                if (velocity) {
                    b.setVelocity(velocity.x, velocity.y);
                }
            });
            this.enemyBullets.children.entries.forEach((bullet) => {
                const b = bullet as Phaser.Physics.Arcade.Sprite;
                const velocity = b.getData("prePauseVelocity") as
                    | { x: number; y: number }
                    | undefined;
                if (velocity) {
                    b.setVelocity(velocity.x, velocity.y);
                }
            });
            this.powerUps.children.entries.forEach((powerUp) => {
                const p = powerUp as Phaser.Physics.Arcade.Sprite;
                const velocity = p.getData("prePauseVelocity") as
                    | { x: number; y: number }
                    | undefined;
                if (velocity) {
                    p.setVelocity(velocity.x, velocity.y);
                }
            });
        }
    }

    public returnToMenu() {
        // Call the returnToMenu function from the game instance
        const game = this.game as any;
        if (game.returnToMenu) {
            game.returnToMenu();
        } else {
            // Fallback: use window.location
            window.location.href = "/";
        }
    }

    public restart() {
        // Reset game state
        this.gameOver = false;
        this.isPaused = false;
        this.score = 0;
        this.comboMultiplier = 1;
        this.lastHitTime = 0;
        this.nextSpawnTime = SPAWN_CONFIG.initialDelay;
        this.currentLayer = 1;
        this.deepestLayer = 1;
        this.layerFireRateMultiplier = 1; // Reset to base for new game
        this.prestigeLevel = 0;
        this.prestigeDifficultyMultiplier = 1;
        this.prestigeScoreMultiplier = 1;
        this.prestigeResetAvailable = true;
        
        // Initialize prestige state in registry
        this.registry.set("currentPrestige", 0);
        this.registry.set("previousPrestige", -1);
        this.registry.set("prestigeCompleted", new Array(9).fill(false));
        this.registry.set("isPrimeSentinel", false);
        // Corruption system removed
        // this.lastNoHitRewardTime = 0; // Unused
        // this.lastRiskyKillTime = 0; // Unused
        // Corruption system removed
        this.overclockActive = false;
        this.overclockReadyAt = 0;
        this.overclockActivations = 0;
        this.overclockScoreMultiplier = 1;
        this.overclockFireRateMultiplier = 1;
        this.overclockSpeedMultiplier = 1;
        this.overclockSpawnMultiplier = 1;
        this.currentDifficultyPhase = "phase1";
        this.lastMovementSampleTime = 0;
        this.lastEdgeSampleTime = 0;
        this.lastCoordinatedFireTime = 0;
        // Health bars are always 5 (not affected by hero grade multiplier)
        this.healthBars = PLAYER_CONFIG.initialHealthBars;
        this.registry.set("healthBars", this.healthBars);
        this.powerUpsCollected = 0;
        this.totalBulletsDodged = 0;
        this.totalHealthBarsLost = 0;
        this.lastRunStatsUpdate = 0;
        this.graduationBossActive = false;
        this.pendingLayer = 1;
        this.applyGameplaySettings();
        this.reviveCount = 0;
        
        // Apply kernel and hero grade bonuses
        this.applySelectedKernel();

        // Reset player to dynamic position
        const gameWidth = this.scale.width;
        const gameHeight = this.scale.height;
        const startX = gameWidth * 0.1; // 10% from left
        const startY = gameHeight * 0.9; // 90% from top (near bottom)
        this.player.setPosition(startX, startY);
        this.player.setVelocity(0, 0);

        // Clear enemies and bullets
        this.destroyAllEnemyHealthBars();
        this.enemies.clear(true, true);
        this.bullets.clear(true, true);
        this.enemyBullets.clear(true, true);
        this.explosions.clear(true, true);
        this.powerUps.clear(true, true);

        // Reset power-up multipliers
        this.speedMultiplier = 1;
        this.fireRateMultiplier = 1;
        this.scoreMultiplier = 1;
        this.autoShootEnabled = false;
        this.firepowerLevel = 0;
        this.isInvisible = false;
        this.player.setAlpha(1); // Reset player alpha
        this.totalFirepowerUpgrades = 0;
        this.enemyBulletHits = 0;
        this.baseFireRateMultiplier = 1;

        // Reset touch controls
        this.isFiringButtonDown = false;
        this.firePointerId = null;
        this.fireButton?.setFillStyle(0x003300, 0.8);
        this.resetJoystick();

        // Clear power-up timers
        this.powerUpTimers.forEach((timer) => timer.remove());
        this.powerUpTimers.clear();

        // Resume physics
        this.physics.resume();

        // Reset registry
        this.registry.set("score", 0);
        this.registry.set("finalScore", 0);
        this.registry.set("gameOver", false);
        this.registry.set("comboMultiplier", 1);
        this.registry.set("currentLayer", 1);
        this.registry.set("layerName", LAYER_CONFIG[1].name);
        this.registry.set("isPaused", false);
        this.registry.set("healthBars", this.healthBars);
        this.registry.set("reviveCount", 0);
        this.registry.set("prestigeChampion", false);
        this.registry.set("prestigeLevel", this.prestigeLevel);
        this.registry.set(
            "prestigeScoreMultiplier",
            this.prestigeScoreMultiplier
        );
        this.registry.set(
            "prestigeDifficultyMultiplier",
            this.prestigeDifficultyMultiplier
        );
        this.registry.set("overclockActive", false);
        this.registry.set("overclockProgress", 0);
        this.registry.set("overclockCooldown", 0);
        this.registry.set(
            "overclockCharges",
            OVERCLOCK_CONFIG.maxActivationsPerRun
        );
        this.registry.set("challengeActive", false);
        this.registry.set("challengeTitle", "");
        this.registry.set("challengeDescription", "");
        this.registry.set("challengeProgress", 0);

        this.runStartTime = this.time.now;
        this.shotsFiredThisRun = 0;
        this.shotsHitThisRun = 0;
        this.hitsTakenThisRun = 0;
        this.nextChallengeTime =
            this.runStartTime + MID_RUN_CHALLENGES.triggerIntervals.firstChallenge;
        this.lastChallengeEndTime = this.runStartTime;
        this.applySessionRewards(this.runStartTime);
        this.applySelectedKernel();
        this.initRotatingModifier(this.runStartTime);
        this.resetAdaptiveLearning();
        this.startBehaviorResetTimer();
        this.updatePrestigeEffects();
        // Corruption system removed

        // Reset spawn timer
        if (this.spawnTimer) {
            this.spawnTimer.remove();
            this.spawnTimer = null;
        }
        this.time.delayedCall(this.nextSpawnTime, () => {
            this.spawnEnemy();
            this.updateSpawnTimer();
        });
    }

    private enterPrestigeMode(originX: number, originY: number) {
        const previousPrestige = this.prestigeLevel;
        
        // Cap prestige at 8 (final prestige)
        if (this.prestigeLevel >= PRESTIGE_CONFIG.maxPrestige) {
            // Already at max prestige, cannot advance further
            return;
        }
        
        this.prestigeLevel += 1;
        this.applyPrestigeLevel(this.prestigeLevel);

        // Award coins for completing previous prestige
        if (previousPrestige >= 0) {
            const coinReward = getPrestigeCoinReward(previousPrestige);
            grantPrestigeReward(this.prestigeLevel);
            this.registry.set("coinBalance", getAvailableCoins());
            this.showAnnouncement(
                "PRESTIGE COMPLETE!",
                `Earned ${coinReward} coins`,
                0x00ff00
            );
            
            // Mark prestige as completed
            const completed = this.registry.get("prestigeCompleted") as boolean[] || new Array(9).fill(false);
            if (previousPrestige < completed.length) {
                completed[previousPrestige] = true;
                this.registry.set("prestigeCompleted", completed);
            }
        }

        // Reset score and combo for new prestige (optional - can be removed if you want to keep score)
        this.score = 0;
        this.comboMultiplier = 1;
        this.registry.set("score", this.score);
        this.registry.set("comboMultiplier", this.comboMultiplier);

        this.currentLayer = 1;
        this.pendingLayer = 1;
        this.layerFireRateMultiplier = 1; // Reset to base for new prestige cycle
        if (this.deepestLayer < MAX_LAYER) {
            this.deepestLayer = MAX_LAYER;
        }
        this.registry.set("currentLayer", this.currentLayer);
        this.registry.set("layerName", LAYER_CONFIG[1].name);
        this.registry.set("currentPrestige", this.prestigeLevel);
        this.registry.set("previousPrestige", previousPrestige);

        const prestigeTier = getPrestigeTierConfig(this.prestigeLevel);
        this.showAnnouncement(
            "PRESTIGE UNLOCKED!",
            `Prestige ${this.prestigeLevel} · ${prestigeTier.name}`,
            0xff00ff
        );

        // Show prestige layer image briefly
        this.showPrestigeLayerBriefly();

        this.drawBackgroundGrid();
        this.updateSpawnTimer();
        this.updatePrestigeEffects();

        this.applyCameraFlash(700, 255, 0, 255);
        this.applyCameraShake(500, 0.02);

        for (let i = 0; i < 4; i++) {
            this.time.delayedCall(i * 200, () => {
                this.spawnLivesPowerUp(
                    originX + Phaser.Math.Between(-60, 60),
                    originY + Phaser.Math.Between(-60, 60)
                );
            });
        }
        
        // Update story state and trigger prestige milestone dialogue
        updateStoryState(this.prestigeLevel, this.currentLayer);
        
        // Update rank after prestige advancement
        const newRank = updateCurrentRank(this.prestigeLevel, this.currentLayer);
        if (newRank) {
            this.registry.set("currentRank", newRank.name);
        }
        
        // Trigger prestige completion dialogue
        this.time.delayedCall(1000, () => {
            this.triggerDialogue('prestige_complete');
        });
        
        // Trigger prestige milestone dialogue if applicable (legacy system)
        this.time.delayedCall(1500, () => {
            this.triggerStoryDialogue('prestige_milestone');
        });
        
        // Trigger layer start dialogue for new prestige
        this.time.delayedCall(2000, () => {
            this.triggerDialogue('layer_start');
        });
    }
    
    /**
     * Show rank achievement notification
     */
    private showRankAchievement(rank: { number: number; name: string; badge: string }): void {
        this.showAnnouncement(
            "RANK ACHIEVED!",
            `${rank.name} - Rank ${rank.number}`,
            0x00ffff
        );
        
        // Store achievement for later display
        this.registry.set("lastRankAchievement", {
            number: rank.number,
            name: rank.name,
            badge: rank.badge,
        });
    }
    
    /**
     * Trigger story dialogue based on milestone type (legacy system)
     */
    private triggerStoryDialogue(type: 'game_start' | 'layer_complete' | 'prestige_milestone' | 'boss_defeat' | 'final_boss'): void {
        const milestone = getMilestoneForProgress(this.prestigeLevel, this.currentLayer, type);
        if (!milestone) {
            return;
        }
        
        if (!shouldTriggerMilestone(this.prestigeLevel, this.currentLayer, type)) {
            return;
        }
        
        // Get UIScene to show dialogue
        const uiScene = this.scene.get('UIScene');
        if (!uiScene) return;
        
        const dialogueManager = (uiScene as any).dialogueManager;
        if (!dialogueManager) return;
        
        // Show dialogue
        const shown = dialogueManager.showDialogue(milestone.dialogueId, {
            skipOnClick: true,
            priority: milestone.type === 'final_boss' ? 'critical' : 'high',
            onComplete: () => {
                // Mark milestone as completed
                completeMilestone(milestone.id);
            },
        });
        
        if (shown) {
            console.log(`[Story] Triggered dialogue: ${milestone.dialogueId} for milestone ${milestone.id}`);
        }
    }
    
    /**
     * Trigger new dialogue system based on trigger type
     */
    private triggerDialogue(trigger: string): void {
        const state: DialogueState = {
            prestige: this.prestigeLevel,
            layer: this.currentLayer,
            isFirstRun: isFirstRun(),
            bossDefeated: false,
            prestigeCompleted: false,
            finalBossEncountered: this.prestigeLevel === 8 && this.currentLayer === 6 && this.graduationBossActive,
            finalBossDefeated: false,
        };
        
        const dialogue = getDialogueForTrigger(trigger, state);
        if (!dialogue) {
            return;
        }
        
        // Check if already viewed (for non-critical dialogues)
        if (trigger !== 'final_boss_encounter' && trigger !== 'final_boss_defeat' && hasViewedDialogue(dialogue.id)) {
            return;
        }
        
        // Replace [Boss Name] placeholder with actual boss name if needed
        let dialogueText = dialogue.text;
        if (dialogueText.includes('[Boss Name]')) {
            const bossName = this.getCurrentBossName();
            dialogueText = dialogueText.replace('[Boss Name]', bossName);
        }
        
        // Emit dialogue event to UIScene
        const uiScene = this.scene.get('UIScene');
        if (uiScene) {
            uiScene.events.emit('show-dialogue', {
                id: dialogue.id,
                speaker: dialogue.speaker,
                text: dialogueText,
                speakerColor: this.getSpeakerColor(dialogue.speaker),
            });
            
            // Mark as viewed
            markDialogueAsViewed(dialogue.id);
        }
    }
    
    /**
     * Get current boss name for dialogue replacement
     */
    private getCurrentBossName(): string {
        // Find active graduation boss
        const activeBoss = this.enemies.children.entries.find((enemy: any) => 
            enemy.getData && enemy.getData('isGraduationBoss')
        ) as Phaser.Physics.Arcade.Sprite | undefined;
        
        if (activeBoss) {
            const displayName = activeBoss.getData('displayName') as string;
            if (displayName) {
                return displayName;
            }
        }
        
        // Fallback: use enemy service to get boss name
        if (this.currentLayer === 6 && this.prestigeLevel === 8) {
            return 'Zrechostikal - The Swarm Overlord';
        }
        
        return getGraduationBossName(this.currentLayer, this.prestigeLevel);
    }
    
    /**
     * Get speaker color based on speaker name
     */
    private getSpeakerColor(speaker: string): string {
        if (speaker.includes('White Sentinel')) return '#ffffff';
        if (speaker.includes('Prime Sentinel')) return '#00ffff';
        if (speaker.includes('Zrechostikal')) return '#ff00ff';
        if (speaker.includes('Boss')) return '#ff8800';
        return '#00ff00'; // Default green
    }

    private applyPrestigeLevel(level: number) {
        const prestigeTier = getPrestigeTierConfig(level);
        this.prestigeDifficultyMultiplier = prestigeTier.difficultyMultiplier;
        this.prestigeScoreMultiplier = prestigeTier.scoreMultiplier;
        this.prestigeResetAvailable = true;

        this.registry.set("prestigeLevel", this.prestigeLevel);
        this.registry.set("currentPrestige", this.prestigeLevel);
        this.registry.set(
            "prestigeScoreMultiplier",
            this.prestigeScoreMultiplier
        );
        this.registry.set(
            "prestigeDifficultyMultiplier",
            this.prestigeDifficultyMultiplier
        );

        // Prestige champion achievement (for reaching prestige 8)
        const prestigeChampion = this.prestigeLevel >= PRESTIGE_CONFIG.maxPrestige;
        this.registry.set("prestigeChampion", prestigeChampion);
        if (this.prestigeLevel >= 1) {
            this.unlockAchievementWithAnnouncement("prestige_1");
        }
        if (this.prestigeLevel >= 5) {
            this.unlockAchievementWithAnnouncement("prestige_5");
        }
        if (this.prestigeLevel >= PRESTIGE_CONFIG.maxPrestige) {
            this.unlockAchievementWithAnnouncement("prestige_8");
        }
    }

    // getPrestigeTier removed - use getPrestigeTierConfig from config.ts instead

    /**
     * Handle final boss defeat (Prestige 8, Layer 6)
     */
    private handleFinalBossDefeat(): void {
        // Award final boss coins
        const coinReward = getPrestigeCoinReward(PRESTIGE_CONFIG.maxPrestige);
        addCoins(coinReward);
        
        // Mark final prestige as completed
        const completed = this.registry.get("prestigeCompleted") as boolean[] || new Array(9).fill(false);
        completed[PRESTIGE_CONFIG.maxPrestige] = true;
        this.registry.set("prestigeCompleted", completed);
        
        // Set Prime Sentinel status
        this.registry.set("isPrimeSentinel", true);
        
        // Show victory announcement
        this.showAnnouncement(
            "PRIME SENTINEL ACHIEVED!",
            `Zrechostikal Defeated! Earned ${coinReward} coins`,
            0x00ffff
        );
        
        // Trigger victory dialogue
        this.time.delayedCall(2000, () => {
            this.triggerStoryDialogue('final_boss');
        });
    }

    private getPrestigeGridColor(baseColor: number) {
        if (this.prestigeLevel <= 0) {
            return baseColor;
        }
        const base = Phaser.Display.Color.ValueToColor(baseColor);
        const baseObj = base as unknown as { r: number; g: number; b: number };
        const hsl = Phaser.Display.Color.RGBToHSV(baseObj.r, baseObj.g, baseObj.b);
        const hueShift = (this.prestigeLevel * 25) % 360;
        const shifted = Phaser.Display.Color.HSVToRGB(
            (hsl.h * 360 + hueShift) / 360,
            Math.min(1, hsl.s + 0.1),
            Math.min(1, hsl.v + 0.1)
        ) as { r: number; g: number; b: number };
        return Phaser.Display.Color.GetColor(shifted.r, shifted.g, shifted.b);
    }

    private introduceWhiteSentinel(): void {
        // Get UIScene to show introduction tooltip
        const uiScene = this.scene.get('UIScene');
        if (!uiScene) return;
        
        const gameWidth = this.scale.width;
        const gameHeight = this.scale.height;
        
        // Show introduction tooltip from White Sentinel
        const tooltipManager = (uiScene as any).tooltipManager;
        if (tooltipManager) {
            tooltipManager.enqueueTooltip({
                id: 'white-sentinel-intro',
                targetX: gameWidth / 2,
                targetY: gameHeight / 2,
                content: "Greetings, Sentinel. I am your White Sentinel guide. I'll be with you throughout this mission, teaching you everything you need to know. Let's begin your journey!",
                position: 'top',
                width: 350,
            }, 0);
        }
        
        // Create floating text for dramatic effect
        this.createFloatingText(
            gameWidth / 2,
            gameHeight / 2 - 100,
            "WHITE SENTINEL ONLINE",
            { color: "#ffffff", fontSize: 24 }
        );
    }

    /**
     * Spawn a mini-me companion
     */
    public spawnMiniMe(type: MiniMeType): boolean {
        const activeCount = this.miniMes.children.size;
        if (activeCount >= MINI_ME_CONFIG.maxActive) {
            // Show warning
            this.showAnnouncement(
                "MAX MINI-MES",
                `Cannot spawn more than ${MINI_ME_CONFIG.maxActive} mini-mes`,
                0xff0000
            );
            return false;
        }
        
        const coins = getAvailableCoins();
        const result = activateMiniMe(type, coins);
        
        if (!result.success) {
            return false;
        }
        
        // Deduct coins
        spendCoins(result.coinsSpent, `mini_me_${type}`);
        this.registry.set("coinBalance", getAvailableCoins());
        
        // Create mini-me sprite
        const offsetX = Phaser.Math.Between(-30, 30);
        const offsetY = Phaser.Math.Between(-30, 30);
        const miniMe = this.miniMes.create(
            this.player.x + offsetX,
            this.player.y + offsetY,
            'power_up' // Placeholder sprite
        ) as Phaser.Physics.Arcade.Sprite;
        
        // Set mini-me properties
        miniMe.setScale(0.3 * MOBILE_SCALE);
        miniMe.setDepth(99); // Just below player
        miniMe.setData('type', type);
        miniMe.setData('spawnTime', this.time.now);
        miniMe.setData('hits', 0);
        miniMe.setData('lastHealTime', this.time.now);
        miniMe.setData('lastStunPulse', this.time.now);
        
        // Set duration (10-15 seconds)
        const duration = Phaser.Math.Between(
            MINI_ME_CONFIG.duration.min,
            MINI_ME_CONFIG.duration.max
        );
        miniMe.setData('expireTime', this.time.now + duration);
        
        // Type-specific setup
        this.setupMiniMeBehavior(miniMe, type);
        
        // Update active count
        this.registry.set("activeMiniMes", this.miniMes.children.size);
        
        // Show announcement
        import('../../services/inventoryService').then(({ getMiniMeName }) => {
            this.showAnnouncement(
                "MINI-ME DEPLOYED",
                `${getMiniMeName(type)} activated!`,
                0x00ffff
            );
        });
        
        return true;
    }
    
    /**
     * Setup mini-me behavior based on type
     */
    private setupMiniMeBehavior(miniMe: Phaser.Physics.Arcade.Sprite, type: MiniMeType): void {
        switch (type) {
            case 'scout':
                // Scout: Add scanning effect
                miniMe.setTint(0x00ffff); // Cyan tint
                break;
            case 'gunner':
                // Gunner: Add shooting capability
                miniMe.setTint(0xff0000); // Red tint
                miniMe.setData('lastShotTime', 0);
                break;
            case 'shield':
                // Shield: Create barrier effect
                miniMe.setTint(0x00ff00); // Green tint
                miniMe.setAlpha(0.5); // Semi-transparent
                break;
            case 'decoy':
                // Decoy: Holographic effect
                miniMe.setTint(0xffff00); // Yellow tint
                miniMe.setAlpha(0.7);
                break;
            case 'collector':
                // Collector: Vacuum effect
                miniMe.setTint(0xff00ff); // Magenta tint
                break;
            case 'stun':
                // Stun: Sparking effect
                miniMe.setTint(0xffffff); // White tint
                break;
            case 'healer':
                // Healer: Healing aura
                miniMe.setTint(0x00ff99); // Light green tint
                break;
        }
    }
    
    /**
     * Update all active mini-mes
     */
    private updateMiniMes(time: number): void {
        if (this.gameOver || this.isPaused) {
            return;
        }
        
        this.miniMes.children.entries.forEach((miniMeObj) => {
            const miniMe = miniMeObj as Phaser.Physics.Arcade.Sprite;
            if (!miniMe.active) {
                return;
            }
            
            const type = miniMe.getData('type') as MiniMeType;
            const expireTime = miniMe.getData('expireTime') as number;
            
            // Check if expired
            if (time >= expireTime) {
                this.destroyMiniMe(miniMe);
                return;
            }
            
            // Follow player with offset
            const offsetX = Phaser.Math.Between(-20, 20);
            const offsetY = Phaser.Math.Between(-20, 20);
            const targetX = this.player.x + offsetX;
            const targetY = this.player.y + offsetY;
            
            // Smooth movement toward player
            const lerpSpeed = 0.1;
            const newX = Phaser.Math.Linear(miniMe.x, targetX, lerpSpeed);
            const newY = Phaser.Math.Linear(miniMe.y, targetY, lerpSpeed);
            miniMe.setPosition(newX, newY);
            
            // Execute type-specific behavior
            this.executeMiniMeBehavior(miniMe, type, time);
        });
        
        // Update active count
        this.registry.set("activeMiniMes", this.miniMes.children.size);
    }
    
    /**
     * Execute mini-me type-specific behavior
     */
    private executeMiniMeBehavior(miniMe: Phaser.Physics.Arcade.Sprite, type: MiniMeType, time: number): void {
        switch (type) {
            case 'scout':
                // Scout: Reveal enemies (visual effect only for now)
                // Could add enemy highlighting here
                break;
            case 'gunner':
                // Gunner: Shoot alongside player
                const lastShotTime = miniMe.getData('lastShotTime') as number || 0;
                const gunnerFireRate = PLAYER_CONFIG.fireRate * MINI_ME_CONFIG.behaviors.gunner.fireRate;
                if (time - lastShotTime >= gunnerFireRate) {
                    this.shootMiniMeBullet(miniMe);
                    miniMe.setData('lastShotTime', time);
                }
                break;
            case 'shield':
                // Shield: Damage reduction handled in takeDamage()
                break;
            case 'decoy':
                // Decoy: Damage reduction handled in takeDamage()
                break;
            case 'collector':
                // Collector: Gather nearby power-ups
                this.collectNearbyPowerUps(miniMe);
                break;
            case 'stun':
                // Stun: Emit stun pulses
                const lastStunPulse = miniMe.getData('lastStunPulse') as number || 0;
                if (time - lastStunPulse >= MINI_ME_CONFIG.behaviors.stun.pulseInterval) {
                    this.emitStunPulse(miniMe);
                    miniMe.setData('lastStunPulse', time);
                }
                break;
            case 'healer':
                // Healer: Restore health periodically
                const lastHealTime = miniMe.getData('lastHealTime') as number || 0;
                if (time - lastHealTime >= MINI_ME_CONFIG.behaviors.healer.healInterval) {
                    this.healPlayer(miniMe);
                    miniMe.setData('lastHealTime', time);
                }
                break;
        }
    }
    
    /**
     * Shoot bullet from gunner mini-me
     */
    private shootMiniMeBullet(miniMe: Phaser.Physics.Arcade.Sprite): void {
        // Use player's bullet sprite or create a simple one
        let bullet: Phaser.Physics.Arcade.Sprite;
        if (this.textures.exists('bullet')) {
            bullet = this.bullets.create(miniMe.x, miniMe.y, 'bullet') as Phaser.Physics.Arcade.Sprite;
        } else {
            // Create a simple bullet graphic if texture doesn't exist
            if (!this.textures.exists('miniMeBullet')) {
                const graphics = this.add.graphics();
                graphics.fillStyle(0x00ff00, 1);
                graphics.fillCircle(0, 0, 4);
                graphics.generateTexture('miniMeBullet', 8, 8);
                graphics.destroy();
            }
            bullet = this.bullets.create(miniMe.x, miniMe.y, 'miniMeBullet') as Phaser.Physics.Arcade.Sprite;
        }
        bullet.setVelocityY(-MINI_ME_CONFIG.behaviors.gunner.bulletSpeed);
        bullet.setScale(0.5 * MOBILE_SCALE);
        bullet.setDepth(50);
        bullet.setData('isMiniMeBullet', true);
    }
    
    /**
     * Collect nearby power-ups (collector mini-me)
     */
    private collectNearbyPowerUps(miniMe: Phaser.Physics.Arcade.Sprite): void {
        const radius = MINI_ME_CONFIG.behaviors.collector.collectionRadius;
        this.powerUps.children.entries.forEach((powerUpObj) => {
            const powerUp = powerUpObj as Phaser.Physics.Arcade.Sprite;
            const distance = Phaser.Math.Distance.Between(
                miniMe.x, miniMe.y,
                powerUp.x, powerUp.y
            );
            if (distance <= radius) {
                // Move power-up toward player
                const angle = Phaser.Math.Angle.Between(
                    powerUp.x, powerUp.y,
                    this.player.x, this.player.y
                );
                const speed = 400;
                powerUp.setVelocity(
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed
                );
            }
        });
    }
    
    /**
     * Emit stun pulse (stun mini-me)
     */
    private emitStunPulse(miniMe: Phaser.Physics.Arcade.Sprite): void {
        const radius = MINI_ME_CONFIG.behaviors.stun.stunRadius;
        const stunDuration = MINI_ME_CONFIG.behaviors.stun.stunDuration;
        
        // Visual effect
        const circle = this.add.circle(miniMe.x, miniMe.y, radius, 0xffffff, 0.3);
        this.tweens.add({
            targets: circle,
            radius: radius * 2,
            alpha: 0,
            duration: 500,
            onComplete: () => circle.destroy(),
        });
        
        // Stun nearby enemies
        this.enemies.children.entries.forEach((enemyObj) => {
            const enemy = enemyObj as Phaser.Physics.Arcade.Sprite;
            if (!enemy.active) return;
            const distance = Phaser.Math.Distance.Between(
                miniMe.x, miniMe.y,
                enemy.x, enemy.y
            );
            if (distance <= radius) {
                enemy.setData('stunned', true);
                enemy.setData('stunEndTime', this.time.now + stunDuration);
                // Visual: Make enemy gray
                enemy.setTint(0x888888);
                // Stop enemy movement when stunned
                enemy.setVelocity(0, 0);
                this.time.delayedCall(stunDuration, () => {
                    if (enemy.active) {
                        enemy.setData('stunned', false);
                        enemy.clearTint();
                        // Restore enemy velocity (will be updated in enemy update loop)
                    }
                });
            }
        });
    }
    
    /**
     * Heal player (healer mini-me)
     */
    private healPlayer(miniMe: Phaser.Physics.Arcade.Sprite): void {
        if (this.healthBars < PLAYER_CONFIG.maxHealthBars) {
            this.healthBars = Math.min(this.healthBars + MINI_ME_CONFIG.behaviors.healer.healAmount, PLAYER_CONFIG.maxHealthBars);
            this.registry.set("healthBars", this.healthBars);
            this.createFloatingText(miniMe.x, miniMe.y - 20, "+1 Health", { color: "#00ff00" });
        }
    }
    
    /**
     * Destroy mini-me
     */
    private destroyMiniMe(miniMe: Phaser.Physics.Arcade.Sprite): void {
        // Create explosion
        this.createExplosion(miniMe.x, miniMe.y, "small");
        miniMe.destroy();
        const newCount = this.miniMes.children.size;
        this.registry.set("activeMiniMes", newCount);
    }
    
    /**
     * Clean up all mini-mes (on game over or restart)
     */
    private cleanupMiniMes(): void {
        this.miniMes.children.entries.forEach((miniMeObj) => {
            const miniMe = miniMeObj as Phaser.Physics.Arcade.Sprite;
            if (miniMe.active) {
                miniMe.destroy();
            }
        });
        this.registry.set("activeMiniMes", 0);
    }

    private updatePrestigeEffects() {
        if (this.prestigeFlashTimer) {
            this.prestigeFlashTimer.remove();
            this.prestigeFlashTimer = null;
        }
        if (this.prestigeGlitchTimer) {
            this.prestigeGlitchTimer.remove();
            this.prestigeGlitchTimer = null;
        }

        if (this.prestigeLevel <= 0) {
            if (this.backgroundGrid) {
                this.backgroundGrid.setAlpha(1);
                this.backgroundGrid.setPosition(0, 0);
            }
            return;
        }

        const flashInterval = Math.max(
            1500,
            8000 / PRESTIGE_CONFIG.visualEffects.screenFlashFrequency
        );
        this.prestigeFlashTimer = this.time.addEvent({
            delay: flashInterval,
            loop: true,
            callback: () => {
                if (this.gameOver || this.isPaused) return;
                this.applyCameraFlash(120, 255, 0, 100);
            },
        });

        // Prestige glitch vibration disabled - was causing screen shake
        // if (PRESTIGE_CONFIG.visualEffects.corruptionVFX) {
        //     const glitchIntensity =
        //         PRESTIGE_CONFIG.visualEffects.gridGlitchIntensity +
        //         this.prestigeLevel * 0.05;
        //     this.prestigeGlitchTimer = this.time.addEvent({
        //         delay: 350,
        //         loop: true,
        //         callback: () => {
        //             if (!this.backgroundGrid) return;
        //             const offset = 6 * glitchIntensity;
        //             this.backgroundGrid.setPosition(
        //                 Phaser.Math.FloatBetween(-offset, offset),
        //                 Phaser.Math.FloatBetween(-offset, offset)
        //             );
        //             this.backgroundGrid.setAlpha(
        //                 Phaser.Math.Clamp(0.6 + glitchIntensity, 0.6, 0.95)
        //             );
        //         },
        //     });
        // }
    }
}
