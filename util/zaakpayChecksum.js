const crypto = require("crypto");

const secretkey = process.env.ZAAKPAY_SECRET_KEY;

exports.getChecksumString = function (data) {

    let checksumstring = "";

    const checksumsequence = [
        "amount",
        "bankid",
        "buyerAddress",
        "buyerCity",
        "buyerCountry",
        "buyerEmail",
        "couAiId",
        "couRefId",
        "buyerFirstName",
        "buyerLastName",
        "buyerPhoneNumber",
        "buyerPincode",
        "buyerState",
        "currency",
        "debitorcredit",
        "merchantIdentifier",
        "merchantIpAddress",
        "mode",
        "orderId",
        "product1Description",
        "product2Description",
        "product3Description",
        "product4Description",
        "productDescription",
        "productInfo",
        "purpose",
        "returnUrl",
        "shipToAddress",
        "shipToCity",
        "shipToCountry",
        "shipToFirstname",
        "shipToLastname",
        "shipToPhoneNumber",
        "shipToPincode",
        "shipToState",
        "showMobile",
        "txnDate",
        "txnType",
        "zpPayOption"
    ];

    for (const seq of checksumsequence) {

        if (
            Object.prototype.hasOwnProperty.call(
                data,
                seq
            )
        ) {

            const value = data[seq];

            if (
                value !== undefined &&
                value !== null &&
                String(value) !== ""
            ) {
                checksumstring +=
                    `${seq}=${String(value)}&`;
            }
        }
    }

    return checksumstring;
};


exports.getResponseChecksumString = function (data) {

    let checksumstring = "";

    const checksumsequence = [
        "amount",
        "bank",
        "bankid",
        "cardId",
        "cardScheme",
        "cardToken",
        "cardhashid",
        "doRedirect",
        "orderId",
        "paymentMethod",
        "paymentMode",
        "responseCode",
        "responseDescription",
        "productDescription",
        "product1Description",
        "product2Description",
        "product3Description",
        "product4Description",
        "pgTransId",
        "pgTransTime"
    ];

    for (const seq of checksumsequence) {

        if (
            Object.prototype.hasOwnProperty.call(
                data,
                seq
            )
        ) {

            const value = data[seq];

            if (
                value !== undefined &&
                value !== null
            ) {
                checksumstring +=
                    `${seq}=${String(value)}&`;
            }
        }
    }

    return checksumstring;
};


exports.calculateChecksum = function (checksumstring) {

    if (!secretkey) {
        throw new Error(
            "ZAAKPAY_SECRET_KEY is not configured"
        );
    }

    const hmac = crypto.createHmac(
        "sha256",
        secretkey
    );

    hmac.update(checksumstring);

    return hmac.digest("hex");
};
exports.validateZaakpayWebhookChecksum = function (txnData,receivedChecksum) {

  const secretKey =
    process.env.ZAAKPAY_SECRET_KEY;

  const calculatedChecksum =
    crypto
      .createHmac("sha256", secretKey)
      .update(txnData, "utf8")
      .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(calculatedChecksum, "utf8"),
    Buffer.from(
      String(receivedChecksum),
      "utf8"
    )
  );
};
