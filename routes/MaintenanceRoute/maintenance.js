// import Maintenance from "../../controller/Maintenance/maintenance";
const Maintenance =require ("../../controller/MaintenanceController/maintenance")
const Authenticate=require("../../middelWare/auth")
const express = require('express')

const router = express.Router()

router.get('/',Authenticate,Maintenance.maintenanceStatus)

module.exports = router


