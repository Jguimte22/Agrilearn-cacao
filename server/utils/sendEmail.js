const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Create transporter
    const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail', // Default to gmail if not specified
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        },
        // If using other services (like Outlook, SMTP), you might need host/port:
        // host: process.env.SMTP_HOST,
        // port: process.env.SMTP_PORT,
        // secure: false, // true for 465, false for other ports
    });

    // Define email options
    const mailOptions = {
        from: `${process.env.FROM_NAME || 'AgriLearn Cacao'} <${process.env.FROM_EMAIL || process.env.EMAIL_USERNAME}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html // Optional HTML content
    };

    // Send email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
