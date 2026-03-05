# Invoice Email Usage Guide

## Quick Start

### 1. Configure EmailJS

See root `EMAILJS_SETUP.md` for full setup. Add to `.env`:

```env
VITE_EMAILJS_PUBLIC_KEY=your_public_key
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
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
| `src/lib/emailjs.ts`                    | EmailJS configuration   |
| `src/lib/pdf-generator.ts`              | PDF generation (jsPDF)  |
| `src/services/invoice-email.service.ts` | Email service functions |
| `src/hooks/use-send-invoice-email.ts`   | React hook              |

## Troubleshooting

| Issue                             | Fix                                                             |
| --------------------------------- | --------------------------------------------------------------- |
| "Email service is not configured" | Check `.env` has all 3 EmailJS variables; restart dev server    |
| "Failed to send email"            | Check EmailJS dashboard for service status; verify template IDs |
| PDF not generating                | Ensure `invoice.items` and `invoice.client` are populated       |
| Emails go to spam                 | Use professional sender email; consider EmailJS paid plan       |
