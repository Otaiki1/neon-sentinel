import Phaser from 'phaser';
import { GAME_CONFIG, UI_CONFIG } from '../config';
import { GameScene } from './GameScene';

export class UIScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private layerText!: Phaser.GameObjects.Text;
  private gameOverContainer!: Phaser.GameObjects.Container;
  private gameOverText!: Phaser.GameObjects.Text;
  private finalScoreText!: Phaser.GameObjects.Text;
  private restartText!: Phaser.GameObjects.Text;
  private leaderboardPanel!: Phaser.GameObjects.Container;
  private leaderboardVisible = false;

  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    // Score display (top-left)
    this.scoreText = this.add.text(20, 20, 'SCORE: 0', {
      fontFamily: UI_CONFIG.pixelFont,
      fontSize: UI_CONFIG.fontSize.small,
      color: UI_CONFIG.neonGreen,
      stroke: '#000000',
      strokeThickness: 4,
    });

    // Combo multiplier display
    this.comboText = this.add.text(20, 50, 'COMBO: 1.0x', {
      fontFamily: UI_CONFIG.pixelFont,
      fontSize: UI_CONFIG.fontSize.small,
      color: UI_CONFIG.neonGreen,
      stroke: '#000000',
      strokeThickness: 4,
    });

    // Layer display
    this.layerText = this.add.text(20, 80, 'LAYER: Boot Sector', {
      fontFamily: UI_CONFIG.pixelFont,
      fontSize: UI_CONFIG.fontSize.small,
      color: UI_CONFIG.neonGreen,
      stroke: '#000000',
      strokeThickness: 4,
    });

    // Game Over overlay (hidden initially)
    this.createGameOverOverlay();

    // Leaderboard panel (hidden initially)
    this.createLeaderboardPanel();

    // Listen to registry changes
    this.registry.events.on('changedata-score', this.updateScore, this);
    this.registry.events.on('changedata-comboMultiplier', this.updateCombo, this);
    this.registry.events.on('changedata-layerName', this.updateLayer, this);
    this.registry.events.on('changedata-gameOver', this.onGameOver, this);
    
    // Listen for score submission from GameScene
    this.events.on('submitScore', this.onSubmitScore, this);

    // Listen for restart
    this.input.keyboard!.on('keydown-R', () => {
      if (this.registry.get('gameOver')) {
        this.restartGame();
      }
    });
  }

  private createGameOverOverlay() {
    const width = GAME_CONFIG.width;
    const height = GAME_CONFIG.height;

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

    // Game Over text
    this.gameOverText = this.add.text(width / 2, height / 2 - 100, 'GAME OVER', {
      fontFamily: UI_CONFIG.pixelFont,
      fontSize: UI_CONFIG.fontSize.xlarge,
      color: UI_CONFIG.neonGreen,
      stroke: '#000000',
      strokeThickness: 6,
    });
    this.gameOverText.setOrigin(0.5, 0.5);

    // Final score
    this.finalScoreText = this.add.text(width / 2, height / 2 - 50, 'FINAL SCORE: 0', {
      fontFamily: UI_CONFIG.pixelFont,
      fontSize: UI_CONFIG.fontSize.medium,
      color: UI_CONFIG.neonGreen,
      stroke: '#000000',
      strokeThickness: 4,
    });
    this.finalScoreText.setOrigin(0.5, 0.5);

    // Restart instruction
    this.restartText = this.add.text(width / 2, height / 2 + 50, 'PRESS R TO RESTART', {
      fontFamily: UI_CONFIG.pixelFont,
      fontSize: UI_CONFIG.fontSize.small,
      color: UI_CONFIG.neonGreen,
      stroke: '#000000',
      strokeThickness: 4,
    });
    this.restartText.setOrigin(0.5, 0.5);

    // Blinking effect for restart text
    this.tweens.add({
      targets: this.restartText,
      alpha: 0.5,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // Create container and hide it initially
    this.gameOverContainer = this.add.container(0, 0, [
      overlay,
      this.gameOverText,
      this.finalScoreText,
      this.restartText,
    ]);
    this.gameOverContainer.setVisible(false);
  }

  private createLeaderboardPanel() {
    const width = GAME_CONFIG.width;
    const height = GAME_CONFIG.height;

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

    // Title
    const title = this.add.text(width / 2, height / 2 + 50, 'WEEKLY LEADERBOARD', {
      fontFamily: UI_CONFIG.pixelFont,
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

  private updateScore(_parent: Phaser.Data.DataManager, value: number) {
    this.scoreText.setText(`SCORE: ${value.toLocaleString()}`);
  }

  private updateCombo(_parent: Phaser.Data.DataManager, value: number) {
    this.comboText.setText(`COMBO: ${value.toFixed(1)}x`);
  }

  private updateLayer(_parent: Phaser.Data.DataManager, layerName: string) {
    this.layerText.setText(`LAYER: ${layerName}`);
  }

  private onGameOver(_parent: Phaser.Data.DataManager, value: boolean) {
    if (value) {
      const finalScore = this.registry.get('finalScore') || 0;
      this.finalScoreText.setText(`FINAL SCORE: ${finalScore.toLocaleString()}`);
      this.gameOverContainer.setVisible(true);
    } else {
      this.gameOverContainer.setVisible(false);
      this.leaderboardPanel.setVisible(false);
      this.leaderboardVisible = false;
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
    const startY = GAME_CONFIG.height / 2 + 100;
    scores.slice(0, 10).forEach((entry, index) => {
      const y = startY + (index * 25);
      const rank = index + 1;
      const playerName = entry.playerName || 'Anonymous';
      const displayName = playerName.length > 12 ? playerName.substring(0, 12) + '...' : playerName;
      
      const entryText = this.add.text(GAME_CONFIG.width / 2, y, 
        `${rank}. ${displayName.padEnd(15)} ${entry.score.toLocaleString()}`,
        {
          fontFamily: UI_CONFIG.pixelFont,
          fontSize: 10,
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
    this.leaderboardPanel.setVisible(false);
    this.leaderboardVisible = false;
    this.registry.set('gameOver', false);
  }
}

