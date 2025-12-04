const chatController = require('../../controller/ChatController/chat')
const express = require('express')



const router = express.Router()

router.post('/message', chatController.messages)
router.post('/media-message', chatController.mediaMessages)
router.get('/get-messages', chatController.getMessages)


module.exports = router

