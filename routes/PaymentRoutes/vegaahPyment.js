const express = require('express');
const router = express();
const { generateSignature ,vegaahCallback} = require('../../controller/PaymentController/vegaahPyment');

router.post('/generate-signature', generateSignature);  
router.post('/callback', vegaahCallback);  
module.exports = router;