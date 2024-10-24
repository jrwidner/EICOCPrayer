const express = require('express');
const axios = require('axios');
const router = express.Router();

// Example route to get all prayer requests
router.get('/prayer-requests', async (req, res) => {
    try {
        const response = await axios.get('https://eicocprayerfunc.azurewebsites.net/api/GetAllPrayerRequests?');
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route to create a new prayer request
router.post('/prayer-requests', async (req, res) => {
    try {
        const response = await axios.post('https://eicocprayerfunc.azurewebsites.net/api/CreateNewPrayerRequest', req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
