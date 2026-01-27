import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
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

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
      assetText.destroy();
    });

    // Load new hero sprites from /hero directory
    // Base grade sprites (for heroes/kernels)
    this.load.image('heroGrade1', '/hero/hero-grade-1.svg');
    this.load.image('heroGrade2', '/hero/hero-grade-2.svg');
    this.load.image('heroGrade3', '/hero/hero-grade-3.svg');
    this.load.image('heroGrade4', '/hero/hero-grade-4.svg');
    this.load.image('heroGrade5', '/hero/hero-grade-5.svg');
    
    // Colored skin variants
    this.load.image('heroGrade1Blue', '/hero/hero-grade-1-blue-skin.svg');
    this.load.image('heroGrade2Purple', '/hero/hero-grade-2-purple-skin.svg');
    this.load.image('heroGrade3Red', '/hero/hero-grade-3-red-skin.svg');
    this.load.image('heroGrade4Orange', '/hero/hero-grade-4-orange-skin.svg');
    this.load.image('heroGrade5White', '/hero/hero-grade-5-white-skin.svg');
    
    // Keep old sprites as fallback
    this.load.image('hero', '/sprites/hero.svg');
    this.load.image('heroVanguard', '/sprites/hero_2.svg');
    this.load.image('heroGhost', '/sprites/hero_3.svg');
    this.load.image('heroDrone', '/sprites/hero_sidekick_2.svg');
    this.load.image('heroGodMode', '/sprites/hero-god-mode.svg');
    
    // Load new enemy sprites - Green enemies
    this.load.image('greenPawn1', '/green-enemies/green-pawn-1.svg');
    this.load.image('greenPawn2', '/green-enemies/green-pawn-2.svg');
    this.load.image('greenPawn3', '/green-enemies/green-pawn-3.svg');
    this.load.image('greenPawnCorrupted', '/green-enemies/green-pawn-3.svg'); // Use variant 3 as corrupted fallback
    this.load.image('greenBoss1', '/green-enemies/green-boss-1.svg');
    this.load.image('greenBoss2', '/green-enemies/green-boss-2.svg');
    this.load.image('greenBoss3', '/green-enemies/green-boss-3.svg');
    this.load.image('greenBossCorrupted', '/green-enemies/green-boss-3.svg'); // Use variant 3 as corrupted fallback
    
    // Yellow enemies
    this.load.image('yellowRoutine1', '/yellow-enemies/yellow-pawn-1.svg');
    this.load.image('yellowRoutine2', '/yellow-enemies/yellow-pawn-2.svg');
    this.load.image('yellowRoutine3', '/yellow-enemies/yellow-pawn-2.svg'); // Use variant 2 as variant 3 fallback
    this.load.image('yellowRoutineCorrupted', '/yellow-enemies/yellow-pawn-2.svg'); // Use variant 2 as corrupted fallback
    this.load.image('yellowBoss1', '/yellow-enemies/yellow-boss-1.svg');
    this.load.image('yellowBoss2', '/yellow-enemies/yellow-boss-2.svg');
    this.load.image('yellowFinalBoss', '/yellow-enemies/yellow-final-boss.svg');
    this.load.image('yellowFinalBossCorrupted', '/yellow-enemies/yellow-final-boss.svg'); // Use final boss as corrupted fallback
    
    // Blue enemies
    this.load.image('blueBot1', '/blue-enemies/blue-pawn-1.svg');
    this.load.image('blueBot2', '/blue-enemies/blue-pawn-2.svg');
    this.load.image('blueBot3', '/blue-enemies/blue-pawn-3.svg');
    this.load.image('blueBotCorrupted', '/blue-enemies/blue-pawn-3.svg'); // Use variant 3 as corrupted fallback
    this.load.image('blueBoss1', '/blue-enemies/blue-boss-1.svg');
    this.load.image('blueBoss2', '/blue-enemies/blue-boss-2.svg');
    this.load.image('blueBoss3', '/blue-enemies/blue-boss-3.svg');
    this.load.image('blueBossCorrupted', '/blue-enemies/blue-boss-3.svg'); // Use variant 3 as corrupted fallback
    
    // Purple enemies
    this.load.image('purpleCore1', '/purple-enemies/purple-pawn-1.svg');
    this.load.image('purpleCore2', '/purple-enemies/purple-pawn-2.svg');
    this.load.image('purpleCore3', '/purple-enemies/purple-pawn-3.svg');
    this.load.image('purpleCoreCorrupted', '/purple-enemies/purple-pawn-3.svg'); // Use variant 3 as corrupted fallback
    this.load.image('purpleBoss1', '/purple-enemies/purple-boss-1.svg');
    this.load.image('purpleBoss2', '/purple-enemies/purple-boss-2.svg');
    this.load.image('purpleBoss3', '/purple-enemies/purple-boss-3.svg');
    this.load.image('purpleBossCorrupted', '/purple-enemies/purple-boss-3.svg'); // Use variant 3 as corrupted fallback
    
    // Final boss
    this.load.image('zrechostikal', '/sprites/final_boss.svg');
    
    // Keep old sprites as fallback
    this.load.image('enemyGreen', '/sprites/enemy_green.svg');
    this.load.image('enemyYellow', '/sprites/enemy_yellow.svg');
    this.load.image('enemyBlue', '/sprites/enemy_blue.svg');
    this.load.image('enemyPurple', '/sprites/enemy_purple.svg');
    this.load.image('enemyPurpleBoss', '/sprites/enemy_purple_boss.svg');
    this.load.image('miniFinalBoss', '/sprites/mini_final_boss.svg');
    this.load.image('mediumFinalBoss', '/sprites/medium_final_boss.svg');
    this.load.image('finalBoss', '/sprites/final_boss.svg');
    
    // Bullet sprites
    this.load.image('greenBullet1', '/sprites/green_bullet_1.svg');
    this.load.image('greenBullet2', '/sprites/green_bullet_2.svg');
    this.load.image('yellowBullet', '/sprites/yellow_bullet.svg');
    this.load.image('blueBullet', '/sprites/blue_bullet.svg');
    
    // Explosion sprites
    this.load.image('smallFire', '/sprites/small_fire.svg');
    this.load.image('mediumFire', '/sprites/medium_fire.svg');
    this.load.image('bigFire', '/sprites/big_fire.svg');
    this.load.image('greenFire', '/sprites/green_fire.svg');
    
    // Power-up sprites
    this.load.image('power_up', '/sprites/power_up.svg');
    this.load.image('power_up_2', '/sprites/power_up_2.svg');
    this.load.image('orb', '/sprites/orb.svg');
    
    // White Sentinel guide character
    this.load.image('whiteSentinel', '/white-sentinel.png');
    
    // Layer background images
    this.load.image('layerFirewall', '/scenes/firewall-layer.png');
    this.load.image('layerSecurityCore', '/scenes/security-core-layer.png');
    this.load.image('layerCorruptedAI', '/scenes/corrupted-ai-layer.png');
    this.load.image('layerKernelBreach', '/scenes/kernel-breach-layer.png');
    this.load.image('layerSystemCollapse', '/scenes/system-collapse-layer.png');
    this.load.image('layerPrestige', '/scenes/prestige-layer.png');
  }

  create() {
    // Start the game scene
    this.scene.start('GameScene');
    // Start UI scene in parallel
    this.scene.launch('UIScene');
  }
}
