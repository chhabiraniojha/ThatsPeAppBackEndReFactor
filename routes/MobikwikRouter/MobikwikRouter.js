const Mobikwik=require("../../controller/MobikwikController/MobikwikController")
const express=require("express")
const router = express.Router()


router.get('/recharge/plans',Mobikwik.getPlans)
router.post('/retailer/validation',Mobikwik.validateRecharge)
router.post('/bill',Mobikwik.viewBill)
router.post('/recharge',Mobikwik.makePayment)
router.get('/recharge/status',Mobikwik.checkStatus)
router.get('/retailer/balance',Mobikwik.checkBalance)
module.exports= router  