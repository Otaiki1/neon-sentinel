
const TORII_URL = "https://api.cartridge.gg/x/neon-sentinel-test/torii/graphql";

async function checkAnyProfile() {
    const query = `
    query {
      neonSentinelPlayerProfileModels(limit: 5) {
        edges {
          node {
            player_address
            coins
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
    console.log("Profiles in Torii:", JSON.stringify(result.data, null, 2));
}

checkAnyProfile();
