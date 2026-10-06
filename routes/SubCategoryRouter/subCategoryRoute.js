const subCategoryController = require('../../controller/SubcategoryController/subCategory')
const express = require('express')
const Authenticate=require("../../middelWare/auth")

const router = express.Router()

router.get('/',Authenticate, subCategoryController.getServices)
router.get('/popular', Authenticate,subCategoryController.getPopularServices)
router.get('/sub-categories', subCategoryController.getSubCategories)


module.exports = router