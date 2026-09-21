const { Sequelize } = require("sequelize");
const dotenv = require("dotenv");

dotenv.config();

const sequelize = new Sequelize(process.env.MYSQL_CONNECTION_URI, {
    pool: {
        max: 10,
        min: 1,
        acquire: 30000,
        idle: 10000,
    },

    retry: {
        max: 3,
    },

    logging: false,
    
    attributeBehavior: "escape"

});

const connectDB = async () => {
    try {
        await sequelize.authenticate();

        console.log(
            `[${process.pid}] Connection has been established successfully.`
        );
    } catch (error) {
        console.error(
            `[${process.pid}] Unable to connect to the database:`,
            error
        );
    }
};

connectDB();

module.exports = sequelize;