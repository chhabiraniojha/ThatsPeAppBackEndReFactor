const Maintenance = require("../../models/MaintenanceModel/maintenance");


exports.maintenanceStatus = async (req, res) => {
    try {
        const maintenance = await Maintenance.findAll()
        console.log(maintenance)

        if (maintenance[0].maintenanceStatus) {
            return res.status(200).json({ message: " Oops Application Is Under  Maintenance  ", success: true, statuscode: 1 })
        } else {
            return res.status(200).json({ message: "Application Is Working  ", success: true, statuscode: 0 })
        }


    }
    catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal Server Error", success: false })

    }

}