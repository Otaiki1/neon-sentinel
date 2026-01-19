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
    DIFFICULTY_EVOLUTION,
    ENEMY_BEHAVIOR_CONFIG,
    CORRUPTION_SYSTEM,
    OVERCLOCK_CONFIG,
    MID_RUN_CHALLENGES,
    ACHIEVEMENTS,
} from "../config";
import {
    addLifetimePlayMs,
    addLifetimeScore,
    checkAllLeaderboardsTop10,
    getLifetimeStats,
    getSelectedCosmetic,
    setAchievementProgress,
    shouldNotifyAboutToUnlock,
    unlockAchievement,
} from "../../services/achievementService";
import {
    startSession,
    updateLifetimePlaytime,
} from "../../services/sessionRewardService";

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
    private lives = PLAYER_CONFIG.initialLives;
    private lastHitTime = 0;
    private backgroundGrid!: Phaser.GameObjects.Graphics;
    private currentLayer = 1;
    private deepestLayer = 1;
    private prestigeLevel = 0;
    private prestigeDifficultyMultiplier = 1;
    private prestigeScoreMultiplier = 1;
    private prestigeFlashTimer: Phaser.Time.TimerEvent | null = null;
    private prestigeGlitchTimer: Phaser.Time.TimerEvent | null = null;
    private prestigeResetAvailable = true;
    private corruption = CORRUPTION_SYSTEM.currentCorruption;
    private corruptionTimer: Phaser.Time.TimerEvent | null = null;
    private corruptionEffectTimer: Phaser.Time.TimerEvent | null = null;
    private lastNoHitRewardTime = 0;
    private lastRiskyKillTime = 0;
    private currentCorruptionTier: "low" | "medium" | "high" | "critical" =
        "low";
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
    private totalEnemiesDefeated = 0;
    private maxCorruptionReached = 0;
    private tookDamageThisRun = false;
    private peakComboMultiplier = 1;
    private timeToReachLayer6: number | null = null;
    private nextChallengeTime = 0;
    private lastChallengeEndTime = 0;
    private activeChallenge:
        | (typeof MID_RUN_CHALLENGES.challenges)[number]
        | null = null;
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
    private speedMultiplier = 1;
    private fireRateMultiplier = 1;
    private scoreMultiplier = 1;
    private powerUpTimers: Map<string, Phaser.Time.TimerEvent> = new Map();
    private autoShootEnabled = false;
    private firepowerLevel = 0; // 0 = normal, 1+ = increased firepower (multiple bullets)
    private isInvisible = false; // Invisibility power-up state
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
        // Draw background grid
        this.drawBackgroundGrid();

        // Create player at dynamic position based on screen size
        const gameWidth = this.scale.width;
        const gameHeight = this.scale.height;
        const startX = gameWidth * 0.1; // 10% from left
        const startY = gameHeight * 0.9; // 90% from top (near bottom)
        this.player = this.physics.add.sprite(startX, startY, "hero");
        this.player.setCollideWorldBounds(true);
        this.player.setScale(0.5 * MOBILE_SCALE);
        this.applySelectedCosmetic();

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
        this.overclockKey.on("down", () => {
            this.tryActivateOverclock();
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
        this.registry.set(
            "prestigeScoreMultiplier",
            this.prestigeScoreMultiplier
        );
        this.registry.set(
            "prestigeDifficultyMultiplier",
            this.prestigeDifficultyMultiplier
        );
        this.registry.set("corruption", this.corruption);
        this.registry.set("overclockActive", false);
        this.registry.set("overclockProgress", 0);
        this.registry.set("overclockCooldown", 0);
        this.registry.set(
            "overclockCharges",
            OVERCLOCK_CONFIG.maxActivationsPerRun - this.overclockActivations
        );
        this.registry.set("challengeActive", false);
        this.registry.set("challengeTitle", "");
        this.registry.set("challengeDescription", "");
        this.registry.set("challengeProgress", 0);
        this.runStartTime = this.time.now;
        this.totalEnemiesDefeated = 0;
        this.maxCorruptionReached = this.corruption;
        this.tookDamageThisRun = false;
        this.peakComboMultiplier = this.comboMultiplier;
        this.timeToReachLayer6 = null;
        this.challengeDamageTaken = false;
        this.runLifeOrbs = 0;
        this.runBossesDefeated = 0;
        this.tookDamageBeforeLayer3 = false;
        this.sessionScoreMultiplier = 1;
        this.sessionStreakScoreMultiplier = 1;
        this.sessionComboStartBoost = 1;
        this.sessionBoostEndTime = 0;
        this.sessionLastTick = this.runStartTime;
        this.nextChallengeTime =
            this.runStartTime + MID_RUN_CHALLENGES.triggerIntervals.firstChallenge;
        this.lastChallengeEndTime = this.runStartTime;
        this.applySessionRewards(this.runStartTime);
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
        this.startCorruptionTimer();
        this.updateCorruptionEffects();
    }

    private drawBackgroundGrid() {
        const width = this.scale.width;
        const height = this.scale.height;
        const gridSize = 40;

        // Get grid color based on current layer
        const layerConfig =
            LAYER_CONFIG[this.currentLayer as keyof typeof LAYER_CONFIG];
        const baseGridColor = layerConfig?.gridColor || 0x00ff00;
        const gridColor = this.getPrestigeGridColor(baseGridColor);

        // Destroy old grid if it exists
        if (this.backgroundGrid) {
            this.backgroundGrid.destroy();
        }

        this.backgroundGrid = this.add.graphics();
        this.backgroundGrid.lineStyle(1, gridColor, 0.3);

        // Vertical lines
        for (let x = 0; x <= width; x += gridSize) {
            this.backgroundGrid.lineBetween(x, 0, x, height);
        }

        // Horizontal lines
        for (let y = 0; y <= height; y += gridSize) {
            this.backgroundGrid.lineBetween(0, y, width, y);
        }

        // Draw faint progress bar at the bottom
        this.drawProgressBar();
    }

    private drawProgressBar() {
        const width = this.scale.width;
        const height = this.scale.height;
        const progressBarHeight = 4;
        const progressBarY = height - 20;
        const progressBarWidth = width * 0.8; // 80% of screen width
        const progressBarX = width * 0.1; // 10% from left

        // Calculate progress based on current layer and score
        const maxLayer = MAX_LAYER;
        const currentLayerConfig =
            LAYER_CONFIG[this.currentLayer as keyof typeof LAYER_CONFIG];
        const nextLayerConfig =
            this.currentLayer < maxLayer
                ? LAYER_CONFIG[
                      (this.currentLayer + 1) as keyof typeof LAYER_CONFIG
                  ]
                : null;

        let progress = 0;
        if (nextLayerConfig) {
            // Progress within current layer
            const currentThreshold = currentLayerConfig.scoreThreshold || 0;
            const nextThreshold = nextLayerConfig.scoreThreshold || 0;
            const progressInLayer =
                (this.score - currentThreshold) /
                (nextThreshold - currentThreshold);
            progress =
                (this.currentLayer - 1) / maxLayer + progressInLayer / maxLayer;
        } else {
            // Max layer reached
            progress = 1.0;
        }

        progress = Math.max(0, Math.min(1, progress)); // Clamp between 0 and 1

        // Background bar (faint)
        this.backgroundGrid.fillStyle(0x00ff00, 0.1);
        this.backgroundGrid.fillRect(
            progressBarX,
            progressBarY,
            progressBarWidth,
            progressBarHeight
        );

        // Progress fill (faint)
        this.backgroundGrid.fillStyle(0x00ff00, 0.3);
        this.backgroundGrid.fillRect(
            progressBarX,
            progressBarY,
            progressBarWidth * progress,
            progressBarHeight
        );

        // Layer markers (faint vertical lines)
        this.backgroundGrid.lineStyle(1, 0x00ff00, 0.2);
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

    update(time: number) {
        // Pause/resume is handled by UIScene ESC key handler
        // GameScene update continues to run even when paused so UIScene can handle input

        if (this.gameOver || this.isPaused) return;

        this.updateDifficultyPhase(time);
        this.samplePlayerMovement(time);
        this.updateAdaptiveLearning(time);
        this.updateSessionRewards(time);

        // Player movement
        this.handlePlayerMovement();

        // Shooting - manual or auto-shoot power-up
        const currentFireRate =
            PLAYER_CONFIG.fireRate *
            this.fireRateMultiplier *
            this.overclockFireRateMultiplier *
            this.challengeFireRateMultiplier;

        if (this.autoShootEnabled) {
            // Auto-shoot when power-up is active
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
        const gameWidth = this.scale.width;
        const gameHeight = this.scale.height;
        this.bullets.children.entries.forEach((bullet) => {
            const b = bullet as Phaser.Physics.Arcade.Sprite;
            if (b.x > gameWidth + 50 || b.x < -50) {
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
            }

            // Graduation bosses should not be destroyed and should continuously move toward player
            if (isGraduationBoss) {
                // Make graduation boss continuously move toward player
                const speed = enemy.getData("speed") || 100;
                const target = this.getTargetPositionForEnemy(behaviors, true);
                const angle = Phaser.Math.Angle.Between(
                    enemy.x,
                    enemy.y,
                    target.x,
                    target.y
                );
                const velocityX = Math.cos(angle) * speed;
                const velocityY = Math.sin(angle) * speed;
                enemy.setVelocity(velocityX, velocityY);

                // Bounce off all walls (including right edge)
                if (enemy.x < 0) {
                    enemy.setVelocityX(Math.abs(enemy.body!.velocity.x));
                }
                if (enemy.x > gameWidth) {
                    enemy.setVelocityX(-Math.abs(enemy.body!.velocity.x));
                }
                if (enemy.y < 0) {
                    enemy.setVelocityY(Math.abs(enemy.body!.velocity.y));
                }
                if (enemy.y > gameHeight) {
                    enemy.setVelocityY(-Math.abs(enemy.body!.velocity.y));
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
                const lastShot = enemy.getData("lastShot") || 0;
                const baseShootInterval =
                    enemy.getData("baseShootInterval") ||
                    enemy.getData("shootInterval") ||
                    2000;
                const shootSpeedMultiplier =
                    (enemy.getData("shootSpeedMultiplier") as number) || 1;
                const shootInterval = baseShootInterval / shootSpeedMultiplier;

                if (time - lastShot > shootInterval) {
                    // Graduation bosses shoot more frequently and with multiple bullets
                    if (isGraduationBoss) {
                        this.enemyShoot(enemy, 0); // Center bullet
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

        // Calculate speed with power-up multiplier
        const currentSpeed =
            PLAYER_CONFIG.speed *
            this.speedMultiplier *
            this.overclockSpeedMultiplier;

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

            // Normalize diagonal movement
            if (velocityX !== 0 && velocityY !== 0) {
                velocityX *= 0.707; // 1/sqrt(2)
                velocityY *= 0.707;
            }
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
        if (this.activeChallenge?.id === "no_shoot_20s") {
            this.failChallenge();
        }

        const playerX = this.player.x + 30;
        const playerY = this.player.y;

        // Base firepower: single bullet
        if (this.firepowerLevel === 0) {
            const bullet = this.bullets.get(
                playerX,
                playerY
            ) as Phaser.Physics.Arcade.Sprite;
            if (bullet) {
                bullet.setActive(true);
                bullet.setVisible(true);
                bullet.setScale(0.5 * MOBILE_SCALE);
                bullet.setTexture("greenBullet1"); // Normal green bullet
                bullet.setVelocityX(PLAYER_CONFIG.bulletSpeed);
                bullet.setVelocityY(0);
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
                    bullet.setScale(0.6 * MOBILE_SCALE); // Slightly larger for visual impact

                    // Use different bullet sprites based on firepower level
                    if (firepowerLevelInt === 1) {
                        bullet.setTexture("greenBullet2"); // Upgraded green bullet
                    } else if (firepowerLevelInt >= 2) {
                        bullet.setTexture("yellowBullet"); // Yellow bullet for high firepower
                        bullet.setScale(0.7 * MOBILE_SCALE); // Even larger
                    } else {
                        bullet.setTexture("greenBullet1");
                    }

                    // Calculate spread angle
                    const angleOffset =
                        (i - (bulletCount - 1) / 2) *
                        (spreadAngle / (bulletCount - 1 || 1));
                    const angle = Phaser.Math.DegToRad(angleOffset);

                    // Set velocity with spread
                    const velocityX =
                        Math.cos(angle) * PLAYER_CONFIG.bulletSpeed;
                    const velocityY =
                        Math.sin(angle) * PLAYER_CONFIG.bulletSpeed;
                    bullet.setVelocity(velocityX, velocityY);
                }
            }
        }
    }

    private applySelectedCosmetic() {
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
        const currentLayerConfig =
            LAYER_CONFIG[this.currentLayer as keyof typeof LAYER_CONFIG];
        const maxEnemiesMultiplier =
            currentLayerConfig?.spawnRateMultiplier || 1.0;
        const currentMaxEnemies = Math.floor(
            SPAWN_CONFIG.baseMaxEnemies *
                maxEnemiesMultiplier *
                Math.max(1, this.prestigeDifficultyMultiplier)
        );

        const activeEnemies = this.enemies.children.size;
        if (activeEnemies >= currentMaxEnemies) {
            return;
        }

        // Check for boss spawn based on layer
        if (
            currentLayerConfig.bossChance > 0 &&
            Math.random() < currentLayerConfig.bossChance
        ) {
            this.spawnBoss();
            return;
        }

        const phaseConfig = this.getCurrentPhaseConfig();
        const spawnPatterns = phaseConfig.spawnPatterns;
        const allowFormations =
            spawnPatterns.includes("loose_formations") ||
            spawnPatterns.includes("formations") ||
            spawnPatterns.includes("ambush_waves") ||
            spawnPatterns.includes("complex_formations") ||
            spawnPatterns.includes("boss_rushes");

        if (
            allowFormations &&
            Math.random() < ENEMY_BEHAVIOR_CONFIG.formationSpawnChance
        ) {
            this.spawnFormationWave(spawnPatterns);
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
        }
    ) {
        const config = ENEMY_CONFIG[selectedType];
        const keyMap: Record<string, string> = {
            green: "enemyGreen",
            yellow: "enemyYellow",
            yellowShield: "enemyYellow",
            yellowEcho: "enemyYellow",
            blue: "enemyBlue",
            blueBuff: "enemyBlue",
            purple: "enemyPurple",
            purpleFragmenter: "enemyPurple",
        };
        const key = keyMap[selectedType] || "enemyGreen";

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
            this.createEnemyAura(enemy, 0xffcc33, config.shieldRadius || 200);
        } else if (selectedType === "yellowEcho") {
            enemy.setTint(0xffff66);
            this.startEchoTrail(enemy, config.echoCount || 2, config.echoDuration || 2000);
        } else if (selectedType === "blueBuff") {
            enemy.setTint(0x66ccff);
            this.createEnemyAura(enemy, 0x66ccff, config.buffRadius || 250);
        } else if (selectedType === "purpleFragmenter") {
            enemy.setTint(0xcc66ff);
        }

        const layerConfig =
            LAYER_CONFIG[this.currentLayer as keyof typeof LAYER_CONFIG];
        const baseHealthMultiplier = layerConfig?.healthMultiplier || 1.0;
        const extraHealthMultiplier = options?.healthMultiplier || 1.0;
        const corruptionDifficultyMultiplier =
            this.getCorruptionDifficultyMultiplier();
        const baseHealth =
            options?.overrideHealth !== undefined
                ? options.overrideHealth
                : config.health;
        const scaledHealth = Math.ceil(
            baseHealth *
                baseHealthMultiplier *
                extraHealthMultiplier *
                this.prestigeDifficultyMultiplier *
                corruptionDifficultyMultiplier
        );

        const baseSpeedMultiplier = options?.speedMultiplier || 1.0;
        const scaledSpeed = Math.round(
            config.speed *
                baseSpeedMultiplier *
                this.prestigeDifficultyMultiplier *
                corruptionDifficultyMultiplier
        );

        const behaviors = this.getBehaviorsForEnemy(
            selectedType,
            options?.isFormation || false,
            false
        );

        enemy.setData("type", selectedType);
        enemy.setData(
            "points",
            options?.overridePoints !== undefined
                ? options.overridePoints
                : config.points
        );
        enemy.setData("speed", scaledSpeed);
        enemy.setData("health", scaledHealth);
        enemy.setData("maxHealth", scaledHealth);
        enemy.setData("canShoot", config.canShoot || false);
        enemy.setData("behaviors", behaviors);
        enemy.setData("isFragment", options?.isFragment || false);
        enemy.setData("shootSpeedMultiplier", 1);
        enemy.setData("damageMultiplier", 1);

        if (selectedType === "yellowShield") {
            enemy.setData("shieldRadius", config.shieldRadius);
            enemy.setData("shieldDamageReduction", config.shieldDamageReduction);
        } else if (selectedType === "yellowEcho") {
            enemy.setData("echoCount", config.echoCount);
            enemy.setData("echoDuration", config.echoDuration);
        } else if (selectedType === "blueBuff") {
            enemy.setData("buffRadius", config.buffRadius);
            enemy.setData("buffShootingSpeed", config.buffShootingSpeed);
            enemy.setData("buffDamage", config.buffDamage);
        } else if (selectedType === "purpleFragmenter") {
            enemy.setData("fragmentsOnDeath", config.fragmentsOnDeath);
            enemy.setData("fragmentType", config.fragmentType);
            enemy.setData("fragmentHealth", config.fragmentHealth);
        }

        const corruptionRatio = this.getCorruptionRatio();
        if (corruptionRatio > 0.25) {
            const tint = Phaser.Display.Color.Interpolate.ColorWithColor(
                Phaser.Display.Color.ValueToColor(0x00ff00),
                Phaser.Display.Color.ValueToColor(0xff0000),
                100,
                Math.round(corruptionRatio * 100)
            );
            enemy.setTint(
                Phaser.Display.Color.GetColor(tint.r, tint.g, tint.b)
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
        const availableEnemies = LAYER_CONFIG[
            this.currentLayer as keyof typeof LAYER_CONFIG
        ].enemies as Array<keyof typeof ENEMY_CONFIG>;
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
        const phaseBehaviors = this.getCurrentPhaseConfig().enemyBehaviors;
        const behaviors = ["basic_pursuit"];

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
        const delta = time - this.lastMovementSampleTime;
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

    private updateAdaptiveLearning(time: number) {
        if (this.currentDifficultyPhase !== "phase4") return;
        if (this.adaptationKillCount < ENEMY_BEHAVIOR_CONFIG.adaptationThreshold) {
            return;
        }

        const width = this.scale.width;
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
        aura.lineStyle(1, color, 0.4);
        aura.strokeCircle(0, 0, radius * MOBILE_SCALE);
        aura.setPosition(enemy.x, enemy.y);
        aura.setDepth(enemy.depth - 1);
        aura.setBlendMode(Phaser.BlendModes.ADD);
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

    private startCorruptionTimer() {
        if (this.corruptionTimer) {
            this.corruptionTimer.remove();
        }
        this.corruptionTimer = this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                this.updateCorruptionTick(this.time.now);
            },
        });
    }

    private updateCorruptionTick(time: number) {
        if (this.gameOver || this.isPaused) {
            return;
        }
        let delta = CORRUPTION_SYSTEM.passiveIncreaseRate;

        if (this.isInCorruptedZone()) {
            delta += CORRUPTION_SYSTEM.riskPlayBonus.enterCorruptedZone;
        }

        if (
            time - this.lastHitTime >= 10000 &&
            time - this.lastNoHitRewardTime >= 10000
        ) {
            delta += CORRUPTION_SYSTEM.riskPlayBonus.noHitStreak;
            this.lastNoHitRewardTime = time;
        }

        if (time - this.lastRiskyKillTime > 5000) {
            delta += CORRUPTION_SYSTEM.safePlayDecay;
        }

        this.addCorruption(delta);
    }

    private addCorruption(amount: number) {
        if (!amount) return;
        this.corruption = Phaser.Math.Clamp(
            this.corruption + amount,
            0,
            CORRUPTION_SYSTEM.maxCorruption
        );
        this.registry.set("corruption", this.corruption);
        if (this.corruption >= CORRUPTION_SYSTEM.maxCorruption) {
            this.unlockAchievementWithAnnouncement("corruption_100");
        }

        const nextTier = this.getCorruptionTier();
        if (nextTier !== this.currentCorruptionTier) {
            this.currentCorruptionTier = nextTier;
            this.updateCorruptionEffects();
        }
        if (this.corruption > this.maxCorruptionReached) {
            this.maxCorruptionReached = this.corruption;
        }
    }

    private getCorruptionRatio() {
        return this.corruption / CORRUPTION_SYSTEM.maxCorruption;
    }

    private getCorruptionTier(): "low" | "medium" | "high" | "critical" {
        const ratio = this.getCorruptionRatio();
        if (ratio < 0.25) return "low";
        if (ratio < 0.5) return "medium";
        if (ratio < 0.75) return "high";
        return "critical";
    }

    private getCorruptionScoreMultiplier() {
        return CORRUPTION_SYSTEM.scoreMultiplier[this.getCorruptionTier()];
    }

    private getCorruptionDifficultyMultiplier() {
        return (
            CORRUPTION_SYSTEM.enemyDifficultyMultiplier[this.getCorruptionTier()] *
            this.challengeCorruptionMultiplier
        );
    }

    private isInCorruptedZone() {
        const radius = 200;
        let nearbyEnemies = 0;
        this.enemies.children.entries.forEach((enemyObj) => {
            const enemy = enemyObj as Phaser.Physics.Arcade.Sprite;
            if (!enemy.active) return;
            const distance = Phaser.Math.Distance.Between(
                enemy.x,
                enemy.y,
                this.player.x,
                this.player.y
            );
            if (distance <= radius) {
                nearbyEnemies += 1;
            }
        });
        return nearbyEnemies >= 5;
    }

    private updateCorruptionEffects() {
        if (this.corruptionEffectTimer) {
            this.corruptionEffectTimer.remove();
            this.corruptionEffectTimer = null;
        }

        if (!this.backgroundGrid) return;
        if (this.currentCorruptionTier === "low") {
            this.backgroundGrid.setAlpha(1);
            if (!this.prestigeGlitchTimer) {
                this.backgroundGrid.setPosition(0, 0);
            }
            return;
        }

        const delay =
            this.currentCorruptionTier === "medium"
                ? 600
                : this.currentCorruptionTier === "high"
                  ? 350
                  : 200;
        const maxOffset =
            this.currentCorruptionTier === "medium"
                ? 2
                : this.currentCorruptionTier === "high"
                  ? 4
                  : 6;

        this.corruptionEffectTimer = this.time.addEvent({
            delay,
            loop: true,
            callback: () => {
                if (!this.backgroundGrid) return;
                const alpha =
                    this.currentCorruptionTier === "medium"
                        ? Phaser.Math.FloatBetween(0.75, 0.95)
                        : this.currentCorruptionTier === "high"
                          ? Phaser.Math.FloatBetween(0.6, 0.9)
                          : Phaser.Math.FloatBetween(0.5, 0.85);
                this.backgroundGrid.setAlpha(alpha);

                if (!this.prestigeGlitchTimer) {
                    this.backgroundGrid.setPosition(
                        Phaser.Math.FloatBetween(-maxOffset, maxOffset),
                        Phaser.Math.FloatBetween(-maxOffset, maxOffset)
                    );
                }

                if (this.currentCorruptionTier === "critical") {
                    this.cameras.main.flash(80, 255, 0, 0, false);
                }
            },
        });
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
            this.cameras.main.flash(500, 255, 255, 255, false);
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

    private endOverclock() {
        this.overclockActive = false;
        this.overclockEndTime = 0;
        this.overclockScoreMultiplier = 1;
        this.overclockFireRateMultiplier = 1;
        this.overclockSpeedMultiplier = 1;
        this.overclockSpawnMultiplier = 1;
        this.totalEnemiesDefeated = 0;
        this.maxCorruptionReached = this.corruption;
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
        this.applySelectedCosmetic();
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
                if (this.corruption >= 80) {
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
            this.cameras.main.flash(250, 0, 255, 255, false);
            this.cameras.main.shake(200, 0.01);
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
            this.lives += reward.extraLife;
            this.registry.set("lives", this.lives);
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
        if (reward.invincibilityFrame) {
            this.applyChallengeMultiplier(
                "invincibility",
                () => {
                    this.challengeInvincibilityBonusMs = Math.max(
                        this.challengeInvincibilityBonusMs,
                        reward.invincibilityFrame * 1000
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

    private updateSpawnTimer() {
        // Get spawn rate multiplier based on current layer
        const layerConfig =
            LAYER_CONFIG[this.currentLayer as keyof typeof LAYER_CONFIG];
        const spawnRateMultiplier = layerConfig?.spawnRateMultiplier || 1.0;
        const prestigeSpawnMultiplier = Math.max(
            1,
            this.prestigeDifficultyMultiplier
        );
        const overclockSpawnMultiplier = this.overclockSpawnMultiplier;

        // Calculate spawn interval (faster spawns = lower delay)
        // Base interval is middle of min/max, then divided by multiplier
        const baseInterval =
            (SPAWN_CONFIG.minInterval + SPAWN_CONFIG.maxInterval) / 2;
        const adjustedInterval = Math.max(
            SPAWN_CONFIG.minInterval,
            baseInterval /
                (spawnRateMultiplier *
                    prestigeSpawnMultiplier *
                    overclockSpawnMultiplier)
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

        if (this.currentLayer >= 6 && Math.random() < 0.1) {
            // Final boss (10% chance if layer 6)
            bossKey = "finalBoss";
            bossType = "red";
            points = ENEMY_CONFIG.red.points;
            health = ENEMY_CONFIG.red.health;
            speed = ENEMY_CONFIG.red.speed;
        } else if (this.currentLayer >= 5) {
            // Medium or mini boss
            if (Math.random() < 0.5) {
                bossKey = "mediumFinalBoss";
                bossType = "red";
                points = 300;
                health = 10; // Doubled from 5
                speed = 80;
            } else {
                bossKey = "miniFinalBoss";
                bossType = "red";
                points = 200;
                health = 6; // Doubled from 3
                speed = 100;
            }
        } else if (this.currentLayer >= 4) {
            // Purple boss
            bossKey = "enemyPurpleBoss";
            bossType = "purple";
            points = 150;
            health = 8; // Doubled from 4
            speed = 150;
        } else {
            return; // No boss for lower layers
        }

        const gameWidth = this.scale.width;
        const gameHeight = this.scale.height;
        const x = gameWidth + 50;
        const y = gameHeight / 2;

        const boss = this.physics.add.sprite(x, y, bossKey);
        boss.setScale(0.6 * MOBILE_SCALE);

        // Scale boss health and speed based on current layer
        const layerConfig =
            LAYER_CONFIG[this.currentLayer as keyof typeof LAYER_CONFIG];
        const healthMultiplier = layerConfig?.healthMultiplier || 1.0;
        const corruptionDifficultyMultiplier =
            this.getCorruptionDifficultyMultiplier();
        const scaledHealth = Math.ceil(
            health *
                healthMultiplier *
                this.prestigeDifficultyMultiplier *
                corruptionDifficultyMultiplier
        );
        const speedMultiplier = layerConfig?.bossSpeedMultiplier || 1.0;
        const scaledSpeed = Math.max(
            40,
            Math.round(
                speed *
                    speedMultiplier *
                    this.prestigeDifficultyMultiplier *
                    corruptionDifficultyMultiplier
            )
        );

        boss.setData("type", bossType);
        boss.setData("points", points);
        boss.setData("speed", scaledSpeed);
        boss.setData("health", scaledHealth);
        boss.setData("maxHealth", scaledHealth);
        boss.setData("canShoot", false);
        boss.setData("isBoss", true);
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

        // Boss moves toward player
        const angle = Phaser.Math.Angle.Between(
            boss.x,
            boss.y,
            this.player.x,
            this.player.y
        );

        const velocityX = Math.cos(angle) * scaledSpeed;
        const velocityY = Math.sin(angle) * scaledSpeed;
        boss.setVelocity(velocityX, velocityY);

        // Show announcement card for regular boss incoming
        const layerName =
            LAYER_CONFIG[this.currentLayer as keyof typeof LAYER_CONFIG].name;
        this.showAnnouncement(
            "BOSS INCOMING!",
            `Elite enemy detected in ${layerName}`,
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
        let bossKey = "";
        let bossType = "";
        let points = 0;
        let health = 0;
        let speed = 0;

        if (targetLayer >= 6) {
            // Final boss for layer 6
            bossKey = "finalBoss";
            bossType = "red";
            points = ENEMY_CONFIG.red.points * 2; // Double points for graduation boss
            health = ENEMY_CONFIG.red.health;
            speed = ENEMY_CONFIG.red.speed;
        } else if (targetLayer >= 5) {
            // Medium boss for layer 5
            bossKey = "mediumFinalBoss";
            bossType = "red";
            points = 500; // Higher points for graduation boss
            health = 15; // More health
            speed = 100;
        } else if (targetLayer >= 4) {
            // Purple boss for layer 4
            bossKey = "enemyPurpleBoss";
            bossType = "purple";
            points = 250; // Higher points
            health = 12; // More health
            speed = 150;
        } else if (targetLayer >= 3) {
            // Blue boss for layer 3 (use blue enemy sprite)
            bossKey = "enemyBlue";
            bossType = "blue";
            points = 150;
            health = 10;
            speed = 120;
        } else if (targetLayer >= 2) {
            // Yellow boss for layer 2
            bossKey = "enemyYellow";
            bossType = "yellow";
            points = 100;
            health = 6;
            speed = 150;
        } else {
            // Green boss for layer 1 (shouldn't happen, but just in case)
            bossKey = "enemyGreen";
            bossType = "green";
            points = 50;
            health = 4;
            speed = 100;
        }

        const gameWidth = this.scale.width;
        const gameHeight = this.scale.height;
        const x = gameWidth + 50;
        const y = gameHeight / 2;

        const boss = this.physics.add.sprite(x, y, bossKey);
        boss.setScale(0.7 * 3 * MOBILE_SCALE); // 3x larger for graduation bosses, scaled for mobile

        // Scale boss health and speed based on target layer
        const layerConfig =
            LAYER_CONFIG[targetLayer as keyof typeof LAYER_CONFIG];
        const healthMultiplier = layerConfig?.healthMultiplier || 1.0;
        const corruptionDifficultyMultiplier =
            this.getCorruptionDifficultyMultiplier();
        const scaledHealth = Math.ceil(
            health *
                healthMultiplier *
                10 *
                this.prestigeDifficultyMultiplier *
                corruptionDifficultyMultiplier
        ); // 10x toughness for graduation bosses
        const speedMultiplier = layerConfig?.bossSpeedMultiplier || 1.0;
        const scaledSpeed = Math.max(
            40,
            Math.round(
                speed *
                    speedMultiplier *
                    this.prestigeDifficultyMultiplier *
                    corruptionDifficultyMultiplier
            )
        );

        boss.setData("type", bossType);
        boss.setData("points", points);
        boss.setData("speed", scaledSpeed);
        boss.setData("health", scaledHealth);
        boss.setData("maxHealth", scaledHealth);
        boss.setData("canShoot", true); // Graduation bosses can shoot
        boss.setData("isBoss", true);
        boss.setData("isGraduationBoss", true); // Mark as graduation boss
        boss.setData("lastShot", 0);
        boss.setData("baseShootInterval", 1500);
        boss.setData("shootInterval", 1500); // Shoot every 1.5 seconds
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

        // Boss moves toward player
        const angle = Phaser.Math.Angle.Between(
            boss.x,
            boss.y,
            this.player.x,
            this.player.y
        );

        const velocityX = Math.cos(angle) * scaledSpeed;
        const velocityY = Math.sin(angle) * scaledSpeed;
        boss.setVelocity(velocityX, velocityY);

        // Visual effect - screen flash and shake
        this.cameras.main.flash(300, 255, 0, 0, false); // Red flash
        this.cameras.main.shake(500, 0.02);

        // Show announcement card for boss incoming
        const bossName =
            LAYER_CONFIG[targetLayer as keyof typeof LAYER_CONFIG].name;
        this.showAnnouncement(
            "GRADUATION BOSS INCOMING!",
            `Defeat it to advance to ${bossName}`,
            0xff0000 // Red color for warning
        );

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

        // Remove bullet
        b.destroy();

        // Get enemy data
        const enemyType = e.getData("type");
        const points = e.getData("points");
        let health = e.getData("health") || 1;
        const isBoss = e.getData("isBoss") || false;

        // Deal damage (apply shield drone reduction if applicable)
        const shieldReduction = this.getShieldDamageReduction(e);
        const damage = 1 * (1 - shieldReduction);
        health -= damage;
        e.setData("health", health);

        // Update health bar
        this.updateEnemyHealthBar(e);

        if (health <= 0) {
            // Check if this was a graduation boss BEFORE adding score
            const isGraduationBoss = e.getData("isGraduationBoss") || false;
            this.totalEnemiesDefeated += 1;
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
                this.lastRiskyKillTime = this.time.now;
            }
            if (isBoss || isGraduationBoss) {
                this.addCorruption(CORRUPTION_SYSTEM.riskPlayBonus.defeatBoss);
                this.runBossesDefeated += 1;
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
                if (this.pendingLayer >= MAX_LAYER) {
                    this.enterPrestigeMode(e.x, e.y);
                } else {
                this.currentLayer = this.pendingLayer;
                if (this.pendingLayer > this.deepestLayer) {
                    this.deepestLayer = this.pendingLayer;
                }
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

                // Update grid color when layer changes
                this.drawBackgroundGrid();

                // Visual effect for layer transition
                this.cameras.main.flash(500, 0, 255, 0, false); // Green flash for success
                this.cameras.main.shake(300, 0.01);

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

                // Resume normal enemy spawning
                this.updateSpawnTimer();

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
        const damageMultiplier = (b.getData("damageMultiplier") as number) || 1;

        // Remove bullet
        b.destroy();

        // Take damage (lose a life)
        this.takeDamage(damageMultiplier);
    }

    private handlePlayerEnemyCollision(
        _player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
        _enemy: Phaser.Types.Physics.Arcade.GameObjectWithBody
    ) {
        if (this.gameOver) return;
        const enemy = _enemy as Phaser.Physics.Arcade.Sprite;
        const damageMultiplier =
            (enemy.getData("damageMultiplier") as number) || 1;

        // Player takes damage (loses 1 life)
        // The takeDamage() method already creates an explosion at player position
        this.takeDamage(damageMultiplier);

        // Enemy is NOT destroyed - it continues to exist and can damage player again
        // This makes enemies more dangerous and requires players to shoot them
    }

    private takeDamage(damageMultiplier: number = 1) {
        // If player has invisibility power-up, ignore damage
        if (this.isInvisible) {
            return; // Invisible, no damage taken
        }

        // Prevent multiple damage calls within invincibility period
        // This matches the visual flash duration and prevents rapid damage
        const timeSinceLastHit = this.time.now - this.lastHitTime;
        const invincibilityWindow = 1000 + this.challengeInvincibilityBonusMs;
        if (timeSinceLastHit < invincibilityWindow) {
            return; // Still in invincibility period, ignore damage
        }

        // Safety check: ensure lives is a valid number
        if (this.lives <= 0) {
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

        // Reduce lives by exactly 1
        const previousLives = this.lives;
        let damage = 1;
        if (damageMultiplier > 1) {
            const bonusChance = Phaser.Math.Clamp(damageMultiplier - 1, 0, 1);
            if (Math.random() < bonusChance) {
                damage = 2;
            }
        }
        this.lives = Math.max(0, this.lives - damage);
        this.registry.set("lives", this.lives);

        // Debug: Log lives to help diagnose
        console.log(
            `Player took damage. Lives: ${previousLives} -> ${this.lives}`
        );

        // Game over only when lives equals 0
        if (this.lives === 0) {
            // Game over
            this.gameOver = true;
            this.registry.set("gameOver", true);
            this.registry.set("finalScore", this.score);
            this.registry.set("deepestLayer", this.deepestLayer);
            this.activeChallenge = null;
            this.registry.set("challengeActive", false);
            this.registry.set("challengeProgress", 0);
            addLifetimeScore(this.score);
            addLifetimePlayMs(this.time.now - this.runStartTime);
            const lifetime = getLifetimeStats();
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

            // Stop all movement and touch controls
            this.player.setVelocity(0, 0);
            this.enemies.children.entries.forEach((enemy) => {
                const e = enemy as Phaser.Physics.Arcade.Sprite;
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
                const survivalTime = Math.round(
                    (this.time.now - this.runStartTime) / 1000
                );
                const runMetrics = {
                    survivalTime,
                    maxCorruptionReached: this.maxCorruptionReached,
                    totalEnemiesDefeated: this.totalEnemiesDefeated,
                    runsWithoutDamage: this.tookDamageThisRun ? 0 : 1,
                    peakComboMultiplier: Number(this.peakComboMultiplier.toFixed(2)),
                    timeToReachLayer6: this.timeToReachLayer6 || undefined,
                    deepestLayerWithPrestige:
                        this.deepestLayer + this.prestigeLevel,
                };
                // Communicate to UIScene via game events
                const uiScene = this.scene.get("UIScene");
                if (uiScene && uiScene.scene.isActive()) {
                    uiScene.events.emit(
                        "submitScore",
                        this.score,
                        walletAddress,
                        this.deepestLayer,
                        this.prestigeLevel,
                        runMetrics
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

            const behaviors =
                (enemy.getData("behaviors") as string[] | undefined) || [];
            const isBoss = !!enemy.getData("isBoss");
            const target = this.getTargetPositionForEnemy(behaviors, isBoss);
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
                this.getCorruptionDifficultyMultiplier();
            const damageMultiplier =
                (enemy.getData("damageMultiplier") as number) || 1;

            const velocityX = Math.cos(angle) * bulletSpeed;
            const velocityY = Math.sin(angle) * bulletSpeed;
            bullet.setVelocity(velocityX, velocityY);
            bullet.setData("damageMultiplier", damageMultiplier);
        }
    }

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
            // Grant lives
            this.lives += config.livesGranted;
            this.registry.set("lives", this.lives);
            this.runLifeOrbs += 1;
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

            // Increase firepower level and fire rate
            this.firepowerLevel += config.firepowerLevel;
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
                this.fireRateMultiplier /= config.fireRateMultiplier;
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
        // Apply score multiplier from power-ups
        const corruptionMultiplier =
            this.getCorruptionScoreMultiplier() * this.challengeCorruptionMultiplier;
        const adjustedPoints = Math.floor(
            points *
                this.scoreMultiplier *
                this.comboMultiplier *
                this.prestigeScoreMultiplier *
                corruptionMultiplier *
                this.overclockScoreMultiplier *
                this.challengeScoreMultiplier *
                this.sessionScoreMultiplier *
                this.sessionStreakScoreMultiplier
        );
        this.score += adjustedPoints;
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
            const comboBonus =
                (this.comboMultiplier - 2) *
                CORRUPTION_SYSTEM.riskPlayBonus.comboMultiplier;
            this.addCorruption(comboBonus);
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

        // Determine target layer based on score thresholds
        let targetLayer = 1;
        for (let layer = MAX_LAYER; layer >= 1; layer--) {
            if (
                this.score >=
                LAYER_CONFIG[layer as keyof typeof LAYER_CONFIG].scoreThreshold
            ) {
                targetLayer = layer;
                break;
            }
        }

        // If we've reached a new layer threshold, spawn graduation boss
        if (targetLayer > this.currentLayer) {
            this.pendingLayer = targetLayer;
            this.spawnGraduationBoss(targetLayer);
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
        this.prestigeLevel = 0;
        this.prestigeDifficultyMultiplier = 1;
        this.prestigeScoreMultiplier = 1;
        this.prestigeResetAvailable = true;
        this.corruption = CORRUPTION_SYSTEM.currentCorruption;
        this.lastNoHitRewardTime = 0;
        this.lastRiskyKillTime = 0;
        this.currentCorruptionTier = "low";
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
        this.lives = PLAYER_CONFIG.initialLives;
        this.graduationBossActive = false;
        this.pendingLayer = 1;

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
        this.registry.set("gameOver", false);
        this.registry.set("comboMultiplier", 1);
        this.registry.set("currentLayer", 1);
        this.registry.set("layerName", LAYER_CONFIG[1].name);
        this.registry.set("isPaused", false);
        this.registry.set("lives", this.lives);
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
        this.registry.set("corruption", this.corruption);
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
        this.nextChallengeTime =
            this.runStartTime + MID_RUN_CHALLENGES.triggerIntervals.firstChallenge;
        this.lastChallengeEndTime = this.runStartTime;
        this.applySessionRewards(this.runStartTime);
        this.resetAdaptiveLearning();
        this.startBehaviorResetTimer();
        this.updatePrestigeEffects();
        this.startCorruptionTimer();
        this.updateCorruptionEffects();

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
        this.prestigeLevel += 1;
        this.applyPrestigeLevel(this.prestigeLevel);

        if (
            this.prestigeResetAvailable &&
            this.score >= PRESTIGE_CONFIG.prestigeResetThreshold
        ) {
            this.score = 0;
            this.comboMultiplier = 1;
            this.registry.set("score", this.score);
            this.registry.set("comboMultiplier", this.comboMultiplier);
            this.prestigeResetAvailable = false;
        }

        this.currentLayer = 1;
        this.pendingLayer = 1;
        if (this.deepestLayer < MAX_LAYER) {
            this.deepestLayer = MAX_LAYER;
        }
        this.registry.set("currentLayer", this.currentLayer);
        this.registry.set("layerName", LAYER_CONFIG[1].name);

        const prestigeTier = this.getPrestigeTier(this.prestigeLevel);
        this.showAnnouncement(
            "PRESTIGE UNLOCKED!",
            `Cycle ${this.prestigeLevel} · ${prestigeTier.label}`,
            0xff00ff
        );

        this.drawBackgroundGrid();
        this.updateSpawnTimer();
        this.updatePrestigeEffects();

        this.cameras.main.flash(700, 255, 0, 255, false);
        this.cameras.main.shake(500, 0.02);

        for (let i = 0; i < 4; i++) {
            this.time.delayedCall(i * 200, () => {
                this.spawnLivesPowerUp(
                    originX + Phaser.Math.Between(-60, 60),
                    originY + Phaser.Math.Between(-60, 60)
                );
            });
        }
    }

    private applyPrestigeLevel(level: number) {
        const prestigeTier = this.getPrestigeTier(level);
        this.prestigeDifficultyMultiplier = prestigeTier.difficultyMultiplier;
        this.prestigeScoreMultiplier = prestigeTier.scoreMultiplier;
        this.prestigeResetAvailable = true;

        this.registry.set("prestigeLevel", this.prestigeLevel);
        this.registry.set(
            "prestigeScoreMultiplier",
            this.prestigeScoreMultiplier
        );
        this.registry.set(
            "prestigeDifficultyMultiplier",
            this.prestigeDifficultyMultiplier
        );

        const prestigeChampion = this.prestigeLevel >= 10;
        this.registry.set("prestigeChampion", prestigeChampion);
        if (this.prestigeLevel >= 1) {
            this.unlockAchievementWithAnnouncement("prestige_1");
        }
        if (this.prestigeLevel >= 5) {
            this.unlockAchievementWithAnnouncement("prestige_5");
        }
        if (this.prestigeLevel >= 10) {
            this.unlockAchievementWithAnnouncement("prestige_10");
        }
    }

    private getPrestigeTier(level: number) {
        const tier = PRESTIGE_CONFIG.prestigeLevels.find(
            (entry) => entry.level === level
        );
        if (tier) {
            return { ...tier, label: `Tier ${tier.level}` };
        }

        const difficultyMultiplier = 1.5 + (level - 1) * 0.5;
        const scoreMultiplier = 1.0 + (level - 1) * 0.5;
        return {
            level,
            difficultyMultiplier,
            scoreMultiplier,
            label: `Tier ${level}`,
        };
    }

    private getPrestigeGridColor(baseColor: number) {
        if (this.prestigeLevel <= 0) {
            return baseColor;
        }
        const base = Phaser.Display.Color.ValueToColor(baseColor);
        const hsl = Phaser.Display.Color.RGBToHSV(base.r, base.g, base.b);
        const hueShift = (this.prestigeLevel * 25) % 360;
        const shifted = Phaser.Display.Color.HSVToRGB(
            (hsl.h * 360 + hueShift) / 360,
            Math.min(1, hsl.s + 0.1),
            Math.min(1, hsl.v + 0.1)
        );
        return Phaser.Display.Color.GetColor(shifted.r, shifted.g, shifted.b);
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
                this.cameras.main.flash(120, 255, 0, 100, false);
            },
        });

        if (PRESTIGE_CONFIG.visualEffects.corruptionVFX) {
            const glitchIntensity =
                PRESTIGE_CONFIG.visualEffects.gridGlitchIntensity +
                this.prestigeLevel * 0.05;
            this.prestigeGlitchTimer = this.time.addEvent({
                delay: 350,
                loop: true,
                callback: () => {
                    if (!this.backgroundGrid) return;
                    const offset = 6 * glitchIntensity;
                    this.backgroundGrid.setPosition(
                        Phaser.Math.FloatBetween(-offset, offset),
                        Phaser.Math.FloatBetween(-offset, offset)
                    );
                    this.backgroundGrid.setAlpha(
                        Phaser.Math.Clamp(0.6 + glitchIntensity, 0.6, 0.95)
                    );
                },
            });
        }
    }
}
