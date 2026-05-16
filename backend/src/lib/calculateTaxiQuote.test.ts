import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  calculateMargin,
  calculateProfit,
  calculateTaxiQuote,
  parseBrazilianCurrency,
  QuoteInput,
} from './calculateTaxiQuote';

// Base input: 50km, bandeira 1 (pricePerKm=5, flagMultiplier=1), no traffic
const baseInput: QuoteInput = {
  distanceKm: 50,
  estimatedMinutes: 0,
  tripType: 'one_way',
  consumptionKmPerLiter: 10,
  fuelPricePerLiter: 6,
  vehicleExtraCostPerKm: 0.5,
  baseFare: 0,
  pricePerKm: 5,
  waitingPrice: 0,
  waitingChargeType: 'per_minute',
  flagMultiplier: 1,
  tollOutbound: 0,
  tollReturn: 0,
  parkingCost: 0,
  extraCosts: 0,
  desiredMarginPercent: 0,
  driverMinimumValue: 0,
};

describe('parseBrazilianCurrency', () => {
  it('parses Brazilian and decimal currency formats into plain numbers', () => {
    assert.equal(parseBrazilianCurrency('R$ 1.234,56'), 1234.56);
    assert.equal(parseBrazilianCurrency('1234,56'), 1234.56);
    assert.equal(parseBrazilianCurrency('1234.56'), 1234.56);
  });
});

describe('quote financial calculation', () => {
  it('calculates price, cost, profit and margin from pure numbers', () => {
    const result = calculateTaxiQuote(baseInput);

    assert.equal(result.recommendedPrice, 250);
    assert.equal(result.totalCost, 55);
    assert.equal(result.profit, 195);
    assert.equal(result.margin, 78);
  });

  it('applies desired percentage as gain over the calculated taximeter fare', () => {
    const result = calculateTaxiQuote({
      ...baseInput,
      desiredMarginPercent: 20,
    });

    assert.equal(result.farePrice, 250);
    assert.equal(result.priceWithMargin, 300);
    assert.equal(result.recommendedPrice, 300);
    assert.equal(result.profit, 245);
  });

  it('uses the displayed rounded cost to calculate profit and margin', () => {
    const result = calculateTaxiQuote({
      ...baseInput,
      distanceKm: 10,
      consumptionKmPerLiter: 3,
      fuelPricePerLiter: 1,
      vehicleExtraCostPerKm: 0,
      baseFare: 0,
      pricePerKm: 1,
      customChargedPrice: 10,
    });

    assert.equal(result.totalCost, 3.33);
    assert.equal(result.profit, 6.67);
    assert.equal(result.margin, 66.7);
  });

  it('keeps displayed cost and profit consistent for a custom charged price', () => {
    const result = calculateTaxiQuote({
      ...baseInput,
      customChargedPrice: 499.7,
      tollOutbound: 15.15,
    });

    assert.equal(result.totalCost, 70.15);
    assert.equal(result.profit, 429.55);
    assert.equal(result.margin, 85.96);
  });

  it('fixes the BRL string parsing failure that produced huge profit', () => {
    const price = parseBrazilianCurrency('R$ 283,71');
    const cost = parseBrazilianCurrency('R$ 39,52');
    const profit = calculateProfit(price, cost);
    const margin = calculateMargin(profit, price);

    assert.equal(profit, 244.19);
    assert.equal(margin, 86.07);
  });

  it('calculates one-way quotes using only outbound distance as cost distance', () => {
    const result = calculateTaxiQuote(baseInput);

    assert.equal(result.tripType, 'one_way');
    assert.equal(result.totalDistanceKm, 50);
    assert.equal(result.fuelCost, 30);
    assert.equal(result.vehicleExtraCost, 25);
  });

  it('calculates round-trip quotes with outbound and return distance charged and costed', () => {
    const result = calculateTaxiQuote({
      ...baseInput,
      tripType: 'round_trip',
      returnDistanceKm: 40,
    });

    assert.equal(result.totalDistanceKm, 90);
    assert.equal(result.farePrice, 450);
    assert.equal(result.totalCost, 99);
    assert.equal(result.profit, 351);
  });

  it('calculates empty-return quotes with return distance costed but not charged as fare distance', () => {
    const result = calculateTaxiQuote({
      ...baseInput,
      tripType: 'empty_return',
      returnDistanceKm: 40,
    });

    assert.equal(result.totalDistanceKm, 90);
    assert.equal(result.farePrice, 250);
    assert.equal(result.totalCost, 99);
    assert.equal(result.profit, 151);
  });
});

describe('taximeter São Paulo fare calculation', () => {
  const spComumInput: QuoteInput = {
    distanceKm: 33,
    estimatedMinutes: 0,
    tripType: 'one_way',
    consumptionKmPerLiter: 11,
    fuelPricePerLiter: 6.29,
    vehicleExtraCostPerKm: 0,
    baseFare: 6.55,
    pricePerKm: 4.8,      // bandeira 1
    waitingPrice: 55.5,
    waitingChargeType: 'per_hour',
    flagMultiplier: 1.0,  // always 1.0 — pricePerKm encodes the rate
    tollOutbound: 0,
    tollReturn: 0,
    parkingCost: 0,
    extraCosts: 0,
    desiredMarginPercent: 0,
    driverMinimumValue: 0,
  };

  it('bandeira 1: 33km without traffic should give correct base price', () => {
    const result = calculateTaxiQuote(spComumInput);
    // baseKmPrice = 6.55 + 33 * 4.80 = 6.55 + 158.40 = 164.95
    assert.equal(result.baseKmPrice, 164.95);
    assert.equal(result.trafficAddition, 0);
    assert.equal(result.trafficCapped, false);
    assert.equal(result.farePrice, 164.95);
    assert.equal(result.timeCharge, 0);
  });

  it('bandeira 2: 33km without traffic should give R$212.47', () => {
    const result = calculateTaxiQuote({
      ...spComumInput,
      pricePerKm: 6.24,  // bandeira 2 rate (4.80 * 1.3)
    });
    // baseKmPrice = 6.55 + 33 * 6.24 = 6.55 + 205.92 = 212.47
    assert.equal(result.baseKmPrice, 212.47);
    assert.equal(result.farePrice, 212.47);
    assert.equal(result.trafficAddition, 0);
  });

  it('bandeira 2: 33km with 15min extra traffic adds R$13.88, total R$226.35', () => {
    const result = calculateTaxiQuote({
      ...spComumInput,
      pricePerKm: 6.24,
      trafficExtraMinutes: 15,
    });
    // baseKmPrice = 212.47
    // rawTraffic = (15/60) * 55.5 = 0.25 * 55.5 = 13.875 ≈ 13.88
    // cap = 212.47 * 0.20 = 42.494
    // trafficAddition = min(13.875, 42.494) = 13.875 → round2 = 13.88
    assert.equal(result.baseKmPrice, 212.47);
    assert.equal(result.trafficAddition, 13.88);
    assert.equal(result.trafficCapped, false);
    assert.equal(result.farePrice, 226.35);
  });

  it('traffic is capped at 20% of base km price when extra is very high', () => {
    const result = calculateTaxiQuote({
      ...spComumInput,
      pricePerKm: 6.24,
      trafficExtraMinutes: 120, // 2 hours of extra traffic — unrealistic but tests cap
    });
    // baseKmPrice = 212.47
    // rawTraffic = (120/60) * 55.5 = 2 * 55.5 = 111
    // cap = 212.47 * 0.20 = 42.494
    // trafficAddition = min(111, 42.494) = 42.49 (rounded)
    assert.equal(result.trafficCapped, true);
    assert.equal(result.trafficAddition, 42.49);
    // farePrice = 212.47 + 42.49 = 254.96
    assert.equal(result.farePrice, 254.96);
    // alert should include traffic_capped
    assert.ok(result.alerts.some((a) => a.type === 'traffic_capped'));
  });

  it('manual waiting (round_trip) is separate from traffic and not capped', () => {
    const result = calculateTaxiQuote({
      ...spComumInput,
      tripType: 'round_trip',
      estimatedMinutes: 60,   // 1h agreed waiting
      trafficExtraMinutes: 0, // no extra traffic
      pricePerKm: 6.24,
      returnDistanceKm: 33,
    });
    // chargeableDistance = 66km for round_trip
    // baseKmPrice = 6.55 + 66 * 6.24 = 6.55 + 411.84 = 418.39
    assert.equal(result.baseKmPrice, 418.39);
    // timeCharge = (60/60) * 55.5 = 55.5
    assert.equal(result.timeCharge, 55.5);
    assert.equal(result.trafficAddition, 0);
    // farePrice = 418.39 + 55.5 = 473.89
    assert.equal(result.farePrice, 473.89);
  });

  it('only extra traffic is charged, not total trip duration', () => {
    // Simulates a trip where Google returns 60min total but 45min is "normal"
    // trafficExtraMinutes = 60 - 45 = 15
    const result = calculateTaxiQuote({
      ...spComumInput,
      pricePerKm: 6.24,
      trafficExtraMinutes: 15,
      estimatedMinutes: 0, // no manual waiting
    });
    // Only 15 extra minutes are charged, not the full 60
    assert.equal(result.trafficExtraMinutes, 15);
    assert.ok(result.trafficAddition > 0);
    // timeCharge = 0 (no manual wait)
    assert.equal(result.timeCharge, 0);
  });

  it('extra manual costs appear separately in result', () => {
    const result = calculateTaxiQuote({
      ...spComumInput,
      pricePerKm: 6.24,
      extraCosts: 20,
      tollOutbound: 10,
    });
    assert.equal(result.extraCosts, 20);
    assert.equal(result.tollTotal, 10);
    // farePrice should not include extraCosts or tollTotal (those are costs, not fare)
    assert.equal(result.farePrice, result.baseKmPrice);
  });

  it('flagMultiplier=1.0 does not inflate bandeira 2 price', () => {
    // Before the fix, flagMultiplier=1.3 was applied on top of pricePerKm=6.24
    // This would give (6.55 + 33*6.24) * 1.3 = 276.21 — wrong
    // Now flagMultiplier should always be 1.0 and pricePerKm encodes the rate
    const result = calculateTaxiQuote({
      ...spComumInput,
      pricePerKm: 6.24,
      flagMultiplier: 1.0,
    });
    assert.equal(result.farePrice, 212.47); // correct Bandeira 2 price

    // Sanity check: if someone (mistakenly) passes flagMultiplier=1.3 with the multiplied rate
    const wrongResult = calculateTaxiQuote({
      ...spComumInput,
      pricePerKm: 6.24,
      flagMultiplier: 1.3,
    });
    // Would be (212.47) * 1.3 = 276.21 — user should NOT do this
    assert.ok(wrongResult.farePrice > result.farePrice);
  });
});
