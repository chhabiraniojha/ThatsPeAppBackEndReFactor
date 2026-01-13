const sendNotification = require('../../util/sendNotifications');
const { sendSms } = require('../../util/sendSms');
const { sendEmail } = require('../../util/nodeMailerConfig');

exports.testNotification = async (req, res) => {
  try {
    const { token, title, body, imageUrl, data } = req.body;

    // const smsRes=await sendSms('7978797234','12345')
    // const response = await sendNotification(token, title, body,imageUrl, data || {});
    // console.log('smsRes Response:', smsRes);
    // Send OTP via email 
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

setImmediate(() => {
sendEmail({
      email: 'sudhanshuojha7234@gmail.com',
      subject: 'Recharge Successful – Receipt from ThatSpe',
      
      html: html
    })

});
    
    return res.status(200).json({
      message: ' Notification send successfully',
      success: true,
      statuscode: 1
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
