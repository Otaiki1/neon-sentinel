
const TORII_URL = "https://api.cartridge.gg/x/neon-sentinel-test/torii/graphql";

async function queryTorii(query) {
    const response = await fetch(TORII_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
    });
    return await response.json();
}

async function checkEvents() {
    console.log("Checking for ANY events in Torii...");
    
    const query = `
    query {
      neonSentinelCoinSpentModels { totalCount }
      neonSentinelCoinsPurchasedModels { totalCount }
      neonSentinelCoinShopInitializedModels { totalCount }
      neonSentinelGameEventModels { totalCount }
    }
    `;

    try {
        const res = await queryTorii(query);
        console.log("Event Counts:", JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error("Failed:", e);
    }
}

checkEvents();
