const walletModel = require('../../models/WalletModels/WalletSchema/wallet')
const walletTransactionModel = require('../../models/WalletModels/Wallet Transaction/walletTransaction')
let uid = require('../../util/uidGenerator')
const uidgenerate = require('../../util/uidGenerator')
const { Op } = require('sequelize');



exports.initiateWalletTransaction = async (req, res) => {
    const { walletId, amount, transactionType, balanceType, rechargeTypeId, paymentTransactionId } = req.body
    let {transactionId}=req.body 
    transactionId=transactionId||null
    const id = await uidgenerate()
    try {
        const wallet = await walletModel.findByPk(walletId)
        if (!wallet) {
            return res.status(200).json({ message: "Wallet not found", success: false, statuscode: 0 })
        }
        const startingBalance = wallet.amount
        const createWalletTransaction = await walletTransactionModel.create({
            id, walletId, amount, startingBalance, transactionType, balanceType, rechargeTypeId, paymentTransactionId,transactionId
        })
        // console.log(createWalletTransaction);

        return res.status(200).json({ message: "Wallet transaction created successfully", success: true, statuscode: 1, walletTransactionId: id })
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error!", success: false, error })
    }
}

exports.updateTransactionStatus = async (req, res) => {
    const { walletTransactionId, endingBalance, status, failureReason } = req.body

    try {
        const walletTransaction = await walletTransactionModel.findOne({ where: { id: walletTransactionId } })
        if (!walletTransaction) {
            return res.status(200).json({ message: "Wallet transaction not found", success: false, statuscode: 0 })
        }
        const walletUpdateResponse=await walletTransaction.update({
            endingBalance,
            status,
            failureReason
        })
        return res.status(200).json({ message: "Wallet transaction updated successfully", success: true, statuscode: 1,walletUpdateResponse:walletUpdateResponse })
    } catch (error) {
        // console.log(error);
        return res.status(500).json({ message: "Internal Server Error!", success: false, error })
    }
}

exports.getAllTransactions = async (req, res) => {
    const { walletId } = req.body

    try {
        const walletTransactions = await walletTransactionModel.findAll({ where: { walletId: walletId } })
        if (walletTransactions.length == 0) {
            res.status(200).json({ message: "No transactions found", success: false, statuscode: 0 })
        } else {
            res.status(200).json({ message: "Transacions found", success: true, walletTransactions, statuscode: 1 })
        }
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", success: false })
    }
}



function buildWhereConditionForWalletTransactions(
    startingDate,
    endingDate,
    transactionType,
    balanceType,
    status,
    walletId
) {
    const whereCondition = {
        walletId,
    };

    // Date filter
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

    // Transaction type filter
    if (transactionType) {
        whereCondition.transactionType = transactionType;
    }

    // Balance type filter
    if (balanceType) {
        whereCondition.balanceType = balanceType;
    }

    // Status filter
    if (status) {
        whereCondition.status = status;
    }

    return whereCondition;
}

exports.getAllWalletTransactions = async (req, res, next) => {
    const userId = req.user?.id;

    const {
        startingDate,
        endingDate,
        transactionType,
        balanceType,
        status,
        pageNumber = 1,
    } = req.query;

    try {
        // Check authenticated user
        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized user",
                success: false,
            });
        }

        // Validate page number
        const page = Number(pageNumber);

        if (!Number.isInteger(page) || page < 1) {
            return res.status(400).json({
                message: "Invalid page number",
                success: false,
            });
        }

        // Find wallet belonging to logged-in user
        const wallet = await walletModel.findOne({
            where: {
                userId,
            },
            attributes: ["id"],
        });

        if (!wallet) {
            return res.status(200).json({
                message: "No wallets found",
                success: true,
                walletTransactionDetails: [],
                pagination: {
                    currentPage: page,
                    limit: 10,
                    totalRecords: 0,
                    totalPages: 0,
                },
            });
        }

        const walletId = wallet.id;

        // Build transaction filters
        const whereCondition =
            buildWhereConditionForWalletTransactions(
                startingDate,
                endingDate,
                transactionType,
                balanceType,
                status,
                walletId
            );

        const limit = 10;
        const offset = (page - 1) * limit;

        // Fetch transactions + total count
        const {
            rows: walletTransactionDetails,
            count: totalRecords,
        } = await walletTransactionModel.findAndCountAll({
            where: whereCondition,
            order: [["createdAt", "DESC"]],
            offset,
            limit,
        });

        const totalPages = Math.ceil(totalRecords / limit);

        return res.status(200).json({
            message: "Wallet transaction details fetched successfully",
            success: true,
            walletTransactionDetails,
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








