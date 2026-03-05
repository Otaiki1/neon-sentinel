export const DOJO_SEPOLIA = {
  chain: "sepolia",
  rpcUrl: "https://api.cartridge.gg/x/starknet/sepolia",
  toriiBaseUrl: "https://api.cartridge.gg/x/neon-sentinel-test/torii",
  toriiGraphqlUrl: "https://api.cartridge.gg/x/neon-sentinel-test/torii/graphql",
  worldAddress:
    "0x07bcbeb6104a77c6c90d7285ba06c2623454a38b501554c0d1645013fe610fc1",
  systems: {
    actions:
      "0x11501c9707e5d8e11be1ea2382593aca835680687a589b56a8b737aea62e11d",
    init_game:
      "0x7bfc2d91139c0cf95a9b9aeb45be1be5b7da241c2018751b8a4b1b6b4f75a12",
    end_run:
      "0x75e9efe4e27dcfd10c92d30971b6fddc67ee5778a6af6917bf0f7f3f864d601",
    submit_leaderboard:
      "0x7511c7a0575ad7533a1f93c46039ac1956a538223828b49928a3da567d81dc1",
    claim_coins:
      "0x2210b7fe00d1366551f5cb70b0c8a5605a631a08f3a152838be22b288769afa",
    spend_coins:
      "0x393939f3fb43e93c2f3af3a0c7a0c0a1d76677d6c66afd8437afe246870f05f",
    spend_revive:
      "0xf9043a3cdd3ceb402fe33b459efe0566008a5680ef2e96fa74414b8063556b",
    purchase_cosmetic:
      "0x1eea8a9d7fce403f9ecf491e0cc0682b6b3617f23edb98f746bf996e43b0949",
    buy_coins:
      "0x23fcb5bfa687c332a012898cb916559e54b4e56e83ccfd3c7f5aa1d83614b25",
    purchase_mini_me_unit:
      "0x23f7c4b3be610071961e3b78e49d79bab439e36952fad9ef3eda72ff4254ded",
    purchase_mini_me_sessions:
      "0x6d51b77216ea946c0d33cba1667fe7b23130c12387c01429324a79bc1aee8c0",
  },
} as const;

export type NeonSentinelSystemKey = keyof typeof DOJO_SEPOLIA.systems;

export function getNeonSentinelSystemAddress(key: NeonSentinelSystemKey): string {
  return DOJO_SEPOLIA.systems[key];
}

