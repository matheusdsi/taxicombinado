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
  if (!value) return 0;

  // Remove currency symbol and whitespace
  let cleaned = value.replace(/R\$\s?/g, '').trim();

  // Handle Brazilian format: 1.234,56
  // If there's a comma and it looks like decimal separator
  if (cleaned.includes(',')) {
    // Remove thousand separators (dots) and replace decimal comma with dot
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  }

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
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
  text += `⏱️ *Tempo estimado:* ${formatDuration(estimatedMinutes)}\n`;
  text += `🔄 *Tipo:* ${tripLabels[tripType] || tripType}\n\n`;
  text += `💰 *Preço recomendado: ${formatCurrencyBRL(recommendedPrice)}*\n\n`;
  text += `Calculado com Taxi Combinado - taxicombinado.com.br`;

  return encodeURIComponent(text);
}
