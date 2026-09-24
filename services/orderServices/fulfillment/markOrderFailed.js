const { Op } = require("sequelize");

const Order = require("../../../models/OrderModel/order");

const markOrderFailed = async ({ order }) => {
  /*
   * --------------------------------------------------
   * 1. BASIC VALIDATION
   * --------------------------------------------------
   */

  if (!order) {
    const error = new Error("Order is required");

    error.message = "Order is required";
    error.debugMessage = "error from markOrderFailed.js";
    error.code = "ORDER_REQUIRED";

    throw error;
  }

  if (!order.id) {
    const error = new Error("Order ID is required");

    error.message = "OrderId is required";
    error.debugMessage = "error from markOrderFailed.js";
    error.code = "ORDER_ID_REQUIRED";

    throw error;
  }


  /*
   * --------------------------------------------------
   * 2. FINAL FAILURE STATUS
   * --------------------------------------------------
   *
   * Ye service tabhi call hogi jab fulfillment
   * confirm kar chuka ho ki saare eligible vendors
   * FAILED ho gaye hain.
   *
   * PROCESSING / CREATED
   *          ↓
   *        FAILED
   *
   * SUCCESS / PENDING ko FAILED nahi karenge.
   */

  const [affectedRows] = await Order.update(
    {
      status: "FAILED",
    },
    {
      where: {
        id: order.id,

        status: {
          [Op.in]: [
            "PROCESSING",
            "CREATED",
          ],
        },
      },
    }
  );


  /*
   * --------------------------------------------------
   * 3. HANDLE CONDITIONAL UPDATE FAILURE
   * --------------------------------------------------
   */

  if (affectedRows === 0) {

    const latestOrder = await Order.findOne({
      where: {
        id: order.id,
      },
    });

    if (!latestOrder) {
      const error = new Error(
        "Order not found while marking failed"
      );

      error.message = "Order not found while marking failed";
      error.debugMessage = "error from markOrderFailed.js";
      error.code = "ORDER_NOT_FOUND";

      throw error;
    }


    /*
     * Already FAILED hai.
     *
     * Idempotent success.
     */

    if (latestOrder.status === "FAILED") {
      return {
        success: true,

        orderId: latestOrder.id,

        status: "FAILED",

        alreadyFailed: true,
      };
    }


    /*
     * SUCCESS / PENDING / PROCESSING ke unexpected
     * states ko silently overwrite nahi karenge.
     */

    const error = new Error(
      `Order cannot be marked FAILED from status ${latestOrder.status}`
    );

    error.message =
      `Order cannot be marked FAILED from status ${latestOrder.status}`;

    error.debugMessage = "error from markOrderFailed.js";

    error.code =
      "INVALID_ORDER_FAILURE_TRANSITION";

    throw error;
  }


  /*
   * --------------------------------------------------
   * 4. RETURN RESULT
   * --------------------------------------------------
   */

  return {
    success: true,

    orderId: order.id,

    status: "FAILED",

    alreadyFailed: false,
  };
};


module.exports = {
  markOrderFailed,
};