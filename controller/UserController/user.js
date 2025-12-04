var jwt = require('jsonwebtoken');
const crypto = require('crypto');
const userModel = require('../../models/UserModels/UserSchema/user');
const otpModel = require('../../models/OtpModels/Otp');
const walletModel = require('../../models/WalletModels/WalletSchema/wallet');
let uid = require('../../util/uidGenerator');
const sequelize = require('../../util/db_connect');
let { sendEmail } = require('../../util/nodeMailerConfig');
let { sendOtp, verifyOtp } = require('../../controller/OtpController/Otp');
const { use } = require('../../routes/userRoutes/userRouter');
const { default: axios } = require('axios');
const Logger = require('../../util/logData');

let algorithm = 'aes-256-ctr';
let ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
let IV_LENGTH = 16;

const generateAccessToken = (newUser) => {
  return jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET_KEY, { expiresIn: '7d' });
};

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
exports.signup = async (req, res) => {
  let { name, email, referCode } = req.body;
//   const authHeader = req.headers.authorization;
  let t = null; // Declare t outside the try block
 
  if (typeof email === 'string') {
    email = email.trim();
  }
  // password = password.trim()

  // Check if req.body is not valid JSON

  // Check if mobile number length is at least 10 characters
  // if (mobileNo.length < 10 || mobileNo.length > 13) {
  //     return res.status(200).json({
  //         success: false,
  //         statuscode: 0,
  //         message: "Mobile number must be at least 10 digits long."
  //     });
  // }
  // if (password && password.length < 6) {
  //     return res.status(200).json({
  //         success: false,
  //         statuscode: 0,
  //         message: "Password should be 6 digits or  greater than 6 digits"
  //     });

  try {
    if (typeof req.body !== 'object') {
      return res.status(200).json({ success: false, statuscode: 0, message: 'Invalid JSON payload' });
    }
    // Check if any required field is missing or null
    if (!name || !email  ) {
      return res.status(200).json({
        success: false,
        statuscode: 0,
        message: ' Name and Email is required.'
      });
    }
    // const decodeData = jwt.verify(authHeader, process.env.JWT_SECRET_KEY);
    const mobileNo =  req.mobileNo
 
    console.log(name, email, mobileNo);
    //teting auth token mobile no

    // return res.status(200).json({
    //   success: false,
    //   statuscode: 0,
    //   message: ' testing  auth token',
    //   mobileNo
    // });

    // password = encrypt(password);
    const t = await sequelize.transaction();

    // Generate user id
    let id = await uid();
    const status = 'active';

    // Check if email already exists
    let userEmail = await userModel.findOne({ where: { email } });
    if (userEmail) {
      await t.rollback();
      return res.status(200).json({ message: 'Email id already exists', success: false, statuscode: 0, token: null });
    }

    // Check if mobile number already exists
    let userMobileNumber = await userModel.findOne({ where: { mobileNo } });
    if (userMobileNumber) {
      await t.rollback();
      return res.status(200).json({ message: 'Mobile Number already exists', success: false, statuscode: 0, token: null });
    }

    // // Verify OTP
    // let otpVerificationStatus;
    // try {
    //   otpVerificationStatus = await axios.post(`${process.env.SERVER_BASEUSRL}/verifyotp`, {
    //     email,
    //     otp
    //   });
    // } catch (otpError) {
    //   await t.rollback();
    //   Logger.error({
    //     error_message: otpError ? otpError.name : 'error form signup otp send ',
    //     user: email,
    //     url: '/user/signup',
    //     http_method: 'post',
    //     status_code: '0'
    //   });
    //   return res.status(200).json({ success: false, message: 'OTP mismatch or expired', statuscode: 0 });
    // }

    // // Proceed with user signup if OTP verification is successful
    // if (otpVerificationStatus.data.success) {
    //   const userDetails = await userModel.create(
    //     {
    //       id,
    //       name,
    //       email,
    //       password,
    //       mobileNo,
    //       status
    //     },
    //     { transaction: t }
    //   );
    const userDetails = await userModel.create(
        {
          id,
          name,
          email,
        //   password,
          mobileNo,
          status
        },
        { transaction: t }
    )

      const walletId = await uid();
      const amount = 0.0;
      await walletModel.create(
        {
          id: walletId,
          userId: userDetails.id,
          amount
        },
        { transaction: t }
      );

      await t.commit();
      // remove password before sending user
      delete userDetails.dataValues.password;
      return res
        .status(200)
        .json({ success: true, message: 'User signup successfully', token: generateAccessToken(userDetails), userDetails, statuscode: 1 });
    }  
    
   catch (error) {
    // console.error('Error in signup:', error);
    if (t) {
      await t.rollback();
    }
    Logger.error({
      error_message: error ? error.name : 'catch error form signup  ',
      user: email,
      url: '/user/signup',
      http_method: 'post',
      status_code: '0'
    });
    return res.status(500).json({ success: false, error: error.message, message: 'Internal server error' });
  }
}
;

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
