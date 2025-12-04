const Users = require('../models/UserModels/UserSchema/user');
const jwt = require('jsonwebtoken');
const Logger = require('../util/logData')

const Authenticate = async (req, res, next) => {
   const token = req.header('authorization');
   const type = req.header('type');
   try {

      // console.log(token)

      // Check if token exists
      if (!token) {
         return res.status(200).json({
            message: "Authorization token is missing",
            success: false,
            statuscode: 5
         });
      }
      const { userId } = jwt.verify(token, process.env.JWT_SECRET_KEY)

      // console.log("UserId --- >", userId);

      const user = await Users.findByPk(userId);
      req.user = user;
      if (user) {
         const userPlain = user.toJSON(); // or user.get({ plain: true });

         // Exclude the password
         const { password, ...userDetails } = userPlain;
 
        
         if (type && type == "verify-token") {
            console.log("------ token  check api  success")
            console.log("------  userdetails",userDetails)
            return res.status(200).json({ message: "token exists", success: true, statuscode: 1,userDetails })
         } else {
            next()
         }
      } else {
         return res.status(200).json({ message: "token failed or user does not exists", success: false, statuscode: 5 })
      }


   } catch (error) {
      console.log(error)
      Logger.error({
         error_message: error ? error.name : "catch error form Authentication ",
         user: token,
         url: "/user/token-check",
         http_method: "get",
         status_code: "5"
      })
      if (error.name === "TokenExpiredError") {
         return res.status(200).json({
            message: "Token has expired",
            success: false,
            statuscode: 5
         });
      }

      if (error.name === "JsonWebTokenError") {
         return res.status(200).json({
            message: "Invalid token",
            success: false,
            statuscode: 5
         });
      }
      return res.status(500).json({
         message: "Internal server error",
         error
      })

   }
}

module.exports = Authenticate;