
const TORII_URL = "https://api.cartridge.gg/x/neon-sentinel-test/torii/graphql";

async function checkToriiSchemaToFile() {
    const query = `
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
    const response = await fetch(TORII_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
    });
    const result = await response.json();
    const fields = result.data.__schema.queryType.fields.map(f => f.name).join("\n");
    console.log(fields);
}

checkToriiSchemaToFile();
