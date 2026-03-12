import type { CSSProperties, ReactNode } from "react";

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
  background:
    "linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)",
  color: "#ffffff",
  padding: "32px 32px 24px",
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
};

const titleStyle: CSSProperties = {
  margin: "0 0 8px",
  fontSize: "28px",
  lineHeight: 1.2,
  fontWeight: 700,
};

const subtitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "14px",
  lineHeight: 1.6,
  color: "rgba(255,255,255,0.86)",
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

type EmailLayoutProps = {
  title: string;
  preview: string;
  children: ReactNode;
  footerText?: string;
};

function EmailLayout({
  title,
  preview,
  children,
  footerText = "Sent by The Invoice Pro",
}: EmailLayoutProps) {
  return (
    <html>
      <body style={pageStyle}>
        <div style={{ display: "none", overflow: "hidden", maxHeight: 0 }}>
          {preview}
        </div>
        <div style={containerStyle}>
          <div style={headerStyle}>
            <p style={{ margin: "0 0 10px", fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              The Invoice Pro
            </p>
            <h1 style={titleStyle}>{title}</h1>
            <p style={subtitleStyle}>{preview}</p>
          </div>
          <div style={contentStyle}>{children}</div>
          <div style={footerStyle}>
            <p style={{ margin: "0 0 8px" }}>{footerText}</p>
            <p style={{ margin: 0 }}>
              support@theinvoicepro.co.za
              <br />
              https://theinvoicepro.co.za
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
