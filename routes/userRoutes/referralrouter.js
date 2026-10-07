const express = require('express')
const Authenticate= require('../../middelWare/auth')
const referralController=require("../../controller/ReferralController/refferalController")

const router = express.Router()

router.get('/',Authenticate, referralController.getReferrals)
router.get('/summary',Authenticate, referralController.getReferralSummary)


module.exports = router