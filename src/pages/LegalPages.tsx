import { Link } from 'react-router-dom';

function LegalLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <Link to="/" className="brand-mark legal-brand">
          PRA <span>Connector</span>
        </Link>
        <nav className="legal-nav">
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/login">Login</Link>
        </nav>
      </header>
      <main className="legal-main card">
        <h1>{title}</h1>
        <p className="legal-updated">Last updated: July 16, 2026</p>
        {children}
      </main>
      <footer className="legal-footer">
        <span>© 2026 PRA Connector</span>
        <span>
          <Link to="/terms">Terms</Link> · <Link to="/privacy">Privacy</Link>
        </span>
      </footer>
    </div>
  );
}

export function TermsPage() {
  return (
    <LegalLayout title="End-User License Agreement">
      <section>
        <h2>1. Agreement</h2>
        <p>
          This End-User License Agreement (&quot;Agreement&quot;) is between you (&quot;Customer&quot;,
          &quot;you&quot;) and the operator of PRA Connector (&quot;we&quot;, &quot;us&quot;,
          &quot;Service&quot;). By accessing or using PRA Connector, you agree to this Agreement.
        </p>
      </section>
      <section>
        <h2>2. Service description</h2>
        <p>
          PRA Connector is a software service that helps businesses connect QuickBooks Online with
          the Punjab Revenue Authority (PRA) Electronic Invoice Monitoring System (e-IMS) for
          invoice mapping, synchronization, and fiscal posting workflows.
        </p>
      </section>
      <section>
        <h2>3. License grant</h2>
        <p>
          We grant you a limited, non-exclusive, non-transferable license to use the Service for
          your internal business operations, subject to this Agreement and applicable law.
        </p>
      </section>
      <section>
        <h2>4. Customer responsibilities</h2>
        <ul>
          <li>Maintain valid QuickBooks Online and PRA credentials and permissions.</li>
          <li>Ensure invoice data submitted through the Service is accurate and compliant.</li>
          <li>Keep account credentials secure and notify us of unauthorized access.</li>
          <li>Use the Service only for lawful business and tax compliance purposes.</li>
        </ul>
      </section>
      <section>
        <h2>5. Third-party services</h2>
        <p>
          The Service integrates with Intuit QuickBooks Online and PRA systems. Your use of those
          platforms is governed by their respective terms and policies. We are not responsible for
          third-party outages, API changes, or service interruptions.
        </p>
      </section>
      <section>
        <h2>6. Data and confidentiality</h2>
        <p>
          We process business and invoice data solely to provide the Service. See our{' '}
          <Link to="/privacy">Privacy Policy</Link> for details on data handling.
        </p>
      </section>
      <section>
        <h2>7. Disclaimer</h2>
        <p>
          The Service is provided &quot;as is&quot; without warranties of any kind. We do not
          guarantee uninterrupted operation, error-free posting, or acceptance of invoices by PRA or
          QuickBooks. You remain responsible for verifying fiscal outcomes and regulatory
          compliance.
        </p>
      </section>
      <section>
        <h2>8. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, we shall not be liable for indirect, incidental,
          special, or consequential damages arising from use of the Service, including lost
          profits, tax penalties, or data loss.
        </p>
      </section>
      <section>
        <h2>9. Termination</h2>
        <p>
          We may suspend or terminate access if you breach this Agreement or misuse the Service.
          You may stop using the Service at any time.
        </p>
      </section>
      <section>
        <h2>10. Contact</h2>
        <p>
          For questions about this Agreement, contact:{' '}
          <a href="mailto:support@praconnector.com">support@praconnector.com</a>
        </p>
      </section>
    </LegalLayout>
  );
}

export function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy">
      <section>
        <h2>1. Overview</h2>
        <p>
          PRA Connector (&quot;we&quot;, &quot;us&quot;) respects your privacy. This Privacy Policy
          explains how we collect, use, store, and protect information when you use our integration
          platform connecting QuickBooks Online and PRA e-IMS.
        </p>
      </section>
      <section>
        <h2>2. Information we collect</h2>
        <ul>
          <li>
            <strong>Account information:</strong> name, email, organization name, login credentials
            (stored securely hashed).
          </li>
          <li>
            <strong>QuickBooks data:</strong> company profile, invoices, customers, items, and
            related accounting fields required for mapping and posting.
          </li>
          <li>
            <strong>PRA configuration:</strong> POS ID, API endpoints, and tokens configured by
            authorized administrators for your organization.
          </li>
          <li>
            <strong>Operational logs:</strong> sync status, API responses, audit events, and error
            messages for troubleshooting and compliance.
          </li>
        </ul>
      </section>
      <section>
        <h2>3. How we use information</h2>
        <ul>
          <li>Authenticate users and manage multi-tenant workspaces.</li>
          <li>Map QuickBooks invoice fields to PRA fiscal JSON formats.</li>
          <li>Submit invoices to PRA e-IMS on your behalf when configured.</li>
          <li>Display sync history, connection status, and audit trails.</li>
          <li>Improve reliability, security, and support.</li>
        </ul>
      </section>
      <section>
        <h2>4. Data sharing</h2>
        <p>
          We do not sell your personal or business data. We share data only with:
        </p>
        <ul>
          <li>Intuit (QuickBooks Online) — as required for authorized OAuth and API access.</li>
          <li>PRA / PRAL systems — as required for fiscal invoice submission.</li>
          <li>Infrastructure providers — hosting and database services under confidentiality obligations.</li>
          <li>Legal authorities — when required by applicable law.</li>
        </ul>
      </section>
      <section>
        <h2>5. Data retention</h2>
        <p>
          We retain account, configuration, and invoice sync records for as long as your
          organization uses the Service and as needed for legal, tax, and audit requirements. You
          may request deletion subject to regulatory retention obligations.
        </p>
      </section>
      <section>
        <h2>6. Security</h2>
        <p>
          We use industry-standard measures including encrypted connections (HTTPS/TLS), access
          controls, role-based permissions, and secure credential storage. No method of transmission
          over the internet is 100% secure.
        </p>
      </section>
      <section>
        <h2>7. Your rights</h2>
        <p>
          Depending on applicable law, you may request access, correction, or deletion of your
          personal data. Contact us using the email below to exercise these rights.
        </p>
      </section>
      <section>
        <h2>8. Cookies and local storage</h2>
        <p>
          We use browser local storage for authentication tokens and session state. We do not use
          third-party advertising cookies.
        </p>
      </section>
      <section>
        <h2>9. Changes</h2>
        <p>
          We may update this Privacy Policy from time to time. The &quot;Last updated&quot; date at
          the top will reflect changes. Continued use of the Service after updates constitutes
          acceptance.
        </p>
      </section>
      <section>
        <h2>10. Contact</h2>
        <p>
          Privacy inquiries:{' '}
          <a href="mailto:privacy@praconnector.com">privacy@praconnector.com</a>
          <br />
          General support:{' '}
          <a href="mailto:support@praconnector.com">support@praconnector.com</a>
        </p>
      </section>
    </LegalLayout>
  );
}
