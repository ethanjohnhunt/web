const express = require('express');
const EbayAuthToken = require('ebay-oauth-nodejs-client');
require('dotenv').config();

const app = express();
const PORT = 3000;

// eBay OAuth Configuration
const ebayAuthToken = new EbayAuthToken({
    clientId: process.env.EBAY_SANDBOX_CLIENT_ID,
    clientSecret: process.env.EBAY_SANDBOX_CLIENT_SECRET,
    redirectUri: process.env.EBAY_SANDBOX_REDIRECT_URI
});

// Root Route: Serve a basic homepage with a link to initiate OAuth
app.get('/', (req, res) => {
    res.send(`
        <h1>Welcome to eBay OAuth Test</h1>
        <p><a href="/auth/ebay">Login with eBay</a></p>
    `);
});

// Route: Initiate OAuth Flow
app.get('/auth/ebay', (req, res) => {
    const authUrl = `https://signin.sandbox.ebay.com/ws/eBayISAPI.dll?SignIn&AppName=${process.env.EBAY_SANDBOX_CLIENT_ID}&ru=https%3A%2F%2Fauth.sandbox.ebay.com%2Foauth2%2Fconsents%3Fclient_id%3D${process.env.EBAY_SANDBOX_CLIENT_ID}%26redirect_uri%3D${encodeURIComponent(process.env.EBAY_SANDBOX_REDIRECT_URI)}%26scope%3Dhttps%253A%252F%252Fapi.ebay.com%252Foauth%252Fapi_scope%26state%26response_type%3Dcode%26hd%26consentGiven%3Dfalse`;
    
    console.log("Redirecting to eBay OAuth URL:", authUrl); // Log the URL for debugging
    res.redirect(authUrl); // Redirect to the manually constructed URL
});

// Route: Handle eBay OAuth callback
app.get('/auth/ebay/callback', async (req, res) => {
    // Log the query parameters to ensure we are getting the `code`
    console.log('Query Params:', req.query);

    const { code } = req.query; // Extract the authorization code from the query parameters

    if (!code) {
        console.error('Authorization code is missing');
        return res.status(400).send('Authorization code is missing');
    }

    try {
        // Exchange the authorization code for an access token
        const tokenResponse = await ebayAuthToken.exchangeCodeForAccessToken('SANDBOX', code);
        
        // Log the token response for debugging
        console.log('Token Response:', tokenResponse); // Logs the whole response object
        console.log('Access Token:', tokenResponse.access_token);
        console.log('Refresh Token:', tokenResponse.refresh_token);
        console.log('Expires In:', tokenResponse.expires_in);

        // Send the token response back to the client as JSON
        res.json({
            message: 'Authentication successful!',
            accessToken: tokenResponse.access_token,
            refreshToken: tokenResponse.refresh_token,
            expiresIn: tokenResponse.expires_in
        });
    } catch (error) {
        console.error('Error exchanging authorization code:', error.message);
        res.status(500).send('Failed to exchange authorization code');
    }
});

// Route: Get App Token (Optional, if needed for app-level access)
app.get('/get-app-token', async (req, res) => {
    try {
        const token = await ebayAuthToken.getApplicationToken('SANDBOX');
        console.log('App Token:', token); // Debug: Log the app token
        res.json({ token });
    } catch (error) {
        console.error('Error getting application token:', error.message);
        res.status(500).send('Failed to get application token');
    }
});

// Start the Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
