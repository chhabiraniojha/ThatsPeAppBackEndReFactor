var jwt = require('jsonwebtoken');
const generateAccessToken = (newUser) => {
  return jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET_KEY);
};

const generateSignupAccessToken = (mobileNo) => {
  return jwt.sign({ mobileNo: mobileNo.mobileNo }, process.env.JWT_SECRET_KEY);
};

module.exports={
  generateAccessToken,
  generateSignupAccessToken
}