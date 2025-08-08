//
// Required modules
//
"use strict";

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
require('dotenv').config({ path: '.env' });

//
// Map the routes
//
const customcrmRoute = require('./routes/Customcrm');
const { router: webexCCRouter } = require('./routes/WebexCC');

//
// Encoding bodies support
//
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/customcrm', customcrmRoute);
app.use('/webexcc', webexCCRouter);


//
// Set the consts
//
const port = process.env.PORT || 3000;
const WXCC_API_URL = process.env.WXCC_API_URL;

if (!port || !WXCC_API_URL) {
    console.error("Missing required environment variables.");
    process.exit(1);
}

//
// Start the webservice 
//
const server = app.listen(port, function() {
    console.log('Listening on port %d', server.address().port);
});

//
// Public folder
//
app.use(express.static('public'));

