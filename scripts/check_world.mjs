
const TORII_URL = "https://api.cartridge.gg/x/neon-sentinel-test/torii/graphql";

async function checkWorld() {
    const query = `
        query {
            __schema {
                queryType {
                    name
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

checkWorld();
