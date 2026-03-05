import emailjs from "@emailjs/browser";

/**
 * EmailJS Configuration
 *
 * Setup Instructions:
 * 1. Create an account at https://www.emailjs.com/
 * 2. Add an email service (Gmail, Outlook, etc.)
 * 3. Create an email template with these variables:
 *    - {{to_email}} - Recipient email
 *    - {{to_name}} - Client name
 *    - {{invoice_number}} - Invoice number
 *    - {{invoice_total}} - Total amount
 *    - {{invoice_date}} - Invoice date
 *    - {{due_date}} - Due date
 *    - {{pdf_data}} - Base64 PDF attachment (optional)
 * 4. Get your Public Key, Service ID, and Template ID
 * 5. Add them to your .env file
 */

const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

// Initialize EmailJS with public key
export const initEmailJS = () => {
  if (EMAILJS_PUBLIC_KEY) {
    emailjs.init(EMAILJS_PUBLIC_KEY);
  }
};

// Check if EmailJS is configured
export const isEmailJSConfigured = () => {
  return !!(EMAILJS_PUBLIC_KEY && EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID);
};

// Send email with EmailJS
export const sendEmail = async (templateParams: Record<string, any>) => {
  if (!isEmailJSConfigured()) {
    throw new Error(
      "EmailJS is not configured. Please add VITE_EMAILJS_PUBLIC_KEY, VITE_EMAILJS_SERVICE_ID, and VITE_EMAILJS_TEMPLATE_ID to your .env file.",
    );
  }

  try {
    const response = await emailjs.send(EMAILJS_SERVICE_ID!, EMAILJS_TEMPLATE_ID!, templateParams);
    return response;
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
};

export { emailjs };
