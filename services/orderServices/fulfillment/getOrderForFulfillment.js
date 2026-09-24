const Order = require("../../../models/OrderModel/order");
const User = require("../../../models/UserModels/UserSchema/user");
const SubCategory = require("../../../models/SubCategoryModel/subCategory");
const OperatorData = require("../../../models/OperatorDataModel/operatorData");
const CircleData = require("../../../models/CircleDataModel/circleData");

const getOrderForFulfillment = async (orderId) => {
  if (!orderId) {
    const error = new Error("Order ID is required");
    error.message = "OrderId is required";
    error.debugMessage = "error from getOrderFullfillment.js"
    error.code = "ORDER_ID_REQUIRED";
    throw error;
  }

  const order = await Order.findOne({
    where: {
      id: orderId,
    },

    include: [
      {
        model: User,
        as: "user",
        attributes: [
          "id",
          "name",
          "email",
          "mobileNo",
        ],
      },

      {
        model: SubCategory,
        as: "service",
      },

      {
        model: OperatorData,
        as: "operator",
      },

      {
        model: CircleData,
        as: "circle",
      },
    ],
  });

  if (!order) {
    const error = new Error("Order not found");
    error.code = "ORDER_NOT_FOUND";
    error.message="Order not found"
    error.debugMessage = "error from getOrderFullfillment.js"
    throw error;
  }

  return order;
};

module.exports = {
  getOrderForFulfillment,
};