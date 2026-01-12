import Phaser from 'phaser';
import { UI_CONFIG, MOBILE_SCALE } from '../config';
import { GameScene } from './GameScene';

export class UIScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private layerText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private gameOverContainer!: Phaser.GameObjects.Container;
  private gameOverText!: Phaser.GameObjects.Text;
  private finalScoreText!: Phaser.GameObjects.Text;
  private pauseContainer!: Phaser.GameObjects.Container;
  private pauseText!: Phaser.GameObjects.Text;
  private leaderboardPanel!: Phaser.GameObjects.Container;
  private leaderboardVisible = false;
  // Buttons
  private pauseButton!: Phaser.GameObjects.Container;
  private restartButton!: Phaser.GameObjects.Container;
  private menuButton!: Phaser.GameObjects.Container;
  private resumeButton!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    // Mobile UI scaling - reduce sizes on mobile
    const uiScale = MOBILE_SCALE < 1.0 ? 0.6 : 1.0; // 60% size on mobile
    const baseX = MOBILE_SCALE < 1.0 ? 15 : 30; // Closer to edge on mobile
    const baseY = MOBILE_SCALE < 1.0 ? 15 : 30;
    const lineSpacing = MOBILE_SCALE < 1.0 ? 20 : 30;

    // Score display (top-left) - Scaled for mobile
    this.scoreText = this.add.text(baseX, baseY, 'SCORE: 0', {
      fontFamily: UI_CONFIG.scoreFont,
      fontSize: 56 * uiScale,
      color: UI_CONFIG.neonGreen,
      stroke: '#000000',
      strokeThickness: 8 * uiScale,
    });
    this.scoreText.setOrigin(0, 0); // Top-left anchor
    // Add glow effect using shadow (reduced on mobile)
    if (MOBILE_SCALE >= 1.0) {
      this.scoreText.setShadow(2, 2, '#00ff00', 8, true, true);
    } else {
      this.scoreText.setShadow(1, 1, '#00ff00', 4, true, true);
      this.scoreText.setAlpha(0.9); // Slightly transparent on mobile to reduce obstruction
    }

    // Combo multiplier display (adjusted position to accommodate larger score)
    this.comboText = this.add.text(baseX, baseY + lineSpacing * 2, 'COMBO: 1.0x', {
      fontFamily: UI_CONFIG.scoreFont,
      fontSize: 24 * uiScale,
      color: UI_CONFIG.neonGreen,
      stroke: '#000000',
      strokeThickness: 3 * uiScale,
    });
    if (MOBILE_SCALE < 1.0) {
      this.comboText.setAlpha(0.85); // Slightly transparent on mobile
    }

    // Layer display - Oxanium for menu/subtitle style (adjusted position)
    this.layerText = this.add.text(baseX, baseY + lineSpacing * 3, 'LAYER: Boot Sector', {
      fontFamily: UI_CONFIG.menuFont,
      fontSize: UI_CONFIG.fontSize.small * uiScale,
      color: UI_CONFIG.neonGreen,
      stroke: '#000000',
      strokeThickness: 3 * uiScale,
    });
    if (MOBILE_SCALE < 1.0) {
      this.layerText.setAlpha(0.85); // Slightly transparent on mobile
    }

    // Lives display
    this.livesText = this.add.text(baseX, baseY + lineSpacing * 4, 'LIVES: 1', {
      fontFamily: UI_CONFIG.scoreFont,
      fontSize: 32 * uiScale,
      color: '#ff00ff', // Magenta/purple to stand out
      stroke: '#000000',
      strokeThickness: 5 * uiScale,
    });
    if (MOBILE_SCALE < 1.0) {
      this.livesText.setAlpha(0.85); // Slightly transparent on mobile
    }

    // Pause button (top-right corner)
    this.createPauseButton();

    // Game Over overlay (hidden initially)
    this.createGameOverOverlay();

    // Pause overlay (hidden initially)
    this.createPauseOverlay();

    // Leaderboard panel (hidden initially)
    this.createLeaderboardPanel();

    // Listen to registry changes
    this.registry.events.on('changedata-score', this.updateScore, this);
    this.registry.events.on('changedata-comboMultiplier', this.updateCombo, this);
    this.registry.events.on('changedata-layerName', this.updateLayer, this);
    this.registry.events.on('changedata-lives', this.updateLives, this);
    this.registry.events.on('changedata-gameOver', this.onGameOver, this);
    this.registry.events.on('changedata-isPaused', this.onPauseChanged, this);
    
    // Listen for score submission from GameScene
    this.events.on('submitScore', this.onSubmitScore, this);

    // Listen for restart (R key)
    this.input.keyboard!.on('keydown-R', () => {
      if (this.registry.get('gameOver')) {
        this.restartGame();
      }
    });

    // Listen for return to menu (M key)
    this.input.keyboard!.on('keydown-M', () => {
      const gameScene = this.scene.get('GameScene') as GameScene;
      if (gameScene) {
        gameScene.returnToMenu();
      }
    });

    // ESC key handler - handles both pause and resume
    const escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    escKey.on('down', () => {
      const gameOver = this.registry.get('gameOver');
      if (!gameOver) {
        const gameScene = this.scene.get('GameScene') as GameScene;
        if (gameScene && gameScene.scene.isActive()) {
          gameScene.togglePause();
        }
      }
    });
  }

  private createGameOverOverlay() {
    const width = this.scale.width;
    const height = this.scale.height;

    // Background overlay
    const overlay = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x000000,
      0.8
    );
    overlay.setOrigin(0.5, 0.5);

    // Game Over text - Orbitron for big titles
    this.gameOverText = this.add.text(width / 2, height / 2 - 100, 'GAME OVER', {
      fontFamily: UI_CONFIG.logoFont,
      fontSize: UI_CONFIG.fontSize.xlarge,
      color: UI_CONFIG.neonGreen,
      stroke: '#000000',
      strokeThickness: 6,
    });
    this.gameOverText.setOrigin(0.5, 0.5);

    // Final score - VT323 for score display
    this.finalScoreText = this.add.text(width / 2, height / 2 - 50, 'FINAL SCORE: 0', {
      fontFamily: UI_CONFIG.scoreFont,
      fontSize: 28,
      color: UI_CONFIG.neonGreen,
      stroke: '#000000',
      strokeThickness: 4,
    });
    this.finalScoreText.setOrigin(0.5, 0.5);

    // Restart button
    this.restartButton = this.createButton(
      width / 2,
      height / 2 + 30,
      'RESTART',
      180,
      45,
      18
    );
    const restartBg = this.restartButton.list[0] as Phaser.GameObjects.Rectangle;
    restartBg.on('pointerdown', () => {
      this.restartGame();
    });

    // Menu button
    this.menuButton = this.createButton(
      width / 2,
      height / 2 + 90,
      'MENU',
      180,
      45,
      18
    );
    const menuBg = this.menuButton.list[0] as Phaser.GameObjects.Rectangle;
    menuBg.on('pointerdown', () => {
      const gameScene = this.scene.get('GameScene') as GameScene;
      if (gameScene) {
        gameScene.returnToMenu();
      }
    });

    // Create container and hide it initially
    this.gameOverContainer = this.add.container(0, 0, [
      overlay,
      this.gameOverText,
      this.finalScoreText,
      this.restartButton,
      this.menuButton,
    ]);
    this.gameOverContainer.setVisible(false);
  }

  private createPauseOverlay() {
    const width = this.scale.width;
    const height = this.scale.height;

    // Background overlay
    const overlay = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x000000,
      0.85
    );
    overlay.setOrigin(0.5, 0.5);

    // Paused text - Orbitron for big titles
    this.pauseText = this.add.text(width / 2, height / 2 - 80, 'PAUSED', {
      fontFamily: UI_CONFIG.logoFont,
      fontSize: UI_CONFIG.fontSize.xlarge,
      color: UI_CONFIG.neonGreen,
      stroke: '#000000',
      strokeThickness: 6,
    });
    this.pauseText.setOrigin(0.5, 0.5);

    // Resume button
    this.resumeButton = this.createButton(
      width / 2,
      height / 2 - 10,
      'RESUME',
      180,
      45,
      18
    );
    const resumeBg = this.resumeButton.list[0] as Phaser.GameObjects.Rectangle;
    resumeBg.on('pointerdown', () => {
      const gameScene = this.scene.get('GameScene') as GameScene;
      if (gameScene && gameScene.scene.isActive()) {
        gameScene.togglePause();
      }
    });

    // Menu button
    const pauseMenuButton = this.createButton(
      width / 2,
      height / 2 + 50,
      'MENU',
      180,
      45,
      18
    );
    const pauseMenuBg = pauseMenuButton.list[0] as Phaser.GameObjects.Rectangle;
    pauseMenuBg.on('pointerdown', () => {
      const gameScene = this.scene.get('GameScene') as GameScene;
      if (gameScene) {
        gameScene.returnToMenu();
      }
    });

    // Create container and hide it initially
    this.pauseContainer = this.add.container(0, 0, [
      overlay,
      this.pauseText,
      this.resumeButton,
      pauseMenuButton,
    ]);
    this.pauseContainer.setVisible(false);
  }

  private createLeaderboardPanel() {
    const width = this.scale.width;
    const height = this.scale.height;

    // Background panel
    const panelBg = this.add.rectangle(
      width / 2,
      height / 2 + 150,
      width - 100,
      300,
      0x000000,
      0.95
    );
    panelBg.setStrokeStyle(2, 0x00ff00);

    // Title - Oxanium for menu headings
    const title = this.add.text(width / 2, height / 2 + 50, 'WEEKLY LEADERBOARD', {
      fontFamily: UI_CONFIG.menuFont,
      fontSize: UI_CONFIG.fontSize.small,
      color: UI_CONFIG.neonGreen,
      stroke: '#000000',
      strokeThickness: 4,
    });
    title.setOrigin(0.5, 0.5);

    // Leaderboard entries will be created dynamically
    this.leaderboardPanel = this.add.container(0, 0, [panelBg, title]);
    this.leaderboardPanel.setVisible(false);
  }

  // Helper function to create styled buttons
  private createButton(
    x: number,
    y: number,
    text: string,
    width: number = 200,
    height: number = 50,
    fontSize: number = 18
  ): Phaser.GameObjects.Container {
    const uiScale = MOBILE_SCALE < 1.0 ? 0.8 : 1.0;
    const scaledWidth = width * uiScale;
    const scaledHeight = height * uiScale;
    const scaledFontSize = fontSize * uiScale;

    // Button background
    const bg = this.add.rectangle(0, 0, scaledWidth, scaledHeight, 0x000000, 0.9);
    bg.setStrokeStyle(2, 0x00ff00);

    // Button text
    const buttonText = this.add.text(0, 0, text, {
      fontFamily: UI_CONFIG.menuFont,
      fontSize: scaledFontSize,
      color: UI_CONFIG.neonGreen,
      stroke: '#000000',
      strokeThickness: 2,
    });
    buttonText.setOrigin(0.5, 0.5);

    // Create container
    const button = this.add.container(x, y, [bg, buttonText]);

    // Make interactive
    bg.setInteractive({ useHandCursor: true });

    // Hover effects
    bg.on('pointerover', () => {
      bg.setFillStyle(0x001100, 0.95);
      bg.setStrokeStyle(3, 0x00ff00);
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(0x000000, 0.9);
      bg.setStrokeStyle(2, 0x00ff00);
    });

    return button;
  }

  // Create pause button in top-right corner
  private createPauseButton() {
    const width = this.scale.width;
    const uiScale = MOBILE_SCALE < 1.0 ? 0.7 : 1.0;
    const buttonSize = 50 * uiScale;

    // Button background (circular)
    const bg = this.add.circle(0, 0, buttonSize / 2, 0x000000, 0.9);
    bg.setStrokeStyle(2, 0x00ff00);

    // Pause icon (two vertical bars)
    const bar1 = this.add.rectangle(-8 * uiScale, 0, 6 * uiScale, 20 * uiScale, 0x00ff00);
    const bar2 = this.add.rectangle(8 * uiScale, 0, 6 * uiScale, 20 * uiScale, 0x00ff00);

    this.pauseButton = this.add.container(width - 40 * uiScale, 40 * uiScale, [bg, bar1, bar2]);

    // Make interactive
    bg.setInteractive({ useHandCursor: true });

    // Hover effects
    bg.on('pointerover', () => {
      bg.setFillStyle(0x001100, 0.95);
      bg.setStrokeStyle(3, 0x00ff00);
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(0x000000, 0.9);
      bg.setStrokeStyle(2, 0x00ff00);
    });

    // Click handler
    bg.on('pointerdown', () => {
      const gameOver = this.registry.get('gameOver');
      if (!gameOver) {
        const gameScene = this.scene.get('GameScene') as GameScene;
        if (gameScene && gameScene.scene.isActive()) {
          gameScene.togglePause();
        }
      }
    });
  }

  private updateScore(_parent: Phaser.Data.DataManager, value: number) {
    this.scoreText.setText(`SCORE: ${value.toLocaleString()}`);
  }

  private updateCombo(_parent: Phaser.Data.DataManager, value: number) {
    this.comboText.setText(`COMBO: ${value.toFixed(1)}x`);
  }

  private updateLayer(_parent: Phaser.Data.DataManager, layerName: string) {
    this.layerText.setText(`LAYER: ${layerName}`);
  }

  private updateLives(_parent: Phaser.Data.DataManager, value: number) {
    this.livesText.setText(`LIVES: ${value}`);
  }

  private onGameOver(_parent: Phaser.Data.DataManager, value: boolean) {
    if (value) {
      const finalScore = this.registry.get('finalScore') || 0;
      this.finalScoreText.setText(`FINAL SCORE: ${finalScore.toLocaleString()}`);
      this.gameOverContainer.setVisible(true);
      this.pauseContainer.setVisible(false);
      this.pauseButton.setVisible(false); // Hide pause button when game over
    } else {
      this.gameOverContainer.setVisible(false);
      this.leaderboardPanel.setVisible(false);
      this.leaderboardVisible = false;
      this.pauseButton.setVisible(true); // Show pause button when game restarts
    }
  }

  private onPauseChanged(_parent: Phaser.Data.DataManager, isPaused: boolean) {
    if (isPaused && !this.registry.get('gameOver')) {
      this.pauseContainer.setVisible(true);
      this.pauseButton.setVisible(false); // Hide pause button when paused
    } else {
      this.pauseContainer.setVisible(false);
      this.pauseButton.setVisible(true); // Show pause button when resumed
    }
  }

  private async onSubmitScore(score: number, walletAddress?: string, deepestLayer?: number) {
    // Import and call score service
    const { submitScore } = await import('../../services/scoreService');
    submitScore(score, walletAddress, deepestLayer);
    
    // Show leaderboard after a short delay
    this.time.delayedCall(500, () => {
      this.showLeaderboard();
    });
  }

  private async showLeaderboard() {
    if (this.leaderboardVisible) return;

    try {
      // Import score service
      const { fetchWeeklyLeaderboard, getCurrentISOWeek } = await import('../../services/scoreService');
      const scores = fetchWeeklyLeaderboard();
      const weekNumber = getCurrentISOWeek();

    // Update title with week number
    const title = this.leaderboardPanel.list[1] as Phaser.GameObjects.Text;
    title.setText(`WEEK ${weekNumber} LEADERBOARD`);

    // Remove old entries (except background and title)
    const entriesToRemove: Phaser.GameObjects.GameObject[] = [];
    this.leaderboardPanel.list.forEach((child, index) => {
      if (index > 1) {
        entriesToRemove.push(child);
      }
    });
    entriesToRemove.forEach(child => {
      this.leaderboardPanel.remove(child);
      child.destroy();
    });

    // Create new entries
    const gameHeight = this.scale.height;
    const startY = gameHeight / 2 + 100;
    scores.slice(0, 10).forEach((entry, index) => {
      const y = startY + (index * 25);
      const rank = index + 1;
      const playerName = entry.playerName || 'Anonymous';
      const displayName = playerName.length > 12 ? playerName.substring(0, 12) + '...' : playerName;
      
      const gameWidth = this.scale.width;
      const entryText = this.add.text(gameWidth / 2, y, 
        `${rank}. ${displayName.padEnd(15)} ${entry.score.toLocaleString()}`,
        {
          fontFamily: UI_CONFIG.scoreFont,
          fontSize: 18,
          color: UI_CONFIG.neonGreen,
          stroke: '#000000',
          strokeThickness: 2,
        }
      );
      entryText.setOrigin(0.5, 0.5);
      this.leaderboardPanel.add(entryText);
    });

      this.leaderboardPanel.setVisible(true);
      this.leaderboardVisible = true;
    } catch (error) {
      console.error('Error showing leaderboard:', error);
    }
  }

  private restartGame() {
    const gameScene = this.scene.get('GameScene') as GameScene;
    if (gameScene) {
      gameScene.restart();
    }
    this.gameOverContainer.setVisible(false);
    this.pauseContainer.setVisible(false);
    this.leaderboardPanel.setVisible(false);
    this.leaderboardVisible = false;
    this.registry.set('gameOver', false);
    this.registry.set('isPaused', false);
  }
}

