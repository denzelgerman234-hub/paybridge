export function ComplianceBadges() {
  return (
    <section className="py-12 border-y" style={{ borderColor: 'rgba(241,240,218,0.05)', background: '#091024' }}>
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          
          <div className="text-center md:text-left flex-shrink-0">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gold mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Enterprise-Grade Trust
            </h3>
            <p className="text-xs text-cream/40 max-w-[200px]">
              Meeting the highest standards for financial security and compliance.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-start gap-[10px]">
            <img src="/images/compliance/fincen-user.png" alt="FinCEN" className="h-28 object-contain" />
            <img src="/images/compliance/ofac-user.png" alt="OFAC" className="h-28 object-contain" />
            <img src="/images/compliance/nacha-user.png" alt="NACHA" className="h-20 object-contain" />
            <img src="/images/compliance/pcidss-user.png" alt="PCI DSS" className="h-24 object-contain" />
            <img src="/images/compliance/soc2-user.png" alt="SOC 2" className="h-28 object-contain" />
            <img src="/images/compliance/iso27001-user.png" alt="ISO 27001" className="h-28 object-contain" />
            <img src="/images/compliance/bbb-user.png" alt="BBB" className="h-24 object-contain" />
          </div>

        </div>
      </div>
    </section>
  );
}
