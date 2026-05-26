const { default: axios } = require('axios');
const sequelize = require('../../util/db_connect');
const crypto = require('crypto');
const Order = require('../../models/OrderModel/order');
const Payment = require('../../models/PaymentModel/payment');
const requestIp = require('request-ip');
const UIDGenerator = require('../../util/uidGenerator');
const operatorModel = require('../../models/OperatorDataModel/operatorData');
const walletOrderModel = require('../../models/OrderModel/walletOrder');
const walletModel = require('../../models/WalletModels/WalletSchema/wallet');
const walletController = require('../../controller/WalletController/wallet');
const successHTML = require('../../templates/paymentSuccess');
const failureHTML = require('../../templates/paymentFailed');
const pendingHTML = require('../../templates/paymentPending');

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
    status,
    rechargeType,
    discountedAmount,
    purpose
  } = req.body;
  // console.log(req.body);
  const t = await sequelize.transaction();
  try {
    const clientIp = requestIp.getClientIp(req);
    const user = req.user;
    const userId = user.id;
    let finalAmount;
    if (!((purpose && purpose == 'recharge') || purpose == 'addfund')) {
      return res.status(200).json({
        success: false,
        statusCode: 0,
        message: 'Missing Purpose '
      });
    }
    if (purpose == 'recharge' && (!amount || !customer_number || !subCategoryId || !userId || !ezytm_operator_code)) {
      return res.status(200).json({
        success: false,
        statusCode: 0,
        message: 'Missing Recharge Details '
      });
    }

    if (purpose == 'addfund' && (!amount || !userId)) {
      return res.status(200).json({
        success: false,
        statusCode: 0,
        message: 'Missing Walet Recharge Details '
      });
    }

    if (amount < 0 || amount == 0 || discountedAmount < 0 || discountedAmount == 0) {
      return res.status(200).json({
        success: false,
        statusCode: 0,
        message: 'Amount or Discounted Amount is not valid'
      });
    }
    // Prepare the data for required in order table create --
    if (purpose == 'recharge') {
      const operatorData = await operatorModel.findOne({
        where: { ezytm_operator_code: ezytm_operator_code }
      });

      if (!operatorData) {
        return res.status(200).json({
          success: false,
          statusCode: 0,
          message: 'Operator not found '
        });
      }

      const discountAmount = operatorData.discount;
      const discountType = operatorData.discount_type;
      // const deductAmount=(amount*discountAmount)/100

      if (discountType == 'percentage') {
        finalAmount = amount - (amount * discountAmount) / 100;
      } else {
        finalAmount = amount - discountAmount;
      }
      finalAmount = Math.ceil(finalAmount * 10) / 10;
      // console.log('FINAL AMOUNT AFTER DISCOUNT:--->', finalAmount);
      if (discountedAmount != finalAmount) {
        return res.status(200).json({
          success: false,
          statusCode: 0,
          message: 'Discounted  amount is not perfect '
        });
      }

      //math.cell use for all api to round the amont
    }

    //creae order table entry for recharge purpose
    const orderId = await UIDGenerator();
    const walletOrderId = await UIDGenerator();

    // console.log(
    //   'GENERATED ORDER ID:',
    //   orderId,
    //   userId,
    //   subCategoryId,
    //   customer_number,
    //   amount,
    //   rechargeType,
    //   ezytm_operator_code,
    //   ezytm_circle_code
    // );

    // order initiate
    let orderData;
    if (purpose == 'recharge') {
      orderData = await Order.create(
        {
          id: orderId,
          userId: userId,
          serviceType: subCategoryId,
          serviceRef: customer_number,
          operatorType: rechargeType,
          operator: ezytm_operator_code,
          circle: ezytm_circle_code,
          amount: amount,
          status: 'CREATED'
        },
        { transaction: t }
      );
    } else if (purpose == 'addfund') {
      const wallet = await walletModel.findOne({ where: { userId: userId } });
      if (!wallet) {
        return res.status(200).json({ message: 'No wallet found for user', success: false, statuscode: 0 });
      }
      // console.log('WALLET FOUND FOR USER:', wallet?.dataValues?.id);
      orderData = await walletOrderModel.create(
        {
          id: walletOrderId,
          userId: userId,
          walletId: wallet?.dataValues?.id,
          amount: amount,
          walletAction: 'ADD',
          status: 'CREATED'
        },
        { transaction: t }
      );
    }

    // console.log('ORDER DATA CREATED:', orderData);

    // payload for generate signature
    const payload = {
      trackId: purpose == 'recharge' ? orderId : walletOrderId,
      terminalId: process.env.VEGAH_TERMINAL_ID,
      password: process.env.VEGAH_PASSWORD,
      amount: purpose == 'recharge' ? finalAmount : amount, // it  will be change later
      currency: 'INR'
    };
    const secretKey = process.env.VEGAH_SECRET_KEY;
    // const payloadString = JSON.stringify(payload);

    const dataToHash =
      payload.trackId + '|' + payload.terminalId + '|' + payload.password + '|' + secretKey + '|' + payload.amount + '|' + payload.currency;

    // console.log('STRING TO HASH:--->', dataToHash);
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
        orderId: purpose == 'recharge' ? orderId : walletOrderId
      },
      terminalId: process.env.VEGAH_TERMINAL_ID,
      password: process.env.VEGAH_PASSWORD,
      signature: signature,
      amount: purpose == 'recharge' ? finalAmount : amount,
      currency: 'INR',
      paymentType: '1',
      customer: {
        customerEmail: user.email, // it  will be change later
        billingAddressCountry: 'IN'
      }
    };
    //api call to vegaah pay request
    const payRequestResponse = await axios.post(
      'https://checkout.vegaah.com/vegaahpayments/v2/payments/pay-request',
      payRequestRequiredData
    );
    // console.log('PAY REQUEST RESPONSE:--->', payRequestResponse.data);
    // --------------------------- initiate payment table entry  --------------------
    const paymentId = await UIDGenerator();
    let paymentData;
    if (purpose == 'recharge') {
      paymentData = await Payment.create(
        {
          id: paymentId,
          orderId: orderId,
          userId: userId,
          gateway: 'VEGAH',
          paymentMode: 'UPI',
          gatewayTransactionId: payRequestResponse?.data?.transactionId,
          amount: finalAmount,
          status: 'INITIATED',
          purpose: purpose,
          responseCode: payRequestResponse?.data?.responseCode,
          rawCallback: payRequestResponse.data
        },
        { transaction: t }
      );
    } else if (purpose == 'addfund') {
      paymentData = await Payment.create(
        {
          id: paymentId,
          walletOrderId: walletOrderId,
          userId: userId,
          gateway: 'VEGAH',
          paymentMode: 'UPI',
          gatewayTransactionId: payRequestResponse?.data?.transactionId,
          amount: amount,
          status: 'INITIATED',
          purpose: purpose,
          responseCode: payRequestResponse?.data?.responseCode,
          rawCallback: payRequestResponse.data
        },
        { transaction: t }
      );
    }
    await t.commit();
    // console.log('PAYMENT DATA CREATED:', paymentData);

    let linkurl = payRequestResponse?.data?.paymentLink?.linkUrl + payRequestResponse?.data?.transactionId;
    console.log(linkurl)
    return res.status(200).json({ linkurl, paymentId: payRequestResponse?.data?.transactionId });
  } catch (error) {
    await t.rollback();
    console.error(error);
    return res.status(500).json({ success: false, message: 'Payment initiation failed' });
  }
};

// exports.vegaahCallback = async (req, res) => {
//   try {
//     // 1️⃣ Read callback payload
//     console.log("request query from  veghaa --->",req.query)

//     const data = req.method === 'POST' ? req.body : req.query;
//     // console.log('---------------- >   Vegaah Callback Received: -------------> ', data);
//     const { result, vpaId, amount, userData, orderId, event, transactionId, responseCode, rrn, merchantName } = data || {};
//     if(event!=='Transaction.Success'||responseCode!=='000'||result!=='SUCCESS'){
//       return res.status(200).json({ message: 'Payment Failed', status: 'success' });
//     }

//     const paymentRecord = await Payment.findOne({
//       where: { gatewayTransactionId: transactionId }
//     });
//     // console.log('PAYMENT RECORD FOUND:', paymentRecord);
//     if (!paymentRecord) {
//       console.log('Payment record not found for transactionId:', transactionId);
//       return res.status(200).send('PAYMENT RECORD NOT FOUND');
//     }

//     let paymentId, paymentStatus, paymentOrderId, paymentAmount, responseCodeRecord, purpose;
//     purpose = paymentRecord.purpose;
//     paymentId = paymentRecord.id;
//     paymentStatus = paymentRecord.status;
//     paymentOrderId = purpose === 'addfund' ? paymentRecord.walletOrderId : paymentRecord.orderId;
//     paymentAmount = paymentRecord.amount;
//     responseCodeRecord = paymentRecord.responseCode;

//     // importnat it will uncoment later in Production *****

//     // if(paymentAmount!=amount){
//     //   // console.log('Amount mismatch for paymentId:', paymentId);
//     //    return res.status(200).json({ message: 'Payment Failed Due To Amount Mismatch', status: 'success' });
//     // }

//     //check the paymet record status is already success or not to handle multiple callback

//     if ((paymentStatus === 'SUCCESS' || paymentStatus === 'FAILED') && responseCodeRecord === '000') {
//       console.log('Payment already processed:', paymentId);
//       return res.status(200).json({ message: 'PAYMENT ALREADY PROCESSED' });
//     }

//     //check both order id  is same
//     if (paymentOrderId !== orderId) {
//       console.log('Order ID mismatch for paymentId:', paymentId);
//       return res.status(200).json('ORDER ID MISMATCH');
//     }

//     //find the  order using orderId  for specific order type recharge or wallet addfund
//     let orderRecord, walletOrderRecord;

//     if (purpose == 'addfund') {
//       walletOrderRecord = await walletOrderModel.findOne({
//         where: { id: orderId }
//       });
//     } else if (purpose == 'recharge') {
//       orderRecord = await Order.findOne({
//         where: { id: orderId }
//       });
//     }
//     let orderStatus, orderAmount, orderUserId, orderServiceRef, orderOperator, orderCircle, orderServiceType, orderOperatorType;

//     if (purpose == 'addfund') {
//       console.log('walletOrderRecord   FOUND:', walletOrderRecord);
//       if (!walletOrderRecord) {
//         console.error('walletOrderRecord not found for orderId:', orderId);
//         return res.status(200).json('ORDER RECORD NOT FOUND');
//       }
//       orderStatus = walletOrderRecord?.status;
//       orderAmount = walletOrderRecord?.amount;
//       orderUserId = walletOrderRecord?.userId;
//     } else if (purpose == 'recharge') {
//       console.log('ORDER RECORD FOUND:', orderRecord);
//       if (!orderRecord) {
//         console.error('Order record not found for orderId:', orderId);
//         return res.status(200).json('ORDER RECORD NOT FOUND');
//       }
//       orderStatus = orderRecord?.status;
//       orderAmount = orderRecord?.amount;
//       orderUserId = orderRecord?.userId;
//       orderServiceRef = orderRecord?.serviceRef;
//       orderOperator = orderRecord?.operator;
//       orderCircle = orderRecord?.circle;
//       orderServiceType = orderRecord?.serviceType;
//       orderOperatorType = orderRecord?.operatorType;
//     }
//     // if ((paymentStatus === 'SUCCESS'||paymentStatus === 'FAILED') && responseCodeRecord === '000'&& orderStatus==='CREATED') {}

//     //now  check the  anout and response code  and  other details like event result and  payment table status  then update the payment table
//     if (
//       // paymentAmount == amount &&
//       responseCode === '000' &&
//       event === 'Transaction.Success' &&
//       result === 'SUCCESS' &&
//       orderStatus === 'CREATED'
//     ) {
//       //update payment table status to success
//       await paymentRecord.update(
//         {
//           status: 'SUCCESS',
//           rrn: rrn,
//           rawCallback: data,
//           responseCode: responseCode,
//           userId: orderUserId
//         },
//         { where: { gatewayTransactionId: transactionId } }
//       );

//       await paymentRecord.save();

//       if (purpose == 'addfund') {
//         //update wallet order table status to success
//         await walletOrderRecord.update(
//           {
//             status: 'PROCESSING'
//           },
//           { where: { id: orderId } }
//         );

//         await walletOrderRecord.save();
//       } else if (purpose == 'recharge') {
//         await orderRecord.update(
//           {
//             status: 'PROCESSING'
//           },
//           { where: { id: orderId } }
//         );
//         await orderRecord.save();
//       }
//     }

//     // now  we move recharge  if payment success and then update the order table status

//     if (
//       responseCode === '000' &&
//       event === 'Transaction.Success' &&
//       result === 'SUCCESS' &&
//       paymentRecord.status === 'SUCCESS' &&
//       (purpose == 'recharge' ? orderRecord?.status === 'PROCESSING' : walletOrderRecord?.status === 'PROCESSING')
//     ) {
//       // recharge logic here
//       //update order table status to success after recharge
//       //generate  random number from 1 to 3 to simulate recharge success or failure
//       // lets rady the data for recharge
//       let apiDataForRecharge;

//       if (purpose == 'addfund') {
//         dataForWalletAdd = {
//           userId: orderUserId,
//           amount: orderAmount,
//           transactionId: paymentId
//         };
//       } else if (purpose == 'recharge') {
//         apiDataForRecharge = {
//           ezytm_circle_code: orderCircle,
//           ezytm_operator_code: orderOperator,
//           customer_number: orderServiceRef,
//           amount: orderAmount,
//           paymentTransactionId: paymentId,
//           subCategoryId: orderServiceType,
//           transactionType: 'cash',
//           status: 'pending',
//           rechargeType: orderOperatorType,
//           discountedAmount: paymentAmount,
//           userId: orderUserId,
//           finalAmount: paymentAmount
//         };
//       }

//       // console.log('API DATA FOR RECHARGE:--->', dataForWalletAdd);

//       //recharge api call simulation
//       if (purpose == 'recharge') {
//         const rechargeResponse = await axios.post(`${process.env.SERVER_BASEUSRL}/user/recharge-and-billpayments`, apiDataForRecharge);
//         // await new Promise((resolve) => setTimeout(resolve, 3000));
//         // let rechargeResult = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3

//         // console.log('recharge response-----------xxx', rechargeResponse);

//         // console.log('recharge response-----------xxx', rechargeResult);
//         await orderRecord.update(
//           {
//             // status: rechargeResult == 1 ? 'SUCCESS' : rechargeResult == 0 ? 'FAILED' : 'PENDING'
//             status: rechargeResponse?.data?.statuscode == 1 ? 'SUCCESS' : rechargeResponse?.data?.statuscode == 0 ? 'FAILED' : 'PENDING'
//           },
//           { where: { id: orderId } }
//         );
//         await orderRecord.save();
//       }
//       // add fund process
//       else if (purpose == 'addfund') {
//         //wallet add fund process
//         const addFundResponse = await walletController.addFund({
//           amount: dataForWalletAdd.amount,
//           paymentTransactionId: dataForWalletAdd.transactionId,
//           userId: dataForWalletAdd.userId
//         });
//         console.log('Add Fund Response:', addFundResponse);

//         await walletOrderRecord.update(
//           {
//             status: addFundResponse?.statuscode == 1 ? 'SUCCESS' : 'FAILED'
//           },
//           { where: { id: orderId } }
//         );
//         await walletOrderRecord.save();
//       }

//       return res.status(200).json({ message: 'recharge succes  :)', status: 'true' });
//       // TODO:
//       // 1. Check if transaction already processed
//       // 2. Mark transaction SUCCESS in DB
//       // 3. Perform recharge / business logic
//     } else {
//       // ❌ PAYMENT FAILED
//       // TODO:
//       // 1. Mark transaction FAILED in DB
//       return res.status(200).json({ message: 'Payment Failed', status: 'success' });
//     }

//     // 6️⃣ Respond OK (VERY IMPORTANT)
//     // return res.status(200).send('OK');
//   } catch (error) {
//     console.error('Callback Error:', error);
//     return res.status(500).json({ message: 'Internal Server Error', success: false, statuscode: 0, error: error });
//   }
// };
// previous version of vegaahReceipt m
// exports.vegaahReceipt = async (req, res) => {
//   try {
//     console.log('Query:', req.query);
//     console.log('Body:', req.body);
//     const secretKey = process.env.VEGAH_SECRET_KEY;
//     let encryptedData = decodeURIComponent(req.body.data);
//     encryptedData = encryptedData.replace('data=', '');

//     const key = Buffer.from(secretKey, 'hex'); // OR utf8 (see below)

//     const encryptedBuffer = Buffer.from(encryptedData, 'base64');

//     const decipher = crypto.createDecipheriv('aes-256-ecb', key, null);
//     decipher.setAutoPadding(true);

//     let decrypted = decipher.update(encryptedBuffer, undefined, 'utf8');
//     decrypted += decipher.final('utf8');
//     decrypted = JSON.parse(decrypted);
//     const recivedSignature = decrypted.signature;

//     console.log('DECRYPTED----:', decrypted);
//     console.log('DECRYPTED RESULT----:', decrypted?.result);
//     if (decrypted?.result === 'SUCCESS') {
//       res.send(successHTML());
//       //  return res.send(pendingHTML());
//       // return res.send(failureHTML());
//     }
//     if (decrypted?.result === 'FAILURE') {
//       res.send(failureHTML());
//     }
//     if (decrypted?.result === 'PENDING') {
//       res.send(pendingHTML());
//     }

//     // const { payload } = req.body;

//     // const payloadString = JSON.stringify(payload);
//     // ------------------------------- signature generation for receipt verification ----------------
//     const dataToHash = decrypted?.transactionId + '|' + secretKey + '|' + decrypted?.responseCode + '|' + decrypted?.amountDetails?.amount;

//     console.log('STRING TO HASH:--->', dataToHash);

//     const generatedSignature = crypto.createHash('sha256').update(dataToHash).digest('hex');

//     console.log('GENERATED SIGNATURE:--->', generatedSignature);
//     // -------------------------------------------------------------------------------------------------

//     if (recivedSignature !== generatedSignature) {
//       // return res.status(200).json({ message: 'Invalid Signature', status: 'failed' });
//       return;
//     }

//     // return res.status(200).json({ message: 'Receipt Received', data: decrypted });

//     const data = req.method === 'POST' ? req.body : req.query;
//     // console.log('---------------- >   Vegaah Callback Received: -------------> ', data);
//     const { result, customerDetails, event, transactionId, responseCode, rrn, merchantName } = decrypted || {};

//     const amount = decrypted?.amountDetails?.amount;
//     const orginalAmount = decrypted?.amountDetails?.originalAmount;
//     const orderId = decrypted?.orderDetails?.orderId;

//     if (amount != orginalAmount) {
//       // return res.status(200).json({ message: 'Payment Failed Due To Amount Mismatch', status: 'success' });
//       return;
//     }
//     if (responseCode !== '000' || result !== 'SUCCESS') {
//       // return res.status(200).json({ message: 'Payment Failed', status: 'success' });
//       return;
//     }

//     const paymentRecord = await Payment.findOne({
//       where: { gatewayTransactionId: transactionId }
//     });
//     // console.log('PAYMENT RECORD FOUND:', paymentRecord);
//     if (!paymentRecord) {
//       console.log('Payment record not found for transactionId:', transactionId);
//       // return res.status(200).json({ message: 'PAYMENT RECORD NOT FOUND', status: 'failed' });
//       return;
//     }

//     let paymentId, paymentStatus, paymentOrderId, paymentAmount, responseCodeRecord, purpose;
//     purpose = paymentRecord.purpose;
//     paymentId = paymentRecord.id;
//     paymentStatus = paymentRecord.status;
//     paymentOrderId = purpose === 'addfund' ? paymentRecord.walletOrderId : paymentRecord.orderId;
//     paymentAmount = paymentRecord.amount;
//     responseCodeRecord = paymentRecord.responseCode;

//     // importnat it will uncoment later in Production *****

//     // if(paymentAmount!=amount){
//     //   // console.log('Amount mismatch for paymentId:', paymentId);
//     //    return res.status(200).json({ message: 'Payment Failed Due To Amount Mismatch', status: 'success' });
//     // }

//     //check the paymet record status is already success or not to handle multiple callback

//     if ((paymentStatus === 'SUCCESS' || paymentStatus === 'FAILED') && responseCodeRecord === '000') {
//       console.log('Payment already processed:', paymentId);
//       // return res.status(200).json({ message: 'PAYMENT ALREADY PROCESSED' });
//       return;
//     }

//     //check both order id  is same
//     if (paymentOrderId !== orderId) {
//       console.log('Order ID mismatch for paymentId:', paymentId);
//       // return res.status(200).json('ORDER ID MISMATCH');
//       return;
//     }

//     //find the  order using orderId  for specific order type recharge or wallet addfund
//     let orderRecord, walletOrderRecord;

//     if (purpose == 'addfund') {
//       walletOrderRecord = await walletOrderModel.findOne({
//         where: { id: orderId }
//       });
//     } else if (purpose == 'recharge') {
//       orderRecord = await Order.findOne({
//         where: { id: orderId }
//       });
//     }
//     let orderStatus, orderAmount, orderUserId, orderServiceRef, orderOperator, orderCircle, orderServiceType, orderOperatorType;

//     if (purpose == 'addfund') {
//       console.log('walletOrderRecord   FOUND:', walletOrderRecord);
//       if (!walletOrderRecord) {
//         console.error('walletOrderRecord not found for orderId:', orderId);
//         // return res.status(200).json('ORDER RECORD NOT FOUND');
//         return;
//       }
//       orderStatus = walletOrderRecord?.status;
//       orderAmount = walletOrderRecord?.amount;
//       orderUserId = walletOrderRecord?.userId;
//     } else if (purpose == 'recharge') {
//       console.log('ORDER RECORD FOUND:', orderRecord);
//       if (!orderRecord) {
//         console.error('Order record not found for orderId:', orderId);
//         // return res.status(200).json('ORDER RECORD NOT FOUND');
//         return;
//       }
//       orderStatus = orderRecord?.status;
//       orderAmount = orderRecord?.amount;
//       orderUserId = orderRecord?.userId;
//       orderServiceRef = orderRecord?.serviceRef;
//       orderOperator = orderRecord?.operator;
//       orderCircle = orderRecord?.circle;
//       orderServiceType = orderRecord?.serviceType;
//       orderOperatorType = orderRecord?.operatorType;
//     }
//     // if ((paymentStatus === 'SUCCESS'||paymentStatus === 'FAILED') && responseCodeRecord === '000'&& orderStatus==='CREATED') {}

//     //now  check the  anout and response code  and  other details like event result and  payment table status  then update the payment table
//     if (
//       // paymentAmount == amount &&
//       responseCode === '000' &&
//       result === 'SUCCESS' &&
//       orderStatus === 'CREATED'
//     ) {
//       //update payment table status to success
//       await paymentRecord.update(
//         {
//           status: 'SUCCESS',
//           rrn: rrn,
//           rawCallback: data,
//           responseCode: responseCode,
//           userId: orderUserId
//         },
//         { where: { gatewayTransactionId: transactionId } }
//       );

//       await paymentRecord.save();

//       if (purpose == 'addfund') {
//         //update wallet order table status to success
//         await walletOrderRecord.update(
//           {
//             status: 'PROCESSING'
//           },
//           { where: { id: orderId } }
//         );

//         await walletOrderRecord.save();
//       } else if (purpose == 'recharge') {
//         await orderRecord.update(
//           {
//             status: 'PROCESSING'
//           },
//           { where: { id: orderId } }
//         );
//         await orderRecord.save();
//       }
//     }

//     // now  we move recharge  if payment success and then update the order table status

//     if (
//       responseCode === '000' &&
//       result === 'SUCCESS' &&
//       paymentRecord.status === 'SUCCESS' &&
//       (purpose == 'recharge' ? orderRecord?.status === 'PROCESSING' : walletOrderRecord?.status === 'PROCESSING')
//     ) {
//       // recharge logic here
//       //update order table status to success after recharge
//       //generate  random number from 1 to 3 to simulate recharge success or failure
//       // lets rady the data for recharge
//       let apiDataForRecharge;

//       if (purpose == 'addfund') {
//         dataForWalletAdd = {
//           userId: orderUserId,
//           amount: orderAmount,
//           transactionId: paymentId
//         };
//       } else if (purpose == 'recharge') {
//         apiDataForRecharge = {
//           ezytm_circle_code: orderCircle,
//           ezytm_operator_code: orderOperator,
//           customer_number: orderServiceRef,
//           amount: orderAmount,
//           paymentTransactionId: paymentId,
//           subCategoryId: orderServiceType,
//           transactionType: 'cash',
//           status: 'pending',
//           rechargeType: orderOperatorType,
//           discountedAmount: paymentAmount,
//           userId: orderUserId,
//           finalAmount: paymentAmount
//         };
//       }

//       // console.log('API DATA FOR RECHARGE:--->', dataForWalletAdd);

//       //recharge api call simulation
//       if (purpose == 'recharge') {
//         const rechargeResponse = await axios.post(`${process.env.SERVER_BASEUSRL}/user/recharge-and-billpayments`, apiDataForRecharge);
//         // await new Promise((resolve) => setTimeout(resolve, 3000));
//         // let rechargeResult = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3

//         // console.log('recharge response-----------xxx', rechargeResponse);

//         // console.log('recharge response-----------xxx', rechargeResult);
//         await orderRecord.update(
//           {
//             // status: rechargeResult == 1 ? 'SUCCESS' : rechargeResult == 0 ? 'FAILED' : 'PENDING'
//             status: rechargeResponse?.data?.statuscode == 1 ? 'SUCCESS' : rechargeResponse?.data?.statuscode == 0 ? 'FAILED' : 'PENDING'
//           },
//           { where: { id: orderId } }
//         );
//         await orderRecord.save();
//       }
//       // add fund process
//       else if (purpose == 'addfund') {
//         //wallet add fund process
//         const addFundResponse = await walletController.addFund({
//           amount: dataForWalletAdd.amount,
//           paymentTransactionId: dataForWalletAdd.transactionId,
//           userId: dataForWalletAdd.userId
//         });
//         console.log('Add Fund Response:', addFundResponse);

//         await walletOrderRecord.update(
//           {
//             status: addFundResponse?.statuscode == 1 ? 'SUCCESS' : 'FAILED'
//           },
//           { where: { id: orderId } }
//         );
//         await walletOrderRecord.save();
//       }

//       // return res.status(200).json({ message: 'recharge succes  :)', status: 'true' });
//       return;
//       // TODO:
//       // 1. Check if transaction already processed
//       // 2. Mark transaction SUCCESS in DB
//       // 3. Perform recharge / business logic
//     } else {
//       // ❌ PAYMENT FAILED
//       // TODO:
//       // 1. Mark transaction FAILED in DB
//       // return res.status(200).json({ message: 'Payment Failed', status: 'success' });
//       return;
//     }

//     // 6️⃣ Respond OK (VERY IMPORTANT)
//     // return res.status(200).send('OK');
//   } catch (error) {
//     console.error('Callback Error:', error);
//     return res.status(500).json({ message: 'Internal Server Error', success: false, statuscode: 0, error: error });
//   }
// };

exports.vegaahReceipt = async (req, res) => {
  try {
    /* --------------------------------------------------
       1. READ & DECRYPT CALLBACK
    -------------------------------------------------- */
    const secretKey = process.env.VEGAH_SECRET_KEY;

    if (!req.body?.data) {
      return res.status(400).send('INVALID');
    }
    // console.log('Vegaah Receipt Payload:', req.body);

    let encryptedData = decodeURIComponent(req.body.data).replace('data=', '');
    const key = Buffer.from(secretKey, 'hex');
    const encryptedBuffer = Buffer.from(encryptedData, 'base64');

    const decipher = crypto.createDecipheriv('aes-256-ecb', key, null);
    decipher.setAutoPadding(true);

    let decrypted = decipher.update(encryptedBuffer, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    decrypted = JSON.parse(decrypted);
    // console.log('Decrypted Receipt Data:', decrypted);

    const { transactionId, responseCode, result, rrn, signature, amountDetails, orderDetails } = decrypted;

    /* --------------------------------------------------
       2. VERIFY SIGNATURE (FIRST GATE)
    -------------------------------------------------- */
    const dataToHash = transactionId + '|' + secretKey + '|' + responseCode + '|' + amountDetails?.amount;

    const generatedSignature = crypto.createHash('sha256').update(dataToHash).digest('hex');

    if (signature !== generatedSignature) {
      // console.error('Invalid signature:', transactionId);
      return res.status(200).send('INVALID');
    }

    /* --------------------------------------------------
       3. BASIC VALIDATIONS
    -------------------------------------------------- */
    if (amountDetails?.amount !== amountDetails?.originalAmount) {
      // console.error('Amount mismatch:', transactionId);
      return res.status(200).send('INVALID');
    }

    if (responseCode !== '000' || result !== 'SUCCESS') {
      // Mark FAILED safely (idempotent)
      await Payment.update(
        {
          status: 'FAILED',
          responseCode,
          rawCallback: { transactionId, responseCode, result }
        },
        {
          where: {
            gatewayTransactionId: transactionId,
            status: 'INITIATED'
          }
        }
      );

      return res.send(failureHTML());
    }

    /*--------------------------------------------------
       4)check payment record exists and compaire the fetchd db amount with vegaah callback amount
    --------------------------------------------------*/

    const existingPayment = await Payment.findOne({
      where: { gatewayTransactionId: transactionId }
    });

    if (!existingPayment) {
      // console.error('Payment not found:', transactionId);
      return res.send(successHTML());
    }

    if (existingPayment.amount !== amountDetails?.amount) {
      // console.error('Amount mismatch:', transactionId, existingPayment.amount, amountDetails?.amount);
      return res.send(successHTML());
    }

    /* --------------------------------------------------
       4. ATOMIC PAYMENT UPDATE (IDEMPOTENT)
    -------------------------------------------------- */
    const paymentUpdated = await Payment.update(
      {
        status: 'SUCCESS',
        rrn,
        responseCode,
        rawCallback: decrypted
      },
      {
        where: {
          gatewayTransactionId: transactionId,
          status: 'INITIATED'
        }
      }
    );
    // console.log('Payment update result:', paymentUpdated);

    const affectedPaymentRows = Array.isArray(paymentUpdated) ? paymentUpdated[0] : paymentUpdated;
    // console.log('Affected payment rows:', affectedPaymentRows);
    // bypassing these for testing-----
    if (affectedPaymentRows === 0) {
      return res.send(successHTML());
    }

    /* --------------------------------------------------
       5. FETCH PAYMENT (SAFE NOW)
    -------------------------------------------------- */
    const paymentRecord = await Payment.findOne({
      where: { gatewayTransactionId: transactionId }
    });

    if (!paymentRecord) {
      // console.error('Payment not found:', transactionId);
      return res.send(successHTML());
    }

    const { purpose, orderId, walletOrderId } = paymentRecord;
    const finalOrderId = purpose === 'addfund' ? walletOrderId : orderId;

    /* --------------------------------------------------
       6. ATOMIC ORDER STATUS UPDATE
    -------------------------------------------------- */
    let orderUpdated = 0;

    if (purpose === 'addfund') {
      orderUpdated = await walletOrderModel.update(
        { status: 'PROCESSING' },
        {
          where: {
            id: finalOrderId,
            status: 'CREATED'
          }
        }
      );
    } else {
      orderUpdated = await Order.update(
        { status: 'PROCESSING' },
        {
          where: {
            id: finalOrderId,
            status: 'CREATED'
          }
        }
      );
    }
    // console.log('Order update result:', orderUpdated);
    const affectedOrderRows = Array.isArray(orderUpdated) ? orderUpdated[0] : orderUpdated;
    // bypassing these for testing-----later remove it
    if (affectedOrderRows === 0) {
      // console.log('Order already moved:', finalOrderId);
      return res.send(successHTML());
    }

    // console.log('step 6.5 is reached');
    /* --------------------------------------------------
   6.5 FIRE & FORGET ASYNC WORK 🚀
-------------------------------------------------- */
    setImmediate(async () => {
      try {
        // console.log('Async processing started for:', transactionId);

        /* =========================
       ADD FUND FLOW
    ========================= */
        if (purpose === 'addfund') {
          const walletOrder = await walletOrderModel.findOne({
            where: { id: finalOrderId }
          });

          if (!walletOrder) {
            // console.error('WalletOrder not found:', finalOrderId);
            return;
          }

          // Idempotency guard
          if (walletOrder.status !== 'PROCESSING') {
            // console.log('WalletOrder already processed:', finalOrderId);
            return;
          }

          const addFundResponse = await walletController.addFund({
            userId: walletOrder.userId,
            amount: walletOrder.amount,
            paymentTransactionId: paymentRecord.id
          });

          await walletOrderModel.update(
            {
              status: addFundResponse?.statuscode === 1 ? 'SUCCESS' : 'FAILED'
            },
            {
              where: {
                id: finalOrderId,
                status: 'PROCESSING'
              }
            }
          );

          // console.log('Add fund completed:', finalOrderId);
        } else {
          /* =========================
       RECHARGE FLOW
    ========================= */
          const order = await Order.findOne({
            where: { id: finalOrderId }
          });

          if (!order) {
            // console.error('Order not found:', finalOrderId);
            return;
          }
          // bypass for testing-----
          // Idempotency guard
          if (order.status !== 'PROCESSING') {
            // console.log('Recharge already processed:', finalOrderId);
            return;
          }

          // 🔁 SAME PAYLOAD AS YOUR OLD CODE
          const apiDataForRecharge = {
            ezytm_circle_code: order.circle,
            ezytm_operator_code: order.operator,
            customer_number: order.serviceRef,
            amount: order.amount,
            paymentTransactionId: paymentRecord.id,
            subCategoryId: order.serviceType,
            transactionType: 'cash',
            rechargeType: order.operatorType,
            discountedAmount: paymentRecord.amount,
            userId: order.userId,
            finalAmount: paymentRecord.amount
          };

          let rechargeResponse;
          try {
            rechargeResponse = await axios.post(`${process.env.SERVER_BASEUSRL}/user/recharge-and-billpayments-upi`, apiDataForRecharge);
            // console.log(rechargeResponse)
          } catch (apiErr) {
            // console.error('Recharge API error:', finalOrderId, apiErr);
            return; // keep PROCESSING → retry later
          }

          const finalStatus =
            rechargeResponse?.data?.statuscode === 1 ? 'SUCCESS' : rechargeResponse?.data?.statuscode === 0 ? 'FAILED' : 'PENDING';

          await Order.update(
            {
              status: finalStatus
            },
            {
              where: {
                id: finalOrderId,
                status: 'PROCESSING'
              }
            }
          );
          // console.log('Recharge completed:', finalOrderId, finalStatus);
        }
      } catch (err) {
        console.error('Async failed', {
          transactionId,
          orderId: finalOrderId,
          err
        });
        // ❗ DO NOT throw
        // Retry cron will handle unfinished PROCESSING orders
      }
    });

    /* -------------------------------------------------
       7. RESPOND TO GATEWAY FAST 🚀
    -------------------------------------------------- */
    return res.send(successHTML());
  } catch (error) {
    // console.error('Vegaah callback error:', error);
    return res.status(500).send('ERROR');
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
    let orderRecord;
    if (paymentRecord.status === 'SUCCESS') {
      if (paymentRecord.purpose === 'recharge') {
        orderRecord = await Order.findOne({
          where: { id: paymentRecord.orderId, userId }
        });
      } else if (paymentRecord.purpose === 'addfund') {
        orderRecord = await walletOrderModel.findOne({
          where: { id: paymentRecord.walletOrderId, userId }
        });
      }

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
    // console.error('Order Status Check Error:', error);
    return res.status(500).json({ error, message: 'Internal Server Error' });
  }
};
exports.orderStatusCheck_v1 = async (req, res) => {
  const { orderId, walletOrderId } = req.body;
  try {
    const user = req.user;
    const userId = user.id;

    let orderRecord;
    if (orderId) {
      orderRecord = await Order.findOne({
        where: { id: orderId, userId }
      });
    } else {
      orderRecord = await walletOrderModel.findOne({
        where: { id: walletOrderId, userId }
      })
    }

    //   orderRecord = await walletOrderModel.findOne({
    //     where: { id: paymentRecord.walletOrderId, userId }
    //   });
    // }

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
  
  } catch (error) {
  // console.error('Order Status Check Error:', error);
  return res.status(500).json({ error, message: 'Internal Server Error' });
}
};
