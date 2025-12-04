const nodeMailer = require("nodemailer");


exports.sendEmail = async (option) => {
    const transport = nodeMailer.createTransport({
        // this is the sender mail and password  for login
        host:  process.env.NODE_MAILER_HOST, 
        service:  process.env.NODE_MAILER_HOST,
        port:  process.env.NODE_MAILER_PORT,
        secure: false,
        auth: {
            user: process.env.OTP_SENDING_MAIL_ID,
            pass:  process.env.MAIL_PASSWORD,
        },
    });
    const mailoptions = {
        // this object contain all the option like --> sender,resiver and text message
        from:`"MyPay" ${process.env.OTP_SENDING_MAIL_ID}`,
        to: option.email,
        subject: option.subject,
        text: option.message,
        html:option.html?option.html:""
    };

    await transport.sendMail(mailoptions);
};
