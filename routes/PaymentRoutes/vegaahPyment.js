const express = require('express');
const router = express();
const { generateSignature ,vegaahCallback} = require('../../controller/PaymentController/vegaahPyment');

router.post('/generate-signature', generateSignature);  
router.all('/callback', vegaahCallback);  
module.exports = router;