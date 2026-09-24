const zaakpayChecksum = require("../../util/zaakpayChecksum");


const zaakpayCreateOrder = async ({
    gateway,
    amount,
    orderId,
    user,
    productDescription,
}) => {

    // --------------------------------------------------
    // 1. Gateway configuration validation
    // --------------------------------------------------

    if (!gateway) {
        const error = new Error(
            "Zaakpay gateway configuration is required"
        );

        error.code = "ZAAKPAY_CONFIG_REQUIRED";

        throw error;
    }

    if (!gateway.key || !gateway.secret) {
        const error = new Error(
            "Zaakpay gateway configuration is incomplete"
        );

        error.code = "ZAAKPAY_CONFIG_INCOMPLETE";

        throw error;
    }


    // --------------------------------------------------
    // 2. Amount validation
    // --------------------------------------------------

    const paymentAmount = Number(amount);

    if (
        !Number.isFinite(paymentAmount) ||
        paymentAmount <= 0
    ) {
        const error = new Error(
            "Invalid Zaakpay payment amount"
        );

        error.code = "INVALID_ZAAKPAY_AMOUNT";

        throw error;
    }


    // --------------------------------------------------
    // 3. Order validation
    // --------------------------------------------------

    if (!orderId) {
        const error = new Error(
            "Order ID is required for Zaakpay"
        );

        error.code = "ZAAKPAY_ORDER_ID_REQUIRED";

        throw error;
    }


    // --------------------------------------------------
    // 4. User validation
    // --------------------------------------------------

    if (!user) {
        const error = new Error(
            "User information is required for Zaakpay"
        );

        error.code = "ZAAKPAY_USER_REQUIRED";

        throw error;
    }

    if (!user.email) {
        const error = new Error(
            "Buyer email is required for Zaakpay"
        );

        error.code = "ZAAKPAY_EMAIL_REQUIRED";

        throw error;
    }


    // --------------------------------------------------
    // 5. Zaakpay configuration
    // --------------------------------------------------

    const merchantIdentifier = gateway.key;

    const paymentUrl =
        "https://api.zaakpay.com/api/paymentTransact/V13";


    // --------------------------------------------------
    // 6. Amount in paisa
    // --------------------------------------------------

    const amountInPaisa =
        Math.round(paymentAmount * 100);


    // --------------------------------------------------
    // 7. Build Zaakpay request data
    // --------------------------------------------------

    const orderDetails = {

        amount: String(amountInPaisa),

        buyerEmail: user.email,

        buyerFirstName:
            user.name || "Customer",

        buyerPhoneNumber:
            user.mobileNo || "9999999999",

        currency: "INR",

        merchantIdentifier,

        orderId,

        productDescription:
            productDescription || "ThatsPe Payment",

        txnType: "1",

        mode: "0",

        zpPayOption: "1",
    };


    // --------------------------------------------------
    // 8. Generate checksum string
    // --------------------------------------------------

    const checksumString =
        zaakpayChecksum.getChecksumString(
            orderDetails
        );


    // --------------------------------------------------
    // 9. Generate checksum
    // --------------------------------------------------

    const checksum =
        zaakpayChecksum.calculateChecksum(
            checksumString
        );


    // --------------------------------------------------
    // 10. Create NVP request body
    // --------------------------------------------------

    const params =
        new URLSearchParams();


    Object.entries(orderDetails)
        .forEach(([key, value]) => {

            if (
                value !== undefined &&
                value !== null &&
                String(value) !== ""
            ) {
                params.append(
                    key,
                    String(value)
                );
            }
        });


    // Checksum must be added separately
    params.append(
        "checksum",
        checksum
    );


    const requestBody =
        params.toString();


    // --------------------------------------------------
    // 11. Return generic gateway response
    // --------------------------------------------------

    return {

        paymentType: "REDIRECT",

        data: {

            paymentUrl,

            requestBody,
        },
    };
};


module.exports = {
    zaakpayCreateOrder,
};