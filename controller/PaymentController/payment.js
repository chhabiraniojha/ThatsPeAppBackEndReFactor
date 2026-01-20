
const axios = require('axios');
const sequelize = require('../../util/db_connect')
const User = require("../../models/UserModels/UserSchema/user")
const PaymentTransaction = require("../../models/PaymentTransactionModel/paymentTransaction")
const UIDGenerator = require("../../util/uidGenerator")
const { getSocketInstance } = require("../../util/socket")
const operatorModel = require('../../models/OperatorDataModel/operatorData')
const requestIp = require('request-ip');
const paymentInitiateLogModel = require('../../models/logModel/paymentInitiateLog')
const walletController = require('../../controller/WalletController/wallet')






// function generateTransactionId() {
//     const timeStamp = Date.now();
//     const randomNum = Math.floor(Math.random() * 1000000);
//     const merchentPrefiex = "T";
//     const TransactionId = `${merchentPrefiex}${timeStamp}${randomNum}`
//     return TransactionId
// }

// // console.log(merchantTransactionId)

const newPayment = async (req, res) => {
    const { ezytm_circle_code, ezytm_operator_code, customer_number, amount, subCategoryId, transactionType, status, rechargeType, discountedAmount, purpose } = req.body
    const clientIp = requestIp.getClientIp(req);
    try {
        const user = req.user;
        const userId = user.id
        const paymentTransactionId = await UIDGenerator();
        const paymentInitiateLogId = await UIDGenerator();
        const { transactionFor } = req.body;
        let finalAmount


        let callbackData = {};
        // check the purpose is correct or not 

        if (!(purpose && (purpose == "recharge") || (purpose == "addfund"))) {

            return res.status(200).json({
                success: false,
                statusCode: 0,
                message: "Missing Purpose ",


            });
        }

        if ((purpose == "recharge") && !(amount && customer_number && subCategoryId && userId && status)) {
            return res.status(200).json({
                success: false,
                statusCode: 0,
                message: "Missing Recharge Details ",

            });

        }

        if ((purpose == "addfund") && !(amount && paymentTransactionId && userId)) {
            return res.status(200).json({
                success: false,
                statusCode: 0,
                message: "Missing Walet Recharge Details ",

            });

        }
        // Prepare the callback data according to required
        if (purpose == "recharge") {
            const operatorData = await operatorModel.findOne({
                where: { ezytm_operator_code: ezytm_operator_code }
            })

            const discountAmount = operatorData.discount
            const discountType = operatorData.discount_type
            // const deductAmount=(amount*discountAmount)/100
            if (discountType == "percentage") {

                finalAmount = amount - (amount * discountAmount) / 100

            } else {
                finalAmount = amount - discountAmount
            }
            finalAmount = Math.ceil(finalAmount * 10) / 10

            if (discountedAmount != finalAmount) {
                return res.status(200).json({
                    success: false,
                    statusCode: 0,
                    message: "Discounted  amount is not perfect ",


                });
            }
            //math.cell use for all api to round the amont 


            callbackData = {
                ezytm_circle_code,
                ezytm_operator_code,
                customer_number,
                amount,
                subCategoryId,
                transactionType,
                status,
                rechargeType,
                discountedAmount,
                finalAmount,
                purpose,
                userId
            }

        }
        if (purpose == "addfund") {
            callbackData = {
                amount,
                userId,
                purpose
            }
        }

        // Encode the callback data
        const encodedData = Buffer.from(JSON.stringify(callbackData)).toString('base64');
        // Decode the callback data

        await PaymentTransaction.create({
            id: paymentTransactionId,
            transactionAmount: purpose == 'recharge' ? finalAmount : amount,
            transactionFor,
            userId: user.id
        });
        // paymentInitiateLog Create 
        try {
            await paymentInitiateLogModel.create({
                id: paymentInitiateLogId,
                userId,
                purpose,
                addAmount: purpose == 'recharge' ? null : amount,
                originalAmount: purpose == 'recharge' ? amount : null,
                discountedAmount,
                ezytmCircleCode: ezytm_circle_code,
                ezytmOperatorCode: ezytm_operator_code,
                paymentTransactionId,
                clientIp
            })
        } catch (error) {
            console.log(error)

        }



        const data = {
            "token": process.env.AllAPI_TOKEN,
            "order_id": paymentTransactionId,
            "txn_amount": purpose == 'recharge' ? finalAmount : amount,
            "txn_note": `Pay For ${transactionFor}`,
            "product_name": transactionFor,
            "customer_name": user.name,
            "customer_mobile": user.mobileNo,
            "customer_email": user.email,
            "redirect_url": `${process.env.SERVER_BASEUSRL}/user/payment/cb-status/${paymentTransactionId}?data=${encodedData}`

        };

        const response = await axios.post(`https://allapi.in/order/create`, data);
        console.log(response);


        if (response.data.status == true) {
            return res.status(200).json({ success: true, statusCode: 1, URL: response.data.results.payment_url, paymentTransactionId, message: "payment URL ready" })
        } else {
            return res.status(200).json({ success: false, statusCode: 0, URL: response.data.results.payment_url, message: "Some error happens,contact customer support" })
        }


    } catch (error) {
        console.log(error)
        return res.status(500).json({
            amount,
            error
        })
    }
}
// Payment Status call back 

const paymentStatusCallBack = async (req, res) => {
    const clientIp = requestIp.getClientIp(req);
    const io = getSocketInstance();
    const paymentTransactionId = req.params.id;
    const encodedData = req.query.data;
    console.log("socket io on paymet status", io)
    console.log("client Ip", clientIp)

    // if(clientIp!=process.env.ALLAPI_IP){
    //     return res.status(400).json({
    //         success: false,
    //         statusCode: 0,            
    //         message: "Authentication Failed"
    //     });
    // }

    // console.log("ip->",clientIp)
    // io.to(paymentTransactionId).emit("paymet-status", { message: "Payment Successful", success: true, statuscode: 1 })
    // // return res.status(200).json({ success: false, statusCode: 0, message: "Testing socket io on payment js", paymentTransactionId })

    try {
        if (!encodedData) {
            return res.status(400).json({
                success: false,
                statusCode: 0,
                message: "Missing callback data"
            });
        }

        // // Decode the callback data
        const decodedData = JSON.parse(Buffer.from(encodedData, 'base64').toString('utf8'));
        // console.log("Decoded Callback Data:", decodedData);

        const { purpose } = decodedData;
        let ezytm_circle_code, ezytm_operator_code, customer_number, amount, subCategoryId, transactionType, status, rechargeType, discountedAmount, userId
        if (purpose == "recharge") {
            ({
                ezytm_circle_code,
                ezytm_operator_code,
                customer_number,
                amount,
                subCategoryId,
                transactionType,
                status,
                rechargeType,
                discountedAmount,
                finalAmount,
                userId

            } = decodedData)
        }
        if (purpose == "addfund") {
            ({
                amount,
                userId

            } = decodedData)
        }

        // let purpose = "addfund"

        // let ezytm_circle_code = "97"
        // let ezytm_operator_code = "2"

        // let discountedAmount = 9.5
        // let amount = 10
        // let rechargeType = "PREPAID"    
        // let transactionType = "cash"
        // let subCategoryId = "JxQmQdtoe3BVwAwDXbiGCR"
        // let customer_number = "9318480452"
        // let status = "pending"
        // let userId = "Sru7XUcJJ9sCNrFDP7hRpZ"



        const PaymentTransationIdCheck = await PaymentTransaction.findOne({
            where: {
                id: paymentTransactionId,
                isUsed: false
            }

        })

        if (!PaymentTransationIdCheck) {
            return res.status(200).json({
                success: false,
                statusCode: 0,
                status: "failed",
                message: "No Payment transation found or It is Alredy Used",

            });
        }
        console.log(paymentTransactionId)
        // console.log(PaymentTransationIdCheck)

        const data = {
            "token": process.env.AllAPI_TOKEN,
            "order_id": paymentTransactionId
        }

        // CHECK PAYMENT STATUS
        axios.post("https://allapi.in/order/status", data).then(async (response) => {
            // console.log(1)
            console.log(response.data)
            let totalPaidAmount = response.data.results.txn_amount
            // console.log("xxxxxxxxxxx paybullTotalAmount ------------",totalPaidAmount)
            if ((purpose == "addfund" && totalPaidAmount != amount) || (purpose == "recharge" && totalPaidAmount != finalAmount)) {
                return
            }

            if (response.data.status && response.data.results.status == "Success") {
                await PaymentTransaction.update(
                    { status: "success" },
                    {
                        where: {
                            id: paymentTransactionId
                        }
                    }
                )

                //Socket Intigration emit for payment status

                io.to(paymentTransactionId).emit("payment-status", { message: "Payment Successful", success: true, statuscode: 1 })
                console.log(paymentTransactionId, amount, userId, purpose)

                if (purpose == "recharge") {


                    try {
                        const rechargeResponse = await axios.post(`${process.env.SERVER_BASEUSRL}/user/recharge-and-billpayments`, { ezytm_circle_code, ezytm_operator_code, customer_number, amount, paymentTransactionId, subCategoryId, transactionType, status, rechargeType, discountedAmount, userId, finalAmount })
                        // console.log("recharge response------xxx", rechargeResponse)

                        if (rechargeResponse.data.statuscode == 1) {
                            io.to(paymentTransactionId).emit("recharge-status", { message: rechargeResponse.data.message, success: true, statuscode: 1, rechargeDate: rechargeResponse.data.rechargeDate })
                            return
                        }
                        if (rechargeResponse.data.statuscode == 0) {
                            io.to(paymentTransactionId).emit("recharge-status", { message: rechargeResponse.data.message, success: false, statuscode: 0, rechargeDate: rechargeResponse.data.rechargeDate })
                            return
                        }
                        if (rechargeResponse.data.statuscode == 2) {
                            io.to(paymentTransactionId).emit("recharge-status", { message: rechargeResponse.data.message, success: false, statuscode: 2, rechargeDate: rechargeResponse.data.rechargeDate })
                            return
                        }


                    } catch (error) {
                        console.log(error)

                        io.to(paymentTransactionId).emit("recharge-status", { message: "Internal Server Error", success: false, statuscode: 0, error: error })
                        return
                    }
                }

                if (purpose == "addfund") {
                    try {
                        const addFundResponse = await walletController.addFund({ paymentTransactionId, amount, userId })

                        console.log("addfund---------------------", addFundResponse)
                        console.log("addfund1---------------------", addFundResponse.statuscode)
                        console.log("paymentTransactionId---------------------", paymentTransactionId)

                        if (addFundResponse.statuscode == 1) {
                            console.log("paymentTransactionId>---------------------", paymentTransactionId)
                            setTimeout(() => {
                                io.to(paymentTransactionId).emit("addfund-status", { message: addFundResponse.message, success: true, statuscode: 1, transitionDate: addFundResponse.transitionDate })
                                return
                            }, 5000);

                        }
                        if (addFundResponse.statuscode == 0) {
                            io.to(paymentTransactionId).emit("addfund-status", { message: addFundResponse.message, success: false, statuscode: 0 })
                            return
                        }
                        // console.log("--------------------- checking the api is remain  hiting----")

                    } catch (error) {
                        io.to(paymentTransactionId).emit("addfund-status", { message: "Internal Server Error", success: false, statuscode: 0 })
                        return

                    }
                }




                // return res.status(200).json({
                //     success: true,
                //     statusCode: 1,
                //     status: "Success",
                //     message: "Payment successful",
                //     paymentTransactionId
                // });
            }

            else if (response.data.status == false) {
                await PaymentTransaction.update(
                    { status: "failed" },
                    {
                        where: {
                            id: paymentTransactionId
                        }
                    }
                )
                io.to(paymentTransactionId).emit("payment-status", { message: "Payment failed", success: false, statuscode: 0 })

                return res.status(200).json({
                    success: false,
                    statuCode: 0,
                    status: "Failed",
                    message: "Payment failed or pending"
                });
            }

        })
    }
    catch {
        (error) => {
            console.log(error);
            return res.status(500).json({ success: false, statusCode: 0, message: "Internal server error" });
        }
    };
};
const testAddwalet = async (req, res) => {
    let { amount, paymentTransactionId, userId } = req.body
    try {
 
        walletDebitResponse = await walletController.debitAmount({ deductAmount: amount, rechargeTypeId: paymentTransactionId, userId })

        console.log("----->walletDebitResponse --->", walletDebitResponse, walletDebitResponse.success, walletDebitResponse.message)

        // const addFundResponse = await walletController.addFund({ paymentTransactionId, amount, userId })

        // console.log("addfund---------------------", addFundResponse)
        // console.log("addfund1---------------------", addFundResponse. statuscode)
        // console.log("paymentTransactionId---------------------", paymentTransactionId)

        // if (addFundResponse.statuscode == 1) {

        //     setTimeout(() => {
        //         // io.to(paymentTransactionId).emit("addfund-status", { message: addFundResponse.message, success: true, statuscode: 1, transitionDate: addFundResponse.transitionDate })
        //         return
        //     }, 5000);

        // }
        // if (addFundResponse.statuscode == 0) {
        //     // io.to(paymentTransactionId).emit("addfund-status", { message: addFundResponse.message, success: false, statuscode: 0 })
        //     return
        // }
        // console.log("--------------------- checking the api is remain  hiting----")

    } catch (error) {
        console.log(error)
        // io.to(paymentTransactionId).emit("addfund-status", { message: "Internal Server Error", success: false, statuscode: 0 })
        return

    }
}

const getPaymentStatus = async (req, res) => {
    const paymentTransactionId = req.params.id;

    try {
        const transaction = await PaymentTransaction.findOne({ where: { id: paymentTransactionId } });

        if (!transaction) {
            return res.status(200).json({
                success: false,
                statusCode: 0,
                message: "Transaction not found"
            });
        }

        return res.status(200).json({
            success: true,
            statusCode: 1,
            status: transaction.status
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
            success: false
        });
    }
};

module.exports = {
    newPayment,
    paymentStatusCallBack,
    getPaymentStatus,
    testAddwalet
}
