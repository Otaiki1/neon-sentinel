
const TORII_URL = "https://api.cartridge.gg/x/neon-sentinel-test/torii/graphql";

async function checkModelFields() {
    const query = `
    query {
      __type(name: "neon_sentinel_PlayerProfile") {
        fields {
          name
          type {
            name
            kind
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
    console.log("PlayerProfile Fields:", JSON.stringify(result.data.__type.fields, null, 2));
}

checkModelFields();
