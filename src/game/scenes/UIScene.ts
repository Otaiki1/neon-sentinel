import Phaser from 'phaser';
import {
  CORRUPTION_SYSTEM,
  FAILURE_FEEDBACK,
  LAYER_CONFIG,
  MOBILE_SCALE,
  OVERCLOCK_CONFIG,
  UI_CONFIG,
} from '../config';
import {
  checkAllLeaderboardsTop10,
  getAchievementProgressSummary,
  getPersonalBests,
  unlockAchievement,
  updatePersonalBests,
} from '../../services/achievementService';
import { fetchWeeklyLeaderboard } from '../../services/scoreService';
import { GameScene } from './GameScene';

export class UIScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private layerText!: Phaser.GameObjects.Text;
  private prestigeText!: Phaser.GameObjects.Text;
  private livesOrb!: Phaser.GameObjects.Graphics;
  private corruptionBarBg!: Phaser.GameObjects.Graphics;
  private corruptionBarFill!: Phaser.GameObjects.Graphics;
  private overclockBarBg!: Phaser.GameObjects.Graphics;
  private overclockBarFill!: Phaser.GameObjects.Graphics;
  private overclockStatusText!: Phaser.GameObjects.Text;
  private overclockCooldownText!: Phaser.GameObjects.Text;
  private challengeContainer!: Phaser.GameObjects.Container;
  private challengeTitleText!: Phaser.GameObjects.Text;
  private challengeDescriptionText!: Phaser.GameObjects.Text;
  private challengeBarBg!: Phaser.GameObjects.Graphics;
  private challengeBarFill!: Phaser.GameObjects.Graphics;
  private gameOverContainer!: Phaser.GameObjects.Container;
  private gameOverText!: Phaser.GameObjects.Text;
  private finalScoreText!: Phaser.GameObjects.Text;
  private prestigeBadgeText!: Phaser.GameObjects.Text;
  private pauseContainer!: Phaser.GameObjects.Container;
  private pauseText!: Phaser.GameObjects.Text;
  private leaderboardPanel!: Phaser.GameObjects.Container;
  private leaderboardVisible = false;
  private leaderboardAutoHideTimer?: Phaser.Time.TimerEvent;
  private settingsContainer!: Phaser.GameObjects.Container;
  private settingsVisible = false;
  private sensitivityValueText!: Phaser.GameObjects.Text;
  private achievementTexts: Phaser.GameObjects.Text[] = [];
  private failureFeedbackLines: Phaser.GameObjects.Text[] = [];
  private celebrationLines: Phaser.GameObjects.Text[] = [];
  private readonly joystickSensitivityKey =
    'neon-sentinel-joystick-sensitivity';
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

    const storedSensitivity = Number(
      localStorage.getItem(this.joystickSensitivityKey)
    );
    const initialSensitivity = Number.isFinite(storedSensitivity)
      ? Phaser.Math.Clamp(storedSensitivity, 0.5, 2)
      : 1;
    this.registry.set('joystickSensitivity', initialSensitivity);

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

    // Prestige display
    this.prestigeText = this.add.text(baseX, baseY + lineSpacing * 4, 'PRESTIGE: 0', {
      fontFamily: UI_CONFIG.menuFont,
      fontSize: UI_CONFIG.fontSize.small * uiScale,
      color: UI_CONFIG.neonGreen,
      stroke: '#000000',
      strokeThickness: 3 * uiScale,
    });
    if (MOBILE_SCALE < 1.0) {
      this.prestigeText.setAlpha(0.85);
    }

    // Lives display (orb indicators only)
    const livesX = baseX + 10 * uiScale;
    const livesY = baseY + lineSpacing * 5 + 8 * uiScale;
    this.livesOrb = this.add.graphics();
    this.renderLivesOrbs(1, livesX, livesY, uiScale);

    // Corruption meter
    this.createCorruptionMeter();
    this.createOverclockMeter();
    const initialCharges = this.registry.get('overclockCharges') as number | undefined;
    if (Number.isFinite(initialCharges)) {
      this.overclockStatusText.setText(`OC: ${initialCharges}`);
    }
    const initialCooldown = this.registry.get('overclockCooldown') as number | undefined;
    if (Number.isFinite(initialCooldown)) {
      const seconds = Math.max(
        0,
        Math.ceil((initialCooldown * OVERCLOCK_CONFIG.cooldownBetweenActivations) / 1000)
      );
      this.overclockCooldownText.setText(`CD: ${seconds}s`);
    }

    // Pause button (top-right corner)
    this.createPauseButton();

    // Game Over overlay (hidden initially)
    this.createGameOverOverlay();

    // Pause overlay (hidden initially)
    this.createPauseOverlay();

    // Settings overlay (hidden initially)
    this.createSettingsOverlay();

    // Leaderboard panel (hidden initially)
    this.createLeaderboardPanel();
    this.createChallengeDisplay();

    // Listen to registry changes
    this.registry.events.on('changedata-score', this.updateScore, this);
    this.registry.events.on('changedata-comboMultiplier', this.updateCombo, this);
    this.registry.events.on('changedata-layerName', this.updateLayer, this);
    this.registry.events.on('changedata-prestigeLevel', this.updatePrestige, this);
    this.registry.events.on('changedata-corruption', this.updateCorruption, this);
    this.registry.events.on('changedata-overclockProgress', this.updateOverclock, this);
    this.registry.events.on('changedata-overclockCooldown', this.updateOverclockCooldown, this);
    this.registry.events.on('changedata-overclockCharges', this.updateOverclockCharges, this);
    this.registry.events.on('changedata-challengeActive', this.updateChallengeActive, this);
    this.registry.events.on('changedata-challengeTitle', this.updateChallengeTitle, this);
    this.registry.events.on('changedata-challengeDescription', this.updateChallengeDescription, this);
    this.registry.events.on('changedata-challengeProgress', this.updateChallengeProgress, this);
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

    this.prestigeBadgeText = this.add.text(width / 2, height / 2 - 10, 'BADGE UNLOCKED: PRESTIGE CHAMPION', {
      fontFamily: UI_CONFIG.menuFont,
      fontSize: 18,
      color: '#ff66ff',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.prestigeBadgeText.setOrigin(0.5, 0.5);
    this.prestigeBadgeText.setVisible(false);

    const feedbackStartY = height / 2 + 10;
    const lineSpacing = MOBILE_SCALE < 1.0 ? 16 : 18;
    const maxWidth = width * 0.85;

    for (let i = 0; i < FAILURE_FEEDBACK.displayMetrics.length; i += 1) {
      const line = this.add.text(width / 2, feedbackStartY + i * lineSpacing, '', {
        fontFamily: UI_CONFIG.bodyFont,
        fontSize: UI_CONFIG.fontSize.small,
        color: UI_CONFIG.neonGreen,
        wordWrap: { width: maxWidth, useAdvancedWrap: true },
        align: 'center',
      });
      line.setOrigin(0.5, 0.5);
      line.setVisible(false);
      this.failureFeedbackLines.push(line);
    }

    const celebrationStartY =
      feedbackStartY + FAILURE_FEEDBACK.displayMetrics.length * lineSpacing + lineSpacing;
    for (let i = 0; i < FAILURE_FEEDBACK.celebrationMetrics.length; i += 1) {
      const line = this.add.text(
        width / 2,
        celebrationStartY + i * lineSpacing,
        '',
        {
          fontFamily: UI_CONFIG.menuFont,
          fontSize: UI_CONFIG.fontSize.small,
          color: '#00ff99',
          wordWrap: { width: maxWidth, useAdvancedWrap: true },
          align: 'center',
        }
      );
      line.setOrigin(0.5, 0.5);
      line.setVisible(false);
      this.celebrationLines.push(line);
    }

    // Restart button
    this.restartButton = this.createButton(
      width / 2,
      height - 140,
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
      height - 80,
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
      this.prestigeBadgeText,
      ...this.failureFeedbackLines,
      ...this.celebrationLines,
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

    // Settings button
    const settingsButton = this.createButton(
      width / 2,
      height / 2 + 110,
      'SETTINGS',
      180,
      45,
      18
    );
    const settingsBg = settingsButton.list[0] as Phaser.GameObjects.Rectangle;
    settingsBg.on('pointerdown', () => {
      this.toggleSettings();
    });

    const achievementsTitle = this.add.text(width / 2, height / 2 + 170, 'ACHIEVEMENTS', {
      fontFamily: UI_CONFIG.menuFont,
      fontSize: UI_CONFIG.fontSize.small,
      color: UI_CONFIG.neonGreen,
      stroke: '#000000',
      strokeThickness: 2,
    });
    achievementsTitle.setOrigin(0.5, 0.5);

    this.achievementTexts = [];
    for (let i = 0; i < 4; i += 1) {
      const line = this.add.text(
        width / 2,
        height / 2 + 195 + i * 18,
        '',
        {
          fontFamily: UI_CONFIG.bodyFont,
          fontSize: UI_CONFIG.fontSize.small,
          color: UI_CONFIG.neonGreen,
          stroke: '#000000',
          strokeThickness: 1,
        }
      );
      line.setOrigin(0.5, 0.5);
      this.achievementTexts.push(line);
    }

    // Create container and hide it initially
    this.pauseContainer = this.add.container(0, 0, [
      overlay,
      this.pauseText,
      this.resumeButton,
      pauseMenuButton,
      settingsButton,
      achievementsTitle,
      ...this.achievementTexts,
    ]);
    this.pauseContainer.setVisible(false);
  }

  private createSettingsOverlay() {
    const width = this.scale.width;
    const height = this.scale.height;
    const uiScale = MOBILE_SCALE < 1.0 ? 0.8 : 1.0;

    const panelWidth = 320 * uiScale;
    const panelHeight = 200 * uiScale;
    const panelX = width / 2;
    const panelY = height / 2 - 40 * uiScale;

    const panelBg = this.add.rectangle(
      panelX,
      panelY,
      panelWidth,
      panelHeight,
      0x000000,
      0.95
    );
    panelBg.setStrokeStyle(2, 0x00ff00);

    const title = this.add.text(panelX, panelY - 60 * uiScale, 'SETTINGS', {
      fontFamily: UI_CONFIG.menuFont,
      fontSize: UI_CONFIG.fontSize.medium * uiScale,
      color: UI_CONFIG.neonGreen,
      stroke: '#000000',
      strokeThickness: 3,
    });
    title.setOrigin(0.5, 0.5);

    const label = this.add.text(panelX, panelY - 15 * uiScale, 'JOYSTICK SENSITIVITY', {
      fontFamily: UI_CONFIG.menuFont,
      fontSize: UI_CONFIG.fontSize.small * uiScale,
      color: UI_CONFIG.neonGreen,
      stroke: '#000000',
      strokeThickness: 2,
    });
    label.setOrigin(0.5, 0.5);

    const initialSensitivity = (this.registry.get('joystickSensitivity') as number) || 1;
    this.sensitivityValueText = this.add.text(panelX, panelY + 20 * uiScale, `${initialSensitivity.toFixed(1)}x`, {
      fontFamily: UI_CONFIG.scoreFont,
      fontSize: UI_CONFIG.fontSize.medium * uiScale,
      color: UI_CONFIG.neonGreen,
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.sensitivityValueText.setOrigin(0.5, 0.5);

    const minusButton = this.createButton(
      panelX - 70 * uiScale,
      panelY + 70 * uiScale,
      '-',
      50,
      40,
      20
    );
    const plusButton = this.createButton(
      panelX + 70 * uiScale,
      panelY + 70 * uiScale,
      '+',
      50,
      40,
      20
    );

    const minusBg = minusButton.list[0] as Phaser.GameObjects.Rectangle;
    const plusBg = plusButton.list[0] as Phaser.GameObjects.Rectangle;
    minusBg.on('pointerdown', () => this.adjustSensitivity(-0.1));
    plusBg.on('pointerdown', () => this.adjustSensitivity(0.1));

    this.settingsContainer = this.add.container(0, 0, [
      panelBg,
      title,
      label,
      this.sensitivityValueText,
      minusButton,
      plusButton,
    ]);
    this.settingsContainer.setVisible(false);
  }

  private toggleSettings() {
    this.settingsVisible = !this.settingsVisible;
    this.settingsContainer.setVisible(this.settingsVisible);
  }

  private adjustSensitivity(delta: number) {
    const current = (this.registry.get('joystickSensitivity') as number) || 1;
    const next = Phaser.Math.Clamp(Number((current + delta).toFixed(2)), 0.5, 2);
    this.registry.set('joystickSensitivity', next);
    localStorage.setItem(this.joystickSensitivityKey, String(next));
    this.sensitivityValueText.setText(`${next.toFixed(1)}x`);
  }

  private createLeaderboardPanel() {
    const width = this.scale.width;
    const height = this.scale.height;
    const uiScale = MOBILE_SCALE < 1.0 ? 0.8 : 1.0;

    // Square panel - 450x450 (not full width)
    const panelSize = 450 * uiScale;
    const panelX = width / 2;
    const panelY = height / 2;
    const panelPadding = 20 * uiScale;

    // Background panel
    const panelBg = this.add.rectangle(
      panelX,
      panelY,
      panelSize,
      panelSize,
      0x000000,
      0.95
    );
    panelBg.setStrokeStyle(2, 0x00ff00);

    // Title - Oxanium for menu headings
    const title = this.add.text(panelX, panelY - panelSize / 2 + 40 * uiScale, 'WEEKLY LEADERBOARD', {
      fontFamily: UI_CONFIG.menuFont,
      fontSize: UI_CONFIG.fontSize.small * uiScale,
      color: UI_CONFIG.neonGreen,
      stroke: '#000000',
      strokeThickness: 4,
    });
    title.setOrigin(0.5, 0.5);

    // Close button (X) - positioned at top-left of panel
    const closeButtonSize = 30 * uiScale;
    const closeButtonX = panelX - panelSize / 2 + panelPadding;
    const closeButtonY = panelY - panelSize / 2 + panelPadding;
    
    // Create container first, then add elements relative to (0, 0)
    const closeButton = this.add.container(closeButtonX, closeButtonY);
    
    const closeButtonBg = this.add.circle(
      0, 0,  // Position relative to container
      closeButtonSize / 2,
      0x000000,
      0.9
    );
    closeButtonBg.setStrokeStyle(2, 0x00ff00);
    closeButtonBg.setInteractive({ useHandCursor: true });

    // X icon as text (more reliable positioning)
    const xText = this.add.text(
      0, 0,  // Position relative to container
      '×',
      {
        fontFamily: 'Arial',
        fontSize: (closeButtonSize * 0.7) + 'px',
        color: '#00ff00',
        stroke: '#000000',
        strokeThickness: 2,
      }
    );
    xText.setOrigin(0.5, 0.5);

    closeButton.add([closeButtonBg, xText]);

    // Hover effects
    closeButtonBg.on('pointerover', () => {
      closeButtonBg.setFillStyle(0x001100, 0.95);
      closeButtonBg.setStrokeStyle(3, 0x00ff00);
      xText.setColor('#00ff00');
    });

    closeButtonBg.on('pointerout', () => {
      closeButtonBg.setFillStyle(0x000000, 0.9);
      closeButtonBg.setStrokeStyle(2, 0x00ff00);
      xText.setColor('#00ff00');
    });

    // Click handler to close leaderboard
    closeButtonBg.on('pointerdown', () => {
      this.hideLeaderboard();
    });
    
    // Also make the text clickable
    xText.setInteractive({ useHandCursor: true });
    xText.on('pointerdown', () => {
      this.hideLeaderboard();
    });

    // Leaderboard entries will be created dynamically
    this.leaderboardPanel = this.add.container(0, 0, [panelBg, title, closeButton]);
    this.leaderboardPanel.setVisible(false);
  }

  private hideLeaderboard() {
    this.leaderboardPanel.setVisible(false);
    this.leaderboardVisible = false;
    // Clear auto-hide timer if it exists
    if (this.leaderboardAutoHideTimer) {
      this.leaderboardAutoHideTimer.remove();
      this.leaderboardAutoHideTimer = undefined;
    }
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

  private updatePrestige(_parent: Phaser.Data.DataManager, value: number) {
    this.prestigeText.setText(`PRESTIGE: ${value}`);
  }

  private createCorruptionMeter() {
    const width = this.scale.width;
    const height = this.scale.height;
    const uiScale = MOBILE_SCALE < 1.0 ? 0.7 : 1.0;
    const barWidth = 14 * uiScale;
    const barHeight = 220 * uiScale;
    const barX = width - 30 * uiScale;
    const barY = height / 2 - barHeight / 2;

    this.corruptionBarBg = this.add.graphics();
    this.corruptionBarBg.fillStyle(0x000000, 0.6);
    this.corruptionBarBg.fillRect(barX, barY, barWidth, barHeight);
    this.corruptionBarBg.lineStyle(2, 0x00ff00, 0.8);
    this.corruptionBarBg.strokeRect(barX, barY, barWidth, barHeight);

    this.corruptionBarFill = this.add.graphics();
    this.renderCorruptionFill(0, barX, barY, barWidth, barHeight);
  }

  private createOverclockMeter() {
    const width = this.scale.width;
    const height = this.scale.height;
    const uiScale = MOBILE_SCALE < 1.0 ? 0.7 : 1.0;
    const barWidth = 10 * uiScale;
    const barHeight = 160 * uiScale;
    const barX = width - 50 * uiScale;
    const barY = height / 2 - barHeight / 2;

    this.overclockBarBg = this.add.graphics();
    this.overclockBarBg.fillStyle(0x000000, 0.6);
    this.overclockBarBg.fillRect(barX, barY, barWidth, barHeight);
    this.overclockBarBg.lineStyle(2, 0x00ffff, 0.8);
    this.overclockBarBg.strokeRect(barX, barY, barWidth, barHeight);

    this.overclockBarFill = this.add.graphics();
    this.renderOverclockFill(0, barX, barY, barWidth, barHeight);

    this.overclockStatusText = this.add.text(
      barX - 6 * uiScale,
      barY + barHeight + 8 * uiScale,
      'OC: 0',
      {
        fontFamily: UI_CONFIG.menuFont,
        fontSize: 12 * uiScale,
        color: '#00ffff',
        stroke: '#000000',
        strokeThickness: 2,
      }
    );
    this.overclockStatusText.setOrigin(1, 0);

    this.overclockCooldownText = this.add.text(
      barX - 6 * uiScale,
      barY - 18 * uiScale,
      'CD: 0s',
      {
        fontFamily: UI_CONFIG.menuFont,
        fontSize: 12 * uiScale,
        color: '#00ffff',
        stroke: '#000000',
        strokeThickness: 2,
      }
    );
    this.overclockCooldownText.setOrigin(1, 0);
  }

  private createChallengeDisplay() {
    const width = this.scale.width;
    const uiScale = MOBILE_SCALE < 1.0 ? 0.7 : 1.0;
    const containerY = 70 * uiScale;
    const barWidth = 260 * uiScale;
    const barHeight = 10 * uiScale;
    const barX = width / 2 - barWidth / 2;
    const barY = containerY + 32 * uiScale;

    this.challengeTitleText = this.add.text(width / 2, containerY, '', {
      fontFamily: UI_CONFIG.menuFont,
      fontSize: 16 * uiScale,
      color: '#00ffff',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.challengeTitleText.setOrigin(0.5, 0.5);

    this.challengeDescriptionText = this.add.text(width / 2, containerY + 18 * uiScale, '', {
      fontFamily: UI_CONFIG.bodyFont,
      fontSize: 12 * uiScale,
      color: UI_CONFIG.neonGreen,
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.challengeDescriptionText.setOrigin(0.5, 0.5);

    this.challengeBarBg = this.add.graphics();
    this.challengeBarBg.fillStyle(0x000000, 0.7);
    this.challengeBarBg.fillRect(barX, barY, barWidth, barHeight);
    this.challengeBarBg.lineStyle(2, 0x00ffff, 0.8);
    this.challengeBarBg.strokeRect(barX, barY, barWidth, barHeight);

    this.challengeBarFill = this.add.graphics();
    this.challengeBarFill.fillStyle(0x00ffff, 0.9);
    this.challengeBarFill.fillRect(barX, barY, 0, barHeight);

    this.challengeContainer = this.add.container(0, 0, [
      this.challengeTitleText,
      this.challengeDescriptionText,
      this.challengeBarBg,
      this.challengeBarFill,
    ]);
    this.challengeContainer.setVisible(false);
  }

  private updateCorruption(_parent: Phaser.Data.DataManager, value: number) {
    const width = this.scale.width;
    const height = this.scale.height;
    const uiScale = MOBILE_SCALE < 1.0 ? 0.7 : 1.0;
    const barWidth = 14 * uiScale;
    const barHeight = 220 * uiScale;
    const barX = width - 30 * uiScale;
    const barY = height / 2 - barHeight / 2;
    this.renderCorruptionFill(value, barX, barY, barWidth, barHeight);
  }

  private updateOverclock(_parent: Phaser.Data.DataManager, value: number) {
    const width = this.scale.width;
    const height = this.scale.height;
    const uiScale = MOBILE_SCALE < 1.0 ? 0.7 : 1.0;
    const barWidth = 10 * uiScale;
    const barHeight = 160 * uiScale;
    const barX = width - 50 * uiScale;
    const barY = height / 2 - barHeight / 2;
    this.renderOverclockFill(value, barX, barY, barWidth, barHeight);
  }

  private updateOverclockCooldown(_parent: Phaser.Data.DataManager, value: number) {
    const seconds = Math.max(
      0,
      Math.ceil((value * OVERCLOCK_CONFIG.cooldownBetweenActivations) / 1000)
    );
    this.overclockCooldownText.setText(`CD: ${seconds}s`);
  }

  private updateOverclockCharges(_parent: Phaser.Data.DataManager, value: number) {
    this.overclockStatusText.setText(`OC: ${value}`);
  }

  private updateChallengeActive(_parent: Phaser.Data.DataManager, value: boolean) {
    this.challengeContainer.setVisible(!!value);
  }

  private updateChallengeTitle(_parent: Phaser.Data.DataManager, value: string) {
    this.challengeTitleText.setText(value || '');
  }

  private updateChallengeDescription(_parent: Phaser.Data.DataManager, value: string) {
    this.challengeDescriptionText.setText(value || '');
  }

  private updateChallengeProgress(_parent: Phaser.Data.DataManager, value: number) {
    const width = this.scale.width;
    const uiScale = MOBILE_SCALE < 1.0 ? 0.7 : 1.0;
    const barWidth = 260 * uiScale;
    const barHeight = 10 * uiScale;
    const barX = width / 2 - barWidth / 2;
    const barY = 70 * uiScale + 32 * uiScale;
    const clamped = Phaser.Math.Clamp(value ?? 0, 0, 1);
    this.challengeBarFill.clear();
    this.challengeBarFill.fillStyle(0x00ffff, clamped > 0 ? 0.9 : 0.2);
    this.challengeBarFill.fillRect(barX, barY, barWidth * clamped, barHeight);
  }

  private renderCorruptionFill(
    corruption: number,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    const clamped = Phaser.Math.Clamp(corruption / 100, 0, 1);
    const fillHeight = height * clamped;
    const startColor = Phaser.Display.Color.ValueToColor(0x00ff00);
    const endColor = Phaser.Display.Color.ValueToColor(0xff0033);
    const tint = Phaser.Display.Color.Interpolate.ColorWithColor(
      startColor,
      endColor,
      100,
      Math.round(clamped * 100)
    );

    this.corruptionBarFill.clear();
    this.corruptionBarFill.fillStyle(
      Phaser.Display.Color.GetColor(tint.r, tint.g, tint.b),
      0.9
    );
    this.corruptionBarFill.fillRect(
      x,
      y + (height - fillHeight),
      width,
      fillHeight
    );
  }

  private renderOverclockFill(
    progress: number,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    const clamped = Phaser.Math.Clamp(progress, 0, 1);
    const fillHeight = height * clamped;
    this.overclockBarFill.clear();
    this.overclockBarFill.fillStyle(0x00ffff, clamped > 0 ? 0.9 : 0.2);
    this.overclockBarFill.fillRect(
      x,
      y + (height - fillHeight),
      width,
      fillHeight
    );
    this.overclockBarBg.setAlpha(clamped > 0 ? 1 : 0.4);
  }

  private updateLives(_parent: Phaser.Data.DataManager, value: number) {
    const uiScale = MOBILE_SCALE < 1.0 ? 0.6 : 1.0;
    const baseX = MOBILE_SCALE < 1.0 ? 15 : 30;
    const baseY = MOBILE_SCALE < 1.0 ? 15 : 30;
    const lineSpacing = MOBILE_SCALE < 1.0 ? 20 : 30;
    const livesX = baseX + 10 * uiScale;
    const livesY = baseY + lineSpacing * 5 + 8 * uiScale;

    this.renderLivesOrbs(value, livesX, livesY, uiScale);
  }

  private renderLivesOrbs(lives: number, x: number, y: number, uiScale: number) {
    const radius = 10 * uiScale;
    const spacing = 26 * uiScale;
    const maxOrbs = 4;
    const clampedLives = Math.max(0, Math.min(lives, maxOrbs * 5));

    this.livesOrb.clear();
    for (let i = 0; i < maxOrbs; i += 1) {
      const segment = clampedLives - i * 5;
      if (segment <= 0) {
        break;
      }
      const progress = Math.min(segment, 5);
      const orbX = x + i * spacing;
      const color = this.getOrbColor(progress);

      this.livesOrb.fillStyle(color, 1);
      this.livesOrb.fillCircle(orbX, y, radius);
      this.livesOrb.lineStyle(2 * uiScale, 0x001100, 0.8);
      this.livesOrb.strokeCircle(orbX, y, radius);
    }
  }

  private getOrbColor(progress: number): number {
    const palette = [
      0xff1a1a, // red
      0xff7a00, // orange
      0xffff00, // yellow
      0x00ff66, // green
    ];
    const clamped = Math.max(0, Math.min(progress, 5));
    const t = clamped / 5;

    const start = Phaser.Display.Color.ValueToColor(palette[0]);
    const end = Phaser.Display.Color.ValueToColor(palette[palette.length - 1]);
    const blended = Phaser.Display.Color.Interpolate.ColorWithColor(start, end, 100, Math.round(t * 100));
    return Phaser.Display.Color.GetColor(blended.r, blended.g, blended.b);
  }

  private onGameOver(_parent: Phaser.Data.DataManager, value: boolean) {
    if (value) {
      const finalScore = this.registry.get('finalScore') || 0;
      this.finalScoreText.setText(`FINAL SCORE: ${finalScore.toLocaleString()}`);
      const prestigeChampion = !!this.registry.get('prestigeChampion');
      this.prestigeBadgeText.setVisible(prestigeChampion);
      this.updateFailureFeedback(finalScore);
      this.gameOverContainer.setVisible(true);
      this.pauseContainer.setVisible(false);
      this.pauseButton.setVisible(false); // Hide pause button when game over
      this.settingsContainer.setVisible(false);
      this.settingsVisible = false;
    } else {
      this.gameOverContainer.setVisible(false);
      this.prestigeBadgeText.setVisible(false);
      this.failureFeedbackLines.forEach((line) => line.setVisible(false));
      this.celebrationLines.forEach((line) => line.setVisible(false));
      this.hideLeaderboard();
      this.pauseButton.setVisible(true); // Show pause button when game restarts
    }
  }

  private updateFailureFeedback(finalScore: number) {
    const runMetrics = this.registry.get('runMetrics') as
      | {
          peakComboMultiplier?: number;
          maxCorruptionReached?: number;
          totalEnemiesDefeated?: number;
        }
      | null;
    const personalBests = getPersonalBests();
    const weeklyScores = fetchWeeklyLeaderboard();
    const topScore = weeklyScores[0]?.score ?? 0;
    const tenthScore = weeklyScores[9]?.score;

    const lines: Array<{ text: string; color: string }> = [];
    const celebrations: string[] = [];

    const milestone = FAILURE_FEEDBACK.scoreMilestones.find((entry) => entry > finalScore);
    if (milestone) {
      const diff = milestone - finalScore;
      lines.push({
        text: `You were ${diff.toLocaleString()} points away from the ${milestone.toLocaleString()} milestone!`,
        color: '#ff5555',
      });
    }

    const nextLayerEntry = Object.values(LAYER_CONFIG).find(
      (layer) => layer.scoreThreshold > finalScore
    );
    if (nextLayerEntry) {
      const diff = nextLayerEntry.scoreThreshold - finalScore;
      lines.push({
        text: `Just ${diff.toLocaleString()} points to reach ${nextLayerEntry.name}!`,
        color: '#ffd166',
      });
    }

    if (
      runMetrics?.peakComboMultiplier !== undefined &&
      personalBests.bestComboMultiplier > 0 &&
      runMetrics.peakComboMultiplier < personalBests.bestComboMultiplier
    ) {
      lines.push({
        text: `Your best combo is ${personalBests.bestComboMultiplier.toFixed(
          1
        )}x - you hit ${runMetrics.peakComboMultiplier.toFixed(1)}x this run!`,
        color: '#66aaff',
      });
    }

    if (tenthScore && finalScore < tenthScore) {
      const diff = tenthScore - finalScore;
      lines.push({
        text: `You're ${diff.toLocaleString()} points behind #10 on the leaderboard!`,
        color: '#c77dff',
      });
    }

    if (runMetrics?.maxCorruptionReached !== undefined) {
      const corruption = runMetrics.maxCorruptionReached;
      let currentMultiplier = CORRUPTION_SYSTEM.scoreMultiplier.low;
      if (corruption >= 75) {
        currentMultiplier = CORRUPTION_SYSTEM.scoreMultiplier.critical;
      } else if (corruption >= 50) {
        currentMultiplier = CORRUPTION_SYSTEM.scoreMultiplier.high;
      } else if (corruption >= 25) {
        currentMultiplier = CORRUPTION_SYSTEM.scoreMultiplier.medium;
      }

      if (currentMultiplier < CORRUPTION_SYSTEM.scoreMultiplier.critical) {
        lines.push({
          text: `Higher corruption = ${CORRUPTION_SYSTEM.scoreMultiplier.critical}x score (you peaked at ${currentMultiplier}x).`,
          color: '#ff9f1c',
        });
      }
    }

    if (finalScore >= topScore && finalScore > 0) {
      celebrations.push('Best run this week!');
    }

    if (
      runMetrics?.totalEnemiesDefeated !== undefined &&
      runMetrics.totalEnemiesDefeated > personalBests.bestEnemiesDefeated
    ) {
      celebrations.push('New personal best enemy kills!');
    }

    if (
      runMetrics?.maxCorruptionReached !== undefined &&
      runMetrics.maxCorruptionReached > personalBests.bestCorruption
    ) {
      celebrations.push('Highest corruption survived!');
    }

    if (
      runMetrics?.peakComboMultiplier !== undefined &&
      runMetrics.peakComboMultiplier > personalBests.bestComboMultiplier
    ) {
      celebrations.push('New personal best combo!');
    }

    if (runMetrics) {
      updatePersonalBests(
        runMetrics.peakComboMultiplier ?? 0,
        runMetrics.totalEnemiesDefeated ?? 0,
        runMetrics.maxCorruptionReached ?? 0
      );
    }

    this.failureFeedbackLines.forEach((line, index) => {
      const entry = lines[index];
      if (!entry) {
        line.setVisible(false);
        return;
      }
      line.setText(entry.text);
      line.setColor(entry.color);
      line.setVisible(true);
    });

    this.celebrationLines.forEach((line, index) => {
      const entry = celebrations[index];
      if (!entry) {
        line.setVisible(false);
        return;
      }
      line.setText(entry);
      line.setVisible(true);
    });
  }

  private onPauseChanged(_parent: Phaser.Data.DataManager, isPaused: boolean) {
    if (isPaused && !this.registry.get('gameOver')) {
      this.pauseContainer.setVisible(true);
      this.pauseButton.setVisible(false); // Hide pause button when paused
      this.refreshAchievementProgress();
    } else {
      this.pauseContainer.setVisible(false);
      this.settingsContainer.setVisible(false);
      this.settingsVisible = false;
      this.pauseButton.setVisible(true); // Show pause button when resumed
    }
  }

  private refreshAchievementProgress() {
    const progress = getAchievementProgressSummary(this.achievementTexts.length);
    this.achievementTexts.forEach((text, index) => {
      const entry = progress[index];
      if (!entry) {
        text.setText('');
        return;
      }
      const status = entry.unlocked ? 'UNLOCKED' : `${Math.round(entry.progressValue)}%`;
      text.setText(`${entry.name}: ${status}`);
    });
  }

  private async onSubmitScore(
    score: number,
    walletAddress?: string,
    deepestLayer?: number,
    prestigeLevel?: number,
    runMetrics?: any,
    modifierKey?: string
  ) {
    // Import and call score service
    const { submitScore } = await import('../../services/scoreService');
    submitScore(score, walletAddress, deepestLayer, prestigeLevel, runMetrics, modifierKey);

    const playerName = walletAddress
      ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
      : 'Anonymous';
    if (checkAllLeaderboardsTop10(walletAddress || 'anonymous', playerName)) {
      unlockAchievement('all_leaderboards');
    }
    
    // Show leaderboard after a short delay
    this.time.delayedCall(500, () => {
      this.showLeaderboard();
    });
  }

  private async showLeaderboard() {
    if (this.leaderboardVisible) return;

    try {
      // Clear any existing auto-hide timer
      if (this.leaderboardAutoHideTimer) {
        this.leaderboardAutoHideTimer.remove();
        this.leaderboardAutoHideTimer = undefined;
      }

      // Import score service
      const { fetchWeeklyLeaderboard, getCurrentISOWeek } = await import('../../services/scoreService');
      const weekNumber = getCurrentISOWeek();
      const scores = fetchWeeklyLeaderboard();

      // Update title with week number
      const title = this.leaderboardPanel.list[1] as Phaser.GameObjects.Text;
      title.setText(`WEEK ${weekNumber} LEADERBOARD`);

      // Remove old entries (except background [0], title [1], and closeButton [2])
      const entriesToRemove: Phaser.GameObjects.GameObject[] = [];
      this.leaderboardPanel.list.forEach((child, index) => {
        if (index > 2) {
          entriesToRemove.push(child);
        }
      });
      entriesToRemove.forEach(child => {
        this.leaderboardPanel.remove(child);
        child.destroy();
      });

      // Create new entries - positioned relative to square panel center
      const width = this.scale.width;
      const height = this.scale.height;
      const uiScale = MOBILE_SCALE < 1.0 ? 0.8 : 1.0;
      const panelSize = 450 * uiScale;
      const panelX = width / 2;
      const panelY = height / 2;
      const entryStartY = panelY - panelSize / 2 + 80 * uiScale;
      const entrySpacing = 22 * uiScale;
      const entryFontSize = 16 * uiScale;

      scores.slice(0, 10).forEach((entry, index) => {
        const y = entryStartY + (index * entrySpacing);
        const rank = index + 1;
        const playerName = entry.playerName || 'Anonymous';
        const displayName = playerName.length > 12 ? playerName.substring(0, 12) + '...' : playerName;
        const prestigeLabel = entry.prestigeLevel ? `P${entry.prestigeLevel}` : 'P0';
        
        const entryText = this.add.text(panelX, y, 
          `${rank}. ${displayName.padEnd(12)} ${prestigeLabel.padEnd(4)} ${entry.score.toLocaleString()}`,
          {
            fontFamily: UI_CONFIG.scoreFont,
            fontSize: entryFontSize,
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

      // Auto-hide after 5 seconds
      this.leaderboardAutoHideTimer = this.time.delayedCall(5000, () => {
        this.hideLeaderboard();
      });
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
    this.hideLeaderboard();
    this.registry.set('gameOver', false);
    this.registry.set('isPaused', false);
  }
}

