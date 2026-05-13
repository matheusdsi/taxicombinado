'use client';

import { useState, useRef } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { TaxiQuoteForm } from '@/components/quote/TaxiQuoteForm';
import { QuoteResultCard } from '@/components/quote/QuoteResultCard';
import { QuoteResult } from '@/lib/api';

interface FormSnapshot {
  originAddress?: string;
  destinationAddress?: string;
}

export default function HomePage() {
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [quoteId, setQuoteId] = useState<string>('');
  const [formSnapshot, setFormSnapshot] = useState<FormSnapshot>({});
  const resultRef = useRef<HTMLDivElement>(null);

  const handleResult = (res: QuoteResult, id: string, formValues: FormSnapshot) => {
    setResult(res);
    setQuoteId(id);
    setFormSnapshot({
      originAddress: formValues.originAddress,
      destinationAddress: formValues.destinationAddress,
    });
    // Scroll to result
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
      {/* Hero banner */}
      <div className="mb-4 pt-2">
        <h1 className="text-2xl font-black text-gray-900 leading-tight">
          Calcule sua corrida <span className="text-taxi-500">com precisão</span>
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Saiba o preço justo antes de combinar — São Paulo, SP
        </p>
      </div>

      {!result ? (
        <TaxiQuoteForm onResult={handleResult} />
      ) : (
        <div ref={resultRef}>
          <div className="mb-3 flex items-center gap-2">
            <span className="text-2xl">✅</span>
            <h2 className="text-lg font-bold text-gray-800">Resultado da simulação</h2>
          </div>
          <QuoteResultCard
            result={result}
            quoteId={quoteId}
            originAddress={formSnapshot.originAddress}
            destinationAddress={formSnapshot.destinationAddress}
            onNewQuote={handleNewQuote}
          />
        </div>
      )}
    </PageContainer>
  );
}
