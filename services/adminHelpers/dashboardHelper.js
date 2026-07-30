const { Op, fn, col, literal,QueryTypes } = require("sequelize");
const RechargeAndBillPayTransaction = require("../../models/RechargeAndBillPaymentTransactionsModels/rechargeAndBillPaymentTransactions")
const User = require("../../models/UserModels/UserSchema/user")
const sequelize = require("../../util/db_connect");

/**
 * Financial Overview
 * Returns:
 *  - Total Transaction Value
 *  - Total Company Commission
 *  - Total Distributed Commission
 *  - Total Refund Amount
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}
async function getFinancialOverview(startDate, endDate) {

    const result = await RechargeAndBillPayTransaction.findOne({

        attributes: [

            [
                fn(
                    "COALESCE",
                    fn("SUM", col("amount")),
                    0
                ),
                "totalTransactionValue"
            ],

            [
                fn(
                    "COALESCE",
                    fn("SUM", col("commission")),
                    0
                ),
                "totalCommissionEarned"
            ],

            [
                fn(
                    "COALESCE",
                    fn("SUM", col("distributedCommission")),
                    0
                ),
                "totalDistributedCommission"
            ],

            [
                fn(
                    "COALESCE",
                    fn(
                        "SUM",
                        literal(`
                            CASE
                                WHEN refundStatus = true
                                THEN amount
                                ELSE 0
                            END
                        `)
                    ),
                    0
                ),
                "totalRefundAmount"
            ]

        ],

        where: {

            status: "SUCCESS",

            createdAt: {
                [Op.between]: [startDate, endDate]
            }

        },

        raw: true

    });

    return {
        totalTransactionValue: Number(result.totalTransactionValue),
        totalCommissionEarned: Number(result.totalCommissionEarned),
        totalDistributedCommission: Number(result.totalDistributedCommission),
        totalRefundAmount: Number(result.totalRefundAmount)
    };

}

/**
 * Status Overview
 */
async function getStatusOverview(startDate, endDate) {

    const result = await RechargeAndBillPayTransaction.findOne({

        attributes: [

            [
                fn(
                    "SUM",
                    literal(`CASE WHEN status='SUCCESS' THEN 1 ELSE 0 END`)
                ),
                "success"
            ],

            [
                fn(
                    "SUM",
                    literal(`CASE WHEN status='FAILED' THEN 1 ELSE 0 END`)
                ),
                "failed"
            ],

            [
                fn(
                    "SUM",
                    literal(`CASE WHEN status='PENDING' THEN 1 ELSE 0 END`)
                ),
                "pending"
            ],

            [
                fn(
                    "SUM",
                    literal(`CASE WHEN status='PROCESSING' THEN 1 ELSE 0 END`)
                ),
                "processing"
            ],

            [
                fn(
                    "SUM",
                    literal(`CASE WHEN status='CREATED' THEN 1 ELSE 0 END`)
                ),
                "created"
            ]

        ],

        where: {

            createdAt: {
                [Op.between]: [startDate, endDate]
            }

        },

        raw: true

    });

    return {

        success: Number(result.success),

        failed: Number(result.failed),

        pending: Number(result.pending),

        processing: Number(result.processing),

        created: Number(result.created)

    };

}

async function getOperatorSummary(startDate, endDate) {

    const result = await RechargeAndBillPayTransaction.findAll({

        attributes: [

            "operator",

            [
                fn("COUNT", col("id")),
                "transactions"
            ],

            [
                fn("SUM",
                    literal("CASE WHEN status='SUCCESS' THEN 1 ELSE 0 END")
                ),
                "success"
            ],

            [
                fn("SUM",
                    literal("CASE WHEN status='FAILED' THEN 1 ELSE 0 END")
                ),
                "failed"
            ],

            [
                fn("SUM",
                    literal("CASE WHEN status='PENDING' THEN 1 ELSE 0 END")
                ),
                "pending"
            ],

            [
                fn("SUM",
                    literal("CASE WHEN status='PROCESSING' THEN 1 ELSE 0 END")
                ),
                "processing"
            ],

            [
                fn("SUM",
                    literal("CASE WHEN status='CREATED' THEN 1 ELSE 0 END")
                ),
                "created"
            ],

            [
                fn("SUM",
                    literal("CASE WHEN status='SUCCESS' THEN amount ELSE 0 END")
                ),
                "totalAmount"
            ],

            [
                fn("SUM",
                    literal("CASE WHEN status='SUCCESS' THEN commission ELSE 0 END")
                ),
                "totalCommission"
            ]

        ],

        where: {

            createdAt: {
                [Op.between]: [startDate, endDate]
            }

        },

        group: ["operator"],

        order: [
            [literal("totalAmount"), "DESC"]
        ],

        raw: true

    });

    return result.map(item => ({

        operator: item.operator,

        transactions: Number(item.transactions),

        success: Number(item.success),

        failed: Number(item.failed),

        pending: Number(item.pending),

        processing: Number(item.processing),

        created: Number(item.created),

        totalAmount: Number(item.totalAmount),

        totalCommission: Number(item.totalCommission)

    }));

}

async function getPaymentModeSummary(startDate, endDate) {

    const result = await RechargeAndBillPayTransaction.findAll({

        attributes: [

            [
                col("paymentTransactionType"),
                "paymentMode"
            ],

            [
                fn("COUNT", col("id")),
                "transactions"
            ],

            [
                fn("SUM", literal("CASE WHEN status='SUCCESS' THEN 1 ELSE 0 END")),
                "success"
            ],

            [
                fn("SUM", literal("CASE WHEN status='FAILED' THEN 1 ELSE 0 END")),
                "failed"
            ],

            [
                fn("SUM", literal("CASE WHEN status='PENDING' THEN 1 ELSE 0 END")),
                "pending"
            ],

            [
                fn("SUM", literal("CASE WHEN status='PROCESSING' THEN 1 ELSE 0 END")),
                "processing"
            ],

            [
                fn("SUM", literal("CASE WHEN status='CREATED' THEN 1 ELSE 0 END")),
                "created"
            ],

            [
                fn("SUM", literal("CASE WHEN status='SUCCESS' THEN amount ELSE 0 END")),
                "totalAmount"
            ],

            [
                fn("SUM", literal("CASE WHEN status='SUCCESS' THEN commission ELSE 0 END")),
                "totalCommission"
            ]

        ],

        where: {

            createdAt: {
                [Op.between]: [startDate, endDate]
            }

        },

        group: ["paymentTransactionType"],

        order: [
            [literal("totalAmount"), "DESC"]
        ],

        raw: true

    });

    return result.map(item => ({

        paymentMode: item.paymentMode,

        transactions: Number(item.transactions),

        success: Number(item.success),

        failed: Number(item.failed),

        pending: Number(item.pending),

        processing: Number(item.processing),

        created: Number(item.created),

        totalAmount: Number(item.totalAmount),

        totalCommission: Number(item.totalCommission)

    }));

}
async function getDailyRevenueChart(period, startDate, endDate) {

    let groupExpression;
    let orderExpression;

    switch (period) {

        case "today":
            groupExpression = "HOUR(createdAt)";
            orderExpression = "HOUR(createdAt)";
            break;

        case "year":
            groupExpression = "MONTH(createdAt)";
            orderExpression = "MONTH(createdAt)";
            break;

        default: // week, month, custom
            groupExpression = "DATE(createdAt)";
            orderExpression = "DATE(createdAt)";
    }

    const result = await RechargeAndBillPayTransaction.findAll({

        attributes: [

            [
                literal(groupExpression),
                "label"
            ],

            [
                fn(
                    "COALESCE",
                    fn(
                        "SUM",
                        literal("CASE WHEN status='SUCCESS' THEN amount ELSE 0 END")
                    ),
                    0
                ),
                "revenue"
            ]

        ],

        where: {

            createdAt: {
                [Op.between]: [startDate, endDate]
            }

        },

        group: [
            literal(groupExpression)
        ],

        order: [
            [literal(orderExpression), "ASC"]
        ],

        raw: true

    });

    const revenueMap = new Map();

    result.forEach(item => {

        revenueMap.set(
            String(item.label),
            Number(item.revenue)
        );

    });

    // ================================
    // TODAY (24 Hours)
    // ================================

    if (period === "today") {

        const chart = [];

        for (let hour = 0; hour < 24; hour++) {

            chart.push({

                label: `${hour}:00`,

                revenue: revenueMap.get(String(hour)) || 0

            });

        }

        return chart;

    }

    // ================================
    // YEAR (12 Months)
    // ================================

    if (period === "year") {

        const months = [
            "Jan", "Feb", "Mar", "Apr",
            "May", "Jun", "Jul", "Aug",
            "Sep", "Oct", "Nov", "Dec"
        ];

        const chart = [];

        for (let month = 1; month <= 12; month++) {

            chart.push({

                label: months[month - 1],

                revenue: revenueMap.get(String(month)) || 0

            });

        }

        return chart;

    }

    // ================================
    // WEEK / MONTH / CUSTOM
    // ================================

    const chart = [];

    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {

        const date = formatDate(current);

        chart.push({

            label: date,

            revenue: revenueMap.get(date) || 0

        });

        current.setDate(current.getDate() + 1);

    }

    return chart;

}


async function getDailyTransactionChart(period, startDate, endDate) {

    let groupExpression;
    let orderExpression;

    switch (period) {

        case "today":
            groupExpression = "HOUR(createdAt)";
            orderExpression = "HOUR(createdAt)";
            break;

        case "year":
            groupExpression = "MONTH(createdAt)";
            orderExpression = "MONTH(createdAt)";
            break;

        default:
            groupExpression = "DATE(createdAt)";
            orderExpression = "DATE(createdAt)";
    }

    const result = await RechargeAndBillPayTransaction.findAll({

        attributes: [

            [
                literal(groupExpression),
                "label"
            ],

            [
                fn("COUNT", literal("*")),
                "transactions"
            ]

        ],

        where: {

            createdAt: {
                [Op.between]: [startDate, endDate]
            }

        },

        group: [
            literal(groupExpression)
        ],

        order: [
            [literal(orderExpression), "ASC"]
        ],

        raw: true

    });

    const transactionMap = new Map();

    result.forEach(item => {

        transactionMap.set(

            String(item.label),

            Number(item.transactions)

        );

    });

    // ===============================
    // TODAY
    // ===============================

    if (period === "today") {

        const chart = [];

        for (let hour = 0; hour < 24; hour++) {

            chart.push({

                label: `${hour}:00`,

                transactions: transactionMap.get(String(hour)) || 0

            });

        }

        return chart;

    }

    // ===============================
    // YEAR
    // ===============================

    if (period === "year") {

        const months = [

            "Jan", "Feb", "Mar", "Apr",
            "May", "Jun", "Jul", "Aug",
            "Sep", "Oct", "Nov", "Dec"

        ];

        const chart = [];

        for (let month = 1; month <= 12; month++) {

            chart.push({

                label: months[month - 1],

                transactions: transactionMap.get(String(month)) || 0

            });

        }

        return chart;

    }

    // ===============================
    // WEEK / MONTH / CUSTOM
    // ===============================

    const chart = [];

    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {

        const date = formatDate(current);

        chart.push({

            label: date,

            transactions: transactionMap.get(date) || 0

        });

        current.setDate(current.getDate() + 1);

    }

    return chart;

}


async function getTopUsers(startDate, endDate) {
    const query = `
        SELECT
            t.userId,
            u.name,
            u.mobileNo,
            COUNT(t.id) AS transactions,
            COALESCE(
                SUM(
                    CASE
                        WHEN t.status = 'SUCCESS'
                        THEN t.amount
                        ELSE 0
                    END
                ),
                0
            ) AS totalAmount,
            COALESCE(
                SUM(
                    CASE
                        WHEN t.status = 'SUCCESS'
                        THEN t.commission
                        ELSE 0
                    END
                ),
                0
            ) AS totalCommission
        FROM AllTransactions t
        INNER JOIN Users u
            ON u.id = t.userId
        WHERE t.createdAt BETWEEN :startDate AND :endDate
        GROUP BY
            t.userId,
            u.name,
            u.mobileNo
        ORDER BY totalAmount DESC
        LIMIT 10;
    `;

    const result = await sequelize.query(query, {
        replacements: {
            startDate,
            endDate
        },
        type: QueryTypes.SELECT
    });

    return result.map(item => ({
        userId: item.userId,
        name: item.name,
        mobileNo: item.mobileNo,
        transactions: Number(item.transactions),
        totalAmount: Number(item.totalAmount),
        totalCommission: Number(item.totalCommission)
    }));
}
module.exports = {

    getFinancialOverview,

    getStatusOverview,

    getOperatorSummary,

    getPaymentModeSummary,

    getDailyRevenueChart,

    getDailyTransactionChart,

    getTopUsers

};