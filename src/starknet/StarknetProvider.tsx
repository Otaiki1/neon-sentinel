import React from "react";
import { ControllerConnector } from "@cartridge/connector";
import { sepolia, type Chain } from "@starknet-react/chains";
import { StarknetConfig, cartridge, jsonRpcProvider } from "@starknet-react/core";
import { DOJO_SEPOLIA } from "../dojo/config";
import { neonSentinelPolicies } from "./policies";

const connector = new ControllerConnector({
  policies: neonSentinelPolicies,
  lazyload: true,
});

const provider = jsonRpcProvider({
  rpc: (_chain: Chain) => ({ nodeUrl: DOJO_SEPOLIA.rpcUrl }),
});

export function StarknetProvider({ children }: { children: React.ReactNode }) {
  return (
    <StarknetConfig
      autoConnect
      chains={[sepolia]}
      defaultChainId={sepolia.id}
      provider={provider}
      connectors={[connector]}
      explorer={cartridge}
    >
      {children}
    </StarknetConfig>
  );
}

