const express = require('express');
const axios = require('axios');
const storage = require('node-persist');
const url = require('url');
const qs = require('qs');
const { route } = require('express/lib/application');
require('dotenv').config({ path: '.env' });

const WXCC_API_URL = process.env.WXCC_API_URL;
const WXCC_AUTH_URL = process.env.WXCC_AUTH_URL;
const WXCC_API_CLIENT_ID = process.env.WXCC_API_CLIENT_ID;
const WXCC_API_CLIENT_SECRET = process.env.WXCC_API_CLIENT_SECRET;
const WXCC_API_REDIRECT_URI = process.env.WXCC_API_REDIRECT_URI;
const WXCC_API_SCOPES = process.env.WXCC_API_SCOPES;
const WXCC_API_ORG_ID = process.env.WXCC_API_ORG_ID;

const router = express.Router();
storage.init();

//
// GET /webexcc for Webex Contact Center Integration
//
router.get('/auth/login', async function(req, res){
    try{
        //
        // Main Login Endpoint that triggers the OAuth2 Flow.
        // Step 1 - Redirect to Webex to fetch Authorization Code
        // Step 2 - Redirect to Callback / Redirect URI to retrieve the code
        // Step 3 - POST to Webex for an Access Token
        //
        
        console.log(`Redirecting to Webex Login Page, using Client ID: ${WXCC_API_CLIENT_ID}`);
        res.redirect(
                url.format({
                pathname: WXCC_AUTH_URL,
                query: {
                    response_type: 'code',
                    client_id: WXCC_API_CLIENT_ID,
                    redirect_uri: WXCC_API_REDIRECT_URI,
                    scope: WXCC_API_SCOPES,
                    state: 'AudioConnector',
                },
            })
        );

    }
    catch (error) {
        console.error("Error processing request:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});

//
// Callback endpoint to handle the OAuth2 flow
//
router.get('/auth/callback', async (req, res) => {
    try{
        //
        // Redirect Endpoint to Fetch Code and POST to Webex, i.e
        // Step 2 - Redirect to Callback / Redirect URI to retrieve the code
        // Step 3 - POST to Webex for an Access Token
        //
        const code = req.query.code;
        if (!code) {
            return res.status(400).json({ error: 'Missing code parameter' });
        }

        console.log(`Fetched Code: ${code}`);

        //
        // Get access Token - submit required payload
        //
        let data = qs.stringify({
            'grant_type': 'authorization_code',
            'client_id': WXCC_API_CLIENT_ID,
            'client_secret': WXCC_API_CLIENT_SECRET,
            'redirect_uri': WXCC_API_REDIRECT_URI,
            'code': code 
        });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://webexapis.com/v1/access_token',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            data : data
        };

        //
        // Request the Access Token
        //
        let response = await axios.request(config);
        const WxCCUser = await storage.getItem('WxCCUser');

        if (response.data) {
            await storage.setItem(`loginDetails_${WxCCUser}`, response.data);

            //
            // You can fetch the Access Token, Cluster ID, Org ID from here
            //
            const loginDetails = await storage.getItem(`loginDetails_${WxCCUser}`);
            console.log(`   Access Token: ${loginDetails.access_token}`);
            console.log(`   Refresh Token: ${loginDetails.refresh_token}`);
        }
        else {
            return res.status(500).json({ error: 'Failed to retrieve access token' });
        }

        
             
        //
        // Show a simple HTML page with the Access Token
        //
        res.sendFile('index.html', { root: __dirname + '/../public' });
    }
    catch (error) {
        console.error("Error processing request:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});

//
// Clear the storage persist
//
router.get('/auth/reset', async (req, res) => {
    try{
        //
        // Clear the storage persist
        //
        await storage.clear();
        res.send({ message: 'Storage cleared. Please login again.', link: '/login' });
    }
    catch (error) {
        console.error("Error processing request:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});

//
// Renewal the access token
//
router.get('/auth/renew', async (req, res) => {
    //
    // Convert time in (seconds) in days, hour and minutes
    //
    function formatExpiresIn(timeInSeconds) {
        const days = Math.floor(timeInSeconds / (3600 * 24));
        const hours = Math.floor((timeInSeconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((timeInSeconds % 3600) / 60);
        return `${days}d ${hours}h ${minutes}m`;
    }

    try{
        //
        // Load the access token from storage
        //
        const allLoginDetails = await storage.keys();

        for (const key of allLoginDetails) {
            if (key.startsWith('loginDetails_')) {
                const loginDetails = await storage.getItem(key);
                console.log(`Fetched Details for: ${key}`);
                console.log(`    Access token: ${loginDetails.access_token}`);
                console.log(`    Refresh token: ${loginDetails.refresh_token}`);
                console.log('    Expires on: ' + formatExpiresIn(loginDetails.expires_in));

                //
                // Get new access Token - submit required payload
                //
                let data = qs.stringify({
                    'grant_type': 'refresh_token',
                    'client_id': WXCC_API_CLIENT_ID,
                    'client_secret': WXCC_API_CLIENT_SECRET,
                    'redirect_uri': WXCC_API_REDIRECT_URI,
                    "refresh_token": loginDetails.refresh_token
                });

                let config = {
                    method: 'post',
                    maxBodyLength: Infinity,
                    url: 'https://webexapis.com/v1/access_token',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    data : data
                };
                
                //
                // Make the request
                //
                let response = await axios.request(config);
                if (response.data)
                    await storage.setItem(`${key}`, response.data);
                else
                    console.error("Failed to renew access token for " + key);
            }
        }

        res.send({ message: 'Access token renewed', link: '/login' });
    }
    catch (error) {
        console.error("Error processing request:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});

//
// Create Webex Contact Center Task
//
async function createWxCCTask(entryPointId, destination, direction, attributes, mediaType, outboundType){
    try{

        //
        // Load the access token from storage
        //
        const WxCCUser = await storage.getItem('WxCCUser');
        const loginDetails = await storage.getItem(`loginDetails_${WxCCUser}`);
        let accessToken = loginDetails.access_token;

        //
        // Create the data to search
        //
        let data = JSON.stringify({
            "entryPointId": entryPointId,
            "destination": destination,
            "direction": direction,
            "attributes": attributes || {},
            "mediaType": mediaType,
            "outboundType": outboundType 
        });

        
        //
        // Create the request config
        //
        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: WXCC_API_URL + '/v1/tasks',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + accessToken
            },
            data: data
        };

        //
        // Make the request
        //
        let response = await axios.request(config);
        if (response.data.data.id)
            return response.data.data.id;
        else
            return null;

    } catch (error) {
        console.error("Error fetching contact ID:", error);
        return null;
    }
    
}

module.exports = { router, storage, createWxCCTask };