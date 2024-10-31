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
    return { date, serviceType };
}

// Function to extract names using regex
function extractNames(content, date, serviceType) {
    const regex = /([A-Z][a-zA-Z]*)([A-Z][a-zA-Z]*)\s*gbef/g;
    let match;
    const records = [];

    while ((match = regex.exec(content)) !== null) {
        const lastName = match[1];
        const firstName = match[2];
        records.push({ lastName, firstName, date, serviceType });
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
        const response = await axios.post(NEWPRAYER_ADDRESS, req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(500).json({ error: `${error.message} - URL: NEWPRAYER_ADDRESS` });
    }
});

// Route to update an existing prayer request
router.put('/update-prayer-request/:id', async (req, res) => {
    try {
        const response = await axios.put(`UPDATEPRAYER_ADDRESS/${req.params.id}`, req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(500).json({ error: `${error.message} - URL: UPDATEPRAYER_ADDRESS/${req.params.id}` });
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
        pdfJson.records = extractNames(pdfJson.content, date, serviceType);

        fs.unlinkSync(filePath); // Delete the file after reading

        // Send JSON to Azure Function
        const response = await axios.post('UPLOAD_ATTENDANCE, pdfJson');

        res.send(response.data);
    } catch (error) {
        res.status(500).json({ error: `${error.message} - URL: UPLOAD_ATTENDANCE` });
    }
});

module.exports = router;
