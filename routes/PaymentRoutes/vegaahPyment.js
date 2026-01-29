const express = require('express');
const router = express();
const { generateSignature ,vegaahCallback,payRequest,paymentStatusCheck,orderStatusCheck,vegaahReceipt} = require('../../controller/PaymentController/vegaahPyment');
const Authenticate = require('../../middelWare/auth')

router.post('/generate-signature', generateSignature);  
router.post('/new-paymentlink',Authenticate, payRequest);  
// router.all('/callback', vegaahCallback);  
router.all('/receipt', vegaahReceipt);  
router.all('/payment-status-check', Authenticate,paymentStatusCheck);  
router.all('/order-status-check', Authenticate,orderStatusCheck);  

module.exports = router;