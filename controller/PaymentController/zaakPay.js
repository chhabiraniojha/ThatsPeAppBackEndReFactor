const { default: axios } = require('axios');
const sequelize = require('../../util/db_connect');
const crypto = require('crypto');
const Order = require('../../models/OrderModel/order');
const Payment = require('../../models/PaymentModel/payment');
const requestIp = require('request-ip');
const UIDGenerator = require('../../util/uidGenerator');
const operatorModel = require('../../models/OperatorDataModel/operatorData');
const circleModel = require("../../models/CircleDataModel/circleData")
const walletOrderModel = require('../../models/OrderModel/walletOrder');
const walletModel = require('../../models/WalletModels/WalletSchema/wallet');
const PaymentGatewayModel = require('../../models/PayentGatway/paymentGatway')
const walletController = require('../../controller/WalletController/wallet');
const successHTML = require('../../templates/paymentSuccess');
const failureHTML = require('../../templates/paymentFailed');
const pendingHTML = require('../../templates/paymentPending');
const razorpay = require("../../util/razorpay")
const { validatePaymentVerification, validateWebhookSignature } = require('razorpay/dist/utils/razorpay-utils');
const { validateRetailor } = require('../../services/mobikwikServices/mobikwik.service');
const zaakpayChecksum = require("../../util/zaakpayChecksum");

exports.payRequest = async (req, res) => {
    try {
        const {
            ezytm_circle_code,
            ezytm_operator_code,
            customer_number,
            amount,
            subCategoryId,
            rechargeType,
            discountedAmount,
            purpose,
            planCode
        } = req.body;

        // ============================================================
        // USER
        // ============================================================

        const user = req.user;
        const userId = user.id;

        console.log("User ID:", userId);

        // ============================================================
        // INITIAL AMOUNT
        // ============================================================

        let finalAmount = Number(amount);

        // ============================================================
        // VALIDATIONS
        // ============================================================

        if (!["recharge", "addfund"].includes(purpose)) {
            return res.status(200).json({
                success: false,
                statusCode: 0,
                message: "Invalid purpose"
            });
        }

        // Recharge validation
        if (
            purpose === "recharge" &&
            (
                !amount ||
                !customer_number ||
                !subCategoryId ||
                !userId ||
                !ezytm_operator_code
            )
        ) {
            return res.status(200).json({
                success: false,
                statusCode: 0,
                message: "Missing Recharge Details"
            });
        }

        // Add fund validation
        if (
            purpose === "addfund" &&
            (!amount || !userId)
        ) {
            return res.status(200).json({
                success: false,
                statusCode: 0,
                message: "Missing Wallet Recharge Details"
            });
        }

        // Amount validation
        if (Number(amount) <= 0) {
            return res.status(200).json({
                success: false,
                statusCode: 0,
                message: "Invalid Amount"
            });
        }

        // ============================================================
        // RECHARGE LOGIC
        // ============================================================

        if (purpose === "recharge") {

            const operatorData = await operatorModel.findOne({
                where: {
                    ezytm_operator_code
                }
            });

            if (!operatorData) {
                return res.status(200).json({
                    success: false,
                    statusCode: 0,
                    message: "Operator not found"
                });
            }

            // --------------------------------------------------------
            // MOBILE RECHARGE VALIDATION
            // --------------------------------------------------------

            if (
                subCategoryId ===
                "JxQmQdtoe3BVwAwDXbiGCR"
            ) {

                const circleData =
                    await circleModel.findOne({
                        where: {
                            ezytm_circle_code
                        }
                    });

                if (!circleData) {
                    return res.status(200).json({
                        success: false,
                        statusCode: 0,
                        message: "Circle not found"
                    });
                }

                /*
                const response = await validateRetailor(
                    amount,
                    customer_number,
                    operatorData.mobi_operator_code,
                    circleData.mobikwik_circle_code,
                    planCode
                );

                if (response.status === "FAILED") {
                    return res.status(200).json({
                        success: false,
                        statusCode: 0,
                        message: response.message
                    });
                }
                */
            }

            // --------------------------------------------------------
            // DISCOUNT CALCULATION
            // --------------------------------------------------------

            const discountAmount =
                Number(operatorData.discount || 0);

            const discountType =
                operatorData.discount_type;

            if (discountType === "percentage") {

                finalAmount =
                    Number(amount) -
                    (
                        Number(amount) *
                        discountAmount
                    ) / 100;

            } else {

                finalAmount =
                    Number(amount) -
                    discountAmount;
            }

            // --------------------------------------------------------
            // ROUND TO 2 DECIMAL
            // --------------------------------------------------------

            finalAmount =
                Math.trunc(
                    finalAmount * 100
                ) / 100;

            finalAmount =
                Number(
                    finalAmount.toFixed(2)
                );

            // --------------------------------------------------------
            // VERIFY DISCOUNTED AMOUNT
            // --------------------------------------------------------

            if (
                discountedAmount !== undefined &&
                discountedAmount !== null &&
                Number(discountedAmount) !== finalAmount
            ) {
                return res.status(200).json({
                    success: false,
                    statusCode: 0,
                    message: "Discounted amount mismatch"
                });
            }
        }

        // ============================================================
        // PAYABLE AMOUNT
        // ============================================================

        const payableAmount =
            purpose === "recharge"
                ? finalAmount
                : Number(amount);

        // ============================================================
        // IDS
        // ============================================================

        const orderId =
            await UIDGenerator();

        const walletOrderId =
            await UIDGenerator();

        const receiptId =
            purpose === "recharge"
                ? orderId
                : walletOrderId;

        console.log("Receipt ID:", receiptId);
        console.log("Payable Amount:", payableAmount);

        // ============================================================
        // ZAAKPAY CONFIG
        // ============================================================

        const MERCHANT_ID =
            process.env.ZAAKPAY_MERCHANT_ID;

        const SECRET_KEY =
            process.env.ZAAKPAY_SECRET_KEY;

        if (!MERCHANT_ID || !SECRET_KEY) {
            return res.status(500).json({
                success: false,
                statusCode: 0,
                message: "Zaakpay credentials are missing"
            });
        }

        // ============================================================
        // ZAAKPAY REQUEST DATA
        // ============================================================
        //
        // amount = paisa
        //
        // returnUrl is NOT included because it is optional.
        //
        // txnType:
        // 14 = UPI
        //
        // mode:
        // 0 = Skip domain check
        //
        // zpPayOption:
        // 1 = button redirect
        // ============================================================

        const orderDetails = {
            amount: String(
                Math.round(
                    Number(payableAmount) * 100
                )
            ),

            buyerEmail:
                user.email,

            buyerFirstName:
                user.name || "Customer",

            buyerPhoneNumber:
                user.mobileNo || "9999999999",

            currency:
                "INR",

            merchantIdentifier:
                MERCHANT_ID,

            orderId:
                receiptId,

            productDescription:
                purpose === "recharge"
                    ? `Recharge ${customer_number}`
                    : "Wallet Add Fund",

            txnType:
                "1",

            mode:
                "0",

            zpPayOption:
                "1"
        };

        // ============================================================
        // REQUIRED DATA VALIDATION
        // ============================================================

        if (!orderDetails.buyerEmail) {
            return res.status(200).json({
                success: false,
                statusCode: 0,
                message: "Buyer email is required"
            });
        }

        if (!orderDetails.merchantIdentifier) {
            return res.status(200).json({
                success: false,
                statusCode: 0,
                message: "Merchant identifier is required"
            });
        }

        if (!orderDetails.orderId) {
            return res.status(200).json({
                success: false,
                statusCode: 0,
                message: "Order ID is required"
            });
        }

        // ============================================================
        // ZAAKPAY CHECKSUM
        // ============================================================
        //
        // IMPORTANT:
        //
        // Use the checksum helper you provided.
        //
        // Do NOT use Object.keys().sort() here.
        //
        // Your helper follows Zaakpay's predefined sequence.
        // ============================================================

        const checksumString =
            zaakpayChecksum.getChecksumString(
                orderDetails
            );

        console.log(
            "========================================"
        );

        console.log(
            "ZAAKPAY CHECKSUM STRING:"
        );

        console.log(
            checksumString
        );

        console.log(
            "========================================"
        );

        const checksum =
            zaakpayChecksum.calculateChecksum(
                checksumString
            );

        console.log(
            "ZAAKPAY CHECKSUM:",
            checksum
        );

        // ============================================================
        // CREATE NVP REQUEST
        // ============================================================

        const params =
            new URLSearchParams();

        Object.entries(orderDetails)
            .forEach(([key, value]) => {

                if (
                    value !== undefined &&
                    value !== null &&
                    String(value) !== ""
                ) {
                    params.append(
                        key,
                        String(value)
                    );
                }
            });

        // Checksum must be added after request parameters
        params.append(
            "checksum",
            checksum
        );

        const requestBody =
            params.toString();

        // ============================================================
        // LOG REQUEST
        // ============================================================

        console.log(
            "========================================"
        );

        console.log(
            "ZAAKPAY REQUEST BODY:"
        );

        console.log(
            requestBody
        );

        console.log(
            "========================================"
        );

        // ============================================================
        // DIRECT ZAAKPAY API CALL
        // ============================================================

        const zaakPayResponse =
            await axios.post(
                "https://api.zaakpay.com/api/paymentTransact/V13",

                requestBody,

                {
                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded",

                        "Accept":
                            "*/*"
                    },

                    timeout:
                        60000,

                    // Don't throw Axios error for 4xx/5xx.
                    // We need Zaakpay's actual response.
                    validateStatus:
                        () => true
                }
            );

        // ============================================================
        // ZAAKPAY RESPONSE
        // ============================================================

        console.log(
            "========================================"
        );

        console.log(
            "ZAAKPAY HTTP STATUS:",
            zaakPayResponse.status
        );

        console.log(
            "ZAAKPAY RESPONSE:",
            zaakPayResponse.data
        );

        console.log(
            "========================================"
        );

        // ============================================================
        // RETURN RESPONSE
        // ============================================================

        return res.status(200).json({
            success:
                zaakPayResponse.status >= 200 &&
                zaakPayResponse.status < 300,

            statusCode:
                zaakPayResponse.status,

            orderId:
                receiptId,

            amount:
                payableAmount,

            data:
                zaakPayResponse.data
        });

    } catch (error) {

        // ============================================================
        // ERROR HANDLING
        // ============================================================

        console.error(
            "========================================"
        );

        console.error(
            "PAYMENT ERROR:"
        );

        console.error(
            error
        );

        console.error(
            "ZAAKPAY ERROR RESPONSE:"
        );

        console.error(
            error?.response?.data
        );

        console.error(
            "========================================"
        );

        return res.status(500).json({
            success: false,

            statusCode:
                error?.response?.status || 500,

            message:
                "Payment initiation failed",

            error:
                error?.response?.data ||
                error?.message
        });
    }
};


exports.webhook = async (req, res) => {
    // return res.status(200).json("ok,successfull")
    console.log("webhook hitted")
   

    try {
        const { txnData, checksum } = req.body;

        if (!txnData || !checksum) {
            console.error("Zaakpay webhook: txnData/checksum missing");

            return res.status(400).send("Invalid webhook");
        }

        // --------------------------------------------------
        // 1. Parse txnData
        // --------------------------------------------------

        let data;

        try {
            data = JSON.parse(txnData);
        } catch (error) {
            console.error("Invalid txnData JSON");

            return res.status(400).send("Invalid txnData");
        }
        // --------------------------------------------------
        // 2. Validate merchantIdentifier
        // --------------------------------------------------

        if (
            data.merchantIdentifier !==
            process.env.ZAAKPAY_MERCHANT_ID
        ) {
            console.error("Invalid merchantIdentifier");

            return res.status(400).send("Invalid merchant");
        }
        // --------------------------------------------------
        // 3. txns should exist
        // --------------------------------------------------

        if (
            !Array.isArray(data.txns) ||
            data.txns.length === 0
        ) {
            console.error("No transaction found in txnData");

            return res.status(400).send("No transaction");
        }

        // For normal single-payment flow
        const txn = data.txns[0];

        console.log("Zaakpay Transaction:", txn);
        // --------------------------------------------------
        // 4. Extract transaction details
        // --------------------------------------------------

        const {
            orderId,
            amount,
            responseCode,
            responseDescription,
            pgTransId,
            pgTransTime,
            paymentMode,
            paymentMethod,
            bank,
            bankid,
            cardId,
            cardScheme,
            cardToken,
            cardhashid,
            doRedirect,
            productDescription,
            product1Description,
            product2Description,
            product3Description,
            product4Description,
        } = txn;

        if (!orderId) {
            console.error("orderId missing");

            return res.status(400).send("Order ID missing");
        }
        // --------------------------------------------------
        // 5. Verify Zaakpay webhook checksum
        // --------------------------------------------------

        const isValidChecksum = verifyZaakpayWebhookChecksum(
            txnData,
            checksum
        );

        if (!isValidChecksum) {
            console.error(
                "INVALID ZAAKPAY WEBHOOK CHECKSUM",
                orderId
            );

            return res.status(400).send("Invalid checksum");
        }

        console.log(
            "Zaakpay checksum verified:",
            orderId
        );

    } catch (error) {

    }
    // try {
    //     // =====================================
    //     // VERIFY WEBHOOK SIGNATURE
    //     // =====================================
    //     const webhookSignature =
    //         req.headers['x-razorpay-signature'];

    //     const body = JSON.stringify(req.body);

    //     const isValid =
    //         validateWebhookSignature(
    //             body,
    //             webhookSignature,
    //             process.env.RAZORPAY_WEBHOOK_SECRET
    //         );

    //     if (!isValid) {
    //         return res.status(400).json({
    //             success: false,
    //             message:
    //                 'Invalid webhook signature'
    //         });
    //     }
    //     // =====================================
    //     // PARSE EVENT
    //     // =====================================

    //     const event = JSON.parse(body);

    //     // =====================================
    //     // PAYMENT CAPTURED
    //     // =====================================
    //     let razorpay_order_id;
    //     if (
    //         event.event ===
    //         'payment.captured'
    //     ) {
    //         const paymentEntity =
    //             event.payload.payment.entity;

    //         razorpayOrderId =
    //             paymentEntity.order_id;

    //         const razorpayPaymentId =
    //             paymentEntity.id;
    //         const payment =
    //             await Payment.findOne({
    //                 where: {
    //                     razorpayOrderId
    //                 }
    //             });
    //         if (!payment) {

    //             return res.status(404).json({
    //                 success: false,
    //                 message: 'Payment not found'
    //             });
    //         }
    //     }


    //     // console.log("payment found7777777777777777777")
    //     /* --------------------------------------------------
    //        4. ATOMIC PAYMENT UPDATE (IDEMPOTENT)
    //     -------------------------------------------------- */
    //     const paymentUpdated = await Payment.update(
    //         {
    //             status: 'SUCCESS',
    //         },
    //         {
    //             where: {
    //                 razorpayOrderId,
    //                 status: 'INITIATED'
    //             }
    //         }
    //     );
    //     console.log('Payment update result:', paymentUpdated);

    //     const affectedPaymentRows = Array.isArray(paymentUpdated) ? paymentUpdated[0] : paymentUpdated;
    //     // console.log('Affected payment rows:', affectedPaymentRows);
    //     // bypassing these for testing-----
    //     if (affectedPaymentRows === 0) {
    //         return;
    //     }

    //     /* --------------------------------------------------
    //        5. FETCH PAYMENT (SAFE NOW)
    //     -------------------------------------------------- */
    //     const paymentRecord = await Payment.findOne({
    //         where: { razorpayOrderId }
    //     });

    //     if (!paymentRecord) {
    //         // console.error('Payment not found:', transactionId);
    //         return;
    //     }
    //     console.log("payment record is------------", paymentRecord)
    //     const { purpose, orderId, walletOrderId } = paymentRecord;
    //     const finalOrderId = purpose === 'addfund' ? walletOrderId : orderId;

    //     /* --------------------------------------------------
    //        6. ATOMIC ORDER STATUS UPDATE
    //     -------------------------------------------------- */
    //     let orderUpdated = 0;

    //     if (purpose === 'addfund') {
    //         orderUpdated = await walletOrderModel.update(
    //             { status: 'PROCESSING' },
    //             {
    //                 where: {
    //                     id: finalOrderId,
    //                     status: 'CREATED'
    //                 }
    //             }
    //         );
    //     } else {
    //         orderUpdated = await Order.update(
    //             { status: 'PROCESSING' },
    //             {
    //                 where: {
    //                     id: finalOrderId,
    //                     status: 'CREATED'
    //                 }
    //             }
    //         );
    //     }
    //     // console.log('Order update result:', orderUpdated);
    //     const affectedOrderRows = Array.isArray(orderUpdated) ? orderUpdated[0] : orderUpdated;
    //     // bypassing these for testing-----later remove it
    //     if (affectedOrderRows === 0) {
    //         // console.log('Order already moved:', finalOrderId);
    //         return;
    //     }

    //     // console.log('step 6.5 is reached');
    //     /* --------------------------------------------------
    //    6.5 FIRE & FORGET ASYNC WORK 🚀
    // -------------------------------------------------- */
    //     setImmediate(async () => {
    //         try {
    //             // console.log('Async processing started for:', transactionId);

    //             /* =========================
    //            ADD FUND FLOW
    //         ========================= */
    //             if (purpose === 'addfund') {
    //                 const walletOrder = await walletOrderModel.findOne({
    //                     where: { id: finalOrderId }
    //                 });

    //                 if (!walletOrder) {
    //                     // console.error('WalletOrder not found:', finalOrderId);
    //                     return;
    //                 }

    //                 // Idempotency guard
    //                 if (walletOrder.status !== 'PROCESSING') {
    //                     // console.log('WalletOrder already processed:', finalOrderId);
    //                     return;
    //                 }

    //                 const addFundResponse = await walletController.addFund({
    //                     userId: walletOrder.userId,
    //                     amount: walletOrder.amount,
    //                     paymentTransactionId: paymentRecord.id
    //                 });

    //                 await walletOrderModel.update(
    //                     {
    //                         status: addFundResponse?.statuscode === 1 ? 'SUCCESS' : 'FAILED'
    //                     },
    //                     {
    //                         where: {
    //                             id: finalOrderId,
    //                             status: 'PROCESSING'
    //                         }
    //                     }
    //                 );

    //                 // console.log('Add fund completed:', finalOrderId);
    //             } else {
    //                 /* =========================
    //              RECHARGE FLOW
    //           ========================= */
    //                 const order = await Order.findOne({
    //                     where: { id: finalOrderId }
    //                 });

    //                 if (!order) {
    //                     // console.error('Order not found:', finalOrderId);
    //                     return;
    //                 }
    //                 // bypass for testing-----
    //                 // Idempotency guard
    //                 if (order.status !== 'PROCESSING') {
    //                     // console.log('Recharge already processed:', finalOrderId);
    //                     return;
    //                 }

    //                 // 🔁 SAME PAYLOAD AS YOUR OLD CODE
    //                 const apiDataForRecharge = {
    //                     ezytm_circle_code: order.circle,
    //                     ezytm_operator_code: order.operator,
    //                     customer_number: order.serviceRef,
    //                     amount: order.amount,
    //                     paymentTransactionId: paymentRecord.id,
    //                     subCategoryId: order.serviceType,
    //                     transactionType: 'cash',
    //                     rechargeType: order.operatorType,
    //                     discountedAmount: paymentRecord.amount,
    //                     userId: order.userId,
    //                     finalAmount: paymentRecord.amount
    //                 };

    //                 let rechargeResponse;
    //                 try {
    //                     rechargeResponse = await axios.post(`${process.env.SERVER_BASEUSRL}/user/recharge-and-billpayments-upi`, apiDataForRecharge);
    //                     // console.log(rechargeResponse)

    //                 } catch (apiErr) {
    //                     // console.error('Recharge API error:', finalOrderId, apiErr);
    //                     return; // keep PROCESSING → retry later
    //                 }

    //                 const finalStatus =
    //                     rechargeResponse?.data?.statuscode === 1 ? 'SUCCESS' : rechargeResponse?.data?.statuscode === 0 ? 'FAILED' : 'PENDING';

    //                 await Order.update(
    //                     {
    //                         status: finalStatus
    //                     },
    //                     {
    //                         where: {
    //                             id: finalOrderId,
    //                             status: 'PROCESSING'
    //                         }
    //                     }
    //                 );
    //                 // console.log('Recharge completed:', finalOrderId, finalStatus);
    //             }
    //         } catch (err) {
    //             console.error('Async failed', {
    //                 transactionId,
    //                 orderId: finalOrderId,
    //                 err
    //             });
    //             // ❗ DO NOT throw
    //             // Retry cron will handle unfinished PROCESSING orders
    //         }
    //     });

    //     /* -------------------------------------------------
    //        7. RESPOND TO GATEWAY FAST 🚀
    //     -------------------------------------------------- */
    //     return res.status(200).json("ok");
    // } catch (error) {
    //     // console.log(error)
    //     // console.error('Vegaah callback error:', error);
    //     return res.status(500).json('ERROR');
    // }
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

