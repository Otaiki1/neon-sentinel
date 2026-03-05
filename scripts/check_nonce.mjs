
import { RpcProvider } from "starknet";

const RPC_URL = "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_9/EXU6tBQoqumAZD4zPXjD-SWOurlSWxR_";
const ADDRESS = "0x00F4F369B67F22880689De9Fc617678624932124482Ca6eF691F6487d6080dD6";

async function checkNonce() {
    const provider = new RpcProvider({ nodeUrl: RPC_URL });
    const nonce = await provider.getNonceForAddress(ADDRESS);
    console.log("Nonce for address:", nonce);
}

checkNonce();
