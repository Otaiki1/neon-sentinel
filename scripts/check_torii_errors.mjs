
const TORII_URL = "https://api.cartridge.gg/x/neon-sentinel-test/torii/graphql";

async function checkWorldWithErrors() {
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
    const response = await fetch(TORII_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
    });
    const result = await response.json();
    console.log("Full Result:", JSON.stringify(result, null, 2));
}

checkWorldWithErrors();
