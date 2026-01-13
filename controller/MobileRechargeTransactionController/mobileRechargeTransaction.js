const rechargeAndBillPaymentTransationModel = require('../../models/RechargeAndBillPaymentTransactionsModels/rechargeAndBillPaymentTransactions')
const userModel = require('../../models/UserModels/UserSchema/user')
const avelablleAPIsModel = require('../../models/APIModels/api')
let uid = require('../../util/uidGenerator')



exports.initiateRecharge = async (req, res) => {
    const { circleCode, operatorCode, customerNo, amount, userId, cashPaymentTransactionId, paymentTransactionType, status, subCategoryId, operator, circle, WalletPaymentTransactionId, discountedAmount } = req.body
    // console.log("Request Body for initiateRecharge transcation:", req.body)

    try {
        const user = await userModel.findOne({ where: { id: userId } })

        if (user == null) {
            res.status(201).json({ message: "User not found", success: false })
        } else {
            const Id = await uid()
            const apiId = null
            const apiTransactionId = null
            try {
                if ((status == 'pending' || status == 'success' || status == 'failed') && (paymentTransactionType == 'cash' || paymentTransactionType == 'wallet')) {
                     console.log("Request Body for initiateRecharge transcation:", req.body)

                    const rechargeTransaction = await rechargeAndBillPaymentTransationModel.create({ Id, userId: '8nSF489CFLAmqvyoem9dsq', apiId, amount, discountedAmount, operator, circle, customerNo, status, cashPaymentTransactionId, WalletPaymentTransactionId, paymentTransactionType, apiTransactionId, subCategoryId:'JxQmQdtoe3BVwAwDXbiGCR', circleCode, operatorCode })
                    res.status(200).json({ message: "Transaction intiated sucessfully ", success: true, statuscode: 1, rechargeTransaction })
                } else {
                    res.status(200).json({ message: "Invalid data", success: false, statuscode: 0 })
                }
            } catch (error) {
                console.log(error);
                res.status(500).json({ message: "Transaction failed due to some error", success: false, statuscode: 0, error })
            }
        }
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error!", success: false, error })
    }
}


exports.updateTransactionStatus = async (req, res) => {
    const { rechargeTransactionId, apiResponse, apiId } = req.body
    try {
        console.log("Update Transaction Status Request Body--- xxxxxxxxxxxxxxx :", req.body)
        const apiData=await avelablleAPIsModel.findOne({ where: { name: apiId } })
        if(!apiData){
            return res.status(200).json({ message: "Invalid API ID", success: false });
        }
        
        const rechargeTransaction = await rechargeAndBillPaymentTransationModel.findOne({ where: { Id: rechargeTransactionId } })
        if (rechargeTransaction == null) {
            res.status(201).json({ message: "No transaction found", success: false })
        } else {
            if (apiResponse == "FAILURE") {     
                console.log("Recharge failed due to some error-----------------------");
                const rechargeTransactionUpdate = await rechargeTransaction.update({ status: 'failed', APITransactionId: apiData?.dataValues?.id })
                res.status(202).json({ message: "Recharge failed due to some error", success: false, rechargeTransactionUpdate })
            } 
            if(apiResponse == "PENDING") {
                console.log("Recharge is pending-----------------------");
                const rechargeTransactionUpdate = await rechargeTransaction.update({ status: 'pending', APITransactionId: apiData?.dataValues?.id })
                res.status(200).json({ message: "Recharge Pending", success: false, rechargeTransactionUpdate })
            }
             if(apiResponse == "SUCCESS") {
                console.log("Recharge successful-----------------------");  
                const rechargeTransactionUpdate = await rechargeTransaction.update({ status: 'success', APITransactionId: apiData?.dataValues?.id })
                res.status(200).json({ message: "Recharge successful", success: true, rechargeTransactionUpdate })
            }
        }
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", success: false ,error})
    }
}

exports.getAllTransactions = async (req, res) => {
    const { userId } = req.body

    try {
        const userRechargeTransaction = await rechargeAndBillPaymentTransationModel.findAll({ where: { userId: userId } })
        if (userRechargeTransaction.length == 0) {
            res.status(201).json({ message: "No transactions found", success: false })
        } else {
            res.status(200).json({ message: "Transacions found", success: true, userRechargeTransaction })
        }
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", success: false })
    }
}


// fetch transaction history from the transaction table based on transaction sub category

exports.getLimitedTransactions = async (req, res) => {
    const { userId, page = 1 } = req.body;  // Get page from request body, default to 1 if not provided
    const pageSize = 10;  // Number of records per page

    try {
        const userRechargeTransaction = await rechargeAndBillPaymentTransationModel.findAll({
            where: { userId: userId },
            order: [['createdAt', 'DESC']],  // Sort by createdAt in descending order
            limit: pageSize,
            offset: (page - 1) * pageSize
        });

        if (userRechargeTransaction.length === 0) {
            res.status(201).json({ message: "No transactions found", success: false });
        } else {
            res.status(200).json({ message: "Transactions found", success: true, userRechargeTransaction });
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal Server Error", success: false });
    }
}




