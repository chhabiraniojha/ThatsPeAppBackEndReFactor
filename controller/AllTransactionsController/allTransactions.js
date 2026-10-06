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



const TransactionHistory = require(
    "../../models/RechargeAndBillPaymentTransactionsModels/rechargeAndBillPaymentTransactions"
);

const Order = require("../../models/OrderModel/order");
const SubCategory = require("../../models/SubCategoryModel/subCategory");
const OperatorData = require("../../models/OperatorDataModel/operatorData");
const CircleData = require("../../models/CircleDataModel/circleData");

function buildWhereCondition(
    startingDate,
    endingDate,
    serviceType,
    paymentMethod,
    status,
    userId
) {
    const whereCondition = {
        userId,
    };

    // Date filter
    if (startingDate && endingDate) {
        whereCondition.createdAt = {
            [Op.between]: [startingDate, endingDate],
        };
    } else if (startingDate) {
        whereCondition.createdAt = {
            [Op.gte]: startingDate,
        };
    } else if (endingDate) {
        whereCondition.createdAt = {
            [Op.lte]: endingDate,
        };
    }

    // Service / SubCategory filter
    if (serviceType) {
        whereCondition["$order.serviceType$"] = serviceType;
    }

    // Payment method filter
    if (paymentMethod) {
        whereCondition.paymentMethod = paymentMethod;
    }

    // Transaction status filter
    if (status) {
        whereCondition.status = status;
    }

    return whereCondition;
}

exports.getAllTransactions = async (req, res, next) => {
    const userId = req.user?.id;

    const {
        startingDate,
        endingDate,
        serviceType,
        paymentMethod,
        status,
        pageNumber = 1,
    } = req.query;

    try {
        // Authentication check
        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized user",
                success: false,
            });
        }

        // Validate page number
        const page = Number(pageNumber);

        if (!Number.isInteger(page) || page < 1) {
            return res.status(400).json({
                message: "Invalid page number",
                success: false,
            });
        }

        // Build filters
        const whereCondition = buildWhereCondition(
            startingDate,
            endingDate,
            serviceType,
            paymentMethod,
            status,
            userId
        );

        const limit = 5;
        const offset = (page - 1) * limit;

        // Fetch transactions with total count
        const {
            rows: transactionDetails,
            count: totalRecords,
        } = await TransactionHistory.findAndCountAll({
            where: whereCondition,

            include: [
                {
                    model: Order,
                    as: "order",
                    required: true,
                    attributes: [
                        "id",
                        "serviceType",
                        "operatorId",
                        "circleId",
                        "fields",
                        "amount",
                        "operatorDiscount",
                        "referralDiscount",
                        "discountedAmount",
                        "convenienceFee",
                        "finalPayableAmount",
                        "paymentMethod",
                        "walletAmount",
                        "onlinePaidAmount",
                        "status",
                        "createdAt",
                    ],

                    include: [
                        {
                            model: SubCategory,
                            as: "service",
                            attributes: [
                                "id",
                                "name",
                                "icon",
                            ],
                        },
                        {
                            model: OperatorData,
                            as: "operator",
                            attributes: [
                                "id",
                                "name",
                                "operatorImage",
                                "status",
                            ],
                        },
                        {
                            model: CircleData,
                            as: "circle",
                            required: false,
                            attributes: [
                                "id",
                                "name",
                                "status",
                            ],
                        },
                    ],
                },
            ],

            order: [["createdAt", "DESC"]],
            offset,
            limit,
            distinct: true,
        });

        const totalPages = Math.ceil(totalRecords / limit);

        return res.status(200).json({
            message: "Transaction details fetched successfully",
            success: true,
            transactionDetails,
            pagination: {
                currentPage: page,
                limit,
                totalRecords,
                totalPages,
            },
        });
    } catch (error) {
        next(error);
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

 