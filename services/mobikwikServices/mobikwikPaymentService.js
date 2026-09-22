const axios = require("axios");
const mobikwikTokenGenerate = require("../../util/mobikwikTokenGenerator");

const MOBIKWIK_PAYMENT_URL =
    "https://rapi-b2b.mobikwik.com/recharge/v3/retailerPayment";


const callMobiKwikPayment = async ({
    encryptedPayload,
}) => {

    const token=await mobikwikTokenGenerate();


    if (!encryptedPayload) {
        const error = new Error(
            "encryptedPayload is required"
        );

        error.code = "MOBIKWIK_ENCRYPTED_PAYLOAD_REQUIRED";

        throw error;
    }


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


        return response.data;

    } catch (error) {

        /*
         * Keep the original MobiKwik response
         * available for the caller.
         */

        if (error.response) {

            return {
                success: false,

                httpStatus:
                    error.response.status,

                data:
                    error.response.data,
            };
        }


        throw error;
    }
};


module.exports = {
    callMobiKwikPayment,
};