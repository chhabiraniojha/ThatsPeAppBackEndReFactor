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


/*
 * Check whether cirId contains a usable MobiKwik
 * circle value.
 *
 * "As per State" is not an actual circle ID.
 */
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


    /*
     * Keep customer identifier as string
     * to preserve leading zeroes.
     */

    const cn = String(cnValue);


    // --------------------------------
    // 5. Resolve circle ID
    // --------------------------------
    //
    // Priority:
    //
    // 1. cirId received by function
    // 2. config.cirId
    //
    // But "As per State" is NOT treated
    // as an actual circle ID.
    //

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

        /*
         * Final payable amount.
         *
         * Currently billAmount is used
         * for MobiKwik payment.
         *
         * billnetamount is received and
         * retained for future/reference.
         */

        amt: String(billAmount),

        reqid: String(reqid),

        customerMobile:
            String(customerMobile),

        /*
         * Backend controlled values.
         */

        remitterName: "ThatsPe",

        paymentRefID:
            String(paymentRefID),

        paymentMode: "UPI",

        paymentAccountInfo:
            "7008698408@ybl",

        /*
         * Dynamic payment parameters.
         */

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