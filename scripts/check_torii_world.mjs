
const TORII_URL = "https://api.cartridge.gg/x/neon-sentinel-test/torii/graphql";

async function checkToriiWorld() {
    // Torii usually has metadata or World model
    const query = `
    query {
      metadata {
        uri
        worldAddress
        blockNumber
      }
    }
  `;
    const response = await fetch(TORII_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
    });
    const result = await response.json();
    console.log("Torii Indexer Info:", JSON.stringify(result.data, null, 2));
}

checkToriiWorld();
