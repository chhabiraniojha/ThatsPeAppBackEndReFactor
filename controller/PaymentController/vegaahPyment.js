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
      amount: amount,
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
      userId: userId,
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
    return res.status(200).json({ linkurl, paymentId: payRequestResponse?.data?.transactionId });
  } catch (error) {}
};

exports.vegaahCallback = async (req, res) => {
  try {
    // 1️⃣ Read callback payload

    const data = req.method === 'POST' ? req.body : req.query;
    console.log('---------------- >   Vegaah Callback Received: -------------> ', data);
    const { result, vpaId, amount, userData, orderId, event, transactionId, responseCode, rrn, merchantName } = data || {};

    const paymentRecord = await Payment.findOne({
      where: { gatewayTransactionId: transactionId }
    });
    console.log('PAYMENT RECORD FOUND:', paymentRecord);
    if (!paymentRecord) {
      console.log('Payment record not found for transactionId:', transactionId);
      return res.status(200).send('PAYMENT RECORD NOT FOUND');
    }
    const paymentId = paymentRecord.id;
    const paymentStatus = paymentRecord.status;
    const paymentOrderId = paymentRecord.orderId;
    const paymentAmount = paymentRecord.amount;
    const responseCodeRecord = paymentRecord.responseCode;

    //check the paymet record status is already success or not to handle multiple callback

    if ((paymentStatus === 'SUCCESS' || paymentStatus === 'FAILED') && responseCodeRecord === '000') {
      console.log('Payment already processed:', paymentId);
      return res.status(200).json({ message: 'PAYMENT ALREADY PROCESSED' });
    }

    //check both order id  is same
    if (paymentOrderId !== orderId) {
      console.error('Order ID mismatch for paymentId:', paymentId);
      return res.status(200).json('ORDER ID MISMATCH');
    }

    //find the order using orderId
    const orderRecord = await Order.findOne({
      where: { id: orderId }
    });
    const orderStatus = orderRecord?.status;
    const orderAmount = orderRecord?.amount;
    const orderUserId = orderRecord?.userId;
    const orderServiceRef = orderRecord?.serviceRef;
    const orderOperator = orderRecord?.operator;
    const orderCircle = orderRecord?.circle;
    const orderServiceType = orderRecord?.serviceType;
    const orderOperatorType = orderRecord?.operatorType;

    // if ((paymentStatus === 'SUCCESS'||paymentStatus === 'FAILED') && responseCodeRecord === '000'&& orderStatus==='CREATED') {}

    console.log('ORDER RECORD FOUND:', orderRecord);
    if (!orderRecord) {
      console.error('Order record not found for orderId:', orderId);
      return res.status(200).json('ORDER RECORD NOT FOUND');
    }
    //now  check the  anout and response code  and  other details like event result and  payment table status  then update the payment table
    if (
      // paymentAmount == amount &&
      responseCode === '000' &&
      event === 'Transaction.Success' &&
      result === 'SUCCESS' &&
      orderStatus === 'CREATED'
    ) {
      //update payment table status to success
      await paymentRecord.update(
        {
          status: 'SUCCESS',
          rrn: rrn,
          rawCallback: data,
          responseCode: responseCode,
          useId: orderUserId,
        },
        { where: { gatewayTransactionId: transactionId } }
      );

      await paymentRecord.save();

      await orderRecord.update(
        {
          status: 'PROCESSING'
        },
        { where: { id: orderId } }
      );

      await orderRecord.save();
    }

    // now  we move recharge  if payment success and then update the order table status

    if (responseCode === '000' && event === 'Transaction.Success' &&result === 'SUCCESS' &&paymentRecord.status === 'SUCCESS' && orderRecord.status === 'PROCESSING'  ) {
      // recharge logic here
      //update order table status to success after recharge
      //generate  random number from 1 to 3 to simulate recharge success or failure
      // lets rady the data for recharge
      let apiDataForRecharge = {
        ezytm_circle_code: orderCircle,
        ezytm_operator_code: orderOperator,
        customer_number: orderServiceRef,
        amount: orderAmount,
        paymentTransactionId: transactionId,
        subCategoryId: orderServiceType,
        transactionType: 'cash',
        status: 'pending',
        rechargeType: orderOperatorType,
        discountedAmount: paymentAmount,
        userId: orderUserId,
        finalAmount: paymentAmount
      };
      console.log('API DATA FOR RECHARGE:--->', apiDataForRecharge);

      const rechargeResponse = await axios.post(`${process.env.SERVER_BASEUSRL}/user/recharge-and-billpayments`, apiDataForRecharge);

      const rechargeResult = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3
      console.log('recharge response-----------xxx', rechargeResponse);
      await orderRecord.update(
        {
          status: rechargeResponse?.data?.statuscode == 1 ? 'SUCCESS' : rechargeResponse?.data?.statuscode == 0 ? 'FAILED' : 'PENDING'
        },
        { where: { id: orderId } }
      );

      await orderRecord.save();

      return res.status(200).json({ message: 'recharge succes  :)', status: 'true' });
      // TODO:
      // 1. Check if transaction already processed
      // 2. Mark transaction SUCCESS in DB
      // 3. Perform recharge / business logic
    } else {
      // ❌ PAYMENT FAILED
      // TODO:
      // 1. Mark transaction FAILED in DB
      return res.status(200).json({ message: 'Payment Failed', status: 'success' });
    }

    // 6️⃣ Respond OK (VERY IMPORTANT)
    // return res.status(200).send('OK');
  } catch (error) {
    console.error('Callback Error:', error);
    return res.status(500).json({ message: 'Internal Server Error', success: false, statuscode: 0, error: error });
  }
};

exports.paymentStatusCheck = async (req, res) => {
  const { paymentId } = req.body;

  try {
    const userId = req.user.id;

    const paymentRecord = await Payment.findOne({
      where: {
        gatewayTransactionId: paymentId
        // userId // 🔐 IMPORTANT: prevents others from checking
      }
    });

    if (!paymentRecord) {
      return res.status(200).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // ✅ SUCCESS
    if (paymentRecord.status === 'SUCCESS') {
      return res.status(200).json({
        message: 'Payment Successful',
        success: true,
        statuscode: 1
      });
    }

    // ❌ FAILED
    if (paymentRecord.status === 'FAILED') {
      return res.status(200).json({
        message: 'Payment failed',
        success: false,
        statuscode: 0
      });
    }
    if (paymentRecord.status === 'INITIATED') {
      return res.status(200).json({
        message: 'Payment is still pending',
        success: false,
        statuscode: 0
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

exports.orderStatusCheck = async (req, res) => {
  const { paymentId } = req.body;
  try {
    const user = req.user;
    const userId = user.id;
    const paymentRecord = await Payment.findOne({
      where: {
        gatewayTransactionId: paymentId
        // userId // 🔐 IMPORTANT: prevents others from checking
      }
    });
    if (!paymentRecord) {
      return res.status(404).json({ message: 'Payment not found', success: false });
    }
    if (paymentRecord.status === 'SUCCESS') {
      const orderRecord = await Order.findOne({
        where: { id: paymentRecord.orderId, userId }
      });
      if (orderRecord.status === 'PROCESSING') {
        return res.status(200).json({ message: 'Order is PROCESSING', success: false });
      }
      if (orderRecord.status === 'SUCCESS') {
        return res.status(200).json({ message: 'Order Successful', success: true, statuscode: 1 });
      }
      if (orderRecord.status === 'PENDING') {
        return res.status(200).json({ message: 'Order Pending', success: false, statuscode: 2 });
      }
      if (orderRecord.status === 'FAILED') {
        return res.status(200).json({ message: 'Order Failed', success: false, statuscode: 0 });
      }
    }
  } catch (error) {
    return res.status(500).json({ error, message: 'Internal Server Error' });
  }
};
