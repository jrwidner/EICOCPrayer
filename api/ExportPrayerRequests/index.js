const { TableClient, AzureNamedKeyCredential } = require("@azure/data-tables");
const { Document, Packer, Paragraph, TextRun } = require("docx");

const account = "your-storage-account-name";
const accountKey = "your-storage-account-key";
const tableName = "PrayerRequests";

const credential = new AzureNamedKeyCredential(account, accountKey);
const client = new TableClient(`https://${account}.table.core.windows.net`, tableName, credential);

module.exports = async function (context, req) {
    if (req.method === 'POST') {
        const entities = client.listEntities();
        const doc = new Document();
        for await (const entity of entities) {
            const text = `
                Date of Request: ${entity.dateOfRequest}
                Name: ${entity.name}
                Type of Prayer Request: ${entity.type}
                Description: ${entity.description}
                Date of Update: ${entity.dateOfUpdate}
                Update: ${entity.update}
                \n
            `;
            doc.addSection({
                children: [
                    new Paragraph({
                        children: [new TextRun(text)],
                    }),
                ],
            });
        }

        const buffer = await Packer.toBuffer(doc);
        context.res = {
            body: buffer,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': 'attachment; filename="prayer_requests.docx"',
            },
        };
    } else {
        context.res = {
            status: 405,
            body: "Method not allowed."
        };
    }
};
