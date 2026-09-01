const axios = require("axios");
const mobikwikTokenGenerate = require("../../util/mobikwikTokenGenerator");
const encryptPayload = require("../mobikwikServices/mobikwikEncryption");

const {
    getApiByName,
    createVendorAttempt,
    updateVendorAttempt,
} = require("../../services/vendorAttemptServices/vendorAttemptService");

exports.mobikwik = async (data) => {
    let api;
    try {

        api = await getApiByName("Mobikwik");

        await createVendorAttempt({
            rechargeTransactionId: data.rechargeTransactionId,
            apiId: api.id,
        });

        const token = await mobikwikTokenGenerate();

        // Request payload
        const payload = {

            "cn": data.customer_number,
            "op": data.operatorCode,
            "cir": data.circleCode,
            "amt": data.amount,
            "reqid": data.rechargeTransactionId,
            "remitterName": "Suvransu Sekhar Ojha",
            "paymentRefID": data.rechargeTransactionId,
            "paymentMode": "UPI",
            "paymentAccountInfo": "7008698408@ybl",

        };
        const encryptedData = encryptPayload(payload);

        // API call
        const response = await axios.post(
            "https://rapi-b2b.mobikwik.com/recharge/v3/retailerPayment",
            encryptedData,
            {
                headers: {
                    Authorization: token,
                    "Content-Type": "application/json",
                },
                timeout: 30000 // 30 sec timeout
            }
        );
        console.log(response)
        if (response.data.success && response.data.data.status == "SUCCESS") {
            await updateVendorAttempt({
                rechargeTransactionId: data.rechargeTransactionId,
                apiId: api.id,
                status: "SUCCESS",
                vendorTransactionId: response.data.opid || null,
                rawResponse: response.data,
                message: response.data.Message || null,
            });

            return {
                status: "SUCCESS",
                provider: "Mobikwik",
                raw: response.data,
            };
        } else if (response.data.success && response.data.data.status == "SUCCESSPENDING") {
            await updateVendorAttempt({
                rechargeTransactionId: data.rechargeTransactionId,
                apiId: api.id,
                status: "PENDING",
                vendorTransactionId: response.data.opid || null,
                rawResponse: response.data,
                message: response.data.Message || null,
            });
            return {
                status: 'PENDING',
                provider: 'Mobikwik',
                raw: response.data
            };
        }
        // Return API response
        await updateVendorAttempt({
            rechargeTransactionId: data.rechargeTransactionId,
            apiId: api.id,
            status: "FAILED",
            vendorTransactionId: statusResponse.data.opid || null,
            rawResponse: statusResponse.data,
            message: statusResponse.data.Message || null,
        });
        return {
            status: 'FAILED',
            provider: 'mobikwik',
            raw: response.data
        };

        

    } catch (error) {
        if (api) {
            await updateVendorAttempt({
                rechargeTransactionId: data.rechargeTransactionId,
                apiId: api.id,
                status: "PENDING",
                rawResponse: error.response?.data || null,
                message: error.message,
            });
        }


        return {
            status: "PENDING",
            provider: "Mobikwik",
            raw: error.response?.data || null,
            error: error.message,
        };

    }
};