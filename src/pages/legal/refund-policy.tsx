import { LegalLayout } from "./legal-layout";

export function RefundPolicyPage() {
  return (
    <LegalLayout
      title="Refund Policy"
      summary="This Refund Policy explains when subscription charges may be refunded for The Invoice Pro."
      lastUpdated="March 12, 2026"
    >
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          Subscription Payments
        </h2>
        <p>The Invoice Pro operates on a subscription model.</p>
        <p>Payments are processed via PayFast.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          Refund Eligibility
        </h2>
        <p>Refunds may be granted under the following conditions:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>duplicate payments</li>
          <li>technical errors in billing</li>
          <li>service failure preventing access</li>
        </ul>
        <p>Refund requests must be submitted within 7 days of the transaction.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          Non-Refundable Cases
        </h2>
        <p>Refunds will not be issued for:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>unused subscription periods</li>
          <li>user cancellation mid-cycle</li>
          <li>misuse of the platform</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          How to Request a Refund
        </h2>
        <p>Send an email to:</p>
        <p className="text-foreground">support@theinvoicepro.co.za</p>
        <p>Include:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>account email</li>
          <li>transaction reference</li>
          <li>reason for refund request</li>
        </ul>
      </section>
    </LegalLayout>
  );
}
