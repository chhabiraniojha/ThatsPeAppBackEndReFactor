const {
    getFinancialOverview,
    getStatusOverview,
    getOperatorSummary,
    getPaymentModeSummary,
    getDailyRevenueChart,
    getDailyTransactionChart,
    getTopUsers
} = require("../adminHelpers/dashboardHelper");

const {
    getDateRange
} = require("../adminHelpers/dateRangeHelper");

const {
    calculateGrowth
} = require("../adminHelpers/growthHelper");

async function getDashboard(period, from = null, to = null) {

    const {
        currentStart,
        currentEnd,
        previousStart,
        previousEnd
    } = getDateRange(period, from, to);

    // const [
    //     currentFinancial,
    //     previousFinancial,
    //     statusOverview
    // ] = await Promise.all([

    //     getFinancialOverview(
    //         currentStart,
    //         currentEnd
    //     ),

    //     getFinancialOverview(
    //         previousStart,
    //         previousEnd
    //     ),

    //     getStatusOverview(
    //         currentStart,
    //         currentEnd
    //     )

    // ]);
    const currentFinancial = await getFinancialOverview(
        currentStart,
        currentEnd
    );

    const previousFinancial = await getFinancialOverview(
        previousStart,
        previousEnd
    );

    const statusOverview = await getStatusOverview(
        currentStart,
        currentEnd
    );
    const operatorSummary = await getOperatorSummary(
        currentStart,
        currentEnd
    );
    const paymentModeSummary = await getPaymentModeSummary(
        currentStart,
        currentEnd
    );
    const dailyRevenueChart = await getDailyRevenueChart(
        period,
        currentStart,
        currentEnd
    );
    const dailyTransactionChart = await getDailyTransactionChart(

        period,

        currentStart,

        currentEnd

    );
    const topUsers = await getTopUsers(

        currentStart,

        currentEnd

    );
    return {

        financialOverview: {

            totalTransactionValue:
                currentFinancial.totalTransactionValue,

            totalCommissionEarned:
                currentFinancial.totalCommissionEarned,

            totalDistributedCommission:
                currentFinancial.totalDistributedCommission,

            totalRefundAmount:
                currentFinancial.totalRefundAmount,

            growth: {

                transactionValue:
                    calculateGrowth(
                        currentFinancial.totalTransactionValue,
                        previousFinancial.totalTransactionValue
                    ),

                commission:
                    calculateGrowth(
                        currentFinancial.totalCommissionEarned,
                        previousFinancial.totalCommissionEarned
                    ),

                distributedCommission:
                    calculateGrowth(
                        currentFinancial.totalDistributedCommission,
                        previousFinancial.totalDistributedCommission
                    ),

                refund:
                    calculateGrowth(
                        currentFinancial.totalRefundAmount,
                        previousFinancial.totalRefundAmount
                    )

            }

        },

        statusOverview,
        operatorSummary,
        paymentModeSummary,
        dailyRevenueChart,
        dailyTransactionChart,
        topUsers

    };

}

module.exports = {
    getDashboard
};