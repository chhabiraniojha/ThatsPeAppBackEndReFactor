const isEmpty = (value) => {
    return (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
    );
};

const getFieldValue = (field) => {
    const value = field?.value;

    if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value)
    ) {
        return value.value;
    }

    return value;
};

const resolvePaymentParams = ({
    config,
    fields,
    staticParams = {},
}) => {
    if (!config) {
        const error = new Error(
            "MobiKwik config is required"
        );
        error.code = "MOBIKWIK_CONFIG_REQUIRED";
        throw error;
    }

    if (!Array.isArray(fields)) {
        const error = new Error(
            "fields must be an array"
        );
        error.code = "INVALID_FIELDS";
        throw error;
    }

    const paymentParams = {};

    for (let parameterNo = 1; parameterNo <= 10; parameterNo++) {
        const paymentId =
            config[`param${parameterNo}PaymentId`];

        const billFetchId =
            config[`param${parameterNo}Id`];

        /*
         * Payment ID absent means this parameter
         * does not have a payment mapping.
         */
        if (isEmpty(paymentId)) {
            continue;
        }

        /*
         * Find the corresponding View Bill field.
         *
         * Example:
         * billFetchId = emailId
         * paymentId   = ad1
         */
        const field = fields.find(
            (item) =>
                item?.fieldKey === billFetchId
        );

        /*
         * If frontend field exists,
         * reuse its value.
         */
        if (field) {
            const value = getFieldValue(field);

            if (
                value !== undefined &&
                value !== null
            ) {
                paymentParams[paymentId] = value;
            }

            continue;
        }

        /*
         * If there is no frontend field,
         * check whether this parameter was
         * resolved as a static value.
         *
         * Example:
         * bankCode -> ICIC
         */
        if (
            !isEmpty(billFetchId) &&
            Object.prototype.hasOwnProperty.call(
                staticParams,
                billFetchId
            )
        ) {
            paymentParams[paymentId] =
                staticParams[billFetchId];
        }
    }

    return paymentParams;
};

module.exports = {
    resolvePaymentParams,
};