
import { RpcProvider } from "starknet";

const RPC_URL = "https://api.cartridge.gg/x/starknet/sepolia";
const ADDRESS = "0x00F4F369B67F22880689De9Fc617678624932124482Ca6eF691F6487d6080dD6";

async function checkCartridgeNonce() {
    const provider = new RpcProvider({ nodeUrl: RPC_URL });
    try {
        const nonce = await provider.getNonceForAddress(ADDRESS);
        console.log("Nonce on Cartridge Proxy RPC:", nonce);
    } catch (e) {
        console.log("Error fetching nonce:", e.message);
    }
}

checkCartridgeNonce();
