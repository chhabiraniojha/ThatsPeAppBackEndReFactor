
const { Op } = require("sequelize");

const OperatorData = require("../../models/OperatorDataModel/operatorData");
const OperatorVendorMapping = require("../../models/OperatorDataModel/OperatorVendorMapping");

const CircleData = require("../../models/CircleDataModel/circleData");
const CircleVendorMapping = require("../../models/CircleDataModel/CircleVendorMapping");

const AvailableAPIs = require("../../models/APIModels/api");

exports.resolveOperatorAndCircle = async (lookupResult) => {
  if (
    !lookupResult?.provider ||
    !lookupResult?.operatorCode ||
    !lookupResult?.circleCode
  ) {
    return null;
  }

  const vendorName = lookupResult.provider;
  const operatorCode = lookupResult.operatorCode;
  const circleCode = lookupResult.circleCode;

  // --------------------------------
  // 1. Resolve provider
  // --------------------------------
  const vendor = await AvailableAPIs.findOne({
    where: {
      name: {
        [Op.like]: vendorName,
      },
    },
    attributes: ["id", "name"],
  });

  if (!vendor) {
    return null;
  }

  // --------------------------------
  // 2. Resolve internal operator
  // --------------------------------
  const operatorMapping = await OperatorVendorMapping.findOne({
    where: {
      vendorId: vendor.id,
      vendorOperatorCode: operatorCode,
      status: "active",
    },
    include: [
      {
        model: OperatorData,
        as: "operator",
        required: true,
        where: {
          status: "active",
        },
        attributes: ["id", "name", "operatorImage", "discount", "discountType"],
      },
    ],
  });

  if (!operatorMapping) {
    return null;
  }

  // --------------------------------
  // 3. Resolve internal circle
  // --------------------------------
  const circleMapping = await CircleVendorMapping.findOne({
    where: {
      vendorId: vendor.id,
      circleCode,
      status: "active",
    },
    include: [
      {
        model: CircleData,
        as: "circle",
        required: true,
        where: {
          status: "active",
        },
        attributes: ["id", "name"],
      },
    ],
  });

  if (!circleMapping) {
    return null;
  }

  // --------------------------------
  // 4. Return internal records
  // --------------------------------
  return {
    operator: {
      id: operatorMapping.operator.id,
      name: operatorMapping.operator.name,
      operatorImage: operatorMapping.operator.operatorImage,
      discount: operatorMapping.operator.discount,
      discountType: operatorMapping.operator.discountType,
      vendorOperatorCode: operatorMapping.vendorOperatorCode,
    },
    circle: {
      id: circleMapping.circle.id,
      name: circleMapping.circle.name,
      vendorCircleCode: circleMapping.circleCode,
    },
    lookupProvider: vendor.name,
  };
};
