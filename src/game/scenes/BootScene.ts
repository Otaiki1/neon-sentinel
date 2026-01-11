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

    // Load sprites from public folder
    this.load.image('hero', '/sprites/hero.svg');
    
    // Enemy sprites
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
    this.load.image('blueBullet', '/sprites/blue_bullet.svg');
    
    // Explosion sprites
    this.load.image('smallFire', '/sprites/small_fire.svg');
    this.load.image('mediumFire', '/sprites/medium_fire.svg');
    this.load.image('bigFire', '/sprites/big_fire.svg');
    this.load.image('greenFire', '/sprites/green_fire.svg');
  }

  create() {
    // Start the game scene
    this.scene.start('GameScene');
    // Start UI scene in parallel
    this.scene.launch('UIScene');
  }
}

