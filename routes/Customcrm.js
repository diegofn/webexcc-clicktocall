const express = require('express');
const axios = require('axios');
const { route } = require('express/lib/application');
require('dotenv').config({ path: '.env' });
const { storage, createWxCCTask } = require('./WebexCC');

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
        const { Destination } = req.query;
        
        if (!Destination) {
            console.error("Missing required query parameters: Destination");
            return res.status(400).json({ error: 'Missing Destination parameter.' });
        }   
         
        console.log ("Receive Task Outbound Request");
        console.log (`  Destination: ${Destination}`);

        //
        // Check if the user is logged in
        //
        await storage.clear();
        const loginDetails = await storage.getItem('loginDetails');
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

module.exports = router;