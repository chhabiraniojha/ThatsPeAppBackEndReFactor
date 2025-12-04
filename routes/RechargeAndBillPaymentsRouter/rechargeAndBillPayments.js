const rchargeAndBillPayments = require('../../controller/RechargeAndBillPayments/rechargeAndBillPayments')
const express = require('express')
const Authenticate = require('../../middelWare/auth')

const router = express.Router()


router.post('/recharge-and-billpayments',rchargeAndBillPayments.rchargeAndBillPayments)
 


module.exports = router