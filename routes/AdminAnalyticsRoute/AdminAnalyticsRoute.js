const adminAnalyticsController = require('../../controller/AllTransactionsController/adminAnalyticsController')
const express = require('express')
const Authenticate = require('../../middelWare/auth')



const router = express.Router()


 
router.get('/analytics/today', adminAnalyticsController.estimateAvgTransaction)
router.get('/analytics/refund', adminAnalyticsController.estimateAvgRefund)
router.get('/analytics/graph-data', adminAnalyticsController.getGraphData)
router.get('/analytics/transactions', adminAnalyticsController.getLastFiveTransactions)


module.exports = router