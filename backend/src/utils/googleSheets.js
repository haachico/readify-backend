const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

let auth;

// Check if credentials are in environment variable first, then file
if (process.env.GOOGLE_SHEETS_CREDENTIALS) {
    try {
        // Handle both properly escaped JSON and JSON with actual newlines
        let credentialsStr = process.env.GOOGLE_SHEETS_CREDENTIALS;
        // Replace actual newlines with escaped newlines for proper JSON parsing
        credentialsStr = credentialsStr.replace(/\n/g, '\\n');
        const credentials = JSON.parse(credentialsStr);
        auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
    } catch (error) {
        logger.error('Failed to parse GOOGLE_SHEETS_CREDENTIALS env var:', error.message);
        throw error;
    }
} else {
    // Fallback to file-based credentials
    const keyFilePath = path.join(__dirname, '../../google-sheets-key.json');
    if (fs.existsSync(keyFilePath)) {
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
