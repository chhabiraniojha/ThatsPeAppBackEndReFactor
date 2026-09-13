const userMetricsService = require("../../services/adminDashboardService/userMetricsService");


const getUserMetrics = async (req, res) => {

    try {

        const {
            period = "today",
            from,
            to
        } = req.query;


        const data =
            await userMetricsService.getUserMetricsService(
                period,
                from,
                to
            );


        return res.status(200).json({

            success: true,

            data

        });

    } catch (error) {

        console.error(
            "User Metrics Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Failed to fetch user metrics"

        });

    }
};


module.exports = {
    getUserMetrics
};