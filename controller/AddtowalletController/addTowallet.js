const UserModel = require('../../models/UserModels/UserSchema/user');
const AlltranscationModel = require('../../models/RechargeAndBillPaymentTransactionsModels/rechargeAndBillPaymentTransactions');
 
exports.addToWalletVarifay = async (req, res) => {
 const user = req.user;
try {
    if(user.mobileNo=='9938300x585'){
        return res.status(200).json({ success: false, message: "user allowed to add ammount to wallet ",statuscode:0 });
    }
    const checkTranscation = await AlltranscationModel.findOne({ where: { UserId: user.id } });
    console.log("checkTranscation---",checkTranscation);
    if(checkTranscation==null){
        return res.status(200).json({ success: false, message: "User not allowed to add ammount to wallet , no transcation found ",statuscode:0 });
    }
    else{
        return res.status(200).json({ success: true, message: "user allowed to add ammount to wallet ",statuscode:1 });
    }
    

} catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error });
}
};