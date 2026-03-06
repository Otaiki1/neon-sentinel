
const TORII_URL = "https://api.cartridge.gg/x/neon-sentinel-test/torii/graphql";

async function queryTorii(query) {
    const response = await fetch(TORII_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
    });
    return await response.json();
}

async function checkAll() {
    console.log("Scanning models in Torii...");
    const introspectQuery = `
        query {
            __schema {
                queryType {
                    fields {
                        name
                    }
                }
            }
        }
    `;
    const intro = await queryTorii(introspectQuery);
    const fields = intro.data.__schema.queryType.fields.map(f => f.name);
    
    const modelFields = fields.filter(f => f.endsWith("Models") && !f.startsWith("__"));
    console.log(`Found ${modelFields.length} potential models.`);

    for (const model of modelFields) {
        const q = `query { ${model}(limit: 1) { edges { node { __typename } } } }`;
        const res = await queryTorii(q);
        const count = res.data[model].edges.length;
        if (count > 0) {
            console.log(`✅ [${model}] has data!`);
        } else {
            console.log(`[-] [${model}] is empty.`);
        }
    }
}

checkAll();
