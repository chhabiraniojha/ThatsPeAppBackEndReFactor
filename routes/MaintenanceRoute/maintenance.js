// import Maintenance from "../../controller/Maintenance/maintenance";
const Maintenance =require ("../../controller/MaintenanceController/maintenance")
const express = require('express')

const router = express.Router()

router.get('/',Maintenance.maintenanceStatus)

module.exports = router


