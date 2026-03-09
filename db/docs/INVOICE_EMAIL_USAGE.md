# Invoice Email Usage Guide

## Quick Start

### 1. Configure Resend + API

Add to your API `.env`:

```env
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=noreply@theinvoicepro.co.za
VITE_API_URL=http://127.0.0.1:3000
```

### 2. Use the Hook (Recommended)

```tsx
import { useSendInvoiceEmail } from "@/hooks/use-send-invoice-email";

const { sendEmail, isSending, isConfigured } = useSendInvoiceEmail({
  invoice,
  onSuccess: () => toast.success("Invoice sent!"),
  onError: (err) => toast.error(err.message),
});

<Button onClick={() => sendEmail()} disabled={isSending || !isConfigured}>
  Send Invoice
</Button>;
```

### 3. Service Layer (Direct)

```typescript
import { sendInvoiceEmail, isEmailServiceReady } from "@/services/invoice-email.service";

if (isEmailServiceReady()) {
  await sendInvoiceEmail({ invoice, businessProfile, includeAttachment: true });
}
```

## PDF Generation (No Email)

```typescript
import { downloadInvoicePDF, previewInvoicePDF } from "@/lib/pdf-generator";

downloadInvoicePDF(invoice, businessProfile); // triggers download
previewInvoicePDF(invoice, businessProfile); // opens in new tab
```

## API Reference

### `useSendInvoiceEmail` hook

```typescript
const { sendEmail, isSending, error, isConfigured } = useSendInvoiceEmail({
  invoice,
  onSuccess?,
  onError?,
});

await sendEmail({ recipientEmail?, recipientName?, includeAttachment? });
```

### `sendInvoiceEmail` service

```typescript
await sendInvoiceEmail({
  invoice,
  recipientEmail?,
  recipientName?,
  businessProfile?,
  includeAttachment?,   // default: true
});
```

## Related Files

| File                                    | Purpose                 |
| --------------------------------------- | ----------------------- |
| `src/lib/pdf-generator.ts`              | PDF generation (jsPDF) |
| `src/services/invoice-email.service.ts` | API-backed invoice email service |
| `src/hooks/use-send-invoice-email.ts`   | React hook |
| `api/src/resend.ts`                     | Resend email delivery |

## Troubleshooting

| Issue                             | Fix                                                             |
| --------------------------------- | --------------------------------------------------------------- |
| "Email service is not configured" | Check API env has `RESEND_API_KEY` and `RESEND_FROM_EMAIL`; restart the API |
| "Failed to send email"            | Check API logs and Resend dashboard for delivery errors |
| PDF not generating                | Ensure `invoice.items` and `invoice.client` are populated |
| Emails go to spam                 | Verify your sender domain in Resend and configure SPF/DKIM |
