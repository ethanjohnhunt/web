const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2');
require('dotenv').config();
const EbayAuthToken = require('ebay-oauth-nodejs-client');

const app = express();
const PORT = 3000;

// Enable CORS for frontend requests
app.use(cors());

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Proxy eBay API requests
app.get('/api/ebay-search', async (req, res) => {
    const token = process.env.EBAY_SANDBOX_TOKEN;
    const query = req.query.q || 'iphone'; // Default query if none is provided
    const limit = req.query.limit || 3;

    const ebayApiUrl = `https://api.sandbox.ebay.com/buy/browse/v1/item_summary/search?q=${query}&limit=${limit}`;

    try {
        const response = await fetch(ebayApiUrl, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                'X-EBAY-C-MARKETPLACE-ID': 'EBAY_GB',
            },
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching from eBay API:', error);
        res.status(500).json({ error: 'Error fetching from eBay API' });
    }
});

// Optional route to provide eBay token for testing
app.get('/get-ebay-token', (req, res) => {
    res.json({ token: process.env.EBAY_PRODUCTION_TOKEN });
});

const config = require('./ebay-config.json');

const ebayAuthToken = new EbayAuthToken({
  clientId: config.SANDBOX.clientId,
  clientSecret: config.SANDBOX.clientSecret,
  redirectUri: config.SANDBOX.redirectUri
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
