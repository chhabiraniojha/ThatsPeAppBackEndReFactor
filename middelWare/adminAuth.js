
const jwt = require('jsonwebtoken');
const sequelize = require('../util/db_connect')

const adminAuthenticate = async (req, res, next) => {
    const token = req.header('authorization');
    try {
         // Check if token exists
         if (!token) {
            return res.status(200).json({
               message: "Authorization token is missing",
               success: false,
               statuscode: 0
            });
         }

 
        const { adminId } = jwt.verify(token, process.env.JWT_SECRET_KEY)

        // console.log("Admin Id --- >", adminId);

        // Direct SQL query to find the admin details
        const [admin] = await sequelize.query(`
            SELECT *
            FROM Admins
            WHERE AdminId = :adminId
        `, {
            type: sequelize.QueryTypes.SELECT,
            replacements: { adminId }, // Replaces :adminId with the value of adminId
            // transaction: t // Optional: if you are using a transaction
        });

 
        req.admin=admin;
        if (admin) {            
            next()
        } else {
            return res.status(500).json({ message: "token failed or user does not exists", success: false })
        }


    } catch (error) {
        
        if (error.name === "TokenExpiredError") {
            return res.status(200).json({
               message: "Token has expired",
               success: false,
               statuscode: 0
            });
         }
   
         if (error.name === "JsonWebTokenError") {
            return res.status(200).json({
               message: "Invalid token",
               success: false,
               statuscode: 0
            });
         }
        res.status(500).json({
            message: "Internal server error",
              error
        })
        console.log(error)
    }
}

module.exports = adminAuthenticate;