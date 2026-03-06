
import { RpcProvider, hash } from "starknet";

const RPC_URL = "https://api.cartridge.gg/x/starknet/sepolia";
const WORLD_ADDRESS = "0x07bcbeb6104a77c6c90d7285ba06c2623454a38b501554c0d1645013fe610fc1";

async function verifyOnChain() {
    const provider = new RpcProvider({ nodeUrl: RPC_URL });
    const ns = hash.getSelectorFromName("neon_sentinel"); 
    const model = hash.getSelectorFromName("CoinShopGlobal"); 
    
    try {
        const result = await provider.callContract({
            contractAddress: WORLD_ADDRESS,
            entrypoint: "entity",
            calldata: [ns, model, "1", "0", "0"]
        });
        console.log("On-Chain Global Config Found:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.log("On-Chain Check Failed (World Error):", e.message);
    }
}

verifyOnChain();
