const crypto = require('crypto');

/**
 * Generate email for farmers based on firstName, surname, and birthdate
 * Format: firstname.surname.DDMMYYYY@agrilearn.com
 */
const generateFarmerEmail = (firstName, surname, birthdate) => {
    try {
        // Convert birthdate to DDMMYYYY format
        const date = new Date(birthdate);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const dateStr = `${day}${month}${year}`;

        // Clean and format names (remove spaces, convert to lowercase)
        const cleanFirstName = firstName.trim().toLowerCase().replace(/\s+/g, '');
        const cleanSurname = surname.trim().toLowerCase().replace(/\s+/g, '');

        // Generate email
        const email = `${cleanFirstName}.${cleanSurname}.${dateStr}@agrilearn.com`;

        return email;
    } catch (error) {
        throw new Error('Invalid birthdate format');
    }
};

/**
 * Validate if email is a Gmail account
 */
const isGmailAccount = (email) => {
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    return gmailRegex.test(email);
};

/**
 * Generate email verification token
 */
const generateVerificationToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Generate verification token expiry time (24 hours from now)
 */
const generateTokenExpiry = () => {
    return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
};

module.exports = {
    generateFarmerEmail,
    isGmailAccount,
    generateVerificationToken,
    generateTokenExpiry
};
