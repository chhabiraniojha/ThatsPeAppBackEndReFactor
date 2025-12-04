const sendNotification = require('../../util/sendNotifications');
const {sendSms} = require('../../util/sendSms');

exports.testNotification = async (req, res) => {
  try {
    const { token, title, body,  imageUrl,data } = req.body;

    const smsRes=await sendSms('7978797234','12345')
    // const response = await sendNotification(token, title, body,imageUrl, data || {});
    console.log('smsRes Response:', smsRes);
    return res.status(200).json({
      message: ' Notification send successfully',
      success: true,
      statuscode: 1,
      // response
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      statuscode: 0,
      error: err.message
    });
  }
};
