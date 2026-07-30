const dashboardService = require("../../services/adminDashboardService/dashboardService");

exports.getDashboard = async (req, res) => {

    try {

        const {
            period = "today",
            from,
            to
        } = req.query;

        const data = await dashboardService.getDashboard(
            period,
            from,
            to
        );

        return res.status(200).json({
            success: true,
            data
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};