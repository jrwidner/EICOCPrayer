const express = require('express');
const axios = require('axios');
const appInsights = require('applicationinsights');
const router = express.Router();

appInsights.setup().start();
const client = appInsights.defaultClient;

const getprayerAddress = process.env.GETPRAYER_ADDRESS;
const newprayerAddress = process.env.NEWPRAYER_ADDRESS;
const updateprayerAddress = process.env.UPDATEPRAYER_ADDRESS;

// Route to get all prayer requests
router.get('/prayer-requests', async (req, res) => {
    client.trackEvent({ name: "GetPrayerRequestsStarted" });
    try {
        const response = await axios.get(getprayerAddress);
        res.json(response.data);
        client.trackEvent({ name: "GetPrayerRequestsSuccess" });
    } catch (error) {
        client.trackException({ exception: error });
        res.status(500).json({ error: error.message });
        client.trackEvent({ 
            name: "GetPrayerRequestsFailed", 
            properties: { 
                error: error.message, 
                address: getprayerAddress 
            } 
        });
    }
});

// Route to create a new prayer request
router.post('/create-prayer-request', async (req, res) => {
    client.trackEvent({ name: "CreatePrayerRequestStarted" });
    try {
        const response = await axios.post(newprayerAddress, req.body);
        res.status(response.status).json(response.data);
        client.trackEvent({ name: "CreatePrayerRequestSuccess" });
    } catch (error) {
        client.trackException({ exception: error });
        res.status(500).json({ error: error.message });
        client.trackEvent({ 
            name: "CreatePrayerRequestFailed", 
            properties: { 
                error: error.message, 
                address: newprayerAddress 
            } 
        });
    }
});

// Route to update an existing prayer request
router.put('/update-prayer-request/:id', async (req, res) => {
    client.trackEvent({ name: "UpdatePrayerRequestStarted" });
    try {
        const response = await axios.post(updateprayerAddress, req.body);
        res.status(response.status).json(response.data);
        client.trackEvent({ name: "UpdatePrayerRequestSuccess" });
    } catch (error) {
        client.trackException({ exception: error });
        res.status(500).json({ error: error.message });
        client.trackEvent({ 
            name: "UpdatePrayerRequestFailed", 
            properties: { 
                error: error.message, 
                address: updateprayerAddress 
            } 
        });
    }
});

module.exports = router;
