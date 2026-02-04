/**
 * Rank Service - Manages rank progression and bragging rights
 * 
 * Tracks player ranks based on prestige + layer combinations
 */

import { RANK_CONFIG, getRankForProgress, getHighestRank } from '../game/config';

export interface Rank {
    number: number;
    prestige: number;
    layer: number;
    name: string;
    badge: string;
    tier: string;
}

const RANK_HISTORY_KEY = 'neon-sentinel-rank-history';
const CURRENT_RANK_KEY = 'neon-sentinel-current-rank';
/** Player's actual prestige/layer progress (used for unlock checks; rank object has definition prestige/layer, not player progress) */
const CURRENT_PROGRESS_KEY = 'neon-sentinel-current-progress';

/**
 * Get current rank based on prestige and layer
 */
export function getCurrentRank(prestige: number, layer: number): Rank | null {
    return getRankForProgress(prestige, layer) || null;
}

/**
 * Get numeric rank (1-18) for given prestige and layer
 */
export function getRankNumber(prestige: number, layer: number): number {
    const rank = getHighestRank(prestige, layer);
    return rank ? rank.number : 1;
}

/**
 * Get rank name for given prestige and layer
 */
export function getRankName(prestige: number, layer: number): string {
    const rank = getHighestRank(prestige, layer);
    return rank ? rank.name : 'Initiate Sentinel';
}

/**
 * Get progress toward next rank
 * Returns: { currentRank, nextRank, progress } where progress is 0-1
 */
export function getRankProgress(prestige: number, layer: number): {
    currentRank: Rank | null;
    nextRank: Rank | null;
    progress: number;
} {
    const currentRank = getHighestRank(prestige, layer);
    
    if (!currentRank) {
        return {
            currentRank: null,
            nextRank: RANK_CONFIG.ranks[0] || null,
            progress: 0,
        };
    }
    
    // If at max rank, no next rank
    if (currentRank.number >= RANK_CONFIG.ranks.length) {
        return {
            currentRank,
            nextRank: null,
            progress: 1,
        };
    }
    
    // Find next rank (rank with number = currentRank.number + 1)
    const nextRankNumber = currentRank.number + 1;
    const nextRank = RANK_CONFIG.ranks.find(r => r.number === nextRankNumber) || null;
    
    // Calculate progress within current prestige
    // Progress is based on layer within prestige (1-6)
    const progress = layer / 6;
    
    return {
        currentRank,
        nextRank,
        progress: Math.min(1, progress),
    };
}

/**
 * Get rank history (all ranks achieved)
 */
export function getRankHistory(): Rank[] {
    try {
        const stored = localStorage.getItem(RANK_HISTORY_KEY);
        if (!stored) {
            return [];
        }
        return JSON.parse(stored) as Rank[];
    } catch (error) {
        console.error('Error loading rank history:', error);
        return [];
    }
}

/**
 * Save rank to history
 */
function saveRankToHistory(rank: Rank): void {
    try {
        const history = getRankHistory();
        // Check if rank already exists in history
        const exists = history.some(r => r.number === rank.number);
        if (!exists) {
            history.push(rank);
            // Sort by rank number
            history.sort((a, b) => a.number - b.number);
            localStorage.setItem(RANK_HISTORY_KEY, JSON.stringify(history));
        }
    } catch (error) {
        console.error('Error saving rank to history:', error);
    }
}

/**
 * Get rank badge sprite key
 */
export function getRankBadge(rankNumber: number): string {
    const rank = RANK_CONFIG.ranks.find(r => r.number === rankNumber);
    return rank ? rank.badge : 'badge_1';
}

/**
 * Check if a rank milestone was achieved
 * Returns the rank if achieved, null otherwise
 */
export function calculateRankMilestone(
    prestige: number,
    layer: number,
    previousPrestige?: number,
    previousLayer?: number
): Rank | null {
    const currentRank = getRankForProgress(prestige, layer);
    
    if (!currentRank) {
        return null;
    }
    
    // Check if this is a new rank achievement
    const history = getRankHistory();
    const alreadyAchieved = history.some(r => r.number === currentRank.number);
    
    if (alreadyAchieved) {
        return null; // Already achieved this rank
    }
    
    // Check if we just reached this rank
    if (previousPrestige !== undefined && previousLayer !== undefined) {
        const previousRank = getHighestRank(previousPrestige, previousLayer);
        if (previousRank && previousRank.number < currentRank.number) {
            // New rank achieved!
            saveRankToHistory(currentRank);
            saveCurrentRank(currentRank);
            return currentRank;
        }
    } else {
        // First time checking - if we're at or past this rank, it's achieved
        const highestRank = getHighestRank(prestige, layer);
        if (highestRank && highestRank.number >= currentRank.number) {
            saveRankToHistory(currentRank);
            saveCurrentRank(currentRank);
            return currentRank;
        }
    }
    
    return null;
}

/**
 * Get current rank from storage
 */
export function getCurrentRankFromStorage(): Rank | null {
    try {
        const stored = localStorage.getItem(CURRENT_RANK_KEY);
        if (!stored) {
            return null;
        }
        return JSON.parse(stored) as Rank;
    } catch (error) {
        console.error('Error loading current rank:', error);
        return null;
    }
}

/**
 * Save current rank to storage
 */
function saveCurrentRank(rank: Rank): void {
    try {
        localStorage.setItem(CURRENT_RANK_KEY, JSON.stringify(rank));
    } catch (error) {
        console.error('Error saving current rank:', error);
    }
}

/**
 * Save player's current prestige and layer (for unlock checks; rank object stores rank definition, not player progress)
 */
function saveCurrentProgress(prestige: number, layer: number): void {
    try {
        localStorage.setItem(CURRENT_PROGRESS_KEY, JSON.stringify({ prestige, layer }));
    } catch (error) {
        console.error('Error saving current progress:', error);
    }
}

/**
 * Get player's current prestige level from storage (for avatar/unlock checks).
 * Use this instead of getCurrentRankFromStorage()?.prestige, which is the rank definition's prestige, not the player's.
 */
export function getCurrentPrestigeFromStorage(): number {
    try {
        const stored = localStorage.getItem(CURRENT_PROGRESS_KEY);
        if (stored) {
            const { prestige } = JSON.parse(stored) as { prestige: number; layer: number };
            if (typeof prestige === 'number') return prestige;
        }
        // Backward compatibility: infer from highest achieved rank (by rank number)
        const current = getCurrentRankFromStorage();
        const history = getRankHistory();
        let maxRankNumber = current?.number ?? 0;
        for (const r of history) {
            if (r.number > maxRankNumber) maxRankNumber = r.number;
        }
        const configRank = RANK_CONFIG.ranks.find((r) => r.number === maxRankNumber);
        return configRank ? configRank.prestige : 0;
    } catch (error) {
        console.error('Error loading current prestige:', error);
        return 0;
    }
}

/**
 * Get player's current layer from storage (for display/consistency).
 */
export function getCurrentLayerFromStorage(): number {
    try {
        const stored = localStorage.getItem(CURRENT_PROGRESS_KEY);
        if (!stored) return 1;
        const { layer } = JSON.parse(stored) as { prestige: number; layer: number };
        return typeof layer === 'number' ? layer : 1;
    } catch (error) {
        console.error('Error loading current layer:', error);
        return 1;
    }
}

/**
 * Update current rank based on prestige and layer
 */
export function updateCurrentRank(prestige: number, layer: number): Rank | null {
    saveCurrentProgress(prestige, layer);
    const rank = getHighestRank(prestige, layer);
    if (rank) {
        saveCurrentRank(rank);
        // Check if this is a new achievement
        calculateRankMilestone(prestige, layer);
        return rank;
    }
    return null;
}

/**
 * Get all ranks in a tier
 */
export function getRanksByTier(tier: 'entry' | 'intermediate' | 'advanced' | 'elite' | 'legendary'): Rank[] {
    return RANK_CONFIG.ranks.filter(rank => rank.tier === tier);
}

/**
 * Get rank tier name
 */
export function getRankTierName(tier: string): string {
    const tierNames: Record<string, string> = {
        entry: 'Entry Ranks',
        intermediate: 'Intermediate Ranks',
        advanced: 'Advanced Ranks',
        elite: 'Elite Ranks',
        legendary: 'Legendary Rank',
    };
    return tierNames[tier] || tier;
}
