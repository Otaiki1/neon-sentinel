import Phaser from 'phaser';
import {
  CORRUPTION_SYSTEM,
  FAILURE_FEEDBACK,
  LAYER_CONFIG,
  MOBILE_SCALE,
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
import { isShockBombUnlocked, isGodModeUnlocked } from '../../services/abilityService';
import { GameScene } from './GameScene';
import { TooltipManager } from './TooltipManager';
import { DialogueManager } from '../dialogue/DialogueManager';

export class UIScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private layerText!: Phaser.GameObjects.Text;
  private prestigeText!: Phaser.GameObjects.Text;
  private rankText!: Phaser.GameObjects.Text;
  private livesOrb!: Phaser.GameObjects.Graphics;
  // Shock bomb meter (red/orange)
  private shockBombBarBg!: Phaser.GameObjects.Graphics;
  private shockBombBarFill!: Phaser.GameObjects.Graphics;
  private shockBombKeyText!: Phaser.GameObjects.Text;
  private shockBombGlow!: Phaser.GameObjects.Graphics;
  // God mode meter (blue)
  private godModeBarBg!: Phaser.GameObjects.Graphics;
  private godModeBarFill!: Phaser.GameObjects.Graphics;
  private godModeKeyText!: Phaser.GameObjects.Text;
  private godModeGlow!: Phaser.GameObjects.Graphics;
  private challengeContainer!: Phaser.GameObjects.Container;
  private challengeTitleText!: Phaser.GameObjects.Text;
  private challengeDescriptionText!: Phaser.GameObjects.Text;
  private challengeBarBg!: Phaser.GameObjects.Graphics;
  private challengeBarFill!: Phaser.GameObjects.Graphics;
  private gameOverContainer!: Phaser.GameObjects.Container;
  private gameOverText!: Phaser.GameObjects.Text;
  private finalScoreText!: Phaser.GameObjects.Text;
  private prestigeBadgeText!: Phaser.GameObjects.Text;
  private rankTextGameOver!: Phaser.GameObjects.Text;
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
  private currentRankPauseText!: Phaser.GameObjects.Text;
  private uiTextColor = UI_CONFIG.neonGreen as string;
  private uiOpacityMultiplier = 1;
  private uiMenuFont = UI_CONFIG.menuFont as string;
  private uiScoreFont = UI_CONFIG.scoreFont as string;
  private uiBodyFont = UI_CONFIG.bodyFont as string;
  private uiLogoFont = UI_CONFIG.logoFont as string;
  // @ts-ignore - Set in update() method
  private uiGlitchIntensity = 0;
  private uiGlitchNextTime = 0;
  private uiGlitchTargets: Phaser.GameObjects.Text[] = [];
  private uiGlitchBasePositions = new Map<
    Phaser.GameObjects.Text,
    { x: number; y: number; alpha: number }
  >();
  private readonly joystickSensitivityKey =
    'neon-sentinel-joystick-sensitivity';
  // Buttons
  private pauseButton!: Phaser.GameObjects.Container;
  private restartButton!: Phaser.GameObjects.Container;
  private menuButton!: Phaser.GameObjects.Container;
  private resumeButton!: Phaser.GameObjects.Container;
  private runStatsTexts: Phaser.GameObjects.Text[] = [];
  private runSummaryTexts: Phaser.GameObjects.Text[] = [];
  private progressStatementText!: Phaser.GameObjects.Text;
  private summaryContainer!: Phaser.GameObjects.Container;
  private revivePromptContainer!: Phaser.GameObjects.Container;
  private revivePromptCountdownText!: Phaser.GameObjects.Text;
  private revivePromptButton!: Phaser.GameObjects.Container;
  private revivePromptTimer?: Phaser.Time.TimerEvent;
  private tooltipManager!: TooltipManager;
  private dialogueManager!: DialogueManager;

  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    // Initialize tooltip manager
    this.tooltipManager = new TooltipManager(this);
    // Allow GameScene to request tooltip hide
    this.events.on('hide-tooltips', () => this.tooltipManager.skipAll());
    
    // Initialize dialogue manager
    this.dialogueManager = new DialogueManager(this);

    // Mobile UI scaling - reduce sizes on mobile
    const settingsScale = (this.registry.get('uiScale') as number) || 1;
    const settingsOpacity = (this.registry.get('uiOpacity') as number) || 1;
    const highContrast = !!this.registry.get('uiHighContrast');
    const dyslexiaFont = !!this.registry.get('uiDyslexiaFont');
    this.uiTextColor = (highContrast ? '#ffffff' : UI_CONFIG.neonGreen) as typeof UI_CONFIG.neonGreen;
    this.uiOpacityMultiplier = settingsOpacity;
    this.uiMenuFont = (dyslexiaFont ? 'Arial' : UI_CONFIG.menuFont) as typeof UI_CONFIG.menuFont;
    this.uiScoreFont = (dyslexiaFont ? 'Arial' : UI_CONFIG.scoreFont) as typeof UI_CONFIG.scoreFont;
    this.uiBodyFont = (dyslexiaFont ? 'Arial' : UI_CONFIG.bodyFont) as typeof UI_CONFIG.bodyFont;
    this.uiLogoFont = (dyslexiaFont ? 'Arial' : UI_CONFIG.logoFont) as typeof UI_CONFIG.logoFont;

    const uiScale = (MOBILE_SCALE < 1.0 ? 0.6 : 1.0) * settingsScale; // 60% size on mobile
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
      fontFamily: this.uiScoreFont,
      fontSize: 56 * uiScale,
      color: this.uiTextColor,
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
    this.scoreText.setAlpha(this.scoreText.alpha * this.uiOpacityMultiplier);

    // Combo multiplier display (adjusted position to accommodate larger score)
    this.comboText = this.add.text(baseX, baseY + lineSpacing * 2, 'COMBO: 1.0x', {
      fontFamily: this.uiScoreFont,
      fontSize: 24 * uiScale,
      color: this.uiTextColor,
      stroke: '#000000',
      strokeThickness: 3 * uiScale,
    });
    if (MOBILE_SCALE < 1.0) {
      this.comboText.setAlpha(0.85); // Slightly transparent on mobile
    }
    this.comboText.setAlpha(this.comboText.alpha * this.uiOpacityMultiplier);

    // Show tooltip for combo (first time only)
    this.tooltipManager.enqueueTooltip(
      {
        id: 'game-combo',
        targetX: baseX + 100,
        targetY: baseY + lineSpacing * 2 + 15,
        content: "I'm tracking your combo multiplier. It increases when you destroy enemies without taking damage. Build combos for massive scores!",
        position: 'right',
        width: 280,
      },
      2000
    );

    // Layer display - Oxanium for menu/subtitle style (adjusted position)
    this.layerText = this.add.text(baseX, baseY + lineSpacing * 3, 'LAYER: Boot Sector', {
      fontFamily: this.uiMenuFont,
      fontSize: UI_CONFIG.fontSize.small * uiScale,
      color: this.uiTextColor,
      stroke: '#000000',
      strokeThickness: 3 * uiScale,
    });
    if (MOBILE_SCALE < 1.0) {
      this.layerText.setAlpha(0.85); // Slightly transparent on mobile
    }
    this.layerText.setAlpha(this.layerText.alpha * this.uiOpacityMultiplier);

    // Show tooltip for layer (first time only)
    this.tooltipManager.enqueueTooltip(
      {
        id: 'game-layer',
        targetX: baseX + 100,
        targetY: baseY + lineSpacing * 3 + 10,
        content: "You're currently in the Boot Sector. Deeper layers mean tougher enemies and higher scores. Defeat graduation bosses to advance!",
        position: 'right',
        width: 280,
      },
      3000
    );

    // Prestige display
    this.prestigeText = this.add.text(baseX, baseY + lineSpacing * 4, 'PRESTIGE: 0', {
      fontFamily: this.uiMenuFont,
      fontSize: UI_CONFIG.fontSize.small * uiScale,
      color: this.uiTextColor,
      stroke: '#000000',
      strokeThickness: 3 * uiScale,
    });
    if (MOBILE_SCALE < 1.0) {
      this.prestigeText.setAlpha(0.85);
    }
    this.prestigeText.setAlpha(this.prestigeText.alpha * this.uiOpacityMultiplier);

    // Show tooltip for prestige (first time only)
    this.tooltipManager.enqueueTooltip(
      {
        id: 'game-prestige',
        targetX: baseX + 100,
        targetY: baseY + lineSpacing * 4 + 10,
        content: 'After completing Layer 6, you can prestige to loop back with increased difficulty and score multipliers. This is how true Sentinels progress!',
        position: 'right',
        width: 280,
      },
      4000
    );

    // Rank display
    this.rankText = this.add.text(baseX, baseY + lineSpacing * 5, 'RANK: Initiate Sentinel', {
      fontFamily: this.uiMenuFont,
      fontSize: UI_CONFIG.fontSize.small * uiScale,
      color: this.uiTextColor,
      stroke: '#000000',
      strokeThickness: 3 * uiScale,
    });
    if (MOBILE_SCALE < 1.0) {
      this.rankText.setAlpha(0.85);
    }
    this.rankText.setAlpha(this.rankText.alpha * this.uiOpacityMultiplier);

    this.registerUiGlitchTargets([
      this.scoreText,
      this.comboText,
      this.layerText,
      this.prestigeText,
      this.rankText,
    ]);

    // Lives display (orb indicators only)
    const livesX = baseX + 10 * uiScale;
    const livesY = baseY + lineSpacing * 5 + 8 * uiScale;
    this.livesOrb = this.add.graphics();
    this.renderLivesOrbs(1, livesX, livesY, uiScale);
    this.livesOrb.setAlpha(this.uiOpacityMultiplier);

    // Show tooltip for lives (first time only)
    this.tooltipManager.enqueueTooltip(
      {
        id: 'game-lives',
        targetX: livesX + 40,
        targetY: livesY + 20,
        content: 'Each orb represents 2 lives. Collect purple Life Orbs to gain more lives (max 20). Be careful - you lose a life when enemies touch you!',
        position: 'right',
        width: 280,
      },
      5000
    );

    // Removed top-left run stats panel per UX request

    // Create shock bomb and god mode meters
    // Only create meters if abilities are unlocked
    if (isShockBombUnlocked()) {
      this.createShockBombMeter();
      // Show tooltip for shock bomb meter (first time only)
      const width = this.scale.width;
      const uiScale = MOBILE_SCALE < 1.0 ? 0.7 : 1.0;
      const shockBombBarX = width - 80 * uiScale;
      const shockBombBarY = 20 * uiScale;
      this.tooltipManager.enqueueTooltip(
        {
          id: 'game-shockbomb',
          targetX: shockBombBarX + 6,
          targetY: shockBombBarY + 30,
          content: 'Your Shock Bomb meter fills over time. When ready, press B to instantly destroy 70% of enemies on screen! This ability unlocks at 10,000 lifetime score.',
          position: 'left',
          width: 280,
        },
        6000
      );
    }
    if (isGodModeUnlocked()) {
      this.createGodModeMeter();
      // Show tooltip for god mode meter (first time only)
      const width = this.scale.width;
      const uiScale = MOBILE_SCALE < 1.0 ? 0.7 : 1.0;
      const godModeBarX = width - 50 * uiScale;
      const godModeBarY = 20 * uiScale;
      this.tooltipManager.enqueueTooltip(
        {
          id: 'game-godmode',
          targetX: godModeBarX + 6,
          targetY: godModeBarY + 30,
          content: 'Your God Mode meter fills over time. When ready, press Q for 10 seconds of invincibility! This powerful ability unlocks at 25,000 lifetime score.',
          position: 'left',
          width: 280,
        },
        7000
      );
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
    this.registry.events.on('changedata-currentRank', this.updateRank, this);
    this.registry.events.on('changedata-shockBombProgress', this.updateShockBomb, this);
    this.registry.events.on('changedata-shockBombReady', this.updateShockBombReady, this);
    this.registry.events.on('changedata-godModeProgress', this.updateGodMode, this);
    this.registry.events.on('changedata-godModeReady', this.updateGodModeReady, this);
    this.registry.events.on('changedata-godModeActive', this.updateGodModeActive, this);
    this.registry.events.on('changedata-challengeActive', this.updateChallengeActive, this);
    this.registry.events.on('changedata-challengeTitle', this.updateChallengeTitle, this);
    this.registry.events.on('changedata-challengeDescription', this.updateChallengeDescription, this);
    this.registry.events.on('changedata-challengeProgress', this.updateChallengeProgress, this);
    this.registry.events.on('changedata-lives', this.updateLives, this);
    this.registry.events.on('changedata-gameOver', this.onGameOver, this);
    // Run stats UI is hidden (summary shown on game over only)
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

  update(time: number) {
    const intensity = (this.registry.get('uiGlitchIntensity') as number) || 0;
    this.uiGlitchIntensity = intensity;
    if (intensity <= 0) {
      this.clearUiGlitch();
      return;
    }
    if (time >= this.uiGlitchNextTime) {
      this.applyUiGlitch(intensity);
      const jitter = Phaser.Math.Between(180, 420);
      this.uiGlitchNextTime = time + jitter * (1 - intensity * 0.4);
    }
  }

  private registerUiGlitchTargets(targets: Phaser.GameObjects.Text[]) {
    targets.forEach((target) => {
      this.uiGlitchTargets.push(target);
      this.uiGlitchBasePositions.set(target, {
        x: target.x,
        y: target.y,
        alpha: target.alpha,
      });
    });
  }

  private applyUiGlitch(intensity: number) {
    const jitter = 2 + intensity * 6;
    this.uiGlitchTargets.forEach((target) => {
      const base = this.uiGlitchBasePositions.get(target);
      if (!base) return;
      target.setPosition(
        base.x + Phaser.Math.Between(-jitter, jitter),
        base.y + Phaser.Math.Between(-jitter, jitter)
      );
      target.setAlpha(
        Phaser.Math.Clamp(base.alpha - intensity * 0.2, 0.4, 1)
      );
    });
    this.time.delayedCall(120, () => this.clearUiGlitch());
  }

  private clearUiGlitch() {
    this.uiGlitchTargets.forEach((target) => {
      const base = this.uiGlitchBasePositions.get(target);
      if (!base) return;
      target.setPosition(base.x, base.y);
      target.setAlpha(base.alpha);
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
      fontFamily: this.uiLogoFont,
      fontSize: UI_CONFIG.fontSize.xlarge,
      color: this.uiTextColor,
      stroke: '#000000',
      strokeThickness: 6,
    });
    this.gameOverText.setOrigin(0.5, 0.5);

    // Final score - VT323 for score display
    this.finalScoreText = this.add.text(width / 2, height / 2 - 50, 'FINAL SCORE: 0', {
      fontFamily: this.uiScoreFont,
      fontSize: 28,
      color: this.uiTextColor,
      stroke: '#000000',
      strokeThickness: 4,
    });
    this.finalScoreText.setOrigin(0.5, 0.5);

    // Rank display
    this.rankTextGameOver = this.add.text(width / 2, height / 2 - 20, 'RANK: Initiate Sentinel', {
      fontFamily: this.uiMenuFont,
      fontSize: 18,
      color: '#00ffff',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.rankTextGameOver.setOrigin(0.5, 0.5);

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

    const summaryStartY = height / 2 + 20;
    const summaryLineSpacing = MOBILE_SCALE < 1.0 ? 14 : 16;
    const summaryLines = [
      'SURVIVAL TIME:',
    ];
    this.runSummaryTexts = summaryLines.map((label, index) => {
      const line = this.add.text(
        width / 2,
        summaryStartY + index * summaryLineSpacing,
        `${label} 0`,
        {
          fontFamily: this.uiBodyFont,
          fontSize: UI_CONFIG.fontSize.small,
          color: this.uiTextColor,
          align: 'left',
        }
      );
      line.setOrigin(0.5, 0);
      line.setAlpha(this.uiOpacityMultiplier);
      line.setVisible(false);
      return line;
    });

    const progressStartY = summaryStartY + summaryLines.length * summaryLineSpacing + 20;
    this.progressStatementText = this.add.text(width / 2, progressStartY, '', {
      fontFamily: this.uiBodyFont,
      fontSize: UI_CONFIG.fontSize.small,
      color: '#00ff99',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center',
      wordWrap: { width: width * 0.8, useAdvancedWrap: true },
    });
    this.progressStatementText.setOrigin(0.5, 0.5);

    // Restart button
    const buttonStartY = progressStartY + 50;
    this.restartButton = this.createButton(
      width / 2,
      buttonStartY,
      'RESTART',
      200,
      50,
      18
    );
    const restartBg = this.restartButton.list[0] as Phaser.GameObjects.Rectangle;
    restartBg.on('pointerdown', () => {
      this.restartGame();
    });

    // Menu button
    this.menuButton = this.createButton(
      width / 2,
      buttonStartY + 65,
      'MENU',
      200,
      50,
      18
    );
    const menuBg = this.menuButton.list[0] as Phaser.GameObjects.Rectangle;
    menuBg.on('pointerdown', () => {
      const gameScene = this.scene.get('GameScene') as GameScene;
      if (gameScene) {
        gameScene.returnToMenu();
      }
    });

    this.summaryContainer = this.add.container(0, 0, [
      this.gameOverText,
      this.finalScoreText,
      this.rankTextGameOver,
      this.prestigeBadgeText,
      ...this.runSummaryTexts,
      this.progressStatementText,
      this.restartButton,
      this.menuButton,
    ]);
    this.summaryContainer.setVisible(false);

    // Revive prompt modal (shown for 10 seconds)
    const revivePanel = this.add.rectangle(width / 2, height / 2, 380, 260, 0x000000, 0.95);
    revivePanel.setStrokeStyle(3, 0x00ff99);

    // Title at top
    const reviveTitle = this.add.text(width / 2, height / 2 - 95, 'REVIVE AVAILABLE', {
      fontFamily: this.uiMenuFont,
      fontSize: UI_CONFIG.fontSize.medium,
      color: this.uiTextColor,
      stroke: '#000000',
      strokeThickness: 3,
    });
    reviveTitle.setOrigin(0.5, 0.5);

    // Create coin icon (Lucide-style coin design) - centered in upper middle
    const coinIcon = this.add.graphics();
    const coinX = width / 2;
    const coinY = height / 2 - 25;
    const coinRadius = 28;
    // Outer ring
    coinIcon.fillStyle(0xffcc33, 1);
    coinIcon.fillCircle(coinX, coinY, coinRadius);
    coinIcon.lineStyle(3, 0xffaa00, 1);
    coinIcon.strokeCircle(coinX, coinY, coinRadius);
    // Inner circle for depth
    coinIcon.fillStyle(0xffdd44, 1);
    coinIcon.fillCircle(coinX, coinY, coinRadius - 4);
    // Inner detail lines (like Lucide coin)
    coinIcon.lineStyle(2, 0xffaa00, 0.6);
    coinIcon.beginPath();
    coinIcon.arc(coinX, coinY, coinRadius - 8, Phaser.Math.DegToRad(45), Phaser.Math.DegToRad(135));
    coinIcon.strokePath();
    coinIcon.beginPath();
    coinIcon.arc(coinX, coinY, coinRadius - 8, Phaser.Math.DegToRad(225), Phaser.Math.DegToRad(315));
    coinIcon.strokePath();
    // Add coin symbol (circle with line, like Lucide)
    const coinSymbol = this.add.graphics();
    coinSymbol.lineStyle(3, 0x000000, 1);
    coinSymbol.strokeCircle(coinX, coinY - 2, 8);
    coinSymbol.lineStyle(2, 0x000000, 1);
    coinSymbol.beginPath();
    coinSymbol.moveTo(coinX - 6, coinY + 2);
    coinSymbol.lineTo(coinX + 6, coinY + 2);
    coinSymbol.strokePath();

    // Countdown timer (prominent display) - centered below coin
    this.revivePromptCountdownText = this.add.text(width / 2, height / 2 + 30, '10', {
      fontFamily: this.uiScoreFont,
      fontSize: 52,
      color: '#00ff99',
      stroke: '#000000',
      strokeThickness: 6,
    });
    this.revivePromptCountdownText.setOrigin(0.5, 0.5);

    // Button at bottom with proper spacing
    this.revivePromptButton = this.createButton(
      width / 2,
      height / 2 + 95,
      'REVIVE (1 COIN)',
      240,
      50,
      18
    );
    const revivePromptBg = this.revivePromptButton.list[0] as Phaser.GameObjects.Rectangle;
    revivePromptBg.on('pointerdown', () => {
      const gameScene = this.scene.get('GameScene') as GameScene;
      if (gameScene && gameScene.tryReviveWithCoin()) {
        this.clearRevivePrompt();
        this.registry.set('gameOver', false);
      }
    });

    this.revivePromptContainer = this.add.container(0, 0, [
      revivePanel,
      reviveTitle,
      coinIcon,
      coinSymbol,
      this.revivePromptCountdownText,
      this.revivePromptButton,
    ]);
    this.revivePromptContainer.setVisible(false);

    // Create container and hide it initially
    this.gameOverContainer = this.add.container(0, 0, [
      overlay,
      this.summaryContainer,
      this.revivePromptContainer,
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

    // Current rank display in pause menu
    const rankTitle = this.add.text(width / 2, height / 2 + 170, 'CURRENT RANK', {
      fontFamily: UI_CONFIG.menuFont,
      fontSize: UI_CONFIG.fontSize.small,
      color: UI_CONFIG.neonGreen,
      stroke: '#000000',
      strokeThickness: 2,
    });
    rankTitle.setOrigin(0.5, 0.5);
    
    this.currentRankPauseText = this.add.text(width / 2, height / 2 + 195, '', {
      fontFamily: UI_CONFIG.menuFont,
      fontSize: UI_CONFIG.fontSize.small,
      color: '#00ffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.currentRankPauseText.setOrigin(0.5, 0.5);
    
    // Update rank display when it changes
    this.registry.events.on('changedata-currentRank', () => {
      const rank = this.registry.get('currentRank') as string || 'Initiate Sentinel';
      this.currentRankPauseText.setText(rank);
    });
    
    const achievementsTitle = this.add.text(width / 2, height / 2 + 220, 'ACHIEVEMENTS', {
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
        height / 2 + 245 + i * 18,
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
      rankTitle,
      this.currentRankPauseText,
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
    
    // Show tooltip for pause button (first time only)
    this.time.delayedCall(8000, () => {
      this.tooltipManager.enqueueTooltip({
        id: 'game-pause',
        targetX: width - 40 * uiScale,
        targetY: 40 * uiScale,
        content: 'Click this button or press ESC to pause the game. From the pause menu, you can access settings, leaderboard, and more!',
        position: 'left',
        width: 280,
      });
    });

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

  private updateRank(_parent: Phaser.Data.DataManager, rankName: string) {
    this.rankText.setText(`RANK: ${rankName}`);
  }


  // @ts-ignore - Reserved for future use
  private createRunStatsDisplay(baseX: number, startY: number, uiScale: number) {
    const labels = [
      'TIME',
      'ENEMIES',
      'ACCURACY',
      'DODGES',
      'SHOTS',
    ];
    this.runStatsTexts = labels.map((label, index) => {
      const line = this.add.text(baseX, startY + index * 16 * uiScale, `${label}: 0`, {
        fontFamily: this.uiBodyFont,
        fontSize: 12 * uiScale,
        color: this.uiTextColor,
        stroke: '#000000',
        strokeThickness: 2 * uiScale,
      });
      if (MOBILE_SCALE < 1.0) {
        line.setAlpha(0.8);
      }
      line.setAlpha(line.alpha * this.uiOpacityMultiplier);
      return line;
    });
  }

  // @ts-ignore - Reserved for future use
  private updateRunStats(
    _parent: Phaser.Data.DataManager,
    stats: {
      survivalTimeMs?: number;
      enemiesDefeated?: number;
      shotsFired?: number;
      shotsHit?: number;
      accuracy?: number;
      bulletsDodged?: number;
    }
  ) {
    if (!stats || this.runStatsTexts.length === 0) {
      return;
    }
    const minutes = Math.floor((stats.survivalTimeMs ?? 0) / 60000);
    const seconds = Math.floor(((stats.survivalTimeMs ?? 0) % 60000) / 1000);
    const accuracyPct = Math.round((stats.accuracy ?? 0) * 100);
    const lines = [
      `TIME: ${minutes}m ${seconds}s`,
      `ENEMIES: ${(stats.enemiesDefeated ?? 0).toLocaleString()}`,
      `ACCURACY: ${accuracyPct}%`,
      `DODGES: ${(stats.bulletsDodged ?? 0).toLocaleString()}`,
      `SHOTS: ${(stats.shotsFired ?? 0).toLocaleString()}`,
    ];
    this.runStatsTexts.forEach((text, index) => {
      text.setText(lines[index] || '');
    });
  }

  private createShockBombMeter() {
    const width = this.scale.width;
    // const height = this.scale.height; // Unused
    const uiScale = MOBILE_SCALE < 1.0 ? 0.7 : 1.0;
    const barWidth = 12 * uiScale;
    const barHeight = 60 * uiScale; // Smaller height for top placement
    const barX = width - 80 * uiScale; // Move left to make room for both meters
    const barY = 20 * uiScale; // Top of screen near score panel

    // Background
    this.shockBombBarBg = this.add.graphics();
    this.shockBombBarBg.fillStyle(0x000000, 0.6);
    this.shockBombBarBg.fillRect(barX, barY, barWidth, barHeight);
    this.shockBombBarBg.lineStyle(2, 0xff4400, 0.8);
    this.shockBombBarBg.strokeRect(barX, barY, barWidth, barHeight);

    // Fill
    this.shockBombBarFill = this.add.graphics();
    this.renderShockBombFill(0, barX, barY, barWidth, barHeight);

    // Glow effect (hidden until ready)
    this.shockBombGlow = this.add.graphics();
    this.shockBombGlow.setVisible(false);

    // Key indicator (B key on desktop)
    if (MOBILE_SCALE >= 1.0) {
      this.shockBombKeyText = this.add.text(
        barX + barWidth / 2,
        barY - 20 * uiScale,
        '',
        {
          fontFamily: UI_CONFIG.menuFont,
          fontSize: 16 * uiScale,
          color: '#ff4400',
          stroke: '#000000',
          strokeThickness: 3,
        }
      );
      this.shockBombKeyText.setOrigin(0.5, 0.5);
      this.shockBombKeyText.setVisible(false);
    }

    // Make meter touchable on mobile
    if (MOBILE_SCALE < 1.0) {
      const hitArea = this.add.rectangle(barX + barWidth / 2, barY + barHeight / 2, barWidth + 10, barHeight + 10, 0x000000, 0);
      hitArea.setInteractive({ useHandCursor: true });
      hitArea.on('pointerdown', () => {
        const gameScene = this.scene.get('GameScene') as GameScene;
        if (gameScene) {
          gameScene.tryActivateShockBomb();
        }
      });
    }
  }

  private createGodModeMeter() {
    const width = this.scale.width;
    // const height = this.scale.height; // Unused
    const uiScale = MOBILE_SCALE < 1.0 ? 0.7 : 1.0;
    const barWidth = 12 * uiScale;
    const barHeight = 60 * uiScale; // Smaller height for top placement
    const barX = width - 50 * uiScale; // Right side, next to shock bomb meter
    const barY = 20 * uiScale; // Top of screen near score panel

    // Background
    this.godModeBarBg = this.add.graphics();
    this.godModeBarBg.fillStyle(0x000000, 0.6);
    this.godModeBarBg.fillRect(barX, barY, barWidth, barHeight);
    this.godModeBarBg.lineStyle(2, 0x00aaff, 0.8);
    this.godModeBarBg.strokeRect(barX, barY, barWidth, barHeight);

    // Fill
    this.godModeBarFill = this.add.graphics();
    this.renderGodModeFill(0, barX, barY, barWidth, barHeight);

    // Glow effect (hidden until ready)
    this.godModeGlow = this.add.graphics();
    this.godModeGlow.setVisible(false);

    // Key indicator (Q key on desktop)
    if (MOBILE_SCALE >= 1.0) {
      this.godModeKeyText = this.add.text(
        barX + barWidth / 2,
        barY - 20 * uiScale,
        '',
        {
          fontFamily: UI_CONFIG.menuFont,
          fontSize: 16 * uiScale,
          color: '#00aaff',
          stroke: '#000000',
          strokeThickness: 3,
        }
      );
      this.godModeKeyText.setOrigin(0.5, 0.5);
      this.godModeKeyText.setVisible(false);
    }

    // Make meter touchable on mobile
    if (MOBILE_SCALE < 1.0) {
      const hitArea = this.add.rectangle(barX + barWidth / 2, barY + barHeight / 2, barWidth + 10, barHeight + 10, 0x000000, 0);
      hitArea.setInteractive({ useHandCursor: true });
      hitArea.on('pointerdown', () => {
        const gameScene = this.scene.get('GameScene') as GameScene;
        if (gameScene) {
          gameScene.tryActivateGodMode();
        }
      });
    }
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


  private updateShockBomb(_parent: Phaser.Data.DataManager, value: number) {
    const width = this.scale.width;
    // const height = this.scale.height; // Unused
    const uiScale = MOBILE_SCALE < 1.0 ? 0.7 : 1.0;
    const barWidth = 12 * uiScale;
    const barHeight = 60 * uiScale; // Match createShockBombMeter
    const barX = width - 80 * uiScale; // Match createShockBombMeter
    const barY = 20 * uiScale; // Match createShockBombMeter
    this.renderShockBombFill(value, barX, barY, barWidth, barHeight);
  }

  private updateShockBombReady(_parent: Phaser.Data.DataManager, ready: boolean) {
    if (!this.shockBombGlow) {
      return;
    }
    const width = this.scale.width;
    // const height = this.scale.height; // Unused
    const uiScale = MOBILE_SCALE < 1.0 ? 0.7 : 1.0;
    const barWidth = 12 * uiScale;
    const barHeight = 60 * uiScale; // Match createShockBombMeter
    const barX = width - 80 * uiScale; // Match createShockBombMeter
    const barY = 20 * uiScale; // Match createShockBombMeter

    this.shockBombGlow.setVisible(ready);
    if (ready) {
      // Pulsing glow effect
      this.tweens.add({
        targets: this.shockBombGlow,
        alpha: { from: 0.3, to: 0.8 },
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
      this.shockBombGlow.clear();
      this.shockBombGlow.fillStyle(0xff4400, 0.5);
      this.shockBombGlow.fillRect(barX - 3, barY - 3, barWidth + 6, barHeight + 6);
    }

    // Show key indicator on desktop
    if (MOBILE_SCALE >= 1.0 && this.shockBombKeyText) {
      this.shockBombKeyText.setVisible(ready);
      if (ready) {
        this.shockBombKeyText.setText('B');
      }
    }
  }

  private updateGodMode(_parent: Phaser.Data.DataManager, value: number) {
    const width = this.scale.width;
    // const height = this.scale.height; // Unused
    const uiScale = MOBILE_SCALE < 1.0 ? 0.7 : 1.0;
    const barWidth = 12 * uiScale;
    const barHeight = 60 * uiScale; // Match createGodModeMeter
    const barX = width - 50 * uiScale; // Match createGodModeMeter
    const barY = 20 * uiScale; // Match createGodModeMeter
    this.renderGodModeFill(value, barX, barY, barWidth, barHeight);
  }

  private updateGodModeReady(_parent: Phaser.Data.DataManager, ready: boolean) {
    if (!this.godModeGlow) {
      return;
    }
    const width = this.scale.width;
    // const height = this.scale.height; // Unused
    const uiScale = MOBILE_SCALE < 1.0 ? 0.7 : 1.0;
    const barWidth = 12 * uiScale;
    const barHeight = 60 * uiScale; // Match createGodModeMeter
    const barX = width - 50 * uiScale; // Match createGodModeMeter
    const barY = 20 * uiScale; // Match createGodModeMeter

    this.godModeGlow.setVisible(ready);
    if (ready) {
      // Pulsing glow effect
      this.tweens.add({
        targets: this.godModeGlow,
        alpha: { from: 0.3, to: 0.8 },
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
      this.godModeGlow.clear();
      this.godModeGlow.fillStyle(0x00aaff, 0.5);
      this.godModeGlow.fillRect(barX - 3, barY - 3, barWidth + 6, barHeight + 6);
    }

    // Show key indicator on desktop
    if (MOBILE_SCALE >= 1.0 && this.godModeKeyText) {
      this.godModeKeyText.setVisible(ready);
      if (ready) {
        this.godModeKeyText.setText('Q');
      }
    }
  }

  private updateGodModeActive(_parent: Phaser.Data.DataManager, active: boolean) {
    // Visual feedback when god mode is active
    if (active && this.godModeBarBg && this.godModeBarFill) {
      this.tweens.add({
        targets: [this.godModeBarBg, this.godModeBarFill],
        alpha: { from: 1, to: 0.5 },
        duration: 200,
        yoyo: true,
        repeat: 5,
      });
    }
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


  private renderShockBombFill(
    progress: number,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    if (!this.shockBombBarFill || !this.shockBombBarBg) {
      return;
    }
    const clamped = Phaser.Math.Clamp(progress, 0, 1);
    const fillHeight = height * clamped;
    this.shockBombBarFill.clear();
    const color = clamped >= 1 ? 0xff6600 : 0xff4400;
    this.shockBombBarFill.fillStyle(color, clamped > 0 ? 0.9 : 0.2);
    this.shockBombBarFill.fillRect(
      x,
      y + (height - fillHeight),
      width,
      fillHeight
    );
    this.shockBombBarBg.setAlpha(clamped > 0 ? 1 : 0.4);
  }

  private renderGodModeFill(
    progress: number,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    if (!this.godModeBarFill || !this.godModeBarBg) {
      return;
    }
    const clamped = Phaser.Math.Clamp(progress, 0, 1);
    const fillHeight = height * clamped;
    this.godModeBarFill.clear();
    const color = clamped >= 1 ? 0x00ccff : 0x00aaff;
    this.godModeBarFill.fillStyle(color, clamped > 0 ? 0.9 : 0.2);
    this.godModeBarFill.fillRect(
      x,
      y + (height - fillHeight),
      width,
      fillHeight
    );
    this.godModeBarBg.setAlpha(clamped > 0 ? 1 : 0.4);
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
    const blendedObj = blended as { r: number; g: number; b: number };
    return Phaser.Display.Color.GetColor(blendedObj.r, blendedObj.g, blendedObj.b);
  }

  private onGameOver(_parent: Phaser.Data.DataManager, value: boolean) {
    if (value) {
      const finalScore = this.registry.get('finalScore') || 0;
      this.finalScoreText.setText(`FINAL SCORE: ${finalScore.toLocaleString()}`);
      
      // Display current rank
      const currentRank = this.registry.get('currentRank') as string || 'Initiate Sentinel';
      this.rankTextGameOver.setText(`RANK: ${currentRank}`);
      this.rankTextGameOver.setVisible(true);
      
      const prestigeChampion = !!this.registry.get('prestigeChampion');
      this.prestigeBadgeText.setVisible(prestigeChampion);
      const coins = (this.registry.get('coins') as number) || 0;
      const reviveCount = (this.registry.get('reviveCount') as number) || 0;
      const reviveCost = reviveCount + 1;
      this.updateRunSummary(finalScore);
      this.updateProgressStatement(finalScore);
      this.runSummaryTexts.forEach((line) => line.setVisible(true));
      this.gameOverContainer.setVisible(true);
      this.pauseContainer.setVisible(false);
      this.pauseButton.setVisible(false); // Hide pause button when game over
      this.settingsContainer.setVisible(false);
      this.settingsVisible = false;
      this.showRevivePrompt(coins, reviveCost);
    } else {
      this.gameOverContainer.setVisible(false);
      this.prestigeBadgeText.setVisible(false);
      this.runSummaryTexts.forEach((line) => line.setVisible(false));
      this.summaryContainer.setVisible(false);
      this.clearRevivePrompt();
      this.hideLeaderboard();
      this.pauseButton.setVisible(true); // Show pause button when game restarts
    }
  }

  private updateRunSummary(_finalScore: number) {
    const stats = (this.registry.get('runStats') as {
      survivalTimeMs?: number;
    }) || {};
    const minutes = Math.floor((stats.survivalTimeMs ?? 0) / 60000);
    const seconds = Math.floor(((stats.survivalTimeMs ?? 0) % 60000) / 1000);
    const lines = [
      `SURVIVAL TIME: ${minutes}m ${seconds}s`,
    ];
    this.runSummaryTexts.forEach((text, index) => {
      if (lines[index]) {
        text.setText(lines[index]);
        text.setOrigin(0.5, 0);
      }
    });
  }

  // @ts-ignore - Reserved for future use
  private _updateFailureFeedback(finalScore: number) {
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
      let currentMultiplier: number = CORRUPTION_SYSTEM.scoreMultiplier.low;
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

  private updateProgressStatement(finalScore: number) {
    const nextLayerEntry = Object.values(LAYER_CONFIG).find(
      (layer) => layer.scoreThreshold > finalScore
    );
    if (nextLayerEntry) {
      const diff = nextLayerEntry.scoreThreshold - finalScore;
      this.progressStatementText.setText(
        `PROGRESS: ${diff.toLocaleString()} pts to reach ${nextLayerEntry.name}`
      );
      return;
    }
    this.progressStatementText.setText('PROGRESS: MAX LAYER REACHED');
  }

  private showRevivePrompt(coins: number, reviveCost: number) {
    if (coins < reviveCost) {
      this.revivePromptContainer.setVisible(false);
      this.summaryContainer.setVisible(true);
      return;
    }
    this.summaryContainer.setVisible(false);
    this.revivePromptContainer.setVisible(true);

    const reviveLabel = this.revivePromptButton.list[1] as Phaser.GameObjects.Text;
    reviveLabel.setText(`REVIVE (${reviveCost} COIN${reviveCost > 1 ? 'S' : ''})`);

    let remaining = 10;
    this.revivePromptCountdownText.setText(`${remaining}`);
    this.revivePromptCountdownText.setColor('#00ff99');
    this.revivePromptTimer?.remove();
    this.revivePromptTimer = this.time.addEvent({
      delay: 1000,
      repeat: 9,
      callback: () => {
        remaining -= 1;
        this.revivePromptCountdownText.setText(`${remaining}`);
        
        // Change color to red at 3 seconds or less
        if (remaining <= 3) {
          this.revivePromptCountdownText.setColor('#ff0000');
          // Pulse effect as time runs out
          this.tweens.add({
            targets: this.revivePromptCountdownText,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 200,
            yoyo: true,
          });
        } else {
          this.revivePromptCountdownText.setColor('#00ff99');
        }
        
        if (remaining <= 0) {
          this.clearRevivePrompt();
          this.summaryContainer.setVisible(true);
        }
      },
    });
  }

  private clearRevivePrompt() {
    this.revivePromptTimer?.remove();
    this.revivePromptTimer = undefined;
    this.revivePromptContainer.setVisible(false);
  }

  private onPauseChanged(_parent: Phaser.Data.DataManager, isPaused: boolean) {
    if (isPaused && !this.registry.get('gameOver')) {
      this.pauseContainer.setVisible(true);
      this.pauseButton.setVisible(false); // Hide pause button when paused
      this.refreshAchievementProgress();
      
      // Update rank display in pause menu
      const rank = this.registry.get('currentRank') as string || 'Initiate Sentinel';
      if (this.currentRankPauseText) {
        this.currentRankPauseText.setText(rank);
      }
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
    modifierKey?: string,
    currentRank?: string
  ) {
    // Import and call score service
    const { submitScore } = await import('../../services/scoreService');
    const rank = currentRank || (this.registry.get('currentRank') as string) || 'Initiate Sentinel';
    submitScore(score, walletAddress, deepestLayer, prestigeLevel, runMetrics, modifierKey, rank);

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
    // Hide tooltips when restarting
    if (this.tooltipManager) {
      this.tooltipManager.hideAllTooltips();
    }
  }

  // Cleanup on scene shutdown
  shutdown() {
    // Cleanup tooltip manager
    if (this.tooltipManager) {
      this.tooltipManager.destroy();
    }
    // Cleanup dialogue manager
    if (this.dialogueManager) {
      this.dialogueManager.destroy();
    }
  }
}

