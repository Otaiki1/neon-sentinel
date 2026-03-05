
const TORII_URL = "https://api.cartridge.gg/x/neon-sentinel-test/torii/graphql";

async function queryTorii(query) {
    const response = await fetch(TORII_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
    });
    return await response.json();
}

async function findAnyPlayer() {
    console.log("Searching for ANY player data in Torii...");
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
    const res = await queryTorii(query);
    if (res.data.neonSentinelPlayerProfileModels.edges.length > 0) {
        console.log("✅ Found SOME players:");
        console.log(JSON.stringify(res.data.neonSentinelPlayerProfileModels.edges, null, 2));
    } else {
        console.log("[-] No player profiles found at all on this indexed world.");
    }
}

findAnyPlayer();
