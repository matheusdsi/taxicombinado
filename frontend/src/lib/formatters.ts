/**
 * Format a number as Brazilian Real currency
 * e.g., 123.45 -> "R$ 123,45"
 */
export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format distance in km
 * e.g., 12.3 -> "12,3 km"
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
}

/**
 * Format duration in minutes to human-readable
 * e.g., 80 -> "1h 20min"
 * e.g., 45 -> "45min"
 */
export function formatDuration(minutes: number): string {
  if (minutes <= 0) {
    return '0min';
  }
  if (minutes < 60) {
    return `${Math.round(minutes)}min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}min`;
}

/**
 * Parse a money string input to number
 * Handles "R$ 1.234,56" -> 1234.56
 * Handles "1234,56" -> 1234.56
 * Handles "1234.56" -> 1234.56
 */
export function parseMoneyInput(value: string): number {
  return parseBrazilianCurrency(value);
}

export function parseBrazilianCurrency(value: string | number | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (!value) return 0;

  const cleaned = value
    .replace(/\s/g, '')
    .replace(/^R\$/i, '')
    .replace(/[^\d,.-]/g, '');

  if (!cleaned) return 0;

  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');

  if (lastComma > -1 && lastDot > -1) {
    const decimalSeparator = lastComma > lastDot ? ',' : '.';
    const thousandsSeparator = decimalSeparator === ',' ? '.' : ',';
    return parseCurrencyNumber(cleaned, thousandsSeparator, decimalSeparator);
  }

  if (lastComma > -1) {
    return parseCurrencyNumber(cleaned, '.', ',');
  }

  if (lastDot > -1) {
    return parseCurrencyNumber(cleaned, ',', '.');
  }

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseCurrencyNumber(value: string, thousandsSeparator: string, decimalSeparator: string): number {
  const normalized = value
    .replace(new RegExp(`\\${thousandsSeparator}`, 'g'), '')
    .replace(decimalSeparator, '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Format a number for display in input fields (Brazilian decimal)
 * e.g., 123.45 -> "123,45"
 */
export function formatDecimalBR(value: number, decimals = 2): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format percentage
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1).replace('.', ',')}%`;
}

/**
 * Generate WhatsApp share text for a quote result
 */
export function generateWhatsAppText(params: {
  origin?: string;
  destination?: string;
  recommendedPrice: number;
  distanceKm: number;
  estimatedMinutes: number;
  tripType: string;
}): string {
  const { origin, destination, recommendedPrice, distanceKm, estimatedMinutes, tripType } = params;

  const tripLabels: Record<string, string> = {
    one_way: 'Somente ida',
    round_trip: 'Ida e volta',
    empty_return: 'Ida com volta vazia',
  };

  let text = `🚖 *Orçamento Taxi Combinado*\n\n`;

  if (origin && destination) {
    text += `📍 *Origem:* ${origin}\n`;
    text += `🏁 *Destino:* ${destination}\n\n`;
  }

  text += `🗺️ *Distância:* ${formatDistance(distanceKm)}\n`;
  if (estimatedMinutes > 0) {
    text += `⏱️ *Tempo estimado:* ${formatDuration(estimatedMinutes)}\n`;
  }
  text += `🔄 *Tipo:* ${tripLabels[tripType] || tripType}\n\n`;
  text += `💰 *Preço estimado: ${formatCurrencyBRL(recommendedPrice)}*\n\n`;
  text += `Calculado com Taxi Combinado - taxicombinado.com.br`;

  return encodeURIComponent(text);
}
