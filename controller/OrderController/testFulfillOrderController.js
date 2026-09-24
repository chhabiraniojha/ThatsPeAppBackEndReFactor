const  {fulfillOrderService}  = require("../../services/orderServices/fulfillment/fulfillOrderService");

exports.testFulfillOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    console.log("ORDER ID:", orderId);

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "orderId is required",
      });
    }

    const result = await fulfillOrderService({orderId});

    return res.status(200).json({
      success: true,
      message: "Fulfill order executed successfully",
      data: result,
    });
  } catch (error) {
    console.error("TEST FULFILL ORDER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Fulfill order failed",
      code: error.code || "FULFILL_ORDER_FAILED",
    });
  }
};