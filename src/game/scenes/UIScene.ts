import Phaser from "phaser";
import {
    CORRUPTION_SYSTEM,
    FAILURE_FEEDBACK,
    LAYER_CONFIG,
    MOBILE_SCALE,
    UI_CONFIG,
} from "../config";
import {
    checkAllLeaderboardsTop10,
    getAchievementProgressSummary,
    getPersonalBests,
    unlockAchievement,
    updatePersonalBests,
} from "../../services/achievementService";
import { fetchWeeklyLeaderboard } from "../../services/scoreService";
import {
    isShockBombUnlocked,
    isGodModeUnlocked,
} from "../../services/abilityService";
import { getTierProgress } from "../../services/bulletUpgradeService";
import { getAvailableCoins } from "../../services/coinService";
import { getMiniMeSessionsAvailable } from "../../services/miniMeSessionsService";
import { GameScene } from "./GameScene";
import { TooltipManager } from "./TooltipManager";
import { DialogueManager } from "../dialogue/DialogueManager";

export class UIScene extends Phaser.Scene {
    private scoreText!: Phaser.GameObjects.Text;
    /** Combo multiplier shown as superscript on score (e.g. "x2.5") when combo > 1. */
    private scoreComboSuperscript!: Phaser.GameObjects.Text;
    private comboText?: Phaser.GameObjects.Text;
    private layerText?: Phaser.GameObjects.Text;
    private prestigeText!: Phaser.GameObjects.Text;
    private rankText?: Phaser.GameObjects.Text;
    private livesOrb!: Phaser.GameObjects.Graphics;
    private healthBarLabel!: Phaser.GameObjects.Text;
    private miniMeCountText?: Phaser.GameObjects.Text;
    private miniMeSessionsText!: Phaser.GameObjects.Text;
    private bulletTierText?: Phaser.GameObjects.Text;
    private coinBalanceText!: Phaser.GameObjects.Text;
    // Shock bomb meter: icon + circular border (yellow fill / black empty) + glow when ready
    private shockBombMeterContainer!: Phaser.GameObjects.Container;
    private shockBombBorderRing!: Phaser.GameObjects.Graphics;
    private shockBombKeyText!: Phaser.GameObjects.Text;
    private shockBombGlow!: Phaser.GameObjects.Graphics;
    private shockBombRadius = 0;
    // God mode meter: icon + circular border (yellow fill / black empty) + glow when ready
    private godModeMeterContainer!: Phaser.GameObjects.Container;
    private godModeBorderRing!: Phaser.GameObjects.Graphics;
    private godModeKeyText!: Phaser.GameObjects.Text;
    private godModeGlow!: Phaser.GameObjects.Graphics;
    private godModeRadius = 0;
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
        "neon-sentinel-joystick-sensitivity";
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
    // Headboard (unified HUD panel)
    private headboardContainer!: Phaser.GameObjects.Container;
    private headboardBg!: Phaser.GameObjects.Graphics;
    private headboardGrid!: Phaser.GameObjects.Graphics;
    private headboardLeft = 0;
    private headboardTop = 0;
    private headboardWidth = 0;
    private headboardUiScale = 1;
    private readonly HEADBOARD_PANEL_HEIGHT = 72;
    private readonly HEADBOARD_MARGIN_H = 24;
    private readonly HEADBOARD_MARGIN_TOP = 12;
    /** Center-to-center spacing between right-side headboard icons (god, shock, pause, mini-me, coin). */
    private readonly HEADBOARD_RIGHT_ICON_SPACING = 56;
    private readonly NEON_CYAN = 0x00ffff;
    private readonly NEON_GREEN = 0x00ff00;
    private readonly DARK_TEAL = 0x0d2a2a;
    private readonly YELLOW_ACCENT = 0xffcc00;
    private headboardHealthBarX = 0;
    private headboardHealthBarY = 0;
    private headboardCoinBoxX = 0;
    private headboardCoinBoxY = 0;
    private lastCoinMiniMeSyncTime = 0;

    constructor() {
        super({ key: "UIScene" });
    }

    create() {
        // Initialize tooltip manager
        this.tooltipManager = new TooltipManager(this);
        // Allow GameScene to request tooltip hide
        this.events.on("hide-tooltips", () => this.tooltipManager.skipAll());

        // Initialize dialogue manager
        this.dialogueManager = new DialogueManager(this);

        // Mobile UI scaling - reduce sizes on mobile
        const settingsScale = (this.registry.get("uiScale") as number) || 1;
        const settingsOpacity = (this.registry.get("uiOpacity") as number) || 1;
        const highContrast = !!this.registry.get("uiHighContrast");
        const dyslexiaFont = !!this.registry.get("uiDyslexiaFont");
        this.uiTextColor = (
            highContrast ? "#ffffff" : UI_CONFIG.neonGreen
        ) as typeof UI_CONFIG.neonGreen;
        this.uiOpacityMultiplier = settingsOpacity;
        this.uiMenuFont = (
            dyslexiaFont ? "Arial" : UI_CONFIG.menuFont
        ) as typeof UI_CONFIG.menuFont;
        this.uiScoreFont = (
            dyslexiaFont ? "Arial" : UI_CONFIG.scoreFont
        ) as typeof UI_CONFIG.scoreFont;
        this.uiBodyFont = (
            dyslexiaFont ? "Arial" : UI_CONFIG.bodyFont
        ) as typeof UI_CONFIG.bodyFont;
        this.uiLogoFont = (
            dyslexiaFont ? "Arial" : UI_CONFIG.logoFont
        ) as typeof UI_CONFIG.logoFont;

        const uiScale = (MOBILE_SCALE < 1.0 ? 0.6 : 1.0) * settingsScale; // 60% size on mobile
        this.headboardUiScale = uiScale;

        const storedSensitivity = Number(
            localStorage.getItem(this.joystickSensitivityKey),
        );
        const initialSensitivity = Number.isFinite(storedSensitivity)
            ? Phaser.Math.Clamp(storedSensitivity, 0.5, 2)
            : 1;
        this.registry.set("joystickSensitivity", initialSensitivity);

        // Unified headboard HUD (neon panel with score, combo, layer, name, health bar, session, bullet tier, pause)
        this.createHeadboard(uiScale);

        // Subscribe to coin balance and bullet tier
        this.registry.events.on(
            "changedata-coinBalance",
            this.updateCoinBalance,
            this,
        );
        this.updateCoinBalance(
            this.registry,
            (this.registry.get("coinBalance") as number) || 0,
        );
        this.registry.events.on(
            "changedata-prestigeLevel",
            this.updateBulletTier,
            this,
        );
        this.updateBulletTier(
            this.registry,
            this.registry.get("prestigeLevel") as number,
        );

        // Create shock bomb and god mode meters (positioned at headboard right edge)
        if (isShockBombUnlocked()) {
            this.createShockBombMeter();
            this.tooltipManager.enqueueTooltip(
                {
                    id: "game-shockbomb",
                    targetX:
                        this.headboardCoinBoxX -
                        3 * this.HEADBOARD_RIGHT_ICON_SPACING,
                    targetY:
                        this.headboardTop + this.HEADBOARD_PANEL_HEIGHT / 2,
                    content:
                        "Your Shock Bomb meter fills over time. When ready, press B to instantly destroy 70% of enemies on screen! This ability unlocks at 10,000 lifetime score.",
                    position: "left",
                    width: 280,
                },
                6000,
            );
        }
        if (isGodModeUnlocked()) {
            this.createGodModeMeter();
            this.tooltipManager.enqueueTooltip(
                {
                    id: "game-godmode",
                    targetX:
                        this.headboardCoinBoxX -
                        4 * this.HEADBOARD_RIGHT_ICON_SPACING,
                    targetY:
                        this.headboardTop + this.HEADBOARD_PANEL_HEIGHT / 2,
                    content:
                        "Your God Mode meter fills over time. When ready, press Q for 10 seconds of invincibility! This powerful ability unlocks at 25,000 lifetime score.",
                    position: "left",
                    width: 280,
                },
                7000,
            );
        }

        // Pause button last so it draws on top of meters and stays clickable
        const pauseX =
            this.headboardCoinBoxX - 2 * this.HEADBOARD_RIGHT_ICON_SPACING;
        const pauseY = this.headboardTop + this.HEADBOARD_PANEL_HEIGHT / 2;
        this.createPauseButton(pauseX, pauseY, uiScale);

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
        this.registry.events.on("changedata-score", this.updateScore, this);
        this.registry.events.on(
            "changedata-comboMultiplier",
            this.updateCombo,
            this,
        );
        this.registry.events.on("changedata-layerName", this.updateLayer, this);
        this.registry.events.on(
            "changedata-prestigeLevel",
            this.updatePrestige,
            this,
        );
        this.registry.events.on(
            "changedata-currentLayer",
            this.updatePrestigeLayer,
            this,
        );
        this.registry.events.on(
            "changedata-currentRank",
            this.updateRank,
            this,
        );
        this.registry.events.on(
            "changedata-miniMeSessionsRemaining",
            this.updateMiniMeSessions,
            this,
        );
        this.updateCombo(
            this.registry,
            (this.registry.get("comboMultiplier") as number) ?? 1,
        );
        this.registry.events.on(
            "changedata-shockBombProgress",
            this.updateShockBomb,
            this,
        );
        this.registry.events.on(
            "changedata-shockBombReady",
            this.updateShockBombReady,
            this,
        );
        this.registry.events.on(
            "changedata-godModeProgress",
            this.updateGodMode,
            this,
        );
        this.registry.events.on(
            "changedata-godModeReady",
            this.updateGodModeReady,
            this,
        );
        this.registry.events.on(
            "changedata-godModeActive",
            this.updateGodModeActive,
            this,
        );
        this.registry.events.on(
            "changedata-challengeActive",
            this.updateChallengeActive,
            this,
        );
        this.registry.events.on(
            "changedata-challengeTitle",
            this.updateChallengeTitle,
            this,
        );
        this.registry.events.on(
            "changedata-challengeDescription",
            this.updateChallengeDescription,
            this,
        );
        this.registry.events.on(
            "changedata-challengeProgress",
            this.updateChallengeProgress,
            this,
        );
        this.registry.events.on(
            "changedata-healthBars",
            this.updateHealthBars,
            this,
        );
        this.registry.events.on("changedata-gameOver", this.onGameOver, this);
        // Run stats UI is hidden (summary shown on game over only)
        this.registry.events.on(
            "changedata-isPaused",
            this.onPauseChanged,
            this,
        );

        // Listen for score submission from GameScene
        this.events.on("submitScore", this.onSubmitScore, this);

        // Listen for restart (R key)
        this.input.keyboard!.on("keydown-R", () => {
            if (this.registry.get("gameOver")) {
                this.restartGame();
            }
        });

        // Listen for return to menu (M key) - only when game is over and inventory modal not open (during play M activates mini-me session)
        this.input.keyboard!.on("keydown-M", () => {
            if (this.registry.get("inventoryModalOpen")) return;
            const gameOver = this.registry.get("gameOver");
            if (!gameOver) return;
            const gameScene = this.scene.get("GameScene") as GameScene;
            if (gameScene) {
                gameScene.returnToMenu();
            }
        });

        // ESC key handler - handles both pause and resume
        const escKey = this.input.keyboard!.addKey(
            Phaser.Input.Keyboard.KeyCodes.ESC,
        );
        escKey.on("down", () => {
            const gameOver = this.registry.get("gameOver");
            if (!gameOver) {
                const gameScene = this.scene.get("GameScene") as GameScene;
                if (gameScene && gameScene.scene.isActive()) {
                    gameScene.togglePause();
                }
            }
        });
    }

    private createHeadboard(uiScale: number) {
        const width = this.scale.width;
        this.headboardLeft = this.HEADBOARD_MARGIN_H;
        this.headboardTop = this.HEADBOARD_MARGIN_TOP;
        this.headboardWidth = width - 2 * this.HEADBOARD_MARGIN_H;
        const panelTop = this.headboardTop;
        const leftPad = 20;
        const x1 = this.headboardLeft;
        const x2 = this.headboardLeft + this.headboardWidth;
        const yTop = panelTop;
        const yBottom = panelTop + this.HEADBOARD_PANEL_HEIGHT;

        this.headboardContainer = this.add.container(0, 0);
        this.headboardContainer.setDepth(100);

        // Glassmorphism: simple rectangle, no left/right border, no inverted middle
        this.headboardBg = this.add.graphics();
        // Frosted glass base (semi-transparent dark)
        this.headboardBg.fillStyle(0x0d0d12, 0.45);
        this.headboardBg.fillRect(
            x1,
            panelTop,
            this.headboardWidth,
            this.HEADBOARD_PANEL_HEIGHT,
        );
        // Subtle lighter overlay for glass highlight
        this.headboardBg.fillStyle(0xffffff, 0.04);
        this.headboardBg.fillRect(
            x1,
            panelTop,
            this.headboardWidth,
            this.HEADBOARD_PANEL_HEIGHT,
        );
        this.headboardContainer.add(this.headboardBg);

        // Thin top/bottom gradient lines (sky blue -> green) with faint glow; no left/right border
        const gradientSegments = 32;
        const drawGradientLine = (
            g: Phaser.GameObjects.Graphics,
            y: number,
            glowAlpha: number,
            lineAlpha: number,
        ) => {
            for (let i = 0; i < gradientSegments; i++) {
                const t = i / (gradientSegments - 1);
                const r = Math.round(0x87 * (1 - t) + 0x00 * t);
                const gr = Math.round(0xce * (1 - t) + 0xff * t);
                const b = Math.round(0xeb * (1 - t) + 0x88 * t);
                const color = (r << 16) | (gr << 8) | b;
                const segX1 = x1 + (this.headboardWidth * i) / gradientSegments;
                const segX2 =
                    x1 + (this.headboardWidth * (i + 1)) / gradientSegments;
                g.lineStyle(4, color, glowAlpha);
                g.beginPath();
                g.moveTo(segX1, y);
                g.lineTo(segX2, y);
                g.strokePath();
            }
            for (let i = 0; i < gradientSegments; i++) {
                const t = i / (gradientSegments - 1);
                const r = Math.round(0x87 * (1 - t) + 0x00 * t);
                const gr = Math.round(0xce * (1 - t) + 0xff * t);
                const b = Math.round(0xeb * (1 - t) + 0x88 * t);
                const color = (r << 16) | (gr << 8) | b;
                const segX1 = x1 + (this.headboardWidth * i) / gradientSegments;
                const segX2 =
                    x1 + (this.headboardWidth * (i + 1)) / gradientSegments;
                g.lineStyle(1, color, lineAlpha);
                g.beginPath();
                g.moveTo(segX1, y);
                g.lineTo(segX2, y);
                g.strokePath();
            }
        };
        const borderGraphics = this.add.graphics();
        drawGradientLine(borderGraphics, yTop, 0.2, 0.7);
        drawGradientLine(borderGraphics, yBottom, 0.2, 0.7);
        this.headboardContainer.add(borderGraphics);

        // Subtle grid overlay for glassmorphism texture
        this.headboardGrid = this.add.graphics();
        this.headboardGrid.lineStyle(1, this.DARK_TEAL, 0.2);
        const gridStep = 20;
        for (let x = x1 + gridStep; x < x2; x += gridStep) {
            this.headboardGrid.lineBetween(x, yTop, x, yBottom);
        }
        for (let y = panelTop + gridStep; y < yBottom; y += gridStep) {
            this.headboardGrid.lineBetween(x1, y, x2, y);
        }
        this.headboardGrid.fillStyle(0x00ffff, 0.06);
        for (let i = 0; i < 25; i++) {
            const sx = x1 + Math.random() * this.headboardWidth;
            const sy = panelTop + Math.random() * this.HEADBOARD_PANEL_HEIGHT;
            this.headboardGrid.fillCircle(sx, sy, 1);
        }
        this.headboardContainer.add(this.headboardGrid);

        // Prestige/layer text inside headboard middle (centered in main panel)
        const cx = this.headboardLeft + this.headboardWidth / 2;
        this.prestigeText = this.add.text(
            cx,
            panelTop + this.HEADBOARD_PANEL_HEIGHT / 2,
            "PRESTIGE 0 - LAYER 1",
            {
                fontFamily: this.uiScoreFont,
                fontSize: (UI_CONFIG.fontSize.large + 4) * uiScale,
                color: this.uiTextColor,
                stroke: "#000000",
                strokeThickness: 3 * uiScale,
            },
        );
        this.prestigeText.setOrigin(0.5, 0.5);
        this.prestigeText.setAlpha(
            this.uiOpacityMultiplier * (MOBILE_SCALE < 1.0 ? 0.9 : 1),
        );
        this.headboardContainer.add(this.prestigeText);

        // Left block: Score (large blocky) + 5-segment bar directly below
        const scoreY = panelTop + 8;
        this.scoreText = this.add.text(
            this.headboardLeft + leftPad,
            scoreY,
            "SCORE: 0",
            {
                fontFamily: this.uiScoreFont,
                fontSize: 32 * uiScale,
                color: this.uiTextColor,
                stroke: "#000000",
                strokeThickness: 5 * uiScale,
            },
        );
        this.scoreText.setOrigin(0, 0);
        this.scoreText.setAlpha(
            this.scoreText.alpha * this.uiOpacityMultiplier,
        );
        this.headboardContainer.add(this.scoreText);

        this.scoreComboSuperscript = this.add.text(
            this.headboardLeft + leftPad + 180 * uiScale,
            scoreY - 4,
            "",
            {
                fontFamily: this.uiScoreFont,
                fontSize: 16 * uiScale,
                color: "#" + this.YELLOW_ACCENT.toString(16).padStart(6, "0"),
                stroke: "#000000",
                strokeThickness: 2 * uiScale,
            },
        );
        this.scoreComboSuperscript.setOrigin(0, 1);
        this.scoreComboSuperscript.setAlpha(this.uiOpacityMultiplier);
        this.scoreComboSuperscript.setVisible(false);
        this.headboardContainer.add(this.scoreComboSuperscript);

        this.headboardHealthBarX = this.headboardLeft + leftPad;
        this.headboardHealthBarY = scoreY + 28;
        this.livesOrb = this.add.graphics();
        this.healthBarLabel = this.add.text(
            this.headboardHealthBarX - 2,
            this.headboardHealthBarY - 2,
            "5/5",
            {
                fontFamily: UI_CONFIG.menuFont,
                fontSize: (UI_CONFIG.fontSize.small - 1) * uiScale,
                color: UI_CONFIG.neonGreen,
                stroke: "#000000",
                strokeThickness: 2 * uiScale,
            },
        );
        this.healthBarLabel.setAlpha(this.uiOpacityMultiplier);
        this.healthBarLabel.setVisible(false);
        this.headboardContainer.add(this.healthBarLabel);
        this.headboardContainer.add(this.livesOrb);
        this.renderHealthBars(
            5,
            this.headboardHealthBarX,
            this.headboardHealthBarY,
            uiScale,
        );
        this.livesOrb.setAlpha(this.uiOpacityMultiplier);

        // Right: coin icon (like pause button) with amount as superscript at top, then pause button
        const rightEdge = this.headboardLeft + this.headboardWidth - 12;
        const coinButtonSize = 60 * uiScale;
        const coinRadius = coinButtonSize / 2;
        this.headboardCoinBoxX = rightEdge - coinRadius - 12;
        this.headboardCoinBoxY = panelTop + this.HEADBOARD_PANEL_HEIGHT / 2;

        const coinTextureKey = this.textures.exists("coin")
            ? "coin"
            : "powerupCoin";
        const hasCoinIcon = this.textures.exists(coinTextureKey);

        let coinImage: Phaser.GameObjects.Image | null = null;
        if (hasCoinIcon) {
            coinImage = this.add.image(0, 0, coinTextureKey);
            coinImage.setDisplaySize(coinButtonSize, coinButtonSize);
            coinImage.setOrigin(0.5, 0.5);
            coinImage.setAlpha(this.uiOpacityMultiplier);
        }

        this.coinBalanceText = this.add.text(0, -coinRadius * 0.5, "0", {
            fontFamily: this.uiScoreFont,
            fontSize: 30 * uiScale,
            color: "#" + this.YELLOW_ACCENT.toString(16).padStart(6, "0"),
            stroke: "#000000",
            strokeThickness: 2 * uiScale,
        });
        this.coinBalanceText.setOrigin(0.5, 0.5);
        this.coinBalanceText.setAlpha(
            this.uiOpacityMultiplier * (MOBILE_SCALE < 1.0 ? 0.9 : 1),
        );

        const coinChildren: Phaser.GameObjects.GameObject[] = [
            ...(coinImage ? [coinImage] : []),
            this.coinBalanceText,
        ];
        const coinContainer = this.add.container(
            this.headboardCoinBoxX,
            this.headboardCoinBoxY,
            coinChildren,
        );
        this.headboardContainer.add(coinContainer);

        // Mini-me sessions: icon + superscript count (same style as coin)
        const miniMeIconSize = 60 * uiScale;
        const miniMeRadius = miniMeIconSize / 2;
        const miniMeCenterX =
            this.headboardCoinBoxX - this.HEADBOARD_RIGHT_ICON_SPACING;
        const miniMeCenterY = this.headboardCoinBoxY;
        const miniMeChildren: Phaser.GameObjects.GameObject[] = [];
        if (this.textures.exists("miniMeIcon")) {
            const miniMeImg = this.add.image(0, 0, "miniMeIcon");
            miniMeImg.setDisplaySize(miniMeIconSize, miniMeIconSize);
            miniMeImg.setOrigin(0.5, 0.5);
            miniMeImg.setAlpha(this.uiOpacityMultiplier);
            miniMeChildren.push(miniMeImg);
        }
        this.miniMeSessionsText = this.add.text(0, -miniMeRadius * 0.5, "0", {
            fontFamily: this.uiScoreFont,
            fontSize: 30 * uiScale,
            color: "#" + this.YELLOW_ACCENT.toString(16).padStart(6, "0"),
            stroke: "#000000",
            strokeThickness: 2 * uiScale,
        });
        this.miniMeSessionsText.setOrigin(0.5, 0.5);
        this.miniMeSessionsText.setAlpha(
            this.uiOpacityMultiplier * (MOBILE_SCALE < 1.0 ? 0.9 : 1),
        );
        miniMeChildren.push(this.miniMeSessionsText);
        const miniMeContainer = this.add.container(
            miniMeCenterX,
            miniMeCenterY,
            miniMeChildren,
        );
        this.headboardContainer.add(miniMeContainer);
        const initialSessions =
            (this.registry.get("miniMeSessionsRemaining") as number) ?? 0;
        this.miniMeSessionsText.setText(String(initialSessions));

        this.registerUiGlitchTargets([this.scoreText, this.prestigeText]);

        this.tooltipManager.enqueueTooltip(
            {
                id: "game-prestige",
                targetX: cx + 80,
                targetY: panelTop + this.HEADBOARD_PANEL_HEIGHT / 2,
                content:
                    "After completing Layer 6, you can prestige to loop back with increased difficulty and score multipliers. This is how true Sentinels progress!",
                position: "right",
                width: 280,
            },
            4000,
        );
        this.tooltipManager.enqueueTooltip(
            {
                id: "game-health",
                targetX: this.headboardHealthBarX + 80,
                targetY: this.headboardHealthBarY + 6,
                content:
                    "You have 5 health bars. Each enemy collision or bullet hit removes health bars. Collect Life Orbs to restore health. Game over when all health bars are depleted!",
                position: "right",
                width: 280,
            },
            5000,
        );
    }

    update(time: number) {
        if (time - this.lastCoinMiniMeSyncTime > 1500) {
            this.lastCoinMiniMeSyncTime = time;
            const coins = getAvailableCoins();
            if (this.registry.get("coinBalance") !== coins)
                this.registry.set("coinBalance", coins);
            const sessions = getMiniMeSessionsAvailable();
            if (this.registry.get("miniMeSessionsRemaining") !== sessions)
                this.registry.set("miniMeSessionsRemaining", sessions);
        }
        const intensity =
            (this.registry.get("uiGlitchIntensity") as number) || 0;
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
                base.y + Phaser.Math.Between(-jitter, jitter),
            );
            target.setAlpha(
                Phaser.Math.Clamp(base.alpha - intensity * 0.2, 0.4, 1),
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
            0.8,
        );
        overlay.setOrigin(0.5, 0.5);

        // Game Over text - Orbitron for big titles
        this.gameOverText = this.add.text(
            width / 2,
            height / 2 - 100,
            "GAME OVER",
            {
                fontFamily: this.uiLogoFont,
                fontSize: UI_CONFIG.fontSize.xlarge,
                color: this.uiTextColor,
                stroke: "#000000",
                strokeThickness: 6,
            },
        );
        this.gameOverText.setOrigin(0.5, 0.5);

        // Final score - VT323 for score display
        this.finalScoreText = this.add.text(
            width / 2,
            height / 2 - 50,
            "FINAL SCORE: 0",
            {
                fontFamily: this.uiScoreFont,
                fontSize: 28,
                color: this.uiTextColor,
                stroke: "#000000",
                strokeThickness: 4,
            },
        );
        this.finalScoreText.setOrigin(0.5, 0.5);

        // Rank display
        this.rankTextGameOver = this.add.text(
            width / 2,
            height / 2 - 20,
            "RANK: Initiate Sentinel",
            {
                fontFamily: this.uiMenuFont,
                fontSize: 18,
                color: "#00ffff",
                stroke: "#000000",
                strokeThickness: 3,
            },
        );
        this.rankTextGameOver.setOrigin(0.5, 0.5);

        this.prestigeBadgeText = this.add.text(
            width / 2,
            height / 2 - 10,
            "BADGE UNLOCKED: PRESTIGE CHAMPION",
            {
                fontFamily: UI_CONFIG.menuFont,
                fontSize: 18,
                color: "#ff66ff",
                stroke: "#000000",
                strokeThickness: 3,
            },
        );
        this.prestigeBadgeText.setOrigin(0.5, 0.5);
        this.prestigeBadgeText.setVisible(false);

        const feedbackStartY = height / 2 + 10;
        const lineSpacing = MOBILE_SCALE < 1.0 ? 16 : 18;
        const maxWidth = width * 0.85;

        for (let i = 0; i < FAILURE_FEEDBACK.displayMetrics.length; i += 1) {
            const line = this.add.text(
                width / 2,
                feedbackStartY + i * lineSpacing,
                "",
                {
                    fontFamily: UI_CONFIG.bodyFont,
                    fontSize: UI_CONFIG.fontSize.small,
                    color: UI_CONFIG.neonGreen,
                    wordWrap: { width: maxWidth, useAdvancedWrap: true },
                    align: "center",
                },
            );
            line.setOrigin(0.5, 0.5);
            line.setVisible(false);
            this.failureFeedbackLines.push(line);
        }

        const celebrationStartY =
            feedbackStartY +
            FAILURE_FEEDBACK.displayMetrics.length * lineSpacing +
            lineSpacing;
        for (
            let i = 0;
            i < FAILURE_FEEDBACK.celebrationMetrics.length;
            i += 1
        ) {
            const line = this.add.text(
                width / 2,
                celebrationStartY + i * lineSpacing,
                "",
                {
                    fontFamily: UI_CONFIG.menuFont,
                    fontSize: UI_CONFIG.fontSize.small,
                    color: "#00ff99",
                    wordWrap: { width: maxWidth, useAdvancedWrap: true },
                    align: "center",
                },
            );
            line.setOrigin(0.5, 0.5);
            line.setVisible(false);
            this.celebrationLines.push(line);
        }

        const summaryStartY = height / 2 + 20;
        const summaryLineSpacing = MOBILE_SCALE < 1.0 ? 14 : 16;
        const summaryLines = ["SURVIVAL TIME:"];
        this.runSummaryTexts = summaryLines.map((label, index) => {
            const line = this.add.text(
                width / 2,
                summaryStartY + index * summaryLineSpacing,
                `${label} 0`,
                {
                    fontFamily: this.uiBodyFont,
                    fontSize: UI_CONFIG.fontSize.small,
                    color: this.uiTextColor,
                    align: "left",
                },
            );
            line.setOrigin(0.5, 0);
            line.setAlpha(this.uiOpacityMultiplier);
            line.setVisible(false);
            return line;
        });

        const progressStartY =
            summaryStartY + summaryLines.length * summaryLineSpacing + 20;
        this.progressStatementText = this.add.text(
            width / 2,
            progressStartY,
            "",
            {
                fontFamily: this.uiBodyFont,
                fontSize: UI_CONFIG.fontSize.small,
                color: "#00ff99",
                stroke: "#000000",
                strokeThickness: 2,
                align: "center",
                wordWrap: { width: width * 0.8, useAdvancedWrap: true },
            },
        );
        this.progressStatementText.setOrigin(0.5, 0.5);

        // Restart button
        const buttonStartY = progressStartY + 50;
        this.restartButton = this.createButton(
            width / 2,
            buttonStartY,
            "RESTART",
            200,
            50,
            18,
        );
        const restartBg = this.restartButton
            .list[0] as Phaser.GameObjects.Rectangle;
        restartBg.on("pointerdown", () => {
            this.restartGame();
        });

        // Menu button
        this.menuButton = this.createButton(
            width / 2,
            buttonStartY + 65,
            "MENU",
            200,
            50,
            18,
        );
        const menuBg = this.menuButton.list[0] as Phaser.GameObjects.Rectangle;
        menuBg.on("pointerdown", () => {
            if (this.registry.get("inventoryModalOpen")) return;
            const gameScene = this.scene.get("GameScene") as GameScene;
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
        const revivePanel = this.add.rectangle(
            width / 2,
            height / 2,
            380,
            260,
            0x000000,
            0.95,
        );
        revivePanel.setStrokeStyle(3, 0x00ff99);

        // Title at top
        const reviveTitle = this.add.text(
            width / 2,
            height / 2 - 95,
            "REVIVE AVAILABLE",
            {
                fontFamily: this.uiMenuFont,
                fontSize: UI_CONFIG.fontSize.medium,
                color: this.uiTextColor,
                stroke: "#000000",
                strokeThickness: 3,
            },
        );
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
        coinIcon.arc(
            coinX,
            coinY,
            coinRadius - 8,
            Phaser.Math.DegToRad(45),
            Phaser.Math.DegToRad(135),
        );
        coinIcon.strokePath();
        coinIcon.beginPath();
        coinIcon.arc(
            coinX,
            coinY,
            coinRadius - 8,
            Phaser.Math.DegToRad(225),
            Phaser.Math.DegToRad(315),
        );
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
        this.revivePromptCountdownText = this.add.text(
            width / 2,
            height / 2 + 30,
            "10",
            {
                fontFamily: this.uiScoreFont,
                fontSize: 52,
                color: "#00ff99",
                stroke: "#000000",
                strokeThickness: 6,
            },
        );
        this.revivePromptCountdownText.setOrigin(0.5, 0.5);

        // Button at bottom with proper spacing
        this.revivePromptButton = this.createButton(
            width / 2,
            height / 2 + 95,
            "REVIVE (1 COIN)",
            240,
            50,
            18,
        );
        const revivePromptBg = this.revivePromptButton
            .list[0] as Phaser.GameObjects.Rectangle;
        revivePromptBg.on("pointerdown", () => {
            const gameScene = this.scene.get("GameScene") as GameScene;
            if (gameScene && gameScene.tryReviveWithCoin()) {
                this.clearRevivePrompt();
                this.registry.set("gameOver", false);
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
            0.85,
        );
        overlay.setOrigin(0.5, 0.5);

        // Paused text - Orbitron for big titles
        this.pauseText = this.add.text(width / 2, height / 2 - 80, "PAUSED", {
            fontFamily: UI_CONFIG.logoFont,
            fontSize: UI_CONFIG.fontSize.xlarge,
            color: UI_CONFIG.neonGreen,
            stroke: "#000000",
            strokeThickness: 6,
        });
        this.pauseText.setOrigin(0.5, 0.5);

        // Resume button
        this.resumeButton = this.createButton(
            width / 2,
            height / 2 - 10,
            "RESUME",
            180,
            45,
            18,
        );
        const resumeBg = this.resumeButton
            .list[0] as Phaser.GameObjects.Rectangle;
        resumeBg.on("pointerdown", () => {
            const gameScene = this.scene.get("GameScene") as GameScene;
            if (gameScene && gameScene.scene.isActive()) {
                gameScene.togglePause();
            }
        });

        // Menu button
        const pauseMenuButton = this.createButton(
            width / 2,
            height / 2 + 50,
            "MENU",
            180,
            45,
            18,
        );
        const pauseMenuBg = pauseMenuButton
            .list[0] as Phaser.GameObjects.Rectangle;
        pauseMenuBg.on("pointerdown", () => {
            if (this.registry.get("inventoryModalOpen")) return;
            const gameScene = this.scene.get("GameScene") as GameScene;
            if (gameScene) {
                gameScene.returnToMenu();
            }
        });

        // Settings button
        const settingsButton = this.createButton(
            width / 2,
            height / 2 + 110,
            "SETTINGS",
            180,
            45,
            18,
        );
        const settingsBg = settingsButton
            .list[0] as Phaser.GameObjects.Rectangle;
        settingsBg.on("pointerdown", () => {
            this.toggleSettings();
        });

        // Current rank display in pause menu
        const rankTitle = this.add.text(
            width / 2,
            height / 2 + 320,
            "CURRENT RANK",
            {
                fontFamily: UI_CONFIG.menuFont,
                fontSize: UI_CONFIG.fontSize.small,
                color: UI_CONFIG.neonGreen,
                stroke: "#000000",
                strokeThickness: 2,
            },
        );
        rankTitle.setOrigin(0.5, 0.5);

        this.currentRankPauseText = this.add.text(
            width / 2,
            height / 2 + 345,
            "",
            {
                fontFamily: UI_CONFIG.menuFont,
                fontSize: UI_CONFIG.fontSize.small,
                color: "#00ffff",
                stroke: "#000000",
                strokeThickness: 2,
            },
        );
        this.currentRankPauseText.setOrigin(0.5, 0.5);

        // Update rank display when it changes
        this.registry.events.on("changedata-currentRank", () => {
            const rank =
                (this.registry.get("currentRank") as string) ||
                "Initiate Sentinel";
            this.currentRankPauseText.setText(rank);
        });

        const achievementsTitle = this.add.text(
            width / 2,
            height / 2 + 370,
            "ACHIEVEMENTS",
            {
                fontFamily: UI_CONFIG.menuFont,
                fontSize: UI_CONFIG.fontSize.small,
                color: UI_CONFIG.neonGreen,
                stroke: "#000000",
                strokeThickness: 2,
            },
        );
        achievementsTitle.setOrigin(0.5, 0.5);

        this.achievementTexts = [];
        for (let i = 0; i < 4; i += 1) {
            const line = this.add.text(
                width / 2,
                height / 2 + 395 + i * 18,
                "",
                {
                    fontFamily: UI_CONFIG.bodyFont,
                    fontSize: UI_CONFIG.fontSize.small,
                    color: UI_CONFIG.neonGreen,
                    stroke: "#000000",
                    strokeThickness: 1,
                },
            );
            line.setOrigin(0.5, 0.5);
            this.achievementTexts.push(line);
        }

        // Inventory button (for pause menu) - opens inventory modal (separate row from Settings)
        const pauseInventoryButton = this.createButton(
            width / 2,
            height / 2 + 170,
            "INVENTORY",
            180,
            45,
            18,
        );
        const pauseInventoryBg = pauseInventoryButton
            .list[0] as Phaser.GameObjects.Rectangle;
        pauseInventoryBg.on("pointerdown", () => {
            // Emit on game's global events so GamePage receives it (works regardless of scene startup order)
            this.game.events.emit("open-inventory");
        });

        // Coin balance display in pause menu
        const pauseCoinText = this.add.text(width / 2, height / 2 + 230, "", {
            fontFamily: this.uiMenuFont,
            fontSize: UI_CONFIG.fontSize.small,
            color: this.uiTextColor,
            stroke: "#000000",
            strokeThickness: 2,
        });
        pauseCoinText.setOrigin(0.5, 0.5);

        // Active mini-mes display in pause menu
        const pauseMiniMeText = this.add.text(width / 2, height / 2 + 260, "", {
            fontFamily: this.uiMenuFont,
            fontSize: UI_CONFIG.fontSize.small,
            color: this.uiTextColor,
            stroke: "#000000",
            strokeThickness: 2,
        });
        pauseMiniMeText.setOrigin(0.5, 0.5);

        // Current avatar stats display in pause menu
        const pauseAvatarText = this.add.text(width / 2, height / 2 + 290, "", {
            fontFamily: this.uiMenuFont,
            fontSize: UI_CONFIG.fontSize.small,
            color: this.uiTextColor,
            stroke: "#000000",
            strokeThickness: 2,
        });
        pauseAvatarText.setOrigin(0.5, 0.5);

        // Create container and hide it initially
        // Store references for updating pause menu stats
        (this as any).pauseCoinText = pauseCoinText;
        (this as any).pauseMiniMeText = pauseMiniMeText;
        (this as any).pauseAvatarText = pauseAvatarText;

        this.pauseContainer = this.add.container(0, 0, [
            overlay,
            this.pauseText,
            this.resumeButton,
            pauseMenuButton,
            settingsButton,
            pauseInventoryButton,
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
            0.95,
        );
        panelBg.setStrokeStyle(2, 0x00ff00);

        const title = this.add.text(panelX, panelY - 60 * uiScale, "SETTINGS", {
            fontFamily: UI_CONFIG.menuFont,
            fontSize: UI_CONFIG.fontSize.medium * uiScale,
            color: UI_CONFIG.neonGreen,
            stroke: "#000000",
            strokeThickness: 3,
        });
        title.setOrigin(0.5, 0.5);

        const label = this.add.text(
            panelX,
            panelY - 15 * uiScale,
            "JOYSTICK SENSITIVITY",
            {
                fontFamily: UI_CONFIG.menuFont,
                fontSize: UI_CONFIG.fontSize.small * uiScale,
                color: UI_CONFIG.neonGreen,
                stroke: "#000000",
                strokeThickness: 2,
            },
        );
        label.setOrigin(0.5, 0.5);

        const initialSensitivity =
            (this.registry.get("joystickSensitivity") as number) || 1;
        this.sensitivityValueText = this.add.text(
            panelX,
            panelY + 20 * uiScale,
            `${initialSensitivity.toFixed(1)}x`,
            {
                fontFamily: UI_CONFIG.scoreFont,
                fontSize: UI_CONFIG.fontSize.medium * uiScale,
                color: UI_CONFIG.neonGreen,
                stroke: "#000000",
                strokeThickness: 3,
            },
        );
        this.sensitivityValueText.setOrigin(0.5, 0.5);

        const minusButton = this.createButton(
            panelX - 70 * uiScale,
            panelY + 70 * uiScale,
            "-",
            50,
            40,
            20,
        );
        const plusButton = this.createButton(
            panelX + 70 * uiScale,
            panelY + 70 * uiScale,
            "+",
            50,
            40,
            20,
        );

        const minusBg = minusButton.list[0] as Phaser.GameObjects.Rectangle;
        const plusBg = plusButton.list[0] as Phaser.GameObjects.Rectangle;
        minusBg.on("pointerdown", () => this.adjustSensitivity(-0.1));
        plusBg.on("pointerdown", () => this.adjustSensitivity(0.1));

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
        const current =
            (this.registry.get("joystickSensitivity") as number) || 1;
        const next = Phaser.Math.Clamp(
            Number((current + delta).toFixed(2)),
            0.5,
            2,
        );
        this.registry.set("joystickSensitivity", next);
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
            0.95,
        );
        panelBg.setStrokeStyle(2, 0x00ff00);

        // Title - Oxanium for menu headings
        const title = this.add.text(
            panelX,
            panelY - panelSize / 2 + 40 * uiScale,
            "WEEKLY LEADERBOARD",
            {
                fontFamily: UI_CONFIG.menuFont,
                fontSize: UI_CONFIG.fontSize.small * uiScale,
                color: UI_CONFIG.neonGreen,
                stroke: "#000000",
                strokeThickness: 4,
            },
        );
        title.setOrigin(0.5, 0.5);

        // Close button (X) - positioned at top-left of panel
        const closeButtonSize = 30 * uiScale;
        const closeButtonX = panelX - panelSize / 2 + panelPadding;
        const closeButtonY = panelY - panelSize / 2 + panelPadding;

        // Create container first, then add elements relative to (0, 0)
        const closeButton = this.add.container(closeButtonX, closeButtonY);

        const closeButtonBg = this.add.circle(
            0,
            0, // Position relative to container
            closeButtonSize / 2,
            0x000000,
            0.9,
        );
        closeButtonBg.setStrokeStyle(2, 0x00ff00);
        closeButtonBg.setInteractive({ useHandCursor: true });

        // X icon as text (more reliable positioning)
        const xText = this.add.text(
            0,
            0, // Position relative to container
            "×",
            {
                fontFamily: "Arial",
                fontSize: closeButtonSize * 0.7 + "px",
                color: "#00ff00",
                stroke: "#000000",
                strokeThickness: 2,
            },
        );
        xText.setOrigin(0.5, 0.5);

        closeButton.add([closeButtonBg, xText]);

        // Hover effects
        closeButtonBg.on("pointerover", () => {
            closeButtonBg.setFillStyle(0x001100, 0.95);
            closeButtonBg.setStrokeStyle(3, 0x00ff00);
            xText.setColor("#00ff00");
        });

        closeButtonBg.on("pointerout", () => {
            closeButtonBg.setFillStyle(0x000000, 0.9);
            closeButtonBg.setStrokeStyle(2, 0x00ff00);
            xText.setColor("#00ff00");
        });

        // Click handler to close leaderboard
        closeButtonBg.on("pointerdown", () => {
            this.hideLeaderboard();
        });

        // Also make the text clickable
        xText.setInteractive({ useHandCursor: true });
        xText.on("pointerdown", () => {
            this.hideLeaderboard();
        });

        // Leaderboard entries will be created dynamically
        this.leaderboardPanel = this.add.container(0, 0, [
            panelBg,
            title,
            closeButton,
        ]);
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
        fontSize: number = 18,
    ): Phaser.GameObjects.Container {
        const uiScale = MOBILE_SCALE < 1.0 ? 0.8 : 1.0;
        const scaledWidth = width * uiScale;
        const scaledHeight = height * uiScale;
        const scaledFontSize = fontSize * uiScale;

        // Button background
        const bg = this.add.rectangle(
            0,
            0,
            scaledWidth,
            scaledHeight,
            0x000000,
            0.9,
        );
        bg.setStrokeStyle(2, 0x00ff00);

        // Button text
        const buttonText = this.add.text(0, 0, text, {
            fontFamily: UI_CONFIG.menuFont,
            fontSize: scaledFontSize,
            color: UI_CONFIG.neonGreen,
            stroke: "#000000",
            strokeThickness: 2,
        });
        buttonText.setOrigin(0.5, 0.5);

        // Create container
        const button = this.add.container(x, y, [bg, buttonText]);

        // Make interactive
        bg.setInteractive({ useHandCursor: true });

        // Hover effects
        bg.on("pointerover", () => {
            bg.setFillStyle(0x001100, 0.95);
            bg.setStrokeStyle(3, 0x00ff00);
        });

        bg.on("pointerout", () => {
            bg.setFillStyle(0x000000, 0.9);
            bg.setStrokeStyle(2, 0x00ff00);
        });

        return button;
    }

    // Create pause button (optionally at headboard position)
    private createPauseButton(x?: number, y?: number, uiScale?: number) {
        const scale = uiScale ?? (MOBILE_SCALE < 1.0 ? 0.7 : 1.0);
        const width = this.scale.width;
        const buttonSize = 44 * scale;

        const bg = this.add.circle(0, 0, buttonSize / 2, 0x001a33, 0.95);
        bg.setStrokeStyle(2, this.NEON_CYAN);

        const bar1 = this.add.rectangle(
            -6 * scale,
            0,
            5 * scale,
            18 * scale,
            this.NEON_GREEN,
        );
        const bar2 = this.add.rectangle(
            6 * scale,
            0,
            5 * scale,
            18 * scale,
            this.NEON_GREEN,
        );

        const posX = x ?? width - 40 * scale;
        const posY = y ?? 40 * scale;
        this.pauseButton = this.add.container(posX, posY, [bg, bar1, bar2]);
        this.pauseButton.setVisible(true);
        this.pauseButton.setDepth(110);
        if (this.headboardContainer) {
            this.headboardContainer.add(this.pauseButton);
        }

        // Show tooltip for pause button (first time only)
        this.time.delayedCall(8000, () => {
            this.tooltipManager.enqueueTooltip({
                id: "game-pause",
                targetX: posX,
                targetY: posY,
                content:
                    "Click this button or press ESC to pause the game. From the pause menu, you can access settings, leaderboard, and more!",
                position: "left",
                width: 280,
            });
        });

        bg.setInteractive({ useHandCursor: true });
        bg.on("pointerover", () => {
            bg.setFillStyle(0x003355, 0.95);
            bg.setStrokeStyle(3, this.NEON_CYAN);
        });
        bg.on("pointerout", () => {
            bg.setFillStyle(0x001a33, 0.95);
            bg.setStrokeStyle(2, this.NEON_CYAN);
        });

        // Click handler
        bg.on("pointerdown", () => {
            const gameOver = this.registry.get("gameOver");
            if (!gameOver) {
                const gameScene = this.scene.get("GameScene") as GameScene;
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
        if (this.comboText)
            this.comboText.setText(`COMBO: ${value.toFixed(1)}x`);
        if (this.scoreComboSuperscript) {
            const show = value > 1;
            this.scoreComboSuperscript.setVisible(show);
            if (show)
                this.scoreComboSuperscript.setText(`x${value.toFixed(1)}`);
        }
    }

    private updateLayer(_parent: Phaser.Data.DataManager, layerName: string) {
        if (this.layerText) this.layerText.setText(`LAYER: ${layerName}`);
    }

    private updatePrestige(_parent: Phaser.Data.DataManager, value: number) {
        const currentLayer = (this.registry.get("currentLayer") as number) || 1;
        this.prestigeText.setText(`PRESTIGE ${value} - LAYER ${currentLayer}`);

        // Color-code based on prestige level
        const prestigeColors: Record<number, string> = {
            0: "#00ff00", // Green
            1: "#00ff00", // Green
            2: "#00aaff", // Blue
            3: "#00aaff", // Blue
            4: "#aa00ff", // Purple
            5: "#aa00ff", // Purple
            6: "#ff00ff", // Magenta
            7: "#ff00ff", // Magenta
            8: "#ffff00", // Yellow/Gold for Prime Sentinel
        };
        const color = prestigeColors[value] || "#00ff00";
        this.prestigeText.setColor(color);

        this.updateBulletTier(_parent, value);
    }

    private updateCoinBalance(_parent: Phaser.Data.DataManager, value: number) {
        this.coinBalanceText.setText(String(value));
    }

    private updateBulletTier(
        _parent: Phaser.Data.DataManager,
        prestige: number,
    ) {
        const tierProgress = getTierProgress(prestige);

        let tierText = `BULLET TIER: ${tierProgress.currentTier}/${tierProgress.maxTier}`;
        if (tierProgress.nextTier) {
            tierText += ` (Next: P${tierProgress.nextTier.unlockPrestige})`;
        }

        if (this.bulletTierText) this.bulletTierText.setText(tierText);
    }

    private updateRank(_parent: Phaser.Data.DataManager, rankName: string) {
        if (this.rankText) this.rankText.setText(`NAME: ${rankName}`);
    }

    private updateMiniMeSessions(
        _parent: Phaser.Data.DataManager,
        sessions: number,
    ) {
        if (this.miniMeCountText)
            this.miniMeCountText.setText(`SESSION: ${sessions}`);
        if (this.miniMeSessionsText)
            this.miniMeSessionsText.setText(String(sessions));
    }

    private updatePrestigeLayer(
        _parent: Phaser.Data.DataManager,
        _layer: number,
    ) {
        const prestige = (this.registry.get("prestigeLevel") as number) || 0;
        this.updatePrestige(_parent, prestige);
    }

    // @ts-ignore - Reserved for future use
    private createRunStatsDisplay(
        baseX: number,
        startY: number,
        uiScale: number,
    ) {
        const labels = ["TIME", "ENEMIES", "ACCURACY", "DODGES", "SHOTS"];
        this.runStatsTexts = labels.map((label, index) => {
            const line = this.add.text(
                baseX,
                startY + index * 16 * uiScale,
                `${label}: 0`,
                {
                    fontFamily: this.uiBodyFont,
                    fontSize: 12 * uiScale,
                    color: this.uiTextColor,
                    stroke: "#000000",
                    strokeThickness: 2 * uiScale,
                },
            );
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
        },
    ) {
        if (!stats || this.runStatsTexts.length === 0) {
            return;
        }
        const minutes = Math.floor((stats.survivalTimeMs ?? 0) / 60000);
        const seconds = Math.floor(
            ((stats.survivalTimeMs ?? 0) % 60000) / 1000,
        );
        const accuracyPct = Math.round((stats.accuracy ?? 0) * 100);
        const lines = [
            `TIME: ${minutes}m ${seconds}s`,
            `ENEMIES: ${(stats.enemiesDefeated ?? 0).toLocaleString()}`,
            `ACCURACY: ${accuracyPct}%`,
            `DODGES: ${(stats.bulletsDodged ?? 0).toLocaleString()}`,
            `SHOTS: ${(stats.shotsFired ?? 0).toLocaleString()}`,
        ];
        this.runStatsTexts.forEach((text, index) => {
            text.setText(lines[index] || "");
        });
    }

    private createShockBombMeter() {
        const uiScale = this.headboardUiScale;
        const iconSize = 44 * uiScale;
        this.shockBombRadius = iconSize / 2 + 2;
        const centerX =
            this.headboardCoinBoxX - 3 * this.HEADBOARD_RIGHT_ICON_SPACING;
        const centerY = this.headboardTop + this.HEADBOARD_PANEL_HEIGHT / 2;

        const shockIconKey = this.textures.exists("powerupBomb")
            ? "powerupBomb"
            : this.textures.exists("shockwaveIcon")
              ? "shockwaveIcon"
              : null;
        const children: Phaser.GameObjects.GameObject[] = [];

        this.shockBombBorderRing = this.add.graphics();
        children.push(this.shockBombBorderRing);

        this.shockBombGlow = this.add.graphics();
        this.shockBombGlow.setVisible(false);
        children.push(this.shockBombGlow);

        if (MOBILE_SCALE >= 1.0) {
            this.shockBombKeyText = this.add.text(
                0,
                -this.shockBombRadius - 14 * uiScale,
                "",
                {
                    fontFamily: UI_CONFIG.menuFont,
                    fontSize: 14 * uiScale,
                    color: "#ffcc00",
                    stroke: "#000000",
                    strokeThickness: 2,
                },
            );
            this.shockBombKeyText.setOrigin(0.5, 0.5);
            this.shockBombKeyText.setVisible(false);
            children.push(this.shockBombKeyText);
        }

        if (shockIconKey) {
            const icon = this.add.image(0, 0, shockIconKey);
            icon.setDisplaySize(iconSize, iconSize);
            icon.setOrigin(0.5, 0.5);
            icon.setAlpha(this.uiOpacityMultiplier);
            children.push(icon);
        }

        this.shockBombMeterContainer = this.add.container(
            centerX,
            centerY,
            children,
        );
        this.headboardContainer.add(this.shockBombMeterContainer);
        this.drawMeterBorderRing(
            this.shockBombBorderRing,
            this.shockBombRadius,
            uiScale,
            0,
        );

        if (MOBILE_SCALE < 1.0) {
            const hitArea = this.add.rectangle(
                0,
                0,
                iconSize + 12,
                iconSize + 12,
                0x000000,
                0,
            );
            hitArea.setInteractive({ useHandCursor: true });
            hitArea.on("pointerdown", () => {
                const gameScene = this.scene.get("GameScene") as GameScene;
                if (gameScene) gameScene.tryActivateShockBomb();
            });
            this.shockBombMeterContainer.add(hitArea);
        }
    }

    private createGodModeMeter() {
        const uiScale = this.headboardUiScale;
        const iconSize = 44 * uiScale;
        this.godModeRadius = iconSize / 2 + 2;
        const centerX =
            this.headboardCoinBoxX - 4 * this.HEADBOARD_RIGHT_ICON_SPACING;
        const centerY = this.headboardTop + this.HEADBOARD_PANEL_HEIGHT / 2;

        const godIconKey = this.textures.exists("powerupMiniMe")
            ? "powerupMiniMe"
            : this.textures.exists("godModeIcon")
              ? "godModeIcon"
              : null;
        const children: Phaser.GameObjects.GameObject[] = [];

        this.godModeBorderRing = this.add.graphics();
        children.push(this.godModeBorderRing);

        this.godModeGlow = this.add.graphics();
        this.godModeGlow.setVisible(false);
        children.push(this.godModeGlow);

        if (MOBILE_SCALE >= 1.0) {
            this.godModeKeyText = this.add.text(
                0,
                -this.godModeRadius - 14 * uiScale,
                "",
                {
                    fontFamily: UI_CONFIG.menuFont,
                    fontSize: 14 * uiScale,
                    color: "#ffcc00",
                    stroke: "#000000",
                    strokeThickness: 2,
                },
            );
            this.godModeKeyText.setOrigin(0.5, 0.5);
            this.godModeKeyText.setVisible(false);
            children.push(this.godModeKeyText);
        }

        if (godIconKey) {
            const icon = this.add.image(0, 0, godIconKey);
            icon.setDisplaySize(iconSize, iconSize);
            icon.setOrigin(0.5, 0.5);
            icon.setAlpha(this.uiOpacityMultiplier);
            children.push(icon);
        }

        this.godModeMeterContainer = this.add.container(
            centerX,
            centerY,
            children,
        );
        this.headboardContainer.add(this.godModeMeterContainer);
        this.drawMeterBorderRing(
            this.godModeBorderRing,
            this.godModeRadius,
            uiScale,
            0,
        );

        if (MOBILE_SCALE < 1.0) {
            const hitArea = this.add.rectangle(
                0,
                0,
                iconSize + 12,
                iconSize + 12,
                0x000000,
                0,
            );
            hitArea.setInteractive({ useHandCursor: true });
            hitArea.on("pointerdown", () => {
                const gameScene = this.scene.get("GameScene") as GameScene;
                if (gameScene) gameScene.tryActivateGodMode();
            });
            this.godModeMeterContainer.add(hitArea);
        }
    }

    /** Draw circular border: black base + yellow arc for progress (0–1). Top = start, clockwise. */
    private drawMeterBorderRing(
        g: Phaser.GameObjects.Graphics,
        radius: number,
        uiScale: number,
        progress: number,
    ) {
        g.clear();
        const lineW = 2 * uiScale;
        g.lineStyle(lineW, 0x1a1a1a, 1);
        g.strokeCircle(0, 0, radius);
        if (progress > 0.001) {
            const startAngle = -Math.PI / 2;
            const endAngle =
                startAngle + 2 * Math.PI * Phaser.Math.Clamp(progress, 0, 1);
            g.lineStyle(lineW, this.YELLOW_ACCENT, 0.9);
            g.beginPath();
            g.arc(0, 0, radius, startAngle, endAngle, false);
            g.strokePath();
        }
    }

    /** Draw yellow glow ring around meter when ready. */
    private drawMeterGlow(
        g: Phaser.GameObjects.Graphics,
        radius: number,
        uiScale: number,
    ) {
        g.clear();
        g.lineStyle(3 * uiScale, this.YELLOW_ACCENT, 0.7);
        g.strokeCircle(0, 0, radius + 4);
    }

    private createChallengeDisplay() {
        const width = this.scale.width;
        const uiScale = MOBILE_SCALE < 1.0 ? 0.7 : 1.0;
        const containerY = 70 * uiScale;
        const barWidth = 260 * uiScale;
        const barHeight = 10 * uiScale;
        const barX = width / 2 - barWidth / 2;
        const barY = containerY + 32 * uiScale;

        this.challengeTitleText = this.add.text(width / 2, containerY, "", {
            fontFamily: UI_CONFIG.menuFont,
            fontSize: 16 * uiScale,
            color: "#00ffff",
            stroke: "#000000",
            strokeThickness: 3,
        });
        this.challengeTitleText.setOrigin(0.5, 0.5);

        this.challengeDescriptionText = this.add.text(
            width / 2,
            containerY + 18 * uiScale,
            "",
            {
                fontFamily: UI_CONFIG.bodyFont,
                fontSize: 12 * uiScale,
                color: UI_CONFIG.neonGreen,
                stroke: "#000000",
                strokeThickness: 2,
            },
        );
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
        const uiScale = this.headboardUiScale;
        const progress = Phaser.Math.Clamp(value, 0, 1);
        if (this.shockBombBorderRing) {
            this.drawMeterBorderRing(
                this.shockBombBorderRing,
                this.shockBombRadius,
                uiScale,
                progress,
            );
        }
    }

    private updateShockBombReady(
        _parent: Phaser.Data.DataManager,
        ready: boolean,
    ) {
        if (!this.shockBombGlow) return;
        const uiScale = this.headboardUiScale;
        this.shockBombGlow.setVisible(ready);
        if (ready) {
            this.drawMeterGlow(
                this.shockBombGlow,
                this.shockBombRadius,
                uiScale,
            );
            this.tweens.add({
                targets: this.shockBombGlow,
                alpha: { from: 0.4, to: 0.9 },
                duration: 500,
                yoyo: true,
                repeat: -1,
            });
        }
        if (MOBILE_SCALE >= 1.0 && this.shockBombKeyText) {
            this.shockBombKeyText.setVisible(ready);
            if (ready) this.shockBombKeyText.setText("B");
        }
    }

    private updateGodMode(_parent: Phaser.Data.DataManager, value: number) {
        const uiScale = this.headboardUiScale;
        const progress = Phaser.Math.Clamp(value, 0, 1);
        if (this.godModeBorderRing) {
            this.drawMeterBorderRing(
                this.godModeBorderRing,
                this.godModeRadius,
                uiScale,
                progress,
            );
        }
    }

    private updateGodModeReady(
        _parent: Phaser.Data.DataManager,
        ready: boolean,
    ) {
        if (!this.godModeGlow) return;
        const uiScale = this.headboardUiScale;
        this.godModeGlow.setVisible(ready);
        if (ready) {
            this.drawMeterGlow(this.godModeGlow, this.godModeRadius, uiScale);
            this.tweens.add({
                targets: this.godModeGlow,
                alpha: { from: 0.4, to: 0.9 },
                duration: 500,
                yoyo: true,
                repeat: -1,
            });
        }
        if (MOBILE_SCALE >= 1.0 && this.godModeKeyText) {
            this.godModeKeyText.setVisible(ready);
            if (ready) this.godModeKeyText.setText("Q");
        }
    }

    private updateGodModeActive(
        _parent: Phaser.Data.DataManager,
        active: boolean,
    ) {
        if (active && this.godModeMeterContainer) {
            this.tweens.add({
                targets: this.godModeMeterContainer,
                alpha: { from: 1, to: 0.6 },
                duration: 200,
                yoyo: true,
                repeat: 5,
            });
        }
    }

    private updateChallengeActive(
        _parent: Phaser.Data.DataManager,
        value: boolean,
    ) {
        this.challengeContainer.setVisible(!!value);
    }

    private updateChallengeTitle(
        _parent: Phaser.Data.DataManager,
        value: string,
    ) {
        this.challengeTitleText.setText(value || "");
    }

    private updateChallengeDescription(
        _parent: Phaser.Data.DataManager,
        value: string,
    ) {
        this.challengeDescriptionText.setText(value || "");
    }

    private updateChallengeProgress(
        _parent: Phaser.Data.DataManager,
        value: number,
    ) {
        const width = this.scale.width;
        const uiScale = MOBILE_SCALE < 1.0 ? 0.7 : 1.0;
        const barWidth = 260 * uiScale;
        const barHeight = 10 * uiScale;
        const barX = width / 2 - barWidth / 2;
        const barY = 70 * uiScale + 32 * uiScale;
        const clamped = Phaser.Math.Clamp(value ?? 0, 0, 1);
        this.challengeBarFill.clear();
        this.challengeBarFill.fillStyle(0x00ffff, clamped > 0 ? 0.9 : 0.2);
        this.challengeBarFill.fillRect(
            barX,
            barY,
            barWidth * clamped,
            barHeight,
        );
    }

    private updateHealthBars(_parent: Phaser.Data.DataManager, value: number) {
        this.renderHealthBars(
            value,
            this.headboardHealthBarX,
            this.headboardHealthBarY,
            this.headboardUiScale,
        );
    }

    private renderHealthBars(
        healthBars: number,
        x: number,
        y: number,
        uiScale: number,
    ) {
        const maxBars = 5;
        const clampedBars = Math.max(0, Math.min(healthBars, maxBars));
        const barTotalWidth = 140 * uiScale;
        const barHeight = 10 * uiScale;
        const segmentGap = 2 * uiScale;
        const segmentWidth =
            (barTotalWidth - (maxBars - 1) * segmentGap) / maxBars;
        const startY = y + 14 * uiScale;

        this.livesOrb.clear();

        if (this.healthBarLabel) {
            this.healthBarLabel.setText(`${clampedBars}/5`);
        }

        // Single horizontal bar: outline (cyan tint) then 5 segments
        this.livesOrb.lineStyle(1.5 * uiScale, this.NEON_CYAN, 0.5);
        this.livesOrb.strokeRoundedRect(x, startY, barTotalWidth, barHeight, 3);
        this.livesOrb.fillStyle(0x0a1520, 0.8);
        this.livesOrb.fillRoundedRect(x, startY, barTotalWidth, barHeight, 3);

        for (let i = 0; i < maxBars; i += 1) {
            const segX = x + i * (segmentWidth + segmentGap);
            const isFilled = i < clampedBars;
            let color = 0x00ff00;
            if (clampedBars === 1) color = 0xff0000;
            else if (clampedBars <= 2) color = 0xff6600;
            if (isFilled) {
                this.livesOrb.fillStyle(color, 1);
                this.livesOrb.fillRoundedRect(
                    segX + 1,
                    startY + 1,
                    segmentWidth - 1,
                    barHeight - 2,
                    2,
                );
            }
        }

        if (clampedBars === 1) {
            this.tweens.add({
                targets: [this.livesOrb, this.healthBarLabel],
                alpha: { from: 1, to: 0.5 },
                duration: 500,
                yoyo: true,
                repeat: -1,
            });
        } else {
            this.livesOrb.setAlpha(this.uiOpacityMultiplier);
            if (this.healthBarLabel) {
                this.healthBarLabel.setAlpha(this.uiOpacityMultiplier);
            }
        }
    }

    private onGameOver(_parent: Phaser.Data.DataManager, value: boolean) {
        if (value) {
            const finalScore = this.registry.get("finalScore") || 0;
            this.finalScoreText.setText(
                `FINAL SCORE: ${finalScore.toLocaleString()}`,
            );

            // Display current rank
            const currentRank =
                (this.registry.get("currentRank") as string) ||
                "Initiate Sentinel";
            this.rankTextGameOver.setText(`RANK: ${currentRank}`);
            this.rankTextGameOver.setVisible(true);

            const prestigeChampion = !!this.registry.get("prestigeChampion");
            this.prestigeBadgeText.setVisible(prestigeChampion);

            // Import coin service and calculate revive cost
            import("../../services/coinService").then(
                ({ getAvailableCoins, getReviveCost }) => {
                    const coins = getAvailableCoins();
                    const reviveCount =
                        (this.registry.get("reviveCount") as number) || 0;
                    const reviveCost = getReviveCost(reviveCount);
                    this.registry.set("coinBalance", coins);
                    this.updateRunSummary(finalScore);
                    this.updateProgressStatement(finalScore);
                    this.runSummaryTexts.forEach((line) =>
                        line.setVisible(true),
                    );
                    this.gameOverContainer.setVisible(true);
                    this.pauseContainer.setVisible(false);
                    this.pauseButton.setVisible(false); // Hide pause button when game over
                    this.settingsContainer.setVisible(false);
                    this.settingsVisible = false;
                    this.showRevivePrompt(coins, reviveCost);
                },
            );
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

    private updateRunSummary(finalScore: number) {
        const stats =
            (this.registry.get("runStats") as {
                survivalTimeMs?: number;
                enemiesDefeated?: number;
            }) || {};
        const minutes = Math.floor((stats.survivalTimeMs ?? 0) / 60000);
        const seconds = Math.floor(
            ((stats.survivalTimeMs ?? 0) % 60000) / 1000,
        );
        const currentPrestige =
            (this.registry.get("currentPrestige") as number) || 0;
        const currentLayer = (this.registry.get("currentLayer") as number) || 1;

        // Calculate coin rewards earned
        import("../../services/coinService").then(({ getPrestigeReward }) => {
            const prestigeReward = getPrestigeReward(currentPrestige);

            const lines = [
                `SURVIVAL TIME: ${minutes}m ${seconds}s`,
                `PRESTIGE/LAYER: P${currentPrestige} - L${currentLayer}`,
                `ENEMIES DEFEATED: ${(stats.enemiesDefeated || 0).toLocaleString()}`,
                `COIN REWARDS: ${prestigeReward} coins`,
                `FINAL SCORE: ${finalScore.toLocaleString()}`,
            ];

            this.runSummaryTexts.forEach((text, index) => {
                if (lines[index]) {
                    text.setText(lines[index]);
                    text.setOrigin(0.5, 0);
                } else {
                    text.setText("");
                }
            });
        });
    }

    // @ts-ignore - Reserved for future use
    private _updateFailureFeedback(finalScore: number) {
        const runMetrics = this.registry.get("runMetrics") as {
            peakComboMultiplier?: number;
            maxCorruptionReached?: number;
            totalEnemiesDefeated?: number;
        } | null;
        const personalBests = getPersonalBests();
        const weeklyScores = fetchWeeklyLeaderboard();
        const topScore = weeklyScores[0]?.score ?? 0;
        const tenthScore = weeklyScores[9]?.score;

        const lines: Array<{ text: string; color: string }> = [];
        const celebrations: string[] = [];

        const milestone = FAILURE_FEEDBACK.scoreMilestones.find(
            (entry) => entry > finalScore,
        );
        if (milestone) {
            const diff = milestone - finalScore;
            lines.push({
                text: `You were ${diff.toLocaleString()} points away from the ${milestone.toLocaleString()} milestone!`,
                color: "#ff5555",
            });
        }

        const nextLayerEntry = Object.values(LAYER_CONFIG).find(
            (layer) => layer.scoreThreshold > finalScore,
        );
        if (nextLayerEntry) {
            const diff = nextLayerEntry.scoreThreshold - finalScore;
            lines.push({
                text: `Just ${diff.toLocaleString()} points to reach ${nextLayerEntry.name}!`,
                color: "#ffd166",
            });
        }

        if (
            runMetrics?.peakComboMultiplier !== undefined &&
            personalBests.bestComboMultiplier > 0 &&
            runMetrics.peakComboMultiplier < personalBests.bestComboMultiplier
        ) {
            lines.push({
                text: `Your best combo is ${personalBests.bestComboMultiplier.toFixed(
                    1,
                )}x - you hit ${runMetrics.peakComboMultiplier.toFixed(1)}x this run!`,
                color: "#66aaff",
            });
        }

        if (tenthScore && finalScore < tenthScore) {
            const diff = tenthScore - finalScore;
            lines.push({
                text: `You're ${diff.toLocaleString()} points behind #10 on the leaderboard!`,
                color: "#c77dff",
            });
        }

        if (runMetrics?.maxCorruptionReached !== undefined) {
            const corruption = runMetrics.maxCorruptionReached;
            let currentMultiplier: number =
                CORRUPTION_SYSTEM.scoreMultiplier.low;
            if (corruption >= 75) {
                currentMultiplier = CORRUPTION_SYSTEM.scoreMultiplier.critical;
            } else if (corruption >= 50) {
                currentMultiplier = CORRUPTION_SYSTEM.scoreMultiplier.high;
            } else if (corruption >= 25) {
                currentMultiplier = CORRUPTION_SYSTEM.scoreMultiplier.medium;
            }

            if (
                currentMultiplier < CORRUPTION_SYSTEM.scoreMultiplier.critical
            ) {
                lines.push({
                    text: `Higher corruption = ${CORRUPTION_SYSTEM.scoreMultiplier.critical}x score (you peaked at ${currentMultiplier}x).`,
                    color: "#ff9f1c",
                });
            }
        }

        if (finalScore >= topScore && finalScore > 0) {
            celebrations.push("Best run this week!");
        }

        if (
            runMetrics?.totalEnemiesDefeated !== undefined &&
            runMetrics.totalEnemiesDefeated > personalBests.bestEnemiesDefeated
        ) {
            celebrations.push("New personal best enemy kills!");
        }

        if (
            runMetrics?.maxCorruptionReached !== undefined &&
            runMetrics.maxCorruptionReached > personalBests.bestCorruption
        ) {
            celebrations.push("Highest corruption survived!");
        }

        if (
            runMetrics?.peakComboMultiplier !== undefined &&
            runMetrics.peakComboMultiplier > personalBests.bestComboMultiplier
        ) {
            celebrations.push("New personal best combo!");
        }

        if (runMetrics) {
            updatePersonalBests(
                runMetrics.peakComboMultiplier ?? 0,
                runMetrics.totalEnemiesDefeated ?? 0,
                runMetrics.maxCorruptionReached ?? 0,
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
        // Show rank progression information
        const currentPrestige =
            (this.registry.get("currentPrestige") as number) || 0;
        const currentLayer = (this.registry.get("currentLayer") as number) || 1;
        const currentRank =
            (this.registry.get("currentRank") as string) || "Initiate Sentinel";

        // Import rank service to get next rank info
        import("../../services/rankService").then(
            ({ getRankNumber, getRankProgress }) => {
                const currentRankNumber = getRankNumber(
                    currentPrestige,
                    currentLayer,
                );
                const rankProgress = getRankProgress(
                    currentPrestige,
                    currentLayer,
                );

                if (rankProgress && rankProgress.nextRank) {
                    const progressText = `Current: ${currentRank} (Rank ${currentRankNumber})\nNext: ${rankProgress.nextRank.name} (Rank ${rankProgress.nextRank.number})`;
                    this.progressStatementText.setText(progressText);
                } else {
                    // At max rank
                    this.progressStatementText.setText(
                        `MAX RANK ACHIEVED: ${currentRank}`,
                    );
                }
            },
        );

        const nextLayerEntry = Object.values(LAYER_CONFIG).find(
            (layer) => layer.scoreThreshold > finalScore,
        );
        if (nextLayerEntry) {
            const diff = nextLayerEntry.scoreThreshold - finalScore;
            this.progressStatementText.setText(
                `PROGRESS: ${diff.toLocaleString()} pts to reach ${nextLayerEntry.name}`,
            );
            return;
        }
        this.progressStatementText.setText("PROGRESS: MAX LAYER REACHED");
    }

    private showRevivePrompt(coins: number, reviveCost: number) {
        if (coins < reviveCost) {
            this.revivePromptContainer.setVisible(false);
            this.summaryContainer.setVisible(true);
            return;
        }
        this.summaryContainer.setVisible(false);
        this.revivePromptContainer.setVisible(true);

        const reviveLabel = this.revivePromptButton
            .list[1] as Phaser.GameObjects.Text;
        reviveLabel.setText(
            `REVIVE (${reviveCost} COIN${reviveCost > 1 ? "S" : ""})`,
        );

        let remaining = 10;
        this.revivePromptCountdownText.setText(`${remaining}`);
        this.revivePromptCountdownText.setColor("#00ff99");
        this.revivePromptTimer?.remove();
        this.revivePromptTimer = this.time.addEvent({
            delay: 1000,
            repeat: 9,
            callback: () => {
                remaining -= 1;
                this.revivePromptCountdownText.setText(`${remaining}`);

                // Change color to red at 3 seconds or less
                if (remaining <= 3) {
                    this.revivePromptCountdownText.setColor("#ff0000");
                    // Pulse effect as time runs out
                    this.tweens.add({
                        targets: this.revivePromptCountdownText,
                        scaleX: 1.3,
                        scaleY: 1.3,
                        duration: 200,
                        yoyo: true,
                    });
                } else {
                    this.revivePromptCountdownText.setColor("#00ff99");
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

    private onPauseChanged(
        _parent: Phaser.Data.DataManager,
        isPaused: boolean,
    ) {
        if (isPaused && !this.registry.get("gameOver")) {
            this.pauseContainer.setVisible(true);
            this.pauseButton.setVisible(false); // Hide pause button when paused
            this.refreshAchievementProgress();

            // Update rank display in pause menu
            const rank =
                (this.registry.get("currentRank") as string) ||
                "Initiate Sentinel";
            if (this.currentRankPauseText) {
                this.currentRankPauseText.setText(`RANK: ${rank}`);
            }

            // Update coin balance in pause menu
            const pauseCoinText = (this as any).pauseCoinText as
                | Phaser.GameObjects.Text
                | undefined;
            if (pauseCoinText) {
                import("../../services/coinService").then(
                    ({ getAvailableCoins }) => {
                        const coins = getAvailableCoins();
                        pauseCoinText.setText(`COINS: ${coins}`);
                    },
                );
            }

            // Update mini-mes in pause menu (active count + sessions left)
            const pauseMiniMeText = (this as any).pauseMiniMeText as
                | Phaser.GameObjects.Text
                | undefined;
            if (pauseMiniMeText) {
                const activeMiniMes =
                    (this.registry.get("activeMiniMes") as number) || 0;
                const sessionsLeft =
                    (this.registry.get("miniMeSessionsRemaining") as number) ??
                    getMiniMeSessionsAvailable();
                pauseMiniMeText.setText(
                    `ACTIVE: ${activeMiniMes}/7 | SESSIONS LEFT: ${sessionsLeft}`,
                );
            }

            // Update current avatar stats in pause menu
            const pauseAvatarText = (this as any).pauseAvatarText as
                | Phaser.GameObjects.Text
                | undefined;
            if (pauseAvatarText) {
                import("../../services/avatarService").then(
                    ({ getActiveAvatar, getAvatarStats }) => {
                        const activeAvatar = getActiveAvatar();
                        const stats = getAvatarStats(activeAvatar);
                        pauseAvatarText.setText(
                            `AVATAR: ${activeAvatar} | Speed: ${stats.speedMultiplier.toFixed(1)}x | Fire: ${stats.fireRateMultiplier.toFixed(1)}x | Health: ${stats.healthMultiplier.toFixed(1)}x`,
                        );
                    },
                );
            }
        } else {
            this.pauseContainer.setVisible(false);
            this.settingsContainer.setVisible(false);
            this.settingsVisible = false;
            this.pauseButton.setVisible(true); // Show pause button when resumed
        }
    }

    private refreshAchievementProgress() {
        const progress = getAchievementProgressSummary(
            this.achievementTexts.length,
        );
        this.achievementTexts.forEach((text, index) => {
            const entry = progress[index];
            if (!entry) {
                text.setText("");
                return;
            }
            const status = entry.unlocked
                ? "UNLOCKED"
                : `${Math.round(entry.progressValue)}%`;
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
        currentRank?: string,
    ) {
        // Import and call score service
        const { submitScore } = await import("../../services/scoreService");
        const rank =
            currentRank ||
            (this.registry.get("currentRank") as string) ||
            "Initiate Sentinel";
        submitScore(
            score,
            walletAddress,
            deepestLayer,
            prestigeLevel,
            runMetrics,
            modifierKey,
            rank,
        );

        const playerName = walletAddress
            ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
            : "Anonymous";
        if (
            checkAllLeaderboardsTop10(walletAddress || "anonymous", playerName)
        ) {
            unlockAchievement("all_leaderboards");
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
            const { fetchWeeklyLeaderboard, getCurrentISOWeek } =
                await import("../../services/scoreService");
            const weekNumber = getCurrentISOWeek();
            const scores = fetchWeeklyLeaderboard();

            // Update title with week number
            const title = this.leaderboardPanel
                .list[1] as Phaser.GameObjects.Text;
            title.setText(`WEEK ${weekNumber} LEADERBOARD`);

            // Remove old entries (except background [0], title [1], and closeButton [2])
            const entriesToRemove: Phaser.GameObjects.GameObject[] = [];
            this.leaderboardPanel.list.forEach((child, index) => {
                if (index > 2) {
                    entriesToRemove.push(child);
                }
            });
            entriesToRemove.forEach((child) => {
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
                const y = entryStartY + index * entrySpacing;
                const rank = index + 1;
                const playerName = entry.playerName || "Anonymous";
                const displayName =
                    playerName.length > 12
                        ? playerName.substring(0, 12) + "..."
                        : playerName;
                const prestigeLabel = entry.prestigeLevel
                    ? `P${entry.prestigeLevel}`
                    : "P0";

                const entryText = this.add.text(
                    panelX,
                    y,
                    `${rank}. ${displayName.padEnd(12)} ${prestigeLabel.padEnd(4)} ${entry.score.toLocaleString()}`,
                    {
                        fontFamily: UI_CONFIG.scoreFont,
                        fontSize: entryFontSize,
                        color: UI_CONFIG.neonGreen,
                        stroke: "#000000",
                        strokeThickness: 2,
                    },
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
            console.error("Error showing leaderboard:", error);
        }
    }

    private restartGame() {
        const gameScene = this.scene.get("GameScene") as GameScene;
        if (gameScene) {
            gameScene.restart();
        }
        this.gameOverContainer.setVisible(false);
        this.pauseContainer.setVisible(false);
        this.hideLeaderboard();
        this.registry.set("gameOver", false);
        this.registry.set("isPaused", false);
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
