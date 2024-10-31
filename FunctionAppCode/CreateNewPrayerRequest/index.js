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

module.exports = async function CreateNewPrayerRequest(context, req) {
    context.log('Received request:', JSON.stringify(req.body));

    let body;
    try {
        body = JSON.parse(req.body);
    } catch (e) {
        body = req.body;
    }

    const { firstName, lastName, dateOfRequest, typeOfRequest, initialRequest } = body;

    context.log('Parsed Parameters:', { firstName, lastName, dateOfRequest, typeOfRequest, initialRequest });

    try {
        await sql.connect(config);
        context.log('Connected to database');

        const query = `INSERT INTO PrayerRequests (FirstName, LastName, DateOfRequest, TypeOfRequest, InitialRequest) 
                       VALUES (@FirstName, @LastName, @DateOfRequest, @TypeOfRequest, @InitialRequest)`;

        const request = new sql.Request();
        request.input('FirstName', sql.NVarChar, firstName);
        request.input('LastName', sql.NVarChar, lastName);
        request.input('DateOfRequest', sql.DateTime, dateOfRequest);
        request.input('TypeOfRequest', sql.NVarChar, typeOfRequest);
        request.input('InitialRequest', sql.NVarChar, initialRequest);

        context.log('SQL Query:', query);
        context.log('Parameters:', { firstName, lastName, dateOfRequest, typeOfRequest, initialRequest });

        const result = await request.query(query);
        context.log('Query executed successfully:', result);

        cache.set('createNewPrayerRequestRan', true);

        context.res = {
            status: 200,
            body: {
                firstName,
                lastName,
                dateOfRequest,
                typeOfRequest,
                initialRequest
            }
        };
    } catch (err) {
        context.log.error('Error occurred:', err);

        context.res = {
            status: 500,
            body: "Error: " + err.message
        };
    }
};
