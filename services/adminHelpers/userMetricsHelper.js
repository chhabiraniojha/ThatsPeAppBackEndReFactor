const sequelize = require("../../util/db_connect");
const { QueryTypes } = require("sequelize");


/**
 * Get User Metrics
 *
 * @param {string} startDate
 * @param {string} endDate
 * @returns {Object}
 */
async function getUserMetrics(startDate, endDate) {

    /*
    |--------------------------------------------------------------------------
    | 1. USER OVERVIEW
    |--------------------------------------------------------------------------
    */

    const overviewQuery = `
        SELECT

            COUNT(*) AS totalUsers,

            SUM(
                CASE
                    WHEN status = 'active'
                    THEN 1
                    ELSE 0
                END
            ) AS activeUsers,

            SUM(
                CASE
                    WHEN status = 'inactive'
                    THEN 1
                    ELSE 0
                END
            ) AS inactiveUsers,

            SUM(
                CASE
                    WHEN createdAt BETWEEN :startDate AND :endDate
                    THEN 1
                    ELSE 0
                END
            ) AS periodSignups

        FROM Users;
    `;


    const overviewResult = await sequelize.query(
        overviewQuery,
        {
            replacements: {
                startDate,
                endDate
            },
            type: QueryTypes.SELECT
        }
    );


    /*
    |--------------------------------------------------------------------------
    | 2. USERS CREATED IN SELECTED PERIOD
    |    + THEIR SUCCESSFUL TRANSACTION ACTIVITY
    |--------------------------------------------------------------------------
    */

    const usersQuery = `
        SELECT
            u.id AS userId,
            u.name,
            u.mobileNo,
            u.email,
            u.status,
            u.createdAt AS signupAt,

            COUNT(
                CASE
                    WHEN t.status = 'SUCCESS'
                    THEN t.id
                END
            ) AS transactionCount,

            COALESCE(
                SUM(
                    CASE
                        WHEN t.status = 'SUCCESS'
                        THEN t.amount
                        ELSE 0
                    END
                ),
                0
            ) AS transactionAmount

        FROM Users u

        LEFT JOIN AllTransactions t
            ON t.userId = u.id
            AND t.createdAt >= u.createdAt
            AND t.createdAt <= :endDate

        WHERE u.createdAt BETWEEN :startDate AND :endDate

        GROUP BY
            u.id,
            u.name,
            u.mobileNo,
            u.email,
            u.status,
            u.createdAt

        ORDER BY u.createdAt DESC;
    `;


    const usersResult = await sequelize.query(
        usersQuery,
        {
            replacements: {
                startDate,
                endDate
            },
            type: QueryTypes.SELECT
        }
    );


    /*
    |--------------------------------------------------------------------------
    | 3. OVERVIEW VALUES
    |--------------------------------------------------------------------------
    */

    const stats = overviewResult[0];


    const totalNewUsers =
        Number(stats.periodSignups || 0);


    const activeUsers =
        Number(stats.activeUsers || 0);


    const inactiveUsers =
        Number(stats.inactiveUsers || 0);


    const totalUsers =
        Number(stats.totalUsers || 0);


    /*
    |--------------------------------------------------------------------------
    | 4. NEW USERS WHO DID TRANSACTION
    |--------------------------------------------------------------------------
    */

    const transactedUsers = usersResult.filter(
        user => Number(user.transactionCount || 0) > 0
    ).length;


    const nonTransactedUsers =
        totalNewUsers - transactedUsers;


    /*
    |--------------------------------------------------------------------------
    | 5. CONVERSION RATE
    |--------------------------------------------------------------------------
    */

    const conversionRate =
        totalNewUsers > 0
            ? Number(
                (
                    (transactedUsers / totalNewUsers) * 100
                ).toFixed(2)
            )
            : 0;


    /*
    |--------------------------------------------------------------------------
    | 6. SUCCESSFUL TRANSACTION SUMMARY
    |--------------------------------------------------------------------------
    |
    | These values are calculated from the same usersResult.
    | No additional database query is required.
    |
    */

    const successfulTransactionCount =
        usersResult.reduce(
            (sum, user) =>
                sum + Number(user.transactionCount || 0),
            0
        );


    const successfulTransactionAmount =
        usersResult.reduce(
            (sum, user) =>
                sum + Number(user.transactionAmount || 0),
            0
        );


    /*
    |--------------------------------------------------------------------------
    | 7. AVERAGE TRANSACTIONS PER TRANSACTING USER
    |--------------------------------------------------------------------------
    */

    const averageTransactionsPerTransactingUser =
        transactedUsers > 0
            ? Number(
                (
                    successfulTransactionCount /
                    transactedUsers
                ).toFixed(2)
            )
            : 0;


    /*
    |--------------------------------------------------------------------------
    | 8. AVERAGE TRANSACTION VALUE
    |--------------------------------------------------------------------------
    */

    const averageTransactionValue =
        successfulTransactionCount > 0
            ? Number(
                (
                    successfulTransactionAmount /
                    successfulTransactionCount
                ).toFixed(2)
            )
            : 0;


    /*
    |--------------------------------------------------------------------------
    | 9. FORMAT USER LIST
    |--------------------------------------------------------------------------
    */

    const users = usersResult.map(user => ({

        userId: user.userId,

        name: user.name,

        mobileNo: user.mobileNo,

        email: user.email,

        status: user.status,

        signupAt: user.signupAt,

        hasTransaction:
            Number(user.transactionCount || 0) > 0,

        transactionCount:
            Number(user.transactionCount || 0),

        transactionAmount:
            Number(user.transactionAmount || 0)

    }));


    /*
    |--------------------------------------------------------------------------
    | 10. FINAL RESPONSE
    |--------------------------------------------------------------------------
    */

    return {

        overview: {

            totalUsers,

            periodSignups:
                totalNewUsers,

            activeUsers,

            inactiveUsers

        },


        newUserTransactionMetrics: {

            // New users in selected period
            newUsers:
                totalNewUsers,

            // New users who completed at least
            // one successful transaction
            transactedUsers,

            // New users with zero successful transactions
            nonTransactedUsers,

            // Percentage of new users who transacted
            conversionRate,

            // Total successful transactions
            // generated by these new users
            successfulTransactionCount,

            // Total successful transaction amount
            // generated by these new users
            successfulTransactionAmount,

            // Average successful transactions
            // per transacting new user
            averageTransactionsPerTransactingUser,

            // Average value of each successful transaction
            averageTransactionValue

        },


        users

    };
}


async function getSignupComparison(
    currentStart,
    currentEnd,
    previousStart,
    previousEnd
) {

    const query = `
        SELECT

            SUM(
                CASE
                    WHEN createdAt BETWEEN :currentStart AND :currentEnd
                    THEN 1
                    ELSE 0
                END
            ) AS currentPeriodSignups,

            SUM(
                CASE
                    WHEN createdAt BETWEEN :previousStart AND :previousEnd
                    THEN 1
                    ELSE 0
                END
            ) AS previousPeriodSignups

        FROM Users;
    `;


    const result = await sequelize.query(
        query,
        {
            replacements: {
                currentStart,
                currentEnd,
                previousStart,
                previousEnd
            },
            type: QueryTypes.SELECT
        }
    );


    const currentPeriod =
        Number(
            result[0].currentPeriodSignups || 0
        );


    const previousPeriod =
        Number(
            result[0].previousPeriodSignups || 0
        );


    const difference =
        currentPeriod - previousPeriod;


    let growthPercentage = 0;


    if (previousPeriod > 0) {

        growthPercentage = Number(
            (
                (difference / previousPeriod) * 100
            ).toFixed(2)
        );

    }
    else if (currentPeriod > 0) {

        growthPercentage = 100;

    }


    return {

        currentPeriod,

        previousPeriod,

        difference,

        growthPercentage

    };
}


async function getSignupTrend(
    period,
    startDate,
    endDate
) {
    let query;

    // =========================
    // TODAY → HOURLY
    // =========================
    if (period === "today") {

        query = `
            SELECT
                HOUR(createdAt) AS bucket,
                COUNT(*) AS signups
            FROM Users
            WHERE createdAt BETWEEN :startDate AND :endDate
            GROUP BY HOUR(createdAt)
            ORDER BY HOUR(createdAt);
        `;

    }

    // =========================
    // YEAR → MONTHLY
    // =========================
    else if (period === "year") {

        query = `
            SELECT
                MONTH(createdAt) AS bucket,
                COUNT(*) AS signups
            FROM Users
            WHERE createdAt BETWEEN :startDate AND :endDate
            GROUP BY MONTH(createdAt)
            ORDER BY MONTH(createdAt);
        `;

    }

    // =========================
    // WEEK / MONTH / CUSTOM
    // → DAILY
    // =========================
    else {

        query = `
            SELECT
                DATE(createdAt) AS bucket,
                COUNT(*) AS signups
            FROM Users
            WHERE createdAt BETWEEN :startDate AND :endDate
            GROUP BY DATE(createdAt)
            ORDER BY DATE(createdAt);
        `;
    }

    const result = await sequelize.query(
        query,
        {
            replacements: {
                startDate,
                endDate
            },
            type: QueryTypes.SELECT
        }
    );


    // ==========================================
    // TODAY → CREATE 24 HOURS
    // ==========================================
    if (period === "today") {

        const signupMap = {};

        result.forEach(row => {
            signupMap[Number(row.bucket)] =
                Number(row.signups || 0);
        });

        const signupTrend = [];

        for (let hour = 0; hour < 24; hour++) {

            signupTrend.push({
                date: `${String(hour).padStart(2, "0")}:00`,
                signups: signupMap[hour] || 0
            });

        }

        return signupTrend;
    }


    // ==========================================
    // YEAR → CREATE 12 MONTHS
    // ==========================================
    if (period === "year") {

        const signupMap = {};

        result.forEach(row => {
            signupMap[Number(row.bucket)] =
                Number(row.signups || 0);
        });

        const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec"
        ];

        const signupTrend = [];

        for (let month = 1; month <= 12; month++) {

            signupTrend.push({
                date: monthNames[month - 1],
                signups: signupMap[month] || 0
            });

        }

        return signupTrend;
    }


    // ==========================================
    // DAILY → CREATE EVERY DATE
    // ==========================================

    const signupMap = {};

    result.forEach(row => {

        const date =
            row.bucket instanceof Date
                ? row.bucket.toISOString().split("T")[0]
                : String(row.bucket);

        signupMap[date] =
            Number(row.signups || 0);

    });


    const signupTrend = [];

    const currentDate = new Date(startDate);
    const finalDate = new Date(endDate);

    currentDate.setHours(0, 0, 0, 0);
    finalDate.setHours(0, 0, 0, 0);


    while (currentDate <= finalDate) {

        const year = currentDate.getFullYear();
        const month = String(
            currentDate.getMonth() + 1
        ).padStart(2, "0");

        const day = String(
            currentDate.getDate()
        ).padStart(2, "0");

        const date =
            `${year}-${month}-${day}`;

        signupTrend.push({
            date,
            signups: signupMap[date] || 0
        });

        currentDate.setDate(
            currentDate.getDate() + 1
        );
    }

    return signupTrend;
}


module.exports = {
    getUserMetrics,
    getSignupComparison,
    getSignupTrend
};