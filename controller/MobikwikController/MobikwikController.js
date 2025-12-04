const axios = require("axios");
const { json } = require("body-parser");
const { log } = require("console");
const crypto = require("crypto");
const uidgenerate = require("./../../util/uidGenerator");
// === CONFIG ===
const HOST = "https://alpha3.mobikwik.com"; // UAT host
const UID = "testalpha1@gmail.com"; // UAT user
const PASSWORD = "testalpha1@123"; // UAT password
const SECRET_KEY = "abcd@123"; // For checksum (Validation API only)

// ✅ Helper: Generate checksum for Validation API
function generateChecksum(payload) {
  // const data = JSON.stringify(payload);
  // const raw = `${payload.uid}${payload.password}${payload.amt}${payload.cir}${payload.cn}${payload.op}`;
  const raw = `{"uid":"${payload.uid}","password":"${payload.password}","amt":"${payload.amt}","cir":"${payload.cir}","cn":"${payload.cn}","op":"${payload.op}","adParams":{}}`;
  console.log("Raw checksum string:", raw);

  return crypto.createHmac("sha256", SECRET_KEY).update(raw).digest("base64");
}

// ✅ Helper: Save raw logs (for UAT submission)
// (In UAT you can just console.log, in production save to DB)
function logRequestResponse(apiName, request, response) {
  console.log("==== " + apiName + " ====");
  console.log("Request:", JSON.stringify(request));
  // console.log(  response.data || response);
  console.log(JSON.stringify(response.data, null, 2));
}

// ======================= CONTROLLERS =======================

// 1. Plan Fetch API
exports.getPlans = async (req, res) => {
  try {
    const { op, cir, planType } = req.query;
    let url = `${HOST}/recharge/v1/rechargePlansAPI/${op}/${cir}`;
    if (planType) url += `/${planType}`;

    const response = await axios.get(url, {
      headers: { "Content-Type": "application/json", "X-MClient": "14" },
    });
console.log(url);

    // logRequestResponse("Plan Fetch", url, response);

    return res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Validation API
exports.validateRecharge = async (req, res) => {
  try {
    const { amt, cir, cn, op } = req.body;

    const payload = {
      uid: UID,
      password: PASSWORD,
      amt,
      cir,
      cn,
      op,
      adParams: {},
    };

    const checksum = generateChecksum(payload);
    console.log("Generated checksum:", checksum);

    const response = await axios.post(
      `${HOST}/recharge/v1/retailerValidation`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "X-MClient": "14",
          checksum,
        },
      }
    );

    // logRequestResponse("Validation", payload, response);
    return res.json(response.data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// 3. View Bill API
exports.viewBill = async (req, res) => {
  try {
    console.log("0------------------");

    const { cn, op, cir } = req.body;

    const payload = {
      uid: UID,
      pswd: PASSWORD,
      cn,
      op,
      cir,
      adParams: {},
    };
    console.log("0------------------x");

    const response = await axios.post(
      `${HOST}/retailer/v2/retailerViewbill`,
      payload,
      { headers: { "Content-Type": "application/json", "X-MClient": "14" } }
    );
    console.log("0------------------xx");

    // logRequestResponse("View Bill", payload, response);
    res.json(response.data);
  } catch (err) {
    console.log("0------------------xxx");
    res.status(500).json({ error: err.message });
  }
};

// 4. Payment / Recharge API
exports.makePayment = async (req, res) => {
  try {
    let { cn, op, cir, amt, pvalue } = req.body;
    const reqid = await uidgenerate();
    console.log("make payment recharge do  api -->");
    if (pvalue == undefined) {
      pvalue = "";
    }

    const url = `${HOST}/recharge.do?uid=${UID}&pwd=${PASSWORD}&cn=${cn}&op=${op}&cir=${cir}&amt=${amt}&reqid=${reqid}>&pvalue=${pvalue}`;

    console.log("Payment", url);
    console.log("reqId", reqid);
    const response = await axios.get(url);

    // logRequestResponse("Payment", url, response);
    return res.send(response.data); // NOTE: XML response
  } catch (err) {
    return res.status(500).json({ error: err });
  }
};

// 5. Status Check API
exports.checkStatus = async (req, res) => {
  const { txId } = req.query;
  try {
    
    // console.log("status check do api -->");
    const url = `${HOST}/rechargeStatus.do?uid=${UID}&pwd=${PASSWORD}&txId=${txId}`;
    console.log("Status Check", url);
    const response = await axios.get(url);
    // console.log(url);
    // console.log(response);

    // logRequestResponse("Status Check", url, response);
    return res.send(response.data); // NOTE: XML response
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 6. Balance Check API for Retailer (optional but useful)
exports.checkBalance = async (req, res) => {
  try {
    const payload = {
      uid: UID,
      password: PASSWORD,
      memberId: UID,
    };

    const response = await axios.post(
      `${HOST}/recharge/v1/retailerBalance`,
      payload,
      { headers: { "Content-Type": "application/json" } }
    );

    // logRequestResponse("Balance Check", payload, response);
    return res.json(response.data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
