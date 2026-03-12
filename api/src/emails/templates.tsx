import React, { type CSSProperties, type ReactNode } from "react";

const pageStyle: CSSProperties = {
  backgroundColor: "#f8fafc",
  margin: 0,
  padding: "24px 12px",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  color: "#0f172a",
};

const containerStyle: CSSProperties = {
  maxWidth: "640px",
  margin: "0 auto",
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  overflow: "hidden",
};

const headerStyle: CSSProperties = {
  backgroundColor: "#ffffff",
  color: "#0f172a",
  padding: "28px 32px 8px",
};

const contentStyle: CSSProperties = {
  padding: "32px",
  fontSize: "15px",
  lineHeight: 1.7,
};

const footerStyle: CSSProperties = {
  borderTop: "1px solid #e2e8f0",
  padding: "20px 32px 28px",
  color: "#64748b",
  fontSize: "12px",
  lineHeight: 1.6,
  textAlign: "center",
};

const titleStyle: CSSProperties = {
  margin: "18px 0 8px",
  fontSize: "28px",
  lineHeight: 1.2,
  fontWeight: 700,
  textAlign: "center",
};

const subtitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "14px",
  lineHeight: 1.6,
  color: "#475569",
  textAlign: "center",
};

const paragraphStyle: CSSProperties = {
  margin: "0 0 16px",
};

const buttonStyle: CSSProperties = {
  display: "inline-block",
  padding: "12px 18px",
  backgroundColor: "#1d4ed8",
  color: "#ffffff",
  textDecoration: "none",
  borderRadius: "10px",
  fontWeight: 600,
};

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  margin: "20px 0",
};

const keyCellStyle: CSSProperties = {
  padding: "10px 0",
  borderBottom: "1px solid #e2e8f0",
  fontWeight: 600,
  verticalAlign: "top",
  width: "38%",
};

const valueCellStyle: CSSProperties = {
  padding: "10px 0",
  borderBottom: "1px solid #e2e8f0",
  color: "#334155",
};

const listStyle: CSSProperties = {
  margin: "0 0 18px",
  paddingLeft: "20px",
};

const mutedStyle: CSSProperties = {
  color: "#64748b",
};

const brandWordmarkStyle: CSSProperties = {
  margin: 0,
  fontSize: "32px",
  lineHeight: 1,
  fontWeight: 800,
  letterSpacing: "-0.04em",
  textAlign: "center",
  color: "#0f172a",
};

const calloutStyle: CSSProperties = {
  margin: "24px 0",
  padding: "18px 20px",
  backgroundColor: "#f8fafc",
  border: "1px solid #dbeafe",
  borderRadius: "12px",
};

const infoLabelStyle: CSSProperties = {
  margin: "0 0 6px",
  fontSize: "12px",
  lineHeight: 1.5,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  fontWeight: 700,
  color: "#64748b",
};

type EmailLayoutProps = {
  title: string;
  preview: string;
  children: ReactNode;
  footerText?: string;
  supportEmail?: string;
  supportUrl?: string;
};

function EmailLayout({
  title,
  preview,
  children,
  footerText = "Sent by The Invoice Pro",
  supportEmail = "support@theinvoicepro.co.za",
  supportUrl = "https://theinvoicepro.co.za",
}: EmailLayoutProps) {
  return (
    <html>
      <body style={pageStyle}>
        <div style={{ display: "none", overflow: "hidden", maxHeight: 0 }}>
          {preview}
        </div>
        <div style={containerStyle}>
          <div style={headerStyle}>
            <p style={brandWordmarkStyle}>InvoicePro</p>
            <h1 style={titleStyle}>{title}</h1>
            <p style={subtitleStyle}>{preview}</p>
          </div>
          <div style={contentStyle}>{children}</div>
          <div style={footerStyle}>
            <p style={{ margin: "0 0 8px" }}>{footerText}</p>
            <p style={{ margin: 0 }}>
              {supportEmail}
              <br />
              {supportUrl}
              <br />
              332 Lungfish Street, Skycity,
              <br />
              Alberton Johannesburg,
              <br />
              South Africa 1449
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}

function SummaryTable({ rows }: { rows: Array<{ label: string; value: string }> }) {
  if (rows.length === 0) return null;

  return (
    <table style={tableStyle}>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label}>
            <td style={keyCellStyle}>{row.label}</td>
            <td style={valueCellStyle}>{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function WelcomeEmailTemplate(input: { fullName: string }) {
  return (
    <EmailLayout
      title="Welcome to The Invoice Pro"
      preview="Your account is ready. Start creating invoices, managing clients, and tracking expenses."
    >
      <p style={paragraphStyle}>Hi {input.fullName},</p>
      <p style={paragraphStyle}>
        Your account is ready. You can now start creating invoices, managing
        clients, and tracking expenses in your dashboard.
      </p>
      <p style={paragraphStyle}>
        We recommend starting by adding your business details, clients, and
        first invoice.
      </p>
    </EmailLayout>
  );
}

export function ConfirmEmailTemplate(input: {
  fullName: string;
  confirmationUrl: string;
  appName?: string;
  logoUrl?: string;
  supportEmail?: string;
  supportUrl?: string;
}) {
  const appName = input.appName || "InvoicePro";

  return (
    <EmailLayout
      title="Confirm your email"
      preview="Use your secure magic link to verify your email address and activate your InvoicePro account."
      supportEmail={input.supportEmail}
      supportUrl={input.supportUrl}
    >
      <p style={paragraphStyle}>Hi {input.fullName},</p>
      <p style={paragraphStyle}>Thanks for creating your {appName} account.</p>
      <p style={paragraphStyle}>
        Use the secure magic link below to confirm your email address and
        finish activating your account.
      </p>
      <p style={{ margin: "24px 0" }}>
        <a href={input.confirmationUrl} style={buttonStyle}>
          Confirm Email Address
        </a>
      </p>
      <div style={calloutStyle}>
        <p style={infoLabelStyle}>What happens next</p>
        <p style={{ ...paragraphStyle, marginBottom: 0 }}>
          Once confirmed, you can sign in, complete your setup, and continue to
          your dashboard.
        </p>
      </div>
      <div
        style={{
          margin: "0 0 24px",
          padding: "18px 20px",
          borderRadius: "12px",
          backgroundColor: "#0f172a",
          color: "#ffffff",
        }}
      >
        <p style={{ margin: "0 0 6px", fontSize: "12px", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.65)" }}>
          Secure sign-in
        </p>
        <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.7, color: "rgba(255,255,255,0.88)" }}>
          This magic link is unique to your account and should only be used by
          you.
        </p>
      </div>
      <p style={paragraphStyle}>
        If the button does not work, copy and paste this link into your browser:
      </p>
      <p style={{ ...paragraphStyle, wordBreak: "break-word", color: "#1d4ed8" }}>
        {input.confirmationUrl}
      </p>
      <p style={paragraphStyle}>
        If you did not create this account, you can ignore this email.
      </p>
    </EmailLayout>
  );
}

export function InvoiceEmailTemplate(input: {
  toName: string;
  invoiceNumber: string;
  invoiceTotal: string;
  invoiceDate: string;
  dueDate: string;
  invoiceStatus: string;
  businessName: string;
  businessEmail?: string;
  notes?: string;
  includePlatformBranding?: boolean;
}) {
  return (
    <EmailLayout
      title={`Invoice ${input.invoiceNumber}`}
      preview={`${input.businessName} sent you an invoice for ${input.invoiceTotal}.`}
      footerText={
        input.includePlatformBranding === false
          ? `Sent by ${input.businessName}`
          : "Sent by The Invoice Pro"
      }
    >
      <p style={paragraphStyle}>Hi {input.toName},</p>
      <p style={paragraphStyle}>
        Please find your invoice details below.
      </p>
      <SummaryTable
        rows={[
          { label: "Business", value: input.businessName },
          { label: "Invoice Number", value: input.invoiceNumber },
          { label: "Invoice Date", value: input.invoiceDate },
          { label: "Due Date", value: input.dueDate },
          { label: "Status", value: input.invoiceStatus },
          { label: "Total", value: input.invoiceTotal },
        ]}
      />
      {input.notes ? (
        <p style={paragraphStyle}>
          <strong>Notes:</strong> {input.notes}
        </p>
      ) : null}
      {input.businessEmail ? (
        <p style={paragraphStyle}>
          If you have questions, reply to {input.businessEmail}.
        </p>
      ) : null}
    </EmailLayout>
  );
}

export function ExpenseReceiptEmailTemplate(input: {
  toName: string;
  expenseCategory: string;
  expenseDate: string;
  expenseAmount: string;
  paymentMethod: string;
  businessName: string;
  businessEmail?: string;
  notes?: string;
}) {
  return (
    <EmailLayout
      title={`${input.expenseCategory} Receipt`}
      preview={`${input.businessName} sent your receipt for ${input.expenseAmount}.`}
    >
      <p style={paragraphStyle}>Hi {input.toName},</p>
      <p style={paragraphStyle}>
        Please find your receipt details below.
      </p>
      <SummaryTable
        rows={[
          { label: "Business", value: input.businessName },
          { label: "Category", value: input.expenseCategory },
          { label: "Date", value: input.expenseDate },
          { label: "Amount", value: input.expenseAmount },
          { label: "Payment Method", value: input.paymentMethod },
        ]}
      />
      {input.notes ? (
        <p style={paragraphStyle}>
          <strong>Notes:</strong> {input.notes}
        </p>
      ) : null}
      {input.businessEmail ? (
        <p style={paragraphStyle}>
          If you have questions, reply to {input.businessEmail}.
        </p>
      ) : null}
    </EmailLayout>
  );
}

export function TrialLifecycleEmailTemplate(input: {
  toName: string;
  subject: string;
  message: string;
  metadata?: Record<string, string>;
}) {
  return (
    <EmailLayout title={input.subject} preview={input.message}>
      <p style={paragraphStyle}>Hi {input.toName},</p>
      <p style={paragraphStyle}>{input.message}</p>
      <SummaryTable
        rows={Object.entries(input.metadata || {}).map(([label, value]) => ({
          label,
          value,
        }))}
      />
    </EmailLayout>
  );
}

export function FooterSubscriptionEmailTemplate(input: {
  name: string;
  email: string;
}) {
  return (
    <EmailLayout
      title="New footer subscription"
      preview="A visitor submitted the footer subscription form."
    >
      <SummaryTable
        rows={[
          { label: "Name", value: input.name },
          { label: "Email", value: input.email },
        ]}
      />
    </EmailLayout>
  );
}

export function TeamInviteEmailTemplate(input: {
  recipientName: string;
  inviterName: string;
  companyName: string;
  role: string;
  signupUrl: string;
  existingAccount: boolean;
}) {
  return (
    <EmailLayout
      title={input.existingAccount ? "You were added" : "You are invited"}
      preview={`${input.inviterName} added you as a ${input.role} on ${input.companyName}.`}
    >
      <p style={paragraphStyle}>Hello {input.recipientName},</p>
      <p style={paragraphStyle}>
        {input.inviterName} added you as a {input.role} on the{" "}
        {input.companyName} workspace.
      </p>
      <p style={paragraphStyle}>
        {input.existingAccount
          ? "Sign in with your existing account to continue."
          : "Create your account to complete access setup."}
      </p>
      <p style={{ margin: "24px 0" }}>
        <a href={input.signupUrl} style={buttonStyle}>
          {input.existingAccount ? "Open Workspace" : "Create Account"}
        </a>
      </p>
      {!input.existingAccount ? (
        <p style={{ ...paragraphStyle, ...mutedStyle }}>
          Use the invited email address when creating your account.
        </p>
      ) : null}
    </EmailLayout>
  );
}

export function TestEmailTemplate() {
  return (
    <EmailLayout
      title="InvoicePro Resend test"
      preview="This is a test email from the InvoicePro API using Resend."
    >
      <p style={paragraphStyle}>
        This is a test email from the InvoicePro API using Resend.
      </p>
      <ul style={listStyle}>
        <li>Delivery is active</li>
        <li>Template rendering is active</li>
        <li>Resend transport is active</li>
      </ul>
    </EmailLayout>
  );
}
