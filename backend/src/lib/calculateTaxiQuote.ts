export type TripType = 'one_way' | 'round_trip' | 'empty_return';
export type WaitingChargeType = 'per_minute' | 'per_hour';

export interface QuoteInput {
  distanceKm: number;
  returnDistanceKm?: number;
  totalDistanceKm?: number;
  estimatedMinutes: number;
  tripType: TripType;

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
  | 'check_route';

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

  // Fare calculation
  timeCharge: number;
  farePrice: number;

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

  // Fuel cost
  const fuelCost = (effectiveTotalDistance / consumptionKmPerLiter) * fuelPricePerLiter;

  // Vehicle extra cost (depreciation, maintenance, etc.)
  const vehicleExtraCost = effectiveTotalDistance * vehicleExtraCostPerKm;

  // Toll total
  let tollTotal = tollOutbound;
  if (tripType === 'round_trip' || tripType === 'empty_return') {
    tollTotal += tollReturnValue;
  }

  // Total cost
  const totalCost = fuelCost + vehicleExtraCost + tollTotal + parkingCost + extraCosts;

  // ─── Fare Calculation ─────────────────────────────────────────

  // Time charge
  let timeCharge: number;
  if (waitingChargeType === 'per_hour') {
    timeCharge = (estimatedMinutes / 60) * waitingPrice;
  } else {
    // per_minute
    timeCharge = estimatedMinutes * waitingPrice;
  }

  // Fare price = (baseFare + distance * pricePerKm + time charge) * flagMultiplier
  const farePrice = (baseFare + distanceKm * pricePerKm + timeCharge) * flagMultiplier;

  // ─── Pricing Strategy ─────────────────────────────────────────

  // Minimum price covers all costs plus driver minimum value
  const minimumPrice = totalCost + driverMinimumValue;

  // Price with desired margin
  const cappedMargin = Math.min(desiredMarginPercent, 80);
  let priceWithMargin: number;
  if (cappedMargin >= 100) {
    priceWithMargin = minimumPrice;
  } else if (cappedMargin > 0) {
    priceWithMargin = totalCost / (1 - cappedMargin / 100);
  } else {
    priceWithMargin = totalCost;
  }

  // Recommended price is the maximum of fare, margin-based price, and minimum
  const recommendedPrice = Math.max(farePrice, priceWithMargin, minimumPrice);

  // Ideal price: same formula as recommended but with margin + 15pp (capped at 80%)
  const idealMarginPercent = Math.min(cappedMargin + 15, 80);
  const idealPriceByMargin = idealMarginPercent > 0
    ? totalCost / (1 - idealMarginPercent / 100)
    : totalCost;
  const idealPrice = Math.max(idealPriceByMargin, recommendedPrice * 1.05);

  // ─── Outcome ─────────────────────────────────────────────────

  const effectivePrice = customChargedPrice ?? recommendedPrice;
  const profit = effectivePrice - totalCost;
  const margin = effectivePrice > 0 ? (profit / effectivePrice) * 100 : 0;

  // ─── Alerts ──────────────────────────────────────────────────

  const alerts: Alert[] = [];

  // Empty return warning
  if (tripType === 'empty_return') {
    alerts.push({
      type: 'empty_return_enabled',
      message: 'Você está incluindo o custo da volta vazia. Certifique-se de que o cliente foi informado.',
      severity: 'info',
    });
  }

  // Toll missing - if distance > 20km and no toll set
  if (effectiveTotalDistance > 20 && tollTotal === 0) {
    alerts.push({
      type: 'toll_missing',
      message: 'Corrida longa sem pedágio informado. Verifique se há pedágios na rota.',
      severity: 'warning',
    });
  }

  // High margin warning
  if (desiredMarginPercent > 60) {
    alerts.push({
      type: 'high_margin',
      message: `Margem de ${desiredMarginPercent}% pode tornar o preço não competitivo.`,
      severity: 'warning',
    });
  }

  // Negative profit
  if (profit < 0) {
    alerts.push({
      type: 'negative_profit',
      message: 'O preço cobrado está abaixo do custo total. Você terá prejuízo nessa corrida.',
      severity: 'error',
    });
  } else if (margin < 10 && profit >= 0) {
    // Low profit
    alerts.push({
      type: 'low_profit',
      message: `Margem de lucro baixa (${margin.toFixed(1)}%). Considere aumentar o preço.`,
      severity: 'warning',
    });
  }

  // Custom price below minimum
  if (customChargedPrice !== undefined && customChargedPrice < minimumPrice) {
    alerts.push({
      type: 'custom_price_below_minimum',
      message: `O valor que pretende cobrar (R$ ${customChargedPrice.toFixed(2)}) está abaixo do custo mínimo (R$ ${minimumPrice.toFixed(2)}).`,
      severity: 'error',
    });
  }

  // Check route - if distance seems very short or very long
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
    totalCost: round2(totalCost),

    timeCharge: round2(timeCharge),
    farePrice: round2(farePrice),

    minimumPrice: round2(minimumPrice),
    priceWithMargin: round2(priceWithMargin),
    recommendedPrice: round2(recommendedPrice),
    idealPrice: round2(idealPrice),
    customChargedPrice: customChargedPrice !== undefined ? round2(customChargedPrice) : undefined,

    profit: round2(profit),
    margin: round2(margin),

    alerts,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
