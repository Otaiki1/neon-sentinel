
const TORII_URL = "https://api.cartridge.gg/x/neon-sentinel-test/torii/graphql";

async function findAnyData() {
    const models = [
        { name: "neonSentinelPlayerProfileModels", node: "player_address coins" },
        { name: "neonSentinelPlayerModels", node: "player_address run_id" },
        { name: "neonSentinelCoinShopGlobalModels", node: "owner" },
        { name: "neonSentinelTokenPurchaseConfigModels", node: "owner strk_token_address" }
    ];

    for (const m of models) {
        console.log(`\n--- Fetching from ${m.name} ---`);
        const query = `
            query {
                ${m.name}(limit: 5) {
                    edges {
                        node {
                            ${m.node}
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
        if (result.errors) {
            console.log("Error:", result.errors[0].message);
        } else {
            console.log(JSON.stringify(result.data[m.name].edges.map(e => e.node), null, 2));
        }
    }
}

findAnyData();
