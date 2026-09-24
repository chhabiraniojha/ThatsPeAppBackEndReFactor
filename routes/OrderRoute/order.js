const express = require("express");
const router = express.Router();
const Authentication= require("../../middelWare/auth")

const { createOrder } = require("../../controller/OrderController/order");

const {
  testFulfillOrder,
} = require("../../controller/OrderController/testFulfillOrderController");

router.post("/test/fulfill-order", testFulfillOrder);

router.post("/create",Authentication, createOrder);

module.exports = router;