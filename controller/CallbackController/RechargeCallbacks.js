const axios = require('axios');
const { log } = require('../../util/logData');
const PaymentModel = require('../../models/PaymentModel/payment');
const AllTransactionsModel = require('../../models/RechargeAndBillPaymentTransactionsModels/rechargeAndBillPaymentTransactions');
const OrderModel = require('../../models/OrderModel/order');
exports.a1RechargeCallback = async (req, res) => {
  console.log('A1 Recharge Callback Hit', req.query);

  const { txid, status, opid } = req.query;
  try {
    if (status == 'Failure') {
      const updateTransationStatus = await axios.post(
        `${process.env.SERVER_BASEUSRL}/user/mobile-recharge-transaction/update-mobile-recharge-transaction-status`,
        {
          rechargeTransactionId: txid,
          apiResponse: 'FAILURE'
        }
      );
      const allTransactionRecord = await AllTransactionsModel.findByPk(txid);
      //   console.log('All Transaction Record:', allTransactionRecord.dataValues);

      const PaymentRecord = await PaymentModel.findByPk(allTransactionRecord.dataValues.cashPaymentTransactionId);
      //   console.log('Payment Record:', PaymentRecord?.dataValues);
      if (allTransactionRecord.dataValues.paymentTransactionType === 'cash') {

        const updateOrderStatus = await OrderModel.update({ status: 'FAILED' }, { where: { id: PaymentRecord.dataValues.orderId } });

        // console.log('Order Status Updated:', updateOrderStatus);
      }

      const upadateTransationStatus = await axios.post(
        `${process.env.SERVER_BASEUSRL}/user/mobile-recharge-transaction/update-mobile-recharge-transaction-status`,
        {
          rechargeTransactionId: txid,
          apiResponse: 'FAILURE'
        }
      );

      //   console.log('Transaction marked -------------------------:', updateTransationStatus);
      let refdundData = await axios.post(`${process.env.SERVER_BASEUSRL}/user/wallet/refund`, {
        allTransactionId: txid
      });
      //   console.log(refdundData);
      return;
    } else if (status == 'Success') {
      const updateTransationStatus = await axios.post(
        `${process.env.SERVER_BASEUSRL}/user/mobile-recharge-transaction/update-mobile-recharge-transaction-status`,
        {
          rechargeTransactionId: txid,
          apiResponse: 'SUCCESS'
        }
      );

      const allTransactionRecord = await AllTransactionsModel.findByPk(txid);
      //   console.log('All Transaction Record:', allTransactionRecord.dataValues);

      const PaymentRecord = await PaymentModel.findByPk(allTransactionRecord.dataValues.cashPaymentTransactionId);
      //   console.log('Payment Record:', PaymentRecord?.dataValues);
      if (allTransactionRecord.dataValues.paymentTransactionType === 'cash') {

        const updateOrderStatus = await OrderModel.update({ status: 'SUCCESS' }, { where: { id: PaymentRecord.dataValues.orderId } });

        // console.log('Order Status Updated:', updateOrderStatus);
      }

      //order update code here if required
      return;
    }
  } catch (error) {
    return;
  }
};
exports.roboticsExchangeCallback = async (req, res) => {
  const { txnid, status, operatorid } = req.query;
  try {
    if (status == 3) {
      const updateTransationStatus = await axios.post(
        `${process.env.SERVER_BASEUSRL}/user/mobile-recharge-transaction/update-mobile-recharge-transaction-status`,
        {
          rechargeTransactionId: txnid,
          apiResponse: 'FAILURE'
        }
      );
      let refdundData = await axios.post(`${process.env.SERVER_BASEUSRL}/user/wallet/refund`, {
        allTransactionId: txnid
      });
      console.log(refdundData);
      return res.status(200).json({ message: 'Transaction updated' });
    } else if (status == 1) {
      const updateTransationStatus = await axios.post(
        `${process.env.SERVER_BASEUSRL}/user/mobile-recharge-transaction/update-mobile-recharge-transaction-status`,
        {
          rechargeTransactionId: txnid,
          apiResponse: 'SUCCESS'
        }
      );
      return res.status(200).json({ message: 'Transaction updated' });
    }
  } catch (error) {
    return;
  }
};
exports.rechargeExchangeCallback = async (req, res) => {
  const { yourtransid, status, opid } = req.query;
  try {
    if (status == 'FAIL') {
      const updateTransationStatus = await axios.post(
        `${process.env.SERVER_BASEUSRL}/user/mobile-recharge-transaction/update-mobile-recharge-transaction-status`,
        {
          rechargeTransactionId: yourtransid,
          apiResponse: 'FAILURE'
        }
      );
      return res.status(200).json({ message: 'Transaction updated' });
    } else if (status == 'SUCCESS') {
      const updateTransationStatus = await axios.post(
        `${process.env.SERVER_BASEUSRL}/user/mobile-recharge-transaction/update-mobile-recharge-transaction-status`,
        {
          rechargeTransactionId: yourtransid,
          apiResponse: 'SUCCESS'
        }
      );
      return res.status(200).json({ message: 'Transaction updated' });
    }
  } catch (error) {
    return;
  }
};

exports.statusCheck = async (req, res) => {
  const { id } = req.query;

  try {
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const maxDuration = 10000; // 10 seconds
    const interval = 1000; // check every 1 second

    const startTime = Date.now();

    while (Date.now() - startTime < maxDuration) {

      const transaction = await AllTransactionsModel.findByPk(id);

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: "Transaction not found"
        });
      }

      const status = transaction.status?.toUpperCase();

      if (status === "SUCCESS") {
        return res.status(200).json({
          success: true,
          status: "SUCCESS",
          data: transaction
        });
      }

      if (status === "FAILED") {
        return res.status(200).json({
          success: true,
          status: "FAILED",
          data: transaction
        });
      }

      await sleep(interval);
    }

    // Still pending after timeout
    const transaction = await AllTransactionsModel.findByPk(id);

    return res.status(200).json({
      success: true,
      status: "PENDING",
      data: transaction
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};