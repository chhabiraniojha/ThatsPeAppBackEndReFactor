const express = require('express')


const walletWithdrawalController = require('../../controller/WalletController/walletWithdrawl')
const router = express.Router()

const Authenticate = require('../../middelWare/auth')


router.get("/",Authenticate,walletWithdrawalController.getWithdrawalHistory)
router.post("/request",Authenticate,walletWithdrawalController.createWithdrawalRequest)


module.exports = router