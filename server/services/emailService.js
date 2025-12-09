const nodemailer = require('nodemailer');

// Create transporter for sending emails
const createTransporter = () => {
    // For production, use actual Gmail SMTP
    // For development, you can use a service like Ethereal (test email service)

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER || 'your-email@gmail.com',
            pass: process.env.EMAIL_PASSWORD || 'your-app-password'
        }
    });
};

/**
 * Send verification email to student
 */
const sendVerificationEmail = async (email, token, firstName) => {
    try {
        const transporter = createTransporter();

        // Create verification URL
        const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

        const mailOptions = {
            from: `"AgriLearn Cacao" <${process.env.EMAIL_USER || 'noreply@agrilearn.com'}>`,
            to: email,
            subject: 'Verify Your Email - AgriLearn Cacao',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                        }
                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                            background-color: #f9f9f9;
                        }
                        .header {
                            background: linear-gradient(135deg, #8B5A2B, #D4A76A);
                            color: white;
                            padding: 30px;
                            text-align: center;
                            border-radius: 10px 10px 0 0;
                        }
                        .content {
                            background: white;
                            padding: 30px;
                            border-radius: 0 0 10px 10px;
                        }
                        .button {
                            display: inline-block;
                            padding: 15px 30px;
                            background: linear-gradient(135deg, #8B5A2B, #D4A76A);
                            color: white;
                            text-decoration: none;
                            border-radius: 5px;
                            margin: 20px 0;
                            font-weight: bold;
                        }
                        .footer {
                            text-align: center;
                            margin-top: 20px;
                            color: #666;
                            font-size: 0.9em;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Welcome to AgriLearn Cacao!</h1>
                        </div>
                        <div class="content">
                            <p>Hello ${firstName},</p>

                            <p>Thank you for registering as a student at AgriLearn Cacao. We're excited to have you join our community!</p>

                            <p>To complete your registration, please verify your email address by clicking the button below:</p>

                            <div style="text-align: center;">
                                <a href="${verificationUrl}" class="button">Verify Email Address</a>
                            </div>

                            <p>Or copy and paste this link into your browser:</p>
                            <p style="word-break: break-all; color: #8B5A2B;">${verificationUrl}</p>

                            <p><strong>Note:</strong> This verification link will expire in 24 hours.</p>

                            <p>If you didn't create an account with AgriLearn Cacao, please ignore this email.</p>

                            <p>Best regards,<br>The AgriLearn Cacao Team</p>
                        </div>
                        <div class="footer">
                            <p>&copy; ${new Date().getFullYear()} AgriLearn Cacao. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Verification email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw new Error('Failed to send verification email');
    }
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (email, token, firstName) => {
    try {
        const transporter = createTransporter();

        // Create password reset URL
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${token}`;

        const mailOptions = {
            from: `"AgriLearn Cacao" <${process.env.EMAIL_USER || 'noreply@agrilearn.com'}>`,
            to: email,
            subject: 'Password Reset Request - AgriLearn Cacao',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                        }
                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                            background-color: #f9f9f9;
                        }
                        .header {
                            background: linear-gradient(135deg, #8B5A2B, #D4A76A);
                            color: white;
                            padding: 30px;
                            text-align: center;
                            border-radius: 10px 10px 0 0;
                        }
                        .content {
                            background: white;
                            padding: 30px;
                            border-radius: 0 0 10px 10px;
                        }
                        .button {
                            display: inline-block;
                            padding: 15px 30px;
                            background: linear-gradient(135deg, #8B5A2B, #D4A76A);
                            color: white;
                            text-decoration: none;
                            border-radius: 5px;
                            margin: 20px 0;
                            font-weight: bold;
                        }
                        .warning {
                            background-color: #fff3cd;
                            border-left: 4px solid #ffc107;
                            padding: 15px;
                            margin: 20px 0;
                            border-radius: 5px;
                        }
                        .footer {
                            text-align: center;
                            margin-top: 20px;
                            color: #666;
                            font-size: 0.9em;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Password Reset Request</h1>
                        </div>
                        <div class="content">
                            <p>Hello ${firstName},</p>

                            <p>We received a request to reset your password for your AgriLearn Cacao account.</p>

                            <p>To reset your password, please click the button below:</p>

                            <div style="text-align: center;">
                                <a href="${resetUrl}" class="button">Reset Password</a>
                            </div>

                            <p>Or copy and paste this link into your browser:</p>
                            <p style="word-break: break-all; color: #8B5A2B;">${resetUrl}</p>

                            <div class="warning">
                                <p><strong>Important:</strong></p>
                                <ul>
                                    <li>This password reset link will expire in 1 hour.</li>
                                    <li>If you didn't request a password reset, please ignore this email.</li>
                                    <li>Your password will remain unchanged until you create a new one.</li>
                                </ul>
                            </div>

                            <p>Best regards,<br>The AgriLearn Cacao Team</p>
                        </div>
                        <div class="footer">
                            <p>&copy; ${new Date().getFullYear()} AgriLearn Cacao. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Password reset email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw new Error('Failed to send password reset email');
    }
};

/**
 * Send OTP email for password reset
 */
const sendOTPEmail = async (email, otp, firstName) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: `"AgriLearn Cacao" <${process.env.EMAIL_USER || 'noreply@agrilearn.com'}>`,
            to: email,
            subject: 'Password Reset OTP - AgriLearn Cacao',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                        }
                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                            background-color: #f9f9f9;
                        }
                        .header {
                            background: linear-gradient(135deg, #8B5A2B, #D4A76A);
                            color: white;
                            padding: 30px;
                            text-align: center;
                            border-radius: 10px 10px 0 0;
                        }
                        .content {
                            background: white;
                            padding: 30px;
                            border-radius: 0 0 10px 10px;
                        }
                        .otp-box {
                            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                            border: 2px solid #8B5A2B;
                            border-radius: 10px;
                            padding: 20px;
                            text-align: center;
                            margin: 20px 0;
                        }
                        .otp-code {
                            font-size: 32px;
                            font-weight: bold;
                            color: #8B5A2B;
                            letter-spacing: 8px;
                            font-family: 'Courier New', monospace;
                        }
                        .warning {
                            background-color: #fff3cd;
                            border-left: 4px solid #ffc107;
                            padding: 15px;
                            margin: 20px 0;
                            border-radius: 5px;
                        }
                        .footer {
                            text-align: center;
                            margin-top: 20px;
                            color: #666;
                            font-size: 0.9em;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Password Reset OTP</h1>
                        </div>
                        <div class="content">
                            <p>Hello ${firstName || 'User'},</p>

                            <p>We received a request to reset your password for your AgriLearn Cacao account.</p>

                            <p>Your One-Time Password (OTP) is:</p>

                            <div class="otp-box">
                                <div class="otp-code">${otp}</div>
                            </div>

                            <p style="text-align: center; color: #666; font-size: 0.9em;">
                                Enter this code in the password reset form to continue.
                            </p>

                            <div class="warning">
                                <p><strong>Important:</strong></p>
                                <ul>
                                    <li>This OTP will expire in <strong>10 minutes</strong>.</li>
                                    <li>Do not share this OTP with anyone.</li>
                                    <li>If you didn't request a password reset, please ignore this email.</li>
                                    <li>Your password will remain unchanged until you complete the reset process.</li>
                                </ul>
                            </div>

                            <p>Best regards,<br>The AgriLearn Cacao Team</p>
                        </div>
                        <div class="footer">
                            <p>&copy; ${new Date().getFullYear()} AgriLearn Cacao. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('OTP email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending OTP email:', error);
        throw new Error('Failed to send OTP email');
    }
};

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendOTPEmail
};
