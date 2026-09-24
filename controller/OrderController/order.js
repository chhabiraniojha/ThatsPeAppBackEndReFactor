const logger = require("../../util/logger");
const Sentry = require("@sentry/node");

const {
    createOrderService,
} = require("../../services/orderServices/createOrderService");


const createOrder = async (req, res) => {
    const userId = req.user?.id;

    try {
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const result = await createOrderService({
            userId,
            ...req.body,
        });

        return res.status(200).json({
            success: true,
            message: "Order validation successful",
            data: result,
        });

    } catch (error) {

        logger.error("Create order failed", {
            stage: "CREATE_ORDER",
            userId,
            errorCode: error.code,
            error: error.message,
        });

        Sentry.captureException(error, {
            tags: {
                stage: "CREATE_ORDER",
                errorCode: error.code || "UNKNOWN",
            },
            extra: {
                userId,
            },
        });
        console.log(error)
        return res.status(error.statusCode || 500).json({
            success: false,
            message:
                error.statusCode
                    ? error.message
                    : "Internal server error",
        });
    }
};


module.exports = {
    createOrder,
};