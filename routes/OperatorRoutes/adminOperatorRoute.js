const express = require('express')
const operatorControlar = require('../../controller/OperatorController/operator')
const router = express.Router()
 const adminAuthenticate=require('../../middelWare/adminAuth')

router.get('/operator-data',adminAuthenticate,  operatorControlar.getOperatorDataAdmin)
router.post('/set-operator-discount',adminAuthenticate,  operatorControlar.setOperatorDiscount)


 


module.exports = router


// http://planapi.in/api/Mobile/DTHINFOCheck?apimember_id=5679&api_password=rinku9938300585&Opcode=24&mobile_no=3029723868