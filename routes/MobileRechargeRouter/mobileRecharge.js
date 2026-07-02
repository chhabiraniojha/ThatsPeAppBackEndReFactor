const express = require('express')


const mobileRechargeController = require('../../controller/MobileRechargeAPIController/mobileRechargeAPI')
const router = express.Router()

router.post('/mobile-recharge-api', mobileRechargeController.mobileRechargeAPI)
router.post('/mobile-recharge', mobileRechargeController.mobileRecharge)
router.post('/test-api', mobileRechargeController.testApis)
router.get('/get-circle-operator-data', mobileRechargeController.getCircleAndOperator)
router.get('/get-roffer-data', mobileRechargeController.rOfferCheck)
router.get('/plancheck', mobileRechargeController.planCheck)
router.get('/plancheck/v2', mobileRechargeController.planCheckV2)
router.get('/get-recharge-details-by-mobileno', mobileRechargeController.getRechargeDetailsByMobileNumber)

module.exports = router


// 143.244.137.235
// rinku@Suvransu