const { Op } = require("sequelize");
const sequelize = require("../../util/db_connect");

const Wallet = require("../../models/WalletModels/WalletSchema/wallet");
const WalletTransaction = require(
  "../../models/WalletModels/Wallet Transaction/walletTransaction"
);
const WalletWithdrawal = require(
  "../../models/WalletModels/WalletawithdrawlModel"
);


exports.createWithdrawalRequest = async (req, res, next) => {
  const userId = req.user?.id;

  const {
    amount,
    withdrawalMethod,
    accountHolderName,
    accountNumber,
    ifscCode,
    bankName,
    upiId,
  } = req.body;

  let transaction;

  try {
    /* ---------------------------------
       1. Authentication
    --------------------------------- */

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized user",
        success: false,
      });
    }

    /* ---------------------------------
       2. Amount validation
    --------------------------------- */

    const withdrawalAmount = Number(amount);

    if (!Number.isFinite(withdrawalAmount)) {
      return res.status(400).json({
        message: "Valid withdrawal amount is required",
        success: false,
      });
    }

    if (withdrawalAmount < 500) {
      return res.status(400).json({
        message: "Minimum withdrawal amount is ₹500",
        success: false,
      });
    }

    if (!/^\d+(\.\d{1,2})?$/.test(String(amount))) {
      return res.status(400).json({
        message: "Withdrawal amount can have maximum 2 decimal places",
        success: false,
      });
    }

    /* ---------------------------------
       3. Withdrawal method
    --------------------------------- */

    if (!["BANK", "UPI"].includes(withdrawalMethod)) {
      return res.status(400).json({
        message: "Invalid withdrawal method",
        success: false,
      });
    }

    /* ---------------------------------
       4. BANK validation
    --------------------------------- */

    if (withdrawalMethod === "BANK") {
      if (
        !accountHolderName ||
        !accountNumber ||
        !ifscCode ||
        !bankName
      ) {
        return res.status(400).json({
          message:
            "Account holder name, account number, IFSC code and bank name are required",
          success: false,
        });
      }

      if (
        typeof accountHolderName !== "string" ||
        !accountHolderName.trim()
      ) {
        return res.status(400).json({
          message: "Invalid account holder name",
          success: false,
        });
      }

      if (
        typeof accountNumber !== "string" ||
        !accountNumber.trim()
      ) {
        return res.status(400).json({
          message: "Invalid account number",
          success: false,
        });
      }

      const normalizedIfsc = ifscCode.trim().toUpperCase();

      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(normalizedIfsc)) {
        return res.status(400).json({
          message: "Invalid IFSC code",
          success: false,
        });
      }

      if (typeof bankName !== "string" || !bankName.trim()) {
        return res.status(400).json({
          message: "Invalid bank name",
          success: false,
        });
      }
    }

    /* ---------------------------------
       5. UPI validation
    --------------------------------- */

    if (withdrawalMethod === "UPI") {
      if (!upiId || typeof upiId !== "string" || !upiId.trim()) {
        return res.status(400).json({
          message: "UPI ID is required",
          success: false,
        });
      }

      const normalizedUpiId = upiId.trim();

      const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;

      if (!upiRegex.test(normalizedUpiId)) {
        return res.status(400).json({
          message: "Invalid UPI ID",
          success: false,
        });
      }
    }

    /* ---------------------------------
       6. Start transaction
    --------------------------------- */

    transaction = await sequelize.transaction();

    /* ---------------------------------
       7. Get wallet with row lock
    --------------------------------- */

    const wallet = await Wallet.findOne({
      where: {
        userId,
      },
      attributes: ["id", "userId", "balance", "status"],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!wallet) {
      await transaction.rollback();
      transaction = null;

      return res.status(404).json({
        message: "Wallet not found",
        success: false,
      });
    }

    /* ---------------------------------
       8. Wallet status
    --------------------------------- */

    if (wallet.status !== "active") {
      await transaction.rollback();
      transaction = null;

      return res.status(403).json({
        message: "Wallet is not active",
        success: false,
      });
    }

    /* ---------------------------------
       9. Check balance
    --------------------------------- */

    const currentBalance = Number(wallet.balance);

    if (currentBalance < withdrawalAmount) {
      await transaction.rollback();
      transaction = null;

      return res.status(400).json({
        message: "Insufficient wallet balance",
        success: false,
      });
    }

    /* ---------------------------------
       10. Check existing withdrawal
    --------------------------------- */

    const existingWithdrawal = await WalletWithdrawal.findOne({
      where: {
        userId,
        status: {
          [Op.in]: ["PENDING", "APPROVED", "PROCESSING"],
        },
      },
      attributes: ["id", "amount", "status"],
      transaction,
    });

    if (existingWithdrawal) {
      await transaction.rollback();
      transaction = null;

      return res.status(409).json({
        message:
          "You already have a withdrawal request under processing",
        success: false,
      });
    }

    /* ---------------------------------
       11. Calculate balance
    --------------------------------- */

    const endingBalance = Number(
      (currentBalance - withdrawalAmount).toFixed(2)
    );

    /* ---------------------------------
       12. Update wallet
    --------------------------------- */

    await wallet.update(
      {
        balance: endingBalance,
        updatedBy: userId,
      },
      {
        transaction,
      }
    );

    /* ---------------------------------
       13. Create wallet transaction
    --------------------------------- */

    const walletTransaction = await WalletTransaction.create(
      {
        id: crypto.randomUUID(),
        walletId: wallet.id,
        amount: withdrawalAmount,
        startingBalance: currentBalance,
        endingBalance,
        transactionType: "WITHDRAW",
        balanceType: "DEBIT",
        status: "SUCCESS",
        orderId: null,
        failureReason: null,
      },
      {
        transaction,
      }
    );

    /* ---------------------------------
       14. Create withdrawal request
    --------------------------------- */

    const withdrawal = await WalletWithdrawal.create(
      {
        id: crypto.randomUUID(),

        userId,
        walletId: wallet.id,

        amount: withdrawalAmount,

        withdrawalMethod,

        accountHolderName:
          withdrawalMethod === "BANK"
            ? accountHolderName.trim()
            : null,

        accountNumber:
          withdrawalMethod === "BANK"
            ? accountNumber.trim()
            : null,

        ifscCode:
          withdrawalMethod === "BANK"
            ? ifscCode.trim().toUpperCase()
            : null,

        bankName:
          withdrawalMethod === "BANK"
            ? bankName.trim()
            : null,

        upiId:
          withdrawalMethod === "UPI"
            ? upiId.trim()
            : null,

        status: "PENDING",

        walletTransactionId: walletTransaction.id,

        rejectionReason: null,
        failureReason: null,
        processedAt: null,
      },
      {
        transaction,
      }
    );

    /* ---------------------------------
       15. Commit
    --------------------------------- */

    await transaction.commit();
    transaction = null;

    /* ---------------------------------
       16. Response
    --------------------------------- */

    return res.status(201).json({
      message: "Withdrawal request submitted successfully",
      success: true,
      withdrawal: {
        id: withdrawal.id,
        amount: withdrawal.amount,
        withdrawalMethod: withdrawal.withdrawalMethod,
        status: withdrawal.status,
        walletTransactionId: withdrawal.walletTransactionId,
        createdAt: withdrawal.createdAt,
      },
    });
  } catch (error) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        // Original error will be handled by global error handler.
      }
    }

    next(error);
  }
};




exports.getWithdrawalHistory = async (req, res, next) => {
  const userId = req.user?.id;

  const {
    startingDate,
    endingDate,
    withdrawalMethod,
    status,
    pageNumber = 1,
  } = req.query;

  try {
    /* ---------------------------------
       1. Authentication
    --------------------------------- */

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized user",
        success: false,
      });
    }

    /* ---------------------------------
       2. Page validation
    --------------------------------- */

    const page = Number(pageNumber);

    if (!Number.isInteger(page) || page < 1) {
      return res.status(400).json({
        message: "Invalid page number",
        success: false,
      });
    }

    /* ---------------------------------
       3. Filter validation
    --------------------------------- */

    if (
      withdrawalMethod &&
      !["BANK", "UPI"].includes(withdrawalMethod)
    ) {
      return res.status(400).json({
        message: "Invalid withdrawal method",
        success: false,
      });
    }

    const allowedStatuses = [
      "PENDING",
      "APPROVED",
      "REJECTED",
      "PROCESSING",
      "SUCCESS",
      "FAILED",
    ];

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid withdrawal status",
        success: false,
      });
    }

    /* ---------------------------------
       4. Build filter
    --------------------------------- */

    const whereCondition = {
      userId,
    };

    if (startingDate && endingDate) {
      whereCondition.createdAt = {
        [Op.between]: [startingDate, endingDate],
      };
    } else if (startingDate) {
      whereCondition.createdAt = {
        [Op.gte]: startingDate,
      };
    } else if (endingDate) {
      whereCondition.createdAt = {
        [Op.lte]: endingDate,
      };
    }

    if (withdrawalMethod) {
      whereCondition.withdrawalMethod = withdrawalMethod;
    }

    if (status) {
      whereCondition.status = status;
    }

    /* ---------------------------------
       5. Pagination
    --------------------------------- */

    const limit = 10;
    const offset = (page - 1) * limit;

    /* ---------------------------------
       6. Fetch withdrawal history
    --------------------------------- */

    const {
      rows: withdrawalDetails,
      count: totalRecords,
    } = await WalletWithdrawal.findAndCountAll({
      where: whereCondition,

      attributes: [
        "id",
        "amount",
        "withdrawalMethod",
        "accountHolderName",
        "accountNumber",
        "ifscCode",
        "bankName",
        "upiId",
        "status",
        "walletTransactionId",
        "rejectionReason",
        "failureReason",
        "processedAt",
        "createdAt",
      ],

      order: [["createdAt", "DESC"]],

      offset,
      limit,
    });

    const totalPages = Math.ceil(totalRecords / limit);

    /* ---------------------------------
       7. Mask sensitive information
    --------------------------------- */

    const formattedWithdrawals = withdrawalDetails.map(
      (withdrawal) => {
        const data = withdrawal.toJSON();

        if (data.accountNumber) {
          const accountNumber = String(data.accountNumber);

          data.accountNumber =
            accountNumber.length > 4
              ? `${"X".repeat(accountNumber.length - 4)}${accountNumber.slice(-4)}`
              : accountNumber;
        }

        return data;
      }
    );

    /* ---------------------------------
       8. Response
    --------------------------------- */

    return res.status(200).json({
      message: "Withdrawal history fetched successfully",
      success: true,
      withdrawalDetails: formattedWithdrawals,
      pagination: {
        currentPage: page,
        limit,
        totalRecords,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};