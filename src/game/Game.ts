import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { GameScene } from "./scenes/GameScene";
import { UIScene } from "./scenes/UIScene";
import { GAME_CONFIG } from "./config";

export function initGame(container: HTMLElement): Phaser.Game {
    // Get actual container dimensions with fallbacks
    const containerRect = container.getBoundingClientRect();
    const viewport = window.visualViewport;
    
    // Try multiple sources for dimensions, ensuring we have valid values
    let width = viewport?.width || containerRect.width || window.innerWidth || 800;
    let height = viewport?.height || containerRect.height || window.innerHeight || 600;
    
    // Ensure minimum valid dimensions (WebGL requires at least 1x1)
    width = Math.max(1, Math.floor(width));
    height = Math.max(1, Math.floor(height));

    const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: width,
        height: height,
        parent: container,
        backgroundColor: GAME_CONFIG.backgroundColor,
        physics: {
            default: "arcade",
            arcade: {
                gravity: { x: 0, y: 0 },
                debug: false,
            },
        },
        scene: [BootScene, GameScene, UIScene],
        scale: {
            mode: Phaser.Scale.RESIZE,
            width: width,
            height: height,
            autoCenter: Phaser.Scale.CENTER_BOTH,
        },
    };

    return new Phaser.Game(config);
}
