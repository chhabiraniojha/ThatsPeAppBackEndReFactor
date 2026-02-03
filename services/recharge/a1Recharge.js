const axios = require('axios');

exports.a1Recharge = async (data) => {
  try {
    const a1Params = {
      username: process.env.A1_USERNAME,
      pwd: process.env.A1_PASSWORD,
      circlecode: data.circleCode,
      operatorcode: data.operatorCode,
      number: data.customer_number,
      amount: data.amount,
      orderid: data.rechargeTransactionId,
      format: 'json'
    };

    const response = await axios.get(
      'https://business.a1topup.com/recharge/api',
      { params: a1Params, timeout: 7000 }
    );

    const vendorStatus = String(
      response?.data?.Status || response?.data?.status || ''
    ).toUpperCase();

    if (vendorStatus === 'SUCCESS') {
      return { status: 'SUCCESS', provider: 'a1', raw: response.data };
    }

    if (vendorStatus === 'FAILURE') {
      return { status: 'FAILED', provider: 'a1', raw: response.data };
    }

    return { status: 'PENDING', provider: 'a1', raw: response.data };

  } catch (error) {
    return {
      status: 'PENDING',
      provider: 'a1',
      raw: error.response?.data || null,
      error: error.message
    };
  }
};
