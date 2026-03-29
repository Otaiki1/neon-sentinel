import {
    type AccountInterface,
    CallData,
    uint256,
} from "starknet";
import { DOJO_SEPOLIA } from "../dojo/config";
import { queryTorii, normalizeAddress } from "./dojoService";

// -------------------------------------------------------------------
// System addresses
// -------------------------------------------------------------------
const SYSTEMS = {
    THROW_GAUNTLET: DOJO_SEPOLIA.systems.throw_gauntlet,
    ANSWER_GAUNTLET: DOJO_SEPOLIA.systems.answer_gauntlet,
    SUBMIT_GAUNTLET_RESULT: DOJO_SEPOLIA.systems.submit_gauntlet_result,
    RECALL_GAUNTLET: DOJO_SEPOLIA.systems.recall_gauntlet,
    SETTLE_GAUNTLET: DOJO_SEPOLIA.systems.settle_gauntlet,
    CLAIM_ABANDONED_STAKE: DOJO_SEPOLIA.systems.claim_abandoned_stake,
} as const;

const STRK_TOKEN_ADDRESS = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";

// 1 STRK = 1e18 wei
const STRK_DECIMALS = 18n;
const STRK_UNIT = 10n ** STRK_DECIMALS;

// -------------------------------------------------------------------
// Status constants (mirror gauntlet_config.cairo)
// -------------------------------------------------------------------
export const BEACON_STATUS = {
    ACTIVE: 0,
    WINNER: 1,
    EXPIRED: 2,
    CANCELLED: 3,
} as const;

export const ATTEMPT_STATUS = {
    ACTIVE: 0,
    WON: 1,
    FAILED: 2,
    ABANDONED: 3,
} as const;

// -------------------------------------------------------------------
// Types
// -------------------------------------------------------------------
export interface GauntletBeacon {
    beacon_id: string;
    sentinel_address: string;
    source_run_id: string;
    sentinel_stake: string;
    challenger_stake_required: string;
    duration_blocks: string;
    created_at_block: string;
    expires_at_block: string;
    status: number;
    total_absorbed_from_challengers: string;
    target_score: number;
    target_layer: number;
    target_prestige: number;
    winner_address: string;
    winning_run_id: string;
    total_attempts: number;
    failed_attempts: number;
    mode_id: number;
}

export interface GauntletAttempt {
    beacon_id: string;
    challenger_address: string;
    stake_amount: string;
    challenger_run_id: string;
    started_at_block: string;
    completed_at_block: string;
    status: number;
    final_score: number;
}

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------

/** Format a raw wei u256 hex string to a human-readable STRK amount */
export function weiToStrk(wei: string | bigint): string {
    try {
        const raw = typeof wei === "string" ? BigInt(wei) : wei;
        const whole = raw / STRK_UNIT;
        const fraction = raw % STRK_UNIT;
        if (fraction === 0n) return whole.toString();
        const fracStr = fraction.toString().padStart(Number(STRK_DECIMALS), "0").replace(/0+$/, "");
        return `${whole}.${fracStr.slice(0, 4)}`;
    } catch {
        return "0";
    }
}

/** Parse a STRK decimal string (e.g. "1.5") to raw wei bigint */
export function strkToWei(strk: string): bigint {
    const [whole, frac = ""] = strk.split(".");
    const wholePart = BigInt(whole || "0") * STRK_UNIT;
    const fracPadded = frac.slice(0, Number(STRK_DECIMALS)).padEnd(Number(STRK_DECIMALS), "0");
    const fracPart = BigInt(fracPadded);
    return wholePart + fracPart;
}

/** Convert a u256 wei bigint to a calldata pair [low, high] as hex strings */
function u256Calldata(wei: bigint): string[] {
    const u = uint256.bnToUint256(wei);
    return [u.low.toString(), u.high.toString()];
}

// -------------------------------------------------------------------
// Torii queries
// -------------------------------------------------------------------

/** Fetch all active gauntlet beacons (status=0) */
export async function getActiveBeacons(limit = 20): Promise<GauntletBeacon[]> {
    const query = `
    query GetActiveBeacons($limit: Int!) {
      neonSentinelGauntletBeaconModels(
        where: { status: 0 }
        limit: $limit
        order: { direction: DESC, field: CREATED_AT_BLOCK }
      ) {
        edges {
          node {
            beacon_id
            sentinel_address
            source_run_id
            sentinel_stake
            challenger_stake_required
            duration_blocks
            created_at_block
            expires_at_block
            status
            total_absorbed_from_challengers
            target_score
            target_layer
            total_attempts
            failed_attempts
            mode_id
          }
        }
      }
    }`;
    try {
        const data = await queryTorii(query, { limit });
        return data.neonSentinelGauntletBeaconModels.edges.map((e: any) => e.node);
    } catch (e) {
        console.warn("[Torii][Gauntlet] Failed to fetch active beacons:", e);
        return [];
    }
}

/** Fetch beacons created by a specific sentinel */
export async function getSentinelBeacons(address: string): Promise<GauntletBeacon[]> {
    const normalized = normalizeAddress(address);
    const query = `
    query GetSentinelBeacons($address: String!) {
      neonSentinelGauntletBeaconModels(
        where: { sentinel_address: $address }
        order: { direction: DESC, field: CREATED_AT_BLOCK }
      ) {
        edges {
          node {
            beacon_id
            sentinel_address
            source_run_id
            sentinel_stake
            challenger_stake_required
            duration_blocks
            created_at_block
            expires_at_block
            status
            total_absorbed_from_challengers
            target_score
            target_layer
            total_attempts
            failed_attempts
            mode_id
          }
        }
      }
    }`;
    try {
        const data = await queryTorii(query, { address: normalized });
        return data.neonSentinelGauntletBeaconModels.edges.map((e: any) => e.node);
    } catch (e) {
        console.warn("[Torii][Gauntlet] Failed to fetch sentinel beacons:", e);
        return [];
    }
}

/** Fetch a single beacon by ID */
export async function getBeacon(beaconId: string): Promise<GauntletBeacon | null> {
    const query = `
    query GetBeacon($beaconId: String!) {
      neonSentinelGauntletBeaconModels(where: { beacon_id: $beaconId }) {
        edges {
          node {
            beacon_id
            sentinel_address
            source_run_id
            sentinel_stake
            challenger_stake_required
            duration_blocks
            created_at_block
            expires_at_block
            status
            total_absorbed_from_challengers
            target_score
            target_layer
            total_attempts
            failed_attempts
            mode_id
          }
        }
      }
    }`;
    try {
        const data = await queryTorii(query, { beaconId });
        return data.neonSentinelGauntletBeaconModels.edges[0]?.node ?? null;
    } catch (e) {
        console.warn("[Torii][Gauntlet] Failed to fetch beacon:", e);
        return null;
    }
}

/** Fetch attempts on a specific beacon */
export async function getBeaconAttempts(beaconId: string): Promise<GauntletAttempt[]> {
    const query = `
    query GetBeaconAttempts($beaconId: String!) {
      neonSentinelGauntletAttemptModels(where: { beacon_id: $beaconId }) {
        edges {
          node {
            beacon_id
            challenger_address
            stake_amount
            challenger_run_id
            started_at_block
            completed_at_block
            status
            final_score
          }
        }
      }
    }`;
    try {
        const data = await queryTorii(query, { beaconId });
        return data.neonSentinelGauntletAttemptModels.edges.map((e: any) => e.node);
    } catch (e) {
        console.warn("[Torii][Gauntlet] Failed to fetch beacon attempts:", e);
        return [];
    }
}

/** Fetch a player's active gauntlet attempt (status=0) */
export async function getActiveAttempt(address: string): Promise<GauntletAttempt | null> {
    const normalized = normalizeAddress(address);
    const query = `
    query GetActiveAttempt($address: String!) {
      neonSentinelGauntletAttemptModels(
        where: { challenger_address: $address, status: 0 }
      ) {
        edges {
          node {
            beacon_id
            challenger_address
            stake_amount
            challenger_run_id
            started_at_block
            completed_at_block
            status
            final_score
          }
        }
      }
    }`;
    try {
        const data = await queryTorii(query, { address: normalized });
        return data.neonSentinelGauntletAttemptModels.edges[0]?.node ?? null;
    } catch (e) {
        console.warn("[Torii][Gauntlet] Failed to fetch active attempt:", e);
        return null;
    }
}

/** Fetch all attempts by a challenger */
export async function getChallengerAttempts(address: string): Promise<GauntletAttempt[]> {
    const normalized = normalizeAddress(address);
    const query = `
    query GetChallengerAttempts($address: String!) {
      neonSentinelGauntletAttemptModels(
        where: { challenger_address: $address }
        order: { direction: DESC, field: STARTED_AT_BLOCK }
      ) {
        edges {
          node {
            beacon_id
            challenger_address
            stake_amount
            challenger_run_id
            started_at_block
            completed_at_block
            status
            final_score
          }
        }
      }
    }`;
    try {
        const data = await queryTorii(query, { address: normalized });
        return data.neonSentinelGauntletAttemptModels.edges.map((e: any) => e.node);
    } catch (e) {
        console.warn("[Torii][Gauntlet] Failed to fetch challenger attempts:", e);
        return [];
    }
}

// -------------------------------------------------------------------
// Contract calls
// -------------------------------------------------------------------

/**
 * Throw a gauntlet — multicall: [approve STRK, throw_gauntlet].
 * @param sourceRunId - hex string of the completed story run ID
 * @param sentinelStakeWei - STRK stake in wei (bigint)
 * @param challengerStakeWei - required challenger stake in wei (bigint)
 * @param durationBlocks - challenge window in blocks (default 7200 ≈ 1 day)
 */
export async function throwGauntlet(
    account: AccountInterface,
    sourceRunId: string,
    sentinelStakeWei: bigint,
    challengerStakeWei: bigint,
    durationBlocks: number,
) {
    const stakeU256 = u256Calldata(sentinelStakeWei);
    const sourceRunU256 = uint256.bnToUint256(BigInt(sourceRunId));
    const challengerU256 = u256Calldata(challengerStakeWei);

    const approveCall = {
        contractAddress: STRK_TOKEN_ADDRESS,
        entrypoint: "approve",
        calldata: [SYSTEMS.THROW_GAUNTLET, ...stakeU256],
    };

    const throwCall = {
        contractAddress: SYSTEMS.THROW_GAUNTLET,
        entrypoint: "throw_gauntlet",
        calldata: CallData.compile([
            sourceRunU256.low,
            sourceRunU256.high,
            ...stakeU256,
            ...challengerU256,
            durationBlocks,
        ]),
    };

    return await account.execute([approveCall, throwCall]);
}

/**
 * Answer a gauntlet beacon — multicall: [approve STRK, answer_gauntlet].
 * @param beaconId - hex string of the beacon's u256 ID
 * @param challengerStakeWei - amount to stake (must match beacon.challenger_stake_required)
 * @param kernel - kernel selection (1-3)
 * @param pregameUpgradesMask - upgrade bitmask (u256 bigint)
 * @param expectedCost - coin cost for upgrades
 */
export async function answerGauntlet(
    account: AccountInterface,
    beaconId: string,
    challengerStakeWei: bigint,
    kernel: number,
    pregameUpgradesMask: bigint,
    expectedCost: number,
) {
    const stakeU256 = u256Calldata(challengerStakeWei);
    const beaconU256 = uint256.bnToUint256(BigInt(beaconId));
    const maskU256 = u256Calldata(pregameUpgradesMask);

    const approveCall = {
        contractAddress: STRK_TOKEN_ADDRESS,
        entrypoint: "approve",
        calldata: [SYSTEMS.ANSWER_GAUNTLET, ...stakeU256],
    };

    const answerCall = {
        contractAddress: SYSTEMS.ANSWER_GAUNTLET,
        entrypoint: "answer_gauntlet",
        calldata: CallData.compile([
            beaconU256.low,
            beaconU256.high,
            kernel,
            ...maskU256,
            expectedCost,
        ]),
    };

    return await account.execute([approveCall, answerCall]);
}

/**
 * Submit the result of a gauntlet run.
 * @param beaconId - hex string of the beacon's u256 ID
 * @param runId - hex string of the challenger's run ID (u256)
 * @param score - final score
 * @param kills - total kills
 * @param layer - final layer reached
 */
export async function submitGauntletResult(
    account: AccountInterface,
    beaconId: string,
    runId: string,
    score: number,
    kills: number,
    layer: number,
) {
    const beaconU256 = uint256.bnToUint256(BigInt(beaconId));
    const runU256 = uint256.bnToUint256(BigInt(runId));

    const call = {
        contractAddress: SYSTEMS.SUBMIT_GAUNTLET_RESULT,
        entrypoint: "submit_gauntlet_result",
        calldata: CallData.compile([
            beaconU256.low,
            beaconU256.high,
            runU256.low,
            runU256.high,
            score,
            kills,
            layer,
        ]),
    };

    return await account.execute(call);
}

/**
 * Recall (cancel) a gauntlet beacon. Sentinel only. 15% cancellation fee applies.
 */
export async function recallGauntlet(account: AccountInterface, beaconId: string) {
    const beaconU256 = uint256.bnToUint256(BigInt(beaconId));

    const call = {
        contractAddress: SYSTEMS.RECALL_GAUNTLET,
        entrypoint: "recall_gauntlet",
        calldata: CallData.compile([beaconU256.low, beaconU256.high]),
    };

    return await account.execute(call);
}

/**
 * Settle an expired beacon. Anyone can call after expiry; returns stake to sentinel.
 */
export async function settleGauntlet(account: AccountInterface, beaconId: string) {
    const beaconU256 = uint256.bnToUint256(BigInt(beaconId));

    const call = {
        contractAddress: SYSTEMS.SETTLE_GAUNTLET,
        entrypoint: "settle_gauntlet",
        calldata: CallData.compile([beaconU256.low, beaconU256.high]),
    };

    return await account.execute(call);
}

/**
 * Claim an abandoned stake from a cancelled or expired beacon.
 * Expired beacon → only sentinel can call.
 * Cancelled beacon → only the challenger can call.
 */
export async function claimAbandonedStake(
    account: AccountInterface,
    beaconId: string,
    challengerAddress: string,
) {
    const beaconU256 = uint256.bnToUint256(BigInt(beaconId));

    const call = {
        contractAddress: SYSTEMS.CLAIM_ABANDONED_STAKE,
        entrypoint: "claim_abandoned_stake",
        calldata: CallData.compile([
            beaconU256.low,
            beaconU256.high,
            challengerAddress,
        ]),
    };

    return await account.execute(call);
}
