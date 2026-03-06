
const TORII_URL = "https://api.cartridge.gg/x/neon-sentinel-test/torii/graphql";

async function checkMetadata() {
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
    const resp = await fetch(TORII_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
    });
    const result = await resp.json();
    console.log(JSON.stringify(result, null, 2));
}

checkMetadata();
