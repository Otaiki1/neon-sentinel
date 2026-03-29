import { DOJO_SEPOLIA } from "../dojo/config";

// STRK token on Sepolia — needed for approve() in buy_coins and gauntlet multicalls
const STRK_TOKEN = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";

// Max STRK spend pre-approved per session: 1000 units (matches contract max)
// Using 0x3e8 (1000 in hex) so Controller shows the limit clearly.
const MAX_STRK_SESSION = "0x3e8";

export const neonSentinelPolicies = {
  contracts: {
    // STRK token – allow approve() for coin shop and gauntlet staking
    [STRK_TOKEN]: {
      name: "STRK Token",
      description: "Approve STRK spending for coin purchases and gauntlet staking",
      methods: [
        {
          name: "Approve STRK for Coin Shop",
          entrypoint: "approve",
          spender: DOJO_SEPOLIA.systems.buy_coins,
          amount: MAX_STRK_SESSION,
          description: "Approve STRK token transfer",
        },
        {
          name: "Approve STRK for Gauntlet",
          entrypoint: "approve",
          spender: DOJO_SEPOLIA.systems.throw_gauntlet,
          amount: MAX_STRK_SESSION,
          description: "Approve STRK for gauntlet sentinel stake",
        },
        {
          name: "Approve STRK for Gauntlet Challenge",
          entrypoint: "approve",
          spender: DOJO_SEPOLIA.systems.answer_gauntlet,
          amount: MAX_STRK_SESSION,
          description: "Approve STRK for gauntlet challenger stake",
        },
      ],
    },
    [DOJO_SEPOLIA.systems.init_game.toLowerCase()]: {
      name: "Neon Sentinel – Start Run",
      description: "Start a new game run",
      methods: [{ name: "init_game", entrypoint: "init_game", description: "Start a new game run" }],
    },
    [DOJO_SEPOLIA.systems.end_run.toLowerCase()]: {
      name: "Neon Sentinel – End Run",
      description: "Finish run and submit final score",
      methods: [{ name: "end_run", entrypoint: "end_run", description: "End the current run" }],
    },
    [DOJO_SEPOLIA.systems.submit_leaderboard.toLowerCase()]: {
      name: "Neon Sentinel – Submit Leaderboard",
      description: "Submit run to weekly leaderboard",
      methods: [
        { name: "submit_leaderboard", entrypoint: "submit_leaderboard", description: "Submit score to leaderboard" },
      ],
    },
    [DOJO_SEPOLIA.systems.claim_coins.toLowerCase()]: {
      name: "Neon Sentinel – Claim Coins",
      description: "Claim daily coins",
      methods: [{ name: "claim_coins", entrypoint: "claim_coins", description: "Claim daily coin reward" }],
    },
    [DOJO_SEPOLIA.systems.spend_coins.toLowerCase()]: {
      name: "Neon Sentinel – Spend Coins",
      description: "Spend in-game coins",
      methods: [{ name: "spend_coins", entrypoint: "spend_coins", description: "Spend coins on upgrades" }],
    },
    [DOJO_SEPOLIA.systems.spend_revive.toLowerCase()]: {
      name: "Neon Sentinel – Revive",
      description: "In-run revive (cost scales)",
      methods: [{ name: "spend_revive", entrypoint: "spend_revive", description: "Use a revive during a run" }],
    },
    [DOJO_SEPOLIA.systems.purchase_cosmetic.toLowerCase()]: {
      name: "Neon Sentinel – Purchase Cosmetic",
      description: "Unlock kernel, avatar, or skin",
      methods: [{ name: "purchase_cosmetic", entrypoint: "purchase_cosmetic", description: "Buy a cosmetic item" }],
    },
    [DOJO_SEPOLIA.systems.buy_coins.toLowerCase()]: {
      name: "Neon Sentinel – Buy Coins",
      description: "Purchase in-game coins with STRK",
      methods: [{ name: "buy_coins", entrypoint: "buy_coins", description: "Buy coins with STRK" }],
    },
    [DOJO_SEPOLIA.systems.purchase_mini_me_unit.toLowerCase()]: {
      name: "Neon Sentinel – Purchase Mini-Me Unit",
      description: "Add a Mini-Me unit to inventory",
      methods: [
        { name: "purchase_mini_me_unit", entrypoint: "purchase_mini_me_unit", description: "Purchase a Mini-Me unit" },
      ],
    },
    [DOJO_SEPOLIA.systems.purchase_mini_me_sessions.toLowerCase()]: {
      name: "Neon Sentinel – Purchase Mini-Me Sessions",
      description: "Purchase +3 Mini-Me sessions pack",
      methods: [
        {
          name: "purchase_mini_me_sessions",
          entrypoint: "purchase_mini_me_sessions",
          description: "Buy Mini-Me session pack",
        },
      ],
    },
    // Gauntlet Protocol
    [DOJO_SEPOLIA.systems.throw_gauntlet.toLowerCase()]: {
      name: "Neon Sentinel – Throw Gauntlet",
      description: "Stake STRK and publish a gauntlet beacon",
      methods: [
        {
          name: "throw_gauntlet",
          entrypoint: "throw_gauntlet",
          description: "Publish a gauntlet beacon with STRK stake",
        },
      ],
    },
    [DOJO_SEPOLIA.systems.answer_gauntlet.toLowerCase()]: {
      name: "Neon Sentinel – Answer Gauntlet",
      description: "Accept a gauntlet challenge and stake STRK",
      methods: [
        {
          name: "answer_gauntlet",
          entrypoint: "answer_gauntlet",
          description: "Ante up and start a gauntlet run",
        },
      ],
    },
    [DOJO_SEPOLIA.systems.submit_gauntlet_result.toLowerCase()]: {
      name: "Neon Sentinel – Submit Gauntlet Result",
      description: "End a gauntlet run and resolve the stake",
      methods: [
        {
          name: "submit_gauntlet_result",
          entrypoint: "submit_gauntlet_result",
          description: "Submit final score and settle the gauntlet",
        },
      ],
    },
    [DOJO_SEPOLIA.systems.recall_gauntlet.toLowerCase()]: {
      name: "Neon Sentinel – Recall Gauntlet",
      description: "Cancel your gauntlet beacon (15% cancellation fee)",
      methods: [
        {
          name: "recall_gauntlet",
          entrypoint: "recall_gauntlet",
          description: "Cancel beacon and receive refund minus fee",
        },
      ],
    },
    [DOJO_SEPOLIA.systems.settle_gauntlet.toLowerCase()]: {
      name: "Neon Sentinel – Settle Gauntlet",
      description: "Expire an unbeaten beacon and return stake to sentinel",
      methods: [
        {
          name: "settle_gauntlet",
          entrypoint: "settle_gauntlet",
          description: "Settle an expired gauntlet beacon",
        },
      ],
    },
    [DOJO_SEPOLIA.systems.claim_abandoned_stake.toLowerCase()]: {
      name: "Neon Sentinel – Claim Abandoned Stake",
      description: "Claim STRK from an unresolved gauntlet attempt",
      methods: [
        {
          name: "claim_abandoned_stake",
          entrypoint: "claim_abandoned_stake",
          description: "Reclaim stake from an abandoned gauntlet attempt",
        },
      ],
    },
  },
};
