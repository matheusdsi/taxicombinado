'use client';

import { useState, useRef } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { TaxiQuoteForm } from '@/components/quote/TaxiQuoteForm';
import { QuoteResultCard } from '@/components/quote/QuoteResultCard';
import { QuoteResult, RouteStep } from '@/lib/api';
import { saveLocalQuote } from '@/lib/localQuotes';

interface FormSnapshot {
  originAddress?: string;
  destinationAddress?: string;
}

export default function HomePage() {
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [quoteId, setQuoteId] = useState<string>('');
  const [formSnapshot, setFormSnapshot] = useState<FormSnapshot>({});
  const [routeSteps, setRouteSteps] = useState<RouteStep[]>([]);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleResult = (res: QuoteResult, id: string, formValues: FormSnapshot, steps: RouteStep[]) => {
    setResult(res);
    setQuoteId(id);
    setRouteSteps(steps);
    setFormSnapshot({
      originAddress: formValues.originAddress,
      destinationAddress: formValues.destinationAddress,
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
      {!result ? (
        <TaxiQuoteForm onResult={handleResult} />
      ) : (
        <div ref={resultRef}>
          <QuoteResultCard
            result={result}
            quoteId={quoteId}
            originAddress={formSnapshot.originAddress}
            destinationAddress={formSnapshot.destinationAddress}
            routeSteps={routeSteps}
            onNewQuote={handleNewQuote}
          />
        </div>
      )}
    </PageContainer>
  );
}
