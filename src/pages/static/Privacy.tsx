export function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20 text-cream/50 text-sm leading-relaxed">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-widest text-gold mb-2">Legal</p>
        <h1 className="text-4xl font-black text-cream mb-2">Privacy Policy</h1>
        <p className="text-cream/50">Last updated: July 2026</p>
      </div>
      <div className="space-y-8">
        {[
          { title: 'Information We Collect', body: 'We collect information you provide when creating an account, including your full name, email address, phone number, and country of residence. We also collect identification documents for manual identity review and financial account information via Plaid.' },
          { title: 'How We Use Your Information', body: 'Your information is used to verify your identity, process disbursements, maintain worker-fee records, communicate with you about your account, maintain compliance with FinCEN/AML obligations, and detect fraud.' },
          { title: 'Data Security', body: 'We implement industry-standard security measures including AES-256 encryption at rest, TLS in transit, role-based access controls, and regular security audits.' },
          { title: 'Data Sharing', body: 'We do not sell your personal information. We may share data with regulatory authorities as required by law (including FinCEN, IRS, and OFAC), with Plaid for bank verification, and with payment processors or banking partners when required to support manual identity review, gig funding, and disbursement records.' },
          { title: 'Data Retention', body: 'We retain your data for 7 years after account closure to comply with BSA/AML recordkeeping requirements.' },
          { title: 'Your Rights', body: 'You have the right to access, correct, or delete your personal data (subject to legal retention requirements). Contact support@paybridge.work to exercise these rights.' },
        ].map(({ title, body }) => (
          <section key={title}>
            <h2 className="text-lg font-black text-cream mb-2">{title}</h2>
            <p>{body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
