const axios = require('axios');
const { log } = require('../../util/logData');
const PaymentModel = require('../../models/PaymentModel/payment');
const AllTransactionsModel = require('../../models/RechargeAndBillPaymentTransactionsModels/rechargeAndBillPaymentTransactions');
const OrderModel = require('../../models/OrderModel/order');
const RechargeTransaction = require('../../models/RechargeAndBillPaymentTransactionsModels/rechargeAndBillPaymentTransactions');
const sequelize = require('../../util/db_connect');
const Wallet = require('../../models/WalletModels/WalletSchema/wallet');
const WalletTransaction = require('../../models/WalletModels/Wallet Transaction/walletTransaction');
const SubCategory = require('../../models/SubCategoryModel/subCategory');
const uid = require('../../util/uidGenerator');
const mobikwikRechargeService=require("../../services/recharge/mobikwik")



const {
  debitWalletForRecharge,
  refundWallet
} = require('../../services/walletTransaction.service');
const {
  getApiByName,
  createVendorAttempt,
  updateVendorAttempt,
  getVendorAttempt
} = require("../../services/vendorAttemptServices/vendorAttemptService");




const {
  validateRetailor
} = require('../../services/mobikwikServices/mobikwik.service');


exports.a1RechargeCallback = async (req, res) => {
  const { txid, status, opid, message } = req.query;

  try {
    const api = await getApiByName("A1");

    if (String(status).toUpperCase() === "SUCCESS") {

      await updateVendorAttempt({
        rechargeTransactionId: txid,
        apiId: api.id,
        status: "SUCCESS",
        vendorTransactionId: opid || null,
        rawResponse: req.query,
        message: message || null,
        callbackReceived: true,
      });

      await AllTransactionsModel.update(
        {
          status: "SUCCESS",
          apiTransactionId: api.id,
        },
        {
          where: {
            id: txid,
            status: "PENDING",
          },
        }
      );
      const findTransaction = await AllTransactionsModel.findByPk(txid);

      if (findTransaction.dataValues.paymentTransactionType === "cash") {

        const findPaymentRecord = await PaymentModel.findByPk(
          findTransaction.cashPaymentTransactionId
        );
        await OrderModel.update(
          { status: "SUCCESS" },
          {
            where: {
              id: findPaymentRecord.orderId,
            },
          }
        );
      }


      return res.status(200).json({
        success: true,
        message: "SUCCESS callback processed",
      });
    }

    if (String(status).toUpperCase() === "FAILURE") {

      await updateVendorAttempt({
        rechargeTransactionId: txid,
        apiId: api.id,
        status: "FAILED",
        vendorTransactionId: opid || null,
        rawResponse: req.query,
        message: message || null,
        callbackReceived: true,
      });
      const affected = await AllTransactionsModel.update(
        {
          status: "FAILED",
          apiTransactionId: api.id
        },
        {
          where: {
            id: txid,
            status: "PENDING"
          }
        }
      );
      const affectedRows = Array.isArray(affected) ? affected[0] : affected;
      // console.log('Affected payment rows:', affectedPaymentRows);
      // bypassing these for testing-----
      if (affectedRows === 1) {
        await refundWallet({
          rechargeTransactionId: txid,
        });
        const findTransaction = await AllTransactionsModel.findByPk(txid);

        if (findTransaction.dataValues.paymentTransactionType === "cash") {

          const findPaymentRecord = await PaymentModel.findByPk(
            findTransaction.cashPaymentTransactionId
          );
          await OrderModel.update(
            { status: "FAILED" },
            {
              where: {
                id: findPaymentRecord.orderId,
              },
            }
          );
        }
      }
    }
    return res.status(200).json({
      success: true,
      message: "FAILURE callback processed",
    });

    return res.status(200).json({
      success: true,
      message: "Ignored",
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



exports.roboticsExchangeCallback = async (req, res) => {
  const { txnid, status, operatorid, message } = req.query;

  try {
    const api = await getApiByName("RoboticsExchange");

    // ---------------- SUCCESS ----------------

    if (Number(status) === 1) {

      await updateVendorAttempt({
        rechargeTransactionId: txnid,
        apiId: api.id,
        status: "SUCCESS",
        vendorTransactionId: operatorid || null,
        rawResponse: req.query,
        message: message || null,
        callbackReceived: true,
      });

      await AllTransactionsModel.update(
        {
          status: "SUCCESS",
          apiTransactionId: api.id,
        },
        {
          where: {
            id: txnid,
            status: "PENDING",
          },
        }
      );
      const findTransaction = await AllTransactionsModel.findByPk(txnid);

      if (findTransaction.dataValues.paymentTransactionType === "cash") {

        const findPaymentRecord = await PaymentModel.findByPk(
          findTransaction.cashPaymentTransactionId
        );
        await OrderModel.update(
          { status: "SUCCESS" },
          {
            where: {
              id: findPaymentRecord.orderId,
            },
          }
        );
      }

      return res.status(200).json({
        success: true,
        message: "SUCCESS callback processed",
      });
    }

    // ---------------- FAILURE ----------------

    if (Number(status) === 3) {

      await updateVendorAttempt({
        rechargeTransactionId: txnid,
        apiId: api.id,
        status: "FAILED",
        vendorTransactionId: operatorid || null,
        rawResponse: req.query,
        message: message || null,
        callbackReceived: true,
      });

      // Don't update AllTransactions
      // Don't refund wallet
      const affected = await AllTransactionsModel.update(
        {
          status: "FAILED",
          apiTransactionId: api.id
        },
        {
          where: {
            id: txnid,
            status: "PENDING"
          }
        }
      );
      const affectedRows = Array.isArray(affected) ? affected[0] : affected;
      if (affectedRows === 1) {
        await refundWallet({
          rechargeTransactionId: txnid,
        });
        const findTransaction = await AllTransactionsModel.findByPk(txnid);

        if (findTransaction.dataValues.paymentTransactionType === "cash") {

          const findPaymentRecord = await PaymentModel.findByPk(
            findTransaction.cashPaymentTransactionId
          );
          await OrderModel.update(
            { status: "FAILED" },
            {
              where: {
                id: findPaymentRecord.orderId,
              },
            }
          );
        }
      }
      return res.status(200).json({
        success: true,
        message: "FAILURE callback processed",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Ignored",
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


exports.rechargeExchangeCallback = async (req, res) => {
  const { yourtransid, status, opid, message } = req.query;

  try {

    const api = await getApiByName("RechargeExchange");

    if (status === "SUCCESS") {

      // Update vendor attempt
      await updateVendorAttempt({
        rechargeTransactionId: yourtransid,
        apiId: api.id,
        status: "SUCCESS",
        vendorTransactionId: opid || null,
        rawResponse: req.query,
        message: message || null,
        callbackReceived: true,
      });

      // Update main transaction
      await AllTransactionsModel.update(
        {
          status: "SUCCESS",
          apiTransactionId: api.id,
        },
        {
          where: {
            id: yourtransid,
            status: "PENDING",
          },
        }
      );
      const findTransaction = await AllTransactionsModel.findByPk(yourtransid);

      if (findTransaction.dataValues.paymentTransactionType === "cash") {

        const findPaymentRecord = await PaymentModel.findByPk(
          findTransaction.cashPaymentTransactionId
        );
        await OrderModel.update(
          { status: "SUCCESS" },
          {
            where: {
              id: findPaymentRecord.orderId,
            },
          }
        );
      }
      return res.status(200).json({
        success: true,
        message: "SUCCESS callback processed",
      });
    }

    if (status === "FAIL") {

      // Update only vendor attempt
      await updateVendorAttempt({
        rechargeTransactionId: yourtransid,
        apiId: api.id,
        status: "FAILED",
        vendorTransactionId: opid || null,
        rawResponse: req.query,
        message: message || null,
        callbackReceived: true,
      });

      const affected = await AllTransactionsModel.update(
        {
          status: "FAILED",
          apiTransactionId: api.id
        },
        {
          where: {
            id: yourtransid,
            status: "PENDING"
          }
        }
      );
      const affectedRows = Array.isArray(affected) ? affected[0] : affected;
      if (affectedRows === 1) {
        await refundWallet({
          rechargeTransactionId: yourtransid,
        });
        const findTransaction = await AllTransactionsModel.findByPk(yourtransid);

        if (findTransaction.dataValues.paymentTransactionType === "cash") {

          const findPaymentRecord = await PaymentModel.findByPk(
            findTransaction.cashPaymentTransactionId
          );
          await OrderModel.update(
            { status: "FAILED" },
            {
              where: {
                id: findPaymentRecord.orderId,
              },
            }
          );
        }
      }

      return res.status(200).json({
        success: true,
        message: "FAIL callback processed",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Ignored",
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
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

exports.createVendorAttempts = async (req, res) => {
  const {amount,rechargeTransactionId, customer_number, operatorCode, circleCode} = req.query;

  const data={
    customer_number,
    operatorCode,
    circleCode,
    amount,
    rechargeTransactionId
  }

  const response=await mobikwikRechargeService.mobikwik(data);
  return res.status(200).json(response);

  

};