const RchargeCallback = require('../../controller/CallbackController/RechargeCallbacks')
const express = require('express')



const router = express.Router()
router.get('/a1recharge',RchargeCallback.a1RechargeCallback)
router.get('/robotics-exchange',RchargeCallback.roboticsExchangeCallback)
router.get('/recharge-exchange',RchargeCallback.rechargeExchangeCallback)
router.get('/status-check',RchargeCallback.statusCheck)

module.exports = router