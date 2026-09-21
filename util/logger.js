const Sentry = require('@sentry/node');

const logger = {
    info(message, context = {}) {
        Sentry.logger.info(message, context);
    },

    warn(message, context = {}) {
        Sentry.logger.warn(message, context);
    },

    error(message, context = {}) {
        Sentry.logger.error(message, context);
    },

    debug(message, context = {}) {
        Sentry.logger.debug(message, context);
    },
};

module.exports = logger;