const axios = require('axios');
const AllTransactionsModel = require('../../models/RechargeAndBillPaymentTransactionsModels/rechargeAndBillPaymentTransactions');

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
    const vendorStatus = response?.data?.status?.toUpperCase();

    if (vendorStatus === 'SUCCESS') {
      return {
        status: 'SUCCESS',
        provider: 'rechargeExchange',
        raw: response.data
      };
    }

    if (vendorStatus === 'PENDING') {
      const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      const maxDuration = 20000; // 20 seconds
      const interval = 5000; // check every 5 second

      const startTime = Date.now();

      while (Date.now() - startTime < maxDuration) {

        const transaction = await AllTransactionsModel.findByPk(data.rechargeTransactionId);

        const status = transaction.status?.toUpperCase();

        if (status === "SUCCESS") {
          return {
            status: 'SUCCESS',
            provider: 'rechargeExchange',
            raw: transaction
          };
        }

        if (status === "FAILED") {
          return {
            status: 'FAILED',
            provider: 'rechargeExchange',
            raw: transaction
          };
        }

        await sleep(interval);
      }

      // Still pending after timeout

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
