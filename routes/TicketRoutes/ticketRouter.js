const express = require('express')
const ticketController = require('../../controller/TicketController/ticket')


const router = express.Router()
const Authenticate = require('../../middelWare/auth')

router.post('/create-ticket', Authenticate, ticketController.createTicket)
router.get('/', Authenticate, ticketController.getAllTicket)
router.get('/get-ticket-by-email', ticketController.getAllTicketByEmailOrTicketId)
router.patch('/close-ticket-by-user', ticketController.closeTicketByUser)




module.exports = router