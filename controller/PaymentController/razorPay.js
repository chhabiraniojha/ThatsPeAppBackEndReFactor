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
const razorpay = require("../../util/razorpay")
const { validatePaymentVerification, validateWebhookSignature } = require('razorpay/dist/utils/razorpay-utils');

// exports.generateSignature = async (req, res) => {
//   try {
//     const { payload } = req.body;
//     const secretKey = process.env.VEGAH_SECRET_KEY;
//     // const payloadString = JSON.stringify(payload);

//     const dataToHash =
//       payload.trackId + '|' + payload.terminalId + '|' + payload.password + '|' + secretKey + '|' + payload.amount + '|' + payload.currency;

//     console.log('STRING TO HASH:--->', dataToHash);
//     if (!payload) {
//       return res.status(400).json({
//         message: 'Payload is required'
//       });
//     }
//     if (!secretKey) {
//       return res.status(500).json({
//         message: 'Secret key not configured'
//       });
//     }
//     const signature = crypto.createHash('sha256').update(dataToHash).digest('hex');
//     return res.status(200).json({ signature });
//   } catch (error) {
//     console.log('ERROR GENERATING SIGNATURE:', error);
//     return res.status(500).json({ error, message: 'Internal Server Error' });
//   }
// };
exports.payRequest = async (req, res) => {

    // return res.status(200).json("hitted")
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
        // const userId = "XeRKNcdsAAsbFhB2ZjF9ZS"
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
        const payableAmount =
            purpose == 'recharge'
                ? finalAmount
                : amount;
        // console.log('ORDER DATA CREATED:', orderData);
        const receipt_id =
            purpose == 'recharge'
                ? orderId
                : walletOrderId;
        //razorpay order creation
        const razorpayOrder =
            await razorpay.orders.create({

                amount:
                    Number(payableAmount) * 100,

                currency: 'INR',

                receipt: receipt_id
            });
        console.log(razorpayOrder)
        const paymentId = await UIDGenerator();
        let paymentData;
        if (purpose == 'recharge') {
            paymentData = await Payment.create(
                {
                    id: paymentId,
                    orderId: orderId,
                    userId: userId,
                    gateway: 'razorpay',
                    paymentMode: 'UPI',
                    gatewayTransactionId: null,
                    razorpayOrderId: razorpayOrder.id,
                    razorpaySignature: null,
                    amount: payableAmount,
                    status: 'INITIATED',
                    purpose: purpose,
                    responseCode: null,
                    rawCallback: null
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
                    gatewayTransactionId: null,
                    razorpayOrderId: razorpayOrder.id,
                    razorpaySignature: null,
                    amount: amount,
                    status: 'INITIATED',
                    purpose: purpose,
                    responseCode: null,
                    rawCallback: null
                },
                { transaction: t }
            );
        }
        await t.commit();
        // console.log('PAYMENT DATA CREATED:', paymentData);
        return res.status(200).json({
            success: true,
            message: "Order created successfully",
            data: {
                orderId: purpose === "recharge" ? orderId : walletOrderId,
                razorpayOrderId: razorpayOrder.id,
                razorpayOrder
            }
        });
    } catch (error) {
        await t.rollback();
        console.error(error);
        console.log(error)
        return res.status(500).json({ success: false, message: 'Payment initiation failed' });
    }
};
exports.verifyPayment = async (req, res) => {


    try {

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        // VALIDATION
        if (
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {

            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const isValid =
            validatePaymentVerification(
                {
                    order_id: razorpay_order_id,
                    payment_id: razorpay_payment_id
                },

                razorpay_signature,

                process.env.RAZORPAY_KEY_SECRET
            );


        if (!isValid) {

            return res.status(400).json({
                success: false,
                message: 'Invalid payment signature'
            });
        }

        // FIND PAYMENT
        const payment = await Payment.findOne({
            where: {
                razorpayOrderId: razorpay_order_id
            }
        });

        if (!payment) {

            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        // OPTIONAL:
        // store latest signature/payment id

        payment.gatewayTransactionId =
            razorpay_payment_id;

        payment.razorpaySignature =
            razorpay_signature;

        await payment.save();

        return res.status(200).json({
            success: true,
            message: 'Payment signature verified'
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: 'Verification failed'
        });
    }
};

exports.webhook = async (req, res) => {
    // return res.status(200).json("ok,successfull")
    // console.log("webhook hitted")
    try {
        // =====================================
        // VERIFY WEBHOOK SIGNATURE
        // =====================================
        const webhookSignature =
            req.headers['x-razorpay-signature'];

        const body = JSON.stringify(req.body);

        const isValid =
            validateWebhookSignature(
                body,
                webhookSignature,
                process.env.RAZORPAY_WEBHOOK_SECRET
            );

        if (!isValid) {
            return res.status(400).json({
                success: false,
                message:
                    'Invalid webhook signature'
            });
        }
        // =====================================
        // PARSE EVENT
        // =====================================

        const event = JSON.parse(body);

        // =====================================
        // PAYMENT CAPTURED
        // =====================================
        let razorpay_order_id;
        if (
            event.event ===
            'payment.captured'
        ) {
            const paymentEntity =
                event.payload.payment.entity;

            razorpayOrderId =
                paymentEntity.order_id;

            const razorpayPaymentId =
                paymentEntity.id;
            const payment =
                await Payment.findOne({
                    where: {
                        razorpayOrderId
                    }
                });
            if (!payment) {

                return res.status(404).json({
                    success: false,
                    message: 'Payment not found'
                });
            }
        }


        // console.log("payment found7777777777777777777")
        /* --------------------------------------------------
           4. ATOMIC PAYMENT UPDATE (IDEMPOTENT)
        -------------------------------------------------- */
        const paymentUpdated = await Payment.update(
            {
                status: 'SUCCESS',
            },
            {
                where: {
                    razorpayOrderId,
                    status: 'INITIATED'
                }
            }
        );
        console.log('Payment update result:', paymentUpdated);

        const affectedPaymentRows = Array.isArray(paymentUpdated) ? paymentUpdated[0] : paymentUpdated;
        // console.log('Affected payment rows:', affectedPaymentRows);
        // bypassing these for testing-----
        if (affectedPaymentRows === 0) {
            return;
        }

        /* --------------------------------------------------
           5. FETCH PAYMENT (SAFE NOW)
        -------------------------------------------------- */
        const paymentRecord = await Payment.findOne({
            where: { razorpayOrderId }
        });

        if (!paymentRecord) {
            // console.error('Payment not found:', transactionId);
            return;
        }
        console.log("payment record is------------", paymentRecord)
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
            return;
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
        return res.status(200).json("ok");
    } catch (error) {
        // console.log(error)
        // console.error('Vegaah callback error:', error);
        return res.status(500).json('ERROR');
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
