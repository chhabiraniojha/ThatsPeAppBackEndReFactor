const express = require('express');
const router = express();
const zaakpayPaymentController = require('../../controller/PaymentController/zaakPay');
const Authenticate = require('../../middelWare/auth')

 
router.post('/create-order', Authenticate, zaakpayPaymentController.payRequest);
router.all('/webhook', zaakpayPaymentController.webhook);


module.exports = router;