const Banner = require("../../models/BannerModel/banner");

exports.getBanners = async (req, res, next) => {
    try {
        const bannerData = await Banner.findAll({
            where: {
                status: "active",
            },
            attributes: [
                "id",
                "bannerImage",
                "displayOrder",
                "status",
            ],
            order: [["displayOrder", "ASC"]],
        });

        return res.status(200).json({
            message: "Banner data fetched successfully",
            success: true,
            bannerData,
        });
    } catch (error) {
        next(error);
    }
};
