function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

function endOfDay(date) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
}

function getDateRange(period, from = null, to = null) {
    const now = new Date();

    let currentStart;
    let currentEnd;
    let previousStart;
    let previousEnd;

    switch (period) {

        case "today": {
            currentStart = startOfDay(now);
            currentEnd = endOfDay(now);

            previousStart = new Date(currentStart);
            previousStart.setDate(previousStart.getDate() - 1);

            previousEnd = endOfDay(previousStart);

            break;
        }

        case "week": {
            currentEnd = endOfDay(now);

            currentStart = startOfDay(now);
            currentStart.setDate(currentStart.getDate() - 6);

            previousEnd = new Date(currentStart);
            previousEnd.setMilliseconds(previousEnd.getMilliseconds() - 1);

            previousStart = new Date(previousEnd);
            previousStart.setDate(previousStart.getDate() - 6);
            previousStart = startOfDay(previousStart);

            break;
        }

        case "month": {
            currentStart = new Date(
                now.getFullYear(),
                now.getMonth(),
                1,
                0, 0, 0, 0
            );

            currentEnd = endOfDay(now);

            previousStart = new Date(
                now.getFullYear(),
                now.getMonth() - 1,
                1,
                0, 0, 0, 0
            );

            previousEnd = new Date(
                now.getFullYear(),
                now.getMonth(),
                0,
                23, 59, 59, 999
            );

            break;
        }

        case "year": {
            currentStart = new Date(
                now.getFullYear(),
                0,
                1,
                0, 0, 0, 0
            );

            currentEnd = endOfDay(now);

            previousStart = new Date(
                now.getFullYear() - 1,
                0,
                1,
                0, 0, 0, 0
            );

            previousEnd = new Date(
                now.getFullYear() - 1,
                11,
                31,
                23, 59, 59, 999
            );

            break;
        }

        case "custom": {

            if (!from || !to) {
                throw new Error("From date and To date are required.");
            }

            currentStart = startOfDay(new Date(from));
            currentEnd = endOfDay(new Date(to));

            const diff =
                currentEnd.getTime() -
                currentStart.getTime() +
                1;

            previousEnd = new Date(currentStart.getTime() - 1);

            previousStart = new Date(previousEnd.getTime() - diff + 1);

            break;
        }

        default:
            throw new Error("Invalid period supplied.");
    }

    return {
        currentStart,
        currentEnd,
        previousStart,
        previousEnd
    };
}

module.exports = {
    getDateRange
};