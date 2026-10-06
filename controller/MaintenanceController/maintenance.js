const Maintenance = require("../../models/MaintenanceModel/maintenance");

exports.maintenanceStatus = async (req, res, next) => {
    try {
        const maintenance = await Maintenance.findOne({
            order: [["createdAt", "DESC"]],
            attributes: [
                "id",
                "maintenanceStatus",
                "startAt",
                "endAt",
                "message",
            ],
        });

        if (!maintenance) {
            return res.status(200).json({
                message: "Application Is Working",
                success: true,
                maintenanceStatus: false,
            });
        }

        if (maintenance.maintenanceStatus) {
            return res.status(200).json({
                message:
                    maintenance.message ||
                    "Oops! Application Is Under Maintenance",
                success: true,
                maintenanceStatus: true,
                startAt: maintenance.startAt,
                endAt: maintenance.endAt,
            });
        }

        return res.status(200).json({
            message: "Application Is Working",
            success: true,
            maintenanceStatus: false,
            startAt: maintenance.startAt,
            endAt: maintenance.endAt,
        });
    } catch (error) {
        next(error);
    }
};
