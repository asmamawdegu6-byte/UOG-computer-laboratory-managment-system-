const twilio = require('twilio');
require('dotenv').config();

async function testSMS() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
    const testPhone = process.env.SUPERADMIN_PHONE || '0928886341';

    console.log('Twilio Configuration:');
    console.log('- Account SID:', accountSid ? accountSid.substring(0, 8) + '...' : 'MISSING');
    console.log('- Auth Token:', authToken ? '***' : 'MISSING');
    console.log('- Messaging Service SID:', messagingServiceSid ? messagingServiceSid.substring(0, 8) + '...' : 'MISSING');
    console.log('- Test Phone:', testPhone);

    // Format phone
    let formattedPhone = testPhone.replace(/[^\d+]/g, '');
    if (formattedPhone.startsWith('0')) {
        formattedPhone = '+251' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('9') && !formattedPhone.startsWith('+')) {
        formattedPhone = '+251' + formattedPhone;
    }
    console.log('- Formatted Phone:', formattedPhone);

    if (!accountSid || !authToken || !messagingServiceSid) {
        console.error('\n❌ ERROR: Twilio credentials are missing in .env file!');
        process.exit(1);
    }

    try {
        const client = twilio(accountSid, authToken);
        const message = await client.messages.create({
            body: 'Test SMS from CLM System - Your verification code is: 123456',
            messagingServiceSid: messagingServiceSid,
            to: formattedPhone
        });

        console.log('\n✅ SMS sent successfully!');
        console.log('Message SID:', message.sid);
        console.log('Status:', message.status);
        console.log('To:', formattedPhone);
    } catch (error) {
        console.error('\n❌ Failed to send SMS:');
        console.error('Code:', error.code);
        console.error('Message:', error.message);
        console.error('Status:', error.status);
        console.error('More info:', error.moreInfo);
        process.exit(1);
    }
}

testSMS();
