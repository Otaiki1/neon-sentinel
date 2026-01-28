/**
 * Asset Mapping Configuration
 * 
 * Maps all game assets to their file paths and provides fallback strategies
 */

export interface AssetMapping {
    key: string;
    path: string;
    fallback?: string; // Fallback asset key if this one fails
    required: boolean; // Whether game should fail if asset missing
}

/**
 * Avatar/Hero Sprite Mappings
 */
export const AVATAR_ASSETS: AssetMapping[] = [
    // Base grade sprites
    { key: 'heroGrade1', path: '/hero/hero-grade-1.svg', fallback: 'hero', required: false },
    { key: 'heroGrade2', path: '/hero/hero-grade-2.svg', fallback: 'hero', required: false },
    { key: 'heroGrade3', path: '/hero/hero-grade-3.svg', fallback: 'hero', required: false },
    { key: 'heroGrade4', path: '/hero/hero-grade-4.svg', fallback: 'hero', required: false },
    { key: 'heroGrade5', path: '/hero/hero-grade-5.svg', fallback: 'hero', required: false },
    
    // Colored skin variants
    { key: 'heroGrade1Blue', path: '/hero/hero-grade-1-blue-skin.svg', fallback: 'heroGrade1', required: false },
    { key: 'heroGrade2Purple', path: '/hero/hero-grade-2-purple-skin.svg', fallback: 'heroGrade2', required: false },
    { key: 'heroGrade3Red', path: '/hero/hero-grade-3-red-skin.svg', fallback: 'heroGrade3', required: false },
    { key: 'heroGrade4Orange', path: '/hero/hero-grade-4-orange-skin.svg', fallback: 'heroGrade4', required: false },
    { key: 'heroGrade5White', path: '/hero/hero-grade-5-white-skin.svg', fallback: 'heroGrade5', required: false },
    
    // Legacy fallbacks
    { key: 'hero', path: '/sprites/hero.svg', required: true },
    { key: 'heroVanguard', path: '/sprites/hero_2.svg', fallback: 'hero', required: false },
    { key: 'heroGhost', path: '/sprites/hero_3.svg', fallback: 'hero', required: false },
    { key: 'heroDrone', path: '/sprites/hero_sidekick_2.svg', fallback: 'hero', required: false },
    { key: 'heroGodMode', path: '/sprites/hero-god-mode.svg', fallback: 'hero', required: false },
];

/**
 * Enemy Sprite Mappings
 */
export const ENEMY_ASSETS: AssetMapping[] = [
    // Green enemies
    { key: 'greenPawn1', path: '/green-enemies/green-pawn-1.svg', fallback: 'enemyGreen', required: false },
    { key: 'greenPawn2', path: '/green-enemies/green-pawn-2.svg', fallback: 'greenPawn1', required: false },
    { key: 'greenPawn3', path: '/green-enemies/green-pawn-3.svg', fallback: 'greenPawn2', required: false },
    { key: 'greenPawnCorrupted', path: '/green-enemies/green-pawn-3.svg', fallback: 'greenPawn3', required: false },
    { key: 'greenBoss1', path: '/green-enemies/green-boss-1.svg', fallback: 'enemyGreen', required: false },
    { key: 'greenBoss2', path: '/green-enemies/green-boss-2.svg', fallback: 'greenBoss1', required: false },
    { key: 'greenBoss3', path: '/green-enemies/green-boss-3.svg', fallback: 'greenBoss2', required: false },
    { key: 'greenBossCorrupted', path: '/green-enemies/green-boss-3.svg', fallback: 'greenBoss3', required: false },
    
    // Yellow enemies
    { key: 'yellowRoutine1', path: '/yellow-enemies/yellow-pawn-1.svg', fallback: 'enemyYellow', required: false },
    { key: 'yellowRoutine2', path: '/yellow-enemies/yellow-pawn-2.svg', fallback: 'yellowRoutine1', required: false },
    { key: 'yellowRoutine3', path: '/yellow-enemies/yellow-pawn-2.svg', fallback: 'yellowRoutine2', required: false },
    { key: 'yellowRoutineCorrupted', path: '/yellow-enemies/yellow-pawn-2.svg', fallback: 'yellowRoutine3', required: false },
    { key: 'yellowBoss1', path: '/yellow-enemies/yellow-boss-1.svg', fallback: 'enemyYellow', required: false },
    { key: 'yellowBoss2', path: '/yellow-enemies/yellow-boss-2.svg', fallback: 'yellowBoss1', required: false },
    { key: 'yellowFinalBoss', path: '/yellow-enemies/yellow-final-boss.svg', fallback: 'yellowBoss2', required: false },
    { key: 'yellowFinalBossCorrupted', path: '/yellow-enemies/yellow-final-boss.svg', fallback: 'yellowFinalBoss', required: false },
    
    // Blue enemies
    { key: 'blueBot1', path: '/blue-enemies/blue-pawn-1.svg', fallback: 'enemyBlue', required: false },
    { key: 'blueBot2', path: '/blue-enemies/blue-pawn-2.svg', fallback: 'blueBot1', required: false },
    { key: 'blueBot3', path: '/blue-enemies/blue-pawn-3.svg', fallback: 'blueBot2', required: false },
    { key: 'blueBotCorrupted', path: '/blue-enemies/blue-pawn-3.svg', fallback: 'blueBot3', required: false },
    { key: 'blueBoss1', path: '/blue-enemies/blue-boss-1.svg', fallback: 'enemyBlue', required: false },
    { key: 'blueBoss2', path: '/blue-enemies/blue-boss-2.svg', fallback: 'blueBoss1', required: false },
    { key: 'blueBoss3', path: '/blue-enemies/blue-boss-3.svg', fallback: 'blueBoss2', required: false },
    { key: 'blueBossCorrupted', path: '/blue-enemies/blue-boss-3.svg', fallback: 'blueBoss3', required: false },
    
    // Purple enemies (check if files exist)
    { key: 'purpleCore1', path: '/purple-enemies/purple-pawn-1.svg', fallback: 'enemyPurple', required: false },
    { key: 'purpleCore2', path: '/purple-enemies/purple-pawn-2.svg', fallback: 'purpleCore1', required: false },
    { key: 'purpleCore3', path: '/purple-enemies/purple-pawn-3.svg', fallback: 'purpleCore2', required: false },
    { key: 'purpleCoreCorrupted', path: '/purple-enemies/purple-pawn-3.svg', fallback: 'purpleCore3', required: false },
    { key: 'purpleBoss1', path: '/purple-enemies/purple-boss-1.svg', fallback: 'enemyPurpleBoss', required: false },
    { key: 'purpleBoss2', path: '/purple-enemies/purple-boss-2.svg', fallback: 'purpleBoss1', required: false },
    { key: 'purpleBoss3', path: '/purple-enemies/purple-boss-3.svg', fallback: 'purpleBoss2', required: false },
    { key: 'purpleBossCorrupted', path: '/purple-enemies/purple-boss-3.svg', fallback: 'purpleBoss3', required: false },
    
    // Legacy fallbacks
    { key: 'enemyGreen', path: '/sprites/enemy_green.svg', required: true },
    { key: 'enemyYellow', path: '/sprites/enemy_yellow.svg', required: true },
    { key: 'enemyBlue', path: '/sprites/enemy_blue.svg', required: true },
    { key: 'enemyPurple', path: '/sprites/enemy_purple.svg', required: true },
    { key: 'enemyPurpleBoss', path: '/sprites/enemy_purple_boss.svg', fallback: 'enemyPurple', required: false },
];

/**
 * Final Boss Sprite Mappings - from /final-prestige-7-boss/
 */
export const FINAL_BOSS_ASSETS: AssetMapping[] = [
    // Final boss sprites from /final-prestige-7-boss/ directory
    { key: 'zrechostikal', path: '/sprites/final_boss.svg', fallback: 'finalBoss', required: false },
    { key: 'zrechostikalFull', path: '/final-prestige-7-boss/full-image.svg', fallback: 'zrechostikal', required: false },
    { key: 'zrechostikalHeadshot', path: '/final-prestige-7-boss/headshot.svg', fallback: 'zrechostikal', required: false },
    { key: 'zrechostikalShootLeft', path: '/final-prestige-7-boss/shooting-from-left.svg', fallback: 'zrechostikal', required: false },
    { key: 'zrechostikalShootRight', path: '/final-prestige-7-boss/shooting-from-right.svg', fallback: 'zrechostikal', required: false },
    
    // Legacy fallbacks (from /sprites/)
    { key: 'finalBoss', path: '/sprites/final_boss.svg', required: true },
    { key: 'miniFinalBoss', path: '/sprites/mini_final_boss.svg', fallback: 'finalBoss', required: false },
    { key: 'mediumFinalBoss', path: '/sprites/medium_final_boss.svg', fallback: 'finalBoss', required: false },
];

/**
 * Mini-Me Sprite Mappings - from /mini-me/
 */
export const MINI_ME_ASSETS: AssetMapping[] = [
    // Mini-me sprites from /mini-me/ directory
    { key: 'miniMeScout', path: '/mini-me/blue-mini-me.svg', required: false },
    { key: 'miniMeGunner', path: '/mini-me/red-mini-me.svg', required: false },
    { key: 'miniMeShield', path: '/mini-me/yellow-mini-me.svg', required: false },
    { key: 'miniMeDecoy', path: '/mini-me/purple-mini-me.svg', required: false },
    { key: 'miniMeCollector', path: '/mini-me/grey-mini-me.svg', required: false },
    { key: 'miniMeStun', path: '/mini-me/black-mini-me.svg', required: false },
    { key: 'miniMeHealer', path: '/mini-me/yellow-mini-me.svg', fallback: 'miniMeShield', required: false },
    
    // Default fallback
    { key: 'miniMeDefault', path: '/mini-me/blue-mini-me.svg', fallback: 'heroDrone', required: false },
    
    // Legacy fallback
    { key: 'sidekick', path: '/sprites/sidekick.svg', fallback: 'miniMeDefault', required: false },
    { key: 'drone', path: '/sprites/drone.svg', fallback: 'miniMeDefault', required: false },
];

/**
 * Bullet Sprite Mappings
 */
export const BULLET_ASSETS: AssetMapping[] = [
    // Hero bullets (tier upgrades) - from /hero-bullet/
    { key: 'bullet', path: '/sprites/green_bullet_1.svg', required: true }, // Tier 1 - legacy fallback
    { key: 'bulletTier1', path: '/hero-bullet/bullet-grade-1.svg', fallback: 'bullet', required: false },
    { key: 'bulletTier2', path: '/hero-bullet/bullet-grade-2.svg', fallback: 'bulletTier1', required: false },
    { key: 'bulletTier3', path: '/hero-bullet/bullet-grade-3.svg', fallback: 'bulletTier2', required: false },
    { key: 'bulletTier4', path: '/hero-bullet/bullet-grade-4.svg', fallback: 'bulletTier3', required: false },
    { key: 'bulletTier5', path: '/hero-bullet/bullet-grade-4.svg', fallback: 'bulletTier4', required: false }, // Use tier 4 as placeholder for tier 5
    
    // Hero bullet explosion
    { key: 'heroBulletExplosion', path: '/hero-bullet/explosion-1.svg', fallback: 'explosionGrade1', required: false },
    
    // Legacy bullet sprites (from /sprites/) - kept as fallbacks
    { key: 'greenBullet1', path: '/sprites/green_bullet_1.svg', required: false },
    { key: 'greenBullet2', path: '/sprites/green_bullet_2.svg', required: false },
    { key: 'yellowBullet', path: '/sprites/yellow_bullet.svg', required: false },
    { key: 'blueBullet', path: '/sprites/blue_bullet.svg', required: false },
    
    // Green enemy bullets - from /green-enemy-bullet/
    { key: 'greenEnemyBullet0', path: '/green-enemy-bullet/bullet-grade-0.svg', fallback: 'greenBullet1', required: false },
    { key: 'greenEnemyBullet0_2', path: '/green-enemy-bullet/bullet-grade-0.2.svg', fallback: 'greenEnemyBullet0', required: false },
    { key: 'greenEnemyBullet0_5', path: '/green-enemy-bullet/bullet-grade-0.5.svg', fallback: 'greenEnemyBullet0', required: false },
    { key: 'greenEnemyBullet1', path: '/green-enemy-bullet/bullet-grade-1.svg', fallback: 'greenEnemyBullet0', required: false },
    { key: 'greenEnemyBullet2', path: '/green-enemy-bullet/bullet-grade-2.svg', fallback: 'greenEnemyBullet1', required: false },
    { key: 'greenEnemyBullet4', path: '/green-enemy-bullet/bullet-grade-4.svg', fallback: 'greenEnemyBullet2', required: false },
    { key: 'greenEnemyBullet5', path: '/green-enemy-bullet/bullet-grade-5.svg', fallback: 'greenEnemyBullet4', required: false },
    { key: 'greenEnemyBullet6', path: '/green-enemy-bullet/bullet-grade-6.svg', fallback: 'greenEnemyBullet5', required: false },
    { key: 'greenEnemyBulletExplosion', path: '/green-enemy-bullet/explosion.svg', fallback: 'heroBulletExplosion', required: false },
    
    // Yellow enemy bullets - from /yellow-enemy-bullet/
    { key: 'yellowEnemyBullet0', path: '/yellow-enemy-bullet/bullet-grade-0.svg', fallback: 'yellowBullet', required: false },
    { key: 'yellowEnemyBullet1', path: '/yellow-enemy-bullet/bullet-grade-1.svg', fallback: 'yellowEnemyBullet0', required: false },
    { key: 'yellowEnemyBullet2', path: '/yellow-enemy-bullet/bullet-grade-2.svg', fallback: 'yellowEnemyBullet1', required: false },
    { key: 'yellowEnemyBullet3', path: '/yellow-enemy-bullet/bullet-grade-3.svg', fallback: 'yellowEnemyBullet2', required: false },
    { key: 'yellowEnemyBullet4', path: '/yellow-enemy-bullet/bullet-grade-4.svg', fallback: 'yellowEnemyBullet3', required: false },
    { key: 'yellowEnemyBullet5', path: '/yellow-enemy-bullet/bullet-grade-5.svg', fallback: 'yellowEnemyBullet4', required: false },
    { key: 'yellowEnemyBulletExplosion', path: '/yellow-enemy-bullet/explosion.svg', fallback: 'heroBulletExplosion', required: false },
    
    // Blue enemy bullets - from /blue-enemy-bullet/
    { key: 'blueEnemyBullet0', path: '/blue-enemy-bullet/bullet-grade-0.svg', fallback: 'blueBullet', required: false },
    { key: 'blueEnemyBullet1', path: '/blue-enemy-bullet/bullet-grade-1.svg', fallback: 'blueEnemyBullet0', required: false },
    { key: 'blueEnemyBullet2', path: '/blue-enemy-bullet/bullet-grade-2.svg', fallback: 'blueEnemyBullet1', required: false },
    { key: 'blueEnemyBullet4', path: '/blue-enemy-bullet/bullet-grade-4.svg', fallback: 'blueEnemyBullet2', required: false },
    { key: 'blueEnemyBullet5', path: '/blue-enemy-bullet/bullet-grade-5.svg', fallback: 'blueEnemyBullet4', required: false },
    { key: 'blueEnemyBulletExplosion', path: '/blue-enemy-bullet/explosion.svg', fallback: 'heroBulletExplosion', required: false },
    
    // Purple enemy bullets - from /purple-enemy-bullet/
    { key: 'purpleEnemyBullet0', path: '/purple-enemy-bullet/bullet-grade-0.svg', fallback: 'yellowBullet', required: false },
    { key: 'purpleEnemyBullet1', path: '/purple-enemy-bullet/bullet-grade-1.svg', fallback: 'purpleEnemyBullet0', required: false },
    { key: 'purpleEnemyBullet2', path: '/purple-enemy-bullet/bullet-grade-2.svg', fallback: 'purpleEnemyBullet1', required: false },
    { key: 'purpleEnemyBullet3', path: '/purple-enemy-bullet/bullet-grade-3.svg', fallback: 'purpleEnemyBullet2', required: false },
    { key: 'purpleEnemyBullet4', path: '/purple-enemy-bullet/bullet-grade-4.svg', fallback: 'purpleEnemyBullet3', required: false },
    { key: 'purpleEnemyBullet5', path: '/purple-enemy-bullet/bullet-grade-5.svg', fallback: 'purpleEnemyBullet4', required: false },
    { key: 'purpleEnemyBulletTeleportal', path: '/purple-enemy-bullet/teleportal.svg', fallback: 'purpleEnemyBullet5', required: false },
    { key: 'purpleEnemyBulletTeleportalExplosion', path: '/purple-enemy-bullet/teleportal-explosion.svg', fallback: 'purpleEnemyBulletExplosion', required: false },
    
    // Red enemy bullets - from /red-enemy-bullet/
    { key: 'redEnemyBullet0', path: '/red-enemy-bullet/bullet-grade-0.svg', fallback: 'greenBullet1', required: false },
    { key: 'redEnemyBullet1', path: '/red-enemy-bullet/bullet-grade-1.svg', fallback: 'redEnemyBullet0', required: false },
    { key: 'redEnemyBullet1_2', path: '/red-enemy-bullet/bullet-grade-1.2.svg', fallback: 'redEnemyBullet1', required: false },
    { key: 'redEnemyBullet2', path: '/red-enemy-bullet/bullet-grade-2.svg', fallback: 'redEnemyBullet1', required: false },
    { key: 'redEnemyBullet2_9', path: '/red-enemy-bullet/bullet-grade-2.9.svg', fallback: 'redEnemyBullet2', required: false },
    { key: 'redEnemyBullet3', path: '/red-enemy-bullet/bullet-grade-3.svg', fallback: 'redEnemyBullet2', required: false },
    { key: 'redEnemyBullet4', path: '/red-enemy-bullet/bullet-grade-4.svg', fallback: 'redEnemyBullet3', required: false },
    { key: 'redEnemyBullet5', path: '/red-enemy-bullet/bullet-grade-5.svg', fallback: 'redEnemyBullet4', required: false },
    { key: 'redEnemyBullet6', path: '/red-enemy-bullet/bullet-grade-6.svg', fallback: 'redEnemyBullet5', required: false },
    { key: 'redEnemyBulletExplosion', path: '/red-enemy-bullet/explosion.svg', fallback: 'heroBulletExplosion', required: false },
    
    // Flame red enemy bullets - from /flame-red-enemy-bullet/
    { key: 'flameRedEnemyBullet0', path: '/flame-red-enemy-bullet/bullet-grade-0.svg', fallback: 'redEnemyBullet0', required: false },
    { key: 'flameRedEnemyBullet0_1', path: '/flame-red-enemy-bullet/bullet-grade-0.1.svg', fallback: 'flameRedEnemyBullet0', required: false },
    { key: 'flameRedEnemyBullet1', path: '/flame-red-enemy-bullet/bullet-grade-1.svg', fallback: 'flameRedEnemyBullet0', required: false },
    { key: 'flameRedEnemyBullet2', path: '/flame-red-enemy-bullet/bullet-grade-2.svg', fallback: 'flameRedEnemyBullet1', required: false },
    { key: 'flameRedEnemyBullet3', path: '/flame-red-enemy-bullet/bullet-grade-3.svg', fallback: 'flameRedEnemyBullet2', required: false },
    { key: 'flameRedEnemyBullet4', path: '/flame-red-enemy-bullet/bullet-grade-4.svg', fallback: 'flameRedEnemyBullet3', required: false },
    { key: 'flameRedEnemyBullet5', path: '/flame-red-enemy-bullet/bullet-grade-5.svg', fallback: 'flameRedEnemyBullet4', required: false },
    { key: 'flameRedEnemyBullet5_1', path: '/flame-red-enemy-bullet/bullet-grade-5.1.svg', fallback: 'flameRedEnemyBullet5', required: false },
    { key: 'flameRedEnemyBullet6', path: '/flame-red-enemy-bullet/bullet-grade-6.svg', fallback: 'flameRedEnemyBullet5', required: false },
    { key: 'flameRedEnemyBulletExplosion', path: '/flame-red-enemy-bullet/explosion.svg', fallback: 'redEnemyBulletExplosion', required: false },
    { key: 'flameRedEnemyBulletFire', path: '/flame-red-enemy-bullet/fire.svg', fallback: 'flameRedEnemyBullet6', required: false },
];

/**
 * Power-Up Sprite Mappings - from /powerups/
 */
export const POWERUP_ASSETS: AssetMapping[] = [
    // Powerup directory assets (primary)
    { key: 'powerupCoin', path: '/powerups/coin-powerup.svg', required: false },
    { key: 'powerupHealth', path: '/powerups/health-powerup.svg', required: false },
    { key: 'powerupShield', path: '/powerups/shield-powerup.svg', required: false },
    { key: 'powerupBomb', path: '/powerups/bomb-powerup.svg', required: false },
    { key: 'powerupMiniMe', path: '/powerups/mini-me-powerup.svg', required: false },
    { key: 'powerupPrestige', path: '/powerups/prestige-star-powerup.svg', required: false },
    { key: 'powerupPrimeSentinel', path: '/powerups/prime-sentinel-help.svg', required: false },
    { key: 'powerupComboRate', path: '/powerups/comborate-powerup.svg', required: false },
    { key: 'powerupCrown', path: '/powerups/crown-powerup.svg', required: false },
    { key: 'powerupBulletDamage', path: '/powerups/increase-bullet-damage-powerup.svg', required: false },
    { key: 'powerupBulletFireRate', path: '/powerups/increase-bullet-firerate-powerip.svg', required: false },
    { key: 'powerupInvincibility', path: '/powerups/invincibitlity-poweup.svg', required: false },
    
    // Legacy power-up sprites (from /sprites/) - fallbacks
    { key: 'power_up', path: '/sprites/power_up.svg', fallback: 'powerupShield', required: true },
    { key: 'power_up_2', path: '/sprites/power_up_2.svg', fallback: 'power_up', required: false },
    { key: 'orb', path: '/sprites/orb.svg', fallback: 'powerupCoin', required: false },
    { key: 'orbGlow', path: '/sprites/orb_glow.svg', fallback: 'orb', required: false },
];

/**
 * Explosion/Fire Sprite Mappings - from /explosions/
 */
export const EXPLOSION_ASSETS: AssetMapping[] = [
    // Explosion directory assets (primary)
    { key: 'explosionGrade0', path: '/explosions/explosion-grade-0.svg', required: false },
    { key: 'explosionGrade1', path: '/explosions/explosion-grade-1.svg', fallback: 'explosionGrade0', required: false },
    { key: 'explosionGrade3', path: '/explosions/explosion-grade-3.svg', fallback: 'explosionGrade1', required: false },
    { key: 'explosionGrade4', path: '/explosions/explosion-grade-4.svg', fallback: 'explosionGrade3', required: false },
    
    // Legacy fire sprites (from /sprites/) - fallbacks
    { key: 'smallFire', path: '/sprites/small_fire.svg', fallback: 'explosionGrade0', required: false },
    { key: 'mediumFire', path: '/sprites/medium_fire.svg', fallback: 'explosionGrade1', required: false },
    { key: 'bigFire', path: '/sprites/big_fire.svg', fallback: 'explosionGrade3', required: false },
    { key: 'greenFire', path: '/sprites/green_fire.svg', fallback: 'explosionGrade0', required: false },
];

/**
 * UI/Icon Sprite Mappings - from /icons/
 */
export const UI_ASSETS: AssetMapping[] = [
    // Character/hero UI
    { key: 'whiteSentinel', path: '/white-sentinel.png', required: false },
    { key: 'whiteSentinelFull', path: '/white-sentinel-full.svg', fallback: 'whiteSentinel', required: false },
    { key: 'heroHeadshot', path: '/hero-headshot.svg', fallback: 'hero', required: false },
    
    // Icons from /icons/ directory
    { key: 'iconTrophy', path: '/icons/trophy-icon.svg', required: false },
    { key: 'iconTimer', path: '/icons/timer-icon.svg', required: false },
    { key: 'iconTarget', path: '/icons/target-icon.svg', required: false },
    { key: 'iconTargetNoBg', path: '/icons/target-no-bg-icon.svg', fallback: 'iconTarget', required: false },
    { key: 'iconStar', path: '/icons/star-icon.svg', required: false },
    { key: 'iconStarBadge', path: '/icons/star-badge-icon.svg', fallback: 'iconStar', required: false },
    { key: 'iconBadge', path: '/icons/badge-icon.svg', required: false },
    { key: 'iconHealth', path: '/icons/health-icon.svg', required: false },
    { key: 'iconGun', path: '/icons/gun-icon.svg', required: false },
    { key: 'iconGunScope', path: '/icons/gun-scope-icon.svg', fallback: 'iconGun', required: false },
    { key: 'iconChampion', path: '/icons/champion-cup-icon.svg', required: false },
    { key: 'iconAccuracy', path: '/icons/accuracy-icon.svg', required: false },
    { key: 'iconClock', path: '/icons/clock-icon.svg', fallback: 'iconTimer', required: false },
    { key: 'iconCharts', path: '/icons/charts-icon.svg', required: false },
    { key: 'iconProgress', path: '/icons/progress-icon.svg', required: false },
    { key: 'iconPower', path: '/icons/power-icon.svg', required: false },
    { key: 'iconRocket', path: '/icons/rocket-icon.svg', required: false },
    { key: 'iconSkull', path: '/icons/skull-icon.svg', required: false },
    { key: 'iconDeathSkull', path: '/icons/death-skull.svg', fallback: 'iconSkull', required: false },
    { key: 'iconDanger', path: '/icons/danger-icon.svg', required: false },
    { key: 'iconHazard', path: '/icons/hazard-icon.svg', fallback: 'iconDanger', required: false },
    { key: 'iconHouse', path: '/icons/house-icon.svg', required: false },
    { key: 'iconSmallHouse', path: '/icons/small-house-no-bg-icon.svg', fallback: 'iconHouse', required: false },
    { key: 'iconHeroWeapon', path: '/icons/hero-hold-weapon-icon.svg', fallback: 'iconGun', required: false },
    { key: 'iconScale', path: '/icons/scale-icon.svg', required: false },
    { key: 'iconMeter', path: '/icons/meter-icon.svg', required: false },
    { key: 'iconPercent', path: '/icons/percent-icon.svg', required: false },
    { key: 'iconIncreaseTwice', path: '/icons/increase-twice-icon.svg', required: false },
    { key: 'iconPackedBricks', path: '/icons/packed-bricks-icon.svg', required: false },
    { key: 'icon3Bricks', path: '/icons/3-bricks-icon.svg', fallback: 'iconPackedBricks', required: false },
    { key: 'iconApostrophe', path: '/icons/apostrophe-icon.svg', required: false },
];

/**
 * Layer Background Mappings
 */
export const LAYER_BACKGROUND_ASSETS: AssetMapping[] = [
    { key: 'layerFirewall', path: '/scenes/firewall-layer.png', required: false },
    { key: 'layerSecurityCore', path: '/scenes/security-core-layer.png', required: false },
    { key: 'layerCorruptedAI', path: '/scenes/corrupted-ai-layer.png', required: false },
    { key: 'layerKernelBreach', path: '/scenes/kernel-breach-layer.png', required: false },
    { key: 'layerSystemCollapse', path: '/scenes/system-collapse-layer.png', required: false },
    { key: 'layerPrestige', path: '/scenes/prestige-layer.png', required: false },
];

/**
 * Rank Badge Mappings
 * Note: Badge sprites may not exist yet - using icon fallbacks
 */
export const BADGE_ASSETS: AssetMapping[] = [
    // Rank badges (1-18) - using icon badge as placeholder until actual badges are created
    { key: 'badge_1', path: '/icons/badge-icon.svg', required: false },
    { key: 'badge_2', path: '/icons/badge-icon.svg', required: false },
    { key: 'badge_3', path: '/icons/badge-icon.svg', required: false },
    { key: 'badge_4', path: '/icons/badge-icon.svg', required: false },
    { key: 'badge_5', path: '/icons/badge-icon.svg', required: false },
    { key: 'badge_6', path: '/icons/badge-icon.svg', required: false },
    { key: 'badge_7', path: '/icons/badge-icon.svg', required: false },
    { key: 'badge_8', path: '/icons/badge-icon.svg', required: false },
    { key: 'badge_9', path: '/icons/badge-icon.svg', required: false },
    { key: 'badge_10', path: '/icons/badge-icon.svg', required: false },
    { key: 'badge_11', path: '/icons/badge-icon.svg', required: false },
    { key: 'badge_12', path: '/icons/badge-icon.svg', required: false },
    { key: 'badge_13', path: '/icons/badge-icon.svg', required: false },
    { key: 'badge_14', path: '/icons/badge-icon.svg', required: false },
    { key: 'badge_15', path: '/icons/badge-icon.svg', required: false },
    { key: 'badge_16', path: '/icons/badge-icon.svg', required: false },
    { key: 'badge_17', path: '/icons/badge-icon.svg', required: false },
    { key: 'badge_18', path: '/icons/badge-icon.svg', required: false },
    { key: 'badge_prime_sentinel', path: '/icons/champion-cup-icon.svg', fallback: 'iconChampion', required: false },
];

/**
 * All asset mappings combined
 */
export const ALL_ASSETS: AssetMapping[] = [
    ...AVATAR_ASSETS,
    ...ENEMY_ASSETS,
    ...FINAL_BOSS_ASSETS,
    ...MINI_ME_ASSETS,
    ...BULLET_ASSETS,
    ...POWERUP_ASSETS,
    ...EXPLOSION_ASSETS,
    ...UI_ASSETS,
    ...LAYER_BACKGROUND_ASSETS,
    ...BADGE_ASSETS,
];

/**
 * Get asset path by key
 */
export function getAssetPath(key: string): string | null {
    const asset = ALL_ASSETS.find(a => a.key === key);
    return asset?.path || null;
}

/**
 * Get fallback asset key
 */
export function getFallbackAsset(key: string): string | null {
    const asset = ALL_ASSETS.find(a => a.key === key);
    return asset?.fallback || null;
}

/**
 * Check if asset is required
 */
export function isAssetRequired(key: string): boolean {
    const asset = ALL_ASSETS.find(a => a.key === key);
    return asset?.required || false;
}
