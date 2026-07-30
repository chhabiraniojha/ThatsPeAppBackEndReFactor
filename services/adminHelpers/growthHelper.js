function calculateGrowth(current, previous) {

    current = Number(current) || 0;
    previous = Number(previous) || 0;

    if (previous === 0) {
        return current > 0 ? 100 : 0;
    }

    return Number(
        (((current - previous) / previous) * 100).toFixed(2)
    );
}

module.exports = {
    calculateGrowth
};