type CoinState = {
  coins: number;
  lastResetDate: string;
};

const STORAGE_KEY = "neon-sentinel-coins";
const DAILY_COINS = 3;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadState(): CoinState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { coins: DAILY_COINS, lastResetDate: todayKey() };
    }
    return JSON.parse(stored) as CoinState;
  } catch (error) {
    console.error("Error loading coins:", error);
    return { coins: DAILY_COINS, lastResetDate: todayKey() };
  }
}

function saveState(state: CoinState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Error saving coins:", error);
  }
}

export function getAvailableCoins() {
  const state = loadState();
  const today = todayKey();
  if (state.lastResetDate !== today) {
    const refreshed = { coins: DAILY_COINS, lastResetDate: today };
    saveState(refreshed);
    return refreshed.coins;
  }
  return state.coins;
}

export function consumeCoins(cost: number): boolean {
  const state = loadState();
  const today = todayKey();
  if (state.lastResetDate !== today) {
    state.coins = DAILY_COINS;
    state.lastResetDate = today;
  }
  if (state.coins < cost) {
    saveState(state);
    return false;
  }
  state.coins -= cost;
  saveState(state);
  return true;
}

export function addCoins(amount: number) {
  const state = loadState();
  const today = todayKey();
  if (state.lastResetDate !== today) {
    state.coins = DAILY_COINS;
    state.lastResetDate = today;
  }
  state.coins += amount;
  saveState(state);
  return state.coins;
}

export function getDailyCoinCount() {
  return DAILY_COINS;
}

