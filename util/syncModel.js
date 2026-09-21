const sequelize = require('./db_connect');

const syncModels = async () => {
    try {
        await sequelize.sync({});
        console.log('All models were synchronized successfully.');
    } catch (error) {
        console.error('Database synchronization failed:', error);
        throw error;
    }
};

module.exports = syncModels;