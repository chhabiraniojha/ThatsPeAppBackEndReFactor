const { Op } = require('sequelize');
const MobileOtpModel = require('../../models/OtpModels/MobileOtp');
const userModel = require('../../models/UserModels/UserSchema/user');
const Sequelize = require('sequelize');
let { sendEmail } = require('../../util/nodeMailerConfig');
const { sendSms } = require('../../util/sendSms');
const Sentry = require("@sentry/node");
const logger = require("../../util/logger");
const generateUUID = require("../../util/uidGenerator")

const {
  generateRandomNumber,
  generateDateInTwoMinutes
} = require("../../util/otp/otpUtils");

const {
  generateAccessToken,
  generateSignupAccessToken
} = require("../../util/generateToken");


// ===============================
// OTP CONFIGURATION
// ===============================

const OTP_RESEND_INTERVAL_SECONDS = 60;
const MAX_OTP_PER_DAY = 5;

// Google Play / testing ke liye fixed mobile numbers
const testMobileNumbers = (process.env.TEST_OTP_MOBILE_NUMBERS || "")
  .split(",")
  .map((number) => number.trim())
  .filter(Boolean);

const TEST_OTP = process.env.TEST_OTP || "000000";


//==================================
//send otp
//==================================

exports.smsSendOtp = async (req, res) => {
  let { mobileNo } = req.body;

  try {

    // ========================================
    // 1. Normalize mobile number
    // ========================================

    if (typeof mobileNo === "string") {
      mobileNo = mobileNo.trim();
    }


    // ========================================
    // 2. Validate mobile number
    // ========================================

    if (!mobileNo) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required"
      });
    }

    if (!/^[6-9]\d{9}$/.test(mobileNo)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid mobile number"
      });
    }


    // ========================================
    // 3. Today's date range
    // ========================================

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);


    // ========================================
    // 4. Check daily OTP limit
    // ========================================

    const todaysOtpCount = await MobileOtpModel.count({
      where: {
        mobileNo,
        createdAt: {
          [Op.between]: [
            startOfToday,
            endOfToday
          ]
        }
      }
    });

    if (todaysOtpCount >= MAX_OTP_PER_DAY) {

      logger.warn("Daily OTP limit exceeded", {
        route: "/user/send-sms-otp",
        mobileLast4: mobileNo.slice(-4),
        otpCount: todaysOtpCount
      });

      return res.status(429).json({
        success: false,
        message: "Daily OTP limit exceeded. Please try again tomorrow."
      });
    }


    // ========================================
    // 5. Check resend interval
    // ========================================

    const existingOtpRecord = await MobileOtpModel.findOne({
      where: {
        mobileNo,
        createdAt: {
          [Op.gte]: startOfToday
        }
      },
      order: [
        ["createdAt", "DESC"]
      ]
    });

    if (existingOtpRecord) {

      const now = new Date();

      const diffInSeconds =
        (
          now.getTime() -
          new Date(
            existingOtpRecord.createdAt
          ).getTime()
        ) / 1000;

      if (
        diffInSeconds <
        OTP_RESEND_INTERVAL_SECONDS
      ) {

        const remainingSeconds = Math.ceil(
          OTP_RESEND_INTERVAL_SECONDS -
          diffInSeconds
        );

        return res.status(429).json({
          success: false,
          message: `Please wait ${remainingSeconds} seconds before requesting another OTP`
        });
      }
    }


    // ========================================
    // 6. Check Google Play test number
    // ========================================

    const isTestMobile =
      testMobileNumbers.includes(mobileNo);


    // ========================================
    // 7. Generate OTP
    // ========================================

    const otp = isTestMobile
      ? TEST_OTP
      : generateRandomNumber();


    // ========================================
    // 8. Generate expiration time
    // ========================================

    const expirationTime =
      generateDateInTwoMinutes();


    // ========================================
    // 9. Send SMS
    // ========================================

    // Test number ke liye SMS nahi bhejna
    if (!isTestMobile) {

      try {

        await sendSms(
          mobileNo,
          otp
        );

      } catch (smsError) {

        logger.error(
          "OTP SMS provider failed",
          {
            route: "/user/send-sms-otp",
            mobileLast4: mobileNo.slice(-4),
            errorName:
              smsError?.name ||
              "SMS_PROVIDER_ERROR",
            errorMessage:
              smsError?.message ||
              "SMS provider request failed"
          }
        );

        Sentry.captureException(
          smsError
        );

        return res.status(502).json({
          success: false,
          message:
            "Unable to send OTP. Please try again later."
        });
      }
    }


    // ========================================
    // 10. Save OTP in database
    // ========================================

    await MobileOtpModel.create({
      id: await generateUUID(),
      mobileNo,
      otp,
      expirationTime
    });


    // ========================================
    // 11. Log successful OTP request
    // ========================================

    logger.info(
      "OTP sent successfully",
      {
        route: "/user/send-sms-otp",
        mobileLast4: mobileNo.slice(-4),
        testMobile: isTestMobile
      }
    );


    // ========================================
    // 12. Success response
    // ========================================
    console.log("Sending OTP response");
    return res.status(200).json({
      success: true,
      message: "OTP sent successfully"
    });

  } catch (error) {

    // ========================================
    // Unexpected error
    // ========================================

    logger.error(
      "Unexpected error while sending OTP",
      {
        route: "/user/send-sms-otp",
        mobileLast4: mobileNo
          ? mobileNo.slice(-4)
          : undefined,
        errorName:
          error?.name ||
          "UNKNOWN_ERROR",
        errorMessage:
          error?.message ||
          "Unknown error"
      }
    );

    Sentry.captureException(
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};




// ========================================
// VERIFY SMS OTP
// ========================================

exports.verifyOtp = async (req, res) => {
  let { mobileNo, otp } = req.body;

  try {

    // ========================================
    // 1. Normalize input
    // ========================================

    if (typeof mobileNo === "string") {
      mobileNo = mobileNo.trim();
    }

    if (typeof otp === "string") {
      otp = otp.trim();
    }


    // ========================================
    // 2. Validate mobile number
    // ========================================

    if (!mobileNo) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required"
      });
    }

    if (!/^[6-9]\d{9}$/.test(mobileNo)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid mobile number"
      });
    }


    // ========================================
    // 3. Validate OTP
    // ========================================

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is required"
      });
    }


    // ========================================
    // 4. Find latest unverified & valid OTP
    // ========================================

    const otpRecord = await MobileOtpModel.findOne({
      where: {
        mobileNo,
        isVerified: false,
        expirationTime: {
          [Op.gte]: new Date()
        }
      },
      order: [
        ["createdAt", "DESC"]
      ]
    });


    // ========================================
    // 5. OTP not found / expired / already verified
    // ========================================

    if (!otpRecord) {

      logger.warn(
        "OTP verification failed - OTP not found, expired or already verified",
        {
          route: "/user/verify-sms-otp",
          mobileLast4: mobileNo.slice(-4)
        }
      );

      return res.status(401).json({
        success: false,
        message: "Invalid or expired OTP"
      });
    }


    // ========================================
    // 6. Compare OTP
    // ========================================

    if (String(otp) !== String(otpRecord.otp)) {

      logger.warn(
        "OTP verification failed - invalid OTP",
        {
          route: "/user/verify-sms-otp",
          mobileLast4: mobileNo.slice(-4)
        }
      );

      return res.status(401).json({
        success: false,
        message: "Invalid or expired OTP"
      });
    }


    // ========================================
    // 7. Mark OTP as verified
    // ========================================

    await otpRecord.update({
      isVerified: true
    });


    // ========================================
    // 8. Log successful verification
    // ========================================

    logger.info(
      "OTP verified successfully",
      {
        route: "/user/verify-sms-otp",
        mobileLast4: mobileNo.slice(-4)
      }
    );


    // ========================================
    // 9. Check user
    // ========================================

    const userData = await userModel.findOne({
      where: {
        mobileNo
      }
    });


    // ========================================
    // 10. Existing user
    // ========================================

    if (userData) {

      const userDetails = userData.toJSON();

      const token = generateAccessToken(userDetails);

      return res.status(200).json({
        success: true,
        message: "OTP successfully verified",
        token,
        userDetails
      });
    }


    // ========================================
    // 11. New user
    // ========================================

    const signupToken = generateSignupAccessToken({
      mobileNo
    });

    return res.status(200).json({
      success: true,
      message: "OTP successfully verified and user does not exist",
      token: null,
      userDetails: null,
      signupToken
    });


  } catch (error) {

    // ========================================
    // 12. Unexpected error
    // ========================================

    logger.error(
      "Unexpected error during OTP verification",
      {
        route: "/user/verify-sms-otp",
        mobileLast4: mobileNo
          ? mobileNo.slice(-4)
          : undefined,
        errorName:
          error?.name || "UNKNOWN_ERROR",
        errorMessage:
          error?.message || "Unknown error"
      }
    );

    Sentry.captureException(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};