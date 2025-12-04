const otpModel = require('../../models/OtpModels/Otp')
const userModel = require('../../models/UserModels/UserSchema/user')
const Sequelize = require('sequelize');
let { sendEmail } = require('../../util/nodeMailerConfig')
const Logger = require('../../util/logData')

function generateRandomNumber() {
    // Generate a random decimal between 0 (inclusive) and 1 (exclusive)
    const randomDecimal = Math.random();

    // Multiply the decimal by 900000 to get a number between 0 and 899999
    // Add 100000 to ensure the number is at least 100000
    const randomNumber = Math.floor(randomDecimal * 900000) + 100000;

    return randomNumber;
}


function generateDateInTwoMinutes() {
    // Get the current date and time
    const currentDate = new Date();

    // Add 2 minutes to the current date and time
    currentDate.setMinutes(currentDate.getMinutes() + 10);

    // Format the date to a string (optional, you can adjust the format as needed)
    // const formattedDate = currentDate.toISOString();

    return currentDate;
}



// sendOtp()
exports.sendOtp = async (req, res) => {
    let { email, purpose } = req.body;
    
    if (typeof email === "string") {
        email = email.trim()
    }

    try {
        // Basic input validation
        if (!email || !purpose) {
            return res.status(400).json({ message: "Email and purpose are required", success: false });
        }

        if (purpose === "signup") {
            // Check if email already exists in userModel
            let user = await userModel.findOne({ where: { Email: email } });
            if (user) {
                return res.status(200).json({ message: "Email id already exists", success: false, statuscode: 0, token: null });
            }
        }

        // Generate OTP and expiration time
        const otp = generateRandomNumber();
        const expirationTime = generateDateInTwoMinutes();

        // Save OTP record in otpModel
        const insertRecord = await otpModel.create({ email, otp, expirationTime });

        // Send OTP via email
        let message = `your one time passwoerd for MyPay is  ${otp}  Do not share with anyone.`;
        let html = `<div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 500px; margin: auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="text-align: center; color: #333;">Your OTP for MyPay</h2>
            <p style="font-size: 16px; color: #555;">Hello,</p>
            <p style="font-size: 16px; color: #555;">
                Your one-time password (OTP) for verifying your account is:
            </p>
            <div style="text-align: center; margin: 20px 0;">
                <span style="font-size: 22px; font-weight: bold; color: #2c3e50; background: #ecf0f1; padding: 10px 20px; border-radius: 5px; display: inline-block;">
                    ${otp}
                </span>
            </div>
            <p style="font-size: 14px; color: #999;">
                Do not share this OTP with anyone. It will expire in 10 minutes.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd;">
            <p style="font-size: 12px; text-align: center; color: #888;">
                If you did not request this OTP, please ignore this email.
            </p>
        </div>
    </div>`;
        await sendEmail({
            email: email,
            subject: "OTP(One Time Password to Verify your account.)",
            message: message,
            html:html
        });

        // Return success response
        return res.status(200).json({ success: true, message: "OTP sent successfully", statuscode: 1 });

    } catch (error) {
        // console.log(error);
        Logger.error({
            error_message: error ? error.name:"catch error form otpsend ",
            user: email,
            url: "/user/sendotp",
            http_method: "post",
            status_code: "0"
        })
        return res.status(500).json({ error, message: "Internal server error" });
    }
};



exports.verifyOtp = async (req, res) => {
    let { email, otp } = req.body;

    // console.log(otp);
    if (typeof email === "string") {
        email = email.trim()
    }

    try {

        const userRecords = await otpModel.findAll({
            where: {
                email,
                expirationTime: {
                    [Sequelize.Op.gte]: new Date(),

                }
            },
            order: [['expirationTime', 'DESC']]
        })
        console.log(userRecords)



        if (userRecords.length <= 0) {

            return res.status(200).json({ success: false, message: "otp mismatch or expired", statuscode: 0 })

        }else{

            if (userRecords && otp == userRecords[0].otp) {
                return res.status(200).json({ success: true, message: "otp successfully verified", statuscode: 1 })
            } else {
                return res.status(200).json({ success: false, message: "otp mismatch or expired", statuscode: 0 })
            }
        }

    
    } catch (error) {
        // console.log(error)
        Logger.error({
            error_message:error ? error.name:"catch error form otp varification",
            user: email,
            url: "/user/otp-verify",
            http_method: "post",
            status_code: "0"
        })
        return res.status(500).json({ success: false, error, message: "internal server error" })
    }
}
