const mobileRechargeTransactionController = require('../../controller/MobileRechargeTransactionController/mobileRechargeTransaction')
const express = require('express')

const router = express.Router()


router.post('/initiate-mobile-recharge-transaction', mobileRechargeTransactionController.initiateRecharge)
router.post('/update-mobile-recharge-transaction-status', mobileRechargeTransactionController.updateTransactionStatus)
router.post('/get-mobile-recharge-transactions', mobileRechargeTransactionController.getAllTransactions)
router.post('/get-mobile-recharge-limited-transactions', mobileRechargeTransactionController.getLimitedTransactions)


module.exports = router