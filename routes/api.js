const express = require('express');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

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
        const response = await axios.post('UPDATEPRAYER_ADDRESS', req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(500).json({ error: `${error.message} - URL: UPDATEPRAYER_ADDRESS` });
    }
});

// Route to handle file uploads and send to Azure Function
router.post('/upload', upload.array('files'), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).send('No files uploaded.');
    }

    try {
        const files = req.files.map(file => {
            const filePath = file.path;
            const content = fs.readFileSync(filePath).toString('base64');
            fs.unlinkSync(filePath); // Delete the file after reading

            return {
                filename: file.originalname,
                content: content
            };
        });

        const response = await axios.post('https://eicocprayerfunc.azurewebsites.net/api/UploadAttendance?', {
            files: files
        });

        res.send(response.data);
    } catch (error) {
        res.status(500).json({ error: `${error.message} - URL: Azure Function` });
    }
});

module.exports = router;
