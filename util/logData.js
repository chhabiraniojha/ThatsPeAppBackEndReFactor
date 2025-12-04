// /utils/logger.js
const Log = require('../models/logModel/log');  

const log = async ({ error_message, user, url, http_method, status_code }) => {
    try {
        await Log.create({
            error_message,
            user,
            url,
            http_method,
            status_code,
        });
    } catch (error) {
        console.error('Failed to log to database:', error);
    }
};

const info = async ({ user, url, http_method, status_code }) => {
    await log({
        error_message: 'Informational log',
        user,
        url,
        http_method,
        status_code,
    });
};

const error = async ({ error_message, user, url, http_method, status_code }) => {
    await log({
        error_message,
        user,
        url,
        http_method,
        status_code,
    });
};

module.exports = { log, info, error };
