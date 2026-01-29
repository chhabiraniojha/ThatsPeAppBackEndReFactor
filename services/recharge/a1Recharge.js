const axios = require('axios')

exports.a1Recharge = async (params) => {
  try {
    console.log("params  for  a1",params)
    const rechargeResponse = await axios.get('https://business.a1topup.com/recharge/api', { params }) 
    console.log("a1 orginal response ---- > ",rechargeResponse)
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
