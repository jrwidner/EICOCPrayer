const express = require('express');
const axios = require('axios');
const router = express.Router();

// Route to get all prayer requests
router.get('/prayer-requests', async (req, res) => {
    try {
        const response = await axios.get('https://eicocprayerfunc.azurewebsites.net/api/GetAllPrayerRequests');
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route to create a new prayer request
router.post('/create-prayer-request', async (req, res) => {
    try {
        const response = await axios.post('https://eicocprayerfunc.azurewebsites.net/api/CreateNewPrayerRequest', req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route to update an existing prayer request
router.put('/update-prayer-request/:id', async (req, res) => {
    try {
        const response = await axios.post(`https://eicocprayerfunc.azurewebsites.net/api/UpdatePrayerRequest`, req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
