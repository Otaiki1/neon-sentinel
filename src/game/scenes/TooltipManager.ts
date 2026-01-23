import Phaser from 'phaser';

export interface TooltipConfig {
    id: string;
    targetX: number;
    targetY: number;
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    width?: number;
    autoHide?: boolean;
    autoHideDelay?: number;
}

const TOOLTIP_SEEN_KEY_PREFIX = 'neon-sentinel-game-tooltip-seen-';

export class TooltipManager {
    private scene: Phaser.Scene;
    private tooltips: Map<string, Phaser.GameObjects.Container> = new Map();
    private activeTooltipId: string | null = null;
    private queue: Array<{ config: TooltipConfig; delay: number }> = [];
    private processing = false;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    enqueueTooltip(config: TooltipConfig, delay = 0): void {
        this.queue.push({ config, delay });
        this.processQueue();
    }

    private processQueue(): void {
        if (this.processing || this.activeTooltipId !== null) {
            return;
        }
        const next = this.queue.shift();
        if (!next) return;
        const { config, delay } = next;

        // Skip already seen tooltips
        const storageKey = `${TOOLTIP_SEEN_KEY_PREFIX}${config.id}`;
        if (localStorage.getItem(storageKey) === 'true') {
            this.processQueue();
            return;
        }

        this.processing = true;
        if (delay > 0) {
            this.scene.time.delayedCall(delay, () => {
                this.showTooltipInternal(config);
            });
        } else {
            this.showTooltipInternal(config);
        }
    }

    private showTooltipInternal(config: TooltipConfig): void {
        // Check if tooltip was already seen
        const storageKey = `${TOOLTIP_SEEN_KEY_PREFIX}${config.id}`;
        if (localStorage.getItem(storageKey) === 'true') {
            this.processing = false;
            this.processQueue();
            return;
        }

        const position = config.position || 'top';
        const width = config.width || 260;
        const padding = 12;
        const arrowSize = 8;

        // Create container
        const container = this.scene.add.container(0, 0);
        container.setDepth(10000);
        container.setVisible(true);

        // Create text first to measure dimensions
        const textStyle = {
            fontFamily: 'JetBrains Mono',
            fontSize: 12,
            color: '#00ff00',
            wordWrap: { width: width - padding * 2 },
            align: 'left',
        } as const;
        const text = this.scene.add.text(0, 0, config.content, textStyle);
        const textBounds = text.getBounds();
        const textHeight = textBounds.height;
        const spacing = 12;
        const buttonHeight = 24;
        const totalHeight = padding * 2 + textHeight + spacing + buttonHeight;

        // Calculate position and layout dynamically now that we know text height
        let tooltipX = config.targetX;
        let tooltipY = config.targetY;

        if (position === 'top') {
            tooltipY = config.targetY - totalHeight - arrowSize;
        } else if (position === 'bottom') {
            tooltipY = config.targetY + spacing + arrowSize;
        } else if (position === 'left') {
            tooltipX = config.targetX - width - spacing - arrowSize;
        } else if (position === 'right') {
            tooltipX = config.targetX + spacing + arrowSize;
        }

        // Position text after computing tooltip coordinates
        text.setPosition(tooltipX + padding, tooltipY + padding);

        // Draw rounded rectangle background
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x000000, 0.98);
        bg.lineStyle(2, 0x00ff00, 1);
        bg.fillRoundedRect(0, 0, width, totalHeight, 6);
        bg.strokeRoundedRect(0, 0, width, totalHeight, 6);
        bg.setPosition(tooltipX, tooltipY);

        // Draw arrow
        const arrow = this.scene.add.graphics();
        arrow.fillStyle(0x000000, 0.98);
        arrow.lineStyle(2, 0x00ff00, 1);

        if (position === 'top') {
            arrow.beginPath();
            arrow.moveTo(width / 2 - arrowSize, totalHeight);
            arrow.lineTo(width / 2, totalHeight + arrowSize);
            arrow.lineTo(width / 2 + arrowSize, totalHeight);
            arrow.closePath();
            arrow.fillPath();
            arrow.strokePath();
            arrow.setPosition(tooltipX, tooltipY);
        } else if (position === 'bottom') {
            arrow.beginPath();
            arrow.moveTo(width / 2 - arrowSize, 0);
            arrow.lineTo(width / 2, -arrowSize);
            arrow.lineTo(width / 2 + arrowSize, 0);
            arrow.closePath();
            arrow.fillPath();
            arrow.strokePath();
            arrow.setPosition(tooltipX, tooltipY);
        } else if (position === 'left') {
            arrow.beginPath();
            arrow.moveTo(width, totalHeight / 2 - arrowSize);
            arrow.lineTo(width + arrowSize, totalHeight / 2);
            arrow.lineTo(width, totalHeight / 2 + arrowSize);
            arrow.closePath();
            arrow.fillPath();
            arrow.strokePath();
            arrow.setPosition(tooltipX, tooltipY);
        } else if (position === 'right') {
            arrow.beginPath();
            arrow.moveTo(0, totalHeight / 2 - arrowSize);
            arrow.lineTo(-arrowSize, totalHeight / 2);
            arrow.lineTo(0, totalHeight / 2 + arrowSize);
            arrow.closePath();
            arrow.fillPath();
            arrow.strokePath();
            arrow.setPosition(tooltipX, tooltipY);
        }

        // Create dismiss button
        const buttonBg = this.scene.add.graphics();
        buttonBg.fillStyle(0x00ff00, 0.1);
        buttonBg.lineStyle(1, 0x00ff00, 1);
        const buttonWidth = width - padding * 2;
        const buttonX = tooltipX + padding;
        const buttonY = tooltipY + totalHeight - padding - buttonHeight;
        buttonBg.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 4);
        buttonBg.strokeRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 4);

        const buttonText = this.scene.add.text(
            buttonX + buttonWidth / 2,
            buttonY + buttonHeight / 2,
            'Got it',
            {
                fontFamily: 'JetBrains Mono',
                fontSize: 11,
                color: '#00ff00',
            }
        );
        buttonText.setOrigin(0.5, 0.5);

        // Make button interactive
        const buttonZone = this.scene.add.zone(buttonX + buttonWidth / 2, buttonY + buttonHeight / 2, buttonWidth, buttonHeight);
        buttonZone.setInteractive({ useHandCursor: true });
        buttonZone.on('pointerdown', () => {
            this.hideTooltip(config.id);
            localStorage.setItem(storageKey, 'true');
        });

        // Add glow effect
        const glow = this.scene.add.graphics();
        glow.fillStyle(0x00ff00, 0.3);
        glow.fillRoundedRect(tooltipX - 2, tooltipY - 2, width + 4, totalHeight + 4, 8);
        glow.setBlendMode(Phaser.BlendModes.ADD);
        glow.setAlpha(0.5);

        // Add pulse animation
        this.scene.tweens.add({
            targets: glow,
            alpha: { from: 0.3, to: 0.6 },
            duration: 2000,
            yoyo: true,
            repeat: -1,
        });

        // Add to container
        container.add([glow, bg, arrow, text, buttonBg, buttonText, buttonZone]);

        this.tooltips.set(config.id, container);
        this.activeTooltipId = config.id;
        this.processing = false;

        // Auto-hide if configured
        if (config.autoHide && config.autoHideDelay) {
            this.scene.time.delayedCall(config.autoHideDelay, () => {
                this.hideTooltip(config.id);
            });
        }
    }

    hideTooltip(id: string): void {
        const tooltip = this.tooltips.get(id);
        if (tooltip) {
            tooltip.destroy(true);
            this.tooltips.delete(id);
            if (this.activeTooltipId === id) {
                this.activeTooltipId = null;
            }
        }
        this.processing = false;
        this.processQueue();
    }

    hideAllTooltips(): void {
        this.tooltips.forEach((_tooltip, id) => {
            this.hideTooltip(id);
        });
    }

    skipAll(tooltipsToMarkSeen?: string[]): void {
        if (this.activeTooltipId) {
            const storageKey = `${TOOLTIP_SEEN_KEY_PREFIX}${this.activeTooltipId}`;
            localStorage.setItem(storageKey, 'true');
            this.hideTooltip(this.activeTooltipId);
        }
        this.queue.forEach(({ config }) => {
            const storageKey = `${TOOLTIP_SEEN_KEY_PREFIX}${config.id}`;
            localStorage.setItem(storageKey, 'true');
        });
        if (tooltipsToMarkSeen) {
            tooltipsToMarkSeen.forEach((id) =>
                localStorage.setItem(`${TOOLTIP_SEEN_KEY_PREFIX}${id}`, 'true')
            );
        }
        this.queue = [];
        this.processing = false;
    }

    destroy(): void {
        this.hideAllTooltips();
        this.tooltips.clear();
    }
}

