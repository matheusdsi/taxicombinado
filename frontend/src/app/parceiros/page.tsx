'use client';

import { useEffect, useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { getPartners, trackPartnerClick, Partner, PartnerLocation } from '@/lib/api';

function PartnerThumb({ partner, initials }: { partner: Partner; initials: string }) {
  const [imgError, setImgError] = useState(false);

  if (partner.logoUrl && !imgError) {
    return (
      <div style={{
        width: 56, height: 56, flexShrink: 0, borderRadius: 14,
        background: partner.isPremium ? 'var(--yellow)' : 'var(--gray-50)',
        border: '1px solid var(--gray-100)',
        display: 'grid', placeItems: 'center', overflow: 'hidden',
      }}>
        <img
          src={partner.logoUrl}
          alt={partner.name}
          onError={() => setImgError(true)}
          style={{ width: 40, height: 40, objectFit: 'contain' }}
        />
      </div>
    );
  }

  return (
    <div style={{
      width: 56, height: 56, flexShrink: 0, borderRadius: 14,
      background: partner.isPremium ? 'var(--yellow)' : 'var(--gray-100)',
      color: partner.isPremium ? 'var(--ink)' : 'var(--gray-700)',
      display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 14,
    }}>
      {initials}
    </div>
  );
}

const categories = [
  { value: '', label: 'Todos' },
  { value: 'fuel_station', label: 'Postos' },
  { value: 'mechanic', label: 'Oficina' },
  { value: 'car_wash', label: 'Lavagem' },
  { value: 'toll_tag', label: 'Tag Pedágio' },
  { value: 'vehicle_protection', label: 'Seguro' },
];

const categoryLabels: Record<string, string> = {
  fuel_station: 'Postos',
  mechanic: 'Oficina',
  oficina: 'Oficina',
  car_wash: 'Lavagem',
  toll_tag: 'Tag Pedágio',
  vehicle_protection: 'Proteção Veicular',
};

const categoryInitials: Record<string, string> = {
  fuel_station: 'PT',
  mechanic: 'OF',
  oficina: 'OF',
  car_wash: 'LV',
  toll_tag: 'TP',
  vehicle_protection: 'SG',
};

function buildWhatsAppUrl(phone: string, partnerName: string) {
  const digits = phone.replace(/\D/g, '');
  const normalized = digits.startsWith('55') ? digits : `55${digits}`;
  const message = `Olá, vim pelo app Táxi Combinado e gostaria de ajuda com ${partnerName}.`;

  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

function bySortOrder<T extends { sortOrder?: number; name: string }>(a: T, b: T) {
  return (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name, 'pt-BR');
}

function normalizeCategoryKey(category: string) {
  return category.trim().toLowerCase();
}

export default function ParceirosPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    const fetchPartners = async () => {
      setLoading(true);
      try {
        const data = await getPartners(selectedCategory || undefined);
        setPartners(
          [...data]
            .sort(bySortOrder)
            .map((partner) => ({
              ...partner,
              locations: partner.locations ? [...partner.locations].sort(bySortOrder) : [],
            }))
        );
      } catch {
        setPartners([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPartners();
  }, [selectedCategory]);

  const handlePartnerClick = async (partner: Partner, url: string, source: string, partnerLocationId?: string) => {
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win) {
      window.location.href = url;
    }
    await trackPartnerClick(partner.id, source, partnerLocationId);
  };

  const renderContactButtons = (
    partner: Partner,
    target: Partner | PartnerLocation,
    options: { showOffer?: boolean; locationId?: string } = {}
  ) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {target.phone && (
        <a
          href={`tel:${target.phone}`}
          onClick={() => {
            void trackPartnerClick(partner.id, 'partners_page_phone', options.locationId);
          }}
          style={{ flex: '1 1 92px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: '1.5px solid var(--gray-200)', background: 'var(--surface)', color: 'var(--ink)', borderRadius: 12, padding: '9px 12px', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
          Ligar
        </a>
      )}
      {target.whatsapp && (
        <button
          onClick={() => handlePartnerClick(partner, buildWhatsAppUrl(target.whatsapp as string, partner.name), 'partners_page_whatsapp', options.locationId)}
          style={{ flex: '1 1 112px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#25D366', color: '#062b14', border: 0, borderRadius: 12, padding: '9px 12px', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          WhatsApp
        </button>
      )}
      {options.showOffer && partner.websiteUrl && (
        <button
          onClick={() => handlePartnerClick(partner, partner.websiteUrl as string, 'partners_page_offer')}
          style={{ flex: '1 1 112px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'var(--ink)', color: '#fff', border: 0, borderRadius: 12, padding: '9px 12px', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Ver oferta
        </button>
      )}
      {target.wazeUrl && (
        <button
          onClick={() => handlePartnerClick(partner, target.wazeUrl as string, 'partners_page_waze', options.locationId)}
          style={{ flex: '1 1 92px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#33CCFF', color: 'var(--ink)', border: 0, borderRadius: 12, padding: '9px 12px', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Waze
        </button>
      )}
    </div>
  );

  return (
    <PageContainer>
      {/* Header */}
      <div style={{ marginBottom: 16, paddingTop: 4 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--ink)' }}>Benefícios</h1>
        <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>Economize em combustível, pneus, manutenção e serviços.</p>
      </div>

      {/* Category chips */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 4, scrollbarWidth: 'none' as const }}>
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            style={{
              flexShrink: 0, padding: '8px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700,
              border: '1px solid',
              borderColor: selectedCategory === cat.value ? 'transparent' : 'var(--gray-200)',
              background: selectedCategory === cat.value ? 'var(--ink)' : 'var(--surface)',
              color: selectedCategory === cat.value ? '#fff' : 'var(--gray-700)',
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '4px solid var(--gray-200)', borderTopColor: 'var(--ink)', animation: 'spin 0.9s linear infinite' }} />
        </div>
      )}

      {!loading && partners.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🤝</div>
          <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>Nenhum parceiro nessa categoria ainda.</p>
        </div>
      )}

      {!loading && partners.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {partners.map((partner) => (
            (() => {
              const locations = partner.locations ?? [];
              const mainLocation = locations[0];
              const otherLocations = locations.slice(1);

              return (
            <div
              key={partner.id}
              className="tc-card"
              style={{
                display: 'flex', gap: 12,
                ...(partner.isPremium ? { background: 'linear-gradient(180deg, #FFFBEC, #fff)', borderColor: '#FCEBA8' } : {}),
              }}
            >
              {/* Thumb */}
              <PartnerThumb
                partner={partner}
                initials={categoryInitials[normalizeCategoryKey(partner.category)] || partner.name.slice(0, 2).toUpperCase()}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{partner.name}</div>
                  {partner.isPremium && (
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.08em', background: 'var(--ink)', color: 'var(--yellow)', padding: '2px 6px', borderRadius: 4 }}>DESTAQUE</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--gray-500)', marginBottom: 6 }}>
                  {categoryLabels[normalizeCategoryKey(partner.category)] || partner.category}
                  {partner.city && ` · ${partner.city}`}
                </div>
                {partner.description && (
                  <p style={{ fontSize: 13, color: 'var(--gray-700)', fontWeight: 600, marginBottom: 10, lineHeight: 1.4 }}>{partner.description}</p>
                )}
                {mainLocation ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {partner.websiteUrl && renderContactButtons(partner, partner, { showOffer: true })}
                    <div style={{ border: '1px solid var(--gray-200)', borderRadius: 12, padding: 10, background: 'rgba(255,255,255,.72)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>{mainLocation.name}</div>
                        <span style={{ flexShrink: 0, borderRadius: 999, background: 'var(--yellow-soft)', color: 'var(--ink)', padding: '3px 7px', fontSize: 9, fontWeight: 900, letterSpacing: '.06em' }}>
                          PRINCIPAL
                        </span>
                      </div>
                      {(mainLocation.address || mainLocation.city) && (
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', marginTop: 2, marginBottom: 8 }}>
                          {[mainLocation.address, mainLocation.city].filter(Boolean).join(' · ')}
                        </div>
                      )}
                      {renderContactButtons(partner, mainLocation, { locationId: mainLocation.id })}
                    </div>
                    {otherLocations.length > 0 && (
                      <details style={{ border: '1px solid var(--gray-200)', borderRadius: 12, background: 'rgba(255,255,255,.72)', overflow: 'hidden' }}>
                        <summary style={{ cursor: 'pointer', padding: '10px 12px', fontSize: 13, fontWeight: 800, color: 'var(--ink)', listStyle: 'none' }}>
                          Outras unidades ({otherLocations.length})
                        </summary>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 10px 10px' }}>
                          {otherLocations.map((location) => (
                            <div key={location.id} style={{ borderTop: '1px solid var(--gray-200)', paddingTop: 10 }}>
                              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>{location.name}</div>
                              {(location.address || location.city) && (
                                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', marginTop: 2, marginBottom: 8 }}>
                                  {[location.address, location.city].filter(Boolean).join(' · ')}
                                </div>
                              )}
                              {renderContactButtons(partner, location, { locationId: location.id })}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                ) : (
                  renderContactButtons(partner, partner, { showOffer: true })
                )}
              </div>
            </div>
              );
            })()
          ))}
        </div>
      )}

      {/* CTA anuncie */}
      <div style={{ marginTop: 20, background: 'var(--yellow)', borderRadius: 22, padding: '20px 18px 22px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -20, top: -30, width: 150, height: 150, borderRadius: '50%', background: 'rgba(17,24,39,.08)' }} />
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: 'rgba(17,24,39,.6)', marginBottom: 8 }}>Para empresas</div>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, maxWidth: 260, marginBottom: 8 }}>
          Anuncie para taxistas da sua região.
        </div>
        <p style={{ fontSize: 13, color: 'rgba(17,24,39,.7)', maxWidth: 260, marginBottom: 14 }}>
          Sua oficina, posto ou seguro na frente de quem roda todo dia.
        </p>
        <a href="/anuncie"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--ink)', color: '#fff', borderRadius: 12, padding: '12px 18px', fontSize: 14, fontWeight: 800, textDecoration: 'none' }}>
          Anuncie aqui →
        </a>
      </div>
    </PageContainer>
  );
}
