const subCategoryModel = require('../../models/SubCategoryModel/subCategory')
const categoryModel = require('../../models/CategoryModel/category')
const Sentry = require("@sentry/node");
const logger = require("../../util/logger");


exports.getServices = async (req, res, next) => {
    try {
        const categories = await categoryModel.findAll({
            attributes: [
                "id",
                "categoryName",
                "displayOrder",
                "status",
            ],
            include: [
                {
                    model: subCategoryModel,
                    as: "subCategories",
                    attributes: [
                        "id",
                        "name",
                        "icon",
                        "popular",
                        "displayOrder",
                        "status",
                    ],
                    required: false,
                    order: [["displayOrder", "ASC"]],
                },
            ],
            order: [["displayOrder", "ASC"]],
        });

        const services = categories.map((category) => {
            const categoryData = category.toJSON();

            if (categoryData.subCategories) {
                categoryData.subCategories.sort(
                    (a, b) => a.displayOrder - b.displayOrder
                );
            }

            return categoryData;
        });

        return res.status(200).json({
            message: "Services fetched successfully",
            success: true,
            services,
        });
    } catch (error) {
        next(error);
    }
};


exports.getPopularServices = async (req, res, next) => {
    try {
        const subCategories = await subCategoryModel.findAll({
            where: {
                popular: true,
            },
            attributes: [
                "id",
                "categoryId",
                "name",
                "icon",
                "popular",
                "displayOrder",
                "status",
            ],
            order: [["displayOrder", "ASC"]],
        });

        return res.status(200).json({
            message: "Popular services fetched successfully",
            success: true,
            subCategories,
        });
    } catch (error) {
        next(error);
    }
};

exports.getSubCategories = async (req, res) => {
    try {
        const subCategories = await subCategoryModel.findAll()
        return res.status(200).json({ message: "Fetched sub categories successfully", success: true, statuscode: 1, subCategories })
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", success: false })
    }
}