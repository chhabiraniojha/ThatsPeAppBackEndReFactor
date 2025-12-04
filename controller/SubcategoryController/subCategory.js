const subCategoryModel = require('../../models/SubCategoryModel/subCategory')
const categoryModel = require('../../models/CategoryModel/category')


exports.getServices = async (req, res) => {
    try {
        let services = []
        const categories = await categoryModel.findAll({
            order: [['order', 'ASC']]
        })
        const servicePromise = categories.map(async (item) => {
            const subCategories = await subCategoryModel.findAll({
                where: {
                    categoryId: item.dataValues.id,
                    // popular:false
                },
                order: [['order', 'ASC']]
            })
            return {
                categoryName: item.dataValues.categoryName,
                subCategories: subCategories,
            }
        })

        services = await Promise.all(servicePromise)

        return res.status(200).json({ message: "Services fetched successfully", success: true, statuscode: 1, services })
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", success: false })
    }
}

exports.getPopularServices = async (req, res) => {
    try {
        
            const subCategories = await subCategoryModel.findAll({
                where: {
                    popular: 1
                },
                order: [['popularityorder', 'ASC']]
            })

        return res.status(200).json({ message: "Services fetched successfully", success: true, statuscode: 1, subCategories })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal Server Error", success: false })
    }
}

exports.getSubCategories = async (req, res) => {
    try {
        const subCategories = await subCategoryModel.findAll()
        return res.status(200).json({ message: "Fetched sub categories successfully", success: true, statuscode: 1, subCategories })
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", success: false })
    }
}