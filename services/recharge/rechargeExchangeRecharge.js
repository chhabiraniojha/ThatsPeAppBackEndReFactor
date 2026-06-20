const axios = require('axios');

exports.rechargeExchange = async (data) => {
  try {
    const rechargeExchangeParams = {
      userid: process.env.RECHARGEEXCHANGE_USERNAME,
      token: process.env.RECHARGEEXCHANGE_PASSWORD,
      opcode: data.operatorCode,
      number: data.customer_number,
      amount: data.amount,
      transid: data.rechargeTransactionId
    };
    const response = await axios.get('https://api.RechargeExchange.com/API.asmx/Transaction', {
      params: rechargeExchangeParams,
      timeout: 7000 // ⏱️ mandatory
    });
    console.log(response)
    const vendorStatus = response?.data?.status;

    if (vendorStatus === 'SUCCESS') {
      return {
        status: 'SUCCESS',
        provider: 'rechargeExchange',
        raw: response.data
      };
    }

    if (vendorStatus === 'PENDING') {
      return {
        status: 'PENDING',
        provider: 'rechargeExchange',
        raw: response.data
      };
    }

    // FAIL or unknown
    return {
      status: 'FAILED',
      provider: 'rechargeExchange',
      raw: response.data
    };
  } catch (error) {
    // ⚠️ exception ≠ confirmed failure
    return {
      status: 'PENDING',
      provider: 'rechargeExchange',
      raw: error.response?.data || null,
      error: error.message
    };
  }
};
