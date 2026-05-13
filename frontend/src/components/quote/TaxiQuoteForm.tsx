'use client';

import { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { NumberInput } from '@/components/ui/NumberInput';
import { ToggleGroup } from '@/components/ui/ToggleGroup';
import { LoadingButton } from '@/components/ui/LoadingButton';
import { AddressInput } from '@/components/ui/AddressInput';
import { calculateQuote, QuoteResult } from '@/lib/api';

// ─── Presets de tarifa SP ─────────────────────────────────────

const PRESETS = {
  comum: { baseFare: 6.55, pricePerKm: 4.8, waitingPrice: 55.5 / 60, waitingChargeType: 'per_minute' as const },
  luxo:  { baseFare: 9.83, pricePerKm: 7.2, waitingPrice: 83.25 / 60, waitingChargeType: 'per_minute' as const },
};

// ─── Schema ───────────────────────────────────────────────────

const schema = z.object({
  originAddress:      z.string().optional(),
  destinationAddress: z.string().optional(),
  tripType:           z.enum(['one_way', 'round_trip', 'empty_return']),
  routeMode:          z.enum(['manual', 'automatic']),
  distanceKm:         z.number({ invalid_type_error: 'Informe a distância' }).positive('Deve ser positivo'),
  returnDistanceKm:   z.number().min(0).optional(),
  consumptionKmPerLiter: z.number().positive('Informe o consumo'),
  fuelPricePerLiter:     z.number().positive('Informe o preço'),
  fuelType:              z.string(),
  baseFare:              z.number().min(0),
  pricePerKm:            z.number().min(0),
  waitingPrice:          z.number().min(0),
  waitingChargeType:     z.enum(['per_minute', 'per_hour']),
  flagMultiplier:        z.number().min(1).max(3),
  tollOutbound:          z.number().min(0),
  tollReturn:            z.number().min(0),
  parkingCost:           z.number().min(0),
  extraCosts:            z.number().min(0),
  desiredMarginPercent:  z.number().min(0).max(80),
  customChargedPrice:    z.number().min(0).optional(),
});

type FormValues = z.infer<typeof schema>;

interface TaxiQuoteFormProps {
  onResult: (result: QuoteResult, quoteId: string, formValues: FormValues) => void;
}

// ─── Section wrapper ──────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-4 mb-3">
      <h2 className="font-bold text-gray-800 text-base mb-3 flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        {title}
      </h2>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────

export function TaxiQuoteForm({ onResult }: TaxiQuoteFormProps) {
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<'comum' | 'luxo'>('comum');

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      tripType:             'one_way',
      routeMode:            'manual',
      distanceKm:           0,
      returnDistanceKm:     0,
      consumptionKmPerLiter: 10,
      fuelPricePerLiter:    6.0,
      fuelType:             'gasoline',
      baseFare:             6.55,
      pricePerKm:           4.8,
      waitingPrice:         Number((55.5 / 60).toFixed(4)),
      waitingChargeType:    'per_minute',
      flagMultiplier:       1.0,
      tollOutbound:         0,
      tollReturn:           0,
      parkingCost:          0,
      extraCosts:           0,
      desiredMarginPercent: 20,
      customChargedPrice:   undefined,
    },
  });

  const tripType = watch('tripType');
  const fuelType = watch('fuelType');
  const flagMultiplier = watch('flagMultiplier');
  const isElectric = fuelType === 'electric';

  const applyPreset = useCallback(
    (preset: 'comum' | 'luxo', currentFlag?: number) => {
      const p = PRESETS[preset];
      const flag = currentFlag ?? flagMultiplier;
      const kmRate = flag === 1.3 ? Number((p.pricePerKm * 1.3).toFixed(4)) : p.pricePerKm;
      setValue('baseFare', p.baseFare, { shouldValidate: true });
      setValue('pricePerKm', kmRate, { shouldValidate: true });
      setValue('waitingPrice', Number(p.waitingPrice.toFixed(4)), { shouldValidate: true });
      setValue('waitingChargeType', p.waitingChargeType);
      setActivePreset(preset);
    },
    [setValue, flagMultiplier]
  );

  const applyFlag = useCallback(
    (flag: number) => {
      const p = PRESETS[activePreset];
      const kmRate = flag === 1.3 ? Number((p.pricePerKm * 1.3).toFixed(4)) : p.pricePerKm;
      setValue('flagMultiplier', flag, { shouldValidate: true });
      setValue('pricePerKm', kmRate, { shouldValidate: true });
    },
    [setValue, activePreset]
  );

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    setApiError(null);
    try {
      const response = await calculateQuote({
        ...data,
        // estimatedMinutes não é mais campo do form — manda 0, o backend calcula tarifa de espera zerada
        estimatedMinutes: 0,
        vehicleExtraCostPerKm: 0,
        driverMinimumValue: 0,
        totalDistanceKm: undefined,
        stops: [],
        tollOutbound:  data.tollOutbound  ?? 0,
        tollReturn:    data.tollReturn    ?? 0,
        parkingCost:   data.parkingCost   ?? 0,
        extraCosts:    data.extraCosts    ?? 0,
        desiredMarginPercent: data.desiredMarginPercent ?? 20,
        customChargedPrice: data.customChargedPrice && data.customChargedPrice > 0 ? data.customChargedPrice : undefined,
      });
      onResult(response.result, response.quoteId, data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setApiError(error?.response?.data?.error || 'Erro ao calcular. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-0">

      {/* ─── Seção 1: Rota ─── */}
      <Section title="Rota" icon="🗺️">
        <Controller name="originAddress" control={control} render={({ field }) => (
          <AddressInput
            label="Origem (opcional)"
            value={field.value ?? ''}
            onChange={field.onChange}
            placeholder="Ex: Sé, São Paulo"
          />
        )} />

        <Controller name="destinationAddress" control={control} render={({ field }) => (
          <AddressInput
            label="Destino (opcional)"
            value={field.value ?? ''}
            onChange={field.onChange}
            placeholder="Ex: Congonhas, São Paulo"
          />
        )} />

        <Controller name="tripType" control={control} render={({ field }) => (
          <ToggleGroup label="Tipo de corrida" value={field.value} onChange={field.onChange}
            options={[
              { value: 'one_way',      label: 'Só ida' },
              { value: 'round_trip',   label: 'Ida e volta' },
              { value: 'empty_return', label: 'Volta vazia' },
            ]}
          />
        )} />

        <div className={`grid gap-3 ${tripType !== 'one_way' ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <Controller name="distanceKm" control={control} render={({ field }) => (
            <NumberInput label="Distância da ida" value={field.value} onChange={field.onChange}
              suffix="km" step={0.5} min={0} required error={errors.distanceKm?.message} />
          )} />
          {tripType !== 'one_way' && (
            <Controller name="returnDistanceKm" control={control} render={({ field }) => (
              <NumberInput label="Distância da volta" value={field.value ?? 0} onChange={field.onChange}
                suffix="km" step={0.5} min={0} hint="0 = igual à ida" />
            )} />
          )}
        </div>
      </Section>

      {/* ─── Seção 2: Veículo ─── */}
      <Section title="Combustível" icon="⛽">
        {/* Tipo de combustível em botões grandes */}
        <Controller name="fuelType" control={control} render={({ field }) => (
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Tipo de combustível</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'gasoline', label: '⛽ Gasolina' },
                { value: 'ethanol',  label: '🌿 Etanol' },
                { value: 'gnv',      label: '💨 GNV' },
                { value: 'flex',     label: '🔀 Flex' },
                { value: 'diesel',   label: '🚛 Diesel' },
                { value: 'electric', label: '⚡ Elétrico' },
              ].map((opt) => (
                <button key={opt.value} type="button"
                  onClick={() => field.onChange(opt.value)}
                  className={`py-2 px-1 rounded-xl text-xs font-semibold border transition-all ${
                    field.value === opt.value
                      ? 'bg-taxi-500 text-white border-taxi-500 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-taxi-300'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )} />

        {!isElectric && (
          <div className="grid grid-cols-2 gap-3">
            <Controller name="consumptionKmPerLiter" control={control} render={({ field }) => (
              <NumberInput label="Consumo médio" value={field.value} onChange={field.onChange}
                suffix="km/l" step={0.5} min={1} required error={errors.consumptionKmPerLiter?.message} />
            )} />
            <Controller name="fuelPricePerLiter" control={control} render={({ field }) => (
              <MoneyInput label="Preço por litro" value={field.value} onChange={field.onChange}
                required error={errors.fuelPricePerLiter?.message} />
            )} />
          </div>
        )}

        {isElectric && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <p className="text-xs text-blue-700 font-medium">⚡ Veículo elétrico</p>
            <p className="text-xs text-blue-500 mt-0.5">Informe o custo por km de carregamento equivalente no campo "Preço por litro" e use 1 como consumo.</p>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <Controller name="consumptionKmPerLiter" control={control} render={({ field }) => (
                <NumberInput label="km por kWh" value={field.value} onChange={field.onChange}
                  suffix="km" step={0.5} min={1} required />
              )} />
              <Controller name="fuelPricePerLiter" control={control} render={({ field }) => (
                <MoneyInput label="Preço por kWh" value={field.value} onChange={field.onChange} required />
              )} />
            </div>
          </div>
        )}
      </Section>

      {/* ─── Seção 3: Tarifa ─── */}
      <Section title="Tarifa do Táxi" icon="🏁">
        {/* Presets */}
        <div>
          <p className="text-xs text-gray-500 mb-2 font-medium">Tabela oficial SP:</p>
          <div className="grid grid-cols-2 gap-2">
            {(['comum', 'luxo'] as const).map((preset) => (
              <button key={preset} type="button" onClick={() => applyPreset(preset)}
                className={`py-2.5 px-3 rounded-xl text-sm font-semibold border transition-all ${
                  activePreset === preset
                    ? 'bg-taxi-500 text-white border-taxi-500 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-taxi-300'
                }`}>
                {preset === 'comum' ? '🚕 Comum' : '🚙 Luxo'}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            {activePreset === 'comum'
              ? 'Bandeirada R$ 6,55 · R$ 4,80/km · R$ 55,50/h'
              : 'Bandeirada R$ 9,83 · R$ 7,20/km · R$ 83,25/h'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Controller name="baseFare" control={control} render={({ field }) => (
            <MoneyInput label="Bandeirada" value={field.value} onChange={field.onChange} hint="Valor inicial" />
          )} />
          <Controller name="pricePerKm" control={control} render={({ field }) => (
            <MoneyInput label="Tarifa por km" value={field.value} onChange={field.onChange} />
          )} />
        </div>

        {/* Bandeira 1 / Bandeira 2 */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Bandeira</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 1.0, label: 'Bandeira 1', sub: 'Dias úteis, 6h–20h' },
              { value: 1.3, label: 'Bandeira 2', sub: 'Noite, dom. e feriados' },
            ].map((opt) => (
              <button key={opt.value} type="button"
                onClick={() => applyFlag(opt.value)}
                className={`py-2.5 px-3 rounded-xl text-left border transition-all ${
                  flagMultiplier === opt.value
                    ? 'bg-taxi-500 text-white border-taxi-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-taxi-300'
                }`}>
                <p className="text-sm font-bold">{opt.label}</p>
                <p className={`text-xs mt-0.5 ${flagMultiplier === opt.value ? 'text-taxi-100' : 'text-gray-400'}`}>{opt.sub}</p>
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* ─── Seção 4: Custos extras ─── */}
      <Section title="Custos Extras" icon="💳">
        <div className="grid grid-cols-2 gap-3">
          <Controller name="tollOutbound" control={control} render={({ field }) => (
            <MoneyInput label="Pedágio ida" value={field.value} onChange={field.onChange} />
          )} />
          <Controller name="tollReturn" control={control} render={({ field }) => (
            <MoneyInput label="Pedágio volta" value={field.value} onChange={field.onChange} />
          )} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Controller name="parkingCost" control={control} render={({ field }) => (
            <MoneyInput label="Estacionamento" value={field.value} onChange={field.onChange} />
          )} />
          <Controller name="extraCosts" control={control} render={({ field }) => (
            <MoneyInput label="Outras taxas" value={field.value} onChange={field.onChange} />
          )} />
        </div>
      </Section>

      {/* ─── Seção 5: Margem ─── */}
      <Section title="Sua margem de lucro" icon="💰">
        <Controller name="desiredMarginPercent" control={control} render={({ field }) => (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700">Margem desejada</label>
              <span className="text-base font-black text-taxi-600">{field.value}%</span>
            </div>
            <input type="range" min={0} max={80} step={5} value={field.value}
              onChange={(e) => field.onChange(Number(e.target.value))}
              className="w-full accent-taxi-500 h-2 rounded-full" />
            <div className="flex justify-between text-xs text-gray-400">
              <span>0%</span><span>20%</span><span>40%</span><span>60%</span><span>80%</span>
            </div>
            <p className="text-xs text-gray-400">
              {field.value === 0 && 'Preço mínimo — só cobre os custos'}
              {field.value > 0 && field.value <= 20 && 'Margem conservadora'}
              {field.value > 20 && field.value <= 40 && 'Margem equilibrada — recomendado'}
              {field.value > 40 && field.value <= 60 && 'Margem boa'}
              {field.value > 60 && 'Margem alta — avalie se o cliente aceita'}
            </p>
          </div>
        )} />

        <Controller name="customChargedPrice" control={control} render={({ field }) => (
          <MoneyInput
            label="Valor que pretendo cobrar (opcional)"
            value={field.value ?? 0}
            onChange={(v) => field.onChange(v || undefined)}
            hint="Preencha para ver se cobre os custos"
          />
        )} />
      </Section>

      {apiError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-2">
          <p className="text-red-700 text-sm">{apiError}</p>
        </div>
      )}

      <div className="px-1 pb-2">
        <LoadingButton type="submit" loading={loading} size="lg" fullWidth className="shadow-result">
          Calcular Corrida
        </LoadingButton>
      </div>
    </form>
  );
}
