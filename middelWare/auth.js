const Users = require("../models/UserModels/UserSchema/user");
const jwt = require("jsonwebtoken");
const logger = require("../util/logger");

const Authenticate = async (req, res, next) => {
    const token = req.header("authorization");

    try {
        // Check if token exists
        if (!token) {
            return res.status(401).json({
                message: "Authorization token is missing",
                success: false,
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET_KEY
        );

        const { userId } = decoded;

        if (!userId) {
            return res.status(401).json({
                message: "Invalid token",
                success: false,
            });
        }

        const user = await Users.findByPk(userId);

        if (!user) {
            return res.status(401).json({
                message: "Invalid token or user does not exist",
                success: false,
            });
        }

        req.user = user;

        // Token verification API
        const type = req.header("type");

        if (type === "verify-token") {
            const userPlain = user.toJSON();

            // Exclude password
            const { password, ...userDetails } = userPlain;

            return res.status(200).json({
                message: "Token is valid",
                success: true,
                userDetails,
            });
        }

        next();
    } catch (error) {
        // Token expired
        if (error.name === "TokenExpiredError") {
            logger.warn("Authentication token has expired", {
                route: req.originalUrl,
                method: req.method,
            });

            return res.status(401).json({
                message: "Token has expired",
                success: false,
            });
        }

        // Invalid JWT
        if (error.name === "JsonWebTokenError") {
            logger.warn("Invalid authentication token", {
                route: req.originalUrl,
                method: req.method,
            });

            return res.status(401).json({
                message: "Invalid token",
                success: false,
            });
        }

        // Unexpected authentication error
        next(error);
    }
};

module.exports = Authenticate;