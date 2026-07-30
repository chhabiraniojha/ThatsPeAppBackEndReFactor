const adminAnalyticsController = require('../../controller/AllTransactionsController/adminAnalyticsController')
const express = require('express')
const Authenticate = require('../../middelWare/auth')
const adminAuthenticate = require("../../middelWare/adminAuth")
const adminDashboardController=require("../../controller/adminController/dashboard")



const router = express.Router()


 
router.get('/analytics/today', adminAnalyticsController.estimateAvgTransaction)
router.get('/analytics/refund', adminAnalyticsController.estimateAvgRefund)
router.get('/analytics/graph-data', adminAnalyticsController.getGraphData)
router.get('/analytics/transactions', adminAnalyticsController.getLastFiveTransactions)
router.get("/dashboard",adminAuthenticate,adminDashboardController.getDashboard);


module.exports = router