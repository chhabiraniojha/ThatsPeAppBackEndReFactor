const express = require("express");
const router = express.Router();
const notification = require("../../controller/NotificationController/notification");

router.post("/send-notification", notification.testNotification);

module.exports = router;
