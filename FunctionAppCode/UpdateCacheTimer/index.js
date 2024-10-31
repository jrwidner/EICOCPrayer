const sql = require('mssql');
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

module.exports = async function UpdateCacheTimer(context, myTimer) {
    const timeStamp = new Date().toISOString();
    context.log('Timer trigger function ran!', timeStamp);

    try {
        await sql.connect(config);
        context.log('Connected to database');

        const result = await sql.query`SELECT * FROM PrayerRequests ORDER BY DateOfRequest DESC, DateOfUpdate DESC`;
        context.log('Query executed successfully:', result);

        cache.set('prayerRequests', result.recordset);
        context.log('Cache updated successfully');
    } catch (err) {
        context.log.error('Error updating cache:', err);

        context.res = {
            status: 500,
            body: "Error: " + err.message
        };
    }
};
