  const providerStatusCheck = require('../../controller/ProviderStatusCheck/provideerStatusCheck');
  const express = require('express');
  const router = express();
 
 
  router.get('/providerStatusCheck',providerStatusCheck.getProviderStatusCheck)
  
  module.exports = router;