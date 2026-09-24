const axios = require("axios");

const mobikwikTokenGenerate =
    require("../../util/mobikwikTokenGenerator");

const MOBIKWIK_PAYMENT_URL =
    "https://rapi-b2b.mobikwik.com/recharge/v3/retailerPayment";


const callMobiKwikPayment = async ({
    encryptedPayload,
}) => {

    if (!encryptedPayload) {
        const error = new Error(
            "MobiKwik encryptedPayload is required-from callMobiKwikPayment"
        );

        error.code =
            "MOBIKWIK_ENCRYPTED_PAYLOAD_REQUIRED";

        throw error;
    }


    const token =
        await mobikwikTokenGenerate();


    try {

        const response = await axios.post(
            MOBIKWIK_PAYMENT_URL,
            encryptedPayload,
            {
                headers: {
                    "Content-Type":
                        "application/json",

                    Authorization: token,
                },

                timeout: 30000,
            }
        );


        /*
         * MobiKwik HTTP request succeeded.
         *
         * The actual business status is inside
         * response.data.success.
         */

        if (!response.data?.success) {

            const error = new Error(
                "MobiKwik recharge request failed-from callMobiKwikPayment"
            );

            error.code =
                "MOBIKWIK_RECHARGE_REQUEST_FAILED";

            error.rawResponse =
                response.data;

            throw error;
        }


        return response.data;

    } catch (error) {

        /*
         * Preserve our own structured error.
         */
        if (
            error.code ===
            "MOBIKWIK_RECHARGE_REQUEST_FAILED"
        ) {
            throw error;
        }


        /*
         * Axios received an HTTP error response.
         *
         * Store only response.data.
         * Do NOT store the complete Axios response.
         */

        const structuredError = new Error(
            "MobiKwik recharge request failed-from callMobiKwikPayment"
        );

        structuredError.code =
            "MOBIKWIK_RECHARGE_REQUEST_FAILED";

        structuredError.rawResponse =
            error.response?.data || null;

        throw structuredError;
    }
};


module.exports = {
    callMobiKwikPayment,
};