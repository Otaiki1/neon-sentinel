
const TORII_URL = "https://api.cartridge.gg/x/neon-sentinel-test/torii/graphql";

async function queryTorii(query) {
    const response = await fetch(TORII_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
    });
    return await response.json();
}

async function checkOwner() {
    const query = `
    query {
      neonSentinelCoinShopGlobalModels(limit: 1) {
        edges {
          node {
            owner
          }
        }
      }
    }
  `;
    const res = await queryTorii(query);
    const owner = res.data.neonSentinelCoinShopGlobalModels.edges[0]?.node?.owner;
    console.log("Indexer World Owner Address:", owner);
}

checkOwner();
