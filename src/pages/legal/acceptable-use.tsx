import { LegalLayout } from "./legal-layout";

export function AcceptableUsePolicyPage() {
  return (
    <LegalLayout
      title="Acceptable Use Policy"
      summary="This policy describes prohibited conduct and enforcement for use of The Invoice Pro."
      lastUpdated="March 12, 2026"
    >
      <section className="space-y-3">
        <p>
          Users of The Invoice Pro agree not to use the platform for illegal or
          abusive activities.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          Prohibited Activities
        </h2>
        <p>Users may not:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>commit fraud</li>
          <li>send spam invoices</li>
          <li>attempt to hack the platform</li>
          <li>upload malicious software</li>
          <li>violate laws or regulations</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          Abuse of the Platform
        </h2>
        <p>We reserve the right to suspend accounts that:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>generate fraudulent invoices</li>
          <li>attempt to exploit the platform</li>
          <li>abuse system resources</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Enforcement</h2>
        <p>Violation of this policy may result in:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>account suspension</li>
          <li>permanent termination</li>
          <li>reporting to authorities if required</li>
        </ul>
      </section>
    </LegalLayout>
  );
}
