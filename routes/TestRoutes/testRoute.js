 
const express = require('express')
const test=require("../../controller/TestingApiController/test")
 
const router = express.Router()

router.get('/test-recharge', test.testRchargeApi)
 


module.exports = router