
const { createClient } = require("redis");

let redisClient;

const getRedisClient = async () => {
  if (!redisClient) {
    redisClient = createClient({ url: process.env.REDIS_URL });
    await redisClient.connect();
    // console.log("🔁 Redis client connected (for plan API)");
  }
  return redisClient;
};

module.exports = { getRedisClient };
