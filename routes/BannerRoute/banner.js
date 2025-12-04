// import Maintenance from "../../controller/Maintenance/maintenance";
const Banner =require ("../../controller/BannerController/banner")
const express = require('express')

const router = express.Router()

router.get('/',Banner.getBanners)

module.exports = router


