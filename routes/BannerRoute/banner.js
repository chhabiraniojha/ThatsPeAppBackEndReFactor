// import Maintenance from "../../controller/Maintenance/maintenance";
const Banner =require ("../../controller/BannerController/banner")
const Authenticate=require("../../middelWare/auth")
const express = require('express')

const router = express.Router()

router.get('/',Authenticate,Banner.getBanners)

module.exports = router


