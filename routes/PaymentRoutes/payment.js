const {newPayment, paymentStatusCallBack,getPaymentStatus,getPaymentgatewayIsLiveStatus} = require('../../controller/PaymentController/payment');
const express = require('express');
const router = express();
const Authenticate = require('../../middelWare/auth')
router.post('/new-payment', Authenticate,newPayment);
router.post('/cb-status/:id', paymentStatusCallBack);
router.get('/payment-status-pool/:id',getPaymentStatus)
router.get('/payment-gateway/islive',getPaymentgatewayIsLiveStatus)


module.exports = router;