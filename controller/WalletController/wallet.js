const userModel = require('../../models/UserModels/UserSchema/user');
const walletModel = require('../../models/WalletModels/WalletSchema/wallet');
const paymentTransactionModel = require('../../models/PaymentTransactionModel/paymentTransaction');
const allTransactionsModel = require('../../models/RechargeAndBillPaymentTransactionsModels/rechargeAndBillPaymentTransactions');
const paymentModel = require('../../models/PaymentModel/payment');
const walletTransactionModel = require('../../models/WalletModels/Wallet Transaction/walletTransaction');

let uid = require('../../util/uidGenerator');
const { default: axios } = require('axios');
const subCategory = require('../../models/SubCategoryModel/subCategory');
const requestIp = require('request-ip');
const sequelize = require('../../util/db_connect');
const Sequelize = require('sequelize');
const { sendEmail } = require('../../util/nodeMailerConfig');

// ---------------CREATE WALLET-----------------
exports.createWallet = async (req, res) => {
  const { userId } = req.body;

  const id = await uid();
  const amount = 0.0;
  try {
    const createWallet = await walletModel.create({ id, userId, amount });
    res.status(200).json({ message: 'Wallet created successfully', success: true, createWallet, statuscode: 1 });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', success: false, error: error });
  }
};

// ---------------GET WALLET AMOUNT-----------------
exports.getWalletDetails = async (req, res) => {
  const userId = req.user.id;
  try {
    const wallet = await walletModel.findOne({ where: { userId: userId } });
    if (wallet == null) {
      return res.status(200).json({ message: 'Wallet not created', success: false, statuscode: 0 });
    }
    return res.status(200).json({ message: 'Your wallet details fetched successfully', success: true, statuscode: 1, wallet });
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error', success: false });
  }
};

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
      return { message: 'Wallet not found', success: false, statuscode: 0 };
    }
    if (deductAmount < 0) {
      return { message: 'Deduct amount must be positive', success: false, statuscode: 0 };
    }

    const subCategoryDetails = await subCategory.findByPk(rechargeTypeId);
    if (!subCategoryDetails) {
      return { message: 'Invalid sub category', success: false, statuscode: 0 };
    }

    // Initiate transaction log
    const initiateWalletTransaction = await axios.post(`${process.env.SERVER_BASEUSRL}/user/wallet-transaction/initiate`, {
      walletId: walletDetails.dataValues.id,
      amount: deductAmount,
      transactionType: 'Recharge',
      balanceType: 'Debit',
      rechargeTypeId,
      paymentTransactionId: null
    });

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
        message: 'Insufficient Wallet balance',
        success: false,
        statuscode: 0
      };
    }

    const updatedWallet = await walletModel.findOne({ where: { userId } });

    // Finalize transaction
    await axios.post(`${process.env.SERVER_BASEUSRL}/user/wallet-transaction/update`, {
      walletTransactionId: initiateWalletTransaction.data.walletTransactionId,
      endingBalance: updatedWallet.amount,
      status: 'success',
      failureReason: ''
    });

    return {
      message: 'Amount debited successfully for recharge',
      success: true,
      statuscode: 1,
      initiateWalletTransaction: initiateWalletTransaction.data
    };
  } catch (error) {
    //   console.error("Error in debitAmount:", error);
    return { message: 'Internal Server Error', success: false };
  }
};

// ---------------CREDIT WALLET AMOUNT-----------------
exports.addFund = async ({ amount, paymentTransactionId, userId }) => {
  // const user = req.user
  // let { amount, paymentTransactionId, userId } = req.body
  // console.log('Add Fund Request Details:', { amount, paymentTransactionId, userId });
  try {
    if (!amount || !paymentTransactionId) {
      return { message: 'Please Provied The Valied Details', success: false, statuscode: 0 };
    }
    amount = parseInt(amount);

    const wallet = await walletModel.findOne({
      where: {
        // id: walletId,
        userId: userId
      }
    });

    if (!wallet) {
      return { message: 'No wallet found', success: false, statuscode: 0 };
    }
    const startingBalance = wallet.amount;
    // console.log(startingBalance);
    const paymentTransaction = await paymentModel.findOne({
      where: {
        id: paymentTransactionId,
        userId: userId
      }
    });
    if (!paymentTransaction) {
      return { message: 'Payment transaction not found', success: false, statuscode: 0 };
    }

    // console.log('Payment Transaction Details:', paymentTransaction?.dataValues?.id);


    // return { message: 'check new paymenttranscation ', success: false, statuscode: 0, paymentTransaction };
    const initiateWalletTransaction = await axios.post(`${process.env.SERVER_BASEUSRL}/user/wallet-transaction/initiate`, {
      walletId: wallet.id,
      amount: amount,
      transactionType: 'Add Funds',
      balanceType: 'Credit',
      rechargeTypeId: null,
      paymentTransactionId: paymentTransactionId
    });
    if (initiateWalletTransaction.data.statuscode != 1) {
      return { message: 'Unable to initiate transaction', success: false, statuscode: 0 };
    }
    if (!paymentTransaction) {
      await axios.post(`${process.env.SERVER_BASEUSRL}/user/wallet-transaction/update`, {
        walletTransactionId: initiateWalletTransaction.data.walletTransactionId,
        endingBalance: startingBalance,
        status: 'failed',
        failureReason: 'Payment transaction details not found'
      });
      return { message: 'Payment Transaction Details Not Found', success: false, statuscode: 0 };
    }
    if (paymentTransaction?.dataValues?.status != 'SUCCESS') {
      await axios.post(`${process.env.SERVER_BASEUSRL}/user/wallet-transaction/update`, {
        walletTransactionId: initiateWalletTransaction.data.walletTransactionId,
        endingBalance: startingBalance,
        status: 'failed',
        failureReason: 'Payment not received'
      });
      return { message: 'Payment Not Received', success: false, statuscode: 0 };
    }
    if (paymentTransaction?.dataValues?.isUsed) {
      await axios.post(`${process.env.SERVER_BASEUSRL}/user/wallet-transaction/update`, {
        walletTransactionId: initiateWalletTransaction.data.walletTransactionId,
        endingBalance: startingBalance,
        status: 'failed',
        failureReason: 'Action Already Done For This Payment Transaction'
      });
      return { message: 'Action Already Done For This Payment Transaction', success: false, statuscode: 0 };
    }
    const endingBalance = startingBalance + amount;

    await wallet.update({ amount: endingBalance });
    await paymentTransaction.update({
      isUsed: 1
    });

    const response = await axios.post(`${process.env.SERVER_BASEUSRL}/user/wallet-transaction/update`, {
      walletTransactionId: initiateWalletTransaction.data.walletTransactionId,
      endingBalance: endingBalance,
      status: 'success',
      failureReason: null
    });
    // send invoice email for add fund
    let html = `<!DOCTYPE html><html><body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:20px;">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:6px; padding:20px;">
        <!-- Header -->
        <tr>
          <td style="text-align:center; padding-bottom:15px;">
            <h2 style="margin:0; color:#222;">ThatSpe</h2>
            <p style="margin:6px 0 0; color:#2e7d32; font-size:14px;">
              Recharge Completed Successfully
            </p>
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="border-top:1px solid #e6e6e6; padding-top:15px;"></td>
        </tr>

        <!-- Message -->
        <tr>
          <td style="color:#333; font-size:14px; padding-bottom:15px;">
            Hi,<br/><br/>
            Your mobile recharge has been processed successfully.  
            Please find the payment receipt below for your reference.
          </td>
        </tr>

        <!-- Transaction Details -->
        <tr>
          <td>
            <table width="100%" cellpadding="6" cellspacing="0" style="font-size:14px;">
              <tr>
                <td style="color:#666;">Operator</td>
                <td style="text-align:right; color:#000;">Jio Prepaid</td>
              </tr>
              <tr>
                <td style="color:#666;">Mobile Number</td>
                <td style="text-align:right; color:#000;">+91 98765 43210</td>
              </tr>
              <tr>
                <td style="color:#666;">Transaction ID</td>
                <td style="text-align:right; color:#000;">TS240915834921</td>
              </tr>
              <tr>
                <td style="color:#666;">Date & Time</td>
                <td style="text-align:right; color:#000;">26 Dec 2025, 6:05 PM</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="border-top:1px dashed #e6e6e6; padding:15px 0;"></td>
        </tr>

        <!-- Payment Summary -->
        <tr>
          <td>
            <table width="100%" cellpadding="6" cellspacing="0" style="font-size:14px;">
              <tr>
                <td style="color:#666;">Recharge Amount</td>
                <td style="text-align:right;">₹349.00</td>
              </tr>
              <tr>
                <td style="color:#666;">Instant Discount</td>
                <td style="text-align:right; color:#2e7d32;">- ₹8.00</td>
              </tr>
              <tr>
                <td style="color:#666;">Platform Fee</td>
                <td style="text-align:right;">₹0.00</td>
              </tr>
              <tr>
                <td style="font-weight:bold; padding-top:8px;">Total Paid</td>
                <td style="text-align:right; font-weight:bold;">₹341.00</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Status -->
        <tr>
          <td style="padding-top:15px; color:#2e7d32; font-weight:bold; font-size:14px;">
            Payment Status: Successful
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding-top:20px; font-size:12px; color:#777;">
            This receipt is generated electronically and is valid without a signature.<br/><br/>
            Powered by <strong>Digidivine Techno Solutions Pvt Ltd</strong><br/>
            For support, contact: support@thatspe.com
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

  </body>
</html>
`;
    // await sendEmail({
    //   email: 'sudhanshuojha7234@gmail.com',
    //   subject: 'Recharge Successful – Receipt from ThatSpe',
    //   html: html
    // });
    return {
      message: `Rs. ${amount} added to your wallet successfully`,
      success: true,
      statuscode: 1,
      transitionDate: response.data.walletUpdateResponse.updatedAt
    };
  } catch (error) {
    // console.log(error);
    return { message: 'Internal Server Error', success: false, error: error };
  }
};

exports.refund = async (req, res) => {
  const { allTransactionId } = req.body;

  // Validation for amount
  // console.log("All Transaction ID for refund:", allTransactionId);

  try {
    const transactionDetails = await allTransactionsModel.findOne({
      where: {
        id: allTransactionId,
        status: 'failed',
        refundStatus: 0
      }
    });
    if (!transactionDetails) {
      return res.status(200).json({ message: 'Transaction details not found', success: false, statuscode: 0 });
    }
    // console.log(transactionDetails);
    const paymentTransactionType = transactionDetails.dataValues.paymentTransactionType;
    // console.log('paymentTransactionType--', paymentTransactionType);
    let amount = 0;
    if (paymentTransactionType == 'cash') {
      const paymentTransactionDetails = await paymentModel.findOne({
        where: { id: transactionDetails.dataValues.cashPaymentTransactionId }
      });
      // console.log("paymentTransactionDetails--", paymentTransactionDetails);
      amount = paymentTransactionDetails.dataValues.amount;
      // console.log("amount --", amount);
    } else {
      const paymentTransactionDetails = await walletTransactionModel.findByPk(transactionDetails.dataValues.walletPaymentTransactionId);
      amount = paymentTransactionDetails.dataValues.amount;
      // console.log("amount --", amount);
    }
    const getUserWallet = await walletModel.findOne({ where: { userId: transactionDetails.dataValues.userId } });
    const walletId = getUserWallet.dataValues.id;
    const initiateRefundTransaction = await axios.post(`${process.env.SERVER_BASEUSRL}/user/wallet-transaction/initiate`, {
      walletId: walletId,
      amount: amount,
      transactionType: 'Refund',
      balanceType: 'Credit',
      rechargeTypeId: null,
      paymentTransactionId: null,
      transactionId: allTransactionId
    });

    const startingBalance = getUserWallet.dataValues.amount;
    console.log(startingBalance);

    if (initiateRefundTransaction.data.statuscode != 1) {
      const updateRefundTransaction = await axios.post(`${process.env.SERVER_BASEUSRL}/user/wallet-transaction/update`, {
        walletTransactionId: initiateRefundTransaction.data.walletTransactionId,
        endingBalance: startingBalance,
        status: 'failed',
        failureReason: 'Wallet not found'
      });
      // console.log(updateRefundTransaction);
      return res.status(200).json({ message: 'Could not perform refund. Conatct support', success: false, statuscode: 0 });
    }
    console.log('Initiate Refund Transaction:', startingBalance, amount);
    const endingBalance = Number(startingBalance) + Number(amount);

    console.log('Ending Balance:', endingBalance);

    await getUserWallet.update({
      amount: endingBalance
    });

    await axios.post(`${process.env.SERVER_BASEUSRL}/user/wallet-transaction/update`, {
      walletTransactionId: initiateRefundTransaction.data.walletTransactionId,
      endingBalance: endingBalance,
      status: 'success',
      failureReason: ''
    });

    await transactionDetails.update({
      refundStatus: 1
    });

    return res.status(200).json({ message: 'Refund amount credited successfully', success: true, statuscode: 1 });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal Server Error', success: false, error });
  }
};
exports.rechargeUsingWallet = async (req, res) => {};
