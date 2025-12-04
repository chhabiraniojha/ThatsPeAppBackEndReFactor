const express = require('express')
const Authenticate= require('../../middelWare/auth')


const userManagementController = require('../../controller/UserManagementController/user')
const router = express.Router()

router.get('/getusers', userManagementController.getAllUser)
router.get('/getuser-fulldata', userManagementController.getUserFullDetails)
router.get('/recent-transactions', userManagementController.getLastFiveTransactions)
 


module.exports = router