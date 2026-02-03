const RechargeTransaction = require('../models/RechargeAndBillPaymentTransactionsModels/rechargeAndBillPaymentTransactions');
const AvailableAPIs = require('../models/APIModels/api');
const uid = require('../util/uidGenerator');

/**
 * Create Recharge / Bill Payment Transaction
 * --------------------------------------------------
 * Idempotency rule (DB enforced):
 *  - cashPaymentTransactionId is UNIQUE
 *  - walletPaymentTransactionId is UNIQUE
 * So same payment can NEVER create two recharge txns.
 */
async function createRechargeTransaction({
  userId,
  customerNo,
  amount,
  discountedAmount,
  operator,
  circle,
  paymentTransactionType, // 'cash' | 'wallet'
  cashPaymentTransactionId = null,
  walletPaymentTransactionId = null,
  subCategoryId = null,

  // ✅ SOURCE CODES (NOT vendor codes)
  ezytmOperatorCode,
  ezytmCircleCode
}) {
  /* -------------------- VALIDATION -------------------- */
  if (!userId || !customerNo || !amount || !paymentTransactionType) {
    throw new Error('INVALID_RECHARGE_TRANSACTION_INPUT');
  }

  if (!['cash', 'wallet'].includes(paymentTransactionType)) {
    throw new Error('INVALID_PAYMENT_TRANSACTION_TYPE');
  }

  if (
    (paymentTransactionType === 'cash' && !cashPaymentTransactionId) ||
    (paymentTransactionType === 'wallet' && !walletPaymentTransactionId)
  ) {
    throw new Error('MISSING_PAYMENT_TRANSACTION_ID');
  }

  /* -------------------- IDEMPOTENCY -------------------- */
  const existingTransaction = await RechargeTransaction.findOne({
    where:
      paymentTransactionType === 'cash'
        ? { cashPaymentTransactionId }
        : { walletPaymentTransactionId }
  });

  if (existingTransaction) {
    return existingTransaction;
  }

  /* -------------------- CREATE TRANSACTION -------------------- */
  const id = await uid();

  const rechargeTransaction = await RechargeTransaction.create({
    id,
    userId,
    customerNo,
    amount,
    discountedAmount,
    operator,
    circle,

    // ✅ STORE EASYTM CODES (SOURCE OF TRUTH)
    operatorCode: ezytmOperatorCode,
    circleCode: ezytmCircleCode,

    paymentTransactionType,
    cashPaymentTransactionId,
    walletPaymentTransactionId,
    subCategoryId,
    status: 'CREATED',
    refundStatus: false,
    apiTransactionId: null
  });

  return rechargeTransaction;
}


/**
 * Update Recharge Transaction Status
 * --------------------------------------------------
 * Rules:
 *  - SUCCESS / FAILED are FINAL (immutable)
 *  - CREATED / PROCESSING / PENDING can transition
 */
async function updateRechargeTransactionStatus({
  rechargeTransactionId,
  status, // 'SUCCESS' | 'FAILED' | 'PENDING' | 'PROCESSING'
  apiName
}) {
  console.log('Updating recharge transaction status:', {
    rechargeTransactionId,
    status,
    apiName
  });
  if (!rechargeTransactionId || !status) {
    throw new Error('INVALID_STATUS_UPDATE_INPUT');
  }

  const rechargeTransaction = await RechargeTransaction.findByPk(
    rechargeTransactionId
  );

  if (!rechargeTransaction) {
    throw new Error('RECHARGE_TRANSACTION_NOT_FOUND');
  }

  /* -------------------- FINAL STATE GUARD -------------------- */
  if (['SUCCESS', 'FAILED', 'PENDING'].includes(rechargeTransaction.status)) {
    return rechargeTransaction;
  }

  // 🔒 PROCESSING → no API binding
  if (status === 'PROCESSING') {
    await rechargeTransaction.update({
      status
    });
    return rechargeTransaction;
  }

  // 🔒 For SUCCESS / FAILED / PENDING → apiName is mandatory
  if (!apiName) {
    throw new Error('API_NAME_REQUIRED_FOR_FINAL_STATUS');
  }

  const api = await AvailableAPIs.findOne({
    where: { name: apiName }
  });

  if (!api) {
    throw new Error('INVALID_API_NAME');
  }

  await rechargeTransaction.update({
    status,
    apiTransactionId: api.id
  });

  return rechargeTransaction;
}


/**
 * Fetch Recharge Transaction For Processing
 * --------------------------------------------------
 * Used by:
 *  - Recharge orchestrator
 *  - Retry / reconciliation cron
 */

module.exports = {
  createRechargeTransaction,
  updateRechargeTransactionStatus
};