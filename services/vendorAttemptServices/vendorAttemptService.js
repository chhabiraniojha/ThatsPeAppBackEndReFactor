const RechargeVendorAttempt = require("../../models/VendorAttemptModels/vendorAttempts");
const AvailableAPIs = require("../../models/APIModels/api");
const uidgenerate = require("../../util/uidGenerator") // adjust path

async function getApiByName(name) {
  console.log(name)
  if (!name) {
    throw new Error("API name is required");
  }

  const api = await AvailableAPIs.findOne({
    where: {
      name,
      status: "active",
    },
  });

  if (!api) {
    throw new Error(`API '${name}' not found or inactive`);
  }

  return api.dataValues;
}

async function createVendorAttempt({
  rechargeTransactionId,
  apiId,
}) {

  const [attempt] = await RechargeVendorAttempt.findOrCreate({
    where: {
      rechargeTransactionId,
      apiId,
    },
    defaults: {
      id: await uidgenerate(),
      rechargeTransactionId,
      apiId,
      status: "PENDING",
      callbackReceived: false,
    },
  });

  return attempt;
}

async function updateVendorAttempt({
  rechargeTransactionId,
  apiId,
  status,
  vendorTransactionId = null,
  rawResponse = null,
  message = null,
  callbackReceived = false,
}) {

  const updateData = {
    status,
  };

  if (vendorTransactionId !== null)
    updateData.vendorTransactionId = vendorTransactionId;

  if (rawResponse !== null)
    updateData.rawResponse = rawResponse;

  if (message !== null)
    updateData.message = message;

  if (callbackReceived) {
    updateData.callbackReceived = true;
    updateData.callbackAt = new Date();
  }

  await RechargeVendorAttempt.update(updateData, {
    where: {
      rechargeTransactionId,
      apiId,
    },
  });

  return RechargeVendorAttempt.findOne({
    where: {
      rechargeTransactionId,
      apiId,
    },
  });
}

async function getVendorAttempt({
  rechargeTransactionId,
  apiId,
}) {

  return RechargeVendorAttempt.findOne({
    where: {
      rechargeTransactionId,
      apiId,
    },
  });
}

module.exports = {
  getApiByName,
  createVendorAttempt,
  updateVendorAttempt,
  getVendorAttempt,
};