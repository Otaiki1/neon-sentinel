
const TORII_URL = "https://api.cartridge.gg/x/neon-sentinel-test/torii/graphql";
const ADDRESS = "0x00F4F369B67F22880689De9Fc617678624932124482Ca6eF691F6487d6080dD6";

async function testNormalization() {
    const raw = ADDRESS;
    const lower = ADDRESS.toLowerCase();
    const stripped = "0x" + BigInt(ADDRESS).toString(16);
    const padded = "0x" + BigInt(ADDRESS).toString(16).padStart(64, '0');

    console.log("Variations:");
    console.log("Raw:", raw);
    console.log("Lower:", lower);
    console.log("Stripped:", stripped);
    console.log("Padded:", padded);

    const variants = [raw, lower, stripped, padded];
    const unique = [...new Set(variants)];

    for (const v of unique) {
        console.log(`\nTesting ${v}:`);
        const query = `
            query($address: String!) {
                neonSentinelPlayerProfileModels(where: { player_address: $address }) {
                    edges {
                        node {
                            player_address
                            coins
                        }
                    }
                }
            }
        `;
        const resp = await fetch(TORII_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query, variables: { address: v } }),
        });
        const result = await resp.json();
        if (result.data?.neonSentinelPlayerProfileModels.edges.length > 0) {
            console.log(`✅ MATCHED with ${v}`);
        } else {
            console.log(`[-] No match with ${v}`);
        }
    }
}

testNormalization();
