const userModel = require('../../models/UserModels/UserSchema/user')
const walletModel = require('../../models/WalletModels/WalletSchema/wallet')
const paymentTransactionModel = require('../../models/PaymentTransactionModel/paymentTransaction')
const allTransactionsModel = require('../../models/RechargeAndBillPaymentTransactionsModels/rechargeAndBillPaymentTransactions')
const walletTransactionModel = require('../../models/WalletModels/Wallet Transaction/walletTransaction')
let uid = require('../../util/uidGenerator')
const { default: axios } = require('axios')
const subCategory = require('../../models/SubCategoryModel/subCategory')
const requestIp = require('request-ip');
const sequelize = require('../../util/db_connect')
const Sequelize = require('sequelize')




// ---------------CREATE WALLET-----------------
exports.createWallet = async (req, res) => {
    const { userId } = req.body

    const id = await uid()
    const amount = 0.0
    try {
        const createWallet = await walletModel.create({ id, userId, amount })
        res.status(200).json({ message: "Wallet created successfully", success: true, createWallet, statuscode: 1 })
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", success: false, error: error })
    }
}

// ---------------GET WALLET AMOUNT-----------------
exports.getWalletDetails = async (req, res) => {
    const userId = req.user.id
    try {

        const wallet = await walletModel.findOne({ where: { userId: userId } })
        if (wallet == null) {
            return res.status(200).json({ message: "Wallet not created", success: false, statuscode: 0 })
        }
        return res.status(200).json({ message: "Your wallet details fetched successfully", success: true, statuscode: 1, wallet })

    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", success: false })
    }
}

// ---------------DEBIT WALLET AMOUNT-----------------

// exports.debitAmount = async (req, res) => {
//     const { deductAmount, rechargeTypeId, purpose, userId } = req.body;

//     try {
//         const walletDetails = await walletModel.findOne({ where: { userId } });
//         if (!walletDetails) {
//             return res.status(404).json({ message: "Wallet not found", success: false, statuscode: 0 });
//         }
//         if (deductAmount < 0) {
//             return res.status(400).json({ message: "Deduct amount must be positive", success: false, statuscode: 0 });
//         }

//         const subCategoryDetails = await subCategory.findByPk(rechargeTypeId);
//         if (!subCategoryDetails) {
//             return res.status(400).json({ message: "Invalid sub category", success: false, statuscode: 0 });
//         }

//         // Initiate transaction log
//         const initiateWalletTransaction = await axios.post(
//             `${process.env.SERVER_BASEUSRL}/user/wallet-transaction/initiate`,
//             {
//                 walletId: walletDetails.dataValues.id,
//                 amount: deductAmount,
//                 transactionType: "Recharge",
//                 balanceType: "Debit",
//                 rechargeTypeId,
//                 paymentTransactionId: null
//             }
//         );

//         // Atomic update: deduct only if sufficient balance
//         const [updatedRows] = await walletModel.update(
//             {
//                 amount: sequelize.literal(`amount - ${deductAmount}`)
//             },
//             {
//                 where: {
//                     userId,
//                     amount: { [Sequelize.Op.gte]: deductAmount }
//                 }
//             }
//         );

//         // If no rows updated, balance was insufficient
//         if (updatedRows === 0) {
//             return res.status(200).json({
//                 message: "Insufficient Wallet balance",
//                 success: false,
//                 statuscode: 0
//             });
//         }

//         const updatedWallet = await walletModel.findOne({ where: { userId } });

//         // Finalize transaction
//         await axios.post(`${process.env.SERVER_BASEUSRL}/user/wallet-transaction/update`, {
//             walletTransactionId: initiateWalletTransaction.data.walletTransactionId,
//             endingBalance: updatedWallet.amount,
//             status: "success",
//             failureReason: ""
//         });

//         return res.status(200).json({
//             message: "Amount debited successfully for recharge",
//             success: true,
//             statuscode: 1,
//             initiateWalletTransaction: initiateWalletTransaction.data
//         });

//     } catch (error) {
//         //   console.error("Error in debitAmount:", error);
//         return res.status(500).json({ message: "Internal Server Error", success: false });
//     }

// }
exports.debitAmount = async ({ deductAmount, rechargeTypeId, purpose, userId }) => {


    try {
        const walletDetails = await walletModel.findOne({ where: { userId } });
        if (!walletDetails) {
            return { message: "Wallet not found", success: false, statuscode: 0 } ;
        }
        if (deductAmount < 0) {
            return { message: "Deduct amount must be positive", success: false, statuscode: 0 };
        }

        const subCategoryDetails = await subCategory.findByPk(rechargeTypeId);
        if (!subCategoryDetails) {
            return { message: "Invalid sub category", success: false, statuscode: 0 };
        }

        // Initiate transaction log
        const initiateWalletTransaction = await axios.post(
            `${process.env.SERVER_BASEUSRL}/user/wallet-transaction/initiate`,
            {
                walletId: walletDetails.dataValues.id,
                amount: deductAmount,
                transactionType: "Recharge",
                balanceType: "Debit",
                rechargeTypeId,
                paymentTransactionId: null
            }
        );

        // Atomic update: deduct only if sufficient balance
        const [updatedRows] = await walletModel.update(
            {
                amount: sequelize.literal(`amount - ${deductAmount}`)
            },
            {
                where: {
                    userId,
                    amount: { [Sequelize.Op.gte]: deductAmount }
                }
            }
        );

        // If no rows updated, balance was insufficient
        if (updatedRows === 0) {
            return {
                message: "Insufficient Wallet balance",
                success: false,
                statuscode: 0
            };
        }

        const updatedWallet = await walletModel.findOne({ where: { userId } });

        // Finalize transaction
        await axios.post(`${process.env.SERVER_BASEUSRL}/user/wallet-transaction/update`, {
            walletTransactionId: initiateWalletTransaction.data.walletTransactionId,
            endingBalance: updatedWallet.amount,
            status: "success",
            failureReason: "" 
        });

        return {
            message: "Amount debited successfully for recharge",
            success: true,
            statuscode: 1,
            initiateWalletTransaction: initiateWalletTransaction.data
        };

    } catch (error) {
        //   console.error("Error in debitAmount:", error);
        return { message: "Internal Server Error", success: false };
    }

}

// ---------------CREDIT WALLET AMOUNT-----------------
exports.addFund = async ({ amount, paymentTransactionId, userId }) => {
    // const user = req.user
    // let { amount, paymentTransactionId, userId } = req.body

    try {

        if (!amount || !paymentTransactionId) {
            return { message: "Please Provied The Valied Details", success: false, statuscode: 0 }

        }
        amount = parseInt(amount)

        const wallet = await walletModel.findOne({
            where: {
                // id: walletId,
                userId: userId
            }
        })


        if (!wallet) {
            return { message: "No wallet found", success: false, statuscode: 0 }
        }
        const startingBalance = wallet.amount
        // console.log(startingBalance);
        const paymentTransaction = await paymentTransactionModel.findOne({
            where: {
                id: paymentTransactionId,
                UserId: userId
            }
        })

        const initiateWalletTransaction = await axios.post(`${process.env.SERVER_BASEUSRL}/user/wallet-transaction/initiate`, {
            walletId: wallet.id,
            amount: amount,
            transactionType: "Add Funds",
            balanceType: "Credit",
            rechargeTypeId: null,
            paymentTransactionId: paymentTransactionId
        })
        if (initiateWalletTransaction.data.statuscode != 1) {
            return { message: "Unable to initiate transaction", success: false, statuscode: 0 }
        }
        if (!paymentTransaction) {
            await axios.post(`${process.env.SERVER_BASEUSRL}/user/wallet-transaction/update`, {
                walletTransactionId: initiateWalletTransaction.data.walletTransactionId,
                endingBalance: startingBalance,
                status: 'failed',
                failureReason: "Payment transaction details not found"
            })
            return { message: "Payment Transaction Details Not Found", success: false, statuscode: 0 }
        }
        if (paymentTransaction.status != 'success') {
            await axios.post(`${process.env.SERVER_BASEUSRL}/user/wallet-transaction/update`, {
                walletTransactionId: initiateWalletTransaction.data.walletTransactionId,
                endingBalance: startingBalance,
                status: 'failed',
                failureReason: "Payment not received"
            })
            return { message: "Payment Not Received", success: false, statuscode: 0 }
        }
        if (paymentTransaction.isUsed) {
            await axios.post(`${process.env.SERVER_BASEUSRL}/user/wallet-transaction/update`, {
                walletTransactionId: initiateWalletTransaction.data.walletTransactionId,
                endingBalance: startingBalance,
                status: 'failed',
                failureReason: "Action Already Done For This Payment Transaction"
            })
            return { message: "Action Already Done For This Payment Transaction", success: false, statuscode: 0 }
        }
        const endingBalance = startingBalance + amount

        await wallet.update({ amount: endingBalance })
        await paymentTransaction.update({
            isUsed: 1
        })

        const response = await axios.post(`${process.env.SERVER_BASEUSRL}/user/wallet-transaction/update`, {
            walletTransactionId: initiateWalletTransaction.data.walletTransactionId,
            endingBalance: endingBalance,
            status: 'success',
            failureReason: null
        })

        return { message: `Rs. ${amount} added to your wallet successfully`, success: true, statuscode: 1, transitionDate: response.data.walletUpdateResponse.updatedAt }
    } catch (error) {
        console.log(error);
        return { message: "Internal Server Error", success: false, error: error }
    }
}

exports.refund = async (req, res) => {

    const { allTransactionId } = req.body

    // Validation for amount

    try {
        const transactionDetails = await allTransactionsModel.findOne({
            where: {
                id: allTransactionId,
                status: 'failed',
                refundStatus: 0
            }
        })
        if (!transactionDetails) {
            return res.status(200).json({ message: "Transaction details not found", success: false, statuscode: 0 })
        }
        // console.log(transactionDetails);
        const paymentTransactionType = transactionDetails.dataValues.paymentTransactionType
        // console.log("paymentTransactionType--", paymentTransactionType);
        let amount = 0
        if (paymentTransactionType == 'cash') {
            const paymentTransactionDetails = await paymentTransactionModel.findByPk(transactionDetails.dataValues.cashPaymentTransactionId)
            amount = paymentTransactionDetails.dataValues.transactionAmount
            // console.log("amount --", amount);
        } else {
            const paymentTransactionDetails = await walletTransactionModel.findByPk(transactionDetails.dataValues.WalletPaymentTransactionId)
            amount = paymentTransactionDetails.dataValues.amount
            // console.log("amount --", amount);
        }
        const getUserWallet = await walletModel.findOne({ where: { userId: transactionDetails.dataValues.UserId } })
        const walletId = getUserWallet.dataValues.id
        const initiateRefundTransaction = await axios.post(`${process.env.SERVER_BASEUSRL}/user/wallet-transaction/initiate`, {
            walletId: walletId,
            amount: amount,
            transactionType: "Refund",
            balanceType: "Credit",
            rechargeTypeId: null,
            paymentTransactionId: null,
            transactionId:allTransactionId
        })

        const startingBalance = getUserWallet.dataValues.amount
        // console.log(startingBalance);

        // console.log("------------------ intiate ",initiateRefundTransaction)
        if (initiateRefundTransaction.data.statuscode != 1) {
            const updateRefundTransaction = await axios.post(`${process.env.SERVER_BASEUSRL}/user/wallet-transaction/update`, {
                walletTransactionId: initiateRefundTransaction.data.walletTransactionId,
                endingBalance: startingBalance,
                status: "failed",
                failureReason: "Wallet not found"
            })
            // console.log(updateRefundTransaction);
            return res.status(200).json({ message: "Could not perform refund. Conatct support", success: false, statuscode: 0 })
        }
        const endingBalance = startingBalance + amount
        // console.log(endingBalance);

        await getUserWallet.update({
            amount: endingBalance
        })

        await axios.post(`${process.env.SERVER_BASEUSRL}/user/wallet-transaction/update`, {
            walletTransactionId: initiateRefundTransaction.data.walletTransactionId,
            endingBalance: endingBalance,
            status: "success",
            failureReason: ""
        })

        await transactionDetails.update({
            refundStatus: 1
        })

        return res.status(200).json({ message: "Refund amount credited successfully", success: true, statuscode: 1 })
    } catch (error) {
        // console.log(error)
        return res.status(500).json({ message: "Internal Server Error", success: false, error })
    }
}
exports.rechargeUsingWallet = async (req, res) => {

}


