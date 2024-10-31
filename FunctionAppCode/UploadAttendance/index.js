const pdf = require('pdf-parse');
const sql = require('mssql');
const fs = require('fs');
const path = require('path');

// Azure SQL Database configuration
const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: true // Use encryption
    }
};

// Function to parse PDF and extract attendance data
async function parsePDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    const text = data.text;

    // Extract date from the bottom of the page
    const dateMatch = text.match(/(\d{2}\/\d{2}\/\d{4})/);
    const date = dateMatch ? dateMatch[0] : null;

    // Extract attendance records
    const records = [];
    const lines = text.split('\n');
    lines.forEach(line => {
        const parts = line.split(' ');
        if (parts.length > 2) {
            const lastName = parts[0];
            const firstName = parts[1];
            const tag = parts.slice(2).join(' ');
            records.push({ lastName, firstName, tag });
        }
    });

    return { date, records };
}

// Function to update Azure SQL Database
async function updateDatabase(service, date, records) {
    try {
        await sql.connect(config);
        const request = new sql.Request();

        for (const record of records) {
            await request.query(`
                INSERT INTO Attendance (Service, Date, LastName, FirstName, Tag)
                VALUES ('${service}', '${date}', '${record.lastName}', '${record.firstName}', '${record.tag}')
            `);
        }

        console.log('Database updated successfully');
    } catch (err) {
        console.error('Error updating database:', err);
    } finally {
        await sql.close();
    }
}

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    if (req.body && req.body.files) {
        try {
            for (const file of req.body.files) {
                const filePath = path.join('/tmp', file.filename);
                fs.writeFileSync(filePath, Buffer.from(file.content, 'base64'));

                const service = file.filename.split(' ')[1]; // Extract service from filename

                const { date, records } = await parsePDF(filePath);
                if (date && records.length > 0) {
                    await updateDatabase(service, date, records);
                } else {
                    context.log(`No valid data found in the PDF: ${file.filename}`);
                }

                fs.unlinkSync(filePath); // Delete the file after processing
            }

            context.res = {
                status: 200,
                body: 'Files processed and database updated successfully.'
            };
        } catch (err) {
            context.res = {
                status: 500,
                body: 'Error processing files.'
            };
        }
    } else {
        context.res = {
            status: 400,
            body: 'No files uploaded.'
        };
    }
};
