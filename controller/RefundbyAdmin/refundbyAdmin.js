const allTransactionsModel = require("../../models/RechargeAndBillPaymentTransactionsModels/rechargeAndBillPaymentTransactions");
const availableAPIIdModel = require("../../models/APIModels/api");
const axios = require("axios");
exports.intialManualRefundByAdmin = async (req, res) => {
  const { transactionId } = req.query;
  let APITransactionId;
  let transactionStatus;
  let providerTransactionStatus;
  let refundStatus;
  let statusCheckResponse;

  try {
    const transactionData = await allTransactionsModel.findByPk(transactionId);
    if (!transactionData) {
      return res.status(200).json({
        message: "Transaction not found",
        success: false,
        statuscode: 0,
      });
    }
    APITransactionId = transactionData.APITransactionId;
    transactionStatus = transactionData.status;
    refundStatus = transactionData.refundStatus;

    const providerData = await availableAPIIdModel.findByPk(APITransactionId);

    if (!providerData) {
      return res.status(200).json({
        message: "providerData not found",
        success: false,
        statuscode: 0,
      });
    }
    if (refundStatus) {
      return res.status(200).json({
        message: "Refund allredy done for this Transaction",
        success: true,
        statuscode: 1,
        
      });
    }

    if (providerData.name === "roboticsExchange") {
      statusCheckResponse = await axios.get(
        `${providerData.statusCheckUrl}?Apimember_id=${process.env.ROBOTICS_USERNAME}&Api_password=${process.env.ROBOTICS_PASSWORD}&Member_request_txnid=${transactionId}&mode='P2A'`
      );
      providerTransactionStatus =
        statusCheckResponse?.data?.STATUS == "1"
          ? "Success"
          : statusCheckResponse?.data?.STATUS == "2"
          ? "Pending"
          : statusCheckResponse?.data?.STATUS == "3"
          ? "Failed"
          : null;
    } else if (providerData.name === "rechargeExchange") {
      statusCheckResponse = await axios.get(
        `${providerData.statusCheckUrl}?userid=${process.env.RECHARGEEXCHANGE_USERNAME}&token=${process.env.RECHARGEEXCHANGE_PASSWORD}&transid=${transactionId}`
      );
      providerTransactionStatus =
        statusCheckResponse?.data?.status == "SUCCESS"
          ? "Success"
          : statusCheckResponse?.data?.status == "PENDING"
          ? "Pending"
          : statusCheckResponse?.data?.status == "FAILED"
          ? "Failed"
          : null;
    } else if (providerData.name === "a1") {
      statusCheckResponse = await axios.get(
        `${providerData.statusCheckUrl}?username=${process.env.A1_USERNAME}&pwd=${process.env.A1_PASSWORD}&orderid=${transactionId}&format=json`
      );
      providerTransactionStatus =
        statusCheckResponse?.data?.status == "Success"
          ? "Success"
          : statusCheckResponse?.data?.status == "Pending"
          ? "Pending"
          : statusCheckResponse?.data?.status == "Failure"
          ? "Failed"
          : null;
    } else {
      return res.status(200).json({
        message: "Status check not implemented for this provider",
        success: false,
        statuscode: 0,
      });
    }
    // using this  only for testing  i will remove  (providerTransactionStatus = "Failed") this part
    providerTransactionStatus = "Failed";
    if (
      transactionStatus &&
      refundStatus == false &&
      providerTransactionStatus &&
      transactionStatus == "failed" &&
      providerTransactionStatus == "Failed" &&
      refundStatus == false
    ) {
      //intial manual refund  in both case failed but not refund
      let refdundData = await axios.post(
        `${process.env.SERVER_BASEUSRL}/user/wallet/refund`,
        {
          allTransactionId: transactionId,
        }
      );
      console.log("refund data ---> ", refdundData);

      if (refdundData?.data?.success) {
        return res.status(200).json({
          message: "Refund Success",
          success: true,
          statuscode: 1,
        });
      } else if (refdundData?.data?.success == false) {
        return res.status(200).json({
          message: "Refund Failed",
          success: true,
          statuscode: 1,
        });
      }
      } else if (
        transactionStatus &&
        refundStatus == false &&
        providerTransactionStatus &&
        transactionStatus == "pending" &&
        providerTransactionStatus == "Failed" &&
        refundStatus == false
      ) {
        //force faile &refund
        const updateTransationStatus = await axios.post(
          `${process.env.SERVER_BASEUSRL}/user/mobile-recharge-transaction/update-mobile-recharge-transaction-status`,
          {
            rechargeTransactionId: transactionId,
            apiResponse: "FAILURE",
          }
        );
        // console.log("----- uptadedTranscation ",updateTransationStatus)
        let refdundData = await axios.post(
          `${process.env.SERVER_BASEUSRL}/user/wallet/refund`,
          {
            allTransactionId: transactionId,
          }
        );
          if (refdundData?.data?.success) {
          return res.status(200).json({
            message: "Refund Success",
            success: true,
            statuscode: 1,
          });
        } else if (refdundData?.data?.success == false) {
          return res.status(200).json({
            message: "Refund Failed",
            success: true,
            statuscode: 1,
          });
        }

      } else {
      return res.status(200).json({
        message: "Refund Failed",
        success: false,
        statuscode: 0,
        transactionStatus,
        refundStatus,
        providerTransactionStatus,
      });
    }
  
  } catch (error) {
    console.log("000000000 ", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

 
