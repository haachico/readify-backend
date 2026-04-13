const { google } = require('googleapis');
const path = require('path');
const logger = require('./logger');

const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, '../../google-sheets-key.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

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
