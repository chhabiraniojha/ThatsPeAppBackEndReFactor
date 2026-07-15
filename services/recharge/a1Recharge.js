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
    console.log('A1 Recharge Response:', response.data);
    const vendorStatus = String(
      response?.data?.Status || response?.data?.status || ''
    ).toUpperCase();
    console.log('A1 Recharge Response status:', vendorStatus);
    if (vendorStatus === 'SUCCESS') {
      return { status: 'SUCCESS', provider: 'a1', raw: response.data };
    }

    if (vendorStatus === 'FAILURE') {
      return { status: 'FAILED', provider: 'a1', raw: response.data };
    }

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const maxDuration = 20000; // 20 seconds
    const interval = 5000; // check every 5 second

    const startTime = Date.now();

    while (Date.now() - startTime < maxDuration) {

      const statusResponse = await axios.get(
        'https://business.a1topup.com/recharge/status',
        {
          params: {
            username: process.env.A1_USERNAME,
            pwd: process.env.A1_PASSWORD,
            orderid: data.rechargeTransactionId,
            format: 'json'
          },
          timeout: 7000
        }
      );
      console.log(
        `A1 Status Check (${data.rechargeTransactionId}):`,
        statusResponse.data
      );
      const status = String(
        statusResponse?.data?.Status || statusResponse?.data?.status || ''
      ).toUpperCase();

      if (status === "SUCCESS") {
        return {
          status: 'SUCCESS',
          provider: 'a1',
          raw: statusResponse.data
        };
      }

      if (status === "FAILURE") {
        return {
          status: 'FAILED',
          provider: 'a1',
          raw: statusResponse.data
        };
      }

      await sleep(interval);
    }

    // Still pending after timeout

    return {
      status: 'PENDING',
      provider: 'a1',
      raw: response.data
    };

  } catch (error) {
    return {
      status: 'PENDING',
      provider: 'a1',
      raw: error.response?.data || null,
      error: error.message
    };
  }
};
