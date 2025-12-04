const allTransactionsModel = require('../../models/RechargeAndBillPaymentTransactionsModels/rechargeAndBillPaymentTransactions');
const subCategoryModel = require('../../models/SubCategoryModel/subCategory');
const sequelize = require('../../util/db_connect');
const { Op } = require('sequelize');

exports.estimateAvgTransaction = async (req, res) => {
  try {
    let type = req.query.type;

    if (!['week', 'month', 'year'].includes(type)) {
      return res.status(200).json({
        success: false,
        statuscode: 0,
        message: 'Please enter a valid type '
      });
    }
    type = type.trim();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    let today = await allTransactionsModel.findOne({
      attributes: [[sequelize.fn('SUM', sequelize.col('amount')), 'todayTotal']],
      where: {
        createdAt: {
          [Op.between]: [todayStart, todayEnd]
        }
      },
      raw: true
    });
    today = today.todayTotal || 0;
    //calcultaing  start date
    let startDate;

    if (type === 'week') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    }

    if (type === 'month') {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
    }

    if (type === 'year') {
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    const periodData = await allTransactionsModel.findOne({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('Amount')), 'totalAmount'],
        [sequelize.fn('COUNT', sequelize.col('Id')), 'transactionCount']
      ],
      where: {
        createdAt: {
          [Op.between]: [startDate, new Date()]
        }
      },
      raw: true
    });
    let avg = 0;

    if (type === 'week') {
      avg = periodData.totalAmount / 7;
    }

    if (type === 'month') {
      avg = periodData.totalAmount / 30;
    }

    if (type === 'year') {
      avg = periodData.totalAmount / 12;
    }
    percentage = ((today - avg) / avg) * 100;
    avg = avg.toFixed(3);
    percentage = percentage.toFixed(3);

    return res.status(200).json({
      success: true,
      statuscode: 1,
      message: 'today transaction overview  data',
      today,
      avg,
      percentage
    });
  } catch (error) {
    console.log(error);
    return res.status(200).json({
      success: false,
      statuscode: 0,

      message: 'Please enter a valid userid '
    });
  }
};

exports.estimateAvgRefund = async (req, res) => {
  try {
    let type = req.query.type;

    if (!['week', 'month', 'year'].includes(type)) {
      return res.status(200).json({
        success: false,
        statuscode: 0,
        message: 'Please enter a valid type'
      });
    }

    type = type.trim();

    // TODAY RANGE
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // ✅ TODAY REFUND TOTAL
    let today = await allTransactionsModel.findOne({
      attributes: [[sequelize.fn('SUM', sequelize.col('amount')), 'todayTotal']],
      where: {
        refundStatus: true,
        createdAt: {
          [Op.between]: [todayStart, todayEnd]
        }
      },
      raw: true
    });

    today = today.todayTotal || 0;

    // PERIOD START DATE
    let startDate;

    if (type === 'week') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    }

    if (type === 'month') {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
    }

    if (type === 'year') {
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    // ✅ PERIOD REFUND DATA
    const periodData = await allTransactionsModel.findOne({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
        [sequelize.fn('COUNT', sequelize.col('Id')), 'transactionCount']
      ],
      where: {
        refundStatus: true,
        createdAt: {
          [Op.between]: [startDate, new Date()]
        }
      },
      raw: true
    });

    let avg = 0;

    if (type === 'week') {
      avg = periodData.totalAmount / 7;
    }

    if (type === 'month') {
      avg = periodData.totalAmount / 30;
    }

    if (type === 'year') {
      avg = periodData.totalAmount / 12; // avg per month
    }

    // HANDLE DIVISION BY ZERO
    avg = avg || 0;

    let percentage = 0;

    if (avg > 0) {
      percentage = ((today - avg) / avg) * 100;
    } else {
      percentage = today > 0 ? 100 : 0;
    }

    avg = avg.toFixed(3);
    percentage = percentage.toFixed(3);

    return res.status(200).json({
      success: true,
      statuscode: 1,
      message: 'today refund overview data',
      today,
      avg,
      percentage
    });
  } catch (error) {
    console.log(error);
    return res.status(200).json({
      success: false,
      statuscode: 0,
      message: 'Something went wrong'
    });
  }
};

exports.getGraphData = async (req, res) => {
  const { type } = req.query;
  let start = new Date();
let end = new Date();
  // always set END of the day
  end.setHours(23, 59, 59, 999);

  if (type === 'today') {
    start.setHours(0, 0, 0, 0);
  } else if (type === 'week') {
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);
  } else if (type === 'month') {
    start.setMonth(start.getMonth() - 1);
    start.setHours(0, 0, 0, 0);
  } else if (type === 'year') {
    start.setFullYear(start.getFullYear() - 1);
    start.setHours(0, 0, 0, 0);
  } else {
    return res.status(400).json({
      success: false,
      message: 'Invalid type. Use today/week/month/year'
    });
  }

  let successCount = 0,
    pendingCount = 0,
    failuareCount = 0;

  try {
    const result = await allTransactionsModel.findAll({
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('status')), 'count']],
      where: {
        createdAt: {
          [Op.between]: [start, end]
        }
      },
      group: ['status']
    });

    if (result.length > 0) {
      /**
       * status = real DB column → can access directly (item.status)
       * count  = aggregated field (COUNT) → only in dataValues (item.dataValues.count)
       *
       * Reason: Sequelize does not map virtual/aggregated fields as direct properties.
       * Use raw: true if you want flat results.
       */
      result.forEach((item) => {
        if (item.status === 'success') successCount = item.dataValues.count;
        if (item.status === 'pending') pendingCount = item.dataValues.count;
        if (item.status === 'failed') failuareCount = item.dataValues.count;
      });
    }

    return res.status(200).json({
      success: true,
      statuscode: 1,
      message: 'today refund overview data',
      successCount,
      pendingCount,
      failuareCount
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      statuscode: 0,
      message: 'Internal server error'
    });
  }
};

exports.getLastFiveTransactions = async (req, res) => {
  try {
    const lastFive = await allTransactionsModel.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: subCategoryModel,
          attributes: ['name'] // only return the name
        }
      ]
    });

    return res.status(200).json({
      success: true,
      statuscode: 1,
      message: 'transaction fetch successfully ',
      transactionData: lastFive
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 0,
      message: 'Something went wrong'
    });
  }
};
