const axios = require("axios");
const { getRedisClient } = require("../util/redisClient");

const TOKEN_KEY = "mobikwik_token";
const LOCK_KEY = "mobikwik_token_lock";

const mobikwikTokenGenerate = async () => {

    // Get redis instance
    const redisClient = await getRedisClient();

    // 1. Check existing token
    const cachedToken = await redisClient.get(TOKEN_KEY);

    if (cachedToken) {
        return cachedToken;
    }

    // 2. Prevent parallel token generation
    const lock = await redisClient.set(
        LOCK_KEY,
        "locked",
        {
            NX: true,
            EX: 30
        }
    );

    // If another request is generating token
    if (!lock) {

        await new Promise(resolve => setTimeout(resolve, 2000));

        const retryToken = await redisClient.get(TOKEN_KEY);

        if (retryToken) {
            return retryToken;
        }

        throw new Error("Token generation in progress");
    }

    try {

        // Generate token
        const response = await axios.post(
            "https://rapi-b2b.mobikwik.com/recharge/v1/verify/retailer",
            {
                clientId: process.env.MOBIKWIK_CLIENT_ID,
                clientSecret: process.env.MOBIKWIK_CLIENT_SECRET
            }
        );
        console.log(response)
        if (!response.data.success) {
            throw new Error(
                response.data.message?.text || "Token generation failed"
            );
        }

        const token = response.data.data.token;

        // Store token for ~24h
        await redisClient.set(
            TOKEN_KEY,
            token,
            {
                EX: 86100
            }
        );

        return token;

    } catch (error) {

        throw new Error(
            error.response?.data?.message?.text ||
            error.message
        );

    } finally {

        // Remove lock
        await redisClient.del(LOCK_KEY);

    }
};

module.exports = mobikwikTokenGenerate;   