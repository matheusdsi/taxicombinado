'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { PageContainer } from '@/components/layout/PageContainer';
import { TaxiQuoteForm } from '@/components/quote/TaxiQuoteForm';
import { QuoteResultCard } from '@/components/quote/QuoteResultCard';
import { QuoteResult, RouteStep } from '@/lib/api';
import { saveLocalQuote } from '@/lib/localQuotes';
import { trackCtaClick } from '@/lib/analytics';

interface FormSnapshot {
  originAddress?: string;
  destinationAddress?: string;
  stops?: string[];
}

export default function HomePage() {
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [quoteId, setQuoteId] = useState<string>('');
  const [formSnapshot, setFormSnapshot] = useState<FormSnapshot>({});
  const [routeSteps, setRouteSteps] = useState<RouteStep[]>([]);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleResult = (res: QuoteResult, id: string, formValues: FormSnapshot, steps: RouteStep[], stops: string[]) => {
    setResult(res);
    setQuoteId(id);
    setRouteSteps(steps);
    setFormSnapshot({
      originAddress: formValues.originAddress,
      destinationAddress: formValues.destinationAddress,
      stops,
    });
    saveLocalQuote({
      id,
      createdAt: new Date().toISOString(),
      originAddress: formValues.originAddress,
      destinationAddress: formValues.destinationAddress,
      distanceKm: res.distanceKm,
      tripType: res.tripType,
      totalCost: res.totalCost,
      recommendedPrice: res.recommendedPrice,
      profit: res.profit,
      margin: res.margin,
    });
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleNewQuote = () => {
    setResult(null);
    setQuoteId('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <PageContainer>
      {!result && (
        <div className="mb-4">
          <Link
            href="/meu-perfil"
            onClick={() => trackCtaClick('home_public_profile', { placement: 'home_top_card' })}
            className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition-colors hover:bg-gray-50 group"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gray-900 text-sm font-black text-taxi-500">🔗</span>
              <div>
                <p className="text-sm font-extrabold text-gray-900">Compartilhe seu perfil com passageiros</p>
                <p className="text-xs font-semibold text-gray-500">Crie seu link e envie pelo WhatsApp para seus clientes.</p>
              </div>
            </div>
            <span className="text-lg text-gray-400 transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </div>
      )}
      {!result ? (
        <TaxiQuoteForm onResult={handleResult} />
      ) : (
        <div ref={resultRef}>
          <QuoteResultCard
            result={result}
            quoteId={quoteId}
            originAddress={formSnapshot.originAddress}
            destinationAddress={formSnapshot.destinationAddress}
            stops={formSnapshot.stops}
            routeSteps={routeSteps}
            onNewQuote={handleNewQuote}
          />
        </div>
      )}
    </PageContainer>
  );
}
