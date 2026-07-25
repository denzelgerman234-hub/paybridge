import { Link } from 'react-router-dom';

export function CodeOfConduct() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-widest text-gold mb-2">PayBridge Worker Agreement</p>
        <h1 className="text-4xl font-black text-cream mb-2">Code of Conduct</h1>
        <p className="text-cream/50 text-sm">Effective: January 1, 2026 · Last updated: July 2026</p>
      </div>

      <div className="prose max-w-none space-y-8 text-cream/50 text-sm leading-relaxed">
        {[
          {
            title: '1. The Pre-Funded Model — Non-Negotiable',
            content: `You will NEVER use your personal funds for disbursements. PayBridge deposits the full principal into your dedicated disbursement account BEFORE you execute any transactions. If you have not received and confirmed the principal deposit, you must NOT disburse any funds.\n\nAny instruction asking you to send funds before confirmed platform funding is fraudulent. Report it immediately to compliance@paybridge.work.`,
          },
          {
            title: '2. Dedicated Disbursement Account',
            content: `Your dedicated disbursement account must:\n• Be held at one of PayBridge's 29 partner financial institutions\n• Be used EXCLUSIVELY for PayBridge-authorized disbursements\n• Have no personal spending, utility payments, or non-platform income\n• Be verified through Plaid during onboarding and subject to ongoing monitoring`,
          },
          {
            title: '3. Proof of Disbursement',
            content: `After every disbursement, you must immediately upload:\n• A screenshot of the completed transaction\n• The Transaction ID (TXID) or reference number\n\nFailure to upload proof within 24 hours may result in badge penalty. Failure to upload proof is treated as a compliance violation.`,
          },
          {
            title: '4. AML & OFAC Compliance',
            content: `You agree to comply with all applicable Anti-Money Laundering (AML) laws and OFAC sanctions lists. You must not knowingly disburse funds to:\n• Sanctioned individuals or entities\n• Recipients in OFAC-restricted jurisdictions\n• Any party flagged in our compliance systems\n\nIf you identify a potential sanctions match, STOP and report immediately.`,
          },
          {
            title: '5. Red Flags — Stop & Report',
            content: `You must stop all activity and report if:\n• A client asks you to use your personal account\n• A client asks you to send funds before they are deposited\n• A recipient asks you to return funds to a different account\n• You receive instructions that seem designed to evade detection\n• Any transaction seems structured to avoid reporting thresholds`,
          },
          {
            title: '6. Platform-Only Communication',
            content: `All client communication must occur through the PayBridge dashboard. You must not:\n• Share personal contact information with clients or recipients\n• Communicate about gigs via email, SMS, or any external channel\n• Accept payment instructions from outside the platform`,
          },
          {
            title: '7. 1099-NEC & Tax Obligations',
            content: `You are an independent contractor. PayBridge will issue Form 1099-NEC for annual earnings over $600. You are solely responsible for your tax obligations, including self-employment tax. Consult a tax professional for guidance.`,
          },
          {
            title: '8. Termination',
            content: `PayBridge may terminate your account immediately for:\n• Using personal funds for disbursements\n• Operating a non-dedicated disbursement account\n• Failing to upload disbursement proof\n• Any AML or OFAC violation\n• Operating outside the platform dashboard\n\nTermination does not waive any legal obligations.`,
          },
        ].map(({ title, content }) => (
          <section key={title}>
            <h2 className="text-lg font-black text-cream mb-3">{title}</h2>
            <p className="whitespace-pre-line">{content}</p>
          </section>
        ))}

        <div className="pt-6 border-t border-white/8">
          <p className="text-xs text-cream/50">
            Questions? Contact <a href="mailto:compliance@paybridge.work" className="text-gold hover:underline">compliance@paybridge.work</a> or{' '}
            <Link to="/support" className="text-gold hover:underline">visit support</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

