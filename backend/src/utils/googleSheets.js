const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SERVICE_ACCOUNT_FILE = path.join(__dirname, '../../google-sheets-key.json');

let serviceAccount = null;

// Load service account on startup
try {
    if (fs.existsSync(SERVICE_ACCOUNT_FILE)) {
        serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_FILE, 'utf8'));
        logger.info('✅ Google Sheets service account loaded from file');
    } else {
        logger.error('❌ google-sheets-key.json not found at', SERVICE_ACCOUNT_FILE);
    }
} catch (error) {
    logger.error('❌ Failed to load google-sheets-key.json:', error.message);
}

/**
 * Get Google OAuth2 access token using service account JWT
 */
async function getGoogleAccessToken() {
    return new Promise((resolve, reject) => {
        try {
            if (!serviceAccount) {
                reject(new Error('Service account not loaded'));
                return;
            }

            // Create JWT
            const now = Math.floor(Date.now() / 1000);
            const payload = {
                iss: serviceAccount.client_email,
                scope: 'https://www.googleapis.com/auth/spreadsheets',
                aud: 'https://oauth2.googleapis.com/token',
                exp: now + 3600,
                iat: now
            };

            const header = { alg: 'RS256', typ: 'JWT' };
            
            const base64encode = (str) => Buffer.from(JSON.stringify(str)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
            const headerEncoded = base64encode(header);
            const payloadEncoded = base64encode(payload);
            const message = `${headerEncoded}.${payloadEncoded}`;

            // Sign with private key
            const signature = crypto.sign('sha256', Buffer.from(message), {
                key: serviceAccount.private_key,
                format: 'pem'
            }).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

            const jwt = `${message}.${signature}`;

            // Exchange JWT for access token
            const tokenData = new URLSearchParams({
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion: jwt
            }).toString();

            const options = {
                hostname: 'oauth2.googleapis.com',
                path: '/token',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': tokenData.length
                }
            };

            const request = https.request(options, (response) => {
                let data = '';
                response.on('data', chunk => data += chunk);
                response.on('end', () => {
                    try {
                        const result = JSON.parse(data);
                        if (result.access_token) {
                            resolve(result.access_token);
                        } else {
                            reject(new Error('No access token in response'));
                        }
                    } catch (e) {
                        reject(e);
                    }
                });
            });

            request.on('error', reject);
            request.write(tokenData);
            request.end();
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Appends a row to Google Sheet using direct API call
 */
async function appendToSheet(values) {
    try {
        const accessToken = await getGoogleAccessToken();
        
        const postData = JSON.stringify({ values: [values] });

        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'sheets.googleapis.com',
                path: `/v4/spreadsheets/${SPREADSHEET_ID}/values/Sheet1!A:F:append?valueInputOption=RAW`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Length': postData.length
                }
            };

            const request = https.request(options, (response) => {
                let data = '';
                response.on('data', chunk => data += chunk);
                response.on('end', () => {
                    if (response.statusCode === 200) {
                        resolve(true);
                    } else {
                        reject(new Error(`HTTP ${response.statusCode}: ${data}`));
                    }
                });
            });

            request.on('error', reject);
            request.write(postData);
            request.end();
        });
    } catch (error) {
        throw error;
    }
}

/**
 * Logs cover letter sent to Google Sheet
 */
const logSentCoverLetter = async (data) => {
    try {
        if (!serviceAccount || !SPREADSHEET_ID) {
            logger.error('❌ Google Sheets not configured, skipping log');
            return;
        }

        const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        const values = [
            timestamp,
            data.userId || 'N/A',
            data.userEmail || 'N/A',
            data.postTitle || 'N/A',
            data.postUrl || 'N/A',
            'SUCCESSFUL'
        ];

        await appendToSheet(values);
        logger.info(`✅ Google Sheet updated for user ${data.userEmail}`);
    } catch (error) {
        logger.error('❌ Error updating Google Sheet:', error.message);
        // Don't throw - don't block email if sheets fails
    }
};

module.exports = {
    logSentCoverLetter
};