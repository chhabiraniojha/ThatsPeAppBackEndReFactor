const { default: axios } = require('axios');
const crypto = require('crypto');
const Order = require('../../models/OrderModel/order');
const Payment = require('../../models/PaymentModel/payment');
const requestIp = require('request-ip');
const UIDGenerator = require('../../util/uidGenerator');
const operatorModel = require('../../models/OperatorDataModel/operatorData');

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
exports.payRequest = async (req, res) => {
  const {
    ezytm_circle_code,
    ezytm_operator_code,
    customer_number,
    amount,
    subCategoryId,
    transactionType,
    status,
    rechargeType,
    discountedAmount,
    purpose
  } = req.body;
  try {
    const clientIp = requestIp.getClientIp(req);
    const user = req.user;
    const userId = user.id;
    const paymentTransactionId = await UIDGenerator();
    const paymentInitiateLogId = await UIDGenerator();
    const { transactionFor } = req.body;
    let finalAmount;
    if (!((purpose && purpose == 'recharge') || purpose == 'addfund')) {
      return res.status(200).json({
        success: false,
        statusCode: 0,
        message: 'Missing Purpose '
      });
    }
    if (purpose == 'recharge' && !(amount && customer_number && subCategoryId && userId && status)) {
      return res.status(200).json({
        success: false,
        statusCode: 0,
        message: 'Missing Recharge Details '
      });
    }
    if (purpose == 'addfund' && !(amount && paymentTransactionId && userId)) {
      return res.status(200).json({
        success: false,
        statusCode: 0,
        message: 'Missing Walet Recharge Details '
      });
    }
    // Prepare the data for required in order table create --
    if (purpose == 'recharge') {
      const operatorData = await operatorModel.findOne({
        where: { ezytm_operator_code: ezytm_operator_code }
      });

      const discountAmount = operatorData.discount;
      const discountType = operatorData.discount_type;
      // const deductAmount=(amount*discountAmount)/100
      
      if (discountType == 'percentage') {
        finalAmount = amount - (amount * discountAmount) / 100;
      } else {
        finalAmount = amount - discountAmount;
      }
      finalAmount = Math.ceil(finalAmount * 10) / 10;
      console.log('FINAL AMOUNT AFTER DISCOUNT:--->', finalAmount);
      if (discountedAmount != finalAmount) {
        return res.status(200).json({
          success: false,
          statusCode: 0,
          message: 'Discounted  amount is not perfect '
        });
      }
     
      //math.cell use for all api to round the amont

      // callbackData = {
      //   ezytm_circle_code,
      //   ezytm_operator_code,
      //   customer_number,
      //   amount,
      //   subCategoryId,
      //   transactionType,
      //   status,
      //   rechargeType,
      //   discountedAmount,
      //   finalAmount,
      //   purpose,
      //   userId
      // };
    }

    //creae order table entry for recharge purpose
    const orderId = await UIDGenerator();
    console.log(
      'GENERATED ORDER ID:',
      orderId,
      userId,
      subCategoryId,
      customer_number,
      amount,
      rechargeType,
      ezytm_operator_code,
      ezytm_circle_code
    );

    const orderData = await Order.create({
      id: orderId,
      userId: userId,
      serviceType: subCategoryId,
      serviceRef: customer_number,
      operatorType: rechargeType,
      operator: ezytm_operator_code,
      circle: ezytm_circle_code,
      amount: 50,
      status: 'CREATED'
    });

    console.log('ORDER DATA CREATED:', orderData);

    // let trackid = Math.floor(Math.random() * 1000000 + 1);
    const payload = {
      trackId: orderId,
      terminalId: process.env.VEGAH_TERMINAL_ID,
      password: process.env.VEGAH_PASSWORD,
      amount: '01.00',
      currency: 'INR'
    };
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
    payRequestRequiredData = {
      order: {
        orderId: orderId
      },
      terminalId: process.env.VEGAH_TERMINAL_ID,
      password: process.env.VEGAH_PASSWORD,
      signature: signature,
      amount: '01.00',
      currency: 'INR',
      paymentType: '1',
      customer: {
        customerEmail: 'sudhanshuojha7234@gmail.com',
        billingAddressCountry: 'IN'
      }
    };
    //api call to vegaah pay request
    const payRequestResponse = await axios.post(
      'https://checkout.vegaah.com/vegaahpayments/v2/payments/pay-request',
      payRequestRequiredData
    );
    console.log('PAY REQUEST RESPONSE:--->', payRequestResponse.data);
    // initiate payment table entry
    const paymentId = await UIDGenerator();
    const paymentData = await Payment.create({
      id: paymentId,
      orderId: orderId,
      gateway: 'VEGAH',
      paymentMode: 'UPI',
      gatewayTransactionId: payRequestResponse?.data?.transactionId,
      amount: finalAmount,
      status: 'INITIATED',
      responseCode: payRequestResponse?.data?.responseCode,
      rawCallback: payRequestResponse.data
    });
    console.log('PAYMENT DATA CREATED:', paymentData);

    let linkurl = payRequestResponse?.data?.paymentLink?.linkUrl + payRequestResponse?.data?.transactionId;
    return res.status(200).json({ linkurl });
  } catch (error) {}
};

exports.vegaahCallback = async (req, res) => {
  try {
    // 1️⃣ Read callback payload

    const data = req.method === 'POST' ? req.body : req.query;
    console.log('Vegaah Callback Received:', data?.amount);
    const { paymentId, responseCode, amount, signature } = data || {};
    return res.status(200).send('recharge succes  calback check :)');
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

exports.paymentStausCheck = async (req, res) => {
  try {
    return res.status(200).json({ message: 'Payment Status Check Endpoint', success: true });
  } catch (error) {
    return res.status(500).json({ error, message: 'Internal Server Error' });
  }
};
