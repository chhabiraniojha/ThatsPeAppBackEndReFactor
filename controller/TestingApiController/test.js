exports.testRchargeApi = async (req, res) => {
    try {
        let num=Math.floor(Math.random() * 6)

        
        

        if (num>3) {
            return res.status(200).json({ success: true, statusCode: 1,message: "Recharge Sucessfully" })
        } else {
            return res.status(200).json({ success: false, statusCode: 0,message: "Recharge Failled" })
        }


    } catch (error) {
        return res.status(500).json({
            message: error.message
        })
    }
}