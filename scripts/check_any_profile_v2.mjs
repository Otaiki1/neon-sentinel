
const TORII_URL = "https://api.cartridge.gg/x/neon-sentinel-test/torii/graphql";

async function checkAnyProfileProperly() {
    const query = `
    query {
      neonSentinelPlayerProfileModels(limit: 5) {
        edges {
          node {
            player_address
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
    console.log("Result:", JSON.stringify(result, null, 2));
}

checkAnyProfileProperly();
