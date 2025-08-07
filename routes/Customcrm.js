const express = require('express');
const axios = require('axios');
require('dotenv').config({ path: '.env' });

const WXCC_TASK_ENTRYPOINT_ID = process.env.WXCC_TASK_ENTRYPOINT_ID;
const WXCC_API_URL = process.env.WXCC_API_URL;
const WXCC_TASK_DIRECTION = process.env.WXCC_TASK_DIRECTION;
const WXCC_MEDIA_TYPE = process.env.WXCC_TASK_MEDIA_TYPE;
const WXCC_TASK_OUTBOUND_TYPE = process.env.WXCC_TASK_OUTBOUND_TYPE;
const WXCC_TOKEN = process.env.WXCC_TOKEN;

const router = express.Router();

//
// GET /customcrm for CustomCRM integration
//
router.get('/', async function(req, res){
    try {
        const { WXCC_Username, Destination } = req.query;
        
        if (!WXCC_Username || !Destination) {
            console.error("Missing required query parameters: WXCC_Username or Destination");
            return res.status(400).json({ error: 'Missing WXCC_Username or Destination parameter.' });
        }   
         
        console.log ("Receive Task Outbound Request");
        console.log (`  WXCC_Username: ${WXCC_Username}`);
        console.log (`  Destination: ${Destination}`);
        
        //
        // Create a new Task Id in Webex Contact Center
        //
        let taskId = await createWxCCTask(WXCC_TASK_ENTRYPOINT_ID, Destination, WXCC_TASK_DIRECTION, {}, WXCC_MEDIA_TYPE, WXCC_TASK_OUTBOUND_TYPE); 
        console.log("  task ID: " + taskId);

        if (taskId) {
            // Response with a 200 OK
            res.status(200).json({ message: "Task created successfully", taskId });
        } else {
            res.status(500).json({ error: "Failed to create task in Webex Contact Center." });
        }
    }
    catch (error) {
        console.error("Error processing request:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
    
});

//
// Get Hubspots Contact Id by phone
//
async function createWxCCTask(entryPointId, destination, direction, attributes, mediaType, outboundType){
    try{
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
                'Authorization': 'Bearer ' + WXCC_TOKEN
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

module.exports = router;