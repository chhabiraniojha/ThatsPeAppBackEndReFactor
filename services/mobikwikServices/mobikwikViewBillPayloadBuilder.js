const {
    getMobiKwikOperatorConfig,
} = require("./mobiKwikConfigResolver");

const {
    resolveStaticParams,
} = require("./mobikwikStaticValueResolver");

const encryptPayload = require("../mobikwikServices/mobikwikEncryption");

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

const buildMobiKwikViewBillPayload = async ({
    operatorId,
    fields,
}) => {
    if (!operatorId) {
        const error = new Error("operatorId is required");
        error.code = "MISSING_OPERATOR_ID";
        throw error;
    }

    if (!Array.isArray(fields)) {
        const error = new Error("fields must be an array");
        error.code = "INVALID_FIELDS";
        throw error;
    }

    const { config } = await getMobiKwikOperatorConfig({
        operatorId,
    });

    /*
     * Resolve static/predefined values from
     * MobiKwik operator configuration.
     *
     * Example:
     * FASTag  -> bankName = "16"
     * CCBP    -> bankCode = "IDFCB"
     */
    const staticParams = resolveStaticParams(config);

    const cnField = fields.find(
        (field) => field?.fieldKey === "cn"
    );

    if (!cnField) {
        const error = new Error("cn field is required");
        error.code = "CN_FIELD_REQUIRED";
        throw error;
    }

    const cn = getFieldValue(cnField);

    if (
        cn === undefined ||
        cn === null ||
        (typeof cn === "string" && cn.trim() === "")
    ) {
        const error = new Error("cn value is required");
        error.code = "CN_VALUE_REQUIRED";
        throw error;
    }

    /*
     * Frontend supplied parameters.
     *
     * cn is handled separately.
     */
    const frontendParams = {};

    fields.forEach((field) => {
        if (
            field?.fieldKey &&
            field.fieldKey !== "cn"
        ) {
            frontendParams[field.fieldKey] = getFieldValue(field);
        }
    });

    /*
     * Static parameters are merged LAST.
     *
     * This is intentional.
     *
     * If frontend accidentally sends:
     * bankName = "something"
     *
     * engine configuration will override it with
     * the actual configured static value.
     */
    const adParams = {
        ...frontendParams,
        ...staticParams,
    };

    const payload = {
        cn,
        op: config.op,
        cir: config.cirId ?? "",
        adParams,
    };

    return encryptPayload(payload);
};

module.exports = {
    buildMobiKwikViewBillPayload,
};