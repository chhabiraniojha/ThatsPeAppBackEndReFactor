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

function buildWhereConditionForWalletTransactions(startingDate, endingDate, transactionType, balanceType, rechargeTypeId, status, walletId) {
    let whereCondition = {}

    if (walletId) {
        whereCondition.walletId = walletId
    }
    if (startingDate && endingDate) {
        whereCondition.createdAt = {
            [Op.between]: [startingDate, endingDate]
        }
    }
    if (rechargeTypeId) {
        if (Array.isArray(rechargeTypeId) && rechargeTypeId.length > 0) {
            whereCondition.rechargeTypeId = {
                [Op.in]: rechargeTypeId
            }
        }
    }
    if (transactionType) {
        whereCondition.transactionType = transactionType
    }
    if (balanceType) {
        whereCondition.balanceType = balanceType
    }
    if (status) {
        whereCondition.status = status
    }
    // console.log(whereCondition);
    return whereCondition
}

exports.getAllWalletTransactions = async (req, res) => {
    const userId = req.user.id
    const { startingDate, endingDate, transactionType, balanceType, rechargeTypeId, status, pageNumber } = req.query

    try {
        const getWalletFromUser = await walletModel.findOne({ where: { userId: userId } })
        if (!getWalletFromUser) {
            return res.status(200).json({ message: "No wallets found", success: false, statuscode: 0 })
        }
        const walletId = getWalletFromUser.dataValues.id
        let whereCondition = {}
        if (!startingDate && !endingDate && !transactionType && !balanceType && !rechargeTypeId && !status) {
            whereCondition = {}
        }
        whereCondition = buildWhereConditionForWalletTransactions(startingDate, endingDate, transactionType, balanceType, rechargeTypeId, status, walletId)
        const walletTransactionDetails = await walletTransactionModel.findAll({
            where: whereCondition,
            order: [['createdAt', 'DESC']],
            offset: (pageNumber - 1) * 10,
            limit: 10
        })
        return res.status(200).json({ message: "Wallet transaction details fetched successfully", success: true, statuscode: 1, walletTransactionDetails })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", success: false })
    }
}







