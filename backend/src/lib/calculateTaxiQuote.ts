export type TripType = 'one_way' | 'round_trip' | 'empty_return';
export type WaitingChargeType = 'per_minute' | 'per_hour';

export interface QuoteInput {
  distanceKm: number;
  returnDistanceKm?: number;
  totalDistanceKm?: number;
  estimatedMinutes: number;
  tripType: TripType;

  // Traffic extra minutes from API (duration_in_traffic - duration_normal), max(0, delta)
  trafficExtraMinutes?: number;

  // Vehicle
  consumptionKmPerLiter: number;
  fuelPricePerLiter: number;
  vehicleExtraCostPerKm?: number;

  // Fare
  baseFare: number;
  pricePerKm: number;
  waitingPrice: number;
  waitingChargeType: WaitingChargeType;
  flagMultiplier: number;

  // Extra costs
  tollOutbound?: number;
  tollReturn?: number;
  parkingCost?: number;
  extraCosts?: number;

  // Pricing strategy
  desiredMarginPercent?: number;
  driverMinimumValue?: number;
  customChargedPrice?: number;
}

export type AlertType =
  | 'low_profit'
  | 'negative_profit'
  | 'custom_price_below_minimum'
  | 'empty_return_enabled'
  | 'toll_missing'
  | 'high_margin'
  | 'check_route'
  | 'traffic_capped';

export interface Alert {
  type: AlertType;
  message: string;
  severity: 'info' | 'warning' | 'error';
}

export interface QuoteResult {
  // Inputs echoed
  distanceKm: number;
  returnDistanceKm: number;
  totalDistanceKm: number;
  estimatedMinutes: number;
  tripType: TripType;

  // Cost breakdown
  fuelCost: number;
  vehicleExtraCost: number;
  tollTotal: number;
  parkingCost: number;
  extraCosts: number;
  totalCost: number;

  // Fare breakdown
  baseKmPrice: number;       // bandeirada + km * pricePerKm
  timeCharge: number;        // manual waiting charge (estimatedMinutes)
  trafficAddition: number;   // automatic traffic charge (capped at 20% of baseKmPrice)
  trafficCapped: boolean;    // true if traffic cap was applied
  trafficExtraMinutes: number;
  farePrice: number;         // (baseKmPrice + timeCharge + trafficAddition) * flagMultiplier

  // Pricing
  minimumPrice: number;
  priceWithMargin: number;
  recommendedPrice: number;
  idealPrice: number;
  customChargedPrice?: number;

  // Outcome
  profit: number;
  margin: number;

  // Alerts
  alerts: Alert[];
}

export function calculateTaxiQuote(input: QuoteInput): QuoteResult {
  const {
    distanceKm,
    estimatedMinutes,
    tripType,
    consumptionKmPerLiter,
    fuelPricePerLiter,
    vehicleExtraCostPerKm = 0,
    baseFare,
    pricePerKm,
    waitingPrice,
    waitingChargeType,
    flagMultiplier,
    tollOutbound = 0,
    tollReturn: tollReturnValue = 0,
    parkingCost = 0,
    extraCosts = 0,
    desiredMarginPercent = 0,
    driverMinimumValue = 0,
    customChargedPrice,
  } = input;

  const trafficExtraMinutes = Math.max(0, input.trafficExtraMinutes ?? 0);

  // Calculate return distance
  const returnDistanceKm = input.returnDistanceKm ?? distanceKm;

  // Calculate total distance based on trip type
  let totalDistanceKm: number;
  if (tripType === 'one_way') {
    totalDistanceKm = distanceKm;
  } else {
    // round_trip and empty_return both include the return leg
    totalDistanceKm = distanceKm + returnDistanceKm;
  }

  // Override with explicitly provided totalDistanceKm if given
  const effectiveTotalDistance = input.totalDistanceKm ?? totalDistanceKm;

  // ─── Cost Breakdown ───────────────────────────────────────────

  const fuelCost = (effectiveTotalDistance / consumptionKmPerLiter) * fuelPricePerLiter;
  const vehicleExtraCost = effectiveTotalDistance * vehicleExtraCostPerKm;

  let tollTotal = tollOutbound;
  if (tripType === 'round_trip' || tripType === 'empty_return') {
    tollTotal += tollReturnValue;
  }

  const totalCost = fuelCost + vehicleExtraCost + tollTotal + parkingCost + extraCosts;

  // ─── Fare Calculation ─────────────────────────────────────────

  // Chargeable distance: round trips charge both legs; empty return only charges outbound
  const chargeableDistanceKm = tripType === 'round_trip' ? effectiveTotalDistance : distanceKm;

  // Base km price: bandeirada + km * rate (no multiplier yet)
  const baseKmPrice = baseFare + chargeableDistanceKm * pricePerKm;

  // Manual waiting charge (e.g., agreed waiting at destination for round_trip)
  let timeCharge: number;
  if (waitingChargeType === 'per_hour') {
    timeCharge = (estimatedMinutes / 60) * waitingPrice;
  } else {
    timeCharge = estimatedMinutes * waitingPrice;
  }

  // Automatic traffic addition — only the EXTRA time due to traffic, capped at 20% of base price
  let rawTrafficAddition: number;
  if (waitingChargeType === 'per_hour') {
    rawTrafficAddition = (trafficExtraMinutes / 60) * waitingPrice;
  } else {
    rawTrafficAddition = trafficExtraMinutes * waitingPrice;
  }
  const maxTrafficAddition = baseKmPrice * 0.20;
  const trafficAddition = Math.min(rawTrafficAddition, maxTrafficAddition);
  const trafficCapped = rawTrafficAddition > 0 && rawTrafficAddition > maxTrafficAddition;

  // Fare price applies flagMultiplier to everything
  const farePrice = (baseKmPrice + timeCharge + trafficAddition) * flagMultiplier;

  // ─── Pricing Strategy ─────────────────────────────────────────

  const minimumPrice = totalCost + driverMinimumValue;

  const cappedMargin = Math.min(desiredMarginPercent, 80);
  const priceWithMargin = farePrice * (1 + cappedMargin / 100);

  const recommendedPrice = Math.max(farePrice, priceWithMargin, minimumPrice);

  const idealMarginPercent = Math.min(cappedMargin + 15, 80);
  const idealPriceByMargin = farePrice * (1 + idealMarginPercent / 100);
  const idealPrice = Math.max(idealPriceByMargin, recommendedPrice * 1.05);

  // ─── Outcome ─────────────────────────────────────────────────

  const roundedTotalCost = round2(totalCost);
  const roundedRecommendedPrice = round2(recommendedPrice);
  const roundedCustomChargedPrice = customChargedPrice !== undefined ? round2(customChargedPrice) : undefined;
  const effectivePrice = roundedCustomChargedPrice ?? roundedRecommendedPrice;
  const profit = calculateProfit(effectivePrice, roundedTotalCost);
  const margin = calculateMargin(profit, effectivePrice);

  // ─── Alerts ──────────────────────────────────────────────────

  const alerts: Alert[] = [];

  if (tripType === 'empty_return') {
    alerts.push({
      type: 'empty_return_enabled',
      message: 'Você está incluindo o custo da volta vazia. Certifique-se de que o cliente foi informado.',
      severity: 'info',
    });
  }

  if (effectiveTotalDistance > 20 && tollTotal === 0) {
    alerts.push({
      type: 'toll_missing',
      message: 'Corrida longa sem pedágio informado. Verifique se há pedágios na rota.',
      severity: 'warning',
    });
  }

  if (desiredMarginPercent > 60) {
    alerts.push({
      type: 'high_margin',
      message: `Margem de ${desiredMarginPercent}% pode tornar o preço não competitivo.`,
      severity: 'warning',
    });
  }

  if (trafficCapped) {
    alerts.push({
      type: 'traffic_capped',
      message: 'O adicional de trânsito foi limitado para não inflar demais o valor.',
      severity: 'info',
    });
  }

  if (profit < 0) {
    alerts.push({
      type: 'negative_profit',
      message: 'O preço cobrado está abaixo do custo total. Você terá prejuízo nessa corrida.',
      severity: 'error',
    });
  } else if (margin < 10 && profit >= 0) {
    alerts.push({
      type: 'low_profit',
      message: `Margem de lucro baixa (${margin.toFixed(1)}%). Considere aumentar o preço.`,
      severity: 'warning',
    });
  }

  if (customChargedPrice !== undefined && customChargedPrice < minimumPrice) {
    alerts.push({
      type: 'custom_price_below_minimum',
      message: `O valor que pretende cobrar (R$ ${customChargedPrice.toFixed(2)}) está abaixo do custo mínimo (R$ ${minimumPrice.toFixed(2)}).`,
      severity: 'error',
    });
  }

  if (distanceKm < 1) {
    alerts.push({
      type: 'check_route',
      message: 'Distância muito curta. Verifique se a rota está correta.',
      severity: 'warning',
    });
  }

  if (distanceKm > 200) {
    alerts.push({
      type: 'check_route',
      message: 'Distância muito longa. Verifique se a rota está correta.',
      severity: 'warning',
    });
  }

  return {
    distanceKm,
    returnDistanceKm,
    totalDistanceKm: effectiveTotalDistance,
    estimatedMinutes,
    tripType,

    fuelCost: round2(fuelCost),
    vehicleExtraCost: round2(vehicleExtraCost),
    tollTotal: round2(tollTotal),
    parkingCost: round2(parkingCost),
    extraCosts: round2(extraCosts),
    totalCost: roundedTotalCost,

    baseKmPrice: round2(baseKmPrice),
    timeCharge: round2(timeCharge),
    trafficAddition: round2(trafficAddition),
    trafficCapped,
    trafficExtraMinutes,
    farePrice: round2(farePrice),

    minimumPrice: round2(minimumPrice),
    priceWithMargin: round2(priceWithMargin),
    recommendedPrice: roundedRecommendedPrice,
    idealPrice: round2(idealPrice),
    customChargedPrice: roundedCustomChargedPrice,

    profit,
    margin,

    alerts,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calculateProfit(price: number, totalCost: number): number {
  return round2(price - totalCost);
}

export function calculateMargin(profit: number, price: number): number {
  return price > 0 ? round2((profit / price) * 100) : 0;
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
