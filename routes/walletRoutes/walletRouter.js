const express = require('express')


const walletController = require('../../controller/WalletController/wallet')
const paymentControler= require('../../controller/PaymentController/payment')
const Authenticate = require('../../middelWare/auth')
const router = express.Router()

router.post('/create-wallet', walletController.createWallet)
router.get('/wallet-details', Authenticate, walletController.getWalletDetails)
router.post('/wallet-debit-secure-internal',paymentControler.testAddwalet)
router.post('/add-fund', walletController.addFund)
router.post('/refund', walletController.refund)



module.exports = router