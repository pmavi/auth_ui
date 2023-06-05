const nodemailer = require("nodemailer");


module.exports.SendEmailToUser = async (options) => {
    return new Promise((resolve, reject) => {
        let transporter = nodemailer.createTransport({
           
            tls: { rejectUnauthorized: false },
            port: process.env.EMAIL_PORT,
            host: process.env.EMAIL_HOST,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
        transporter.sendMail(options, function (error, info) {
            if (error) {
                reject(error);
            } else {
                resolve(info)
            }
        });
    });
};