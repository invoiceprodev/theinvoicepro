import { LegalLayout } from "./legal-layout";

export function TermsOfServicePage() {
  return (
    <LegalLayout
      title="Terms of Service"
      summary="These Terms govern your access to and use of The Invoice Pro platform and related services."
      lastUpdated="March 12, 2026"
    >
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          1. Acceptance of Terms
        </h2>
        <p>
          By accessing or using The Invoice Pro, you agree to be bound by these
          Terms.
        </p>
        <p>If you do not agree, you may not use the service.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          2. Description of Service
        </h2>
        <p>The Invoice Pro provides software that allows users to:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>create invoices</li>
          <li>manage clients</li>
          <li>track payments</li>
          <li>manage subscriptions</li>
        </ul>
        <p>The service is provided on a Software-as-a-Service (SaaS) basis.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          3. Account Registration
        </h2>
        <p>Users must:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>provide accurate information</li>
          <li>maintain account security</li>
          <li>be responsible for activity under their account</li>
        </ul>
        <p>Accounts may be suspended if misuse is detected.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          4. Subscription and Billing
        </h2>
        <p>Subscriptions are billed through PayFast.</p>
        <p>Subscriptions may be billed:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>monthly</li>
          <li>annually</li>
        </ul>
        <p>Failure to pay may result in suspension of access.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          5. Intellectual Property
        </h2>
        <p>
          All software, design, and platform functionality remain the
          intellectual property of The Invoice Pro.
        </p>
        <p>Users may not:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>copy the software</li>
          <li>reverse engineer the platform</li>
          <li>resell the service without permission</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          6. Limitation of Liability
        </h2>
        <p>The Invoice Pro is provided "as is".</p>
        <p>We are not liable for:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>business losses</li>
          <li>lost profits</li>
          <li>indirect damages</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">7. Termination</h2>
        <p>We may suspend or terminate accounts if:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>users violate these terms</li>
          <li>fraudulent activity occurs</li>
          <li>illegal activity occurs</li>
        </ul>
        <p>Users may cancel accounts at any time.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          8. Governing Law
        </h2>
        <p>These Terms are governed by the laws of South Africa.</p>
      </section>
    </LegalLayout>
  );
}
