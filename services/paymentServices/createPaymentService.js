const generateUUID = require("../../util/uidGenerator");

const Payment = require("../../models/PaymentModel/payment");
const PaymentGateway = require("../../models/PayentGatway/paymentGatway");

const {
    razorpayCreateOrder,
} = require("../gatewayServices/razorpayService");

const {
    zaakpayCreateOrder,
} = require("../gatewayServices/zaakpayService");


const createPaymentService = async ({
    order,
    user,
    userId,
    paymentMode,
    amount,
    transaction,
}) => {

    // --------------------------------------------------
    // 1. Basic validation
    // --------------------------------------------------

    if (!order) {
        const error = new Error("Order is required");
        error.code = "ORDER_REQUIRED";
        throw error;
    }

    if (!order.id) {
        const error = new Error("Order ID is required");
        error.message="OrderId is required-error from createPaymentService";
        error.code = "ORDER_ID_REQUIRED";
        throw error;
    }

    if (!user) {
        const error = new Error("User is required");
        error.code = "USER_REQUIRED";
        throw error;
    }

    if (!userId) {
        const error = new Error("User ID is required");
        error.code = "USER_ID_REQUIRED";
        throw error;
    }

    if (!paymentMode) {
        const error = new Error("Payment mode is required");
        error.code = "PAYMENT_MODE_REQUIRED";
        throw error;
    }

    const paymentAmount = Number(amount);

    if (
        !Number.isFinite(paymentAmount) ||
        paymentAmount <= 0
    ) {
        const error = new Error(
            "Invalid online payment amount"
        );

        error.code = "INVALID_PAYMENT_AMOUNT";

        throw error;
    }


    // --------------------------------------------------
    // 2. Find active payment gateway
    // --------------------------------------------------

    const gateway = await PaymentGateway.findOne({
        where: {
            status: true,
        },

        order: [
            ["createdAt", "ASC"],
        ],

        transaction,
    });

    if (!gateway) {
        const error = new Error(
            "No active payment gateway is available"
        );

        error.code = "PAYMENT_GATEWAY_UNAVAILABLE";

        throw error;
    }


    // --------------------------------------------------
    // 3. Gateway routing
    // --------------------------------------------------

    let gatewayResponse;


    switch (gateway.name) {

        // --------------------------------------------------
        // Razorpay
        // --------------------------------------------------

        case "Razorpay":

            gatewayResponse =
                await razorpayCreateOrder({
                    gateway,
                    amount: paymentAmount,
                    receipt: order.id,
                });

            break;


        // --------------------------------------------------
        // Zaakpay
        // --------------------------------------------------

        case "Zaakpay":

            gatewayResponse =
                await zaakpayCreateOrder({
                    gateway,
                    amount: paymentAmount,
                    orderId: order.id,
                    user,
                    productDescription: "ThatsPe Payment",
                });

            break;


        // --------------------------------------------------
        // Future gateways
        // --------------------------------------------------

        // case "PhonePe":
        //
        //     gatewayResponse =
        //         await phonePeCreateOrder({
        //             gateway,
        //             amount: paymentAmount,
        //             orderId: order.id,
        //         });
        //
        //     break;


        default: {

            const error = new Error(
                `Unsupported payment gateway: ${gateway.name}`
            );

            error.code =
                "UNSUPPORTED_PAYMENT_GATEWAY";

            throw error;
        }
    }


    // --------------------------------------------------
    // 4. Validate gateway response
    // --------------------------------------------------

    if (
        !gatewayResponse ||
        !gatewayResponse.paymentType ||
        !gatewayResponse.data
    ) {
        const error = new Error(
            "Invalid payment gateway response"
        );

        error.code =
            "INVALID_PAYMENT_GATEWAY_RESPONSE";

        throw error;
    }


    // --------------------------------------------------
    // 5. Get gateway order/reference ID
    // --------------------------------------------------
    //
    // Razorpay:
    // data.orderId
    //
    // Zaakpay:
    // currently no separate gateway order ID is
    // returned by our adapter, so it remains null.
    // --------------------------------------------------

    const gatewayOrderId =
        gatewayResponse.data.orderId || null;


    // --------------------------------------------------
    // 6. Create Payment record
    // --------------------------------------------------

    const payment = await Payment.create(
        {
            id: await generateUUID(),

            orderId: order.id,

            userId,

            gatewayId: gateway.id,

            paymentMode,

            amount: paymentAmount,

            gatewayTransactionId: null,

            gatewayOrderId,

            rrn: null,

            signature: null,

            status: "INITIATED",

            isUsed: false,

            responseCode: null,

            rawCallback: null,
        },
        {
            transaction,
        }
    );


    // --------------------------------------------------
    // 7. Return generic payment response
    // --------------------------------------------------

    return {
        paymentId: payment.id,

        orderId: order.id,

        gateway: {
            id: gateway.id,
            name: gateway.name,
        },

        paymentMode,

        amount: paymentAmount,

        paymentType:
            gatewayResponse.paymentType,

        paymentData:
            gatewayResponse.data,
    };
};


module.exports = {
    createPaymentService,
};