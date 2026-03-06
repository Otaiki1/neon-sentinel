
const TORII_URL = "https://api.cartridge.gg/x/neon-sentinel-test/torii/graphql";

async function queryTorii(query) {
    const response = await fetch(TORII_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
    });
    return await response.json();
}

async function checkWorld() {
    const query = `
    query {
      neonSentinelCoinShopGlobalModels(limit: 1) {
        edges {
          node {
            owner
            initialized
          }
        }
      }
    }
  `;
    const res = await queryTorii(query);
    console.log("Global Config:", JSON.stringify(res.data, null, 2));
    
    // Who is the owner?
    const owner = res.data.neonSentinelCoinShopGlobalModels.edges[0]?.node?.owner;
    console.log("Owner Address:", owner);
}

checkWorld();
