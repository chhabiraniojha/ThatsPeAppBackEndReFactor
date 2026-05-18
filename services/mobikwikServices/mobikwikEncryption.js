const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// 🔐 Load Mobikwik Public Key
const publicKey = fs.readFileSync(
  path.join(__dirname, "public_key.pem"),
  "utf8"
);
/**
 * Encrypt payload for Mobikwik APIs
 * @param {Object} payload
 * @returns {Object}
 */
function encryptPayload(payload) {
  try {
    // Convert payload to JSON string
    const jsonPayload = JSON.stringify(payload);

    // Generate AES-256 session key
    const sessionKey = crypto.randomBytes(32);

    // Generate IV
    const iv = crypto.randomBytes(16);

    // AES-256-GCM encryption
    const cipher = crypto.createCipheriv(
      "aes-256-gcm",
      sessionKey,
      iv
    );

    let encrypted = cipher.update(jsonPayload, "utf8");
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    // Auth Tag for GCM
    const authTag = cipher.getAuthTag();

    // Combine encrypted data + authTag
    const encryptedPayload = Buffer.concat([
      encrypted,
      authTag,
    ]).toString("base64");

    // Encrypt AES session key using RSA
    const encryptedSessionKey = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      sessionKey
    ).toString("base64");

    // Final response
    return {
      encryptedSessionKey,
      encryptedPayload,
      iv: iv.toString("base64"),
      keyVersion: "1.0",
    };
  } catch (error) {
    console.error("Encryption Error:", error.message);
    throw error;
  }
}

module.exports = encryptPayload;

