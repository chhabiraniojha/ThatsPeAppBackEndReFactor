const { logger } = require('sequelize/lib/utils/logger')
const mobileRechargeModel = require('../../models/APIModels/api')
const circleDataModel = require('../../models/CircleDataModel/circleData')
const operatorDataModel = require('../../models/OperatorDataModel/operatorData')
const apiIdGenerator = require('../../util/uidGenerator')
const axios = require('axios')
const { Transaction } = require('sequelize')
const uidgenerate = require('../../util/uidGenerator')
const { getRedisClient } = require('../../util/redisClient');
const { log } = require('../../util/logData')

const CACHE_TTL = 43200; // 5 minutes
 

exports.mobileRechargeAPI = async (req, res) => {
    const { apiName, apiURL, api_Airtel_Commission, api_Jio_Commission, api_BSNL_Commission, api_Vi_Commission, Circle, apiLocation, DistributorName, DistributorContactNumber, DistributorAddress, Airtel, Jio, BSNL, Vi } = req.body
    try {
        let apiId = await apiIdGenerator()
        const mobileRecharge = await mobileRechargeModel.create({ apiId, apiName, apiURL, api_Airtel_Commission, api_Jio_Commission, api_BSNL_Commission, api_Vi_Commission, Circle, apiLocation, DistributorName, DistributorContactNumber, DistributorAddress, Airtel, Jio, BSNL, Vi })
        res.status(200).json({ message: "Done", success: true, mobileRecharge })
    } catch (error) {
        res.status(500).json({ message: "Internal server error", success: false, error })
    }
}

exports.mobileRecharge = async (req, res) => {
    const { ezytm_circle_code, ezytm_operator_code, mobile_number, amount, operator, circle, user_id, paymentTransactionId, paymentTransactionType, status, transactionType } = req.body

    try {
        let rechargeCommissionDescending = []
        const data = {
            "circleCode": `${ezytm_circle_code}`,
            "operatorCode": `${ezytm_operator_code}`,
            "customerNo": `${mobile_number}`,
            "amount": `${amount}`,
            "userId": `${user_id}`,
            "paymentTransactionId": `${paymentTransactionId}`,
            "paymentTransactionType": `${paymentTransactionType}`,
            "status": `${status}`,
            "transactionType": `${transactionType}`,
            "operator": `${operator}`,
            "circle": `${circle}`
        }
        const initiateTransaction = await fetch(`http://13.201.95.135:3000/user/mobile-recharge-transaction/initiate-mobile-recharge-transaction`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data)
        })
        const transactionData = await initiateTransaction.json()
        console.log(transactionData);

        const cyrusCircleCode = await circleDataModel.findOne({ where: { ezytm_circle_code: ezytm_circle_code } })
        console.log(cyrusCircleCode.cyrus_circle_code);
        const cyrusOperatorCode = await operatorDataModel.findOne({ where: { ezytm_operator_code: ezytm_operator_code } })
        console.log(cyrusOperatorCode.cyrus_operator_code);

        // if (operator === "Jio") { // Use triple equals for strict equality check
        //     try {
        //         const availableApis = await mobileRechargeModel.findAll({
        //             where: {
        //                 Jio: 1
        //             },
        //             order: [
        //                 ['api_Jio_Commission', 'DESC']
        //             ]
        //         });
        //         rechargeCommissionDescending = availableApis.map(item => item.dataValues.apiURL);
        //         rechargeCommissionDescending.forEach(async (url) => {
        //             if (url == "https://cyrusrecharge.in/api/recharge.aspx") {
        //                 console.log("Hitting cyrus");
        //                 let data = await fetch('https://Cyrusrecharge.in/api/GetOperator.aspxhttps://cyrusrecharge.in/api/recharge.aspx?memberid=AP828903&pin=F5439EF5FA&Method=getcircle')
        //                 let resp = await data.json()
        //                 res.send(resp)
        //             }
        //         })
        //     } catch (error) {
        //         console.error('Error retrieving available APIs:', error);
        //     }
        // }
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", success: false })
    }
}


exports.getCircleAndOperator = async (req, res) => {
    const mobileNumber = req.query.mobileNumber
    try {
        const circleData = await axios.get(`http://planapi.in/api/Mobile/OperatorFetchNew?ApiUserID=5679&ApiPassword=rinku9938300585&Mobileno=${mobileNumber}`)
        if (circleData.data.ERROR == '1') {
            return res.json({ message: "Invalid credentials!", status: '2' })
        } else if (circleData.data.ERROR == '0') {
            const circleCode = circleData.data.CircleCode
            const operatorCode = circleData.data.OpCode
            return res.json({ circlecode: circleCode, operatorcode: operatorCode, status: '1' })
        } else if (circleData.data.ERROR == '10') {
            return res.json({ message: "Invalid mobile number", status: '3' })
        }
    } catch (error) {
        return res.status(500).json({ error })
    }
}

// recharge api:
// 1. take ezytm_circle_code, ezytm_operator_code, mobile_number, amount, user_id  
// 2. convert ezytm data to cyrus data
// 3. initiate transaction(create transaction id)
// 4. create transaction for the corresponding user id
// transactionId, APItransactionId, userId, apiId, amount, operator, date, time, status, paymentType, paymentTransactionId
// transactionId, transactionType, APIId, number, operator, circle(null), amount, paymentType, paymentTransactionId, APITransactionId(null), userId, status 

// success response

// API RESPONSE - {"ApiTransID":"85BD2EACC5","Status":"Success","ErrorMessage":"​Success","OperatorRef":" ","TransactionDate":"5/7/2022 1:59:05 PM"}

// pending Response

// API RESPONSE - {"ApiTransID":"85BD2EACC5","Status":"Pending","ErrorMessage":"​​Pending","OperatorRef":" ","TransactionDate":"5/7/2022 1:59:05 PM"}

exports.rOfferCheck = async (req, res) => {
    try {
        const { mobileNumber, operatorCode } = req.query
        const rOfferData = await axios.get(`http://planapi.in/api/Mobile/RofferCheck?apimember_id=5679&api_password=rinku9938300585&operator_code=${operatorCode}&mobile_no=${mobileNumber}`)
        if (rOfferData.data.ERROR == '1') {
            return res.json({ message: "Invalid credentials!", status: '2' })
        } else if (rOfferData.data.ERROR == '0') {
            const rDataDetails = rOfferData.data.RDATA
            if (rDataDetails == null) {
                return res.json({ message: "No plans found. Check your operator and circle properly.", status: '3' })
            } else {
                return res.json({ status: '1', rDataDetails })
            }
        } else if (rOfferData.data.ERROR == '11') {
            return res.json({ message: "Invalid mobile or operator", status: '4' })
        }
    } catch (error) {
        return res.status(500).json({ error })
    }
}

exports.planCheck = async (req, res) => {
    const pubClient = await getRedisClient(); 
    try {
        const { circleCode, operatorCode } = req.query
        const cacheKey = `plans:${circleCode}:${operatorCode}`;


        const cached = await pubClient.get(cacheKey);

        if (cached) {
            return res.json({ planDataDetails: JSON.parse(cached), status: '4', cached: true });
        }

        const planData = await axios.get(`http://planapi.in/api/Mobile/Operatorplan?apimember_id=5679&api_password=rinku9938300585&cricle=${circleCode}&operatorcode=${operatorCode}`)
        if (planData.data.ERROR == '1') {
            return res.json({ message: "Invalid credentials!", status: '2' })
        } else if (planData.data.ERROR == '0') {
            const planDataDetails = planData.data.RDATA
            if (planDataDetails == null) {
                return res.json({ message: "No plans found. Check your operator and circle properly.", status: '3' })
            } else {
                // Cache it
                await pubClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(planDataDetails));
                return res.json({ planDataDetails, status: '4' })
            }
        }
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Erro", error })
    }
}

exports.getRechargeDetailsByMobileNumber = async (req, res) => {
    const { mobileNo } = req.query
    try {
        const getCircleAndOperatorData = await axios.get(`http://13.201.95.135:3000/user/recharge/get-circle-operator-data?mobileNumber=${mobileNo}`)
        if (getCircleAndOperatorData.data.status == '1') {
            const circleCode = getCircleAndOperatorData.data.circlecode
            const operatorCode = getCircleAndOperatorData.data.operatorcode
            const getROfferData = await axios.get(`http://13.201.95.135:3000/user/recharge/get-roffer-data?mobileNumber=${mobileNo}&operatorCode=${operatorCode}`)
            const getPlanData = await axios.get(`http://13.201.95.135:3000/user/recharge/plancheck?circleCode=${circleCode}&operatorCode=${operatorCode}`)
            return res.status(200).json({ circleoperatordata: { circlecode: circleCode, operatordata: operatorCode }, rofferdata: getROfferData.data, plansdata: getPlanData.data.planDataDetails })
        } else if (getCircleAndOperatorData.data.status == '2') {
            res.json({ message: "Invalid credentials", status: '2' })
        } else if (getCircleAndOperatorData.data.status == '3') {
            res.json({ message: "Invalid mobile number", status: '3' })
        }
    } catch (error) {
        res.json({ status: '1', error })
    }
}




exports.testApis = async (req, res) => {
    const { operator_name, ezytm_operator_code, cyrus_operator_code, operator_type } = req.body
    // let data = await axios.get('http://Cyrusrecharge.in/api/GetOperator.aspx?memberid=AP828903&pin=F5439EF5FA&Method=getcircle')
    // let data = await axios.get('http://Cyrusrecharge.in/api/GetOperator.aspx?memberid=AP828903&pin=F5439EF5FA&Method=getoperator')
    // let data = await axios.get('http://planapi.in/api/Mobile/OperatorFetchNew?ApiUserID=5679&ApiPassword=rinku9938300585&Mobileno=72052105336')
    // console.log(data.data);
    // res.send(data.data)l
    try {
        const circleData = await operatorDataModel.create({ operator_name, ezytm_operator_code, cyrus_operator_code, operator_type })
        console.log(circleData);
        res.send(circleData)
    } catch (error) {
        res.send(error)
    }
    // let filteredData = data.data[0].data.filter((item) => item.ServiceTypeName == "Prepaid-Mobile");
    // console.log(filteredData[0].data);
    // res.send(resp)
}


