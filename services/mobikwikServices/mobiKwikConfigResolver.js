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
    const error = new Error("operatorId is required");

    error.code = "MISSING_OPERATOR_ID";

    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | 2. Find OperatorData
  |--------------------------------------------------------------------------
  */

  const operator = await OperatorData.findByPk(operatorId);

  if (!operator) {
    const error = new Error("Operator not found");

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
      "SubCategory is not configured for this operator"
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
    const error = new Error("SubCategory not found");

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
      "MobiKwik configuration not found for selected operator"
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
};

module.exports = {
  getMobiKwikOperatorConfig,
};