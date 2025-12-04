const Users = require('../models/UserModels/UserSchema/user');
const jwt = require('jsonwebtoken');
const Logger = require('../util/logData');

const SignupTokenVerify = async (req, res, next) => {
  const token = req.header('authorization');

  try {
    // console.log(token)

    // Check if token exists
    if (!token) {
      return res.status(200).json({
        message: 'Authorization token is missing',
        success: false,
        statuscode: 5
      });
    }
    const decodeData = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const mobileNo = decodeData.mobileNo;
    console.log('Mobile No --- >', mobileNo);  

     
    req.mobileNo = mobileNo;
    if (mobileNo) {     

      next();
    } else {
      return res.status(200).json({ message: 'token failed or mobileNo does not exists', success: false, statuscode: 5 });
    }
  } catch (error) {
    console.log(error);
    Logger.error({
      error_message: error ? error.name : 'catch error form Authentication ',
      user: token,
      url: '/user/token-check',
      http_method: 'get',
      status_code: '5'
    });
    if (error.name === 'TokenExpiredError') {
      return res.status(200).json({
        message: 'Token has expired',
        success: false,
        statuscode: 5
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(200).json({
        message: 'Invalid token',
        success: false,
        statuscode: 5
      });
    }
    return res.status(500).json({
      message: 'Internal server error',
      error
    });
  }
};

module.exports = SignupTokenVerify;
