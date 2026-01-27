/**
 * Enemy Service - Manages enemy progression, naming, and sprite mapping
 * 
 * Handles enemy variant selection based on prestige level
 */

export type EnemyColor = 'green' | 'yellow' | 'blue' | 'purple';
export type EnemyType = 'pawn' | 'boss';

export interface EnemyVariant {
    spriteKey: string;
    displayName: string;
    variantNumber: number;
}

export interface EnemyStats {
    health: number;
    speed: number;
    points: number;
}

/**
 * Sprite mapping configuration
 */
const ENEMY_SPRITE_MAP = {
    green: {
        pawn: {
            prestige0_1: 'greenPawn1',
            prestige2_3: 'greenPawn2',
            prestige4_5: 'greenPawn3',
            prestige6: 'greenPawnCorrupted',
        },
        boss: {
            prestige0_1: 'greenBoss1',
            prestige2_3: 'greenBoss2',
            prestige4_5: 'greenBoss3',
            prestige6: 'greenBossCorrupted',
        },
    },
    yellow: {
        pawn: {
            prestige0_1: 'yellowRoutine1',
            prestige2_3: 'yellowRoutine2',
            prestige4_5: 'yellowRoutine3',
            prestige6: 'yellowRoutineCorrupted',
        },
        boss: {
            prestige0_1: 'yellowBoss1',
            prestige2_3: 'yellowBoss2',
            prestige4_5: 'yellowFinalBoss',
            prestige6: 'yellowFinalBossCorrupted',
        },
    },
    blue: {
        pawn: {
            prestige0_1: 'blueBot1',
            prestige2_3: 'blueBot2',
            prestige4_5: 'blueBot3',
            prestige6: 'blueBotCorrupted',
        },
        boss: {
            prestige0_1: 'blueBoss1',
            prestige2_3: 'blueBoss2',
            prestige4_5: 'blueBoss3',
            prestige6: 'blueBossCorrupted',
        },
    },
    purple: {
        pawn: {
            prestige0_1: 'purpleCore1',
            prestige2_3: 'purpleCore2',
            prestige4_5: 'purpleCore3',
            prestige6: 'purpleCoreCorrupted',
        },
        boss: {
            prestige0_1: 'purpleBoss1',
            prestige2_3: 'purpleBoss2',
            prestige4_5: 'purpleBoss3',
            prestige6: 'purpleBossCorrupted',
        },
    },
} as const;

/**
 * Display name mapping
 */
const ENEMY_DISPLAY_NAMES = {
    green: {
        pawn: {
            prestige0_1: 'Green Pawn',
            prestige2_3: 'Jade Sentinel',
            prestige4_5: 'Emerald Vanguard',
            prestige6: 'Abyssal Fragment',
        },
        boss: {
            prestige0_1: 'Green Guardian 1',
            prestige2_3: 'Jade Guardian 2',
            prestige4_5: 'Emerald Guardian 3',
            prestige6: 'Abyssal Overlord',
        },
    },
    yellow: {
        pawn: {
            prestige0_1: 'Yellow Routine',
            prestige2_3: 'Amber Striker',
            prestige4_5: 'Golden Assault',
            prestige6: 'Corrupted Sentinel',
        },
        boss: {
            prestige0_1: 'Yellow Sentinel 1',
            prestige2_3: 'Amber Sentinel 2',
            prestige4_5: 'Golden Overlord',
            prestige6: 'Corrupted Prime',
        },
    },
    blue: {
        pawn: {
            prestige0_1: 'Blue Bot',
            prestige2_3: 'Cyan Enforcer',
            prestige4_5: 'Azure Guardian',
            prestige6: 'Void Entity',
        },
        boss: {
            prestige0_1: 'Blue Hijack-Core 1',
            prestige2_3: 'Cyan Command 2',
            prestige4_5: 'Azure Authority 3',
            prestige6: 'Void Entity Prime',
        },
    },
    purple: {
        pawn: {
            prestige0_1: 'Purple Core',
            prestige2_3: 'Violet Intelligence',
            prestige4_5: 'Magenta Overlord',
            prestige6: 'Infernal Mind',
        },
        boss: {
            prestige0_1: 'Purple Core-Emperor 1',
            prestige2_3: 'Violet Intellect 2',
            prestige4_5: 'Magenta Sovereign 3',
            prestige6: 'Infernal Overlord',
        },
    },
} as const;

/**
 * Get prestige variant key
 */
function getPrestigeVariantKey(prestige: number): 'prestige0_1' | 'prestige2_3' | 'prestige4_5' | 'prestige6' {
    if (prestige <= 1) {
        return 'prestige0_1';
    } else if (prestige <= 3) {
        return 'prestige2_3';
    } else if (prestige <= 5) {
        return 'prestige4_5';
    } else {
        return 'prestige6';
    }
}

/**
 * Get enemy variant number (1-4)
 */
export function getEnemyVariant(prestige: number): number {
    if (prestige <= 1) return 1;
    if (prestige <= 3) return 2;
    if (prestige <= 5) return 3;
    return 4; // Corrupted variant
}

/**
 * Get enemy sprite key based on type, prestige, and boss status
 */
export function getEnemySpriteKey(
    color: EnemyColor,
    prestige: number,
    isBoss: boolean = false
): string {
    const type: EnemyType = isBoss ? 'boss' : 'pawn';
    const variantKey = getPrestigeVariantKey(prestige);
    
    // Special handling for Layer 5 and Layer 6 bosses
    // Layer 5 wraps to green, Layer 6 wraps to yellow (prestige boss)
    // This will be handled in GameScene based on layer
    
    const spriteMap = ENEMY_SPRITE_MAP[color];
    if (!spriteMap) {
        // Fallback to green if color not found
        return ENEMY_SPRITE_MAP.green[type][variantKey];
    }
    
    return spriteMap[type][variantKey];
}

/**
 * Get enemy display name based on type and prestige
 */
export function getEnemyDisplayName(
    color: EnemyColor,
    prestige: number,
    isBoss: boolean = false
): string {
    const type: EnemyType = isBoss ? 'boss' : 'pawn';
    const variantKey = getPrestigeVariantKey(prestige);
    
    const nameMap = ENEMY_DISPLAY_NAMES[color];
    if (!nameMap) {
        // Fallback to green if color not found
        return ENEMY_DISPLAY_NAMES.green[type][variantKey];
    }
    
    return nameMap[type][variantKey];
}

/**
 * Get scaled enemy stats based on prestige
 */
export function getEnemyStats(
    baseHealth: number,
    baseSpeed: number,
    basePoints: number,
    prestige: number,
    layerHealthMultiplier: number = 1.0
): EnemyStats {
    // Health scaling: baseHealth * layerMultiplier * (1.0 + 0.2 * prestige)
    const prestigeHealthFactor = 1.0 + (0.2 * prestige);
    const health = baseHealth * layerHealthMultiplier * prestigeHealthFactor;
    
    // Speed scaling: baseSpeed * (1.0 + 0.05 * prestige)
    const speed = baseSpeed * (1.0 + 0.05 * prestige);
    
    // Points scaling: basePoints * (1.0 + 0.1 * prestige)
    const points = basePoints * (1.0 + 0.1 * prestige);
    
    return {
        health: Math.round(health * 10) / 10, // Round to 1 decimal
        speed: Math.round(speed),
        points: Math.round(points),
    };
}

/**
 * Get graduation boss name based on layer and prestige
 */
export function getGraduationBossName(layer: number, prestige: number): string {
    // Layer 5 wraps to green, Layer 6 wraps to yellow (prestige boss)
    if (layer === 5) {
        const variantKey = getPrestigeVariantKey(prestige);
        const names = {
            prestige0_1: 'Neon Guardian 1',
            prestige2_3: 'System Protector 2',
            prestige4_5: 'Terminal Sentinel 3',
            prestige6: 'Swarm Executor',
        };
        return names[variantKey];
    } else if (layer === 6) {
        // Prestige boss names
        if (prestige === 0) return 'Prestige Guardian I';
        if (prestige === 1) return 'Prestige Sentinel II';
        if (prestige === 2) return 'Prestige Overlord III';
        if (prestige === 3) return 'Prestige Emperor IV';
        if (prestige === 4) return 'Prestige Sovereign V';
        if (prestige === 5) return 'Prestige Deity VI';
        if (prestige === 6) return 'Prestige Tyrant VII';
        if (prestige === 7) return 'Prestige Tyrant VII';
        if (prestige === 8) return 'Zrechostikal - The Swarm Overlord';
        return 'Prestige Guardian I';
    }
    
    // Layers 1-4 use color-based naming
    const colorMap: Record<number, EnemyColor> = {
        1: 'green',
        2: 'yellow',
        3: 'blue',
        4: 'purple',
    };
    
    const color = colorMap[layer] || 'green';
    return getEnemyDisplayName(color, prestige, true);
}

/**
 * Get graduation boss sprite key based on layer and prestige
 */
export function getGraduationBossSpriteKey(layer: number, prestige: number): string {
    // Layer 5 wraps to green
    if (layer === 5) {
        return getEnemySpriteKey('green', prestige, true);
    }
    
    // Layer 6 wraps to yellow (prestige boss)
    if (layer === 6) {
        // Special handling for final boss (Prestige 8)
        if (prestige === 8) {
            return 'zrechostikal'; // Special final boss sprite
        }
        return getEnemySpriteKey('yellow', prestige, true);
    }
    
    // Layers 1-4 use color-based sprites
    const colorMap: Record<number, EnemyColor> = {
        1: 'green',
        2: 'yellow',
        3: 'blue',
        4: 'purple',
    };
    
    const color = colorMap[layer] || 'green';
    return getEnemySpriteKey(color, prestige, true);
}

/**
 * Get enemy color from enemy type string
 */
export function getEnemyColorFromType(enemyType: string): EnemyColor {
    if (enemyType.includes('green')) return 'green';
    if (enemyType.includes('yellow')) return 'yellow';
    if (enemyType.includes('blue')) return 'blue';
    if (enemyType.includes('purple')) return 'purple';
    return 'green'; // Default fallback
}

/**
 * Get all enemy variant info
 */
export function getEnemyVariantInfo(
    color: EnemyColor,
    prestige: number,
    isBoss: boolean = false
): EnemyVariant {
    const variantNumber = getEnemyVariant(prestige);
    const spriteKey = getEnemySpriteKey(color, prestige, isBoss);
    const displayName = getEnemyDisplayName(color, prestige, isBoss);
    
    return {
        spriteKey,
        displayName,
        variantNumber,
    };
}
