# EmailJS Setup Guide

## Overview

This project uses **EmailJS** for sending invoice emails with PDF attachments and trial lifecycle notifications. EmailJS is a free email service that allows you to send emails directly from client-side JavaScript without needing a backend server.

## Why EmailJS?

- **Free tier**: 200 emails/month free
- **No backend required**: Works entirely from the frontend
- **Easy setup**: Configure in minutes
- **PDF attachments**: Supports sending PDFs via base64 encoding
- **Multiple email providers**: Works with Gmail, Outlook, Yahoo, custom SMTP, etc.

## Setup Instructions

### Step 1: Create EmailJS Account

1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Click "Sign Up" and create a free account
3. Verify your email address

### Step 2: Add Email Service

1. Go to [Email Services](https://dashboard.emailjs.com/admin) in your dashboard
2. Click "Add New Service"
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the provider-specific instructions:
   - **Gmail**: Click "Connect Account" and authorize EmailJS
   - **Outlook**: Click "Connect Account" and authorize EmailJS
   - **Other SMTP**: Enter your SMTP server details
5. Click "Create Service"
6. **Copy your Service ID** (e.g., `service_abc123`)

### Step 3: Create Email Template

1. Go to [Email Templates](https://dashboard.emailjs.com/admin/templates) in your dashboard
2. Click "Create New Template"
3. Create **multiple templates** for different email types:

#### Invoice Email Template

**Subject:**

```
Invoice {{invoice_number}} from {{business_name}}
```

**Content:**

```html
Hello {{to_name}}, Thank you for your business! Please find your invoice details below: Invoice Number:
{{invoice_number}} Invoice Date: {{invoice_date}} Due Date: {{due_date}} Total Amount: {{invoice_total}} Status:
{{invoice_status}} {{#if notes}} Notes: {{notes}} {{/if}} The invoice PDF is attached to this email. Best regards,
{{business_name}} {{business_email}}
```

#### Trial Welcome Email Template

**Template ID**: `template_trial_welcome` (create separate template)

**Subject:**

```
Welcome to your 14-day trial! 🎉
```

**Content:**

```html
Hello {{to_name}}, Welcome to your 14-day trial of {{business_name}}! Your trial details: • Plan: {{plan_name}} • Trial
ends: {{trial_end_date}} • Price after trial: {{plan_price}} During your trial, you'll have full access to all features.
Your card will be charged {{plan_price}} on {{trial_end_date}} unless you cancel before then. Get started now:
{{dashboard_url}} Best regards, The {{business_name}} Team
```

#### Trial Reminder Email Template

**Template ID**: `template_trial_reminder` (create separate template)

**Subject:**

```
Your trial ends in 3 days
```

**Content:**

```html
Hello {{to_name}}, Your 14-day trial will end in 3 days on {{trial_end_date}}. After your trial ends: • Your card will
be charged {{plan_price}} • You'll be subscribed to the {{plan_name}} • You'll continue to have full access To cancel
before being charged, visit your account settings. Manage subscription: {{dashboard_url}} Best regards, The
{{business_name}} Team
```

#### Subscription Activated Email Template

**Template ID**: `template_subscription_activated` (create separate template)

**Subject:**

```
Your subscription is now active
```

**Content:**

```html
Hello {{to_name}}, Your trial has ended and your subscription is now active! Subscription details: • Plan: {{plan_name}}
• Price: {{plan_price}} • Next renewal: {{renewal_date}} • Payment status: {{payment_status}} Thank you for subscribing!
View dashboard: {{dashboard_url}} Best regards, The {{business_name}} Team
```

#### Payment Failed Email Template

**Template ID**: `template_payment_failed` (create separate template)

**Subject:**

```
Action required: Payment failed
```

**Content:**

```html
Hello {{to_name}}, We were unable to process your payment for the {{plan_name}}. Amount due: {{plan_price}} Attempted:
{{payment_date}} Please update your payment method to continue using our service. Update payment: {{dashboard_url}} If
you have questions, please contact support. Best regards, The {{business_name}} Team
```

4. Click "Save" for each template
5. **Copy each Template ID** (you'll need all 5 template IDs)

### Step 4: Get Your Public Key

1. Go to [Account Settings](https://dashboard.emailjs.com/admin/account)
2. Find your **Public Key** (also called User ID)
3. **Copy your Public Key** (e.g., `user_ABC123XYZ`)

### Step 5: Configure Environment Variables

1. Open your `.env` file (create one if it doesn't exist by copying `.env.example`)
2. Add your EmailJS credentials:

```env
# EmailJS Configuration
VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
VITE_EMAILJS_SERVICE_ID=your_service_id_here
VITE_EMAILJS_TEMPLATE_ID=your_invoice_template_id_here

# Trial Email Templates (optional - only needed if using trial features)
VITE_EMAILJS_TRIAL_WELCOME_TEMPLATE_ID=your_trial_welcome_template_id
VITE_EMAILJS_TRIAL_REMINDER_TEMPLATE_ID=your_trial_reminder_template_id
VITE_EMAILJS_SUBSCRIPTION_ACTIVATED_TEMPLATE_ID=your_subscription_activated_template_id
VITE_EMAILJS_PAYMENT_FAILED_TEMPLATE_ID=your_payment_failed_template_id
```

3. Replace the placeholder values with your actual credentials
4. Save the file
5. Restart your development server (`pnpm dev`)

### Step 6: Test Email Sending

1. Go to any invoice detail page in your dashboard
2. Click "Send Invoice" button (to be added in next task)
3. Check that the email was sent successfully
4. Verify the email was received with the PDF attachment

## Template Variables Reference

The following variables are available in your EmailJS template:

| Variable             | Description               | Example                 |
| -------------------- | ------------------------- | ----------------------- |
| `{{to_email}}`       | Client email address      | `client@example.com`    |
| `{{to_name}}`        | Client name               | `John Doe`              |
| `{{invoice_number}}` | Invoice number            | `INV-001`               |
| `{{invoice_total}}`  | Total amount formatted    | `$1,234.56`             |
| `{{invoice_date}}`   | Invoice date              | `12/25/2023`            |
| `{{due_date}}`       | Due date                  | `01/25/2024`            |
| `{{invoice_status}}` | Invoice status            | `PAID`, `PENDING`       |
| `{{business_name}}`  | Your company name         | `Acme Corp`             |
| `{{business_email}}` | Your business email       | `billing@acme.com`      |
| `{{client_company}}` | Client company (optional) | `Client Ltd`            |
| `{{subtotal}}`       | Subtotal amount           | `$1,000.00`             |
| `{{tax_amount}}`     | Tax amount                | `$234.56`               |
| `{{notes}}`          | Invoice notes (optional)  | `Payment terms: Net 30` |
| `{{pdf_data}}`       | Base64 encoded PDF        | (binary data)           |

## Trial Email Templates Reference

The following variables are available in trial lifecycle email templates:

| Variable             | Description            | Example                   |
| -------------------- | ---------------------- | ------------------------- |
| `{{to_email}}`       | User email address     | `user@example.com`        |
| `{{to_name}}`        | User name              | `John Doe`                |
| `{{plan_name}}`      | Plan name              | `Starter Plan`            |
| `{{plan_price}}`     | Plan price formatted   | `R170.00/month`           |
| `{{trial_end_date}}` | Trial end date         | `January 15, 2024`        |
| `{{payment_status}}` | Payment status         | `Successful`, `Failed`    |
| `{{renewal_date}}`   | Next renewal date      | `February 15, 2024`       |
| `{{payment_date}}`   | Payment attempt date   | `January 15, 2024`        |
| `{{dashboard_url}}`  | Link to user dashboard | `https://app.example.com` |
| `{{business_name}}`  | Your company name      | `InvoicePro`              |

## Email Sending Schedule

The system automatically sends trial emails at key moments:

1. **Trial Started**: Sent immediately when user signs up
2. **3-Day Reminder**: Sent 3 days before trial ends (via daily cron job)
3. **Subscription Activated**: Sent when trial converts to paid subscription
4. **Payment Failed**: Sent if payment processing fails

**Cron Job Setup**: The trial reminder and conversion emails are sent via a scheduled task that runs daily at midnight. See `netlify/functions/trial-conversion-cron.ts` for implementation details.

## Troubleshooting

### Emails Not Sending

**Problem**: "EmailJS is not configured" error

**Solution**:

- Check that all three environment variables are set in `.env`
- Restart your development server after adding environment variables
- Verify the variable names are exactly: `VITE_EMAILJS_PUBLIC_KEY`, `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`

**Problem**: "Failed to send email" error

**Solution**:

- Verify your EmailJS credentials are correct
- Check that your email service is connected in EmailJS dashboard
- Ensure you haven't exceeded the free tier limit (200 emails/month)
- Check browser console for detailed error messages

### PDF Not Attached

**Problem**: Email received but no PDF attachment

**Solution**:

- EmailJS free tier may have attachment size limits
- Verify your template includes the `{{pdf_data}}` variable
- Check that `includeAttachment: true` is set when calling `sendInvoiceEmail()`

### Email in Spam/Junk

**Problem**: Emails going to spam folder

**Solution**:

- Add your sending email to the recipient's contacts
- Use a professional "From" email address
- Avoid spam trigger words in subject/body
- Consider upgrading to EmailJS paid plan for better deliverability

## Pricing & Limits

### Free Tier

- 200 emails per month
- All features included
- Attachment support
- Multiple services

### Paid Plans

Starting at $7/month:

- 1,000+ emails per month
- Priority support
- Custom branding
- Better deliverability

See [EmailJS Pricing](https://www.emailjs.com/pricing/) for details.

## Alternative: Resend API

If you prefer a backend-based solution or need more emails, consider [Resend](https://resend.com/):

- 100 emails/day free
- 3,000 emails/month on free tier
- React Email template support
- Better deliverability
- Requires backend/API setup

To switch to Resend, you'll need to:

1. Create backend API endpoints
2. Install `resend` package on server
3. Update `src/services/invoice-email.service.ts` to use Resend API

## Security Notes

⚠️ **Important**: Never commit your `.env` file to version control!

- The `.env` file is already in `.gitignore`
- Only commit `.env.example` with placeholder values
- Share credentials securely with team members (use password manager)
- Rotate keys if accidentally exposed

## Support

- EmailJS Documentation: [https://www.emailjs.com/docs/](https://www.emailjs.com/docs/)
- EmailJS Support: [https://www.emailjs.com/support/](https://www.emailjs.com/support/)
- Project Issues: Create an issue in the project repository
