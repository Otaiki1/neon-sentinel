import Phaser from 'phaser';
import {
    ALL_ASSETS,
    AVATAR_ASSETS,
    ENEMY_ASSETS,
    FINAL_BOSS_ASSETS,
    MINI_ME_ASSETS,
    BULLET_ASSETS,
    POWERUP_ASSETS,
    EXPLOSION_ASSETS,
    UI_ASSETS,
    LAYER_BACKGROUND_ASSETS,
    BADGE_ASSETS,
    getFallbackAsset,
    isAssetRequired,
} from '../assets/assetMap';

export class BootScene extends Phaser.Scene {
    private loadedAssets: Set<string> = new Set();
    private failedAssets: Map<string, string> = new Map(); // key -> fallback used
    
    constructor() {
        super({ key: 'BootScene' });
    }

  preload() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Loading bar background
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    // Loading text
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: 'Loading...',
      style: {
        font: '16px "Press Start 2P"',
        color: '#00ff00',
      },
    });
    loadingText.setOrigin(0.5, 0.5);

    const percentText = this.make.text({
      x: width / 2,
      y: height / 2,
      text: '0%',
      style: {
        font: '12px "Press Start 2P"',
        color: '#00ff00',
      },
    });
    percentText.setOrigin(0.5, 0.5);

    const assetText = this.make.text({
      x: width / 2,
      y: height / 2 + 50,
      text: '',
      style: {
        font: '10px "Press Start 2P"',
        color: '#00ff00',
      },
    });
    assetText.setOrigin(0.5, 0.5);

    // Update progress bar
    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x00ff00, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
      percentText.setText(Math.round(value * 100) + '%');
    });

    this.load.on('fileprogress', (file: Phaser.Loader.File) => {
      assetText.setText('Loading: ' + file.key);
    });

    this.load.on('filecomplete', (key: string) => {
        this.loadedAssets.add(key);
    });
    
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
        const key = file.key;
        const fallback = getFallbackAsset(key);
        const required = isAssetRequired(key);
        
        if (fallback) {
            console.warn(`Asset load failed: ${key}, using fallback: ${fallback}`);
            this.failedAssets.set(key, fallback);
            // Try to load fallback if not already loaded
            if (!this.loadedAssets.has(fallback)) {
                const fallbackAsset = ALL_ASSETS.find(a => a.key === fallback);
                if (fallbackAsset) {
                    // Phaser will skip if already in queue
                    this.load.image(fallback, fallbackAsset.path);
                }
            }
        } else if (required) {
            console.error(`Required asset failed to load: ${key} (no fallback available)`);
        } else {
            console.warn(`Optional asset failed to load: ${key} (no fallback available)`);
        }
    });

    this.load.on('complete', () => {
        // Log summary of failed assets
        if (this.failedAssets.size > 0) {
            console.warn(`Asset loading complete. ${this.failedAssets.size} assets used fallbacks:`);
            this.failedAssets.forEach((fallback, key) => {
                console.warn(`  ${key} -> ${fallback}`);
            });
        }
        
        progressBar.destroy();
        progressBox.destroy();
        loadingText.destroy();
        percentText.destroy();
        assetText.destroy();
    });

    // Load avatar/hero sprites using asset mapping
    this.loadAssets(AVATAR_ASSETS);
    
    // Load enemy sprites using asset mapping
    this.loadAssets(ENEMY_ASSETS);
    
    // Load final boss sprites
    this.loadAssets(FINAL_BOSS_ASSETS);
    
    // Load bullet sprites
    this.loadAssets(BULLET_ASSETS);
    
    // Load mini-me sprites
    this.loadAssets(MINI_ME_ASSETS);
    
    // Load power-up sprites
    this.loadAssets(POWERUP_ASSETS);
    
    // Load explosion/fire sprites
    this.loadAssets(EXPLOSION_ASSETS);
    
    // Load UI/icon sprites
    this.loadAssets(UI_ASSETS);
    
    // Load rank badges
    this.loadAssets(BADGE_ASSETS);
    
    // Load layer background images
    this.loadAssets(LAYER_BACKGROUND_ASSETS);
  }

  /**
   * Load assets from asset mapping array
   */
  private loadAssets(assets: typeof ALL_ASSETS): void {
    for (const asset of assets) {
      // Skip if already loaded
      if (this.loadedAssets.has(asset.key)) {
        continue;
      }
      
      // Load the asset (Phaser will skip if already in queue)
      if (asset.path.endsWith('.png')) {
        this.load.image(asset.key, asset.path);
      } else if (asset.path.endsWith('.svg')) {
        this.load.image(asset.key, asset.path);
      } else {
        // Default to image loader
        this.load.image(asset.key, asset.path);
      }
    }
  }

  create() {
    // Log asset loading summary
    const totalAssets = ALL_ASSETS.length;
    const loadedCount = this.loadedAssets.size;
    const failedCount = this.failedAssets.size;
    
    console.log(`Asset loading complete: ${loadedCount}/${totalAssets} loaded, ${failedCount} used fallbacks`);
    
    // Start the game scene
    this.scene.start('GameScene');
    // Start UI scene in parallel
    this.scene.launch('UIScene');
  }
  
  /**
   * Get fallback asset key for a given asset key
   * Used by game code to handle missing assets gracefully
   */
  public getFallbackKey(key: string): string {
    // Check if asset failed and has a fallback
    if (this.failedAssets.has(key)) {
      return this.failedAssets.get(key)!;
    }
    
    // Check asset mapping for fallback
    const fallback = getFallbackAsset(key);
    if (fallback) {
      return fallback;
    }
    
    // Return original key if no fallback
    return key;
  }
}
