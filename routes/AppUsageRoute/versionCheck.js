const AppUsage =require ("../../controller/App_UsageController/appVersionCheck")
const express = require('express')

const router = express.Router()

router.get('/latest-version',AppUsage.versionCheck)

module.exports = router
