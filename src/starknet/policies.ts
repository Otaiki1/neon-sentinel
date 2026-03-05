import { DOJO_SEPOLIA } from "../dojo/config";

export const neonSentinelPolicies = {
  contracts: {
    [DOJO_SEPOLIA.systems.init_game.toLowerCase()]: {
      name: "Neon Sentinel – Start Run",
      description: "Start a new game run",
      methods: [{ name: "init_game", entrypoint: "init_game" }],
    },
    [DOJO_SEPOLIA.systems.end_run.toLowerCase()]: {
      name: "Neon Sentinel – End Run",
      description: "Finish run and submit final score",
      methods: [{ name: "end_run", entrypoint: "end_run" }],
    },
    [DOJO_SEPOLIA.systems.submit_leaderboard.toLowerCase()]: {
      name: "Neon Sentinel – Submit Leaderboard",
      description: "Submit run to weekly leaderboard",
      methods: [
        { name: "submit_leaderboard", entrypoint: "submit_leaderboard" },
      ],
    },
    [DOJO_SEPOLIA.systems.claim_coins.toLowerCase()]: {
      name: "Neon Sentinel – Claim Coins",
      description: "Claim daily coins",
      methods: [{ name: "claim_coins", entrypoint: "claim_coins" }],
    },
    [DOJO_SEPOLIA.systems.spend_coins.toLowerCase()]: {
      name: "Neon Sentinel – Spend Coins",
      description: "Spend in-game coins",
      methods: [{ name: "spend_coins", entrypoint: "spend_coins" }],
    },
    [DOJO_SEPOLIA.systems.spend_revive.toLowerCase()]: {
      name: "Neon Sentinel – Revive",
      description: "In-run revive (cost scales)",
      methods: [{ name: "spend_revive", entrypoint: "spend_revive" }],
    },
    [DOJO_SEPOLIA.systems.purchase_cosmetic.toLowerCase()]: {
      name: "Neon Sentinel – Purchase Cosmetic",
      description: "Unlock kernel, avatar, or skin",
      methods: [{ name: "purchase_cosmetic", entrypoint: "purchase_cosmetic" }],
    },
    [DOJO_SEPOLIA.systems.buy_coins.toLowerCase()]: {
      name: "Neon Sentinel – Buy Coins",
      description: "Purchase in-game coins with STRK",
      methods: [{ name: "buy_coins", entrypoint: "buy_coins" }],
    },
    [DOJO_SEPOLIA.systems.purchase_mini_me_unit.toLowerCase()]: {
      name: "Neon Sentinel – Purchase Mini-Me Unit",
      description: "Add a Mini-Me unit to inventory",
      methods: [
        { name: "purchase_mini_me_unit", entrypoint: "purchase_mini_me_unit" },
      ],
    },
    [DOJO_SEPOLIA.systems.purchase_mini_me_sessions.toLowerCase()]: {
      name: "Neon Sentinel – Purchase Mini-Me Sessions",
      description: "Purchase +3 Mini-Me sessions pack",
      methods: [
        {
          name: "purchase_mini_me_sessions",
          entrypoint: "purchase_mini_me_sessions",
        },
      ],
    },
  },
};

