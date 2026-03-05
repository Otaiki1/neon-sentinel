
const TORII_URL = "https://api.cartridge.gg/x/neon-sentinel-test/torii/graphql";

async function queryTorii(query) {
    const response = await fetch(TORII_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
    });
    return await response.json();
}

async function checkIndexerWorldAddress() {
    // Torii exposes world info if configured.
    const query = `
    query {
      neonSentinelCoinShopGlobalModels(limit: 1) {
        totalCount
      }
    }
  `;
    const res = await queryTorii(query);
    console.log("Global Config result:", JSON.stringify(res, null, 2));
}

checkIndexerWorldAddress();
