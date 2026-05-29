const express = require('express');
const router = express();
const razorpayPaymentController = require('../../controller/PaymentController/razorPay');
const Authenticate = require('../../middelWare/auth')

// router.post('/generate-signature', razorpayPaymentController.generateSignature);  
router.post('/create-order', Authenticate, razorpayPaymentController.payRequest);
router.post('/verify-payment', Authenticate, razorpayPaymentController.verifyPayment);
router.all('/webhook', razorpayPaymentController.webhook);
// router.all('/payment-status-check', Authenticate,razorpayPaymentController.paymentStatusCheck);  
// router.all('/order-status-check', Authenticate,razorpayPaymentController.orderStatusCheck);  

module.exports = router;