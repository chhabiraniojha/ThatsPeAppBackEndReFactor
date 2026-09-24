const validateOrderRequest = ({
    operatorId,
    fields,
    billAmount,
    billnetamount,
    paymentMethod,
}) => {

    if (!operatorId) {
        const error = new Error("operatorId is required");
        error.statusCode = 400;
        error.code = "MISSING_OPERATOR_ID";
        throw error;
    }

    if (!Array.isArray(fields)) {
        const error = new Error("fields must be an array");
        error.statusCode = 400;
        error.code = "INVALID_FIELDS";
        throw error;
    }

    if (
        billAmount === undefined ||
        billAmount === null ||
        billAmount === ""
    ) {
        const error = new Error("billAmount is required");
        error.statusCode = 400;
        error.code = "MISSING_BILL_AMOUNT";
        throw error;
    }

    if (
        billnetamount === undefined ||
        billnetamount === null ||
        billnetamount === ""
    ) {
        const error = new Error("billnetamountAmount is required");
        error.statusCode = 400;
        error.code = "MISSING_BILLNE_AMOUNT";
        throw error;
    }

    if (!["UPI", "WALLET", "COMBO"].includes(paymentMethod)) {
        const error = new Error(
            "paymentMethod must be UPI, WALLET or COMBO"
        );

        error.statusCode = 400;
        error.code = "INVALID_PAYMENT_METHOD";

        throw error;
    }

    return true;
};

module.exports = {
    validateOrderRequest,
};