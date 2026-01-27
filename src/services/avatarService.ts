/**
 * Avatar Service - Manages avatar purchases, unlocks, and selection
 * 
 * Handles prestige-based avatar progression and stat bonuses
 */

import { getAvailableCoins, spendCoins } from './coinService';
import { AVATAR_CONFIG_FLAT as AVATAR_CONFIG } from '../game/config';

export type AvatarId = keyof typeof AVATAR_CONFIG;

const PURCHASED_AVATARS_KEY = 'neonSentinel_purchasedAvatars';
const ACTIVE_AVATAR_KEY = 'neonSentinel_activeAvatarId';

/**
 * Check if final boss has been defeated
 */
function isFinalBossDefeated(): boolean {
    try {
        const stored = localStorage.getItem('neonSentinel_finalBossDefeated');
        return stored === 'true';
    } catch {
        return false;
    }
}

/**
 * Mark final boss as defeated
 */
export function markFinalBossDefeated(): void {
    try {
        localStorage.setItem('neonSentinel_finalBossDefeated', 'true');
    } catch (error) {
        console.error('Error marking final boss as defeated:', error);
    }
}

/**
 * Get all available avatars for a given prestige level
 */
export function getAvailableAvatars(prestigeLevel: number): AvatarId[] {
    const finalBossDefeated = isFinalBossDefeated();
    
    return Object.keys(AVATAR_CONFIG).filter((avatarId) => {
        const avatar = AVATAR_CONFIG[avatarId as AvatarId];
        
        // Check prestige requirement
        if (avatar.unlockPrestige > prestigeLevel) {
            return false;
        }
        
        // Check final boss requirement for transcendent_form
        if ((avatar as any).requiresFinalBoss && !finalBossDefeated) {
            return false;
        }
        
        return true;
    }) as AvatarId[];
}

/**
 * Get all purchased avatars
 */
export function getPurchasedAvatars(): AvatarId[] {
    try {
        const stored = localStorage.getItem(PURCHASED_AVATARS_KEY);
        if (!stored) {
            // Default avatar is always owned
            return ['default_sentinel'];
        }
        const parsed = JSON.parse(stored) as string[];
        // Ensure default is always included
        if (!parsed.includes('default_sentinel')) {
            parsed.push('default_sentinel');
        }
        return parsed as AvatarId[];
    } catch (error) {
        console.error('Error loading purchased avatars:', error);
        return ['default_sentinel'];
    }
}

/**
 * Check if an avatar is unlocked (purchased and requirements met)
 */
export function isAvatarUnlocked(avatarId: AvatarId): boolean {
    const purchased = getPurchasedAvatars();
    if (!purchased.includes(avatarId)) {
        return false;
    }
    
    // Check final boss requirement
    const avatar = AVATAR_CONFIG[avatarId];
    if ((avatar as any)?.requiresFinalBoss && !isFinalBossDefeated()) {
        return false;
    }
    
    return true;
}

/**
 * Purchase an avatar
 */
export function purchaseAvatar(avatarId: AvatarId): boolean {
    const avatar = AVATAR_CONFIG[avatarId];
    
    if (!avatar) {
        console.error(`Avatar not found: ${avatarId}`);
        return false;
    }
    
    // Check if already purchased
    if (isAvatarUnlocked(avatarId)) {
        return true;
    }
    
    // Check if player has enough coins
    const availableCoins = getAvailableCoins();
    if (availableCoins < avatar.unlockCostCoins) {
        return false;
    }
    
    // Deduct coins
    const success = spendCoins(avatar.unlockCostCoins, 'avatar');
    if (!success) {
        return false;
    }
    
    // Add to purchased list
    const purchased = getPurchasedAvatars();
    purchased.push(avatarId);
    savePurchasedAvatars(purchased);
    
    return true;
}

/**
 * Save purchased avatars to localStorage
 */
function savePurchasedAvatars(avatars: AvatarId[]): void {
    try {
        localStorage.setItem(PURCHASED_AVATARS_KEY, JSON.stringify(avatars));
    } catch (error) {
        console.error('Error saving purchased avatars:', error);
    }
}

/**
 * Set the active avatar
 */
export function setActiveAvatar(avatarId: AvatarId): boolean {
    // Verify avatar is unlocked
    if (!isAvatarUnlocked(avatarId)) {
        console.warn(`Cannot set active avatar: ${avatarId} is not unlocked`);
        return false;
    }
    
    try {
        localStorage.setItem(ACTIVE_AVATAR_KEY, avatarId);
        return true;
    } catch (error) {
        console.error('Error saving active avatar:', error);
        return false;
    }
}

/**
 * Get the currently active avatar
 */
export function getActiveAvatar(): AvatarId {
    try {
        const stored = localStorage.getItem(ACTIVE_AVATAR_KEY);
        if (!stored) {
            // Default to default_sentinel
            return 'default_sentinel';
        }
        
        // Verify the stored avatar is still unlocked
        const avatarId = stored as AvatarId;
        if (isAvatarUnlocked(avatarId)) {
            return avatarId;
        }
        
        // If stored avatar is no longer available, default to default_sentinel
        return 'default_sentinel';
    } catch (error) {
        console.error('Error loading active avatar:', error);
        return 'default_sentinel';
    }
}

/**
 * Get avatar stats (multipliers)
 */
export function getAvatarStats(avatarId: AvatarId): {
    speedMultiplier: number;
    fireRateMultiplier: number;
    healthMultiplier: number;
    damageMultiplier: number;
} {
    const avatar = AVATAR_CONFIG[avatarId];
    
    if (!avatar) {
        console.warn(`Avatar not found: ${avatarId}, using default stats`);
        return {
            speedMultiplier: 1.0,
            fireRateMultiplier: 1.0,
            healthMultiplier: 1.0,
            damageMultiplier: 1.0,
        };
    }
    
    return {
        speedMultiplier: avatar.stats.speedMult,
        fireRateMultiplier: avatar.stats.fireRateMult,
        healthMultiplier: avatar.stats.healthMult,
        damageMultiplier: avatar.stats.damageMult || 1.0,
    };
}

/**
 * Get current active avatar stats
 */
export function getActiveAvatarStats() {
    const activeAvatar = getActiveAvatar();
    return getAvatarStats(activeAvatar);
}

/**
 * Apply avatar stats to base stats
 */
export function applyAvatarStats(
    baseStats: {
        speed: number;
        fireRate: number;
        health: number;
        damage?: number;
    },
    avatarStats: {
        speedMultiplier: number;
        fireRateMultiplier: number;
        healthMultiplier: number;
        damageMultiplier: number;
    }
): {
    speed: number;
    fireRate: number;
    health: number;
    damage: number;
} {
    return {
        speed: baseStats.speed * avatarStats.speedMultiplier,
        fireRate: baseStats.fireRate / avatarStats.fireRateMultiplier, // Lower is faster
        health: baseStats.health * avatarStats.healthMultiplier,
        damage: (baseStats.damage || 1) * avatarStats.damageMultiplier,
    };
}

/**
 * Get avatar configuration
 */
export function getAvatarConfig(avatarId: AvatarId) {
    return AVATAR_CONFIG[avatarId];
}

/**
 * Get all avatars with their unlock status
 */
export function getAllAvatarsWithStatus(prestigeLevel: number): Array<{
    id: AvatarId;
    config: typeof AVATAR_CONFIG[AvatarId];
    isUnlocked: boolean;
    isPurchased: boolean;
    canAfford: boolean;
    requirementsMet: boolean;
}> {
    const purchased = getPurchasedAvatars();
    const availableCoins = getAvailableCoins();
    const finalBossDefeated = isFinalBossDefeated();
    
    return Object.entries(AVATAR_CONFIG).map(([id, config]) => {
        const avatarId = id as AvatarId;
        const isPurchased = purchased.includes(avatarId);
        const canUnlock = config.unlockPrestige <= prestigeLevel;
        const finalBossRequirementMet = !(config as any).requiresFinalBoss || finalBossDefeated;
        const requirementsMet = canUnlock && finalBossRequirementMet;
        const canAfford = requirementsMet && availableCoins >= config.unlockCostCoins && !isPurchased;
        
        return {
            id: avatarId,
            config,
            isUnlocked: isPurchased && requirementsMet,
            isPurchased,
            canAfford,
            requirementsMet,
        };
    });
}
