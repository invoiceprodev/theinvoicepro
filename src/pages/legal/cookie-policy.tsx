import { LegalLayout } from "./legal-layout";

export function CookiePolicyPage() {
  return (
    <LegalLayout
      title="Cookie Policy"
      summary="This Cookie Policy explains what cookies are and how The Invoice Pro uses them."
      lastUpdated="March 12, 2026"
    >
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          What Are Cookies
        </h2>
        <p>
          Cookies are small files stored on your device that help websites
          remember information about your session.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          How We Use Cookies
        </h2>
        <p>We use cookies to:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>maintain login sessions</li>
          <li>improve performance</li>
          <li>understand user behaviour</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          Types of Cookies Used
        </h2>
        <p className="font-medium text-foreground">Essential Cookies</p>
        <p>Required for the platform to function.</p>
        <p className="font-medium text-foreground">Analytics Cookies</p>
        <p>Help us understand usage patterns.</p>
        <p className="font-medium text-foreground">Security Cookies</p>
        <p>Protect against unauthorized access.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          Managing Cookies
        </h2>
        <p>You can disable cookies in your browser settings.</p>
        <p>However, some features may not work properly.</p>
      </section>
    </LegalLayout>
  );
}
