
const TORII_URL = "https://api.cartridge.gg/x/neon-sentinel-test/torii/graphql";

async function checkToriiSync() {
    // Torii exposes the current sync state in some versions
    const query = `
    query {
      metadata {
        blockNumber
        worldAddress
      }
    }
  `;
    const response = await fetch(TORII_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
    });
    const result = await response.json();
    console.log("Sync Info:", JSON.stringify(result, null, 2));
}

checkToriiSync();
