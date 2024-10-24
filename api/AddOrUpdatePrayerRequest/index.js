const { TableClient, AzureNamedKeyCredential } = require("@azure/data-tables");

const account = "eicocprayer";
const accountKey = "IKd3TKmZDutZOSggUAaCzP1ERdk8feogKtBNGgiwGgTszfLqlvztOSzq5EolgV7wv5ECQKPGNtKo+AStHLAexw==";
const tableName = "PrayerRequests";

const credential = new AzureNamedKeyCredential(account, accountKey);
const client = new TableClient(`https://${account}.table.core.windows.net`, tableName, credential);

module.exports = async function (context, req) {
    if (req.method === 'POST') {
        const { id, update } = req.body;
        const dateOfUpdate = new Date().toISOString();

        try {
            const entity = await client.getEntity("PrayerRequests", id);
            entity.update = update;
            entity.dateOfUpdate = dateOfUpdate;

            await client.updateEntity(entity, "Merge");
            context.res = {
                status: 200,
                body: "Prayer request updated successfully."
            };
        } catch (error) {
            context.res = {
                status: 404,
                body: "Prayer request not found."
            };
        }
    } else {
        context.res = {
            status: 405,
            body: "Method not allowed."
        };
    }
};
