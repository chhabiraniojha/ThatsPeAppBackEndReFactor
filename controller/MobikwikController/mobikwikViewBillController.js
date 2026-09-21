const axios = require("axios");
const Sentry = require("@sentry/node");

const {
    buildMobiKwikViewBillPayload,
} = require("../../services/mobikwikServices/mobikwikViewBillPayloadBuilder");

const mobikwikTokenGenerate = require("../../util/mobikwikTokenGenerator");
const logger = require("../../util/logger");

const viewBill = async (req, res) => {
    const { operatorId, fields } = req.body;

    try {
        logger.info("MobiKwik View Bill request started", {
            operatorId,
        });

        // 1. Build + encrypt payload
        let encryptedPayload;

        try {
            encryptedPayload =
                await buildMobiKwikViewBillPayload({
                    operatorId,
                    fields,
                });
        } catch (error) {
            logger.error("MobiKwik View Bill payload/encryption failed", {
                operatorId,
                error: error.message,
                code: error.code,
            });

            Sentry.withScope((scope) => {
                scope.setTag("service", "mobikwik");
                scope.setTag("operation", "view_bill");
                scope.setTag("stage", "payload_encryption");

                scope.setContext("mobikwik_view_bill", {
                    operatorId,
                    errorCode: error.code || null,
                });

                Sentry.captureException(error);
            });

            return res.status(500).json({
                success: false,
                message: error.message || "Failed to prepare MobiKwik request",
            });
        }

        // 2. Generate authentication token
        let token;

        try {
            token = await mobikwikTokenGenerate();
        } catch (error) {
            logger.error("MobiKwik token generation failed", {
                operatorId,
                error: error.message,
                code: error.code,
            });

            Sentry.withScope((scope) => {
                scope.setTag("service", "mobikwik");
                scope.setTag("operation", "view_bill");
                scope.setTag("stage", "token_generation");

                scope.setContext("mobikwik_view_bill", {
                    operatorId,
                    errorCode: error.code || null,
                });

                Sentry.captureException(error);
            });

            return res.status(500).json({
                success: false,
                message: "MobiKwik authentication failed",
            });
        }

        // 3. MobiKwik API call
        let response;

        try {
            response = await axios.post(
                "https://rapi-b2b.mobikwik.com/recharge/v3/retailerViewbill",
                encryptedPayload,
                {
                    headers: {
                        Authorization: token,
                        "Content-Type": "application/json",
                    },
                    timeout: 30000,
                }
            );
        } catch (error) {
            logger.error("MobiKwik View Bill API failed", {
                operatorId,
                error: error.message,
                code: error.code,
                status: error.response?.status,
            });

            Sentry.withScope((scope) => {
                scope.setTag("service", "mobikwik");
                scope.setTag("operation", "view_bill");
                scope.setTag("stage", "api_call");

                scope.setContext("mobikwik_view_bill", {
                    operatorId,
                    httpStatus: error.response?.status || null,
                    errorCode: error.code || null,
                });

                Sentry.captureException(error);
            });

            return res.status(error.response?.status || 500).json({
                success: false,
                message:
                    error.response?.data?.message ||
                    error.message ||
                    "MobiKwik View Bill API failed",
            });
        }

        logger.info("MobiKwik View Bill successful", {
            operatorId,
            status: response.status,
        });

        return res.status(200).json({
            success: true,
            data: response.data,
        });
    } catch (error) {
        // Unexpected controller-level error
        logger.error("Unexpected MobiKwik View Bill error", {
            operatorId,
            error: error.message,
            code: error.code,
        });

        Sentry.withScope((scope) => {
            scope.setTag("service", "mobikwik");
            scope.setTag("operation", "view_bill");
            scope.setTag("stage", "unexpected");

            scope.setContext("mobikwik_view_bill", {
                operatorId,
                errorCode: error.code || null,
            });

            Sentry.captureException(error);
        });

        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};

module.exports = {
    viewBill,
};