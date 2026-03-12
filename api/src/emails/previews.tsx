import { createElement } from "react";
import { renderEmailHtml, renderEmailText } from "./render.js";
import {
  ExpenseReceiptEmailTemplate,
  FooterSubscriptionEmailTemplate,
  InvoiceEmailTemplate,
  TeamInviteEmailTemplate,
  TestEmailTemplate,
  TrialLifecycleEmailTemplate,
  WelcomeEmailTemplate,
} from "./templates.js";

type PreviewDefinition = {
  subject: string;
  html: string;
  text: string;
};

function renderPreview(subject: string, template: ReturnType<typeof createElement>): PreviewDefinition {
  return {
    subject,
    html: renderEmailHtml(template),
    text: renderEmailText(template),
  };
}

export function getEmailPreview(name: string): PreviewDefinition | null {
  switch (name) {
    case "welcome":
      return renderPreview(
        "Welcome to InvoicePro",
        createElement(WelcomeEmailTemplate, { fullName: "Jerry" }),
      );
    case "invoice":
      return renderPreview(
        "Invoice INV-2026-001 from The Invoice Pro",
        createElement(InvoiceEmailTemplate, {
          toName: "Jordan",
          invoiceNumber: "INV-2026-001",
          invoiceTotal: "R1,250.00",
          invoiceDate: "March 12, 2026",
          dueDate: "March 19, 2026",
          invoiceStatus: "SENT",
          businessName: "The Invoice Pro",
          businessEmail: "support@theinvoicepro.co.za",
          notes: "Payment due within 7 days.",
          includePlatformBranding: true,
        }),
      );
    case "expense-receipt":
      return renderPreview(
        "Software receipt from The Invoice Pro",
        createElement(ExpenseReceiptEmailTemplate, {
          toName: "Jordan",
          expenseCategory: "Software",
          expenseDate: "March 12, 2026",
          expenseAmount: "R499.00",
          paymentMethod: "Bank Transfer",
          businessName: "The Invoice Pro",
          businessEmail: "support@theinvoicepro.co.za",
          notes: "March software subscription.",
        }),
      );
    case "trial-started":
      return renderPreview(
        "Welcome to Your Starter Trial!",
        createElement(TrialLifecycleEmailTemplate, {
          toName: "Jerry",
          subject: "Welcome to Your Starter Trial!",
          message:
            "Welcome to your Starter trial. Your free trial has started and will end on March 26, 2026. During your trial, you'll have full access to all features.",
          metadata: {
            Plan: "Starter",
            Price: "R99.00/month",
            "Trial Ends": "March 26, 2026",
          },
        }),
      );
    case "trial-ending":
      return renderPreview(
        "Your Trial Ends in 3 Days",
        createElement(TrialLifecycleEmailTemplate, {
          toName: "Jerry",
          subject: "Your Trial Ends in 3 Days",
          message:
            "Your Starter trial is ending soon. You have 3 days remaining. On March 26, 2026, your trial will convert to the paid plan at R99.00/month.",
          metadata: {
            Plan: "Starter",
            Price: "R99.00/month",
            "Days Remaining": "3",
            "Trial Ends": "March 26, 2026",
          },
        }),
      );
    case "subscription-activated":
      return renderPreview(
        "Welcome to Starter Plan!",
        createElement(TrialLifecycleEmailTemplate, {
          toName: "Jerry",
          subject: "Welcome to Starter Plan!",
          message:
            "Your trial has ended and your subscription to the Starter plan is now active. Your first billing period has started at R99.00/month.",
          metadata: {
            Plan: "Starter",
            Price: "R99.00/month",
            "Renewal Date": "April 12, 2026",
            "Payment ID": "pay_123456",
          },
        }),
      );
    case "payment-failed":
      return renderPreview(
        "Action Required: Payment Failed",
        createElement(TrialLifecycleEmailTemplate, {
          toName: "Jerry",
          subject: "Action Required: Payment Failed",
          message:
            "We were unable to process your payment for the Starter plan (R99.00/month). Your subscription has been paused.",
          metadata: {
            Plan: "Starter",
            Price: "R99.00/month",
            Error: "Card authorization failed",
          },
        }),
      );
    case "team-invite":
      return renderPreview(
        "The Invoice Pro team access",
        createElement(TeamInviteEmailTemplate, {
          recipientName: "Jordan",
          inviterName: "The Invoice Pro",
          companyName: "The Invoice Pro",
          role: "member",
          signupUrl: "http://127.0.0.1:5173/register",
          existingAccount: false,
        }),
      );
    case "footer-subscription":
      return renderPreview(
        "New footer subscription",
        createElement(FooterSubscriptionEmailTemplate, {
          name: "Jordan Smith",
          email: "jordan@example.com",
        }),
      );
    case "test":
      return renderPreview(
        "InvoicePro Resend test",
        createElement(TestEmailTemplate),
      );
    default:
      return null;
  }
}

export function listEmailPreviews() {
  return [
    "welcome",
    "invoice",
    "expense-receipt",
    "trial-started",
    "trial-ending",
    "subscription-activated",
    "payment-failed",
    "team-invite",
    "footer-subscription",
    "test",
  ];
}
