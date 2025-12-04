const express = require('express')


const walletTransactionController = require('../../controller/WalletController/walletTransaction')
const router = express.Router()

const Authenticate = require('../../middelWare/auth')


router.post('/initiate', walletTransactionController.initiateWalletTransaction)
router.post('/update', walletTransactionController.updateTransactionStatus)
router.post('/', walletTransactionController.getAllTransactions)
router.get('/filter-transactions', Authenticate, walletTransactionController.getAllWalletTransactions)


module.exports = router