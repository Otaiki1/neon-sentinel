
/**
 * Neon Sentinel Torii Verification Script
 * Use this to verify if the Torii indexer is returning data for your address.
 * 
 * Usage: node torii_verification.mjs [address]
 */

const TORII_URL = "https://api.cartridge.gg/x/neon-sentinel-test/torii/graphql";
const DEFAULT_ADDRESS = "0x00F4F369B67F22880689De9Fc617678624932124482Ca6eF691F6487d6080dD6";
const address = (process.argv[2] || DEFAULT_ADDRESS).toLowerCase();

async function queryTorii(query, variables = {}) {
    const response = await fetch(TORII_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables }),
    });
    const result = await response.json();
    if (result.errors) {
        return { error: result.errors[0].message };
    }
    return result.data;
}

async function verify() {
    console.log(`\n--- VERIFYING TORII DATA FOR: ${address} ---\n`);

    const checks = [
        {
            name: "Player Profile",
            query: `query($address: String!) { neonSentinelPlayerProfileModels(where: { player_address: $address }) { edges { node { player_address coins lifetime_score current_prestige } } } }`,
            model: "neonSentinelPlayerProfileModels"
        },
        {
            name: "Player Run Status",
            query: `query($address: String!) { neonSentinelPlayerModels(where: { player_address: $address }) { edges { node { player_address is_active run_id } } } }`,
            model: "neonSentinelPlayerModels"
        },
        {
            name: "Mini-Me Inventory",
            query: `query($address: String!) { neonSentinelMiniMeInventoryModels(where: { player_address: $address }) { edges { node { player_address unit_type count } } } }`,
            model: "neonSentinelMiniMeInventoryModels"
        },
        {
            name: "Coin Purchases",
            query: `query($address: String!) { neonSentinelCoinsPurchasedModels(where: { player: $address }) { edges { node { player strk_amount coins_minted } } } }`,
            model: "neonSentinelCoinsPurchasedModels"
        },
        {
            name: "Leaderboard (Top 3)",
            query: `query { neonSentinelLeaderboardEntryModels(limit: 3) { edges { node { player_address final_score } } } }`,
            model: "neonSentinelLeaderboardEntryModels"
        }
    ];

    for (const check of checks) {
        try {
            const data = await queryTorii(check.query, { address });
            if (data.error) {
                console.log(`❌ [${check.name}]: Error - ${data.error}`);
            } else if (data[check.model]?.edges?.length > 0) {
                console.log(`✅ [${check.name}]: SUCCESS! Found data.`);
                console.log(JSON.stringify(data[check.model].edges[0].node, null, 2));
            } else {
                console.log(`[-] [${check.name}]: EMPTY. No records found for this address in ${check.model}.`);
            }
        } catch (e) {
            console.log(`❌ [${check.name}]: Failed to reach Torii.`);
        }
    }

    console.log("\n-------------------------------------------");
    console.log("If all results are EMPTY, it means the Torii indexer has no records for this address.");
    console.log("Check if you have successfully broadcasted transactions on Sepolia.");
    console.log("-------------------------------------------\n");
}

verify();
