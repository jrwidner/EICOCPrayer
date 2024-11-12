const express = require('express');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const morgan = require('morgan');
const router = express.Router();

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Use morgan for logging
router.use(morgan('combined'));

// Function to extract worship date and service type from file name
function extractDetailsFromFileName(fileName) {
    const [date, ...serviceTypeParts] = fileName.split(' ');
    let serviceType = serviceTypeParts.join(' ').replace('.xlsx', '');
    // Remove "attendance-converted" from the service type
    serviceType = serviceType.replace('Attendance.xls', '').trim();
    // Convert date to SQL Date format (YYYY-MM-DD)
    const [month, day, year] = date.match(/(\d{2})(\d{2})(\d{2})/).slice(1);
    const formattedDate = `20${year}-${month}-${day}`;
    return { date: formattedDate, serviceType };
}

function extractNamesFromExcel(sheet, date, serviceType) {
    const records = [];
    const range = xlsx.utils.decode_range(sheet['!ref']);
    
    for (let rowNum = range.s.r + 1; rowNum <= range.e.r; rowNum++) {
        const firstName = sheet[xlsx.utils.encode_cell({ r: rowNum, c: 1 })]?.v;
        const lastName = sheet[xlsx.utils.encode_cell({ r: rowNum, c: 2 })]?.v;
        const homeAddress = sheet[xlsx.utils.encode_cell({ r: rowNum, c: 3 })]?.v;
        // Ignore records where FirstName is "First Name"
        if (firstName && firstName !== "First Name") {
            records.push({ firstName, lastName, date, serviceType, homeAddress });
        }
    }
    return records;
}


// Route to get all prayer requests
router.get('/prayer-requests', async (req, res) => {
    try {
        const response = await axios.get('GETPRAYER_ADDRESS');
        res.json(response.data);
    } catch (error) {
        console.error(`Error fetching prayer requests: ${error.message}`);
        res.status(500).json({ error: `${error.message} - URL: GETPRAYER_ADDRESS` });
    }
});

// Route to create a new prayer request
router.post('/create-prayer-request', async (req, res) => {
    try {
        const response = await axios.post('NEWPRAYER_ADDRESS', req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error(`Error creating prayer request: ${error.message}`);
        res.status(500).json({ error: `${error.message} - URL: NEWPRAYER_ADDRESS` });
    }
});

// Route to update an existing prayer request
router.put('/update-prayer-request/:id', async (req, res) => {
    const requestId = req.params.id;
    const requestBody = req.body;

    console.log(`Updating prayer request with ID: ${requestId}`);
    console.log('Request body:', requestBody);

    try {
        const response = await axios.put(`https://eicocelderprayerfunc.azurewebsites.net/api/UpdatePrayerRequest`, requestBody);
        console.log('Response status:', response.status);
        console.log('Response data:', response.data);
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error(`Error updating prayer request: ${error.message}`);
        if (error.response) {
            console.error('Error response status:', error.response.status);
            console.error('Error response data:', error.response.data);
        }
        res.status(500).json({ error: `${error.message} - URL: https://eicocelderprayerfunc.azurewebsites.net/api/UpdatePrayerRequest` });
    }
});

// Route to handle multiple file uploads, convert Excel to JSON, and send to Azure Function
router.post('/upload', upload.array('files'), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).send('No files uploaded.');
    }

    try {
        const allRecords = [];

        for (const file of req.files) {
            const filePath = file.path;
            const workbook = xlsx.readFile(filePath);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];

            // Extract worship date and service type from file name
            const { date, serviceType } = extractDetailsFromFileName(file.originalname);

            // Extract names from Excel sheet and include date and service type
            const records = extractNamesFromExcel(sheet, date, serviceType);
            allRecords.push(...records);

            fs.unlinkSync(filePath); // Delete the file after reading
        }

        // Log the records being sent
        console.log('Records to be sent:', allRecords);

        // Send JSON to Azure Function
        const response = await axios.post('UPLOAD_ATTENDANCE', { records: allRecords });

        res.send(response.data);
    } catch (error) {
        console.error(`Error uploading attendance: ${error.message}`);
        res.status(500).json({ error: `${error.message} - URL: UPLOAD_ATTENDANCE` });
    }
});

// Route to get combined attendance records
router.get('/attendance-difference', async (req, res) => {
    try {
        const response = await axios.get('GET_ATTENDANCE');
        const attendanceRecords = response.data;

        // Combine records by name and date
        const combinedRecords = attendanceRecords.reduce((acc, record) => {
            const key = `${record.FirstName}-${record.LastName}-${record.Date}`;
            if (!acc[key]) {
                acc[key] = {
                    Date: record.Date,
                    FirstName: record.FirstName,
                    LastName: record.LastName,
                    WorshipService: false,
                    BibleClass: false
                };
            }
            if (record.ServiceType.includes('Worship')) {
                acc[key].WorshipService = true;
            }
            if (record.ServiceType.includes('Bible')) {
                acc[key].BibleClass = true;
            }
            return acc;
        }, {});

        res.json(Object.values(combinedRecords));
    } catch (err) {
        console.error('Error fetching attendance data:', err);
        res.status(500).json({ error: `Error fetching attendance data: ${err.message}` });
    }
});

// Route to get Attendance percentage
router.get('/attendance_percent', async (req, res) => {
    try {
        const response = await axios.get('GETATTENDENCEPERCENT_ADDRESS');
        res.json(response.data);
    } catch (error) {
        console.error(`Error fetching attendance_percent: ${error.message}`);
        res.status(500).json({ error: `${error.message} - URL: GETATTENDENCEPERCENT_ADDRESS` });
    }
});

module.exports = router;
