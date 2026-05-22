const operatorModel = require("../../models/OperatorDataModel/operatorData");
const circleModel = require("../../models/CircleDataModel/circleData");
const { default: axios } = require("axios");
const mobikwikService = require("../../services/mobikwikServices/mobikwik.service")

// --------------- Get Operator Name  By Op code & Get Circle Name By Ci Code ------------

exports.getOperatorName = async (req, res) => {
  const { operatorCode, circleCode } = req.query;

  try {
    if (operatorCode && circleCode) {
      let operatorData = await operatorModel.findOne({
        where: { ezytm_operator_code: operatorCode },
      });
      let circleData = await circleModel.findOne({
        where: { ezytm_circle_code: circleCode },
      });
      if (operatorData == null && circleCode == null) {
        return res.status(200).json({
          message: "Operator and Circle code not found",
          success: true,
          statuscode: 0,
        });
      } else {
        return res.status(200).json({
          message: " Operator and Circle Name Fetch successfully",
          success: true,
          statuscode: 1,
          operatorData,
          circleData,
        });
      }
    } else if (operatorCode) {
      let operatorData = await operatorModel.findOne({
        where: { ezytm_operator_code: operatorCode },
      });
      if (operatorData == null) {
        return res.status(200).json({
          message: "Operator code not found",
          success: true,
          statuscode: 0,
        });
      } else {
        return res.status(200).json({
          message: " Operator Name Fetch successfully",
          success: true,
          statuscode: 1,
          operatorData,
        });
      }
    } else if (circleCode) {
      let circleData = await circleModel.findOne({
        where: { ezytm_circle_code: circleCode },
      });

      if (circleCode == null) {
        return res.status(200).json({
          message: "circle code not found",
          success: true,
          statuscode: 0,
        });
      } else {
        return res.status(200).json({
          message: " circle Name Fetch successfully",
          success: true,
          statuscode: 1,
          circleData,
        });
      }
    } else {
      return res.status(200).json({
        message: "circle code And OPerator Code not found",
        success: true,
        statuscode: 0,
      });
    }
  } catch (error) {
    return res
      .status(200)
      .json({ message: "Internal Server Error", success: false });
  }
};

exports.getSingleOperatorName = async (req, res) => {
  const mobileNumber = req.query.mobileNumber;
  try {
    const eztymResponse = await axios.get(
      `http://planapi.in/api/Mobile/OperatorFetchNew?ApiUserID=5679&ApiPassword=rinku9938300585&Mobileno=${mobileNumber}`
    );
    if (eztymResponse.data.ERROR == "1") {
      return res.json({ message: "Invalid credentials!", status: "2" });
    } else if (eztymResponse.data.ERROR == "0") {
      const operatorCode = eztymResponse.data.OpCode;

      let operatorData = await operatorModel.findOne({
        where: { ezytm_operator_code: operatorCode },
      });
      if (operatorData == null) {
        return res.status(200).json({
          message: "Operator code not found",
          success: true,
          statuscode: 0,
        });
      } else {
        return res.status(200).json({
          message: " Operator Name Fetch successfully",
          success: true,
          statuscode: 1,
          operatorData,
        });
      }
    } else if (eztymResponse.data.ERROR == "10") {
      return res.json({ message: "Invalid mobile number", status: "3" });
    }
  } catch (error) {
    return res.status(200).json({
      message: "Internal Server Error ",
      success: false,
      statuscode: 0,
    });
  }
};
// --------------- Get All  Operator Name and Circle Name   ----------------

exports.getAllOperatorAndCircleName = async (req, res) => {
  const { subcategoryId, circleType } = req.query;
  try {
    let allOperatorName = await operatorModel.findAll({
      where: { subcategory_id: subcategoryId },
    });

    if (circleType && circleType.toLowerCase() == "true") {
      let allCircleName = await circleModel.findAll();
      return res.status(200).json({
        message: " Operator Name and Circle Name Fetch successfully",
        success: true,
        statuscode: 1,
        allOperatorName,
        allCircleName,
      });
    }
    return res.status(200).json({
      message: " Operator Name Fetch successfully",
      success: true,
      statuscode: 1,
      allOperatorName,
    });
  } catch (error) {
    return res
      .status(200)
      .json({ message: "Internal Server Error", success: false });
  }
};

exports.getOperatorData = async (req, res) => {
  const { subcategoryId } = req.query;

  try {
    let allOperatorName = await operatorModel.findAll({
      where: { subcategory_id: subcategoryId },
    });

    return res.status(200).json({
      message: " Operator data Fetch successfully",
      success: true,
      statuscode: 1,
      allOperatorName,
    });
  } catch (error) {
    return res
      .status(200)
      .json({ message: "Internal Server Error", success: false });
  }
};
// --------------- Get All Opeartor name discount  for admin   ----------------
exports.getOperatorDataAdmin = async (req, res) => {
  try {
    let allOperators = await operatorModel.findAll({
      attributes: ["id", "name", "operator_type", "discount", "discount_type"],
    });

    return res.status(200).json({
      message: " Operator data Fetch successfully",
      success: true,
      statuscode: 1,
      allOperators,
    });
  } catch (error) {
    return res
      .status(200)
      .json({ message: "Internal Server Error", success: false });
  }
};
// ---------------  Set Operator Discount By Admin ----------------
exports.setOperatorDiscount = async (req, res) => {
  const { id, discount } = req.body;
  try {
    let operatorData = await operatorModel.findByPk(id)
    if (operatorData) {
      await operatorData.update({
        discount
      })
      return res.status(200).json({
        message: " Operator commission updated successfully",
        success: true,
        statuscode: 1,
      });
    }
    else {
      return res.status(200).json({
        message: " Operator data not found",
        success: false,
        statuscode: 0,
      });
    }


  } catch (error) {

    return res
      .status(200)
      .json({ message: "Internal Server Error", success: false });
  }
};

// --------------- Get All Placeholder Name Using Operator Code ----------------
exports.getPlaceHolderName = async (req, res) => {
  let { operatorCode } = req.query;
  try {
    // operatorCode=parseInt(operatorCode);
    // console.log(operatorCode);

    const placeHolderResponse = await axios.get(
      `https://planapi.in/Api/Mobile/BBPSBillInfo?ApiUserID=5679&ApiPassword=rinku9938300585&Opcode=${operatorCode}`
    );
    let data = await placeHolderResponse.data;
    if (!data.BillInfo) {
      return res.status(200).json({
        message: "No Placeholder available",
        success: false,
        statuscode: 0
      });
    }

    if (data.STATUSCODE == '0' && data.BillInfo) {
      data = data.BillInfo.parameter
    }


    // console.log(data);
    return res.status(200).json({
      message: "Placeholder name fetch successfully",
      success: true,
      statuscode: 1,
      placeHolderdata: data,
    });
  } catch (error) {
    return res.status(200).json({
      message: "Internal Server Error ",
      success: false,
      statuscode: 0,
    });
  }
};

// --------------- Get Bill Details Using Bill number ----------------

// GET ELECTRIC BILL INFO
exports.getBillInfo = async (req, res) => {
  let { operatorCode, Accountno } = req.query;
  try {
    // operatorCode=parseInt(operatorCode);
    // console.log(operatorCode);

    const billData = await axios.get(
      `https://planapi.in/api/Mobile/BillCheck?apimember_id=5679&api_password=rinku9938300585&operator_code=${operatorCode}&Accountno=${Accountno}`
    );
    console.log(billData);
    let data = await billData.data;

    // if (data.STATUS == "3") {
    //   data = {
    //     ERROR: "0",
    //     STATUS: "1",
    //     BILLDEATILS: {
    //       Name: "Dummmy Name",
    //       DueAmount: "560.00",
    //       DueDate: "2024-11-22",
    //       BillNumber: Accountno,
    //       BillDate: "NA",
    //       Balance: "0",
    //       BillPeriod: null,
    //     },
    //     ORDERID: null,
    //     MESSAGE: "Bill Fetch Processed",
    //   };
    // }
    // console.log(data);
    return res.status(200).json({
      message: "Bill Details fetch successfully",
      success: true,
      statuscode: 1,
      data,
    });
  } catch (error) {
    return res.status(200).json({
      message: "Internal Server Error",
      success: false,
      statuscode: 0,
    });
  }
};

// GET DTH BILL INFO
exports.getDthBillInfo = async (req, res) => {
  let { operatorCode, Accountno } = req.query;

  try {
    let data;

    if (operatorCode == 28) {
      const dthBillDataForTataPlay = await axios.get(
        `https://plancheckapi.in/Users/apis/index.php?api_key=1ce93f-d78352-94c756-a0d74a-050f78&type=Dth_Info&number=${Accountno}&operator=TP`
      );

      console.log("TataPlay Response:", dthBillDataForTataPlay.data);
      if (dthBillDataForTataPlay.data.status == true && dthBillDataForTataPlay.data.msg == "Success") {
        data = {
          "error": "0",
          "DATA": {
            "VC": dthBillDataForTataPlay?.data?.result?.data?.dth_number || "",
            "Name": dthBillDataForTataPlay?.data?.result?.data?.customername || "",
            "Rmn": "",
            "Balance": 0,
            "Monthly": "",
            "Next Recharge Date": "2026-06-18",
            "Plan": "",
            "Address": "sabrang bhadrak",
            "City": "",
            "District": "",
            "State": "26",
            "PIN Code": "756123"
          }
        };
      } else {
        data = {
          "error": "2",
          "DATA": null,
          "Message": "some error happend.Please contact to customer support"
        }
      }


    } else {
      const dthBillData = await axios.get(
        `https://planapi.in/api/Mobile/DTHINFOCheck?apimember_id=5679&api_password=rinku9938300585&Opcode=${operatorCode}&mobile_no=${Accountno}`
      );

      console.log("Other Operator Response:", dthBillData.data);

      data = dthBillData.data;
    }

    return res.status(200).json({
      message: "Dth Bill Details fetch successfully",
      success: true,
      statuscode: 1,
      data,
    });

  } catch (error) {
    console.log("ERROR:", error?.response?.data || error.message);

    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
      statuscode: 0,
    });
  }
};
// GET FASTAG BILL INFO
exports.getFastagBillInfo = async (req, res) => {
  let { operatorCode, VehicleNo } = req.query;
  try {
    // operatorCode=parseInt(operatorCode);
    // console.log(operatorCode);

    const billData = await axios.get(
      `https://planapi.in/api/Mobile/FastagInfoFetch?apimember_id=5679&api_password=rinku9938300585&operator_code=${operatorCode}&VehicleNo=${VehicleNo}&ApiToken=8f6cf7ea-c47f-4f1a-afaa-93f705b2adc0`
    );
    let data = await billData.data;
    //     data={
    //     "ERROR": "0",
    //     "STATUS": "1",
    //     "BILLDEATILS": {
    //         "Name": "Suvransu Sekhar Ojha",
    //         "DueAmount": "100.00",
    //         "DueDate": "NA",
    //         "BillNumber": null,
    //         "BillDate": "NA",
    //         "Balance": "255",
    //         "BillPeriod": null
    //     },
    //     "ORDERID": null,
    //     "MESSAGE": "Bill Fetch Processed"
    // }
    console.log(data);
    return res.status(200).json({
      message: "Fastag Details fetch successfully",
      success: true,
      statuscode: 1,
      data,
    });
  } catch (error) {
    return res.status(200).json({
      message: "Internal Server Error",
      success: false,
      statuscode: 0,
    });
  }
};
exports.getFastagBillInfo_v2 = async (req, res) => {

  const { cn, op } = req.query;
  

  try {

    // Validation
    if (!cn || !op) {
      return res.status(400).json({
        success: false,
        statuscode: 0,
        message: "cn and op are required"
      });
    }
    const operatorData=await operatorModel.findByPk(op)
    // console.log(operatorData.dataValues)
    const cir=operatorData.dataValues.mobi_cir_code;
    const op_code=operatorData.dataValues.mobi_operator_code;
    console.log(op_code,cir)
    const adParams = {
      bankName: cir
    };

    const data = await mobikwikService.mobikwikViewBill(
      cn,
      op_code,
      cir,
      adParams
    );

    if (data.success) {

      const bill = data?.data?.[0];

      const flattenedBill = {
        ...bill,
        ...(bill.additionalDetails || {})
      };

      delete flattenedBill.additionalDetails;

      return res.status(200).json({
        success: true,
        statuscode: 1,
        message: "Fastag details fetched successfully",
        data: flattenedBill
      });

    } else {

      return res.status(200).json({
        success: false,
        statuscode: 2,
        message: "Could not fetch details. Try again!",
        data
      });
    }

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      statuscode: 0,
      message: "Internal Server Error"
    });
  }
};

exports.getGasBillInfo = async (req, res) => {
  let { operatorCode, consumerNo } = req.query;
  try {
    // operatorCode=parseInt(operatorCode);
    // console.log(operatorCode);

    const billData = await axios.get(
      `http://planapi.in/api/Mobile/GasInfoFetch?apimember_id=5679&api_password=rinku9938300585&ConsumerNo=${consumerNo}&operator_code=${operatorCode}`
    );
    let data = await billData.data;

    // console.log(data);
    return res.status(200).json({
      message: "Gas info fetch successfully",
      success: true,
      statuscode: 1,
      data,
    });
  } catch (error) {
    return res.status(200).json({
      message: "Internal Server Error",
      success: false,
      statuscode: 0,
    });
  }
};
