const smsOtpController=require('../../controller/OtpController/smsOtp')
const express = require('express')



const router = express.Router()
// router.get("/test-global-error", async (req, res, next) => {
//     try {
//         throw new Error("TEST GLOBAL ERROR");
//     } catch (error) {
//         next(error);
//     }
// });

// router.post("/sendotp",otpController.sendOtp);
// router.post("/verifyotp",otpController.verifyOtp)
router.post("/send-sms-otp",smsOtpController.smsSendOtp);
router.post("/verify-sms-otp",smsOtpController.verifyOtp)


module.exports=router;