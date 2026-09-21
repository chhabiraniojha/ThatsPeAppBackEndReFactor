var jwt = require('jsonwebtoken');
const crypto = require('crypto');
const userModel = require("../../models/UserModels/UserSchema/user");
const walletModel = require('../../models/WalletModels/WalletSchema/wallet');
let uid = require('../../util/uidGenerator');
const sequelize = require('../../util/db_connect');
let { sendEmail } = require('../../util/nodeMailerConfig');
const { use } = require('../../routes/userRoutes/userRouter');
const { default: axios } = require('axios');
const logger = require('../../util/logger');
const { Op } = require("sequelize");
const Sentry = require("@sentry/node");
const ReferralConfig = require("../../models/ReferralModel/ReferralConfig");
const Referral = require("../../models/ReferralModel/Referral");

const {
  generateAccessToken,
} = require("../../util/generateToken");

const {
  generateReferralCode,
} = require("../../util/generateReferralCode");

let algorithm = 'aes-256-ctr';
let ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
let IV_LENGTH = 16;

const encrypt = (text) => {
  let iv = crypto.randomBytes(IV_LENGTH);
  let key = crypto.pbkdf2Sync(ENCRYPTION_KEY, 'salt', 100000, 32, 'sha512');
  let cipher = crypto.createCipheriv(algorithm, key, iv);
  let encryptedPassword = cipher.update(text, 'utf-8', 'hex');
  encryptedPassword += cipher.final('hex');
  let encryptedData = iv.toString('hex') + ':' + encryptedPassword;
  console.log(encryptedData);
  return encryptedData;
};

const decrypt = (text) => {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];

  // Derive the key using the master password
  const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, 'salt', 100000, 32, 'sha512');

  // Create a decipher object
  const decipher = crypto.createDecipheriv(algorithm, key, iv);

  // Decrypt the password
  let decryptedPassword = decipher.update(encryptedText, 'hex', 'utf-8');
  decryptedPassword += decipher.final('utf-8');

  return decryptedPassword;
};

//------------------ SIGNUP --------------

// let message = "your otp is 1234 this is a test otp"
// ------------------ SIGNUP --------------

exports.signup = async (req, res) => {
  let transaction = null;

  try {
    // --------------------------------
    // 1. Validate request body
    // --------------------------------
    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({
        success: false,
        message: "Invalid request body",
      });
    }

    let { name, email, referCode } = req.body;

    if (typeof name === "string") {
      name = name.trim();
    }

    if (typeof email === "string") {
      email = email.trim();
    }

    if (typeof referCode === "string") {
      referCode = referCode.trim().toUpperCase();
    }

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required",
      });
    }

    // --------------------------------
    // 2. Mobile number from middleware
    // --------------------------------
    const mobileNo = req.mobileNo;

    if (!mobileNo) {
      logger.warn("Mobile number missing during signup", {
        route: "/user/signup",
      });

      return res.status(401).json({
        success: false,
        message: "Invalid signup request",
      });
    }

    // --------------------------------
    // 3. Start transaction
    // --------------------------------
    transaction = await sequelize.transaction();

    // --------------------------------
    // 4. Check mobile again
    // --------------------------------
    const existingUser = await userModel.findOne({
      where: {
        mobileNo,
      },
      attributes: ["id"],
      transaction,
    });

    if (existingUser) {
      await transaction.rollback();
      transaction = null;

      return res.status(409).json({
        success: false,
        message: "Mobile number already registered",
      });
    }

    // --------------------------------
    // 5. Generate User ID
    // --------------------------------
    const userId = await uid();

    // --------------------------------
    // 6. Generate unique referral code
    //    Existing project utility
    // --------------------------------
    const referralCode = await generateReferralCode(transaction);

    // --------------------------------
    // 7. Referral details
    // --------------------------------
    let referrerUser = null;
    let referralConfig = null;

    if (referCode) {
      // Find referrer
      referrerUser = await userModel.findOne({
        where: {
          referralCode: referCode,
          status: "active",
        },
        attributes: ["id", "referralCode"],
        transaction,
      });

      if (!referrerUser) {
        await transaction.rollback();
        transaction = null;

        return res.status(400).json({
          success: false,
          message: "Invalid referral code",
        });
      }

      // Get active referral configuration
      referralConfig = await ReferralConfig.findOne({
        where: {
          status: "active",
        },
        order: [["createdAt", "DESC"]],
        transaction,
      });

      if (!referralConfig) {
        await transaction.rollback();
        transaction = null;

        logger.warn("Referral config not available", {
          route: "/user/signup",
        });

        return res.status(400).json({
          success: false,
          message: "Referral is currently unavailable",
        });
      }
    }

    // --------------------------------
    // 8. Create User
    // --------------------------------
    const userDetails = await userModel.create(
      {
        id: userId,
        mobileNo,
        name,
        email,
        referralCode,
        referredBy: referrerUser ? referrerUser.id : null,
        status: "active",
      },
      {
        transaction,
      }
    );

    // --------------------------------
    // 9. Create Wallet
    // --------------------------------
    const walletId = await uid();

    await walletModel.create(
      {
        id: walletId,
        userId: userDetails.id,
        balance: 0.00,
        status: "active",
      },
      {
        transaction,
      }
    );

    // --------------------------------
    // 10. Create Referral
    // --------------------------------
    if (referrerUser && referralConfig) {
      const referralId = await uid();

      await Referral.create(
        {
          id: referralId,

          referrerUserId: referrerUser.id,
          referredUserId: userDetails.id,

          // Snapshot from ReferralConfig
          rewardAmount: referralConfig.referrerReward,
          couponDiscount: referralConfig.couponDiscount,
          minimumRechargeAmount:
            referralConfig.minimumRechargeAmount,

          // Reward will be given later
          rewardStatus: "PENDING",

          rewardWalletTransactionId: null,
          rewardedAt: null,
        },
        {
          transaction,
        }
      );
    }

    // --------------------------------
    // 11. Commit transaction
    // --------------------------------
    await transaction.commit();
    transaction = null;

    // --------------------------------
    // 12. Generate access token
    // --------------------------------
    const token = generateAccessToken(userDetails);

    // --------------------------------
    // 13. Response
    // --------------------------------
    return res.status(201).json({
      success: true,
      message: "User signup successfully",
      token,
      userDetails,
    });

  } catch (error) {
    console.log(error)
    // --------------------------------
    // Rollback transaction
    // --------------------------------
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        logger.error("Signup transaction rollback failed", {
          route: "/user/signup",
          errorName: rollbackError?.name || "UNKNOWN_ERROR",
          errorMessage:
            rollbackError?.message || "Unknown rollback error",
        });
      }
    }

    // --------------------------------
    // Log error
    // --------------------------------
    logger.error("Signup failed", {
      route: "/user/signup",
      errorName: error?.name || "UNKNOWN_ERROR",
      errorMessage: error?.message || "Unknown error",
    });

    Sentry.captureException(error);

    // --------------------------------
    // Unique constraint error
    // --------------------------------
    if (error?.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message: "User information already exists",
      });
    }

    // --------------------------------
    // Generic error
    // --------------------------------
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//------------------ LOGIN --------------
exports.login = async (req, res) => {
  let { email, password } = req.body;
  if (typeof email === 'string') {
    email = email.trim();
  }

  try {
    const userDetails = await userModel.findOne({ where: { email } });
    // console.log(userDetails);
    if (userDetails == null) {
      return res.status(200).json({ success: true, message: 'user does not exists', statuscode: 0, token: null });
    } else {
      const passwordToDecrypt = userDetails.dataValues.password;
      let decryptedPassword = decrypt(passwordToDecrypt);
      if (password == decryptedPassword) {
        // remove password before sending user
        delete userDetails.dataValues.password;
        return res
          .status(200)
          .json({ success: true, message: 'user exists', token: generateAccessToken(userDetails), userDetails, statuscode: 1 });
      } else {
        return res.status(200).json({ message: 'Invalid Credentials!', statuscode: 0, token: null });
      }
    }
  } catch (error) {
    Logger.error({
      error_message: error ? error.name : 'catch error form login ',
      user: email,
      url: '/user/login',
      http_method: 'post',
      status_code: '0'
    });
    res.status(500).json({ error: error, message: 'Internal server error' });
  }
};

// ------------CHECKING USER EXISTANCE--------------
exports.checkUserExistance = async (req, res) => {
  let { email } = req.body;
  if (typeof email === 'string') {
    email = email.trim();
  }

  try {
    let userMail = await userModel.findOne({ where: { Email: email } });
    if (userMail == null) {
      res.status(200).json({ message: 'does not exist', success: false, statuscode: 0 });
    } else {
      res.status(200).json({ message: 'user exists', success: true, statuscode: 1 });
    }
  } catch (error) {
    Logger.error({
      error_message: otpError ? otpError.name : 'catch error form user check ',
      user: email,
      url: '/user/existanse',
      http_method: 'post',
      status_code: '0'
    });
    res.status(500).json({ message: 'Internal Server Error!', success: false });
  }
};

// ---------------FORGET PASSWORD----------------
exports.forgetPassword = async (req, res) => {
  let { email, newPassword, otp } = req.body;
  if (typeof email === 'string') {
    email = email.trim();
  }
  try {
    let user = await userModel.findOne({ where: { Email: email } });
    if (user == null) {
      return res.status(200).json({ message: 'No such email found', success: false, statuscode: 0 });
    }

    // Handle axios errors separately
    try {
      const otpVerificationStatus = await axios.post(`${process.env.SERVER_BASEUSRL}/verifyotp`, { email, otp });

      if (otpVerificationStatus.data.success) {
        let newEncryptedPassword = encrypt(newPassword);
        await user.update({ password: newEncryptedPassword });
        return res.status(200).json({ message: 'New password set successfully!', success: true, statuscode: 1 });
      } else {
        return res.status(200).json({ message: 'Invalid OTP', success: false, statuscode: 0 });
      }
    } catch (otpError) {
      console.error('OTP verification failed:', otpError.message);
      Logger.error({
        error_message: otpError ? otpError.name : 'catch error form signup otp send ',
        user: email,
        url: '/user/forget-password',
        http_method: 'post',
        status_code: '0'
      });
      return res.status(200).json({ message: 'Failed to verify OTP', success: false, statuscode: 0 });
    }
  } catch (error) {
    console.error('Internal server error:', error);
    return res.status(500).json({ message: 'Internal Server Error', success: false });
  }
};

// ---------------UPDATE PASSWORD------------------
exports.updatePassword = async (req, res) => {
  let { email, oldPassword, newPassword } = req.body;
  if (typeof email == 'string') {
    email.trim();
  }

  try {
    let user = await userModel.findOne({ where: { Email: email } });
    if (user == null) {
      res.status(200).json({ message: 'No such email found', success: false, statuscode: 0 });
    } else {
      let prevPassword = user.dataValues.password;
      if (newPassword == decrypt(prevPassword)) {
        res.status(200).json({ message: "Previous and New password can't be same", success: false, statuscode: 0 });
      } else if (oldPassword == decrypt(prevPassword)) {
        let encryptedNewPassword = encrypt(newPassword);
        try {
          await user.update({ password: encryptedNewPassword });
          res.status(200).json({ message: 'Password updated successfully', success: true, statuscode: 1 });
        } catch (error) {
          res.status(200).json({ message: 'Something went wrong! Please try again later.', success: false, statuscode: 0 });
        }
      } else {
        res.status(200).json({ message: 'Incorrect previous password', success: false, statuscode: 0 });
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal Server Error', success: false });
  }
};

// ---------------UPDATE USER DETAILS------------------
exports.updateUserDetails = async (req, res) => {
  const user = req.user;
  let { email, name, mobileNo } = req.body;
  if (typeof email == 'string') {
    email.trim();
  }

  try {
    await user.update({ name, email, mobileNo });
    return res.status(200).json({ message: 'User Details Updated Successfully ', success: true, statuscode: 0 });
  } catch (error) {
    // console.log(error)
    Logger.error({
      error_message: error ? error.name : 'catch error form user details update',
      user: user.email,
      url: '/user/update-userdetails',
      http_method: 'post',
      status_code: '0'
    });

    res.status(500).json({ message: 'Internal Server Error', success: false });
  }
};
