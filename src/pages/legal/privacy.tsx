import { LegalLayout } from "./legal-layout";

export function PrivacyPolicyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      summary="This Privacy Policy explains how we collect, use, and protect your personal information when you use The Invoice Pro platform."
      lastUpdated="March 12, 2026"
    >
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">1. Introduction</h2>
        <p>Welcome to The Invoice Pro.</p>
        <p>
          This Privacy Policy explains how we collect, use, and protect your
          personal information when you use our platform.
        </p>
        <p>
          The Invoice Pro is a cloud-based invoicing platform that allows
          businesses to manage invoices, clients, and payments.
        </p>
        <p>
          By using our services, you agree to the practices described in this
          policy.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          2. Information We Collect
        </h2>
        <p className="font-medium text-foreground">Account Information</p>
        <p>When creating an account we may collect:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Name</li>
          <li>Email address</li>
          <li>Business name</li>
          <li>Login credentials</li>
        </ul>
        <p className="font-medium text-foreground">Business Data</p>
        <p>Users may store:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Client information</li>
          <li>Invoice details</li>
          <li>Billing addresses</li>
          <li>Transaction records</li>
        </ul>
        <p className="font-medium text-foreground">Payment Information</p>
        <p>Payments are processed securely through PayFast.</p>
        <p>We do not store card details on our servers.</p>
        <p className="font-medium text-foreground">
          Automatically Collected Information
        </p>
        <p>We may automatically collect:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>IP address</li>
          <li>Browser type</li>
          <li>Device information</li>
          <li>Usage logs</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          3. How We Use Your Information
        </h2>
        <p>We use your information to:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Provide invoicing services</li>
          <li>Process subscriptions</li>
          <li>Send service-related communications</li>
          <li>Improve platform performance</li>
          <li>Prevent fraud</li>
          <li>Comply with legal obligations</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          4. Third-Party Services
        </h2>
        <p>Our infrastructure uses third-party providers including:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Auth0 for authentication</li>
          <li>Supabase for database services</li>
          <li>PayFast for payments</li>
          <li>Railway for backend infrastructure</li>
          <li>Vercel for application deployment</li>
          <li>Resend for transactional emails</li>
        </ul>
        <p>
          Each provider processes data according to their own privacy policies.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">5. Data Security</h2>
        <p>
          We use industry standard security practices including:
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>HTTPS encryption</li>
          <li>secure authentication</li>
          <li>restricted access controls</li>
          <li>cloud infrastructure security</li>
        </ul>
        <p>However, no system can guarantee absolute security.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">6. Data Retention</h2>
        <p>We retain your data while your account is active.</p>
        <p>You may request deletion of your account at any time.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">7. POPIA Rights</h2>
        <p>
          Under the Protection of Personal Information Act (POPIA) you may:
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>request access to your personal data</li>
          <li>request corrections</li>
          <li>request deletion</li>
          <li>withdraw consent for certain processing</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">8. Contact</h2>
        <p>For privacy inquiries:</p>
        <p className="text-foreground">support@theinvoicepro.co.za</p>
      </section>
    </LegalLayout>
  );
}
