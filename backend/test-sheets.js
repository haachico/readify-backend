require('dotenv').config();
const { logSentCoverLetter } = require('./src/utils/googleSheets');

async function testSheets() {
    console.log('--- Current ENV ---');
    console.log('SPREADSHEET ID:', process.env.GOOGLE_SHEET_ID);
    
    console.log('\n--- Attempting to Log to Sheet ---');
    try {
        await logSentCoverLetter({
            userId: 'DEBUG_TEST',
            userEmail: 'debug@test.com',
            postTitle: 'Debug Position',
            postUrl: 'https://test.com'
        });
        console.log('✅ Action completed. If you still see nothing in your sheet, check the permissions!');
    } catch (err) {
        console.error('❌ CRASHED during test:', err);
    }
}

testSheets();
