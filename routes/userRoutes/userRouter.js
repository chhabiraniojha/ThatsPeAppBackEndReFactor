const express = require('express')
const Authenticate= require('../../middelWare/auth')
const SignupTokenVerify= require('../../middelWare/signupAuth')

const userController = require('../../controller/UserController/user')
const router = express.Router()

router.post('/login', userController.login)
router.post('/signup', SignupTokenVerify,userController.signup)
router.post('/user-exist', userController.checkUserExistance)
router.post('/update-password', Authenticate,userController.updatePassword)
router.put('/update-userdetails', Authenticate,userController.updateUserDetails)
router.post('/forget-password', userController.forgetPassword)
router.get('/token-check',Authenticate )


module.exports = router