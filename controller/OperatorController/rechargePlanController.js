
const rechargePlanService = require(
  "../../services/rechargePlans/rechargePlanService"
);

const logger = require("../../util/logger");

exports.getRechargePlans = async (req, res, next) => {
  try {
    // --------------------------------
    // 1. Validate request body
    // --------------------------------
    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({
        success: false,
        message: "Invalid request body",
      });
    }

    let { mobileNo } = req.body;

    if (typeof mobileNo === "string") {
      mobileNo = mobileNo.trim();
    }

    if (!mobileNo || !/^[6-9]\d{9}$/.test(mobileNo)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid mobile number",
      });
    }

    // --------------------------------
    // 2. Fetch operator, circle and plans
    // --------------------------------
    const result =
      await rechargePlanService.getRechargePlans(mobileNo);

    // --------------------------------
    // 3. Return response
    // --------------------------------
    return res.status(200).json({
      success: true,
      message: "Recharge plans fetched successfully",
      data: result,
    });
  } catch (error) {
    // --------------------------------
    // 4. Forward errors to global handler
    // --------------------------------
    next(error);
  }
};
