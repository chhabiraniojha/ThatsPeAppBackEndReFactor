const express = require('express');
const router = express();
const { generateSignature ,vegaahCallback,payRequest} = require('../../controller/PaymentController/vegaahPyment');

router.post('/generate-signature', generateSignature);  
router.post('/new-paymentlink', payRequest);  
router.all('/callback', vegaahCallback);  

module.exports = router;