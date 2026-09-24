const { Op } = require("sequelize");

const Order = require("../../../models/OrderModel/order");

const updateOrderStatus = async ({
  order,
  vendorStatus,
}) => {
  /*
   * --------------------------------------------------
   * 1. BASIC VALIDATION
   * --------------------------------------------------
   */

  if (!order) {
    const error = new Error("Order is required");

    error.message = "Order is required";
    error.debugMessage = "error from updateOrderStatus.js";
    error.code = "ORDER_REQUIRED";

    throw error;
  }

  if (!order.id) {
    const error = new Error("Order ID is required");

    error.message = "OrderId is required";
    error.debugMessage = "error from updateOrderStatus.js";
    error.code = "ORDER_ID_REQUIRED";

    throw error;
  }

  if (!vendorStatus) {
    const error = new Error(
      "Vendor status is required"
    );

    error.message = "Vendor status is required";
    error.debugMessage = "error from updateOrderStatus.js";
    error.code = "VENDOR_STATUS_REQUIRED";

    throw error;
  }


  /*
   * --------------------------------------------------
   * 2. NORMALIZE STATUS
   * --------------------------------------------------
   */

  const status = String(
    vendorStatus
  ).toUpperCase();

  const allowedStatuses = [
    "SUCCESS",
    "FAILED",
    "PENDING",
  ];

  if (!allowedStatuses.includes(status)) {
    const error = new Error(
      `Invalid vendor status: ${vendorStatus}`
    );

    error.message =
      `Invalid vendor status: ${vendorStatus}`;

    error.debugMessage =
      "error from updateOrderStatus.js";

    error.code = "INVALID_VENDOR_STATUS";

    throw error;
  }


  /*
   * --------------------------------------------------
   * 3. DECIDE ORDER STATUS
   * --------------------------------------------------
   *
   * Vendor SUCCESS
   *      ↓
   * Order SUCCESS
   *
   * Vendor PENDING
   *      ↓
   * Order PENDING
   *
   * Vendor FAILED
   *      ↓
   * Order remains PROCESSING
   *
   * Final FAILED is handled separately by
   * markOrderFailed() after all eligible vendors
   * have failed.
   */

  let orderStatus;

  switch (status) {
    case "SUCCESS":
      orderStatus = "SUCCESS";
      break;

    case "PENDING":
      orderStatus = "PENDING";
      break;

    case "FAILED":
      orderStatus = "PROCESSING";
      break;

    default: {
      const error = new Error(
        "Unsupported vendor status"
      );

      error.message = "Unsupported vendor status";
      error.debugMessage =
        "error from updateOrderStatus.js";
      error.code = "UNSUPPORTED_VENDOR_STATUS";

      throw error;
    }
  }


  /*
   * --------------------------------------------------
   * 4. CONDITIONAL ORDER UPDATE
   * --------------------------------------------------
   *
   * Conditional update protects against another
   * process changing the order status at the same time.
   */

  let affectedRows;


  /*
   * --------------------------------------------------
   * SUCCESS
   * --------------------------------------------------
   *
   * CREATED / PROCESSING / PENDING
   *        ↓
   *      SUCCESS
   */

  if (status === "SUCCESS") {
    [affectedRows] = await Order.update(
      {
        status: "SUCCESS",
      },
      {
        where: {
          id: order.id,

          status: {
            [Op.in]: [
              "CREATED",
              "PROCESSING",
              "PENDING",
            ],
          },
        },
      }
    );
  }


  /*
   * --------------------------------------------------
   * PENDING
   * --------------------------------------------------
   *
   * PROCESSING
   *      ↓
   *    PENDING
   */

  if (status === "PENDING") {
    [affectedRows] = await Order.update(
      {
        status: "PENDING",
      },
      {
        where: {
          id: order.id,

          status: {
            [Op.in]: [
              "PROCESSING",
            ],
          },
        },
      }
    );
  }


  /*
   * --------------------------------------------------
   * FAILED VENDOR RESPONSE
   * --------------------------------------------------
   *
   * Vendor FAILED does NOT mean final Order FAILED.
   *
   * Order remains PROCESSING so that
   * fulfillOrderService() can try the next vendor.
   */

  if (status === "FAILED") {
    [affectedRows] = await Order.update(
      {
        status: "PROCESSING",
      },
      {
        where: {
          id: order.id,

          status: {
            [Op.in]: [
              "PROCESSING",
            ],
          },
        },
      }
    );
  }


  /*
   * --------------------------------------------------
   * 5. HANDLE CONDITIONAL UPDATE FAILURE
   * --------------------------------------------------
   *
   * affectedRows = 0 means another process may have
   * already changed the order status.
   */

  if (affectedRows === 0) {

    const latestOrder = await Order.findOne({
      where: {
        id: order.id,
      },
    });

    if (!latestOrder) {
      const error = new Error(
        "Order not found while updating status"
      );

      error.message =
        "Order not found while updating status";

      error.debugMessage =
        "error from updateOrderStatus.js";

      error.code = "ORDER_NOT_FOUND";

      throw error;
    }


    /*
     * SUCCESS already applied by another process.
     */

    if (
      status === "SUCCESS" &&
      latestOrder.status === "SUCCESS"
    ) {
      return {
        success: true,

        orderId: latestOrder.id,

        previousStatus: order.status,

        status: latestOrder.status,

        alreadyUpdated: true,
      };
    }


    /*
     * PENDING already applied by another process.
     */

    if (
      status === "PENDING" &&
      latestOrder.status === "PENDING"
    ) {
      return {
        success: true,

        orderId: latestOrder.id,

        previousStatus: order.status,

        status: latestOrder.status,

        alreadyUpdated: true,
      };
    }


    /*
     * Vendor FAILED response.
     *
     * Order is expected to remain PROCESSING.
     */

    if (
      status === "FAILED" &&
      latestOrder.status === "PROCESSING"
    ) {
      return {
        success: true,

        orderId: latestOrder.id,

        previousStatus: order.status,

        status: latestOrder.status,

        alreadyUpdated: true,
      };
    }


    /*
     * Unexpected state.
     */

    const error = new Error(
      `Order status could not be updated. Current status: ${latestOrder.status}`
    );

    error.message =
      `Order status could not be updated. Current status: ${latestOrder.status}`;

    error.debugMessage =
      "error from updateOrderStatus.js";

    error.code = "ORDER_STATUS_UPDATE_FAILED";

    throw error;
  }


  /*
   * --------------------------------------------------
   * 6. RETURN RESULT
   * --------------------------------------------------
   */

  return {
    success: true,

    orderId: order.id,

    previousStatus: order.status,

    status: orderStatus,

    alreadyUpdated: false,
  };
};


module.exports = {
  updateOrderStatus,
};