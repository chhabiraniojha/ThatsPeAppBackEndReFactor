const SubCategory = require("../../models/SubCategoryModel/subCategory");
const OperatorData = require("../../models/OperatorDataModel/operatorData");

const MobiKwikOperator = require("../../models/MobikwikModel/MobikwikOperator");
const MobiKwikCCBPBankList = require("../../models/MobikwikModel/MobikwikCCBPBankLIst");

const getMobiKwikOperatorConfig = async ({ operatorId }) => {
    /*
    |--------------------------------------------------------------------------
    | 1. Validate operatorId
    |--------------------------------------------------------------------------
    */

    if (!operatorId) {
        const error = new Error(
            "MobiKwik operatorId is required-from getMobiKwikOperatorConfig"
        );

        error.code = "MISSING_OPERATOR_ID";

        throw error;
    }

    try {
        /*
        |--------------------------------------------------------------------------
        | 2. Find OperatorData
        |--------------------------------------------------------------------------
        */

        const operator = await OperatorData.findByPk(operatorId);

        if (!operator) {
            const error = new Error(
                "MobiKwik operator not found-from getMobiKwikOperatorConfig"
            );

            error.code = "OPERATOR_NOT_FOUND";

            throw error;
        }

        /*
        |--------------------------------------------------------------------------
        | 3. Get SubCategory from OperatorData
        |--------------------------------------------------------------------------
        */

        const subCategoryId = operator.subCategoryId;

        if (!subCategoryId) {
            const error = new Error(
                "MobiKwik SubCategory is not configured for this operator-from getMobiKwikOperatorConfig"
            );

            error.code = "OPERATOR_SUBCATEGORY_NOT_CONFIGURED";

            throw error;
        }

        /*
        |--------------------------------------------------------------------------
        | 4. Find SubCategory
        |--------------------------------------------------------------------------
        */

        const subCategory = await SubCategory.findByPk(
            subCategoryId
        );

        if (!subCategory) {
            const error = new Error(
                "MobiKwik SubCategory not found-from getMobiKwikOperatorConfig"
            );

            error.code = "SUBCATEGORY_NOT_FOUND";

            throw error;
        }

        /*
        |--------------------------------------------------------------------------
        | 5. Decide MobiKwik Source Table
        |--------------------------------------------------------------------------
        */

        const subCategoryName = String(
            subCategory.subCategoryName ||
            subCategory.name ||
            ""
        )
            .trim()
            .toLowerCase();

        let sourceType;
        let config;

        /*
        |--------------------------------------------------------------------------
        | Credit Card
        |--------------------------------------------------------------------------
        */

        if (subCategoryName === "credit card") {
            sourceType = "CCBP";

            config = await MobiKwikCCBPBankList.findOne({
                where: {
                    operatorId,
                },
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Other Services
        |--------------------------------------------------------------------------
        */

        else {
            sourceType = "OPERATOR";

            config = await MobiKwikOperator.findOne({
                where: {
                    operatorId,
                },
            });
        }

        /*
        |--------------------------------------------------------------------------
        | 6. Configuration not found
        |--------------------------------------------------------------------------
        */

        if (!config) {
            const error = new Error(
                "MobiKwik configuration not found for selected operator-from getMobiKwikOperatorConfig"
            );

            error.code = "MOBIKWIK_CONFIG_NOT_FOUND";

            throw error;
        }

        /*
        |--------------------------------------------------------------------------
        | 7. Return
        |--------------------------------------------------------------------------
        */

        return {
            operator,
            subCategory,
            sourceType,
            config,
        };

    } catch (error) {

        /*
         * Preserve our own structured errors.
         */
        if (error.code) {
            throw error;
        }

        /*
         * Unexpected database / Sequelize error.
         */
        const structuredError = new Error(
            "MobiKwik operator configuration lookup failed-from getMobiKwikOperatorConfig"
        );

        structuredError.code =
            "MOBIKWIK_OPERATOR_CONFIG_LOOKUP_FAILED";

        structuredError.rawResponse = {
            originalError: error.message,
        };

        throw structuredError;
    }
};

module.exports = {
    getMobiKwikOperatorConfig,
};