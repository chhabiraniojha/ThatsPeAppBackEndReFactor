const allTransactionsModel = require('../../models/RechargeAndBillPaymentTransactionsModels/rechargeAndBillPaymentTransactions');
// const allTransactionsModel = require('../../models/RechargeAndBillPaymentTransactionsModels/rechargeAndBillPaymentTransationDummy')
const subcategoryModel = require('../../models/SubCategoryModel/subCategory');
const { Op } = require('sequelize');
const walletTransactionModel = require('../../models/WalletModels/Wallet Transaction/walletTransaction');
const walletModel = require('../../models/WalletModels/WalletSchema/wallet');
const operatorModel = require('../../models/OperatorDataModel/operatorData');
const userModel = require('../../models/UserModels/UserSchema/user');
const availableAPIIdModel = require('../../models/APIModels/api');
const subCategoryModel = require('../../models/SubCategoryModel/subCategory');
const { all } = require('axios');

function buildWhereCondition(startingDate, endingDate, subcategoryId, userId, paymentTransactionType) {
  let whereCondition = {};

  if (userId) {
    whereCondition.userId = userId;
  }
  if (startingDate && endingDate) {
    whereCondition.createdAt = {
      [Op.between]: [startingDate, endingDate]
    };
  }
  if (subcategoryId) {
    // Parse subcategoryId if it's a JSON string
    if (typeof subcategoryId === 'string') {
      try {
        subcategoryId = JSON.parse(subcategoryId);
      } catch (error) {
        console.error('Error parsing subcategoryId:', error);
      }
    }

    if (Array.isArray(subcategoryId) && subcategoryId.length > 0) {
      whereCondition.subCategoryId = {
        [Op.in]: subcategoryId
      };
    } else if (subcategoryId) {
      whereCondition.subCategoryId = subcategoryId;
    }
  }

  // Handle paymentTransactionType filter
  if (paymentTransactionType) {
    // If it's a JSON string, parse it
    if (typeof paymentTransactionType === 'string') {
      try {
        paymentTransactionType = JSON.parse(paymentTransactionType);
      } catch (error) {
        console.error('Error parsing paymentTransactionType:', error);
      }
    }

    if (Array.isArray(paymentTransactionType) && paymentTransactionType.length > 0) {
      whereCondition.paymentTransactionType = {
        [Op.in]: paymentTransactionType
      };
    } else if (paymentTransactionType) {
      whereCondition.paymentTransactionType = paymentTransactionType;
    }
  }

  console.log(whereCondition, 'Generated whereCondition');
  return whereCondition;
}

exports.getAllTransactions = async (req, res) => {
  const userId = req.user.id;
  const { startingDate, endingDate, subcategoryId, pageNumber, paymentTransactionType } = req.query;

  try {
    let whereCondition = {};
    if (!startingDate && !endingDate && !subcategoryId && !paymentTransactionType) {
      whereCondition = {};
    }

    whereCondition = buildWhereCondition(startingDate, endingDate, subcategoryId, userId, paymentTransactionType);

    const transactionDetails = await allTransactionsModel.findAll({
      where: whereCondition,
      order: [['createdAt', 'DESC']],
      offset: (pageNumber - 1) * 5,
      limit: 5
    });
    // console.log(transactionDetails)
    // adding operator icon in to transation object
    let operatorNames = new Set();
    transactionDetails.forEach((tx) => operatorNames.add(tx.operator));
    // console.log(operatorNames)

    const operatorDetails = await operatorModel.findAll({
      where: { name: [...operatorNames] },
      attributes: ['name', 'operator_image']
    });
    // console.log(operatorDetails)

    const operatorMap = {};
    operatorDetails.forEach((op) => {
      operatorMap[op.name] = op.operator_image;
    });
    console.log(operatorMap);
    transactionDetails.forEach((transaction) => {
      transaction.dataValues.icon = operatorMap[transaction.dataValues.operator] || null;
    });
    // console.log(transactionDetails);

    return res.status(200).json({
      message: 'Transaction details fetched successfully',
      success: true,
      statuscode: 1,
      transactionDetails
    });
  } catch (error) {
    // console.log(error);
    return res.status(500).json({ message: 'Internal Server Error', success: false, error });
  }
};

exports.getSpexificTransaction = async (req, res) => {
  const { transactionId } = req.query;
  console.log(transactionId, 'transactionId');
  let allDetails = {};
  let transactionDetails;
  let walletTransactionDetails;
  let paymentTransactionDetails;
  let userDetails;
  let userObject;
  let refundDetails = null;
  let rechargeApiDetails;
  let rechargeType;
  try {
    transactionDetails = await allTransactionsModel.findOne({
      where: { id: transactionId }
    });
    if (!transactionDetails) {
      return res.status(200).json({
        message: 'Transaction not found',
        success: false,
        statuscode: 0
      });
    }
    userDetails = await userModel.findOne({
      where: { id: transactionDetails.userId }
    });
    if (userDetails) {
      userObject = {
        name: userDetails.name,
        email: userDetails.email,
        phone: userDetails.mobileNo
      };
    }
    if (transactionDetails.refundStatus) {
      refundDetails = await walletTransactionModel.findOne({
        where: {
          transactionId: transactionDetails.Id,
          transactionType: 'Refund'
        }
      });
      let afterRefundAmount = refundDetails.startingBalance + refundDetails.amount;
      refundDetails.dataValues.afterRefundAmount = afterRefundAmount;
    }

    if (transactionDetails.paymentTransactionType === 'wallet') {
      walletTransactionDetails = await walletTransactionModel.findOne({
        where: {
          id: transactionDetails.walletPaymentTransactionId
        }
      });
    } else if (transactionDetails.paymentTransactionType === 'cash') {
      paymentTransactionDetails = await paymentTransactionModel.findOne({
        where: {
          id: transactionDetails.cashPaymentTransactionId
        }
      });
    }
    rechargeApiDetails = await availableAPIIdModel.findByPk(transactionDetails.apiTransactionId);
    rechargeType = await subCategoryModel.findByPk(transactionDetails.subCategoryId, { attributes: ['name'] });

    transactionDetails.dataValues.rechargeApiName = rechargeApiDetails ? rechargeApiDetails.name : null;
    transactionDetails.dataValues.rechargeTypeName = rechargeType ? rechargeType.name : null;

    return res.status(200).json({
      message: 'Transaction details fetched successfully',
      success: true,
      statuscode: 1,
      transactionDetails,
      walletTransactionDetails,
      paymentTransactionDetails,
      userObject,
      refundDetails
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal Server Error', success: false, error: error });
  }
};

 