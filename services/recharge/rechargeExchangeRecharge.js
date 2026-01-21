const axios = require('axios') 

exports.rechargeExchange = async (params) => {
  try {
   const rechargeExchangeResponse = await axios.get('https://api.RechargeExchange.com/API.asmx/Transaction', { params });
    return rechargeExchangeResponse;
  } catch (error) {
    return {
      success: false,
      status: 'FAIL', // treat exception as FAILED
      provider: 'rechargeExchange',
      message: error.message || 'rechargeExchange API error'
    };
  }
};
