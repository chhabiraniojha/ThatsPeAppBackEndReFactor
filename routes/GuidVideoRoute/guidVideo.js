const guidVideo=require("../../controller/GuidVideoController/guidVideo")
const express = require('express')
const router=express.Router()

router.get('/guid-video',guidVideo.getGuidVideo)

module.exports=router