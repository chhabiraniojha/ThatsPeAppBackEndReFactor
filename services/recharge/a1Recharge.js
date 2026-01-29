const axios = require('axios')

exports.rechargeExchange = async (params) => {
  try {
    const rechargeResponse = await axios.get('https://business.a1topup.com/recharge/api', { params })
    return rechargeResponse
  } catch (error) {
    return {
      success: false,
      Status: "Failure", // treat exception as FAILED
      provider: 'A1Recharge',
      message: error.message || 'A1Recharge API error'
    };
  }
};
