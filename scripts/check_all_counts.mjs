
const TORII_URL = "https://api.cartridge.gg/x/neon-sentinel-test/torii/graphql";

async function queryTorii(query) {
    const response = await fetch(TORII_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
    });
    return await response.json();
}

async function checkAnyData() {
    console.log("Checking for ANY data in PlayerProfile and Player models...");
    
    const query = `
    query {
      neonSentinelPlayerProfileModels {
        totalCount
      }
      neonSentinelPlayerModels {
        totalCount
      }
      neonSentinelCoinShopGlobalModels {
        totalCount
      }
    }
    `;

    try {
        const res = await queryTorii(query);
        if (res.errors) {
            console.error("Query Errors:", res.errors);
            return;
        }
        
        console.log("Global Config Counts:", res.data.neonSentinelCoinShopGlobalModels.totalCount);
        console.log("Total Player Profiles:", res.data.neonSentinelPlayerProfileModels.totalCount);
        console.log("Total Player Statuses:", res.data.neonSentinelPlayerModels.totalCount);
        
    } catch (e) {
        console.error("Failed to query Torii:", e);
    }
}

checkAnyData();
