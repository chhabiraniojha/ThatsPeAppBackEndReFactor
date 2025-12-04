const axios = require('axios');
exports.sendSms = async (mobileNo, message) => {
  try {
    mobileNo = mobileNo.trim();
    mobileNo = '91' + mobileNo;
    console.log('Prepared Mobile No:', mobileNo, message);

    let response = await axios.post(
      process.env.SMS_API_URL,
      {
        template_id: process.env.SMS_TEMPLATE_ID,
        short_url: '0',
        short_url_expiry: '',
        realTimeResponse: '',
        recipients: [
          {
            mobiles: mobileNo,
            var1: message
          }
        ]
      },
      {
        headers: {
          authkey: process.env.SMS_AUTH_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('SMS API Response:', response.data);
    return response.data;
  } catch (error) {}

  console.log(`Sending SMS to ${mobileNo}: ${message}`);

  return true;
};
