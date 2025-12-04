const { IoTSecureTunneling } = require('aws-sdk');
const sequelize = require('./db_connect')
// Disable or customize logging when initializing sequelize
// sequelize.options.logging = true; // Disable all logging

const syncModels = async() => {
    try {
        await sequelize.sync({ alter:false})
        console.log('All models were synchronized successfully.');
 
    } catch (error) {
        console.log('Some error occurred', error);
    }
}


module.exports = syncModels
