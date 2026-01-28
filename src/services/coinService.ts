/**
 * Coin Economy Service
 * 
 * Manages coin earning, spending, and tracking
 */

type CoinTransaction = {
    timestamp: number;
    amount: number;
    type: 'earn' | 'spend';
    source?: string; // For earning: 'daily', 'prestige', 'prime_sentinel', etc.
    purpose?: string; // For spending: 'avatar', 'revive', 'mini_me', etc.
    balanceAfter: number;
};

type CoinState = {
    coins: number;
    lastResetDate: string;
    lastPrimeSentinelBonus?: string; // Date when Prime Sentinel bonus was last granted
    transactionHistory: CoinTransaction[];
};

const STORAGE_KEY = "neonSentinel_coins";
const DAILY_COINS = 3;
const PRIME_SENTINEL_BONUS = 3;
const PRIME_SENTINEL_UNLOCK_PRESTIGE = 3; // Unlocked after Prestige 3

// Maximum transaction history entries to keep
const MAX_HISTORY_ENTRIES = 100;

function todayKey(): string {
    return new Date().toISOString().slice(0, 10);
}

function loadState(): CoinState {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            return {
                coins: DAILY_COINS,
                lastResetDate: todayKey(),
                transactionHistory: [],
            };
        }
        const parsed = JSON.parse(stored) as CoinState;
        // Ensure transactionHistory exists for backward compatibility
        if (!parsed.transactionHistory) {
            parsed.transactionHistory = [];
        }
        return parsed;
    } catch (error) {
        console.error("Error loading coins:", error);
        return {
            coins: DAILY_COINS,
            lastResetDate: todayKey(),
            transactionHistory: [],
        };
    }
}

function saveState(state: CoinState): void {
    try {
        // Trim transaction history to max entries
        if (state.transactionHistory.length > MAX_HISTORY_ENTRIES) {
            state.transactionHistory = state.transactionHistory.slice(-MAX_HISTORY_ENTRIES);
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
        console.error("Error saving coins:", error);
    }
}

function addTransaction(
    state: CoinState,
    amount: number,
    type: 'earn' | 'spend',
    source?: string,
    purpose?: string
): void {
    state.transactionHistory.push({
        timestamp: Date.now(),
        amount: Math.abs(amount),
        type,
        source,
        purpose,
        balanceAfter: state.coins,
    });
}

/**
 * Get current coin balance
 */
export function getAvailableCoins(): number {
    const state = loadState();
    const today = todayKey();
    
    // Check if daily reset is needed
    if (state.lastResetDate !== today) {
        const refreshed = {
            ...state,
            coins: DAILY_COINS,
            lastResetDate: today,
        };
        
        // Add daily coin transaction
        addTransaction(refreshed, DAILY_COINS, 'earn', 'daily');
        saveState(refreshed);
        return refreshed.coins;
    }
    
    return state.coins;
}

/**
 * Check if player can afford a cost
 */
export function canAfford(cost: number): boolean {
    return getAvailableCoins() >= cost;
}

/**
 * Add coins with source tracking
 */
export function addCoins(amount: number, source?: string): number {
    const state = loadState();
    const today = todayKey();
    
    // Handle daily reset
    if (state.lastResetDate !== today) {
        state.coins = DAILY_COINS;
        state.lastResetDate = today;
        addTransaction(state, DAILY_COINS, 'earn', 'daily');
    }
    
    state.coins += amount;
    addTransaction(state, amount, 'earn', source);
    saveState(state);
    
    return state.coins;
}

/**
 * Spend coins with purpose tracking
 */
export function spendCoins(amount: number, purpose?: string): boolean {
    const state = loadState();
    const today = todayKey();
    
    // Handle daily reset
    if (state.lastResetDate !== today) {
        state.coins = DAILY_COINS;
        state.lastResetDate = today;
        addTransaction(state, DAILY_COINS, 'earn', 'daily');
    }
    
    if (state.coins < amount) {
        return false;
    }
    
    state.coins -= amount;
    addTransaction(state, -amount, 'spend', undefined, purpose);
    saveState(state);
    
    return true;
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use spendCoins instead
 */
export function consumeCoins(cost: number): boolean {
    return spendCoins(cost, 'legacy');
}

/**
 * Calculate prestige reward coins
 * Formula: 2 * (2^prestigeLevel)
 */
export function getPrestigeReward(prestigeLevel: number): number {
    return 2 * Math.pow(2, prestigeLevel);
}

/**
 * Grant prestige completion reward
 */
export function grantPrestigeReward(prestigeLevel: number): number {
    const reward = getPrestigeReward(prestigeLevel);
    return addCoins(reward, `prestige_${prestigeLevel}`);
}

/**
 * Get daily coin allocation
 */
export function getDailyCoins(): number {
    return DAILY_COINS;
}

/**
 * Calculate revival cost
 * Formula: 100 * (2^reviveCount)
 */
export function getReviveCost(reviveCount: number): number {
    return 100 * Math.pow(2, reviveCount);
}

/**
 * Get timestamp of last daily reset
 */
export function getLastDailyReset(): number {
    const state = loadState();
    const resetDate = new Date(state.lastResetDate);
    return resetDate.getTime();
}

/**
 * Check and grant Prime Sentinel daily bonus if eligible
 * Returns true if bonus was granted, false otherwise
 */
export function checkAndGrantPrimeSentinelBonus(prestigeLevel: number): boolean {
    if (prestigeLevel < PRIME_SENTINEL_UNLOCK_PRESTIGE) {
        return false; // Not unlocked yet
    }
    
    const state = loadState();
    const today = todayKey();
    
    // Check if already granted today
    if (state.lastPrimeSentinelBonus === today) {
        return false; // Already granted today
    }
    
    // Handle daily reset if needed
    if (state.lastResetDate !== today) {
        state.coins = DAILY_COINS;
        state.lastResetDate = today;
        addTransaction(state, DAILY_COINS, 'earn', 'daily');
    }
    
    // Grant Prime Sentinel bonus
    state.coins += PRIME_SENTINEL_BONUS;
    state.lastPrimeSentinelBonus = today;
    addTransaction(state, PRIME_SENTINEL_BONUS, 'earn', 'prime_sentinel');
    saveState(state);
    
    return true; // Bonus granted
}

/**
 * Get coin transaction history
 */
export function getCoinHistory(): CoinTransaction[] {
    const state = loadState();
    return state.transactionHistory.slice(); // Return copy
}

/**
 * Get coin history filtered by type
 */
export function getCoinHistoryByType(type: 'earn' | 'spend'): CoinTransaction[] {
    return getCoinHistory().filter(t => t.type === type);
}

/**
 * Get total coins earned from a specific source
 */
export function getTotalEarnedFromSource(source: string): number {
    return getCoinHistory()
        .filter(t => t.type === 'earn' && t.source === source)
        .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Get total coins spent on a specific purpose
 */
export function getTotalSpentOnPurpose(purpose: string): number {
    return getCoinHistory()
        .filter(t => t.type === 'spend' && t.purpose === purpose)
        .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Check if Prime Sentinel bonus is available today
 */
export function isPrimeSentinelBonusAvailable(prestigeLevel: number): boolean {
    if (prestigeLevel < PRIME_SENTINEL_UNLOCK_PRESTIGE) {
        return false;
    }
    
    const state = loadState();
    const today = todayKey();
    return state.lastPrimeSentinelBonus !== today;
}
