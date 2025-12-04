const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config()


const sequelize = new Sequelize(process.env.MYSQL_CONNECTION_URI)

const connectDB = async () => {
    try {
        let conn = await sequelize.authenticate();
        console.log('Connection has been established successfully.');
        return conn
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

connectDB()

module.exports = sequelize
