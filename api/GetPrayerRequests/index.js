const { TableClient, AzureNamedKeyCredential } = require("@azure/data-tables");

const account = "eicocprayer";
const accountKey = "IKd3TKmZDutZOSggUAaCzP1ERdk8feogKtBNGgiwGgTszfLqlvztOSzq5EolgV7wv5ECQKPGNtKo+AStHLAexw==";
const tableName = "PrayerRequests";

const credential = new AzureNamedKeyCredential(account, accountKey);
const client = new TableClient(`https://${account}.table.core.windows.net`, tableName, credential);

module.exports = async function (context, req) {
    try {
        if (req.method === 'GET') {
            const entities = client.listEntities();
            const requests = [];
            for await (const entity of entities) {
                requests.push(entity);
            }
            context.res = {
                status: 200,
                body: requests,
            };
        } else {
            context.res = {
                status: 405,
                body: "Method not allowed."
            };
        }
    } catch (error) {
        context.log.error("Error retrieving entities:", error.message);
        context.res = {
            status: 500,
            body: "Internal server error."
        };
    }
};
