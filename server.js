// server.js - A simple screenshot service
const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors'); // Needed to allow requests from the browser

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Allow larger HTML payloads

app.post('/generate-image', async (req, res) => {
    const { html } = req.body;

    if (!html) {
        return res.status(400).send('HTML content is required.');
    }

    let browser = null;
    try {
        // Launch a headless browser instance
        browser = await puppeteer.launch();
        const page = await browser.newPage();

        // Set the viewport to the desired image size
        await page.setViewport({ width: 1080, height: 1080 });

        // Set the page content. We reconstruct the full HTML document
        // so the browser can load the necessary fonts and styles.
        await page.setContent(`
            <html>
                <head>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
                    <style>
                        body { margin: 0; }
                        .ad-canvas { width: 1080px; height: 1080px; }
                    </style>
                </head>
                <body>
                    <div class="ad-canvas">${html}</div>
                </body>
            </html>
        `, { waitUntil: 'networkidle0' }); // Waits for fonts/styles to load

        // Take a screenshot of the ad element
        const adElement = await page.$('.ad-canvas');
        const imageBuffer = await adElement.screenshot();

        // Send the image back to the client
        res.set('Content-Type', 'image/png');
        res.send(imageBuffer);

    } catch (error) {
        console.error('Puppeteer error:', error);
        res.status(500).send('Failed to generate image.');
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Screenshot server running on http://localhost:${PORT}`));
