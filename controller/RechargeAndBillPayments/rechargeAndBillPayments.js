const e = require('express');
const operatorModel = require('../../models/OperatorDataModel/operatorData');
const circleModel = require('../../models/CircleDataModel/circleData')
// const axios = require('axios')
// const paymentTransactionModel = require('../../models/PaymentTransactionModel/paymentTransaction')
// const walletTransactionModel = require('../../models/WalletModels/Wallet Transaction/walletTransaction')
const paymentModel = require('../../models/PaymentModel/payment');
// const walletController = require('../../controller/WalletController/wallet')
// const  a1RechargeService  = require('../../services/recharge/a1Recharge')
// const rechargeExchangeService = require('../../services/recharge/rechargeExchangeRecharge')
// const roboticsRechargeService = require('../../services/recharge/roboticRecharge')

// exports.rchargeAndBillPayments = async (req, res) => {
//     const { ezytm_circle_code, ezytm_operator_code, customer_number, amount, paymentTransactionId, subCategoryId, transactionType, status, rechargeType, discountedAmount, userId, finalAmount } = req.body

//     let circle = null
//     let cyrusCircleCode = null
//     let a1CircleCode = ""
//     let roboticsExchangeCircleCode = ""
//     let walletFinalAmount
//     let paymentTransaction
//     let walletTransaction
//     let walletTransactionId
//     let walletDebitResponse

// // console.log("req.body--------------------------------->>", req.body)

//     try {
//         // const paymentTransationIsused = await circleModel.findOne({
//         //     where: { ezytm_circle_code: ezytm_circle_code }
//         // })

//         if ((ezytm_circle_code || ezytm_circle_code == "") &&
//             ezytm_operator_code &&
//             customer_number &&
//             amount &&
//             subCategoryId &&
//             transactionType &&
//             status &&
//             (rechargeType || rechargeType == "") &&
//             (transactionType !== "cash" || paymentTransactionId)) {

//             // Checking The Paymet Traction  Is Used Or Not
//             if (transactionType == "cash") {
//                 //payment transcation model is old barcode system
//                 // paymentTransaction = await paymentTransactionModel.findOne({
//                 //     where: {
//                 //         id: paymentTransactionId,
//                 //         userId: userId
//                 //     }
//                 // })

//                 console.log("paymentTransaction--", paymentTransactionId,userId);
//                 paymentTransaction = await paymentModel.findOne({
//                     where: {
//                         id: paymentTransactionId,
//                         userId: userId
//                     }
//                 })
//                 if (paymentTransaction.isUsed && paymentTransaction.status == 'SUCCESS') {
//                     return res.status(200).json({ message: "Action Already Done For This Payment Transaction or Payment is Unsuccessfull", success: false, statuscode: 0 })
//                 }
//             }

//             //Geting Operator data for forther operation
//             const operatorData = await operatorModel.findOne({
//                 where: { ezytm_operator_code: ezytm_operator_code }
//             })
//             const circleData = await circleModel.findOne({
//                 where: { ezytm_circle_code: ezytm_circle_code }
//             })

//             // Checking The Wallet Traction  and Validate the amount
//             if (transactionType == "wallet") {

//                 const discountAmount = operatorData.discount
//                 const discountType = operatorData.discount_type
//                 if (discountType == "percentage") {
//                     walletFinalAmount = amount - (amount * discountAmount) / 100
//                 } else {
//                     walletFinalAmount = amount - discountAmount
//                 }
//                 walletFinalAmount = Math.ceil(walletFinalAmount * 10) / 10

//                 walletDebitResponse = await walletController.debitAmount({ deductAmount: walletFinalAmount, rechargeTypeId: subCategoryId, userId })

//                 // console.log("----->walletDebitResponse --->", walletDebitResponse)
//                 // console.log("----->walletDebitResponse ---XX", walletDebitResponse.data)

//                 if (walletDebitResponse.success == false && walletDebitResponse.statuscode != 1) {
//                     return res.status(200).json({ message: "Insufficient Wallet balance ", success: false, statuscode: 0 })
//                 }

//                 walletTransactionId = walletDebitResponse.initiateWalletTransaction.walletTransactionId

//                 walletTransaction = await walletTransactionModel.findOne({
//                     where: {
//                         id: walletTransactionId,
//                         transactionType: "Recharge"
//                     }
//                 })

//                 if (walletTransaction.isUsed && walletTransaction.status != 'success') {
//                     return res.status(200).json({ message: "Action Already Done For This Payment Transaction", success: false, statuscode: 0 })
//                 }
//                 if (walletTransaction.amount != discountedAmount) {
//                     console.log("amount and discounted AMOUNT MIS MATCH", discountedAmount, walletTransaction.amount)
//                     return
//                 }

//             }

//             // making circlecode for cyrus recharge
//             if (rechargeType == "PREPAID" || rechargeType == "POSTPAID") {

//                 circle = circleData.name
//                 cyrusCircleCode = circleData.cyrus_circle_code
//                 a1CircleCode = circleData.a1_circle_code == null ? "" : circleData.a1_circle_code
//                 roboticsExchangeCircleCode = circleData.robotic_exchange_circle_code

//             } else {

//                 cyrusCircleCode = 1
//             }

//             const cyrusOperatorCode = operatorData.cyrus_operator_code
//             const operator = operatorData.name
//             const a1OperatorCode = operatorData.a1_operator_code == null ? "" : operatorData.a1_operator_code
//             const roboticsExchangeOperatorCode = operatorData.robotic_exchange_operator_code == null ? "" : operatorData.robotic_exchange_operator_code
//             const rechargeExchangeOperatorCode = operatorData.recharge_exchange_operator_code == null ? "" : operatorData.recharge_exchange_operator_code
//             let initiateTransaction

//             if (transactionType == "wallet") {

//                 if (walletDebitResponse.statuscode == 1) {

//                     initiateTransaction = await axios.post(`${process.env.SERVER_BASEUSRL}/user/mobile-recharge-transaction/initiate-mobile-recharge-transaction`, {
//                         circleCode: a1CircleCode,//cyrusCircleCode,
//                         operatorCode: a1OperatorCode, //cyrusOperatorCode,
//                         customerNo: customer_number,
//                         amount: amount,
//                         discountedAmount: walletFinalAmount,
//                         userId: userId,
//                         cashPaymentTransactionId: paymentTransactionId,
//                         paymentTransactionType: transactionType,
//                         status,
//                         subCategoryId,
//                         operator,
//                         circle,
//                         walletPaymentTransactionId: walletTransactionId

//                     })
//                 }
//             }
//             else {
//                 console.log("Cash Payment Initiate Transaction start --------->")
//                 // Intial recharge transation create
//                 initiateTransaction = await axios.post(`${process.env.SERVER_BASEUSRL}/user/mobile-recharge-transaction/initiate-mobile-recharge-transaction`, {
//                     circleCode: a1CircleCode,//cyrusCircleCode,
//                     operatorCode: a1OperatorCode, //cyrusOperatorCode,
//                     customerNo: customer_number,
//                     amount: amount,
//                     discountedAmount: finalAmount,
//                     userId: userId,
//                     cashPaymentTransactionId: paymentTransactionId,
//                     paymentTransactionType: transactionType,
//                     status,
//                     subCategoryId,
//                     operator,
//                     circle,
//                     walletPaymentTransactionId: walletTransactionId

//                 })
//             }

// //   console.log("Cash Payment Initiate Transaction END -----xxxx---->")

//             // console.log(initiateTransaction);

//             //  Perfome Actual Recharge and update the recharge transation create
//             if (initiateTransaction) {
//                 // console.log("intial transation", initiateTransaction)
//                 if (initiateTransaction.data.statuscode == 1) {
//                     // --- cyrus recharge api  ----
//                     // const params = {
//                     //     memberid: process.env.CYRUS_MEMBER_ID,
//                     //     pin: process.env.CYRUS_MEMBER_PIN,
//                     //     number: customer_number,
//                     //     operator: cyrusOperatorCode,
//                     //     circle: cyrusCircleCode,
//                     //     amount: amount,
//                     //     usertx: initiateTransaction.data.rechargeTransaction.id,
//                     //     format: 'json',
//                     //     RechargeMode: '1'
//                     // };
//                     // const rechargeResponse = await axios.get('https://cyrusrecharge.in/services_cyapi/recharge_cyapi.aspx', { params })
//                     if (transactionType == "cash") {
//                         await paymentTransaction.update({
//                             isUsed: 1
//                         })
//                     }
//                     if (transactionType == "wallet") {
//                         await walletTransaction.update({
//                             isUsed: 1
//                         })
//                     }
//                     // --- Robotics  recharge api  ----
//                     const roboticsParams = {
//                         Apimember_id: process.env.ROBOTICS_USERNAME,
//                         Api_password: process.env.ROBOTICS_PASSWORD,
//                         Mobile_no: customer_number,
//                         Operator_code: roboticsExchangeOperatorCode,
//                         Amount: amount,
//                         Member_request_txnid: initiateTransaction.data.rechargeTransaction.id,
//                         Circle: roboticsExchangeCircleCode,

//                     };
//                     // const roboticReachargeResponse = await axios.get('https://api.roboticexchange.in/Robotics/webservice/GetMobileRecharge', { params: roboticsParams })
//                     const roboticReachargeResponse = await roboticsRechargeService.roboticReacharge(roboticsParams)

//                     // RoboticReachargeResponse is Pending
//                     if (roboticReachargeResponse?.data?.STATUS == 2) {

//                         const updateTransationStatus = await axios.post(`${process.env.SERVER_BASEUSRL}/user/mobile-recharge-transaction/update-mobile-recharge-transaction-status`, {
//                             rechargeTransactionId: initiateTransaction.data.rechargeTransaction.id,
//                             apiResponse: "PENDING",
//                             apiId: "robotics"
//                         })

//                         return res.status(200).json({ message: "Transation Pending", success: false, statuscode: 2, rechargeDate: initiateTransaction.data.rechargeTransaction.updatedAt })

//                     }
//                     // RoboticReachargeResponse is Success
//                     if (roboticReachargeResponse?.data?.STATUS == 1) {
//                         const updateTransationStatus = await axios.post(`${process.env.SERVER_BASEUSRL}/user/mobile-recharge-transaction/update-mobile-recharge-transaction-status`, {
//                             rechargeTransactionId: initiateTransaction.data.rechargeTransaction.id,
//                             apiResponse: "SUCCESS",
//                             apiId: "robotics"
//                         })

//                         // console.log(updateTransationStatus)

//                         return res.status(200).json({ message: "Transation Sucessfull", success: true, statuscode: 1, rechargeDate: initiateTransaction.data.rechargeTransaction.updatedAt })

//                     }
//                     // RoboticReachargeResponse is Failled

//                     if (roboticReachargeResponse?.data?.STATUS == 3 || roboticReachargeResponse?.STATUS==3)  {
//                         // ---  Recharge Exchange  recharge api  ----
//                         const rechargeExchangeParams = {
//                             userid: process.env.RECHARGEEXCHANGE_USERNAME,
//                             token: process.env.RECHARGEEXCHANGE_PASSWORD,
//                             opcode: rechargeExchangeOperatorCode,
//                             number: customer_number,
//                             amount: amount,
//                             transid: initiateTransaction.data.rechargeTransaction.id
//                         }

//                         // const rechargeExchangeResponse = await axios.get('https://api.RechargeExchange.com/API.asmx/Transaction', { params: rechargeExchangeParams })
//                         const rechargeExchangeResponse = await  rechargeExchangeService.rechargeExchange(rechargeExchangeParams)
//                         // console.log(rechargeExchangeResponse)
//                         if (rechargeExchangeResponse?.data?.status == "PENDING"){

//                                 const updateTransationStatus = await axios.post(`${process.env.SERVER_BASEUSRL}/user/mobile-recharge-transaction/update-mobile-recharge-transaction-status`, {
//                                     rechargeTransactionId: initiateTransaction.data.rechargeTransaction.id,
//                                     apiResponse: "PENDING",
//                                     apiId:"rechargeExchange"
//                                 })

//                                 return res.status(200).json({ message: "Transation Pending", success: false, statuscode: 2, rechargeDate: initiateTransaction.data.rechargeTransaction.updatedAt })

//                         }
//                         if (rechargeExchangeResponse?.data?.status == "SUCCESS") {
//                             const updateTransationStatus = await axios.post(`${process.env.SERVER_BASEUSRL}/user/mobile-recharge-transaction/update-mobile-recharge-transaction-status`, {
//                                 rechargeTransactionId: initiateTransaction.data.rechargeTransaction.id,
//                                 apiResponse: "SUCCESS",
//                                  apiId:"rechargeExchange"
//                             })

//                             // console.log(updateTransationStatus)

//                             return res.status(200).json({ message: "Transation Sucessfull", success: true, statuscode: 1, rechargeDate: initiateTransaction.data.rechargeTransaction.updatedAt })

//                         }
//                         if (rechargeExchangeResponse?.data?.status == "FAIL" || rechargeExchangeResponse?.status == "FAIL") {

//                             // --- A1 recharge api  ----
//                             const params = {
//                                 username: process.env.A1_USERNAME,
//                                 pwd: process.env.A1_PASSWORD,
//                                 circlecode: a1CircleCode,
//                                 operatorcode: a1OperatorCode,
//                                 number: customer_number,
//                                 amount: amount,
//                                 orderid: initiateTransaction.data.rechargeTransaction.id,
//                                 format: 'json',

//                             };

//                             // const rechargeResponse = await axios.get('https://business.a1topup.com/recharge/api', { params })
//                             const rechargeResponse = await a1RechargeService.a1Recharge(params)

//                             //   Recharge failled Logic
//                             if (rechargeResponse?.data?.Status === "Failure" || rechargeResponse?.data?.status === "Failure" || rechargeResponse?.Status === "FAILURE" || rechargeResponse?.data?.status === "FAILURE") {
//                                 const updateTransationStatus = await axios.post(`${process.env.SERVER_BASEUSRL}/user/mobile-recharge-transaction/update-mobile-recharge-transaction-status`, {
//                                     rechargeTransactionId: initiateTransaction.data.rechargeTransaction.id,
//                                     apiResponse: "FAILURE",
//                                      apiId:"a1"
//                                 })

//                                 //Refund logic

//                                 let refdundData = await axios.post(`${process.env.SERVER_BASEUSRL}/user/wallet/refund`, {
//                                     allTransactionId: initiateTransaction.data.rechargeTransaction.id
//                                 })
//                                 // console.log("refdundData", refdundData);

//                                 return res.status(200).json({ message: "Transation Failled", success: false, statuscode: 0, rechargeDate: initiateTransaction.data.rechargeTransaction.updatedAt })
//                             }
//                             //  Recharge Success Logic
//                             else if (rechargeResponse?.data?.Status === "Success" || rechargeResponse?.data?.status === "Success") {
//                                 const updateTransationStatus = await axios.post(`${process.env.SERVER_BASEUSRL}/user/mobile-recharge-transaction/update-mobile-recharge-transaction-status`, {
//                                     rechargeTransactionId: initiateTransaction.data.rechargeTransaction.id,
//                                     apiResponse: "SUCCESS",
//                                      apiId:"a1"
//                                 })

//                                 // console.log(updateTransationStatus)

//                                 return res.status(200).json({ message: "Transation Sucessfull", success: true, statuscode: 1, rechargeDate: initiateTransaction.data.rechargeTransaction.updatedAt })

//                             }

//                             else {

//                                 const updateTransationStatus = await axios.post(`${process.env.SERVER_BASEUSRL}/user/mobile-recharge-transaction/update-mobile-recharge-transaction-status`, {
//                                     rechargeTransactionId: initiateTransaction.data.rechargeTransaction.id,
//                                     apiResponse: "PENDING",
//                                     apiId: "a1"
//                                 })

//                                 return res.status(200).json({ message: "Transation Pending", success: false, statuscode: 2, rechargeDate: initiateTransaction.data.rechargeTransaction.updatedAt })

//                             }

//                         }
//                     }

//                 }

//             }

//             // return res.status(200).json({ message: "transation sucessfully ", success: true, statuscode: 1, cyrusOperatorCode, cyrusCircleCode, operator, circle, paymentTransactionId })

//         } else {
//             return res.status(200).json({ message: "All fields are required", success: false, statuscode: 0 })

//         }

//     } catch (error) {
//         console.log(error)
//         return res.status(500).json({ message: "Internal server error", success: false, statuscode: 0, error })
//     }
// }

const { processRecharge ,processRechargeForWallet} = require('../../services/rechargeOrchestrator.service');

/**
 * --------------------------------------------------
 * RECHARGE & BILL PAYMENT CONTROLLER
 * --------------------------------------------------
 * Thin controller:
 * - Validation only
 * - Calls orchestrator
 * - Returns real-time response
 */
exports.rechargeAndBillPaymentsViaUpi = async (req, res) => {
  try {
    console.log('Recharge controller hit');
    const {
      ezytm_circle_code,
      ezytm_operator_code,
      customer_number,
      amount,
      discountedAmount,
      paymentTransactionId,
      subCategoryId,
      transactionType, // 'cash' | 'wallet'
      rechargeType, // PREPAID | POSTPAID | DTH
      userId
    } = req.body;

    /* --------------------------------------------------
       1. BASIC VALIDATION
    -------------------------------------------------- */
    if (
      !ezytm_operator_code ||
      !customer_number ||
      !amount ||
      !subCategoryId ||
      !transactionType ||
      !rechargeType ||
      (transactionType === 'cash' && !paymentTransactionId)
    ) {
      return res.status(200).json({
        success: false,
        statuscode: 0,
        message: 'Invalid request parameters'
      });
    }

    if (Number(amount) <= 0) {
      return res.status(200).json({
        success: false,
        statuscode: 0,
        message: 'Invalid recharge amount'
      });
    }

    /* --------------------------------------------------
       2. CASH PAYMENT VALIDATION (READ ONLY)
       isUsed is handling idempotency
    -------------------------------------------------- */
    if (transactionType === 'cash') {
      const paymentUpdated = await paymentModel.update(
        { isUsed: true },
        {
          where: {
            id: paymentTransactionId,
            userId,
            status: 'SUCCESS',
            isUsed: false
          }
        }
      );
      const affectedPaymentRows = Array.isArray(paymentUpdated) ? paymentUpdated[0] : paymentUpdated;
      console.log('Affected payment rows:', affectedPaymentRows);
      if (affectedPaymentRows === 0) {
        return res.status(200).json({
          success: false,
          statuscode: 0,
          message: 'Payment already used or invalid'
        });
      }
    }

    /* --------------------------------------------------
       3. FETCH OPERATOR (FOR DISCOUNT ONLY)
    -------------------------------------------------- */
    const operatorData = await operatorModel.findOne({
      where: { ezytm_operator_code }
    });

    if (!operatorData) {
      return res.status(200).json({
        success: false,
        statuscode: 0,
        message: 'Invalid operator'
      });
    }

    /* --------------------------------------------------
       4. BACKEND DISCOUNT RECOMPUTE (SECURITY)
    -------------------------------------------------- */
    let beDiscountedAmount;
    const discountValue = Number(operatorData.discount);
    const discountType = operatorData.discount_type;

    if (discountType === 'percentage') {
      beDiscountedAmount = amount - (amount * discountValue) / 100;
    } else {
      beDiscountedAmount = amount - discountValue;
    }

    beDiscountedAmount = Math.ceil(beDiscountedAmount * 10) / 10;

    if (Number(beDiscountedAmount) !== Number(discountedAmount)) {
      return res.status(200).json({
        success: false,
        statuscode: 0,
        message: 'Discounted amount mismatch'
      });
    }

    /* --------------------------------------------------
       5. CALL RECHARGE ORCHESTRATION SERVICE
       (SINGLE SOURCE OF TRUTH)
    -------------------------------------------------- */
    const orchestrationResult = await processRecharge({
      userId,
      customerNo: customer_number,
      amount,
      discountedAmount: beDiscountedAmount,

      // 🔒 ONLY SOURCE CODES
      ezytmOperatorCode: ezytm_operator_code,
      ezytmCircleCode: rechargeType === 'DTH' ? null : ezytm_circle_code,

      subCategoryId,
      paymentTransactionType: transactionType,
      cashPaymentTransactionId: transactionType === 'cash' ? paymentTransactionId : null,
      walletPaymentTransactionId: null
    });

    /* --------------------------------------------------
       6. REAL-TIME RESPONSE
    -------------------------------------------------- */
    if (orchestrationResult.status === 'SUCCESS') {
      return res.status(200).json({
        success: true,
        statuscode: 1,
        message: 'Recharge successful',
        rechargeTransactionId: orchestrationResult.rechargeTransactionId
      });
    }

    if (orchestrationResult.status === 'PENDING') {
      return res.status(200).json({
        success: false,
        statuscode: 2,
        message: 'Recharge pending',
        rechargeTransactionId: orchestrationResult.rechargeTransactionId
      });
    }

    return res.status(200).json({
      success: false,
      statuscode: 0,
      message: 'Recharge failed',
      rechargeTransactionId: orchestrationResult.rechargeTransactionId
    });
  } catch (error) {
    console.error('STEP-4 ERROR:', error);
    return res.status(500).json({
      success: false,
      statuscode: 0,
      message: 'Internal server error'
    });
  }
};
exports.rechargeAndBillPaymentsViaWallet = async (req, res) => {
  try {
    console.log('Recharge controller hit');
    const {
      ezytm_circle_code,
      ezytm_operator_code,
      customer_number,
      amount,
      discountedAmount,
      subCategoryId,
      transactionType, // 'cash' | 'wallet'
      rechargeType, // PREPAID | POSTPAID | DTH
    } = req.body;
    const user = req.user;
    const userId = user.id;
    /* --------------------------------------------------
       1. BASIC VALIDATION
    -------------------------------------------------- */
    if (!ezytm_operator_code || !customer_number || !amount || !subCategoryId || !transactionType || !rechargeType || !discountedAmount) {
      return res.status(200).json({
        success: false,
        statuscode: 0,
        message: 'Invalid request parameters'
      });
    }
    if (transactionType !== 'wallet') {
      return res.status(200).json({
        success: false,
        statuscode: 0,
        message: 'transaction type is invalid'
      });
    }
    if (Number(amount) <= 0) {
      return res.status(200).json({
        success: false,
        statuscode: 0,
        message: 'Invalid recharge amount'
      });
    }

    /* --------------------------------------------------
       2. FETCH OPERATOR (FOR DISCOUNT ONLY)
    -------------------------------------------------- */
    const operatorData = await operatorModel.findOne({
      where: { ezytm_operator_code }
    });

    if (!operatorData) {
      return res.status(200).json({
        success: false,
        statuscode: 0,
        message: 'Invalid operator'
      });
    }
    console.log("operatorData", operatorData);
    /* --------------------------------------------------
       2. FETCH OPERATOR (FOR DISCOUNT ONLY)
    -------------------------------------------------- */

    if (ezytm_circle_code) {
      const circleData = await circleModel.findOne({
        where: { ezytm_circle_code }
      });

      if (!circleData) {
        return res.status(200).json({
          success: false,
          statuscode: 0,
          message: 'Invalid circle'
        });
      }

      console.log("circleData", circleData);
    }

    /* --------------------------------------------------
       3. BACKEND DISCOUNT RECOMPUTE (SECURITY)
    -------------------------------------------------- */
    let beDiscountedAmount;
    const discountValue = Number(operatorData.discount);
    const discountType = operatorData.discount_type;

    if (discountType === 'percentage') {
      beDiscountedAmount = amount - (amount * discountValue) / 100;
    } else {
      beDiscountedAmount = amount - discountValue;
    }

    beDiscountedAmount = Math.ceil(beDiscountedAmount * 10) / 10;
    console.log("beDiscountedAmount", beDiscountedAmount);  

    if (Number(beDiscountedAmount) !== Number(discountedAmount)) {
      return res.status(200).json({
        success: false,
        statuscode: 0,
        message: 'Discounted amount mismatch'
      });
    }

    /* --------------------------------------------------
       4. CALL RECHARGE ORCHESTRATION SERVICE
       (SINGLE SOURCE OF TRUTH)
    -------------------------------------------------- */
    const orchestrationResult = await processRechargeForWallet({
      userId,
      customerNo: customer_number,
      amount,
      discountedAmount: beDiscountedAmount,

      // 🔒 ONLY SOURCE CODES
      ezytmOperatorCode: ezytm_operator_code,
      ezytmCircleCode: rechargeType === 'DTH' ? null : ezytm_circle_code,

      subCategoryId,
      paymentTransactionType: transactionType,
    });

    /* --------------------------------------------------
       6. REAL-TIME RESPONSE
    -------------------------------------------------- */
    if (orchestrationResult.status === 'SUCCESS') {
      return res.status(200).json({
        success: true,
        statuscode: 1,
        message: 'Recharge successful',
        rechargeTransactionId: orchestrationResult.rechargeTransactionId
      });
    }

    if (orchestrationResult.status === 'PENDING') {
      return res.status(200).json({
        success: false,
        statuscode: 2,
        message: 'Recharge pending',
        rechargeTransactionId: orchestrationResult.rechargeTransactionId
      });
    }

    return res.status(200).json({
      success: false,
      statuscode: 0,
      message: 'Recharge failed',
      rechargeTransactionId: orchestrationResult.rechargeTransactionId
    });
  } catch (error) {
    console.error('STEP-4 ERROR:', error);
    return res.status(500).json({
      success: false,
      statuscode: 0,
      message: 'Internal server error'
    });
  }
};
