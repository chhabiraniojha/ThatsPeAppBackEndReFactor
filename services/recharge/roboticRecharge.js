const axios = require('axios');

exports.roboticRecharge = async (data) => {
  try {
    const roboticsParams = {
      Apimember_id: process.env.ROBOTICS_USERNAME,
      Api_password: process.env.ROBOTICS_PASSWORD,
      Mobile_no: data.customer_number,
      Operator_code: data.operatorCode,
      Amount: data.amount,
      Member_request_txnid: data.rechargeTransactionId,
      Circle: data.circleCode
    };
    const response = await axios.get('https://api.roboticexchange.in/Robotics/webservice/GetMobileRecharge', {
      params: roboticsParams,
      timeout: 7000 // ⏱️ HARD TIMEOUT
    });
    const statusCode = response?.data?.STATUS;

    if (statusCode === 1) {
      return {
        status: 'SUCCESS',
        provider: 'robotics',
        raw: response.data
      };
    }

    if (statusCode === 2) {
      return {
        status: 'PENDING',
        provider: 'robotics',
        raw: response.data
      };
    }

    return {
      status: 'FAILED',
      provider: 'robotics',
      raw: response.data
    };
  } catch (error) {
    return {
      status: 'PENDING',
      provider: 'robotics',
      raw: error.response?.data || null,
      error: error.message
    };
  }
};
