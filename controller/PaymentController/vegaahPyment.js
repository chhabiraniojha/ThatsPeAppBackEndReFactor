const crypto = require('crypto');

exports.generateSignature = async (req, res) => {
  try {
    const { payload } = req.body;
    const secretKey = process.env.VEGAH_SECRET_KEY;
    // const payloadString = JSON.stringify(payload);

    const dataToHash =
      payload.trackId + '|' + payload.terminalId + '|' + payload.password + '|' + secretKey + '|' + payload.amount + '|' + payload.currency;

    console.log('STRING TO HASH:--->', dataToHash);
    if (!payload) {
      return res.status(400).json({
        message: 'Payload is required'
      });
    }
    if (!secretKey) {
      return res.status(500).json({
        message: 'Secret key not configured'
      });
    }
    const signature = crypto.createHash('sha256').update(dataToHash).digest('hex');
    return res.status(200).json({ signature });
  } catch (error) {
    console.log('ERROR GENERATING SIGNATURE:', error);
    return res.status(500).json({ error, message: 'Internal Server Error' });
  }
};

exports.vegaahCallback = async (req, res) => {
  try {
    // 1️⃣ Read callback payload
  
    const data = req.method === 'POST' ? req.body : req.query;
    console.log('Vegaah Callback Received:', data);
    const { paymentId, responseCode, amount, signature } = data || {};

    // 2️⃣ Validate required fields
    if (!paymentId || !responseCode || !amount || !signature) {
      return res.status(400).send('INVALID CALLBACK DATA');
    }

    // 3️⃣ Generate expected signature
    const merchantKey = process.env.VEGAH_SECRET_KEY.trim();

    const stringToHash = paymentId + '|' + merchantKey + '|' + responseCode + '|' + amount;

    const expectedSignature = crypto.createHash('sha256').update(stringToHash).digest('hex');

    // 4️⃣ Verify signature
    if (expectedSignature !== signature) {
      console.error('Invalid Vegaah callback signature');
      return res.status(400).send('INVALID SIGNATURE');
    }

    // 5️⃣ Process payment result
    if (responseCode === '001') {
      // ✅ PAYMENT SUCCESS
      console.log('Payment SUCCESS:', paymentId);

      // TODO:
      // 1. Check if transaction already processed
      // 2. Mark transaction SUCCESS in DB
      // 3. Perform recharge / business logic
    } else {
      // ❌ PAYMENT FAILED
      console.log('Payment FAILED:', paymentId);

      // TODO:
      // 1. Mark transaction FAILED in DB
    }

    // 6️⃣ Respond OK (VERY IMPORTANT)
    return res.status(200).send('OK');
  } catch (error) {
    console.error('Callback Error:', error);
    return res.status(500).send('SERVER ERROR');
  }
};
