export const DOJO_SEPOLIA = {
  chain: "sepolia",
  rpcUrl: "https://api.cartridge.gg/x/starknet/sepolia",
  toriiBaseUrl: "https://api.cartridge.gg/x/neon-sentinel-torii/torii",
  toriiGraphqlUrl: "https://api.cartridge.gg/x/neon-sentinel-torii/torii/graphql",
  worldAddress:
    "0x0630209d4cb66a85c81be364abd9fd257d766d922d252d1ec8af64bfdc11bf97",
  systems: {
    actions:
      "0x053c4ec475d4722fc76073067163530563ff0edeaa9e7bdd90450f5aeaede16c",
    init_game:
      "0x02666cb64a3d3f31d407b10e11ec5d03b0babe3c812929120b15e336539819c4",
    end_run:
      "0x032d5608e59a39bf9d63a9efa9900be2116c3e91b269c39f136f6845e8c446ea",
    submit_leaderboard:
      "0x07f4a9f231ba97a07fce921e91ed6df985eb62ffd622eef50299a0ff65607cd9",
    claim_coins:
      "0x06042da7579cf81e5d74740f7255549587f43cfb2fcb4b08ecb68e80fdb5c485",
    spend_coins:
      "0x008b6b436a9ad81c32dac1aa1e2b711c787772b95f1780177801bcc0fd2bd4ed",
    spend_revive:
      "0x04e9232a1129f9258b63b2951a5c0e791d00defc5a2307083ccf896025a23b31",
    purchase_cosmetic:
      "0x033a809ad5e3ec0507c2bef03301f4cc12ba0add2b32420bceaf44d9e9a85212",
    buy_coins:
      "0x04fdf8467cdd39aebac61733510c6b6ec1d719f5b55a11380564aff15a1c6238",
    purchase_mini_me_unit:
      "0x026138786ee745466b5e66c8c7fafee09e2461ad9de07acc02f961f5515b4430",
    purchase_mini_me_sessions:
      "0x06e6385c694fe3366c276d963aeddada3f6ecd6f9763629a6cde4a8112b9c24c",
    // Gauntlet Protocol
    throw_gauntlet:
      "0x02c1216690920153b2b40105a87ed7cd8f23902689eddbfb9ad384297416683e",
    answer_gauntlet:
      "0x02ab89f49c8d1972b515e3b97a9d821318e2a2536ec57039358127426e159bc4",
    submit_gauntlet_result:
      "0x04fe57853f2932dffd2bb34becadf006bca05ca5bfac6a8666c5e5419b8bf50c",
    recall_gauntlet:
      "0x07d45058502b18667fd44b07796e985537629158fa1ada465aaf6222756d351a",
    settle_gauntlet:
      "0x04993e540cb5698580dde93592642a20200784ae7dc52eac0e606e697380bff0",
    claim_abandoned_stake:
      "0x01c4737a5f574bdc00d4dbe70a0bccdbf89ef73144b05fe593d5f492a96c8934",
  },
} as const;

export type NeonSentinelSystemKey = keyof typeof DOJO_SEPOLIA.systems;

export function getNeonSentinelSystemAddress(key: NeonSentinelSystemKey): string {
  return DOJO_SEPOLIA.systems[key];
}

