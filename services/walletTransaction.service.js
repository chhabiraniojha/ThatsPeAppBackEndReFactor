const sequelize = require('../util/db_connect');
const Wallet = require('../models/WalletModels/WalletSchema/wallet');
const WalletTransaction = require('../models/WalletModels/Wallet Transaction/walletTransaction');
const RechargeTransaction = require('../models/RechargeAndBillPaymentTransactionsModels/rechargeAndBillPaymentTransactions');
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
async function debitWalletForRecharge({
  walletId,
  amount,
  rechargeTransactionId,
  rechargeTypeId = null,
  paymentTransactionId = null
}) {
  return await sequelize.transaction(async (t) => {
    // 🔒 Lock wallet row
    const wallet = await Wallet.findByPk(walletId, {
      lock: t.LOCK.UPDATE,
      transaction: t
    });

    if (!wallet) {
      throw new Error('WALLET_NOT_FOUND');
    }

    // 🔐 Idempotency: same paymentTransactionId cannot debit twice
    if (paymentTransactionId) {
      const existingTxn = await WalletTransaction.findOne({
        where: { paymentTransactionId },
        transaction: t
      });

      if (existingTxn) {
        return existingTxn;
      }
    }

    if (Number(wallet.amount) < Number(amount)) {
      throw new Error('INSUFFICIENT_WALLET_BALANCE');
    }

    const startingBalance = wallet.amount;
    const endingBalance = Number(startingBalance) - Number(amount);

    const walletTxnId = await uid();

    const walletTransaction = await WalletTransaction.create(
      {
        id: walletTxnId,
        walletId,
        amount,
        startingBalance,
        endingBalance,
        transactionType: 'Recharge',
        balanceType: 'Debit',
        transactionId: rechargeTransactionId,
        rechargeTypeId,
        paymentTransactionId,
        status: 'success',
        isUsed: true
      },
      { transaction: t }
    );

    // Update wallet balance
    await wallet.update(
      { amount: endingBalance },
      { transaction: t }
    );

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
    const rechargeTxn = await RechargeTransaction.findByPk(
      rechargeTransactionId,
      { transaction: t }
    );

    if (!rechargeTxn) {
      throw new Error('RECHARGE_TRANSACTION_NOT_FOUND');
    }

    if (rechargeTxn.status !== 'FAILED') {
      throw new Error('RECHARGE_NOT_FAILED');
    }

    if (rechargeTxn.refundStatus === true) {
      return { refunded: true }; // idempotent
    }

    // 🔐 Fetch wallet
    const wallet = await Wallet.findOne({
      where: { userId: rechargeTxn.userId },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!wallet) {
      throw new Error('WALLET_NOT_FOUND');
    }

    const refundAmount = rechargeTxn.discountedAmount;

    const startingBalance = wallet.amount;
    const endingBalance = startingBalance + refundAmount;

    // 1️⃣ Credit wallet balance
    await wallet.update(
      { amount: endingBalance },
      { transaction: t }
    );

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

    // 3️⃣ Mark recharge refunded
    await rechargeTxn.update(
      { refundStatus: true },
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