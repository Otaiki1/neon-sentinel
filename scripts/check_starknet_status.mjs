
import { RpcProvider } from "starknet";

const RPC_URL = "https://api.cartridge.gg/x/starknet/sepolia";
const ADDRESS = "0x00F4F369B67F22880689De9Fc617678624932124482Ca6eF691F6487d6080dD6";

async function checkNonce() {
    const provider = new RpcProvider({ nodeUrl: RPC_URL });
    try {
        const nonce = await provider.getNonceForAddress(ADDRESS);
        console.log("Nonce on Cartridge RPC:", nonce);
        
        const balance = await provider.callContract({
            contractAddress: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d", // STRK
            entrypoint: "balanceOf",
            calldata: [ADDRESS]
        });
        console.log("STRK Balance (low):", balance[0]);
    } catch (e) {
        console.log("Failed to fetch info:", e.message);
    }
}

checkNonce();
