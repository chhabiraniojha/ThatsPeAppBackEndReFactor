const Mobikwik=require("../../controller/MobikwikController/MobikwikController")
const express=require("express")
const router = express.Router();
const Authentication=require("../../middelWare/auth")
const {
  getMobiKwikInputFields,
} = require("../../controller/MobikwikController/mobiKwikInputFieldController");
const {
    viewBill,
} = require("../../controller/MobikwikController/mobikwikViewBillController");



router.post(
    "/view-bill",
    viewBill
);
router.get('/recharge/plans',Mobikwik.getPlans)
router.post('/retailer/validation',Mobikwik.validateRecharge)
router.post('/bill',Mobikwik.viewBill)
router.post('/recharge',Mobikwik.makePayment)
router.get('/recharge/status',Mobikwik.checkStatus)
router.get('/retailer/balance',Mobikwik.checkBalance)
router.get('/operator/input-fields',getMobiKwikInputFields)
module.exports= router  