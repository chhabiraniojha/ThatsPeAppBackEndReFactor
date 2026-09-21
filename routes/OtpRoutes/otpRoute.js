const smsOtpController=require('../../controller/OtpController/smsOtp')
const express = require('express')



const router = express.Router()

// router.post("/sendotp",otpController.sendOtp);
// router.post("/verifyotp",otpController.verifyOtp)
router.post("/send-sms-otp",smsOtpController.smsSendOtp);
router.post("/verify-sms-otp",smsOtpController.verifyOtp)


module.exports=router;