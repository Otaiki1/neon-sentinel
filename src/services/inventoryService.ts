/**
 * Inventory Service - Manages Mini-Me Companion inventory
 * 
 * Handles storage, purchase, and activation of mini-me companions
 */

export type MiniMeType = 
    | 'scout'
    | 'gunner'
    | 'shield'
    | 'decoy'
    | 'collector'
    | 'stun'
    | 'healer';

export interface MiniMeInventory {
    scout: number;
    gunner: number;
    shield: number;
    decoy: number;
    collector: number;
    stun: number;
    healer: number;
}

const STORAGE_KEY = 'neonSentinel_miniMeInventory';
const MAX_PER_TYPE = 20;

const DEFAULT_INVENTORY: MiniMeInventory = {
    scout: 0,
    gunner: 0,
    shield: 0,
    decoy: 0,
    collector: 0,
    stun: 0,
    healer: 0,
};

/**
 * Load inventory from storage
 */
function loadInventory(): MiniMeInventory {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            return { ...DEFAULT_INVENTORY };
        }
        const parsed = JSON.parse(stored) as MiniMeInventory;
        // Ensure all types exist
        return {
            ...DEFAULT_INVENTORY,
            ...parsed,
        };
    } catch (error) {
        console.error('Error loading inventory:', error);
        return { ...DEFAULT_INVENTORY };
    }
}

/**
 * Save inventory to storage
 */
function saveInventory(inventory: MiniMeInventory): void {
    try {
        // Cap each type at MAX_PER_TYPE
        const capped: MiniMeInventory = {
            scout: Math.min(inventory.scout, MAX_PER_TYPE),
            gunner: Math.min(inventory.gunner, MAX_PER_TYPE),
            shield: Math.min(inventory.shield, MAX_PER_TYPE),
            decoy: Math.min(inventory.decoy, MAX_PER_TYPE),
            collector: Math.min(inventory.collector, MAX_PER_TYPE),
            stun: Math.min(inventory.stun, MAX_PER_TYPE),
            healer: Math.min(inventory.healer, MAX_PER_TYPE),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(capped));
    } catch (error) {
        console.error('Error saving inventory:', error);
    }
}

/**
 * Get current inventory
 */
export function getInventory(): MiniMeInventory {
    return loadInventory();
}

/**
 * Add mini-me to inventory
 */
export function addMiniMe(type: MiniMeType, quantity: number = 1): boolean {
    const inventory = loadInventory();
    const current = inventory[type];
    
    if (current >= MAX_PER_TYPE) {
        return false; // Already at max
    }
    
    inventory[type] = Math.min(current + quantity, MAX_PER_TYPE);
    saveInventory(inventory);
    return true;
}

/**
 * Use/consume mini-me from inventory
 */
export function useMiniMe(type: MiniMeType, quantity: number = 1): boolean {
    const inventory = loadInventory();
    
    if (inventory[type] < quantity) {
        return false; // Not enough in inventory
    }
    
    inventory[type] = Math.max(0, inventory[type] - quantity);
    saveInventory(inventory);
    return true;
}

/**
 * Get count of specific mini-me type
 */
export function getMiniMeCount(type: MiniMeType): number {
    const inventory = loadInventory();
    return inventory[type];
}

/**
 * Check if mini-me can be activated
 * Returns true if inventory has at least 1 and player has enough coins
 */
export function canActivate(type: MiniMeType, availableCoins: number): boolean {
    const inventory = loadInventory();
    if (inventory[type] < 1) {
        return false; // Not in inventory
    }
    
    const cost = getMiniMeCost(type);
    return availableCoins >= cost;
}

/**
 * Get mini-me cost
 */
export function getMiniMeCost(type: MiniMeType): number {
    const costs: Record<MiniMeType, number> = {
        scout: 50,
        gunner: 75,
        shield: 100,
        decoy: 100,
        collector: 75,
        stun: 125,
        healer: 125,
    };
    return costs[type];
}

/**
 * Activate mini-me (spawn and consume)
 * Returns true if activation was successful
 */
export function activateMiniMe(type: MiniMeType, availableCoins: number): {
    success: boolean;
    coinsSpent: number;
} {
    const cost = getMiniMeCost(type);
    
    if (!canActivate(type, availableCoins)) {
        return { success: false, coinsSpent: 0 };
    }
    
    // Consume from inventory
    const consumed = useMiniMe(type, 1);
    if (!consumed) {
        return { success: false, coinsSpent: 0 };
    }
    
    return { success: true, coinsSpent: cost };
}

/**
 * Get mini-me display name
 */
export function getMiniMeName(type: MiniMeType): string {
    const names: Record<MiniMeType, string> = {
        scout: 'Scout',
        gunner: 'Gunner',
        shield: 'Shield',
        decoy: 'Decoy',
        collector: 'Collector',
        stun: 'Stun',
        healer: 'Healer',
    };
    return names[type];
}

/**
 * Get mini-me description
 */
export function getMiniMeDescription(type: MiniMeType): string {
    const descriptions: Record<MiniMeType, string> = {
        scout: 'Flies ahead, reveals enemy spawns. +200px vision range.',
        gunner: 'Shoots alongside player. +50% firepower.',
        shield: 'Creates protective barrier. -1 damage per hit.',
        decoy: 'Draws enemy fire. Player takes 30% less damage.',
        collector: 'Gathers nearby power-ups within 300px radius.',
        stun: 'Emits stun pulses. Stuns nearby enemies for 1s every 2s.',
        healer: 'Restores player health. +1 health bar every 3s.',
    };
    return descriptions[type];
}

/**
 * Get all mini-me types
 */
export function getAllMiniMeTypes(): MiniMeType[] {
    return ['scout', 'gunner', 'shield', 'decoy', 'collector', 'stun', 'healer'];
}
