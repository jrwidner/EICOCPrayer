const express = require('express');
const axios = require('axios');
const router = express.Router();

const getprayerAddress = process.env.GETPRAYER_ADDRESS;
const newprayerAddress = process.env.NEWPRAYER_ADDRESS;
const updateprayerAddress = process.env.UPDATEPRAYER_ADDRESS;

// Route to get all prayer requests
router.get('/prayer-requests', async (req, res) => {
    try {
        const response = await axios.get(getprayerAddress);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: `${error.message} - URL: ${getprayerAddress}` });
    }
});

// Route to create a new prayer request
router.post('/create-prayer-request', async (req, res) => {
    try {
        const response = await axios.post(newprayerAddress, req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(500).json({ error: `${error.message} - URL: ${newprayerAddress}` });
    }
});

// Route to update an existing prayer request
router.put('/update-prayer-request/:id', async (req, res) => {
    try {
        const response = await axios.post(updateprayerAddress, req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(500).json({ error: `${error.message} - URL: ${updateprayerAddress}` });
    }
});

module.exports = router;
