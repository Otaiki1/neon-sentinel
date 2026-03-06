
const TORII_URL = "https://api.cartridge.gg/x/neon-sentinel-test/torii/graphql";

async function checkToriiMetadatas() {
    const query = `
    query {
      metadatas {
        edges {
          node {
            worldAddress
            blockNumber
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
    console.log("Metadatas:", JSON.stringify(result.data, null, 2));
}

checkToriiMetadatas();
