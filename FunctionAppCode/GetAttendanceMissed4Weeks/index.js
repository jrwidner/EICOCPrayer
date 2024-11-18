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
            WITH LastFourSundays AS (
                SELECT DISTINCT TOP 4 Date
                FROM AttendanceRecords
                WHERE DATEPART(dw, Date) = 1
                ORDER BY Date DESC
            ),
            MembersPresentLastFourSundays AS (
                SELECT DISTINCT LastName, FirstName
                FROM AttendanceRecords
                WHERE Date IN (SELECT Date FROM LastFourSundays)
            ),
            MembersPresentFourOrLessTimesLastFiftyTwoWeeks AS (
                SELECT LastName, FirstName
                FROM AttendanceRecords
                WHERE Date >= DATEADD(week, -52, GETDATE())
                GROUP BY LastName, FirstName
                HAVING COUNT(DISTINCT Date) <= 4
            )
            SELECT DISTINCT fa.LastName, fa.FirstName
            FROM FilteredAttendance fa
            JOIN AttendanceRecords ar ON fa.LastName = ar.LastName AND fa.FirstName = ar.FirstName
            WHERE ar.IgnoreReason IS NULL
            AND NOT EXISTS (
                SELECT 1
                FROM MembersPresentFourOrLessTimesLastFiftyTwoWeeks mp52
                WHERE fa.LastName = mp52.LastName AND fa.FirstName = mp52.FirstName
            )
            AND NOT EXISTS (
                SELECT 1
                FROM MembersPresentLastFourSundays mp4
                WHERE fa.LastName = mp4.LastName AND fa.FirstName = mp4.FirstName
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