const express = require('express')
 const addTowallet =require("../../controller/AddtowalletController/addTowallet")
 const AuthenticationMiddleware = require('../../middelWare/auth');
 
const router = express.Router()

router.get('/varifay/add-to-wallet', AuthenticationMiddleware, addTowallet.addToWalletVarifay)

module.exports = router