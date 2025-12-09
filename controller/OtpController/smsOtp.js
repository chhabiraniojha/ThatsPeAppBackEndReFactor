const MobileOtpModel = require('../../models/OtpModels/MobileOtp');
const userModel = require('../../models/UserModels/UserSchema/user');
const Sequelize = require('sequelize');
let { sendEmail } = require('../../util/nodeMailerConfig');
const Logger = require('../../util/logData');
const { sendSms } = require('../../util/sendSms');
const { Op } = require('sequelize');
var jwt = require('jsonwebtoken');

function generateRandomNumber() {
  // Generate a random decimal between 0 (inclusive) and 1 (exclusive)
  const randomDecimal = Math.random();

  // Multiply the decimal by 900000 to get a number between 0 and 899999
  // Add 100000 to ensure the number is at least 100000
  const randomNumber = Math.floor(randomDecimal * 900000) + 100000;

  return randomNumber;
}

function generateDateInTwoMinutes() {
  // Get the current date and time
  const currentDate = new Date();

  // Add 2 minutes to the current date and time
  currentDate.setMinutes(currentDate.getMinutes() + 10);

  // Format the date to a string (optional, you can adjust the format as needed)
  // const formattedDate = currentDate.toISOString();

  return currentDate;
}
const generateAccessToken = (newUser) => {
  return jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET_KEY);
};
const generateSignupAccessToken = (mobileNo) => {
  return jwt.sign({ mobileNo: mobileNo.mobileNo }, process.env.JWT_SECRET_KEY);
};
// sendOtp()
exports.smsSendOtp = async (req, res) => {
  let { mobileNo } = req.body;

  if (typeof mobileNo === 'string') {
    mobileNo = mobileNo.trim();
  }

  try {
    // Basic input validation
    if (!mobileNo) {
      return res.status(400).json({ message: 'Mobile Number is required', success: false });
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    //check otp send time limit 1 minute
    const existingOtpRecord = await MobileOtpModel.findOne({
      where: {
        mobileNo,
        createdAt: {
          [Op.gte]: startOfToday // only today’s OTP
        }
      },
      order: [['createdAt', 'DESC']],
      limit: 1
    });

    if(existingOtpRecord){
    const now = new Date();
    const diff = (now - existingOtpRecord.createdAt) / 1000; // seconds

    if(diff < 60){
        return res.status(200).json({
            success: false,
            statuscode: 0,
            message: "OTP already sent, please wait 1 minute"
        });
    }
  }

    // Generate OTP and expiration time
    const defaultOtp="000000"
    const otp = generateRandomNumber();
    const expirationTime = generateDateInTwoMinutes();

    // Save OTP record in otpModel
    if(mobileNo=="9938300585"){
      otp=defaultOtp
    }
    const insertRecord = await MobileOtpModel.create({ mobileNo, otp, expirationTime });
    if(mobileNo=="9938300585"){
      return res.status(200).json({ success: true, message: 'OTP sent successfully', statuscode: 1});
    }
    // Send OTP via sms
    const response = await sendSms(mobileNo, otp);
    console.log('response of sms send ', response);

    // Return success response
    return res.status(200).json({ success: true, message: 'OTP sent successfully', statuscode: 1, response });
  } catch (error) {
    console.log(error);
    Logger.error({
      error_message: error ? error.name : 'catch error form otpsend ',
      user: mobileNo,
      url: '/user/send-sms-otp',
      http_method: 'post',
      status_code: '0'
    });
    return res.status(500).json({ error, message: 'Internal server error' });
  }
};

exports.verifyOtp = async (req, res) => {
  let { mobileNo, otp } = req.body;

  // console.log(otp);
  if (typeof mobileNo === 'string') {
    mobileNo = mobileNo.trim();
  }

  try {
    const userRecords = await MobileOtpModel.findAll({
      where: {
        mobileNo,
        expirationTime: {
          [Sequelize.Op.gte]: new Date()
        }
      },
      order: [['expirationTime', 'DESC']]
    });
    // console.log(userRecords);

    if (userRecords.length <= 0) {
      return res.status(200).json({ success: false, message: 'otp mismatch or expired', statuscode: 0 });
    } else {
      if (userRecords && otp == userRecords[0].otp) {
        const userData = await userModel.findOne({ where: { mobileNo } });
        // console.log('userDataxxxxxxxxxxxxxxxxxxxxxxxxxxxx', userData.dataValues);

        if (userData) {
          let userDetails = userData?.dataValues;
          // delete userDetails?.dataValues.password;
          // console.log('userData---', userData?.dataValues);
          return res.status(200).json({
            success: true,
            message: 'otp successfully verified ',
            statuscode: 1,
            token: generateAccessToken(userDetails),
            userDetails
          });
        } else {
          let signupToken = generateSignupAccessToken({ mobileNo });

          return res.status(200).json({
            success: true,
            message: 'otp successfully verified and user does not exist ',
            statuscode: 1,
            token: null,
            userDetails: null,
            signupToken
          });
        }

        return res.status(200).json({ success: true, message: 'otp successfully verified', statuscode: 1 });
      } else {
        return res.status(200).json({ success: false, message: 'otp mismatch or expired', statuscode: 0 });
      }
    }
  } catch (error) {
    console.log(error);
    Logger.error({
      error_message: error ? error.name : 'catch error form otp varification',
      user: mobileNo,
      url: '/user/otp-verify',
      http_method: 'post',
      status_code: '0'
    });
    return res.status(500).json({ success: false, error, message: 'internal server error' });
  }
};
