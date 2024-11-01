const express = require('express');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const router = express.Router();

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Function to extract worship date and service type from file name
function extractDetailsFromFileName(fileName) {
    const [date, ...serviceTypeParts] = fileName.split(' ');
    const serviceType = serviceTypeParts.join(' ').replace('.pdf', '');
    // Convert date to SQL Date format (YYYY-MM-DD)
    const [month, day, year] = date.match(/(\d{2})(\d{2})(\d{2})/).slice(1);
    const formattedDate = `20${year}-${month}-${day}`;
    return { date: formattedDate, serviceType };
}

// Function to extract names using regex
function extractNames(content, date, serviceType) {
    // Remove any known headers that might interfere with parsing
    content = content.replace(/\nReport List\nAddressLast NameFirst NameTag\n639/g, '');

    // Regex pattern to capture addresses followed by last and first names, allowing for optional spaces or special characters
    const regex = /(?:\n|\d{1,5}\s[\w\s.]+)([A-Z][a-zA-Z']+)([A-Z][a-zA-Z']+)(?=\s*gbef)/g;
    let match;
    const records = [];

    while ((match = regex.exec(content)) !== null) {
        let lastName = match[1];
        const firstName = match[2];

        // Remove any unwanted directional prefixes (S, N, E, W) from last names
        if (/^[NESW][A-Z]/.test(lastName)) {
            lastName = lastName.slice(1);
        }

        // Filter out invalid records and log each step
        if (lastName !== "Address" && !/[^a-zA-Z']/.test(firstName) && !/[^a-zA-Z']/.test(lastName)) {
            records.push({ lastName, firstName, date, serviceType });
            console.log(`Extracted: LastName=${lastName}, FirstName=${firstName}`);
        } else {
            console.log(`Skipped: LastName=${lastName}, FirstName=${firstName}`);
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
        res.status(500).json({ error: `${error.message} - URL: GETPRAYER_ADDRESS` });
    }
});

// Route to create a new prayer request
router.post('/create-prayer-request', async (req, res) => {
    try {
        const response = await axios.post('NEWPRAYER_ADDRESS', req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(500).json({ error: `${error.message} - URL: NEWPRAYER_ADDRESS` });
    }
});

// Route to update an existing prayer request
router.put('/update-prayer-request/:id', async (req, res) => {
    try {
        const response = await axios.put(`UPDATEPRAYER_ADDRESS`, req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(500).json({ error: `${error.message} - URL: UPDATEPRAYER_ADDRESS` });
    }
});

// Route to handle file upload, convert PDF to JSON, and send to Azure Function
router.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    try {
        const filePath = req.file.path;
        const dataBuffer = fs.readFileSync(filePath);

        // Convert PDF to JSON
        const pdfData = await pdfParse(dataBuffer);
        const pdfJson = { content: pdfData.text };

        // Extract worship date and service type from file name
        const { date, serviceType } = extractDetailsFromFileName(req.file.originalname);
        pdfJson.date = date;
        pdfJson.serviceType = serviceType;

        // Extract names using regex and include date and service type
        const records = extractNames(pdfJson.content, date, serviceType);

        fs.unlinkSync(filePath); // Delete the file after reading

        // Send JSON to Azure Function
        const response = await axios.post('UPLOAD_ATTENDANCE', { records });

        res.send(response.data);
    } catch (error) {
        res.status(500).json({error: `${error.message} - URL: UPLOAD_ATTENDANCE`});
    }
});
module.exports = router;
