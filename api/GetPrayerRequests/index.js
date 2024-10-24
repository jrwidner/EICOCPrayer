const { TableClient, AzureNamedKeyCredential } = require("@azure/data-tables");

const account = "your-storage-account-name";
const accountKey = "your-storage-account-key";
const tableName = "PrayerRequests";

const credential = new AzureNamedKeyCredential(account, accountKey);
const client = new TableClient(`https://${account}.table.core.windows.net`, tableName, credential);

module.exports = async function (context, req) {
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
};
