const express = require('express');
const axios = require('axios');
const router = express.Router();

// Route to get all prayer requests
router.get('/prayer-requests', async (req, res) => {
    try {
        const response = await axios.get('https://eicocelderprayerfunc.azurewebsites.net/api/GetAllPrayerRequests');
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route to create a new prayer request
router.post('/create-prayer-request', async (req, res) => {
    try {
        const response = await axios.post('https://eicocelderprayerfunc.azurewebsites.net/api/CreateNewPrayerRequest?code=q0P7OkHKRTtLfygOfK1suAoRG62rAI9xFKiJFaJcwidwAzFumf8UIg%3D%3D', req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route to update an existing prayer request
router.put('/update-prayer-request/:id', async (req, res) => {
    try {
        const response = await axios.post(`https://eicocelderprayerfunc.azurewebsites.net/api/UpdatePrayerRequest?code=q0P7OkHKRTtLfygOfK1suAoRG62rAI9xFKiJFaJcwidwAzFumf8UIg%3D%3D`, req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
