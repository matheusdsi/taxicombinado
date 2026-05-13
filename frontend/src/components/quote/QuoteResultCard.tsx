'use client';

import { useState } from 'react';
import { QuoteResult } from '@/lib/api';
import { formatCurrencyBRL, formatDistance, generateWhatsAppText } from '@/lib/formatters';

interface QuoteResultCardProps {
  result: QuoteResult;
  quoteId: string;
  originAddress?: string;
  destinationAddress?: string;
  onNewQuote: () => void;
}

const alertIcons: Record<string, string> = {
  negative_profit:           '🔴',
  custom_price_below_minimum:'🔴',
  low_profit:                '🟡',
  toll_missing:              '🟡',
  high_margin:               '🟡',
  empty_return_enabled:      '🔵',
  check_route:               '🟡',
};

const alertBg: Record<string, string> = {
  error:   'bg-red-50 border-red-200 text-red-700',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  info:    'bg-blue-50 border-blue-200 text-blue-700',
};

function CostRow({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`flex justify-between items-center py-1.5 ${highlight ? 'font-semibold' : 'text-gray-600'}`}>
      <span className="text-sm">{label}</span>
      <span className={`text-sm ${highlight ? 'font-bold text-gray-900' : ''}`}>{formatCurrencyBRL(value)}</span>
    </div>
  );
}

export function QuoteResultCard({ result, quoteId, originAddress, destinationAddress, onNewQuote }: QuoteResultCardProps) {
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const profitRecommended = result.recommendedPrice - result.totalCost;
  const profitIdeal = result.idealPrice - result.totalCost;
  const marginIdeal = result.idealPrice > 0 ? (profitIdeal / result.idealPrice) * 100 : 0;

  const copyText = () => {
    const lines = [
      '🚖 Orçamento Taxi Combinado',
      '',
      originAddress      && `📍 Origem: ${originAddress}`,
      destinationAddress && `🏁 Destino: ${destinationAddress}`,
      `🗺️ Distância: ${formatDistance(result.distanceKm)}`,
      '',
      `💰 Preço recomendado: ${formatCurrencyBRL(result.recommendedPrice)}`,
      `📊 Custo da corrida: ${formatCurrencyBRL(result.totalCost)}`,
      `✅ Lucro estimado: ${formatCurrencyBRL(profitRecommended)}`,
      '',
      'Calculado com Taxi Combinado',
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(lines).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareWhatsApp = () => {
    const text = generateWhatsAppText({
      origin: originAddress,
      destination: destinationAddress,
      recommendedPrice: result.recommendedPrice,
      distanceKm: result.distanceKm,
      estimatedMinutes: result.estimatedMinutes,
      tripType: result.tripType,
    });
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="flex flex-col gap-3">

      {/* ─── Rota ─── */}
      {(originAddress || destinationAddress) && (
        <div className="bg-white rounded-2xl shadow-card px-4 py-3 flex items-center gap-2 text-sm text-gray-600">
          <span className="shrink-0">📍</span>
          <span className="truncate">{originAddress || '—'}</span>
          <span className="text-gray-300 shrink-0">→</span>
          <span className="truncate">{destinationAddress || '—'}</span>
        </div>
      )}

      {/* ─── Custo total (topo discreto) ─── */}
      <div className="bg-white rounded-2xl shadow-card px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 font-medium">Custo real da corrida</p>
          <p className="text-lg font-black text-gray-800">{formatCurrencyBRL(result.totalCost)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Distância</p>
          <p className="text-sm font-semibold text-gray-600">{formatDistance(result.totalDistanceKm)}</p>
        </div>
      </div>

      {/* ─── 3 preços em destaque ─── */}
      <div className="flex flex-col gap-2">

        {/* Mínimo aceitável */}
        <div className="bg-white rounded-2xl shadow-card p-4 flex items-center justify-between border-l-4 border-gray-300">
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Mínimo aceitável</p>
            <p className="text-sm text-gray-500 mt-0.5">Só cobre os custos</p>
          </div>
          <p className="text-2xl font-black text-gray-600">{formatCurrencyBRL(result.minimumPrice)}</p>
        </div>

        {/* Recomendado — destaque */}
        <div className="bg-gradient-to-br from-taxi-500 to-taxi-600 rounded-2xl p-5 shadow-result text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-taxi-100 text-xs font-semibold uppercase tracking-wide">Preço recomendado</p>
              <p className="text-5xl font-black tracking-tight mt-1 leading-none">
                {formatCurrencyBRL(result.recommendedPrice)}
              </p>
              <p className="text-taxi-100 text-xs mt-2">
                Lucro: <span className="font-bold text-white">{formatCurrencyBRL(profitRecommended)}</span>
                {' '}·{' '}
                Margem: <span className="font-bold text-white">{result.margin.toFixed(0)}%</span>
              </p>
            </div>
            <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full shrink-0 mt-1">
              #{quoteId.slice(0, 6)}
            </span>
          </div>
        </div>

        {/* Lucro alto */}
        <div className="bg-white rounded-2xl shadow-card p-4 flex items-center justify-between border-l-4 border-green-400">
          <div>
            <p className="text-xs text-green-600 font-semibold uppercase tracking-wide">Lucro alto</p>
            <p className="text-sm text-gray-500 mt-0.5">
              Lucro {formatCurrencyBRL(profitIdeal)} · {marginIdeal.toFixed(0)}% margem
            </p>
          </div>
          <p className="text-2xl font-black text-green-600">{formatCurrencyBRL(result.idealPrice)}</p>
        </div>
      </div>

      {/* Valor informado pelo taxista */}
      {result.customChargedPrice && result.customChargedPrice > 0 && (
        <div className={`rounded-2xl p-4 border flex items-center justify-between ${
          result.customChargedPrice < result.minimumPrice
            ? 'bg-red-50 border-red-200'
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Valor que você quer cobrar</p>
            <p className={`text-sm mt-0.5 ${result.customChargedPrice < result.minimumPrice ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
              {result.customChargedPrice < result.minimumPrice
                ? '⚠️ Abaixo do mínimo — pode dar prejuízo'
                : `Lucro: ${formatCurrencyBRL(result.customChargedPrice - result.totalCost)}`}
            </p>
          </div>
          <p className={`text-2xl font-black ${result.customChargedPrice < result.minimumPrice ? 'text-red-600' : 'text-gray-700'}`}>
            {formatCurrencyBRL(result.customChargedPrice)}
          </p>
        </div>
      )}

      {/* ─── Alertas ─── */}
      {result.alerts.length > 0 && (
        <div className="flex flex-col gap-2">
          {result.alerts.map((alert, i) => (
            <div key={i} className={`flex items-start gap-2 p-3 rounded-xl border text-sm ${alertBg[alert.severity]}`}>
              <span className="mt-0.5 flex-shrink-0">{alertIcons[alert.type] ?? '⚠️'}</span>
              <span>{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* ─── Detalhamento colapsável ─── */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <button type="button" onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors">
          <span className="text-sm font-semibold">Ver detalhamento de custos</span>
          <svg className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showDetails && (
          <div className="px-4 pb-4 border-t border-gray-100 divide-y divide-gray-50">
            <div className="py-2">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Custos</p>
              <CostRow label="Combustível" value={result.fuelCost} />
              {result.tollTotal > 0 && <CostRow label="Pedágios" value={result.tollTotal} />}
              {result.parkingCost > 0 && <CostRow label="Estacionamento" value={result.parkingCost} />}
              {result.extraCosts > 0 && <CostRow label="Outras taxas" value={result.extraCosts} />}
              <CostRow label="Total de custos" value={result.totalCost} highlight />
            </div>
            <div className="py-2">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Preços</p>
              <CostRow label="Pelo taxímetro (tarifa)" value={result.farePrice} />
              <CostRow label="Mínimo aceitável" value={result.minimumPrice} />
              <CostRow label="Recomendado" value={result.recommendedPrice} highlight />
              <CostRow label="Lucro alto" value={result.idealPrice} />
            </div>
          </div>
        )}
      </div>

      {/* ─── Botões ─── */}
      <div className="flex gap-2">
        <button type="button" onClick={copyText}
          className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 font-medium py-3 rounded-xl text-sm hover:bg-gray-50 shadow-card transition-colors active:scale-[0.98]">
          {copied ? (
            <><svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Copiado!</>
          ) : (
            <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> Copiar</>
          )}
        </button>

        <button type="button" onClick={shareWhatsApp}
          className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white font-medium py-3 rounded-xl text-sm hover:bg-green-600 shadow-sm transition-colors active:scale-[0.98]">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          WhatsApp
        </button>
      </div>

      <button type="button" onClick={onNewQuote}
        className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-600 font-medium py-3 rounded-xl text-sm hover:bg-gray-200 transition-colors active:scale-[0.98]">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Nova simulação
      </button>
    </div>
  );
}
