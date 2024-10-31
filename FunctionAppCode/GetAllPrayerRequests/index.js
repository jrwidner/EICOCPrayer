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

module.exports = async function GetAllPrayerRequests(context, req) {
    try {
        const cachedResult = cache.get('prayerRequests');
        const createNewPrayerRequestRan = cache.get('createNewPrayerRequestRan');
        const updatePrayerRequestRan = cache.get('updatePrayerRequestRan');

        if (cachedResult && !createNewPrayerRequestRan && !updatePrayerRequestRan) {
            context.res = {
                status: 200,
                body: cachedResult
            };
        } else {
            await sql.connect(config);
            const result = await sql.query`SELECT * FROM PrayerRequests ORDER BY DateOfRequest DESC, DateOfUpdate DESC`;
            cache.set('prayerRequests', result.recordset);
            context.res = {
                status: 200,
                body: result.recordset
            };
            cache.set('createNewPrayerRequestRan', false);
            cache.set('updatePrayerRequestRan', false);
        }
    } catch (err) {
        context.res = {
            status: 500,
            body: "Error: " + err
        };
    }
};
