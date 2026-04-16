const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

let auth;

// Check if credentials are in environment variable first, then file
if (process.env.GOOGLE_SHEETS_CREDENTIALS) {
    try {
        let credentialsStr = process.env.GOOGLE_SHEETS_CREDENTIALS;
        
        // Parse the JSON string directly
        let credentials = JSON.parse(credentialsStr);
        
        // The private_key should already have \n escaped properly
        // If it contains literal '\\n' strings, convert them to actual newlines
        if (credentials.private_key && typeof credentials.private_key === 'string') {
            // Convert escaped newlines to actual newlines
            credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
        }
        
        // Verify required fields exist
        if (!credentials.private_key) {
            throw new Error('Missing private_key in credentials');
        }
        if (!credentials.client_email) {
            throw new Error('Missing client_email in credentials');
        }
        
        logger.info('Google Sheets credentials loaded from environment variable');
        
        auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
    } catch (error) {
        logger.error('Failed to parse GOOGLE_SHEETS_CREDENTIALS env var:', error.message);
        logger.error('Error stack:', error.stack);
        throw error;
    }
} else {
    // Fallback to file-based credentials
    const keyFilePath = path.join(__dirname, '../../google-sheets-key.json');
    if (fs.existsSync(keyFilePath)) {
        logger.info('Google Sheets credentials loaded from file:', keyFilePath);
        auth = new google.auth.GoogleAuth({
            keyFile: keyFilePath,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
    } else {
        throw new Error('Google Sheets credentials not found. Set GOOGLE_SHEETS_CREDENTIALS env var or place google-sheets-key.json in backend root.');
    }
}

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

/**
 * Appends a row to the Google Sheet when a cover letter is sent.
 * @param {Object} data - Information to log { userId, userEmail, postTitle, postUrl }
 */
const logSentCoverLetter = async (data) => {
    try {
        // Validate spreadsheet ID
        if (!SPREADSHEET_ID) {
            logger.error('GOOGLE_SHEET_ID is not set in environment variables');
            return;
        }

        const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        const values = [
            [
                timestamp,
                data.userId || 'N/A',
                data.userEmail || 'N/A',
                data.postTitle || 'N/A',
                data.postUrl || 'N/A',
                'SUCCESSFUL'
            ]
        ];

        const resource = {
            values,
        };

        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Sheet1!A:F',
            valueInputOption: 'RAW',
            resource,
        });

        logger.info(`Google Sheet updated for user ${data.userEmail}`);
    } catch (error) {
        logger.error('Error updating Google Sheet:', error.message);
        // We don't throw error here to avoid failing the email job if only logging fails
    }
};

module.exports = {
    logSentCoverLetter
};