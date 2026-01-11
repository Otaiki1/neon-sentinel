import Phaser from "phaser";
import {
    PLAYER_CONFIG,
    ENEMY_CONFIG,
    SPAWN_CONFIG,
    LAYER_CONFIG,
    POWERUP_CONFIG,
} from "../config";

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
    private enemyBullets!: Phaser.Physics.Arcade.Group;
    private isPaused = false;
    private powerUps!: Phaser.Physics.Arcade.Group;
    private speedMultiplier = 1;
    private fireRateMultiplier = 1;
    private scoreMultiplier = 1;
    private powerUpTimers: Map<string, Phaser.Time.TimerEvent> = new Map();
    private autoShootEnabled = false;
    private spaceKey!: Phaser.Input.Keyboard.Key;

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
        this.player.setScale(0.5);

        // Create groups
        this.bullets = this.physics.add.group({
            defaultKey: "greenBullet1",
            maxSize: 50,
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

        // Mouse input for shooting
        this.input.on("pointerdown", () => {
            if (!this.isPaused && !this.gameOver) {
                this.shoot();
            }
        });

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
    }

    private drawBackgroundGrid() {
        const width = this.scale.width;
        const height = this.scale.height;
        const gridSize = 40;

        // Get grid color based on current layer
        const layerConfig =
            LAYER_CONFIG[this.currentLayer as keyof typeof LAYER_CONFIG];
        const gridColor = layerConfig?.gridColor || 0x00ff00;

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
    }

    update(time: number) {
        // Pause/resume is handled by UIScene ESC key handler
        // GameScene update continues to run even when paused so UIScene can handle input

        if (this.gameOver || this.isPaused) return;

        // Player movement
        this.handlePlayerMovement();

        // Shooting - manual or auto-shoot power-up
        const currentFireRate =
            PLAYER_CONFIG.fireRate * this.fireRateMultiplier;

        if (this.autoShootEnabled) {
            // Auto-shoot when power-up is active
            if (time > this.lastFired) {
                this.shoot();
                this.lastFired = time + currentFireRate;
            }
        } else {
            // Manual shooting with spacebar or mouse
            if (
                (this.spaceKey.isDown || this.input.activePointer.isDown) &&
                time > this.lastFired
            ) {
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

            // Remove enemies that go off the right edge
            if (enemy.x > gameWidth + 100) {
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

            const canShoot = enemy.getData("canShoot");

            if (canShoot && enemy.active) {
                const lastShot = enemy.getData("lastShot") || 0;
                const shootInterval = enemy.getData("shootInterval") || 2000;

                if (time - lastShot > shootInterval) {
                    this.enemyShoot(enemy);
                    enemy.setData("lastShot", time);
                }
            }
        });

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
        const currentSpeed = PLAYER_CONFIG.speed * this.speedMultiplier;

        // Arrow keys or WASD
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

        this.player.setVelocity(velocityX, velocityY);
    }

    private shoot() {
        if (this.gameOver) return;

        const bullet = this.bullets.get(
            this.player.x + 30,
            this.player.y
        ) as Phaser.Physics.Arcade.Sprite;

        if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.setScale(0.5);
            bullet.setVelocityX(PLAYER_CONFIG.bulletSpeed);
            bullet.setVelocityY(0);
        }
    }

    private spawnEnemy() {
        if (this.gameOver) return;

        // Get max enemies based on current layer
        const currentLayerConfig =
            LAYER_CONFIG[this.currentLayer as keyof typeof LAYER_CONFIG];
        const maxEnemiesMultiplier =
            currentLayerConfig?.spawnRateMultiplier || 1.0;
        const currentMaxEnemies = Math.floor(
            SPAWN_CONFIG.baseMaxEnemies * maxEnemiesMultiplier
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

        // Get available enemy types for current layer
        const availableEnemies = [...currentLayerConfig.enemies] as Array<
            keyof typeof ENEMY_CONFIG
        >;

        // Calculate weights for available enemies
        const weights = availableEnemies.map(
            (type) => ENEMY_CONFIG[type].spawnWeight
        );
        const totalWeight = weights.reduce((a: number, b: number) => a + b, 0);

        if (totalWeight === 0) return; // No enemies available

        let random = Phaser.Math.Between(0, totalWeight - 1);
        let selectedType: keyof typeof ENEMY_CONFIG = availableEnemies[0];

        for (let i = 0; i < availableEnemies.length; i++) {
            random -= weights[i];
            if (random < 0) {
                selectedType = availableEnemies[i];
                break;
            }
        }

        const config = ENEMY_CONFIG[selectedType];

        // Map enemy type to sprite key
        const keyMap: Record<string, string> = {
            green: "enemyGreen",
            yellow: "enemyYellow",
            blue: "enemyBlue",
            purple: "enemyPurple",
        };
        const key = keyMap[selectedType] || "enemyGreen";

        // Spawn from right side only (for easier bullet trajectory)
        const gameWidth = this.scale.width;
        const gameHeight = this.scale.height;
        const x = gameWidth + 50;
        const y = Phaser.Math.Between(50, gameHeight - 50);

        const enemy = this.physics.add.sprite(x, y, key);
        enemy.setScale(0.5);

        // Scale health based on current layer
        const healthMultiplier = currentLayerConfig?.healthMultiplier || 1.0;
        const scaledHealth = Math.ceil(config.health * healthMultiplier);

        enemy.setData("type", selectedType);
        enemy.setData("points", config.points);
        enemy.setData("speed", config.speed);
        enemy.setData("health", scaledHealth);
        enemy.setData("maxHealth", scaledHealth);
        enemy.setData("canShoot", config.canShoot || false);

        // Set last shoot time for shooting enemies
        if (config.canShoot) {
            enemy.setData("lastShot", 0);
            enemy.setData(
                "shootInterval",
                (config as any).shootInterval || 2000
            );
        }

        this.enemies.add(enemy);

        // Move toward player with slight randomness
        const angle =
            Phaser.Math.Angle.Between(
                enemy.x,
                enemy.y,
                this.player.x,
                this.player.y
            ) + Phaser.Math.FloatBetween(-0.2, 0.2);

        const velocityX = Math.cos(angle) * config.speed;
        const velocityY = Math.sin(angle) * config.speed;
        enemy.setVelocity(velocityX, velocityY);
    }

    private updateSpawnTimer() {
        // Get spawn rate multiplier based on current layer
        const layerConfig =
            LAYER_CONFIG[this.currentLayer as keyof typeof LAYER_CONFIG];
        const spawnRateMultiplier = layerConfig?.spawnRateMultiplier || 1.0;

        // Calculate spawn interval (faster spawns = lower delay)
        // Base interval is middle of min/max, then divided by multiplier
        const baseInterval =
            (SPAWN_CONFIG.minInterval + SPAWN_CONFIG.maxInterval) / 2;
        const adjustedInterval = Math.max(
            SPAWN_CONFIG.minInterval,
            baseInterval / spawnRateMultiplier
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
        boss.setScale(0.6);

        // Scale boss health based on current layer
        const layerConfig =
            LAYER_CONFIG[this.currentLayer as keyof typeof LAYER_CONFIG];
        const healthMultiplier = layerConfig?.healthMultiplier || 1.0;
        const scaledHealth = Math.ceil(health * healthMultiplier);

        boss.setData("type", bossType);
        boss.setData("points", points);
        boss.setData("speed", speed);
        boss.setData("health", scaledHealth);
        boss.setData("maxHealth", scaledHealth);
        boss.setData("canShoot", false);
        boss.setData("isBoss", true);

        this.enemies.add(boss);

        // Boss moves toward player
        const angle = Phaser.Math.Angle.Between(
            boss.x,
            boss.y,
            this.player.x,
            this.player.y
        );

        const velocityX = Math.cos(angle) * speed;
        const velocityY = Math.sin(angle) * speed;
        boss.setVelocity(velocityX, velocityY);
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

        // Deal damage
        health -= 1;
        e.setData("health", health);

        if (health <= 0) {
            // Enemy destroyed
            this.addScore(points * this.comboMultiplier);

            // Create explosion based on enemy type and layer
            const explosionSize = this.getExplosionSize(enemyType, isBoss);
            this.createExplosion(e.x, e.y, explosionSize);

            // Spawn lives power-up (50% chance from all enemies)
            if (Math.random() < POWERUP_CONFIG.livesSpawnChance) {
                this.spawnLivesPowerUp(e.x, e.y);
            }
            // Spawn other power-ups from purple/red enemies (25% chance)
            else if (
                (enemyType === "purple" || enemyType === "red" || isBoss) &&
                Math.random() < POWERUP_CONFIG.spawnChance
            ) {
                this.spawnPowerUp(e.x, e.y);
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

        // Take damage (lose a life)
        this.takeDamage();
    }

    private handlePlayerEnemyCollision(
        _player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
        enemy: Phaser.Types.Physics.Arcade.GameObjectWithBody
    ) {
        if (this.gameOver) return;

        const e = enemy as Phaser.Physics.Arcade.Sprite;

        // Player takes damage (loses 1 life)
        this.takeDamage();

        // Destroy the enemy
        const enemyType = e.getData("type");
        const isBoss = e.getData("isBoss") || false;

        // Create explosion for the enemy
        const explosionSize = this.getExplosionSize(enemyType, isBoss);
        this.createExplosion(e.x, e.y, explosionSize);

        // Destroy the enemy
        e.destroy();
    }

    private takeDamage() {
        // Reset combo
        this.comboMultiplier = 1;
        this.lastHitTime = this.time.now;
        this.registry.set("comboMultiplier", this.comboMultiplier);

        // Create explosion
        this.createExplosion(this.player.x, this.player.y, "medium");

        // Reduce lives by exactly 1
        this.lives -= 1;
        this.registry.set("lives", this.lives);

        // Game over only when lives equals 0
        if (this.lives === 0) {
            // Game over
            this.gameOver = true;
            this.registry.set("gameOver", true);
            this.registry.set("finalScore", this.score);
            this.registry.set("deepestLayer", this.deepestLayer);

            // Stop all movement
            this.player.setVelocity(0, 0);
            this.enemies.children.entries.forEach((enemy) => {
                const e = enemy as Phaser.Physics.Arcade.Sprite;
                e.setVelocity(0, 0);
            });
            this.enemyBullets.children.entries.forEach((bullet) => {
                const b = bullet as Phaser.Physics.Arcade.Sprite;
                b.setVelocity(0, 0);
            });

            // Pause physics
            this.physics.pause();

            // Submit score after a short delay
            this.time.delayedCall(500, () => {
                const walletAddress = this.registry.get("walletAddress");
                // Communicate to UIScene via game events
                const uiScene = this.scene.get("UIScene");
                if (uiScene && uiScene.scene.isActive()) {
                    uiScene.events.emit(
                        "submitScore",
                        this.score,
                        walletAddress,
                        this.deepestLayer
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
        explosion.setScale(scale);

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

    private enemyShoot(enemy: Phaser.Physics.Arcade.Sprite) {
        const bullet = this.enemyBullets.get(
            enemy.x - 30,
            enemy.y
        ) as Phaser.Physics.Arcade.Sprite;

        if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.setScale(0.4);

            // Shoot toward player
            const angle = Phaser.Math.Angle.Between(
                enemy.x,
                enemy.y,
                this.player.x,
                this.player.y
            );

            const config =
                ENEMY_CONFIG[
                    enemy.getData("type") as keyof typeof ENEMY_CONFIG
                ];
            const bulletSpeed = (config as any).bulletSpeed || 200;

            const velocityX = Math.cos(angle) * bulletSpeed;
            const velocityY = Math.sin(angle) * bulletSpeed;
            bullet.setVelocity(velocityX, velocityY);
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
        powerUp.setScale(0.4);
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

        this.powerUps.add(powerUp);
    }

    private spawnLivesPowerUp(x: number, y: number) {
        const powerUpConfig = POWERUP_CONFIG.types.lives;

        const powerUp = this.physics.add.sprite(x, y, powerUpConfig.key);
        powerUp.setScale(0.5); // Slightly larger for visibility
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

        this.powerUps.add(powerUp);
    }

    private handlePlayerPowerUpCollision(
        _player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
        powerUp: Phaser.Types.Physics.Arcade.GameObjectWithBody
    ) {
        const p = powerUp as Phaser.Physics.Arcade.Sprite;
        const powerUpType = p.getData("type") as string;
        const config = p.getData("config");

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

            // Visual feedback with larger explosion
            this.createExplosion(this.player.x, this.player.y, "medium");
            return; // Early return - no need for small explosion
        }

        // Visual feedback
        this.createExplosion(this.player.x, this.player.y, "small");
    }

    private addScore(points: number) {
        // Apply score multiplier from power-ups
        const adjustedPoints = Math.floor(points * this.scoreMultiplier);
        this.score += adjustedPoints;
        this.comboMultiplier += 0.1;
        this.lastHitTime = this.time.now;

        // Update layer based on score
        this.updateLayer();

        this.registry.set("score", this.score);
        this.registry.set("comboMultiplier", this.comboMultiplier);
    }

    private updateLayer() {
        // Determine current layer based on score thresholds
        let newLayer = 1;
        for (let layer = 6; layer >= 1; layer--) {
            if (
                this.score >=
                LAYER_CONFIG[layer as keyof typeof LAYER_CONFIG].scoreThreshold
            ) {
                newLayer = layer;
                break;
            }
        }

        if (newLayer > this.currentLayer) {
            this.currentLayer = newLayer;
            if (newLayer > this.deepestLayer) {
                this.deepestLayer = newLayer;
            }
            this.registry.set("currentLayer", this.currentLayer);
            this.registry.set(
                "layerName",
                LAYER_CONFIG[newLayer as keyof typeof LAYER_CONFIG].name
            );

            // Update grid color when layer changes
            this.drawBackgroundGrid();

            // Visual effect for layer transition
            this.cameras.main.flash(500, 255, 255, 255, false);

            // Update spawn timer for new layer (faster spawns)
            this.updateSpawnTimer();
        }
    }

    public togglePause() {
        this.isPaused = !this.isPaused;
        this.registry.set("isPaused", this.isPaused);

        if (this.isPaused) {
            this.physics.pause();
            // Stop all movement
            this.player.setVelocity(0, 0);
            this.enemies.children.entries.forEach((enemy) => {
                const e = enemy as Phaser.Physics.Arcade.Sprite;
                e.setVelocity(0, 0);
            });
            this.bullets.children.entries.forEach((bullet) => {
                const b = bullet as Phaser.Physics.Arcade.Sprite;
                b.setVelocity(0, 0);
            });
            this.enemyBullets.children.entries.forEach((bullet) => {
                const b = bullet as Phaser.Physics.Arcade.Sprite;
                b.setVelocity(0, 0);
            });
        } else {
            this.physics.resume();
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
        this.lives = PLAYER_CONFIG.initialLives;

        // Reset player to dynamic position
        const gameWidth = this.scale.width;
        const gameHeight = this.scale.height;
        const startX = gameWidth * 0.1; // 10% from left
        const startY = gameHeight * 0.9; // 90% from top (near bottom)
        this.player.setPosition(startX, startY);
        this.player.setVelocity(0, 0);

        // Clear enemies and bullets
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
}
