const sequelize = require('../util/db_connect');
const Wallet = require('../models/WalletModels/WalletSchema/wallet');
const WalletTransaction = require('../models/WalletModels/Wallet Transaction/walletTransaction');
const RechargeTransaction = require('../models/RechargeAndBillPaymentTransactionsModels/rechargeAndBillPaymentTransactions');
const SubCategory = require('../models/SubCategoryModel/subCategory');
const uid = require('../util/uidGenerator');

/**
 * --------------------------------------------------
 * WALLET DEBIT (FOR RECHARGE)
 * --------------------------------------------------
 * Rules:
 * - Only for wallet payments
 * - Atomic (row lock)
 * - Idempotent
 * - Prevent negative balance
 */
async function debitWalletForRecharge({ userId, amount, rechargeTypeId = null }) {
  console.log('debitWalletForRecharge called with:-----', { userId, amount, rechargeTypeId });
  return await sequelize.transaction(async (t) => {
    // 🔒 Lock wallet row
    const wallet = await Wallet.findOne({
      where: { userId },
      lock: t.LOCK.UPDATE,
      transaction: t
    });
    console.log('Locked wallet:-----', wallet);

    if (!wallet) {
      throw new Error('WALLET_NOT_FOUND');
    }
    if (Number(amount) < 0) {
      throw new Error('INVALID_DEDUCT_AMOUNT');
    }

    if (Number(wallet.amount) < Number(amount) || Number(wallet.amount) === 0) {
      throw new Error('INSUFFICIENT_WALLET_BALANCE');
    }
    const subCategoryDetails = await SubCategory.findByPk(rechargeTypeId);
    if (!subCategoryDetails) {
      throw new Error('INVALID_SUBCATEGORY_ID');
    }

    const startingBalance = wallet.amount;
    const endingBalance = Number(startingBalance) - Number(amount);

    const walletTxnId = await uid();
    // initiare wallet transaction
    const walletTransaction = await WalletTransaction.create(
      {
        id: walletTxnId,
        walletId: wallet.id,
        amount,
        startingBalance,
        endingBalance,
        transactionType: 'Recharge',
        balanceType: 'Debit',
        rechargeTypeId,
        paymentTransactionId: null,
        status: 'success',
      },
      { transaction: t }
    );

    // Update wallet balance
    await wallet.update({ amount: endingBalance }, { transaction: t });

    return walletTransaction;
  });
}

/**
 * --------------------------------------------------
 * WALLET CREDIT (REFUND)
 * --------------------------------------------------
 * Rules:
 * - Recharge must be FAILED
 * - refundStatus must be false
 * - Wallet refund ALWAYS allowed
 * - Cash refund ONLY if explicitly allowed
 */
async function refundWallet({ rechargeTransactionId }) {
  return await sequelize.transaction(async (t) => {
    const updatedRows = await RechargeTransaction.update(
      { refundStatus: true },
      {
        where: {
          id: rechargeTransactionId,
          refundStatus: false,
          status: 'FAILED'
        },
        transaction: t
      }
    );

    const affectedOrderRows = Array.isArray(updatedRows) ? updatedRows[0] : updatedRows;
    if (affectedOrderRows === 0) {
      // Now determine why it failed
      const rechargeTxn = await RechargeTransaction.findByPk(
        rechargeTransactionId,
        { transaction: t }
      );

      if (!rechargeTxn) {
        throw new Error("RECHARGE_TRANSACTION_NOT_FOUND");
      }

      if (rechargeTxn.status !== "FAILED") {
        throw new Error("RECHARGE_NOT_FAILED");
      }

      return { refunded: true }; // Already refunded or not eligible
    }
    const rechargeTxn = await RechargeTransaction.findByPk(rechargeTransactionId, { transaction: t });
    // 🔐 Fetch wallet
    const wallet = await Wallet.findOne({
      where: { userId: rechargeTxn.userId },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!wallet) {
      throw new Error('WALLET_NOT_FOUND');
    }

    const startingBalance = Number(wallet.amount);
    const refundAmount = Number(rechargeTxn.discountedAmount);

    await wallet.increment(
      { amount: refundAmount },
      { transaction: t }
    );

    const endingBalance = startingBalance + refundAmount;

    // 2️⃣ Create wallet transaction (REFUND)
    await WalletTransaction.create(
      {
        id: await uid(),
        walletId: wallet.id,
        amount: refundAmount,
        startingBalance,
        endingBalance,
        transactionType: 'Refund',
        balanceType: 'Credit',
        transactionId: rechargeTransactionId,
        status: 'success'
      },
      { transaction: t }
    );



    return {
      refunded: true,
      refundAmount
    };
  });
}

module.exports = {
  debitWalletForRecharge,
  refundWallet
};
