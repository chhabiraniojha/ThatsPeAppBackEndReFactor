const {
    getDateRange
} = require("../adminHelpers/dateRangeHelper");

const {
    getUserMetrics,
    getSignupComparison,
    getSignupTrend
} = require("../adminHelpers/userMetricsHelper");





async function getUserMetricsService(period = "today", from, to) {

    const {
        currentStart,
        currentEnd,
        previousStart,
        previousEnd
    } = getDateRange(
        period,
        from,
        to
    );


    const userMetrics =
        await getUserMetrics(
            currentStart,
            currentEnd
        );


    const signupComparison =
        await getSignupComparison(
            currentStart,
            currentEnd,
            previousStart,
            previousEnd
        );


    const signupTrend =
        await getSignupTrend(
            period,
            currentStart,
            currentEnd
        );


    return {
        ...userMetrics,
        signupComparison,
        signupTrend
    };
}


module.exports = {
    getUserMetricsService
};