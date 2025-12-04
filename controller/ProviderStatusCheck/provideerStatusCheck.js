const availableAPIIdModel = require("../../models/APIModels/api");
const axios = require("axios");

exports.getProviderStatusCheck = async (req, res) => {
  const { providerTransactionId, providerId } = req.query;
  let providerData;
  let statusCheckResponse;
  let statusCheckData = {};
  console.log("Received provider status check request:", req.query);
  try {
    providerData = await availableAPIIdModel.findByPk(providerId);
    if (!providerData) {
      return res.status(404).json({ message: "Provider not found" });
    }
    if ( providerData.name=== "roboticsExchange") {
      statusCheckResponse = await axios.get(
        `${providerData.statusCheckUrl}?Apimember_id=${process.env.ROBOTICS_USERNAME}&Api_password=${process.env.ROBOTICS_PASSWORD}&Member_request_txnid=${providerTransactionId}&mode='P2A'`
      );
      statusCheckData.status =
        statusCheckResponse?.data?.STATUS == "1"
          ? "Success"
          : statusCheckResponse?.data?.STATUS == "2"
          ? "Pending"
          : statusCheckResponse?.data?.STATUS == "3"
          ? "Failed"
          : "no data found";
      statusCheckData.name = providerData.name;
      console.log(statusCheckResponse)
      return res.status(200).json({
        message: "Status check data fetched successfully",
        success: true,
        statuscode: 1,
        statusCheckData,
      
      });
    } else if (providerData.name === "rechargeExchange") {
      statusCheckResponse = await axios.get(
        `${providerData.statusCheckUrl}?userid=${process.env.RECHARGEEXCHANGE_USERNAME}&token=${process.env.RECHARGEEXCHANGE_PASSWORD}&transid=${providerTransactionId}`
      );
      statusCheckData.status =
        statusCheckResponse?.data?.status == "SUCCESS"
          ? "Success"
          : statusCheckResponse?.data?.status == "PENDING"
          ? "Pending"
          : statusCheckResponse?.data?.status == "FAILED"
          ? "Failed"
          : "no data found";
      statusCheckData.name = providerData.name;

         console.log(statusCheckResponse)
      return res.status(200).json({
        message: "Status check data fetched successfully",
        success: true,
        statuscode: 1,
        statusCheckData,
       
      });
    } else if (providerData.name === "a1") {
      statusCheckResponse = await axios.get(
        `${providerData.statusCheckUrl}?username=${process.env.A1_USERNAME}&pwd=${process.env.A1_PASSWORD}&orderid=${providerTransactionId}&format=json`
      );
      statusCheckData.status =
        statusCheckResponse?.data?.status == "Success"
          ? "Success"
          : statusCheckResponse?.data?.status == "Pending"
          ? "Pending"
          : statusCheckResponse?.data?.status == "Failure"
          ? "Failed"
          : "no data found";
      statusCheckData.name = providerData.name;
      return res.status(200).json({
        message: "Status check data fetched successfullyr",
        success: true,
        statuscode: 1,
        statusCheckData,
        
      });
    } else {
      return res.status(200).json({
        message: "Status check not implemented for this provider",
        success: false,
        statuscode: 0,
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({ success:false , message: "Internal server error", error: error.message });
  }
};
