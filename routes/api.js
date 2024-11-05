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
    serviceType = serviceType.replace('attendance-converted', '').trim();
    // Convert date to SQL Date format (YYYY-MM-DD)
    const [month, day, year] = date.match(/(\d{2})(\d{2})(\d{2})/).slice(1);
    const formattedDate = `20${year}-${month}-${day}`;
    return { date: formattedDate, serviceType };
}

// Function to extract names from Excel content
function extractNamesFromExcel(sheet, date, serviceType) {
    const records = [];
    const range = xlsx.utils.decode_range(sheet['!ref']);
    
    for (let rowNum = range.s.r + 1; rowNum <= range.e.r; rowNum++) {
        const firstName = sheet[xlsx.utils.encode_cell({ r: rowNum, c: 1 })]?.v;
        const lastName = sheet[xlsx.utils.encode_cell({ r: rowNum, c: 2 })]?.v;
        // Ignore records where FirstName is "FirstName"
        if (firstName && firstName !== "First Name") {
            records.push({ firstName, lastName, date, serviceType });
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
    try {
        const response = await axios.put(`UPDATEPRAYER_ADDRESS`, req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error(`Error updating prayer request: ${error.message}`);
        res.status(500).json({ error: `${error.message} - URL: UPDATEPRAYER_ADDRESS` });
    }
});

// Route to handle file upload, convert Excel to JSON, and send to Azure Function
router.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    try {
        const filePath = req.file.path;
        const workbook = xlsx.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        // Extract worship date and service type from file name
        const { date, serviceType } = extractDetailsFromFileName(req.file.originalname);

        // Extract names from Excel sheet and include date and service type
        const records = extractNamesFromExcel(sheet, date, serviceType);

        fs.unlinkSync(filePath); // Delete the file after reading

        // Log the records being sent
        console.log('Records to be sent:', records);

        // Send JSON to Azure Function
        const response = await axios.post('UPLOAD_ATTENDANCE', { records });

        res.send(response.data);
    } catch (error) {
        console.error(`Error uploading attendance: ${error.message}`);
        res.status(500).json({ error: `${error.message} - URL: UPLOAD_ATTENDANCE` });
    }
});

// Route to identify members present at worship but not Bible class by week
router.get('/attendance-difference', async (req, res) => {
    try {
        const response = await axios.get('GET_ATTENDANCE');
        const attendanceRecords = response.data;

        const worshipOnly = attendanceRecords.filter(record => 
            record.ServiceType.includes('Worship') && 
            !attendanceRecords.some(bibleRecord => 
                bibleRecord.ServiceType === 'Bible Class' && 
                bibleRecord.FirstName === record.FirstName && 
                bibleRecord.LastName === record.LastName && 
                bibleRecord.Date === record.Date
            )
        );

        res.json(worshipOnly);
    } catch (err) {
        console.error('Error fetching attendance difference:', err);
        res.status(500).json({ error: `Error fetching attendance difference: ${err.message}` });
    }
});

module.exports = router;
