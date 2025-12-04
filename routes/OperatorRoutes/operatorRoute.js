const express = require('express')
const operatorControlar = require('../../controller/OperatorController/operator')


const router = express.Router()
const Authenticate = require('../../middelWare/auth')

 
router.get('/opertaor-name-circle-name',  operatorControlar.getOperatorName)
router.get('/all-operator-circle-name',  operatorControlar.getAllOperatorAndCircleName)
router.get('/operator-data',  operatorControlar.getOperatorData)


router.get('/get-placeholder-name',  operatorControlar.getPlaceHolderName)
router.get('/get-billInfo',  operatorControlar.getBillInfo)
router.get('/get-fastag-billInfo',  operatorControlar.getFastagBillInfo)
router.get('/get-dth-billInfo',  operatorControlar.getDthBillInfo)
router.get('/get-gas-billInfo',  operatorControlar.getGasBillInfo)
router.get('/get-mynumber-operator-details',  operatorControlar.getSingleOperatorName)
 
// router.put('/update-ticket-by-admin', ticketController.closeTicketByAdmin)


module.exports = router


// http://planapi.in/api/Mobile/DTHINFOCheck?apimember_id=5679&api_password=rinku9938300585&Opcode=24&mobile_no=3029723868