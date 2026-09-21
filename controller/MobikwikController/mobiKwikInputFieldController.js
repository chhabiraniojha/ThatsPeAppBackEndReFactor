const {
    getMobiKwikOperatorConfig,
} = require("../../services/mobikwikServices/mobiKwikConfigResolver");

const {
    buildInputFields,
} = require("../../services/mobikwikServices/mobiKwikInputFieldBuilder");

const {
    getLookupData,
} = require("../../services/mobikwikServices/mobikwikLookupResolver");

const logger = require("../../util/logger");

const Sentry = require("@sentry/node");


const getMobiKwikInputFields = async (req, res) => {
    try {
        const { operatorId } = req.query;


        /*
        ========================================================
        1. GET MOBIKWIK CONFIG
        ========================================================
        */

        const {
            operator,
            subCategory,
            sourceType,
            config,
        } = await getMobiKwikOperatorConfig({
            operatorId,
        });


        /*
        ========================================================
        2. BUILD INPUT FIELDS
        ========================================================
        */

        const fields =
            buildInputFields(config);


        /*
        ========================================================
        3. LOAD LOOKUP DATA
        ========================================================
        */

        for (const field of fields) {

            if (
                !field.lookup ||
                !field.lookup.name
            ) {
                continue;
            }


            const lookupData =
                await getLookupData({
                    lookupName:
                        field.lookup.name,
                });


            /*
            Add actual lookup options
            */

            field.options =
                lookupData.options;


            /*
            Lookup type is SELECT
            */

            field.inputType =
                "select";
        }


        /*
        ========================================================
        4. SUCCESS LOG
        ========================================================
        */

        logger.info(
            "MobiKwik input fields fetched",
            {
                operatorId,
                operatorName: operator.name,
                sourceType,
                fieldCount: fields.length,
            }
        );


        /*
        ========================================================
        5. RESPONSE
        ========================================================
        */

        return res.status(200).json({
            success: true,

            data: {

                operator: {
                    id: operator.id,
                    name: operator.name,
                },

                subCategory: {
                    id: subCategory.id,

                    name:
                        subCategory.subCategoryName ||
                        subCategory.name,
                },

                vendor: "MOBIKWIK",

                sourceType,

                fields,
            },
        });

    } catch (error) {

        /*
        ========================================================
        SENTRY
        ========================================================
        */

        Sentry.captureException(error);


        /*
        ========================================================
        LOGGER
        ========================================================
        */

        logger.error(
            "MobiKwik Input Fields Error",
            {
                error: error.message,
                code: error.code,
                operatorId: req.query?.operatorId,
            }
        );


        /*
        ========================================================
        ERROR STATUS
        ========================================================
        */

        let statusCode = 500;

        switch (error.code) {

            case "MISSING_OPERATOR_ID":
                statusCode = 400;
                break;

            case "OPERATOR_NOT_FOUND":
                statusCode = 404;
                break;

            case "OPERATOR_SUBCATEGORY_NOT_CONFIGURED":
                statusCode = 400;
                break;

            case "SUBCATEGORY_NOT_FOUND":
                statusCode = 404;
                break;

            case "MOBIKWIK_CONFIG_NOT_FOUND":
                statusCode = 404;
                break;

            case "LOOKUP_NAME_REQUIRED":
                statusCode = 400;
                break;

            case "LOOKUP_NOT_SUPPORTED":
                statusCode = 400;
                break;

            default:
                statusCode = 500;
        }


        /*
        ========================================================
        ERROR RESPONSE
        ========================================================
        */

        return res.status(statusCode).json({

            success: false,

            code:
                error.code ||
                "MOBIKWIK_INPUT_FIELDS_ERROR",

            message:
                error.message ||
                "Something went wrong",
        });
    }
};


module.exports = {
    getMobiKwikInputFields,
};