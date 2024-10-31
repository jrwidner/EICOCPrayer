const sql = require('mssql');
const NodeCache = require('node-cache');
const cache = require('../cache'); // Import shared cache

const config = {
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: true,
        enableArithAbort: true
    }
};

module.exports = async function UpdatePrayerRequest(context, req) {
    context.log('Received request:', JSON.stringify(req.body));

    let body;
    try {
        body = JSON.parse(req.body);
    } catch (e) {
        body = req.body;
    }
    const { Id, UpdateToRequest, DateOfUpdate } = body;

    context.log('Received values:', { Id, UpdateToRequest, DateOfUpdate });

    try {
        await sql.connect(config);
        const request = new sql.Request();
        request.input('UpdateToRequest', sql.NVarChar, UpdateToRequest);
        request.input('DateOfUpdate', sql.Date, DateOfUpdate);
        request.input('Id', sql.Int, Id);

        const query = `UPDATE PrayerRequests SET UpdateToRequest = @UpdateToRequest, DateOfUpdate = @DateOfUpdate WHERE Id = @Id`;
        
        context.log('Executing query:', query);

        const result = await request.query(query);

        context.log('Query result:', result);

        cache.set('updatePrayerRequestRan', true);

        context.res = {
            status: 200,
            body: "Prayer request updated successfully"
        };
    } catch (err) {
        context.log('Error:', err);

        context.res = {
            status: 500,
            body: "Error: " + err
        };
    }
};
