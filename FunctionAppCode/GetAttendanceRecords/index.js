const sql = require('mssql');

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

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    try {
        await sql.connect(config);
        const result = await sql.query`
            WITH FilteredMembers AS (
                SELECT DISTINCT LastName, FirstName
                FROM FilteredAttendance
            )
            SELECT ar.*
            FROM AttendanceRecords ar
            JOIN FilteredMembers fm ON ar.LastName = fm.LastName AND ar.FirstName = fm.FirstName
            WHERE ar.Date IN (
                SELECT DISTINCT TOP 52 Date
                FROM AttendanceRecords
                ORDER BY Date DESC
            )
        `;

        context.res = {
            status: 200,
            body: result.recordset
        };
    } catch (err) {
        context.log('Error fetching attendance records:', err);
        context.res = {
            status: 500,
            body: `Error fetching attendance records: ${err.message}`
        };
    } finally {
        await sql.close();
    }
};