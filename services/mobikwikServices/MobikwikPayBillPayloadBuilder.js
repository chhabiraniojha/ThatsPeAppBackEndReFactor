const {
    getMobiKwikOperatorConfig,
} = require("./mobiKwikConfigResolver");

const {
    resolveStaticParams,
} = require("./mobikwikStaticValueResolver");

const {
    resolvePaymentParams,
} = require("./mobikwikPaymentParamsResolver");

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


const isEmpty = (value) => {
    return (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
    );
};


const buildMobiKwikPaymentPayload = async ({
    operatorId,
    fields,
    billAmount,
    billnetamount,
    customerMobile,
    paymentRefID,
    reqid,
}) => {

    // --------------------------------
    // 1. Basic validation
    // --------------------------------

    if (isEmpty(operatorId)) {
        const error = new Error(
            "operatorId is required"
        );

        error.code = "MISSING_OPERATOR_ID";

        throw error;
    }


    if (!Array.isArray(fields)) {
        const error = new Error(
            "fields must be an array"
        );

        error.code = "INVALID_FIELDS";

        throw error;
    }


    if (isEmpty(billAmount)) {
        const error = new Error(
            "billAmount is required"
        );

        error.code = "BILL_AMOUNT_REQUIRED";

        throw error;
    }


    if (isEmpty(billnetamount)) {
        const error = new Error(
            "billnetamount is required"
        );

        error.code = "BILL_NET_AMOUNT_REQUIRED";

        throw error;
    }


    if (isEmpty(customerMobile)) {
        const error = new Error(
            "customerMobile is required"
        );

        error.code = "CUSTOMER_MOBILE_REQUIRED";

        throw error;
    }


    if (isEmpty(paymentRefID)) {
        const error = new Error(
            "paymentRefID is required"
        );

        error.code = "PAYMENT_REF_ID_REQUIRED";

        throw error;
    }


    if (isEmpty(reqid)) {
        const error = new Error(
            "reqid is required"
        );

        error.code = "REQID_REQUIRED";

        throw error;
    }


    // --------------------------------
    // 2. Load MobiKwik configuration
    // --------------------------------

    const { config } =
        await getMobiKwikOperatorConfig({
            operatorId,
        });


    // --------------------------------
    // 3. Resolve static parameters
    // --------------------------------

    const staticParams =
        resolveStaticParams(config);


    // --------------------------------
    // 4. Find cn from View Bill fields
    // --------------------------------

    const cnField = fields.find(
        (field) =>
            field?.fieldKey === "cn"
    );


    if (!cnField) {
        const error = new Error(
            "cn field is required"
        );

        error.code = "CN_FIELD_REQUIRED";

        throw error;
    }


    const cnValue =
        getFieldValue(cnField);


    if (isEmpty(cnValue)) {
        const error = new Error(
            "cn value is required"
        );

        error.code = "CN_VALUE_REQUIRED";

        throw error;
    }


    // Keep customer identifier as string
    // to preserve leading zeroes.

    const cn = String(cnValue);


    // --------------------------------
    // 5. Resolve payment parameters
    // --------------------------------

    const paymentParams =
        resolvePaymentParams({
            config,
            fields,
            staticParams,
        });


    // --------------------------------
    // 6. Build final payment payload
    // --------------------------------

    const payload = {
        cn,

        op: String(config.op),

        cir: isEmpty(config.cirId)
            ? ""
            : String(config.cirId),

        // Final payable amount:
        // currently billAmount
        amt: String(billAmount),

        reqid: String(reqid),

        customerMobile:
            String(customerMobile),

        remitterName: "ThatsPe",

        paymentRefID:
            String(paymentRefID),

        paymentMode: "UPI",

        paymentAccountInfo:
            "7008698408@ybl",

        // Dynamic payment parameters
        ...paymentParams,
    };


    // --------------------------------
    // 7. Encrypt final payload
    // --------------------------------

    return encryptPayload(payload);
};


module.exports = {
    buildMobiKwikPaymentPayload,
};