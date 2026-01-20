const userModel = require('../../models/UserModels/UserSchema/user');
const walletModel = require('../../models/WalletModels/WalletSchema/wallet');
const walletTransactionModel = require('../../models/WalletModels/Wallet Transaction/walletTransaction');
const transactionModel = require('../../models/RechargeAndBillPaymentTransactionsModels/rechargeAndBillPaymentTransactions');
const { Op } = require('sequelize');

// get all user data wwith pagination and with serch functionality
exports.getAllUser = async (req, res) => {
  try {
    const { search = '', page = 1 } = req.query;
    const limit = 10;

    const offset = (page - 1) * limit;
    // where condition  both check the serch when need and  normal all data by pagination
    const whereCondition = search
      ? {
          [Op.or]: [
            { name: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } },
            { mobileNo: { [Op.like]: `%${search}%` } }
          ]
        }
      : {};

    const userData = await userModel.findAndCountAll({
      where: whereCondition,
      limit: Number(limit),
      offset: Number(offset),
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['password'] }
    });
    const users = userData.rows;
    let count = userData.count;
    count = Math.ceil(count / limit);

    return res.status(200).json({
      success: true,
      statuscode: 1,
      message: 'user data get successfully',
      users,
      count
    });
  } catch (error) {
    console.log(error);
    return res.status(200).json({
      success: false,
      statuscode: 0,
      message: ' something want wrong'
    });
  }
};

exports.getUserFullDetails = async (req, res) => {
  try {
    const userId = req.query.id;
    const user = await userModel.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(200).json({
        success: false,
        statuscode: 0,
        user,
        userId,
        message: 'Please enter a valid userid '
      });
    }
    let walletAmount = await walletModel.findOne({ attributes: ['amount'], where: { userId } });
    walletAmount = walletAmount?.amount;

    let lastActivity = await transactionModel.findOne({
      attributes: ['createdAt'],
      where: { userId: userId },
      order: [['createdAt', 'DESC']]
    });
    if (!(lastActivity && lastActivity.createdAt)) {
      return res.status(200).json({
        success: false,
        statuscode: 0,
        message: 'No transaction found'
      });
    }
    lastActivity = lastActivity.createdAt;
    let totalData = await transactionModel.findAll({
      where: { userId: userId },
      attributes: [[transactionModel.sequelize.fn('SUM', transactionModel.sequelize.col('Amount')), 'totalAmount']],
      raw: true
    });
    totalData = (totalData[0].totalAmount).toFixed(3);;


    const firstTransaction = await transactionModel.findOne({
      attributes: ['createdAt'],
      where: { userId: userId },
      order: [['createdAt', 'ASC']],
      raw: true
    });

    const lastTransaction = lastActivity;
    const firstDate = new Date(firstTransaction.createdAt);
    const lastDate = new Date(lastTransaction);

    const monthsActive = (lastDate.getFullYear() - firstDate.getFullYear()) * 12 + (lastDate.getMonth() - firstDate.getMonth()) + 1;
    const avgPerMonth = (totalData  / monthsActive).toFixed(3);

    return res.status(200).json({
      success: true,
      statuscode: 1,
      message: 'user data get successfully ',
      walletAmount,
      lastActivity,
      avgPerMonth,
      
      totalTranscation:totalData
    });
  } catch (error) {
    console.log(error);
    return res.status(200).json({
      success: false,
      statuscode: 0,
      message: 'Something want wrong '
    });
  }
};

exports.getLastFiveTransactions = async (req, res) => {
  try {
    const { userId } = req.query; // or req.params.userId depending on route
        const user = await userModel.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(200).json({
        success: false,
        statuscode: 0,
        user,
        
        message: 'Please enter a valid userid '
      });
    }

    const lastFiveTransactions = await transactionModel.findAll({
      where: { userId: userId },
      order: [["createdAt", "DESC"]],
      limit: 5,
      raw: true,
    });
      let walletId = await walletModel.findOne({ attributes: ['id'], where: { userId } });

    const lastFiveWalletTransactions = await walletTransactionModel.findAll({
      where: { walletId: walletId.id },
      order: [["createdAt", "DESC"]],
      limit: 5,
      raw: true,
    });

    return res.status(200).json({
      success: true,
      statuscode: 1,
      message: "Last 5 transactions fetched successfully",
      allTransactions: lastFiveTransactions,
      walletTransactions: lastFiveWalletTransactions,
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      statuscode: 0,
      message: "Server error",
    });
  }
};

