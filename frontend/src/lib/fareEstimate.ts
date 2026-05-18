const FARE = { baseFare: 6.55, pricePerKm: 4.8 };

// Bandeira 2: 22h–06h, sábado e domingo o dia todo
function getBandeira(date: string, time: string): 1 | 2 {
  const hour = parseInt(time.split(':')[0], 10);
  if (hour >= 22 || hour < 6) return 2;

  const d = new Date(date + 'T12:00:00');
  const dow = d.getDay(); // 0 = domingo, 6 = sábado
  if (dow === 0 || dow === 6) return 2;

  return 1;
}

export interface FareEstimate {
  min: number;
  max: number;
  bandeira: 1 | 2;
}

export function estimatePrice(
  distanceKm: number,
  date: string,
  time: string,
  largeVehicle = false,
): FareEstimate {
  const bandeira = getBandeira(date, time);
  const bandeiraMultiplier = bandeira === 2 ? 1.2 : 1;
  const largeMultiplier = largeVehicle ? 1.4 : 1;

  const base = (FARE.baseFare + FARE.pricePerKm * distanceKm) * bandeiraMultiplier * largeMultiplier;
  return {
    min: Math.round(base * 0.9),
    max: Math.round(base * 1.25),
    bandeira,
  };
}
