import axios from 'axios';

exports.roboticReacharge = async (params) => {
  try {
     const roboticReachargeResponse = await axios.get('https://api.roboticexchange.in/Robotics/webservice/GetMobileRecharge', { params })
    return roboticReachargeResponse;
  } catch (error) {
    return {
      success: false,
      STATUS: 3, // treat exception as FAILED
      provider: 'roboticReacharge',
      message: error.message || 'roboticReacharge API error'
    };
  }
};
