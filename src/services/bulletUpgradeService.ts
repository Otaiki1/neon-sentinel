/**
 * Bullet Upgrade Service - Manages bullet tier progression
 * 
 * Handles bullet upgrades based on prestige level
 */

export interface BulletTier {
    tier: number;
    name: string;
    spriteKey: string;
    damageMultiplier: number;
    speedMultiplier: number;
    unlockPrestige: number;
    effects: {
        trail: boolean;
        glow: boolean;
        piercing: number; // 0 = no piercing, 1+ = pierce count, -1 = infinite
    };
}

export const BULLET_TIERS: BulletTier[] = [
    {
        tier: 1,
        name: 'Standard Bullet',
        spriteKey: 'bullet', // Default bullet sprite
        damageMultiplier: 1.0,
        speedMultiplier: 1.0,
        unlockPrestige: 0,
        effects: {
            trail: false,
            glow: false,
            piercing: 0,
        },
    },
    {
        tier: 2,
        name: 'Enhanced Bullet',
        spriteKey: 'bulletTier2',
        damageMultiplier: 1.2,
        speedMultiplier: 1.1,
        unlockPrestige: 1,
        effects: {
            trail: true,
            glow: true,
            piercing: 0,
        },
    },
    {
        tier: 3,
        name: 'Accelerated Bullet',
        spriteKey: 'bulletTier3',
        damageMultiplier: 1.4,
        speedMultiplier: 1.3,
        unlockPrestige: 3,
        effects: {
            trail: true,
            glow: true,
            piercing: 0,
        },
    },
    {
        tier: 4,
        name: 'Plasma Bullet',
        spriteKey: 'bulletTier4',
        damageMultiplier: 1.6,
        speedMultiplier: 1.5,
        unlockPrestige: 5,
        effects: {
            trail: true,
            glow: true,
            piercing: 2, // Pierce through 2 enemies
        },
    },
    {
        tier: 5,
        name: 'Transcendent Bullet',
        spriteKey: 'bulletTier5',
        damageMultiplier: 2.0,
        speedMultiplier: 1.8,
        unlockPrestige: 7,
        effects: {
            trail: true,
            glow: true,
            piercing: -1, // Infinite piercing
        },
    },
];

/**
 * Get current bullet tier based on prestige level
 */
export function getCurrentBulletTier(prestige: number): BulletTier {
    // Find highest unlocked tier
    let currentTier = BULLET_TIERS[0]; // Default to tier 1
    
    for (const tier of BULLET_TIERS) {
        if (prestige >= tier.unlockPrestige) {
            currentTier = tier;
        } else {
            break;
        }
    }
    
    return currentTier;
}

/**
 * Get bullet tier by tier number
 */
export function getBulletTier(tier: number): BulletTier | null {
    return BULLET_TIERS.find(t => t.tier === tier) || null;
}

/**
 * Get bullet stats for a specific tier
 */
export function getBulletStats(tier: number): {
    damageMultiplier: number;
    speedMultiplier: number;
    spriteKey: string;
    effects: BulletTier['effects'];
} | null {
    const bulletTier = getBulletTier(tier);
    if (!bulletTier) {
        return null;
    }
    
    return {
        damageMultiplier: bulletTier.damageMultiplier,
        speedMultiplier: bulletTier.speedMultiplier,
        spriteKey: bulletTier.spriteKey,
        effects: bulletTier.effects,
    };
}

/**
 * Check if a tier is unlocked
 */
export function isTierUnlocked(tier: number, prestige: number): boolean {
    const bulletTier = getBulletTier(tier);
    if (!bulletTier) {
        return false;
    }
    
    return prestige >= bulletTier.unlockPrestige;
}

/**
 * Get prestige required to unlock a tier
 */
export function getTierUnlockPrestige(tier: number): number | null {
    const bulletTier = getBulletTier(tier);
    return bulletTier ? bulletTier.unlockPrestige : null;
}

/**
 * Get next unlockable tier
 */
export function getNextTier(prestige: number): BulletTier | null {
    for (const tier of BULLET_TIERS) {
        if (prestige < tier.unlockPrestige) {
            return tier;
        }
    }
    return null; // All tiers unlocked
}

/**
 * Get all unlocked tiers
 */
export function getUnlockedTiers(prestige: number): BulletTier[] {
    return BULLET_TIERS.filter(tier => prestige >= tier.unlockPrestige);
}

/**
 * Get tier progress (current tier / max tier)
 */
export function getTierProgress(prestige: number): {
    currentTier: number;
    maxTier: number;
    progress: number; // 0-1
    nextTier: BulletTier | null;
} {
    const currentTier = getCurrentBulletTier(prestige);
    const maxTier = BULLET_TIERS.length;
    const nextTier = getNextTier(prestige);
    
    return {
        currentTier: currentTier.tier,
        maxTier,
        progress: currentTier.tier / maxTier,
        nextTier,
    };
}
