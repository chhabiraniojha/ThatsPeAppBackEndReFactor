const Banner = require("../../models/BannerModel/banner");


exports.getBanners = async (req, res) => {
    try {
        const bannerData = await Banner.findAll()


        return res.status(200).json({ message: "Banner Data Fetch Successfully", success: true, statuscode: 1, bannerData })
    }

    catch (error) {
        return res.status(500).json({ message: "Internal Server Error", success: false })

    }

}