const twilio = require('twilio');

// Initialize Twilio client
const createTwilioClient = () => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !phoneNumber) {
        console.warn('⚠️ Twilio credentials not configured. SMS will be simulated.');
        return null;
    }

    return twilio(accountSid, authToken);
};

/**
 * Generate a 6-digit OTP
 */
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP via SMS
 * @param {string} phoneNumber - The recipient's phone number (with country code, e.g., +1234567890)
 * @param {string} otp - The OTP code to send
 * @returns {Promise<object>} - Result of SMS send operation
 */
const sendOTP = async (phoneNumber, otp) => {
    try {
        const client = createTwilioClient();

        // If Twilio is not configured, simulate SMS for development
        if (!client) {
            console.log('📱 [SIMULATED SMS]');
            console.log(`To: ${phoneNumber}`);
            console.log(`OTP: ${otp}`);
            console.log('Message: Your AgriLearn Cacao password reset OTP is: ' + otp);
            console.log('This code expires in 10 minutes.');
            console.log('=====================================');

            return {
                success: true,
                simulated: true,
                message: 'SMS simulated (Twilio not configured)',
                otp: otp // Only return OTP in development mode
            };
        }

        // Ensure phone number has country code
        let formattedNumber = phoneNumber;
        if (!phoneNumber.startsWith('+')) {
            // Default to Philippines country code if not provided
            formattedNumber = '+63' + phoneNumber.replace(/^0/, ''); // Remove leading 0 if present
        }

        const message = await client.messages.create({
            body: `Your AgriLearn Cacao password reset OTP is: ${otp}. This code expires in 10 minutes. Do not share this code with anyone.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: formattedNumber
        });

        console.log('📱 SMS sent successfully:', message.sid);

        return {
            success: true,
            simulated: false,
            messageSid: message.sid,
            message: 'OTP sent successfully'
        };
    } catch (error) {
        console.error('Error sending SMS:', error);
        throw new Error('Failed to send SMS. Please try again.');
    }
};

/**
 * Verify OTP (check if it matches and hasn't expired)
 * @param {string} storedOTP - The OTP stored in database
 * @param {Date} expiryDate - The expiry date of the OTP
 * @param {string} providedOTP - The OTP provided by user
 * @returns {boolean} - Whether OTP is valid
 */
const verifyOTP = (storedOTP, expiryDate, providedOTP) => {
    if (!storedOTP || !expiryDate || !providedOTP) {
        return false;
    }

    // Check if OTP has expired
    if (new Date() > new Date(expiryDate)) {
        return false;
    }

    // Check if OTP matches
    return storedOTP === providedOTP;
};

/**
 * Format phone number for display (hide middle digits)
 * @param {string} phoneNumber - The phone number to format
 * @returns {string} - Formatted phone number
 */
const formatPhoneNumberForDisplay = (phoneNumber) => {
    if (!phoneNumber) return '';

    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length < 6) return phoneNumber;

    const firstPart = cleaned.substring(0, 3);
    const lastPart = cleaned.substring(cleaned.length - 3);
    const middlePart = '*'.repeat(cleaned.length - 6);

    return `${firstPart}${middlePart}${lastPart}`;
};

module.exports = {
    generateOTP,
    sendOTP,
    verifyOTP,
    formatPhoneNumberForDisplay
};
