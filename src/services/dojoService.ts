import {
    type AccountInterface,
    CallData,
    RpcProvider,
    shortString,
    uint256,
} from "starknet";
import { DOJO_SEPOLIA } from "../dojo/config";

const _provider = new RpcProvider({ nodeUrl: DOJO_SEPOLIA.rpcUrl });

/**
 * Wait for a transaction to be accepted on L2 (or throw if rejected).
 * Polls every 2 seconds for a maximum of 60 seconds.
 */
export async function waitForTransaction(txHash: string, maxWaitMs = 60_000): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
        try {
            const receipt = await _provider.getTransactionReceipt(txHash);
            const status = (receipt as any)?.execution_status ?? (receipt as any)?.status;
            if (status === 'SUCCEEDED' || status === 'ACCEPTED_ON_L2' || status === 'ACCEPTED_ON_L1') return;
            if (status === 'REVERTED' || status === 'REJECTED') throw new Error(`Transaction ${txHash} ${status}`);
        } catch (e: any) {
            if (e?.message?.includes('Transaction hash not found')) {
                // Not indexed yet, keep polling
            } else if (e?.message?.includes('REVERTED') || e?.message?.includes('REJECTED')) {
                throw e;
            }
        }
        await new Promise(r => setTimeout(r, 2000));
    }
    throw new Error(`Timeout waiting for transaction ${txHash}`);
}

const TORII_GRAPHQL_URL = DOJO_SEPOLIA.toriiGraphqlUrl;

/**
 * Normalizes a Starknet address to the compact hex format Torii uses internally.
 * Torii stores addresses WITHOUT leading zeros (e.g. 0xf4f3... not 0x00f4f3...).
 * Use this for all Torii GraphQL queries.
 */
export function normalizeAddress(address: string): string {
    if (!address) return "";
    try {
        const hex = address.replace(/^0x/, "").toLowerCase().replace(/^0+/, "") || "0";
        return "0x" + hex;
    } catch (e) {
        return address.toLowerCase();
    }
}

// System contract addresses (from manifest_sepolia.json)
export const SYSTEMS = {
    ACTIONS: DOJO_SEPOLIA.systems.actions,
    BUY_COINS: DOJO_SEPOLIA.systems.buy_coins,
    CLAIM_COINS: DOJO_SEPOLIA.systems.claim_coins,
    END_RUN: DOJO_SEPOLIA.systems.end_run,
    INIT_GAME: DOJO_SEPOLIA.systems.init_game,
    PURCHASE_COSMETIC: DOJO_SEPOLIA.systems.purchase_cosmetic,
    SUBMIT_LEADERBOARD: DOJO_SEPOLIA.systems.submit_leaderboard,
    SPEND_COINS: DOJO_SEPOLIA.systems.spend_coins,
    SPEND_REVIVE: DOJO_SEPOLIA.systems.spend_revive,
    PURCHASE_MINI_ME_UNIT: DOJO_SEPOLIA.systems.purchase_mini_me_unit,
    PURCHASE_MINI_ME_SESSIONS: DOJO_SEPOLIA.systems.purchase_mini_me_sessions,
} as const;

/**
 * Executes a GraphQL query against Torii.
 */
export async function queryTorii(query: string, variables: any = {}) {
    const response = await fetch(TORII_GRAPHQL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables }),
    });
    const { data, errors } = await response.json();
    if (errors) {
        throw new Error(errors[0].message);
    }
    return data;
}

/**
 * Fetch a player's profile from on-chain state via Torii.
 */
export async function getPlayerProfileOnChain(address: string) {
    const normalized = normalizeAddress(address);
    const query = `
    query GetPlayerProfile($address: String!) {
      neonSentinelPlayerProfileModels(where: { player_address: $address }) {
        edges {
          node {
            player_address
            coins
            total_runs
            lifetime_score
            best_run_score
            current_layer
            highest_rank_id
            selected_kernel
            mini_me_sessions_purchased
            current_prestige
            highest_prestige_reached
            is_prime_sentinel
            kernel_unlocks
          }
        }
      }
    }`;
    const data = await queryTorii(query, { address: normalized });
    return data.neonSentinelPlayerProfileModels.edges[0]?.node || null;
}

export interface LeaderboardEntryNode {
    player_address: string;
    final_score: string;
    week: number;
    run_id: string;
}

/**
 * Fetch top leaderboard entries from Torii ordered by score descending.
 */
export async function getLeaderboardEntries(limit = 20): Promise<LeaderboardEntryNode[]> {
    const query = `
    query GetLeaderboard($limit: Int!) {
      neonSentinelLeaderboardEntryModels(
        limit: $limit
        order: { direction: DESC, field: FINAL_SCORE }
      ) {
        edges { node { player_address final_score week run_id } }
      }
    }`;
    try {
        const data = await queryTorii(query, { limit });
        return data.neonSentinelLeaderboardEntryModels.edges.map((e: any) => e.node);
    } catch { return []; }
}

/**
 * Fetch all leaderboard entries for a specific player.
 */
export async function getPlayerLeaderboardEntries(address: string): Promise<LeaderboardEntryNode[]> {
    const normalized = normalizeAddress(address);
    const query = `
    query GetPlayerLeaderboard($address: String!) {
      neonSentinelLeaderboardEntryModels(
        where: { player_address: $address }
        order: { direction: DESC, field: FINAL_SCORE }
      ) {
        edges { node { player_address final_score week run_id } }
      }
    }`;
    try {
        const data = await queryTorii(query, { address: normalized });
        return data.neonSentinelLeaderboardEntryModels.edges.map((e: any) => e.node);
    } catch { return []; }
}

/**
 * Starts a new game run.
 */
export async function initGame(
    account: AccountInterface,
    kernel: number,
    upgradesMask: string | number | bigint,
    expectedCost: number,
) {
    const u256Mask = uint256.bnToUint256(upgradesMask);
    const call = {
        contractAddress: SYSTEMS.INIT_GAME,
        entrypoint: "init_game",
        calldata: [
            kernel,
            u256Mask.low,
            u256Mask.high,
            expectedCost
        ],
    };
    return await account.execute(call);
}

/**
 * Concludes a game run.
 */
export async function endRun(account: AccountInterface, runId: string | number | bigint, score: number, kills: number, layer: number) {
    const u256RunId = uint256.bnToUint256(runId);
    const call = {
        contractAddress: SYSTEMS.END_RUN,
        entrypoint: "end_run",
        calldata: [
            u256RunId.low,
            u256RunId.high,
            score,
            kills,
            layer
        ],
    };
    return await account.execute(call);
}

/**
 * Claims daily coins if eligible.
 */
export async function claimDailyCoins(account: AccountInterface) {
    const call = {
        contractAddress: SYSTEMS.CLAIM_COINS,
        entrypoint: "claim_coins",
        calldata: [],
    };
    return await account.execute(call);
}

/**
 * Submits a completed run to the leaderboard.
 * Week is derived from the current timestamp (matches contract logic: block.timestamp / 604800).
 */
export async function submitToLeaderboard(
    account: AccountInterface,
    runId: string,
) {
    const SECONDS_PER_WEEK = 604800;
    const week = Math.floor(Date.now() / 1000 / SECONDS_PER_WEEK);
    const call = {
        contractAddress: SYSTEMS.SUBMIT_LEADERBOARD,
        entrypoint: "submit_leaderboard",
        calldata: CallData.compile([
            uint256.bnToUint256(runId),
            week
        ]),
    };
    return await account.execute(call);
}

/**
 * Spends coins for a general purpose.
 */
export async function spendCoins(account: AccountInterface, amount: number, reason: string) {
    const reasonFelt = reason.startsWith("0x")
        ? reason
        : shortString.encodeShortString(reason);
    const call = {
        contractAddress: SYSTEMS.SPEND_COINS,
        entrypoint: "spend_coins",
        calldata: CallData.compile([amount, reasonFelt]),
    };
    return await account.execute(call);
}

/**
 * Spends coins to revive during a run.
 */
export async function spendRevive(account: AccountInterface, runId: string) {
    const call = {
        contractAddress: SYSTEMS.SPEND_REVIVE,
        entrypoint: "spend_revive",
        calldata: CallData.compile([uint256.bnToUint256(runId)]),
    };
    return await account.execute(call);
}

/**
 * Purchases a cosmetic item.
 */
export async function purchaseCosmetic(account: AccountInterface, itemType: number, itemId: number) {
    const call = {
        contractAddress: SYSTEMS.PURCHASE_COSMETIC,
        entrypoint: "purchase_cosmetic",
        calldata: CallData.compile([itemType, itemId]),
    };
    return await account.execute(call);
}

/**
 * Purchases a mini-me unit.
 */
export async function purchaseMiniMeUnit(account: AccountInterface, unitId: number) {
    const call = {
        contractAddress: SYSTEMS.PURCHASE_MINI_ME_UNIT,
        entrypoint: "purchase_mini_me_unit",
        calldata: CallData.compile([unitId]),
    };
    return await account.execute(call);
}

/**
 * Purchases mini-me session packs.
 */
export async function purchaseMiniMeSessions(account: AccountInterface) {
    const call = {
        contractAddress: SYSTEMS.PURCHASE_MINI_ME_SESSIONS,
        entrypoint: "purchase_mini_me_sessions",
        calldata: [],
    };
    return await account.execute(call);
}

// STRK token address on Starknet Sepolia
const STRK_TOKEN_ADDRESS = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
// Exchange rate: 10 coins per 1 STRK unit (confirmed from on-chain TokenPurchaseConfig).
// The buy_coins contract receives `amount_strk` as a SMALL INTEGER (whole STRK units), NOT wei.
// ValidateStrkAmountTrait enforces amount_strk ≤ 1000 (would overflow as wei).
// Formula: coins = amount_strk * rate  →  amount_strk = coinAmount / rate
export const COIN_EXCHANGE_RATE = 10;

/**
 * Buy in-game coins with STRK.
 * Sends a multicall: [approve STRK, buy_coins].
 * The contract works with whole STRK token units (NOT 18-decimal wei).
 * @param account - Connected Starknet account
 * @param coinAmount - Number of coins to buy (must be a multiple of COIN_EXCHANGE_RATE)
 */
export async function buyCoins(account: AccountInterface, coinAmount: number) {
    // amount_strk is in whole units: 10 coins / 10 rate = 1 unit
    const strkUnits = Math.ceil(coinAmount / COIN_EXCHANGE_RATE);
    const u256Strk = uint256.bnToUint256(BigInt(strkUnits));

    // 1. Approve the buy_coins contract to spend the STRK units
    const approveCall = {
        contractAddress: STRK_TOKEN_ADDRESS,
        entrypoint: "approve",
        calldata: [
            SYSTEMS.BUY_COINS,  // spender
            u256Strk.low,       // amount.low
            u256Strk.high,      // amount.high
        ],
    };

    // 2. Buy the coins
    const buyCall = {
        contractAddress: SYSTEMS.BUY_COINS,
        entrypoint: "buy_coins",
        calldata: [u256Strk.low, u256Strk.high],
    };

    return await account.execute([approveCall, buyCall]);
}

/**
 * Returns STRK units needed for a coin purchase.
 */
export function coinsToStrk(coinAmount: number): { strkUnits: number } {
    return { strkUnits: Math.ceil(coinAmount / COIN_EXCHANGE_RATE) };
}

/**
 * Fetch a player's latest active run ID.
 */
export async function getActiveRunId(address: string) {
    const normalized = normalizeAddress(address);
    const query = `
    query GetPlayer($address: String!) {
      neonSentinelPlayerModels(where: { player_address: $address }) {
        edges {
          node {
            player_address
            is_active
            run_id
          }
        }
      }
    }`;
    try {
        const data = await queryTorii(query, { address: normalized });
        const node = data.neonSentinelPlayerModels.edges[0]?.node;
        if (!node || !node.is_active) return null;
        return node.run_id as string;
    } catch (e) {
        console.error("Failed to fetch active run id:", e);
        return null;
    }
}

/**
 * Poll Torii for an active run ID after init_game.
 * Retries up to `maxAttempts` times with `delayMs` between each attempt.
 * Use this right after `waitForTransaction` to ensure Torii has indexed the run.
 */
export async function pollActiveRunId(
    address: string,
    maxAttempts = 20,
    delayMs = 1500,
): Promise<string | null> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const runId = await getActiveRunId(address);
        if (runId) {
            console.log(`[Torii] Active run found after ${attempt} attempt(s):`, runId);
            return runId;
        }
        console.log(`[Torii] Waiting for run to appear... attempt ${attempt}/${maxAttempts}`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    console.warn("[Torii] Run not found after polling. Proceeding without cached run ID.");
    return null;
}

/**
 * Fetch the leaderboard for a specific week from on-chain state.
 */
export async function getLeaderboardOnChain(week: number) {
    const query = `
    query GetLeaderboard($week: Int!) {
      neonSentinelLeaderboardEntryModels(where: { week: $week }, order: { direction: DESC, field: FINAL_SCORE }, limit: 10) {
        edges {
          node {
            player_address
            player_name
            final_score
            deepest_layer
            prestige_level
            enemies_defeated
            peak_combo
          }
        }
      }
    }`;
    try {
        const data = await queryTorii(query, { week });
        return data.neonSentinelLeaderboardEntryModels.edges.map((e: any) => e.node);
    } catch (e) {
        console.error("Failed to fetch on-chain leaderboard:", e);
        return [];
    }
}

/**
 * Fetch player's mini-me inventory.
 */
export async function getMiniMeInventory(address: string) {
    const normalized = normalizeAddress(address);
    const query = `
    query GetInventory($address: String!) {
      neonSentinelMiniMeInventoryModels(where: { player_address: $address }) {
        edges {
          node {
            unit_type
            count
          }
        }
      }
    }`;
    try {
        const data = await queryTorii(query, { address: normalized });
        return data.neonSentinelMiniMeInventoryModels.edges.map((e: any) => e.node);
    } catch (e) {
        console.error("Failed to fetch mini-me inventory:", e);
        return [];
    }
}

/**
 * Fetch player's coin purchase history.
 */
export async function getCoinPurchases(address: string) {
    const normalized = normalizeAddress(address);
    const query = `
    query GetHistory($address: String!) {
      neonSentinelCoinPurchaseRecordModels(where: { player_address: $address }) {
        edges {
          node {
            purchase_id
            strk_amount
            coins_received
            purchase_timestamp
          }
        }
      }
    }`;
    try {
        const data = await queryTorii(query, { address: normalized });
        return data.neonSentinelCoinPurchaseRecordModels.edges.map((e: any) => e.node);
    } catch (e) {
        console.error("Failed to fetch coin history:", e);
        return [];
    }
}

export const dojoService = {
    waitForTransaction,
    queryTorii,
    getPlayerProfileOnChain,
    getActiveRunId,
    pollActiveRunId,
    getLeaderboardOnChain,
    getMiniMeInventory,
    getCoinPurchases,
    initGame,
    endRun,
    claimDailyCoins,
    submitToLeaderboard,
    spendCoins,
    spendRevive,
    purchaseCosmetic,
    purchaseMiniMeUnit,
    purchaseMiniMeSessions,
    buyCoins,
    normalizeAddress,
};

export default dojoService;
