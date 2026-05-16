'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { NumberInput } from '@/components/ui/NumberInput';
import { LoadingButton } from '@/components/ui/LoadingButton';
import { AddressInput } from '@/components/ui/AddressInput';
import { calculateQuote, calculateRoute, QuoteResult, RouteStep } from '@/lib/api';
import { trackEvent } from '@/lib/analytics';

const PRESETS = {
  comum: { baseFare: 6.55, pricePerKm: 4.8, waitingPrice: 55.5, waitingChargeType: 'per_hour' as const },
  luxo: { baseFare: 9.83, pricePerKm: 7.2, waitingPrice: 83.25, waitingChargeType: 'per_hour' as const },
};

const TRIP_TYPE_EXPLANATIONS = [
  {
    value: 'one_way',
    title: 'Só ida',
    text: 'Considera apenas o trajeto de ida. Cobra km, tempo, pedágio de ida e os custos informados.',
  },
  {
    value: 'round_trip',
    title: 'Ida e volta',
    text: 'Considera ida + volta como corrida cobrada. Soma os dois trajetos no km, tempo e pedágios.',
  },
  {
    value: 'empty_return',
    title: 'Volta vazia',
    text: 'O passageiro paga só a ida, mas a volta entra nos seus custos para você não voltar no prejuízo.',
  },
] as const;

const schema = z.object({
  originAddress: z.string().optional(),
  destinationAddress: z.string().optional(),
  tripType: z.enum(['one_way', 'round_trip', 'empty_return']),
  routeMode: z.enum(['manual', 'automatic']),
  distanceKm: z.number({ invalid_type_error: 'Informe a distância' }).positive('Deve ser positivo'),
  returnDistanceKm: z.number().min(0).optional(),
  consumptionKmPerLiter: z.number().positive('Informe o consumo'),
  fuelPricePerLiter: z.number().positive('Informe o preço'),
  fuelType: z.string(),
  vehicleExtraCostPerKm: z.number().min(0),
  baseFare: z.number().min(0),
  pricePerKm: z.number().min(0),
  hasWaiting: z.boolean(),
  waitingHours: z.number().min(0).max(24),
  waitingPrice: z.number().min(0),
  waitingChargeType: z.enum(['per_minute', 'per_hour']),
  flagMultiplier: z.number().min(1).max(3),
  tollOutbound: z.number().min(0),
  tollReturn: z.number().min(0),
  parkingCost: z.number().min(0),
  extraCosts: z.number().min(0),
  desiredMarginPercent: z.number().min(0).max(80),
  customChargedPrice: z.number().min(0).optional(),
}).superRefine((data, ctx) => {
  if (data.tripType === 'round_trip' && data.hasWaiting && data.waitingHours <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Informe quantas horas de espera',
      path: ['waitingHours'],
    });
  }
});

type FormValues = z.infer<typeof schema>;

interface TaxiQuoteFormProps {
  onResult: (result: QuoteResult, quoteId: string, formValues: FormValues, steps: RouteStep[], stops: string[]) => void;
}

// ─── Segmented control ───────────────────────────────────────

function Seg({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="tc-seg">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={`tc-seg-btn${value === o.value ? ' active' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── Field wrapper ────────────────────────────────────────────

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-500)', letterSpacing: '0.01em' }}>
        {label}
      </label>
      {children}
      {hint && <span style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 500 }}>{hint}</span>}
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="tc-card" style={{ marginBottom: 12 }}>
      <div className="tc-section-title">{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {children}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────

export function TaxiQuoteForm({ onResult }: TaxiQuoteFormProps) {
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<'comum' | 'luxo'>('comum');
  const [activeBandeira, setActiveBandeira] = useState<1.0 | 1.3>(1.0);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMinutes: number; baseDurationMinutes: number | null; provider: string; steps: RouteStep[] } | null>(null);
  const [routeManualFallback, setRouteManualFallback] = useState(false);
  const [points, setPoints] = useState<string[]>(['', '']);
  const routeDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formStartedRef = useRef(false);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      tripType: 'one_way',
      routeMode: 'manual',
      distanceKm: 0,
      returnDistanceKm: 0,
      consumptionKmPerLiter: 11,
      fuelPricePerLiter: 6.29,
      fuelType: 'gasoline',
      vehicleExtraCostPerKm: 0,
      baseFare: PRESETS.comum.baseFare,
      pricePerKm: PRESETS.comum.pricePerKm,
      hasWaiting: false,
      waitingHours: 0,
      waitingPrice: Number(PRESETS.comum.waitingPrice.toFixed(4)),
      waitingChargeType: PRESETS.comum.waitingChargeType,
      flagMultiplier: 1.0,
      tollOutbound: 0,
      tollReturn: 0,
      parkingCost: 0,
      extraCosts: 0,
      desiredMarginPercent: 0,
      customChargedPrice: undefined,
    },
  });

  const tripType = watch('tripType');
  const returnDistanceKm = watch('returnDistanceKm');
  const fuelType = watch('fuelType');
  const desiredMarginPercent = watch('desiredMarginPercent');
  const flagMultiplier = watch('flagMultiplier');
  const hasWaiting = watch('hasWaiting');
  const isElectric = fuelType === 'electric';
  const routeTotalDistanceKm = routeInfo
    ? tripType === 'one_way'
      ? routeInfo.distanceKm
      : routeInfo.distanceKm + (returnDistanceKm || routeInfo.distanceKm)
    : 0;
  const routeTotalMinutes = routeInfo
    ? tripType === 'round_trip'
      ? routeInfo.durationMinutes * 2
      : routeInfo.durationMinutes
    : 0;

  useEffect(() => {
    const subscription = watch((_value, { name }) => {
      if (!name || formStartedRef.current) return;

      formStartedRef.current = true;
      trackEvent('quote_form_started', {
        first_field: name,
      });
    });

    return () => subscription.unsubscribe();
  }, [watch]);

  useEffect(() => {
    if (tripType !== 'round_trip') {
      setValue('hasWaiting', false);
      setValue('waitingHours', 0, { shouldValidate: true });
    }
  }, [tripType, setValue]);

  useEffect(() => {
    if (!hasWaiting) {
      setValue('waitingHours', 0, { shouldValidate: true });
    }
  }, [hasWaiting, setValue]);

  const applyPreset = useCallback(
    (preset: 'comum' | 'luxo') => {
      const p = PRESETS[preset];
      setValue('baseFare', p.baseFare, { shouldValidate: true });
      const kmRate = activeBandeira === 1.3 ? Number((p.pricePerKm * 1.3).toFixed(4)) : p.pricePerKm;
      setValue('pricePerKm', kmRate, { shouldValidate: true });
      setValue('waitingPrice', Number(p.waitingPrice.toFixed(4)), { shouldValidate: true });
      setValue('waitingChargeType', p.waitingChargeType);
      setActivePreset(preset);
    },
    [setValue, activeBandeira]
  );

  const fetchRoute = useCallback((origin: string, destination: string, wps: string[] = []) => {
    if (routeDebounce.current) clearTimeout(routeDebounce.current);
    setRouteInfo(null);
    setRouteManualFallback(false);
    if (origin.length < 4 || destination.length < 4) return;
    const filledWaypoints = wps.filter((w) => w.length >= 4);
    routeDebounce.current = setTimeout(async () => {
      setRouteLoading(true);
      try {
        const result = await calculateRoute(origin, destination, filledWaypoints.length ? filledWaypoints : undefined);
        if (result.distanceKm !== null && result.durationMinutes !== null) {
          setRouteInfo({ distanceKm: result.distanceKm, durationMinutes: result.durationMinutes, baseDurationMinutes: result.baseDurationMinutes ?? null, provider: result.provider, steps: result.steps ?? [] });
          setValue('distanceKm', result.distanceKm, { shouldValidate: true });
          setValue('returnDistanceKm', result.distanceKm, { shouldValidate: true });
          setValue('routeMode', 'automatic');
        } else {
          // provider is 'manual' — no API keys configured
          setRouteManualFallback(true);
        }
      } catch {
        setRouteManualFallback(true);
      } finally {
        setRouteLoading(false);
      }
    }, 800);
  }, [setValue]);

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    setApiError(null);
    // Manual waiting: only when user explicitly marks round_trip waiting
    const estimatedWaitingMinutes = data.tripType === 'round_trip' && data.hasWaiting
      ? Math.round(data.waitingHours * 60)
      : 0;
    // Traffic extra: difference between Google's duration_in_traffic and base duration
    const trafficExtraMinutes = routeInfo?.baseDurationMinutes != null
      ? Math.max(0, Math.round(routeInfo.durationMinutes - routeInfo.baseDurationMinutes))
      : 0;
    trackEvent('quote_calculate_attempt', {
      trip_type: data.tripType,
      route_mode: data.routeMode,
      distance_km: data.distanceKm,
      return_distance_km: data.returnDistanceKm ?? 0,
      estimated_waiting_minutes: estimatedWaitingMinutes,
      has_origin: Boolean(data.originAddress),
      has_destination: Boolean(data.destinationAddress),
    });

    try {
      const response = await calculateQuote({
        ...data,
        estimatedMinutes: estimatedWaitingMinutes,
        trafficExtraMinutes,
        vehicleExtraCostPerKm: 0,
        driverMinimumValue: 0,
        totalDistanceKm: undefined,
        stops: points.slice(1, -1).filter((w) => w.trim()),
        tollOutbound: data.tollOutbound ?? 0,
        tollReturn: data.tollReturn ?? 0,
        parkingCost: data.parkingCost ?? 0,
        extraCosts: data.extraCosts ?? 0,
        desiredMarginPercent: data.desiredMarginPercent ?? 0,
        customChargedPrice: data.customChargedPrice && data.customChargedPrice > 0 ? data.customChargedPrice : undefined,
      });
      trackEvent('quote_calculated', {
        quote_id: response.quoteId,
        trip_type: response.result.tripType,
        route_mode: data.routeMode,
        distance_km: response.result.distanceKm,
        total_distance_km: response.result.totalDistanceKm,
        recommended_price: response.result.recommendedPrice,
        total_cost: response.result.totalCost,
        margin: response.result.margin,
      });
      onResult(response.result, response.quoteId, data, routeInfo?.steps ?? [], points.slice(1, -1).filter((w) => w.trim()));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      trackEvent('quote_calculate_error', {
        trip_type: data.tripType,
        route_mode: data.routeMode,
      });
      setApiError(error?.response?.data?.error || 'Erro ao calcular. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>

      {/* ─── Hero dark ─── */}
      <div className="tc-hero-dark" style={{ marginBottom: 20 }}>
        <div style={{ position: 'absolute', right: -30, top: -30, width: 140, height: 140, borderRadius: '50%', background: 'var(--yellow)', opacity: 0.15 }} />
        <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2, maxWidth: 270 }}>
          Calcule quanto cobrar{' '}
          <span style={{ color: 'var(--yellow)' }}>sem sair no prejuízo.</span>
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', marginTop: 8 }}>
          Digite os dados da corrida combinada — você receberá valores estimados.
        </div>
      </div>

      {/* ─── Rota ─── */}
      <Section title="Rota">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, position: 'relative' }}>
          {points.map((pt, i) => {
            const isFirst = i === 0;
            const isLast = i === points.length - 1;
            const pinClass = isFirst ? 'pin-a' : isLast ? 'pin-b' : 'pin-stop';
            const pinLabel = isFirst ? 'A' : isLast ? 'B' : String(i);
            const fieldLabel = isFirst ? 'Origem' : isLast ? 'Destino' : `Parada ${i}`;
            const placeholder = isFirst ? 'De onde sai' : isLast ? 'Para onde vai' : `Parada ${i}`;

            return (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <Field label={fieldLabel}>
                    <AddressInput
                      label=""
                      value={pt}
                      onChange={(v) => {
                        const next = [...points];
                        next[i] = v;
                        setPoints(next);
                        if (isFirst) setValue('originAddress', v);
                        if (isLast) setValue('destinationAddress', v);
                        fetchRoute(
                          isFirst ? v : next[0],
                          isLast ? v : next[next.length - 1],
                          next.slice(1, -1),
                        );
                      }}
                      placeholder={placeholder}
                      prefix={<span className={pinClass}>{pinLabel}</span>}
                    />
                  </Field>
                </div>
                {!isFirst && !isLast && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = points.filter((_, j) => j !== i);
                      setPoints(next);
                      fetchRoute(next[0], next[next.length - 1], next.slice(1, -1));
                    }}
                    style={{
                      width: 36, height: 44, borderRadius: 10, border: '1.5px solid var(--gray-200)',
                      background: 'var(--surface)', color: 'var(--gray-500)', fontSize: 18, fontWeight: 700,
                      cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, display: 'grid', placeItems: 'center',
                    }}
                    aria-label="Remover parada"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}

          {points.length < 7 && (
            <button
              type="button"
              onClick={() => setPoints([...points.slice(0, -1), '', points[points.length - 1]])}
              style={{
                alignSelf: 'flex-start', padding: '6px 12px', borderRadius: 10,
                border: '1.5px dashed var(--gray-300)', background: 'transparent',
                color: 'var(--gray-500)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit', letterSpacing: '0.01em',
              }}
            >
              + Adicionar parada
            </button>
          )}
        </div>

        <Controller name="tripType" control={control} render={({ field }) => (
          <Field label="Tipo de corrida">
            <Seg value={field.value} onChange={field.onChange} options={[
              { value: 'one_way', label: 'Só ida' },
              { value: 'round_trip', label: 'Ida e volta' },
              { value: 'empty_return', label: 'Volta vazia' },
            ]} />
            <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 12, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Como o cálculo considera
              </div>
              {TRIP_TYPE_EXPLANATIONS.map((item) => {
                const active = field.value === item.value;
                return (
                  <div key={item.value} style={{ display: 'grid', gridTemplateColumns: '82px 1fr', gap: 8, alignItems: 'start' }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: active ? 'var(--ink)' : 'var(--gray-500)' }}>
                      {item.title}
                    </span>
                    <span style={{ fontSize: 12, lineHeight: 1.35, color: active ? 'var(--ink)' : 'var(--gray-500)', fontWeight: active ? 700 : 500 }}>
                      {item.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </Field>
        )} />

        {/* Distância — automática ou manual */}
        {routeLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--gray-50)', borderRadius: 12, border: '1px solid var(--gray-200)' }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', border: '3px solid var(--gray-200)', borderTopColor: 'var(--ink)', animation: 'spin 0.9s linear infinite', flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-500)' }}>Calculando distância...</span>
          </div>
        )}

        {!routeLoading && routeInfo && (
          <div style={{ background: 'var(--green-soft)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M5 12l5 5L20 7" /></svg>
              <div>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#14532D' }}>{routeTotalDistanceKm.toFixed(1)} km</span>
                <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}> · {Math.round(routeTotalMinutes)} min estimados</span>
                {points.slice(1, -1).filter((w) => w.trim()).length > 0 && (
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--green)', fontWeight: 600, marginTop: 2 }}>
                    Via: {points.slice(1, -1).filter((w) => w.trim()).join(' · ')}
                  </span>
                )}
                {tripType !== 'one_way' && (
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--green)', fontWeight: 600, marginTop: 2 }}>
                    Ida {routeInfo.distanceKm.toFixed(1)} km + volta {(returnDistanceKm || routeInfo.distanceKm).toFixed(1)} km
                  </span>
                )}
              </div>
            </div>
            <button type="button" onClick={() => setRouteInfo(null)}
              style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', background: 'transparent', border: 0, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', flexShrink: 0 }}>
              Editar
            </button>
          </div>
        )}

        {!routeLoading && !routeInfo && routeManualFallback && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ background: 'var(--orange-soft)', color: '#7C2D12', borderRadius: 12, padding: '10px 12px', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 1, flexShrink: 0 }}><path d="M12 4l9 16H3L12 4Z" /><path d="M12 10v4M12 17h.01" /></svg>
              Cálculo automático indisponível. Informe a distância manualmente.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: tripType !== 'one_way' ? '1fr 1fr' : '1fr', gap: 10 }}>
              <Controller name="distanceKm" control={control} render={({ field }) => (
                <NumberInput label="Ida (km)" value={field.value} onChange={field.onChange}
                  suffix="km" step={0.5} min={0} required error={errors.distanceKm?.message} />
              )} />
              {tripType !== 'one_way' && (
                <Controller name="returnDistanceKm" control={control} render={({ field }) => (
                  <NumberInput label="Volta (km)" value={field.value ?? 0} onChange={field.onChange}
                    suffix="km" step={0.5} min={0} />
                )} />
              )}
            </div>
          </div>
        )}
      </Section>

      {/* ─── Custos da corrida ─── */}
      <Section title="Custos da corrida">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Controller name="tollOutbound" control={control} render={({ field }) => (
            <MoneyInput label="Pedágio ida" value={field.value} onChange={field.onChange} />
          )} />
          <Controller name="tollReturn" control={control} render={({ field }) => (
            <MoneyInput label="Pedágio volta" value={field.value} onChange={field.onChange} />
          )} />
          <Controller name="parkingCost" control={control} render={({ field }) => (
            <MoneyInput label="Estacionamento" value={field.value} onChange={field.onChange} />
          )} />
          <Controller name="extraCosts" control={control} render={({ field }) => (
            <MoneyInput label="Outros custos" value={field.value} onChange={field.onChange} />
          )} />
        </div>
      </Section>

      {/* ─── Dados do carro ─── */}
      <Section title="Dados do carro">
        <Controller name="fuelType" control={control} render={({ field }) => (
          <Field label="Combustível">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Seg value={field.value} onChange={field.onChange} options={[
                { value: 'gasoline', label: 'Gasolina' },
                { value: 'ethanol', label: 'Etanol' },
                { value: 'gnv', label: 'GNV' },
              ]} />
              <Seg value={field.value} onChange={field.onChange} options={[
                { value: 'diesel', label: 'Diesel' },
                { value: 'electric', label: 'Elétrico' },
              ]} />
            </div>
          </Field>
        )} />

        {isElectric && (
          <div style={{ background: 'var(--blue-soft)', color: '#1E3A8A', borderRadius: 12, padding: '10px 12px', fontSize: 13, fontWeight: 600 }}>
            Veículo elétrico: informe custo por kWh como preço e 1 como consumo.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Controller name="consumptionKmPerLiter" control={control} render={({ field }) => (
            <NumberInput label="Consumo" value={field.value} onChange={field.onChange}
              suffix="km/l" step={0.5} min={1} required error={errors.consumptionKmPerLiter?.message} />
          )} />
          <Controller name="fuelPricePerLiter" control={control} render={({ field }) => (
            <MoneyInput label="Preço/litro" value={field.value} onChange={field.onChange} />
          )} />
        </div>
      </Section>

      {/* ─── Tarifa e ganho ─── */}
      <Section title="Tarifa e ganho">
        {/* Presets SP */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-500)', marginBottom: 8 }}>Tabela oficial SP:</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {(['comum', 'luxo'] as const).map((preset) => (
              <button key={preset} type="button" onClick={() => applyPreset(preset)}
                style={{
                  padding: '10px 12px', borderRadius: 12, border: '1.5px solid',
                  borderColor: activePreset === preset ? 'var(--ink)' : 'var(--gray-200)',
                  background: activePreset === preset ? 'var(--ink)' : 'var(--surface)',
                  color: activePreset === preset ? '#fff' : 'var(--gray-700)',
                  fontFamily: 'inherit', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  transition: 'all 0.12s',
                }}>
                {preset === 'comum' ? 'Comum' : 'Luxo'}
              </button>
            ))}
          </div>
        </div>

        {/* Bandeira 1 / Bandeira 2 */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-500)', marginBottom: 8 }}>Bandeira:</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {([
              { value: 1.0 as const, label: 'Bandeira 1', sub: 'Dias úteis · 6h–20h' },
              { value: 1.3 as const, label: 'Bandeira 2', sub: 'Noite · dom. e feriados' },
            ]).map((opt) => {
              const isActive = activeBandeira === opt.value;
              return (
                <button key={opt.value} type="button"
                  onClick={() => {
                    // flagMultiplier stays 1.0 — pricePerKm already encodes the bandeira rate
                    setValue('flagMultiplier', 1.0);
                    setActiveBandeira(opt.value);
                    const p = PRESETS[activePreset];
                    const kmRate = opt.value === 1.3 ? Number((p.pricePerKm * 1.3).toFixed(4)) : p.pricePerKm;
                    setValue('pricePerKm', kmRate, { shouldValidate: true });
                  }}
                  style={{
                    padding: '10px 12px', borderRadius: 12, border: '1.5px solid', textAlign: 'left',
                    borderColor: isActive ? 'var(--ink)' : 'var(--gray-200)',
                    background: isActive ? 'var(--ink)' : 'var(--surface)',
                    color: isActive ? '#fff' : 'var(--gray-700)',
                    fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.12s',
                  }}>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>{opt.label}</div>
                  <div style={{ fontSize: 11, marginTop: 2, color: isActive ? 'rgba(255,255,255,.6)' : 'var(--gray-400)', fontWeight: 600 }}>{opt.sub}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Controller name="baseFare" control={control} render={({ field }) => (
            <MoneyInput label="Bandeirada" value={field.value} onChange={field.onChange} />
          )} />
          <Controller name="pricePerKm" control={control} render={({ field }) => (
            <MoneyInput label="Valor por km" value={field.value} onChange={field.onChange} />
          )} />
          <Controller name="desiredMarginPercent" control={control} render={({ field }) => (
            <NumberInput label="Ganho acima do taxímetro" value={field.value} onChange={field.onChange} suffix="%" step={5} min={0} max={80} />
          )} />
        </div>

        <div style={{ background: 'var(--blue-soft)', color: '#1E3A8A', borderRadius: 12, padding: '10px 12px', fontSize: 12, fontWeight: 700, lineHeight: 1.35 }}>
          Esse percentual entra depois do valor do taxímetro. Ex.: taxímetro de R$ 100 + 20% = R$ 120, sempre respeitando seus custos mínimos.
        </div>

        {tripType === 'round_trip' && (
          <div style={{ border: '1px solid var(--gray-200)', borderRadius: 12, padding: 12, background: 'var(--gray-50)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Controller name="hasWaiting" control={control} render={({ field }) => (
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: 'var(--ink)', flexShrink: 0 }}
                />
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>Vai precisar esperar?</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-500)' }}>A espera entra no valor apenas quando esta opção estiver marcada.</span>
                </span>
              </label>
            )} />

            {hasWaiting && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Controller name="waitingHours" control={control} render={({ field }) => (
                  <NumberInput
                    label="Tempo de espera"
                    value={field.value}
                    onChange={field.onChange}
                    suffix="h"
                    step={0.5}
                    min={0}
                    max={24}
                    required
                    error={errors.waitingHours?.message}
                  />
                )} />
                <Controller name="waitingPrice" control={control} render={({ field }) => (
                  <MoneyInput label="Valor da espera/hora" value={field.value} onChange={field.onChange} />
                )} />
              </div>
            )}
          </div>
        )}

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', marginBottom: 4 }}>
            <span>0%</span><span>20%</span><span>40%</span><span>60%</span><span>80%</span>
          </div>
          <input type="range" min={0} max={80} step={5}
            value={desiredMarginPercent}
            onChange={(e) => setValue('desiredMarginPercent', Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <Controller name="customChargedPrice" control={control} render={({ field }) => (
          <MoneyInput
            label="Valor que pretende cobrar (opcional)"
            value={field.value ?? 0}
            onChange={(v) => field.onChange(v || undefined)}
            hint="Comparamos com nossa recomendação"
          />
        )} />
      </Section>

      {apiError && (
        <div style={{ background: 'var(--red-soft)', color: '#7F1D1D', borderRadius: 14, padding: '12px 14px', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
          {apiError}
        </div>
      )}

      <div style={{ paddingBottom: 8 }}>
        <LoadingButton type="submit" loading={loading} size="lg" fullWidth>
          Calcular corrida →
        </LoadingButton>
      </div>
    </form>
  );
}
