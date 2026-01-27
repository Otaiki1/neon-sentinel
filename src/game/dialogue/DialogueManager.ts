/**
 * Dialogue Manager - Manages dialogue display and interaction
 * 
 * Handles showing dialogue boxes, character names, and dialogue progression
 */

import Phaser from 'phaser';
import { getDialogue, getCharacter } from '../lore/characters';
import type { Dialogue } from '../lore/characters';

export interface DialogueDisplayOptions {
    duration?: number; // Auto-advance after duration (ms)
    skipOnClick?: boolean; // Allow clicking to skip
    priority?: 'low' | 'medium' | 'high' | 'critical';
    onComplete?: () => void;
}

export class DialogueManager {
    private scene: Phaser.Scene;
    private dialogueContainer!: Phaser.GameObjects.Container;
    private background!: Phaser.GameObjects.Rectangle;
    private characterNameText!: Phaser.GameObjects.Text;
    private dialogueText!: Phaser.GameObjects.Text;
    private skipHintText!: Phaser.GameObjects.Text;
    private isVisible = false;
    private currentDialogue: Dialogue | null = null;
    private autoAdvanceTimer?: Phaser.Time.TimerEvent;
    private onCompleteCallback?: () => void;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.createDialogueUI();
    }

    /**
     * Create the dialogue UI elements
     */
    private createDialogueUI(): void {
        const width = this.scene.scale.width;
        const height = this.scene.scale.height;
        const uiScale = (this.scene.registry.get('uiScale') as number) || 1;

        // Background overlay (semi-transparent)
        this.background = this.scene.add.rectangle(
            width / 2,
            height / 2,
            width,
            height,
            0x000000,
            0.7
        );
        this.background.setDepth(1000);
        this.background.setVisible(false);

        // Dialogue box (bottom of screen)
        const boxWidth = width * 0.9;
        const boxHeight = 150 * uiScale;
        const boxX = width / 2;
        const boxY = height - boxHeight / 2 - 20;

        const dialogueBox = this.scene.add.rectangle(
            boxX,
            boxY,
            boxWidth,
            boxHeight,
            0x000000,
            0.95
        );
        dialogueBox.setStrokeStyle(3, 0x00ff00);
        dialogueBox.setDepth(1001);

        // Character name (top-left of dialogue box)
        this.characterNameText = this.scene.add.text(
            boxX - boxWidth / 2 + 20,
            boxY - boxHeight / 2 + 20,
            '',
            {
                fontFamily: 'Oxanium, sans-serif',
                fontSize: 20 * uiScale,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
            }
        );
        this.characterNameText.setOrigin(0, 0);
        this.characterNameText.setDepth(1002);

        // Dialogue text (main content)
        this.dialogueText = this.scene.add.text(
            boxX - boxWidth / 2 + 20,
            boxY - boxHeight / 2 + 60,
            '',
            {
                fontFamily: 'VT323, monospace',
                fontSize: 24 * uiScale,
                color: '#00ff00',
                stroke: '#000000',
                strokeThickness: 2,
                wordWrap: { width: boxWidth - 40, useAdvancedWrap: true },
            }
        );
        this.dialogueText.setOrigin(0, 0);
        this.dialogueText.setDepth(1002);

        // Skip hint (bottom-right)
        this.skipHintText = this.scene.add.text(
            boxX + boxWidth / 2 - 20,
            boxY + boxHeight / 2 - 20,
            'Click to continue',
            {
                fontFamily: 'Oxanium, sans-serif',
                fontSize: 14 * uiScale,
                color: '#888888',
                stroke: '#000000',
                strokeThickness: 1,
            }
        );
        this.skipHintText.setOrigin(1, 1);
        this.skipHintText.setDepth(1002);
        this.skipHintText.setVisible(false);

        // Create container
        this.dialogueContainer = this.scene.add.container(0, 0, [
            this.background,
            dialogueBox,
            this.characterNameText,
            this.dialogueText,
            this.skipHintText,
        ]);
        this.dialogueContainer.setVisible(false);

        // Make dialogue box clickable to skip
        dialogueBox.setInteractive({ useHandCursor: true });
        dialogueBox.on('pointerdown', () => {
            if (this.isVisible && this.currentDialogue) {
                this.hideDialogue();
            }
        });
    }

    /**
     * Show a dialogue
     */
    public showDialogue(
        dialogueId: string,
        options: DialogueDisplayOptions = {}
    ): boolean {
        const dialogue = getDialogue(dialogueId);
        if (!dialogue) {
            console.warn(`Dialogue not found: ${dialogueId}`);
            return false;
        }

        const character = getCharacter(dialogue.characterId);
        if (!character) {
            console.warn(`Character not found: ${dialogue.characterId}`);
            return false;
        }

        // Check priority - don't interrupt critical dialogues
        if (this.isVisible && this.currentDialogue) {
            const currentPriority = this.currentDialogue.priority;
            const newPriority = dialogue.priority;
            
            const priorityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
            if (priorityOrder[currentPriority] >= priorityOrder[newPriority]) {
                // Current dialogue has equal or higher priority, queue this one
                return false;
            }
        }

        this.currentDialogue = dialogue;
        this.onCompleteCallback = options.onComplete;

        // Update UI
        this.characterNameText.setText(character.name.toUpperCase());
        this.characterNameText.setColor(character.color);
        this.dialogueText.setText(dialogue.text);
        this.dialogueText.setColor(character.color);

        // Show skip hint if enabled
        this.skipHintText.setVisible(options.skipOnClick !== false);

        // Show dialogue
        this.dialogueContainer.setVisible(true);
        this.background.setVisible(true);
        this.isVisible = true;

        // Auto-advance timer
        const duration = options.duration || this.getDefaultDuration(dialogue);
        if (duration > 0) {
            this.autoAdvanceTimer = this.scene.time.delayedCall(duration, () => {
                this.hideDialogue();
            });
        }

        // Pause game if critical dialogue
        if (dialogue.priority === 'critical') {
            const gameScene = this.scene.scene.get('GameScene');
            if (gameScene && gameScene.scene.isActive()) {
                this.scene.registry.set('isPaused', true);
            }
        }

        return true;
    }

    /**
     * Hide the current dialogue
     */
    public hideDialogue(): void {
        if (!this.isVisible) return;

        this.dialogueContainer.setVisible(false);
        this.background.setVisible(false);
        this.isVisible = false;

        // Clear auto-advance timer
        if (this.autoAdvanceTimer) {
            this.autoAdvanceTimer.remove();
            this.autoAdvanceTimer = undefined;
        }

        // Resume game if it was paused
        if (this.currentDialogue?.priority === 'critical') {
            const gameScene = this.scene.scene.get('GameScene');
            if (gameScene && gameScene.scene.isActive()) {
                this.scene.registry.set('isPaused', false);
            }
        }

        // Call completion callback
        if (this.onCompleteCallback) {
            this.onCompleteCallback();
            this.onCompleteCallback = undefined;
        }

        this.currentDialogue = null;
    }

    /**
     * Get default duration based on dialogue length and priority
     */
    private getDefaultDuration(dialogue: Dialogue): number {
        const baseDuration = dialogue.text.length * 50; // 50ms per character
        const priorityMultiplier = {
            low: 1.0,
            medium: 1.2,
            high: 1.5,
            critical: 2.0,
        };
        
        return Math.max(2000, baseDuration * priorityMultiplier[dialogue.priority]);
    }

    /**
     * Check if dialogue is currently visible
     */
    public isDialogueVisible(): boolean {
        return this.isVisible;
    }

    /**
     * Get current dialogue
     */
    public getCurrentDialogue(): Dialogue | null {
        return this.currentDialogue;
    }

    /**
     * Cleanup on destroy
     */
    public destroy(): void {
        if (this.autoAdvanceTimer) {
            this.autoAdvanceTimer.remove();
        }
        this.dialogueContainer.destroy();
    }
}
