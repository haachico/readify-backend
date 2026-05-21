const https = require('https');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Use custom logging function to avoid logger.info/logger.error issues
const safeLog = (level, ...args) => {
    const timestamp = new Date().toISOString();
    const color = level === 'ERROR' ? '\x1b[31m' : '\x1b[32m';
    console.log(`${color}[${timestamp}] [SHEETS_${level}]\x1b[0m`, ...args);
};

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SERVICE_ACCOUNT_FILE = path.join(__dirname, '../../google-sheets-key.json');

let serviceAccount = null;

// Load service account on startup
try {
    if (fs.existsSync(SERVICE_ACCOUNT_FILE)) {
        serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_FILE, 'utf8'));
        
        // Fix private key if it has escaped newlines
        if (serviceAccount.private_key && serviceAccount.private_key.includes('\\n')) {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
            safeLog('INFO', '✅ Fixed private key newlines');
        }
        
        safeLog('INFO', '✅ Google Sheets service account loaded from file');
        safeLog('INFO', 'Client email:', serviceAccount.client_email);
    } else {
        safeLog('ERROR', '❌ google-sheets-key.json not found at', SERVICE_ACCOUNT_FILE);
    }
} catch (error) {
    safeLog('ERROR', '❌ Failed to load google-sheets-key.json:', error.message);
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

            // Create JWT using jsonwebtoken library
            const now = Math.floor(Date.now() / 1000);
            const payload = {
                iss: serviceAccount.client_email,
                scope: 'https://www.googleapis.com/auth/spreadsheets',
                aud: 'https://oauth2.googleapis.com/token',
                exp: now + 3600,
                iat: now
            };

            const token = jwt.sign(payload, serviceAccount.private_key, { 
                algorithm: 'RS256',
                header: { alg: 'RS256', typ: 'JWT' }
            });

            // Exchange JWT for access token
            const tokenData = new URLSearchParams({
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion: token
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
                            safeLog('ERROR', '❌ Google API error:', JSON.stringify(result, null, 2));
                            reject(new Error(`Google error: ${result.error} - ${result.error_description}`));
                        }
                    } catch (e) {
                        safeLog('ERROR', '❌ Failed to parse Google response:', data);
                        reject(e);
                    }
                });
            });

            request.on('error', reject);
            request.write(tokenData);
            request.end();
        } catch (error) {
            safeLog('ERROR', '❌ JWT creation failed:', error.message);
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
            safeLog('ERROR', '❌ Google Sheets not configured, skipping log');
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
        safeLog('INFO', `✅ Google Sheet updated for user ${data.userEmail}`);
    } catch (error) {
        safeLog('ERROR', '❌ Error updating Google Sheet:', error.message);
        // Don't throw - don't block email if sheets fails
    }
};

module.exports = {
    logSentCoverLetter
};