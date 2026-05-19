const axios = require("axios");

const mobikwikTokenGenerate = require("../../util/mobikwikTokenGenerator");
const encryptPayload = require("../mobikwikServices/mobikwikEncryption");

exports.mobikwikBalanceCheck = async () => {
    try {

        // Generate auth token
        const token = await mobikwikTokenGenerate();

        // Request payload
        const payload = {
            memberId: "info@digidivine.online"
        };

        // Encrypt request
        const encryptedData = encryptPayload(payload);

        // API call
        const response = await axios.post(
            "https://rapi-b2b.mobikwik.com/recharge/v3/retailerBalance",
            encryptedData,
            {
                headers: {
                    Authorization: token,
                    "Content-Type": "application/json",
                },
                timeout: 30000 // 30 sec timeout
            }
        );

        // Return API response
        return response.data;

    } catch (error) {

        // Axios error handling
        if (error.response) {

            console.error("Mobikwik API Error:", {
                status: error.response.status,
                data: error.response.data
            });

            throw new Error(
                error.response.data?.message ||
                "Mobikwik API failed"
            );

        } else if (error.request) {

            console.error("No response from Mobikwik");

            throw new Error("No response from Mobikwik API");

        } else {

            console.error("Internal Error:", error.message);

            throw new Error(error.message);
        }
    }
};

exports.mobikwikViewBill = async (cn, op, cir,adParams) => {
    try {

        // Generate auth token
        const token = await mobikwikTokenGenerate();

        // Request payload
        const payload = {

            "cn": cn,
            "op": op,
            "cir": cir,
            "adParams": adParams

        };

        // Encrypt request
        const encryptedData = encryptPayload(payload);

        // API call
        const response = await axios.post(
            "https://rapi-b2b.mobikwik.com/recharge/v3/retailerViewbill",
            encryptedData,
            {
                headers: {
                    Authorization: token,
                    "Content-Type": "application/json",
                },
                timeout: 30000 // 30 sec timeout
            }
        );

        // Return API response
        return response.data;

    } catch (error) {

        // Axios error handling
        if (error.response) {

            console.error("Mobikwik API Error:", {
                status: error.response.status,
                data: error.response.data
            });

            throw new Error(
                error.response.data?.message ||
                "Mobikwik API failed"
            );

        } else if (error.request) {

            console.error("No response from Mobikwik");

            throw new Error("No response from Mobikwik API");

        } else {

            console.error("Internal Error:", error.message);

            throw new Error(error.message);
        }
    }
};