'use client';

import { useEffect, useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { getPartners, trackPartnerClick, Partner } from '@/lib/api';

const categories = [
  { value: '', label: 'Todos' },
  { value: 'fuel_station', label: 'Posto' },
  { value: 'mechanic', label: 'Mecânica' },
  { value: 'car_wash', label: 'Lava-rápido' },
  { value: 'toll_tag', label: 'Tag Pedágio' },
  { value: 'vehicle_protection', label: 'Proteção' },
];

const categoryLabels: Record<string, string> = {
  fuel_station: '⛽ Posto',
  mechanic: '🔧 Mecânica',
  car_wash: '🚿 Lava-rápido',
  toll_tag: '🛣️ Tag Pedágio',
  vehicle_protection: '🛡️ Proteção Veicular',
};

export default function ParceirosPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    const fetchPartners = async () => {
      setLoading(true);
      try {
        const data = await getPartners(selectedCategory || undefined);
        setPartners(data);
      } catch {
        setPartners([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPartners();
  }, [selectedCategory]);

  const handlePartnerClick = async (partner: Partner) => {
    await trackPartnerClick(partner.id, 'partners_page');
    if (partner.websiteUrl) {
      window.open(partner.websiteUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <PageContainer>
      <div className="mb-4 pt-2">
        <h1 className="text-2xl font-black text-gray-900">Parceiros</h1>
        <p className="text-gray-500 text-sm mt-1">Serviços com vantagens para taxistas</p>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              selectedCategory === cat.value
                ? 'bg-taxi-500 text-white border-taxi-500'
                : 'bg-white text-gray-600 border-gray-200 hover:border-taxi-300'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-[3px] border-taxi-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && partners.length === 0 && (
        <div className="text-center py-16">
          <span className="text-5xl mb-4 block">🤝</span>
          <p className="text-gray-500">Nenhum parceiro nessa categoria ainda.</p>
        </div>
      )}

      {!loading && partners.length > 0 && (
        <div className="flex flex-col gap-3">
          {partners.map((partner) => (
            <div
              key={partner.id}
              className={`bg-white rounded-2xl shadow-card overflow-hidden ${
                partner.isPremium ? 'border-2 border-taxi-200' : ''
              }`}
            >
              {partner.isPremium && (
                <div className="bg-taxi-500 text-white text-xs font-semibold px-3 py-1 text-center">
                  ⭐ Parceiro Premium
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">{partner.name}</h3>
                    <span className="text-xs text-taxi-600 font-medium">
                      {categoryLabels[partner.category] || partner.category}
                    </span>
                    {partner.city && (
                      <span className="text-xs text-gray-400 ml-2">📍 {partner.city}</span>
                    )}
                  </div>
                </div>

                {partner.description && (
                  <p className="text-sm text-gray-600 mb-3 leading-relaxed">{partner.description}</p>
                )}

                <div className="flex gap-2">
                  {partner.phone && (
                    <a
                      href={`tel:${partner.phone}`}
                      className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 text-gray-700 font-medium py-2 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Ligar
                    </a>
                  )}
                  {partner.websiteUrl && (
                    <button
                      onClick={() => handlePartnerClick(partner)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-taxi-500 text-white font-medium py-2 rounded-xl text-sm hover:bg-taxi-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Ver site
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CTA to become partner */}
      <div className="mt-6 bg-gradient-to-br from-taxi-50 to-taxi-100 rounded-2xl p-4 border border-taxi-200">
        <h3 className="font-bold text-gray-800 mb-1">Seu negócio aqui?</h3>
        <p className="text-sm text-gray-600 mb-3">
          Alcance taxistas de São Paulo com seu produto ou serviço.
        </p>
        <a
          href="/anuncie"
          className="inline-flex items-center gap-2 bg-taxi-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-taxi-600 transition-colors"
        >
          Anuncie aqui →
        </a>
      </div>
    </PageContainer>
  );
}
