const {
    buildMobiKwikPaymentPayload,
} = require("../../services/mobikwikServices/MobikwikPayBillPayloadBuilder");

const {
    callMobiKwikPayment,
} = require("../../services/mobikwikServices/mobikwikPaymentService");


// Existing token service ko yahan apne actual path/name ke
// according import karna hai.
const mobikwikTokenGenerate = require("../../util/mobikwikTokenGenerator");


exports.testMobiKwikPayment = async (req, res) => {

    try {

        const {
            operatorId,
            fields,
            cirId,
            billAmount,
            billnetamount,
            customerMobile,
            paymentRefID,
            reqid,
        } = req.body;


        /*
         * --------------------------------
         * 1. Build + encrypt payment payload
         * --------------------------------
         */

        const encryptedPayload =
            await buildMobiKwikPaymentPayload({
                operatorId,
                fields,
                cirId,
                billAmount,
                billnetamount,
                customerMobile,
                paymentRefID,
                reqid,

            });



        /*
         * --------------------------------
         * 3. Call MobiKwik Payment API
         * --------------------------------
         */

        const mobikwikResponse =
            await callMobiKwikPayment({
                encryptedPayload,
            });


        /*
         * --------------------------------
         * 4. Return response
         * --------------------------------
         */

        return res.status(200).json({
            success: true,
            data: mobikwikResponse,
        });

    } catch (error) {

        console.error(
            "MobiKwik Payment Test Error:",
            error.message
        );


        return res.status(500).json({
            success: false,
            message:
                "Unable to process MobiKwik payment",
        });
    }
};