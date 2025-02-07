const express = require('express');
const ngrok = require('ngrok');
const path = require('path');

const app = express();
const PORT = 3000;
const NGROK_AUTH_TOKEN = '2eb0BqWHMgfbGVMSprPbutaQqxY_4ZKidRCreVrEeJ1b1HZUH';

// Serve static files from the same directory
app.use(express.static(__dirname));

// Start the server
app.listen(PORT, async () => {
    console.log(`Server running at http://localhost:${PORT}`);

    try {
        // Connect to ngrok
        const url = await ngrok.connect({
            proto: 'http',
            addr: PORT,
            authtoken: NGROK_AUTH_TOKEN
        });

        console.log(`Public URL: ${url}`);
    } catch (error) {
        console.error('Error starting ngrok:', error);
    }
});
