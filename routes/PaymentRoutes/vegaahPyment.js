const express = require('express');
const router = express();
const { generateSignature ,vegaahCallback,payRequest,paymentStausCheck} = require('../../controller/PaymentController/vegaahPyment');

router.post('/generate-signature', generateSignature);  
router.post('/new-paymentlink', payRequest);  
router.all('/callback', vegaahCallback);  
router.all('/payment-status-check', paymentStausCheck);  

module.exports = router;