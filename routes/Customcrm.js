const express = require('express');
const axios = require('axios');
const { route } = require('express/lib/application');
require('dotenv').config({ path: '.env' });
const { storage, createWxCCTask, getWebexPeopleDetails } = require('./WebexCC');

const WXCC_TASK_ENTRYPOINT_ID = process.env.WXCC_TASK_ENTRYPOINT_ID;
const WXCC_TASK_DIRECTION = process.env.WXCC_TASK_DIRECTION;
const WXCC_MEDIA_TYPE = process.env.WXCC_TASK_MEDIA_TYPE;
const WXCC_TASK_OUTBOUND_TYPE = process.env.WXCC_TASK_OUTBOUND_TYPE;

const router = express.Router();

//
// GET /customcrm for CustomCRM integration
//
router.get('/', handleCreateTask);
router.post('/', handleCreateTask);
  
async function handleCreateTask(req, res){
    try {
        const { WxCCUser, Destination } = req.query;
        
        if (!WxCCUser || !Destination) {
            console.error("Missing required query parameters: WxCCUser and Destination");
            return res.status(400).json({ error: 'Missing WxCCUser or Destination parameter.' });
        }   
         
        console.log ("Receive Task Outbound Request");
        console.log (`  User: ${WxCCUser}`);
        console.log (`  Destination: ${Destination}`);

        //
        // Check if the user is logged in
        //
        await storage.setItem('WxCCUser', WxCCUser);
        const loginDetails = await storage.getItem(`loginDetails_${WxCCUser}`);
        if (loginDetails) {
            //
            // Create a new Task Id in Webex Contact Center
            //
            let taskId = await createWxCCTask(WXCC_TASK_ENTRYPOINT_ID, Destination, WXCC_TASK_DIRECTION, {}, WXCC_MEDIA_TYPE, WXCC_TASK_OUTBOUND_TYPE); 
            console.log("  task ID: " + taskId);

            if (taskId) {
                res.status(200).json({ message: "Task created successfully", taskId });
            } else {
                res.status(500).json({ error: "Failed to create task in Webex Contact Center." });
            }
        } else {
            res.redirect('/webexcc/auth/login');
        }        
    }
    catch (error) {
        console.error("Error processing request:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
    
};

//
// Return all Webex User sign-ins on the App and their data. 
//
router.get('/GetAllWebexUsers', async function (req, res){
    try{
        //
        // Get entire storage
        //
        const allLoginDetails = await storage.keys();
        let users = [];

        for (let key of allLoginDetails) {
            if (key.startsWith('loginDetails_')) {
                const loginDetails = await storage.getItem(key);
                let user = key.replace('loginDetails_', '');
                let webexUser = await getWebexPeopleDetails(loginDetails.access_token);

                if (webexUser.id) {
                    console.log(`Fetched Details for: ${key}`);
                    console.log(`    DisplayName: ${webexUser.displayName}`);
                    console.log(`    Access token: ${loginDetails.access_token}`);
                    console.log(`    Expires at:  ${loginDetails.expires_at}`);
                    console.log(`    Email: ${webexUser.emails[0]}`);
                    console.log(`    PhoneNumbers: ${webexUser.phoneNumbers[0].value}`);
                    
                    users.push({ crmUser: user, webexUser: webexUser.displayName, email: webexUser.emails[0], extension: webexUser.phoneNumbers[0].value, expires_at: loginDetails.expires_at });
                }

            }
        }

        res.json(users);
    }
    catch (error) {
        console.error("Error processing request:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});

module.exports = router;