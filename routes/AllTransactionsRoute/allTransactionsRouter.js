const allTransactionsController = require('../../controller/AllTransactionsController/allTransactions')
const express = require('express')
const Authenticate = require('../../middelWare/auth')



const router = express.Router()


router.get('/', Authenticate, allTransactionsController.getAllTransactions)
router.get('/transation-details', allTransactionsController.getSpexificTransaction)


module.exports = router