const express = require('express')
const ticketController = require('../../controller/TicketController/ticket')

const router = express.Router()
const adminAuthenticate = require('../../middelWare/adminAuth')




 router.get('/', adminAuthenticate,ticketController.getAllTicketForAdmin)
 router.get('/open', adminAuthenticate,ticketController.getAllOpenTickets)
 router.patch('/intervene', adminAuthenticate,ticketController.changeTicketInterveneStatus)
 router.patch('/resolve', adminAuthenticate,ticketController.changeTicketResolveStatus)
 
router.patch('/close-ticket-by-admin', ticketController.closeTicketByAdmin)



module.exports = router