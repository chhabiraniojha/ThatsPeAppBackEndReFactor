const jwt = require("jsonwebtoken");
const Sentry = require("@sentry/node");

const logger = require("../util/logger");

const SignupTokenVerify = async (req, res, next) => {

  try {

    // ========================================
    // 1. Get authorization token
    // ========================================

    const token = req.header("authorization");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authorization token is missing"
      });
    }


    // ========================================
    // 2. Verify token
    // ========================================

    const decodeData = jwt.verify(
      token,
      process.env.JWT_SECRET_KEY
    );


    // ========================================
    // 3. Get mobile number from token
    // ========================================

    const mobileNo = decodeData?.mobileNo;


    // ========================================
    // 4. Validate mobile number
    // ========================================

    if (!mobileNo) {

      logger.warn(
        "Signup token does not contain mobile number",
        {
          route: "/user/signup"
        }
      );

      return res.status(401).json({
        success: false,
        message: "Invalid signup token"
      });
    }


    if (!/^[6-9]\d{9}$/.test(mobileNo)) {

      logger.warn(
        "Invalid mobile number in signup token",
        {
          route: "/user/signup"
        }
      );

      return res.status(401).json({
        success: false,
        message: "Invalid signup token"
      });
    }


    // ========================================
    // 5. Attach mobile number to request
    // ========================================

    req.mobileNo = mobileNo;


    // ========================================
    // 6. Continue to signup controller
    // ========================================

    next();

  } catch (error) {

    // ========================================
    // 7. Token expired
    // ========================================

    if (error.name === "TokenExpiredError") {

      logger.warn(
        "Signup token expired",
        {
          route: "/user/signup"
        }
      );

      return res.status(401).json({
        success: false,
        message: "Signup token has expired"
      });
    }


    // ========================================
    // 8. Invalid token
    // ========================================

    if (error.name === "JsonWebTokenError") {

      logger.warn(
        "Invalid signup token",
        {
          route: "/user/signup"
        }
      );

      return res.status(401).json({
        success: false,
        message: "Invalid signup token"
      });
    }


    // ========================================
    // 9. Unexpected error
    // ========================================

    logger.error(
      "Unexpected error during signup token verification",
      {
        route: "/user/signup",
        errorName:
          error?.name || "UNKNOWN_ERROR",
        errorMessage:
          error?.message || "Unknown error"
      }
    );

    Sentry.captureException(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

module.exports = SignupTokenVerify;
