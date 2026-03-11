import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </div>

      <main className="container mx-auto max-w-4xl px-4 py-12 md:py-16">
        <div className="space-y-4 mb-10">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Legal</p>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Privacy Policy</h1>
          <p className="text-muted-foreground max-w-2xl">
            This Privacy Policy explains how InvoicePro collects, uses, stores, and protects personal information when
            you use our website, dashboard, and related services.
          </p>
          <p className="text-sm text-muted-foreground">Effective date: March 11, 2026</p>
        </div>

        <div className="space-y-8 text-sm leading-7 text-muted-foreground">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">1. Information We Collect</h2>
            <p>
              We may collect information you provide directly to us, including your name, email address, business
              details, billing details, and any information you enter when creating invoices, clients, expenses, or
              account settings.
            </p>
            <p>
              We may also collect technical information such as device type, browser type, IP address, pages visited,
              and service usage data to help us operate and improve the platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">2. How We Use Information</h2>
            <p>We use personal information to provide, maintain, support, and improve InvoicePro.</p>
            <p>Examples include:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>creating and managing your account</li>
              <li>processing authentication and access control</li>
              <li>sending transactional emails and service notifications</li>
              <li>processing billing and subscription actions</li>
              <li>responding to support or sales enquiries</li>
              <li>monitoring security, fraud, misuse, and platform reliability</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">3. Legal Basis</h2>
            <p>
              Where applicable, we process information to perform our contract with you, comply with legal obligations,
              pursue legitimate business interests, and where required, rely on your consent.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">4. Sharing of Information</h2>
            <p>
              We do not sell your personal information. We may share information with trusted service providers that
              help us operate InvoicePro, including hosting, authentication, email delivery, database, analytics, and
              payment providers, only to the extent reasonably necessary for those services.
            </p>
            <p>
              We may also disclose information where required by law, regulation, court order, or to protect our
              rights, users, or systems.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">5. Data Storage and Security</h2>
            <p>
              We use reasonable technical and organisational measures to protect personal information against
              unauthorised access, loss, misuse, alteration, or disclosure. No method of transmission or storage is
              completely secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">6. Data Retention</h2>
            <p>
              We retain personal information for as long as necessary to provide the service, comply with legal and tax
              obligations, resolve disputes, enforce agreements, and maintain business records.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">7. Your Rights</h2>
            <p>
              Depending on your location and applicable law, you may have rights to request access to, correction of,
              deletion of, or restriction of your personal information, and to object to certain processing activities.
            </p>
            <p>To make a privacy-related request, contact us at hello@theinvoicepro.co.za.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">8. Cookies and Similar Technologies</h2>
            <p>
              We may use cookies and similar technologies to keep you signed in, remember preferences, improve
              performance, and understand how the service is used.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">9. Third-Party Services</h2>
            <p>
              InvoicePro may rely on third-party providers for infrastructure and platform functionality. Their
              processing of data is subject to their own privacy and security terms where applicable.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. When we do, we will update the effective date on
              this page. Continued use of the service after an update means the revised policy will apply.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">11. Contact</h2>
            <p>
              If you have questions about this Privacy Policy or how we handle personal information, contact
              hello@theinvoicepro.co.za.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
