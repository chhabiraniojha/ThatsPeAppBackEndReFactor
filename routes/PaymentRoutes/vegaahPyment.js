const express = require('express');
const router = express();
const { generateSignature ,vegaahCallback,payRequest,paymentStatusCheck,orderStatusCheck,orderStatusCheck_v1,vegaahReceipt} = require('../../controller/PaymentController/vegaahPyment');
const Authenticate = require('../../middelWare/auth')
console.log(payRequest)

router.post('/generate-signature', generateSignature);  
router.post('/new-paymentlink',Authenticate, payRequest);  
// router.all('/callback', vegaahCallback);  
router.all('/receipt', vegaahReceipt);  
router.all('/payment-status-check', Authenticate,paymentStatusCheck);  
router.all('/order-status-check', Authenticate,orderStatusCheck);  
router.all('/order-status-check/v1', Authenticate,orderStatusCheck_v1);

module.exports = router;