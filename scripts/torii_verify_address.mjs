
/**
 * Torii Data Verification Script
 * This script checks if Torii returns data for a specific address across all relevant models.
 * Usage: node scripts/torii_verify_address.mjs <address>
 */

const TORII_URL = "https://api.cartridge.gg/x/neon-sentinel-test/torii/graphql";
const DEFAULT_ADDRESS = "0x00F4F369B67F22880689De9Fc617678624932124482Ca6eF691F6487d6080dD6";

async function queryTorii(query, variables = {}) {
    const response = await fetch(TORII_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables }),
    });
    return await response.json();
}

/**
 * Normalizes address to 66-char padded format (Torii standard)
 */
function normalizeAddress(address) {
    const hex = address.replace(/^0x/, "").toLowerCase();
    return "0x" + hex.padStart(64, "0");
}

async function verify(rawAddress) {
    const address = normalizeAddress(rawAddress);
    console.log(`\n--- VERIFYING TORII DATA FOR: ${address} (Raw: ${rawAddress}) ---`);

    const checks = [
        {
            name: "Player Profile",
            model: "neonSentinelPlayerProfileModels",
            query: `query($addr: String!) { neonSentinelPlayerProfileModels(where: { player_address: $addr }) { edges { node { coins current_prestige lifetime_score } } } }`
        },
        {
            name: "Active Run Status",
            model: "neonSentinelPlayerModels",
            query: `query($addr: String!) { neonSentinelPlayerModels(where: { player_address: $addr }) { edges { node { run_id is_active } } } }`
        },
        {
            name: "Mini-Me Inventory",
            model: "neonSentinelMiniMeInventoryModels",
            query: `query($addr: String!) { neonSentinelMiniMeInventoryModels(where: { player_address: $addr }) { edges { node { unit_type count } } } }`
        },
        {
            name: "Coin Purchases",
            model: "neonSentinelCoinPurchaseRecordModels",
            query: `query($addr: String!) { neonSentinelCoinPurchaseRecordModels(where: { player_address: $addr }) { edges { node { purchase_id strk_amount } } } }`
        },
        {
            name: "Leaderboard Entries",
            model: "neonSentinelLeaderboardEntryModels",
            query: `query($addr: String!) { neonSentinelLeaderboardEntryModels(where: { player_address: $addr }) { edges { node { final_score week } } } }`
        }
    ];

    for (const check of checks) {
        process.stdout.write(`Checking ${check.name}... `);
        try {
            const res = await queryTorii(check.query, { addr: address });
            if (res.errors) {
                console.log(`❌ ERROR: ${res.errors[0].message}`);
                continue;
            }
            const data = res.data[check.model].edges;
            if (data.length > 0) {
                console.log(`✅ FOUND (${data.length} records)`);
                if (check.name === "Player Profile") {
                    console.log(`   Balance: ${data[0].node.coins} Coins, Prestige: ${data[0].node.current_prestige}`);
                }
            } else {
                console.log(`[-] EMPTY`);
            }
        } catch (e) {
            console.log(`❌ FAILED: ${e.message}`);
        }
    }

    console.log("\n--- WORLD GLOBAL CONFIG ---");
    const globalQuery = `query { neonSentinelTokenPurchaseConfigModels(limit: 1) { edges { node { coin_exchange_rate is_enabled } } } }`;
    const gRes = await queryTorii(globalQuery);
    if (gRes.data?.neonSentinelTokenPurchaseConfigModels.edges.length > 0) {
        const cfg = gRes.data.neonSentinelTokenPurchaseConfigModels.edges[0].node;
        console.log(`Coin Shop: ${cfg.is_enabled ? "ENABLED" : "DISABLED"}`);
        console.log(`Exchange Rate: 1 STRK = ${cfg.coin_exchange_rate} Coins`);
    } else {
        console.log("❌ GLOBAL CONFIG MISSING! The world might be uninitialized.");
    }
}

const inputAddr = process.argv[2] || DEFAULT_ADDRESS;
verify(inputAddr);
