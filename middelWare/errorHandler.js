const logger = require("../util/logger");

const errorHandler = (error, req, res, next) => {
    const statusCode = error.statusCode || 500;

    logger.error("Unhandled application error", {
        method: req.method,
        url: req.originalUrl,
        statusCode,
        code: error.code,
        message: error.message,
        debugMessage: error.debugMessage
    });

    const publicMessage =
        error.publicMessage ||
        (statusCode >= 500
            ? "Internal Server Error"
            : error.message);

    return res.status(statusCode).json({
        success: false,
        message: publicMessage
    });
};

module.exports = errorHandler;