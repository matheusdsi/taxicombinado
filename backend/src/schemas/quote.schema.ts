import { z } from 'zod';

export const tripTypeSchema = z.enum(['one_way', 'round_trip', 'empty_return']);
export const waitingChargeTypeSchema = z.enum(['per_minute', 'per_hour']);

export const calculateQuoteSchema = z.object({
  // Route
  originAddress: z.string().optional(),
  destinationAddress: z.string().optional(),
  tripType: tripTypeSchema.default('one_way'),
  routeMode: z.enum(['manual', 'automatic']).default('manual'),
  distanceKm: z.number().positive('Distância deve ser positiva'),
  returnDistanceKm: z.number().positive().optional(),
  totalDistanceKm: z.number().positive().optional(),
  estimatedMinutes: z.number().min(0).default(0),
  trafficExtraMinutes: z.number().min(0).default(0),

  // Stops
  stops: z.array(z.string()).optional(),

  // Vehicle
  consumptionKmPerLiter: z.number().positive('Consumo deve ser positivo'),
  fuelPricePerLiter: z.number().positive('Preço do combustível deve ser positivo'),
  fuelType: z.string().default('gasoline'),
  vehicleExtraCostPerKm: z.number().min(0).default(0),

  // Fare
  baseFare: z.number().min(0, 'Bandeirada não pode ser negativa'),
  pricePerKm: z.number().min(0, 'Tarifa por km não pode ser negativa'),
  waitingPrice: z.number().min(0, 'Tarifa de espera não pode ser negativa'),
  waitingChargeType: waitingChargeTypeSchema.default('per_minute'),
  flagMultiplier: z.number().min(1).max(3).default(1),

  // Extra costs
  tollOutbound: z.number().min(0).default(0),
  tollReturn: z.number().min(0).default(0),
  parkingCost: z.number().min(0).default(0),
  extraCosts: z.number().min(0).default(0),

  // Pricing strategy
  desiredMarginPercent: z.number().min(0).max(99).default(0),
  driverMinimumValue: z.number().min(0).default(0),
  customChargedPrice: z.number().positive().optional(),

  // Source tracking
  source: z.string().optional(),
});

export type CalculateQuoteInput = z.infer<typeof calculateQuoteSchema>;

export const quoteHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  page: z.coerce.number().int().min(1).default(1),
});

export const routeCalculateSchema = z.object({
  origin: z.string().min(3),
  destination: z.string().min(3),
  waypoints: z.array(z.string()).optional(),
  tripType: tripTypeSchema.default('one_way'),
});
