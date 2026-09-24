const sequelize = require("../../util/db_connect");

const Order = require("../../models/OrderModel/order");
const TransactionHistory = require("../../models/RechargeAndBillPaymentTransactionsModels/rechargeAndBillPaymentTransactions");
const uidgenerate = require("../../util/uidGenerator");

const {
  createPaymentService,
} = require("../paymentServices/createPaymentService");


const createOrderTransactionService = async ({
  user,
  userId,

  operatorId,
  subCategoryId,
  circleId,
  fields,

  amount,
  operatorDiscount,
  referralDiscount,
  discountedAmount,
  convenienceFee,
  finalPayableAmount,

  paymentMethod,
  walletAmount,
  onlinePaidAmount,
}) => {

  const transaction = await sequelize.transaction();

  try {

    // --------------------------------------------------
    // 1. Create Order
    // --------------------------------------------------

    const order = await Order.create(
      {
        id: await uidgenerate(),

        userId,

        serviceType: subCategoryId,

        operatorId,

        circleId: circleId || null,

        fields,

        amount,

        operatorDiscount,

        referralDiscount,

        discountedAmount,

        convenienceFee,

        finalPayableAmount,

        paymentMethod,

        walletAmount,

        onlinePaidAmount,

        status: "CREATED",
      },
      {
        transaction,
      }
    );


    // --------------------------------------------------
    // 2. Create Payment
    // --------------------------------------------------
    //
    // Payment gateway order creation will happen only
    // when online payment amount is greater than 0.
    //
    // UPI    -> onlinePaidAmount > 0
    // COMBO  -> onlinePaidAmount > 0
    // WALLET -> onlinePaidAmount = 0
    //
    // Payment service receives the already-created Order
    // and User. No additional Order query is required.
    //
    // Same Sequelize transaction is passed so that
    // Payment DB record is part of this transaction.
    // --------------------------------------------------

    let payment = null;

    if (Number(onlinePaidAmount) > 0) {

      payment = await createPaymentService({

        order,

        user,

        userId,

        // Currently online payment is UPI.
        // Later CARD / NET_BANKING can be supported.
        paymentMode: "UPI",

        amount: onlinePaidAmount,

        transaction,
      });
    }


    // --------------------------------------------------
    // 3. Create Transaction History
    // --------------------------------------------------
    //
    // If online payment was created:
    //
    // onlineTransactionId = Payment.id
    //
    // Wallet transaction remains NULL because wallet
    // debit happens later during fulfillment.
    // --------------------------------------------------

    const transactionHistory =
      await TransactionHistory.create(
        {
          id: await uidgenerate(),

          orderId: order.id,

          userId,

          paymentMethod,

          // Full payable amount of the order.
          amount: finalPayableAmount,

          onlineTransactionId: payment
            ? payment.paymentId
            : null,

          walletTransactionId: null,

          status: "CREATED",
        },
        {
          transaction,
        }
      );


    // --------------------------------------------------
    // 4. Commit
    // --------------------------------------------------

    await transaction.commit();


    // --------------------------------------------------
    // 5. Return created records
    // --------------------------------------------------

    return {
      order,
      payment,
      transactionHistory,
    };

  } catch (error) {

    // --------------------------------------------------
    // Rollback
    // --------------------------------------------------

    await transaction.rollback();

    throw error;
  }
};


module.exports = {
  createOrderTransactionService,
};