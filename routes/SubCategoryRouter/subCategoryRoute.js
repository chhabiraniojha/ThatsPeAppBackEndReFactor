const subCategoryController = require('../../controller/SubcategoryController/subCategory')
const express = require('express')

const router = express.Router()

router.get('/', subCategoryController.getServices)
router.get('/popular', subCategoryController.getPopularServices)
router.get('/sub-categories', subCategoryController.getSubCategories)


module.exports = router