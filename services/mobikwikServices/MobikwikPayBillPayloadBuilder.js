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


const isValidCirId = (value) => {
    if (isEmpty(value)) {
        return false;
    }

    return (
        String(value).trim().toLowerCase() !==
        "as per state"
    );
};


const buildMobiKwikPaymentPayload = async ({
    operatorId,
    fields,
    cirId,
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
            "MobiKwik operatorId is required-from buildMobiKwikPaymentPayload"
        );

        error.code = "MISSING_OPERATOR_ID";

        throw error;
    }

    if (!Array.isArray(fields)) {
        const error = new Error(
            "MobiKwik fields must be an array-from buildMobiKwikPaymentPayload"
        );

        error.code = "INVALID_FIELDS";

        throw error;
    }

    if (isEmpty(billAmount)) {
        const error = new Error(
            "MobiKwik billAmount is required-from buildMobiKwikPaymentPayload"
        );

        error.code = "BILL_AMOUNT_REQUIRED";

        throw error;
    }

    if (isEmpty(billnetamount)) {
        const error = new Error(
            "MobiKwik billnetamount is required-from buildMobiKwikPaymentPayload"
        );

        error.code = "BILL_NET_AMOUNT_REQUIRED";

        throw error;
    }

    if (isEmpty(customerMobile)) {
        const error = new Error(
            "MobiKwik customerMobile is required-from buildMobiKwikPaymentPayload"
        );

        error.code = "CUSTOMER_MOBILE_REQUIRED";

        throw error;
    }

    if (isEmpty(paymentRefID)) {
        const error = new Error(
            "MobiKwik paymentRefID is required-from buildMobiKwikPaymentPayload"
        );

        error.code = "PAYMENT_REF_ID_REQUIRED";

        throw error;
    }

    if (isEmpty(reqid)) {
        const error = new Error(
            "MobiKwik reqid is required-from buildMobiKwikPaymentPayload"
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
            "MobiKwik cn field is required-from buildMobiKwikPaymentPayload"
        );

        error.code = "CN_FIELD_REQUIRED";

        throw error;
    }


    const cnValue =
        getFieldValue(cnField);


    if (isEmpty(cnValue)) {
        const error = new Error(
            "MobiKwik cn value is required-from buildMobiKwikPaymentPayload"
        );

        error.code = "CN_VALUE_REQUIRED";

        throw error;
    }


    const cn = String(cnValue);


    // --------------------------------
    // 5. Resolve circle ID
    // --------------------------------

    let finalCirId = "";

    if (isValidCirId(cirId)) {

        finalCirId = String(cirId);

    } else if (isValidCirId(config.cirId)) {

        finalCirId = String(config.cirId);

    }


    // --------------------------------
    // 6. Resolve payment parameters
    // --------------------------------

    const paymentParams =
        resolvePaymentParams({
            config,
            fields,
            staticParams,
        });


    // --------------------------------
    // 7. Build final payment payload
    // --------------------------------

    const payload = {

        cn,

        op: String(config.op),

        cir: finalCirId,

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

        ...paymentParams,
    };


    // --------------------------------
    // 8. Encrypt final payload
    // --------------------------------

    return encryptPayload(payload);
};


module.exports = {
    buildMobiKwikPaymentPayload,
};