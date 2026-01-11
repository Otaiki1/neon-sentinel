import Phaser from 'phaser';
import { 
  GAME_CONFIG, 
  PLAYER_CONFIG, 
  ENEMY_CONFIG, 
  SPAWN_CONFIG,
  LAYER_CONFIG
} from '../config';

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private bullets!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private explosions!: Phaser.GameObjects.Group;
  
  private lastFired = 0;
  private spawnTimer: Phaser.Time.TimerEvent | null = null;
  private nextSpawnTime = SPAWN_CONFIG.initialDelay;
  private gameOver = false;
  private score = 0;
  private comboMultiplier = 1;
  private lastHitTime = 0;
  private backgroundGrid!: Phaser.GameObjects.Graphics;
  private currentLayer = 1;
  private deepestLayer = 1;
  private enemyBullets!: Phaser.Physics.Arcade.Group;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // Draw background grid
    this.drawBackgroundGrid();

    // Create player
    this.player = this.physics.add.sprite(
      PLAYER_CONFIG.startX,
      PLAYER_CONFIG.startY,
      'hero'
    );
    this.player.setCollideWorldBounds(true);
    this.player.setScale(0.5);

    // Create groups
    this.bullets = this.physics.add.group({
      defaultKey: 'greenBullet1',
      maxSize: 50,
    });

    this.enemyBullets = this.physics.add.group({
      defaultKey: 'blueBullet',
      maxSize: 30,
    });

    this.enemies = this.physics.add.group();

    this.explosions = this.add.group();

    // Input setup
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys('W,S,A,D') as Record<string, Phaser.Input.Keyboard.Key>;
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Mouse input for shooting
    this.input.on('pointerdown', () => {
      this.shoot();
    });

    // Collisions
    this.physics.add.overlap(
      this.bullets,
      this.enemies,
      this.handleBulletEnemyCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.enemies,
      this.handlePlayerEnemyCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    // Collision between player and enemy bullets
    this.physics.add.overlap(
      this.player,
      this.enemyBullets,
      this.handlePlayerEnemyBulletCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    // Spawn timer - will be created after initial delay
    this.time.delayedCall(this.nextSpawnTime, () => {
      this.spawnEnemy();
      this.spawnTimer = this.time.addEvent({
        delay: SPAWN_CONFIG.minInterval + (SPAWN_CONFIG.maxInterval - SPAWN_CONFIG.minInterval) * 0.5,
        callback: this.spawnEnemy,
        callbackScope: this,
        loop: true,
      });
    });

    // Register scene with registry for UI communication
    this.registry.set('score', this.score);
    this.registry.set('gameOver', false);
    this.registry.set('comboMultiplier', this.comboMultiplier);
    this.registry.set('currentLayer', this.currentLayer);
    this.registry.set('layerName', LAYER_CONFIG[1].name);
  }

  private drawBackgroundGrid() {
    const width = GAME_CONFIG.width;
    const height = GAME_CONFIG.height;
    const gridSize = 40;

    this.backgroundGrid = this.add.graphics();
    this.backgroundGrid.lineStyle(1, 0x00ff00, 0.3);

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
    if (this.gameOver) return;

    // Player movement
    this.handlePlayerMovement();

    // Shooting
    if ((this.spaceKey.isDown || this.input.activePointer.isDown) && 
        time > this.lastFired) {
      this.shoot();
      this.lastFired = time + PLAYER_CONFIG.fireRate;
    }

    // Remove bullets that are off screen (right edge)
    this.bullets.children.entries.forEach((bullet) => {
      const b = bullet as Phaser.Physics.Arcade.Sprite;
      if (b.x > GAME_CONFIG.width + 50 || b.x < -50) {
        b.destroy();
      }
    });

    // Remove enemy bullets that are off screen
    this.enemyBullets.children.entries.forEach((bullet) => {
      const b = bullet as Phaser.Physics.Arcade.Sprite;
      if (b.x < -50 || b.x > GAME_CONFIG.width + 50 || b.y < -50 || b.y > GAME_CONFIG.height + 50) {
        b.destroy();
      }
    });

    // Handle blue enemy shooting
    this.enemies.children.entries.forEach((enemyObj) => {
      const enemy = enemyObj as Phaser.Physics.Arcade.Sprite;
      const canShoot = enemy.getData('canShoot');
      
      if (canShoot && enemy.active) {
        const lastShot = enemy.getData('lastShot') || 0;
        const shootInterval = enemy.getData('shootInterval') || 2000;
        
        if (time - lastShot > shootInterval) {
          this.enemyShoot(enemy);
          enemy.setData('lastShot', time);
        }
      }
    });

    // Update combo multiplier (reset if player hasn't been hit in a while)
    const timeSinceLastHit = time - this.lastHitTime;
    if (timeSinceLastHit > 10000 && this.comboMultiplier > 1) {
      // Reduce combo over time if not getting hit
      this.comboMultiplier = Math.max(1, this.comboMultiplier * 0.99);
      this.registry.set('comboMultiplier', this.comboMultiplier);
    }
  }

  private handlePlayerMovement() {
    let velocityX = 0;
    let velocityY = 0;

    // Arrow keys or WASD
    if (this.cursors.left!.isDown || this.wasd['A'].isDown) {
      velocityX = -PLAYER_CONFIG.speed;
    } else if (this.cursors.right!.isDown || this.wasd['D'].isDown) {
      velocityX = PLAYER_CONFIG.speed;
    }

    if (this.cursors.up!.isDown || this.wasd['W'].isDown) {
      velocityY = -PLAYER_CONFIG.speed;
    } else if (this.cursors.down!.isDown || this.wasd['S'].isDown) {
      velocityY = PLAYER_CONFIG.speed;
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

    const activeEnemies = this.enemies.children.size;
    if (activeEnemies >= SPAWN_CONFIG.maxEnemies) {
      return;
    }

    // Check for boss spawn based on layer
    const layerConfig = LAYER_CONFIG[this.currentLayer as keyof typeof LAYER_CONFIG];
    if (layerConfig.bossChance > 0 && Math.random() < layerConfig.bossChance) {
      this.spawnBoss();
      return;
    }

    // Get available enemy types for current layer
    const availableEnemies = [...layerConfig.enemies] as Array<keyof typeof ENEMY_CONFIG>;
    
    // Calculate weights for available enemies
    const weights = availableEnemies.map(type => ENEMY_CONFIG[type].spawnWeight);
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
      green: 'enemyGreen',
      yellow: 'enemyYellow',
      blue: 'enemyBlue',
      purple: 'enemyPurple',
    };
    const key = keyMap[selectedType] || 'enemyGreen';

    // Spawn from right side only (for easier bullet trajectory)
    const x = GAME_CONFIG.width + 50;
    const y = Phaser.Math.Between(50, GAME_CONFIG.height - 50);

    const enemy = this.physics.add.sprite(x, y, key);
    enemy.setScale(0.5);
    enemy.setData('type', selectedType);
    enemy.setData('points', config.points);
    enemy.setData('speed', config.speed);
    enemy.setData('health', config.health);
    enemy.setData('canShoot', config.canShoot || false);
    
    // Set last shoot time for shooting enemies
    if (config.canShoot) {
      enemy.setData('lastShot', 0);
      enemy.setData('shootInterval', (config as any).shootInterval || 2000);
    }
    
    this.enemies.add(enemy);

    // Move toward player with slight randomness
    const angle = Phaser.Math.Angle.Between(
      enemy.x,
      enemy.y,
      this.player.x,
      this.player.y
    ) + Phaser.Math.FloatBetween(-0.2, 0.2);

    const velocityX = Math.cos(angle) * config.speed;
    const velocityY = Math.sin(angle) * config.speed;
    enemy.setVelocity(velocityX, velocityY);

    // Update next spawn time (difficulty scaling)
    if (this.spawnTimer) {
      const newDelay = Math.max(
        SPAWN_CONFIG.minInterval,
        this.spawnTimer.delay * SPAWN_CONFIG.difficultyIncrease
      );
      
      // Update timer delay by removing and recreating
      this.spawnTimer.remove();
      this.spawnTimer = this.time.addEvent({
        delay: newDelay,
        callback: this.spawnEnemy,
        callbackScope: this,
        loop: true,
      });
    }
  }

  private spawnBoss() {
    let bossKey = '';
    let bossType = '';
    let points = 0;
    let health = 0;
    let speed = 0;

    if (this.currentLayer >= 6 && Math.random() < 0.1) {
      // Final boss (10% chance if layer 6)
      bossKey = 'finalBoss';
      bossType = 'red';
      points = ENEMY_CONFIG.red.points;
      health = ENEMY_CONFIG.red.health;
      speed = ENEMY_CONFIG.red.speed;
    } else if (this.currentLayer >= 5) {
      // Medium or mini boss
      if (Math.random() < 0.5) {
        bossKey = 'mediumFinalBoss';
        bossType = 'red';
        points = 300;
        health = 5;
        speed = 80;
      } else {
        bossKey = 'miniFinalBoss';
        bossType = 'red';
        points = 200;
        health = 3;
        speed = 100;
      }
    } else if (this.currentLayer >= 4) {
      // Purple boss
      bossKey = 'enemyPurpleBoss';
      bossType = 'purple';
      points = 150;
      health = 4;
      speed = 150;
    } else {
      return; // No boss for lower layers
    }

    const x = GAME_CONFIG.width + 50;
    const y = GAME_CONFIG.height / 2;

    const boss = this.physics.add.sprite(x, y, bossKey);
    boss.setScale(0.6);
    boss.setData('type', bossType);
    boss.setData('points', points);
    boss.setData('speed', speed);
    boss.setData('health', health);
    boss.setData('maxHealth', health);
    boss.setData('canShoot', false);
    boss.setData('isBoss', true);
    
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
    const enemyType = e.getData('type');
    const points = e.getData('points');
    let health = e.getData('health') || 1;
    const isBoss = e.getData('isBoss') || false;

    // Deal damage
    health -= 1;
    e.setData('health', health);

    if (health <= 0) {
      // Enemy destroyed
      this.addScore(points * this.comboMultiplier);

      // Create explosion based on enemy type and layer
      const explosionSize = this.getExplosionSize(enemyType, isBoss);
      this.createExplosion(e.x, e.y, explosionSize);

      // Remove enemy
      e.destroy();
    } else {
      // Enemy still alive - show small hit effect
      this.createExplosion(e.x, e.y, 'small');
    }
  }

  private getExplosionSize(enemyType: string, isBoss: boolean): 'small' | 'medium' | 'large' {
    if (isBoss || enemyType === 'red') {
      return 'large';
    } else if (enemyType === 'purple' || enemyType === 'blue') {
      return 'medium';
    } else if (this.currentLayer >= 5) {
      return 'medium'; // Bigger explosions in later layers
    }
    return 'small';
  }

  private handlePlayerEnemyBulletCollision(
    player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    bullet: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ) {
    if (this.gameOver) return;

    const b = bullet as Phaser.Physics.Arcade.Sprite;
    const p = player as Phaser.Physics.Arcade.Sprite;
    
    // Remove bullet
    b.destroy();

    // Reset combo
    this.comboMultiplier = 1;
    this.lastHitTime = this.time.now;
    this.registry.set('comboMultiplier', this.comboMultiplier);

    // Create explosion
    this.createExplosion(p.x, p.y, 'medium');

    // Game over
    this.gameOver = true;
    this.registry.set('gameOver', true);
    this.registry.set('finalScore', this.score);
    this.registry.set('deepestLayer', this.deepestLayer);

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
      const walletAddress = this.registry.get('walletAddress');
      // Communicate to UIScene via game events
      const uiScene = this.scene.get('UIScene');
      if (uiScene && uiScene.scene.isActive()) {
        uiScene.events.emit('submitScore', this.score, walletAddress, this.deepestLayer);
      }
    });
  }

  private handlePlayerEnemyCollision(
    player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    _enemy: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ) {
    if (this.gameOver) return;

    const p = player as Phaser.Physics.Arcade.Sprite;
    
    // Reset combo
    this.comboMultiplier = 1;
    this.lastHitTime = this.time.now;
    this.registry.set('comboMultiplier', this.comboMultiplier);

    // Create explosion
    this.createExplosion(p.x, p.y, 'medium');

    // Game over
    this.gameOver = true;
    this.registry.set('gameOver', true);
    this.registry.set('finalScore', this.score);
    this.registry.set('deepestLayer', this.deepestLayer);

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
      const walletAddress = this.registry.get('walletAddress');
      // Communicate to UIScene via game events
      const uiScene = this.scene.get('UIScene');
      if (uiScene && uiScene.scene.isActive()) {
        uiScene.events.emit('submitScore', this.score, walletAddress, this.deepestLayer);
      }
    });
  }

  private createExplosion(x: number, y: number, size: 'small' | 'medium' | 'large') {
    let key = 'smallFire';
    let scale = 0.5;
    
    if (size === 'large') {
      key = 'bigFire';
      scale = 0.8;
    } else if (size === 'medium') {
      key = 'mediumFire';
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
      
      const config = ENEMY_CONFIG[enemy.getData('type') as keyof typeof ENEMY_CONFIG];
      const bulletSpeed = (config as any).bulletSpeed || 200;
      
      const velocityX = Math.cos(angle) * bulletSpeed;
      const velocityY = Math.sin(angle) * bulletSpeed;
      bullet.setVelocity(velocityX, velocityY);
    }
  }

  private addScore(points: number) {
    this.score += Math.floor(points);
    this.comboMultiplier += 0.1;
    this.lastHitTime = this.time.now;
    
    // Update layer based on score
    this.updateLayer();
    
    this.registry.set('score', this.score);
    this.registry.set('comboMultiplier', this.comboMultiplier);
  }

  private updateLayer() {
    // Determine current layer based on score thresholds
    let newLayer = 1;
    for (let layer = 6; layer >= 1; layer--) {
      if (this.score >= LAYER_CONFIG[layer as keyof typeof LAYER_CONFIG].scoreThreshold) {
        newLayer = layer;
        break;
      }
    }

    if (newLayer > this.currentLayer) {
      this.currentLayer = newLayer;
      if (newLayer > this.deepestLayer) {
        this.deepestLayer = newLayer;
      }
      this.registry.set('currentLayer', this.currentLayer);
      this.registry.set('layerName', LAYER_CONFIG[newLayer as keyof typeof LAYER_CONFIG].name);
    }
  }

  public restart() {
    // Reset game state
    this.gameOver = false;
    this.score = 0;
    this.comboMultiplier = 1;
    this.lastHitTime = 0;
    this.nextSpawnTime = SPAWN_CONFIG.initialDelay;
    this.currentLayer = 1;

    // Reset player
    this.player.setPosition(PLAYER_CONFIG.startX, PLAYER_CONFIG.startY);
    this.player.setVelocity(0, 0);

    // Clear enemies and bullets
    this.enemies.clear(true, true);
    this.bullets.clear(true, true);
    this.enemyBullets.clear(true, true);
    this.explosions.clear(true, true);

    // Resume physics
    this.physics.resume();

    // Reset registry
    this.registry.set('score', 0);
    this.registry.set('gameOver', false);
    this.registry.set('comboMultiplier', 1);
    this.registry.set('currentLayer', 1);
    this.registry.set('layerName', LAYER_CONFIG[1].name);

    // Reset spawn timer
    if (this.spawnTimer) {
      this.spawnTimer.remove();
    }
    this.time.delayedCall(this.nextSpawnTime, () => {
      this.spawnEnemy();
      this.spawnTimer = this.time.addEvent({
        delay: SPAWN_CONFIG.minInterval + (SPAWN_CONFIG.maxInterval - SPAWN_CONFIG.minInterval) * 0.5,
        callback: this.spawnEnemy,
        callbackScope: this,
        loop: true,
      });
    });
  }
}

