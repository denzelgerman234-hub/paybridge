export function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20 text-cream/50 text-sm leading-relaxed">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-widest text-gold mb-2">Legal</p>
        <h1 className="text-4xl font-black text-cream mb-2">Terms of Service</h1>
        <p className="text-cream/50">Effective: January 1, 2026 · Last updated: July 2026</p>
      </div>
      <div className="space-y-8">
        {[
          { title: '1. Independent Contractor Status', body: 'PayBridge Workers are independent contractors, not employees. You are responsible for your own taxes, benefits, and compliance obligations. PayBridge will issue IRS Form 1099-NEC for earnings exceeding $600 in a calendar year.' },
          { title: '2. The Pre-Funded Model', body: 'PayBridge guarantees that principal funds are deposited into your dedicated disbursement account before any authorized disbursements begin. You will never be required to use your personal funds. Any instruction to do so constitutes fraud and must be reported immediately.' },
          { title: '3. Dedicated Account Requirement', body: 'You must maintain a dedicated disbursement account at one of PayBridge\'s 29 partner financial institutions, verified through Plaid. This account must be used exclusively for PayBridge-authorized transactions.' },
          { title: '4. Worker Fee Rates', body: 'Worker fee rates are determined by your badge tier: Trainee 10%, Associate 10%, Senior 11%, Expert 13%, Elite 15%. Rates are calculated as a percentage of the total principal disbursed per gig and recorded after Operations verifies gig completion.' },
          { title: '5. AML & Regulatory Compliance', body: 'PayBridge is a FinCEN-registered Money Services Business. You agree to comply with all applicable AML, OFAC, and Bank Secrecy Act requirements. Violations may result in immediate termination and regulatory reporting.' },
          { title: '6. Termination', body: 'Either party may terminate this agreement at any time. PayBridge reserves the right to suspend or terminate accounts for violations of this agreement, the Code of Conduct, or applicable law.' },
          { title: '7. Limitation of Liability', body: 'PayBridge\'s liability to any worker is limited to verified worker fees not yet settled. PayBridge is not liable for losses arising from worker errors, fraud by third parties, or regulatory actions against the worker.' },
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
