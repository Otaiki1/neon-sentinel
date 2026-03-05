
import { RpcProvider, num } from "starknet";

const RPC_URL = "https://api.cartridge.gg/x/starknet/sepolia";
const WORLD_ADDRESS = "0x07bcbeb6104a77c6c90d7285ba06c2623454a38b501554c0d1645013fe610fc1";

async function verifyOnChainWorld() {
    const provider = new RpcProvider({ nodeUrl: RPC_URL });
    
    // Querying the world to see if it knows about the coin shop global
    // 1. Get the model storage for neon_sentinel-CoinShopGlobal
    // Model ID = hash of "neon_sentinel-CoinShopGlobal"
    // But we can just try to call the world's entity function
    try {
        const result = await provider.callContract({
            contractAddress: WORLD_ADDRESS,
            entrypoint: "entity",
            calldata: [
                num.toHex(num.getSelectorFromName("neon_sentinel")), // Namespace
                num.toHex(num.getSelectorFromName("CoinShopGlobal")), // Model
                "1", // Keys len
                "0", // Key: ZERO_FELT
                "0", // Layout len (not used)
            ]
        });
        console.log("On-Chain World Response:", result);
    } catch (e) {
        console.log("On-Chain Check Failed:", e.message);
    }
}

verifyOnChainWorld();
