'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const CONSENT_KEY = 'pct_cookie_consent';

export function ConsentBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      // Small delay to avoid flash
      const timer = setTimeout(() => setShow(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setShow(false);
  };

  const decline = () => {
    localStorage.setItem(CONSENT_KEY, 'declined');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 px-4 pb-2">
      <div className="max-w-2xl mx-auto bg-gray-900 text-white rounded-2xl p-4 shadow-2xl">
        <p className="text-sm leading-relaxed mb-3">
          Usamos cookies para salvar seu histórico de cotações e melhorar a experiência.{' '}
          <Link href="/privacidade" className="underline text-taxi-300">
            Saiba mais
          </Link>
          .
        </p>
        <div className="flex gap-2">
          <button
            onClick={accept}
            className="flex-1 bg-taxi-500 text-white font-semibold py-2 rounded-xl text-sm hover:bg-taxi-600 transition-colors"
          >
            Aceitar
          </button>
          <button
            onClick={decline}
            className="flex-1 border border-gray-600 text-gray-300 font-medium py-2 rounded-xl text-sm hover:bg-gray-800 transition-colors"
          >
            Recusar
          </button>
        </div>
      </div>
    </div>
  );
}
