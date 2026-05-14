import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  calculateMargin,
  calculateProfit,
  calculateTaxiQuote,
  parseBrazilianCurrency,
  QuoteInput,
} from './calculateTaxiQuote';

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
