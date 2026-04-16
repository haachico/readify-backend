const { google } = require('googleapis');
const logger = require('./logger');

let auth;
let sheets;
let SPREADSHEET_ID;

// Initialize Google Sheets
const initGoogleSheets = async () => {
    try {
        SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
        
        if (!SPREADSHEET_ID) {
            logger.error('❌ GOOGLE_SHEET_ID is not set');
            return false;
        }

        // Build credentials from individual environment variables
        const credentials = {
            type: process.env.GOOGLE_TYPE || 'service_account',
            project_id: process.env.GOOGLE_PROJECT_ID,
            private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            client_id: process.env.GOOGLE_SHEETS_CLIENT_ID,
            auth_uri: process.env.GOOGLE_AUTH_URI,
            token_uri: process.env.GOOGLE_TOKEN_URI,
            auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL,
            client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL,
            universe_domain: process.env.GOOGLE_UNIVERSE_DOMAIN
        };

        // Validate required fields
        if (!credentials.private_key) {
            logger.error('❌ GOOGLE_PRIVATE_KEY is missing');
            return false;
        }
        if (!credentials.client_email) {
            logger.error('❌ GOOGLE_CLIENT_EMAIL is missing');
            return false;
        }

        logger.info('✅ Google Sheets credentials loaded from individual env vars');

        auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        sheets = google.sheets({ version: 'v4', auth });
        
        // Test the connection
        await testConnection();
        
        return true;
    } catch (error) {
        logger.error('❌ Failed to initialize Google Sheets:', error.message);
        return false;
    }
};

// Test the connection
const testConnection = async () => {
    try {
        const response = await sheets.spreadsheets.get({
            spreadsheetId: SPREADSHEET_ID,
            includeGridData: false
        });
        logger.info(`✅ Google Sheets connected: ${response.data.properties.title}`);
    } catch (error) {
        logger.error('❌ Google Sheets connection test failed:', error.message);
        throw error;
    }
};

/**
 * Appends a row to the Google Sheet when a cover letter is sent.
 */
const logSentCoverLetter = async (data) => {
    try {
        // Initialize if not already done
        if (!sheets) {
            const initialized = await initGoogleSheets();
            if (!initialized) {
                logger.error('❌ Google Sheets not initialized, skipping log');
                return;
            }
        }

        const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        const values = [[
            timestamp,
            data.userId || 'N/A',
            data.userEmail || 'N/A',
            data.postTitle || 'N/A',
            data.postUrl || 'N/A',
            'SUCCESSFUL'
        ]];

        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Sheet1!A:F',
            valueInputOption: 'RAW',
            requestBody: { values },
        });

        logger.info(`✅ Google Sheet updated for ${data.userEmail}`);
    } catch (error) {
        logger.error('❌ Error updating Google Sheet:', error.message);
        // Don't throw - email already sent successfully
    }
};

// Initialize on module load
initGoogleSheets();

module.exports = {
    logSentCoverLetter,
    initGoogleSheets
};