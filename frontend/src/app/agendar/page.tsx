'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout/PageContainer';
import { AddressInput } from '@/components/ui/AddressInput';
import { api, calculateRoute } from '@/lib/api';

// ─── Tarifa base padrão para estimativa ──────────────────────────
const FARE = { baseFare: 6.55, pricePerKm: 4.8 };
const MARGIN = 0.25;

function estimatePrice(distanceKm: number, large: boolean) {
  const base = FARE.baseFare + FARE.pricePerKm * distanceKm;
  const min = Math.round(base * 0.9);
  const max = Math.round(base * (1 + MARGIN) * (large ? 1.4 : 1));
  return { min, max };
}

// ─── Small UI primitives ─────────────────────────────────────────

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</label>
      {children}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}

function Input({ error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <input
      {...props}
      className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none transition-all bg-white text-gray-900 placeholder-gray-300
        ${error ? 'border-red-400 ring-1 ring-red-200' : 'border-gray-200 focus:border-taxi-500 focus:ring-2 focus:ring-taxi-100'}`}
    />
  );
}

function Checkbox({
  label,
  checked,
  onChange,
  icon,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  icon: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all
        ${checked ? 'border-taxi-500 bg-taxi-50 text-taxi-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

// ─── Page ────────────────────────────────────────────────────────

interface FormState {
  passengerName: string;
  passengerPhone: string;
  originAddress: string;
  destinationAddress: string;
  scheduledDate: string;
  scheduledTime: string;
  passengerCount: number;
  needsLargeVehicle: boolean;
  needsAccessibility: boolean;
  hasLuggage: boolean;
  notes: string;
}

const EMPTY: FormState = {
  passengerName: '',
  passengerPhone: '',
  originAddress: '',
  destinationAddress: '',
  scheduledDate: '',
  scheduledTime: '',
  passengerCount: 1,
  needsLargeVehicle: false,
  needsAccessibility: false,
  hasLuggage: false,
  notes: '',
};

export default function AgendarPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [routeLoading, setRouteLoading] = useState(false);
  const [estimate, setEstimate] = useState<{ min: number; max: number; distanceKm: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const routeDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = (key: keyof FormState, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  const tryFetchRoute = useCallback((origin: string, dest: string, large: boolean) => {
    if (routeDebounce.current) clearTimeout(routeDebounce.current);
    if (origin.length < 5 || dest.length < 5) return;
    routeDebounce.current = setTimeout(async () => {
      setRouteLoading(true);
      try {
        const route = await calculateRoute(origin, dest);
        if (route.distanceKm) {
          const { min, max } = estimatePrice(route.distanceKm, large);
          setEstimate({ min, max, distanceKm: route.distanceKm });
        }
      } catch {
        // silently ignore — estimate is optional
      } finally {
        setRouteLoading(false);
      }
    }, 800);
  }, []);

  const handleAddressChange = (key: 'originAddress' | 'destinationAddress', value: string) => {
    set(key, value);
    const origin = key === 'originAddress' ? value : form.originAddress;
    const dest = key === 'destinationAddress' ? value : form.destinationAddress;
    tryFetchRoute(origin, dest, form.needsLargeVehicle);
  };

  const handleLargeVehicle = (v: boolean) => {
    set('needsLargeVehicle', v);
    if (estimate) {
      const { min, max } = estimatePrice(estimate.distanceKm, v);
      setEstimate((e) => e ? { ...e, min, max } : e);
    }
    tryFetchRoute(form.originAddress, form.destinationAddress, v);
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.passengerName.trim()) e.passengerName = 'Informe seu nome';
    if (!form.passengerPhone.trim() || form.passengerPhone.replace(/\D/g, '').length < 10)
      e.passengerPhone = 'Informe um telefone válido';
    if (!form.originAddress.trim()) e.originAddress = 'Informe o ponto de partida';
    if (!form.destinationAddress.trim()) e.destinationAddress = 'Informe o destino';
    if (!form.scheduledDate) e.scheduledDate = 'Informe a data';
    if (!form.scheduledTime) e.scheduledTime = 'Informe o horário';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await api.post('/api/ride-requests', {
        ...form,
        estimatedPriceMin: estimate?.min,
        estimatedPriceMax: estimate?.max,
        estimatedDistanceKm: estimate?.distanceKm,
      });
      setWhatsappUrl(res.data.data.whatsappUrl);
      setDone(true);
    } catch {
      alert('Erro ao enviar solicitação. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center gap-6 py-12 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl">✅</div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Pedido enviado!</h1>
            <p className="text-gray-500 text-sm max-w-xs">
              Sua solicitação foi salva. Clique abaixo para abrir o WhatsApp e falar diretamente com o despachante.
            </p>
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-2xl transition-colors text-sm shadow"
          >
            <span>💬</span>
            Abrir no WhatsApp
          </a>
          <button
            onClick={() => { setDone(false); setForm(EMPTY); setEstimate(null); }}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Fazer outro pedido
          </button>
          <button
            onClick={() => router.push('/')}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Voltar ao início
          </button>
        </div>
      </PageContainer>
    );
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <PageContainer>
      <div className="pb-10">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Agendar corrida</h1>
          <p className="text-sm text-gray-500 mt-1">
            Preencha os dados abaixo. Você será conectado a um taxista pelo WhatsApp.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">

          {/* Rota */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col gap-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Rota</p>
            <AddressInput
              label="Ponto de partida"
              value={form.originAddress}
              onChange={(v) => handleAddressChange('originAddress', v)}
              placeholder="Rua, bairro, cidade..."
              prefix={<span className="text-green-500 text-base">●</span>}
            />
            {errors.originAddress && <span className="text-xs text-red-500 -mt-2">{errors.originAddress}</span>}

            <AddressInput
              label="Destino"
              value={form.destinationAddress}
              onChange={(v) => handleAddressChange('destinationAddress', v)}
              placeholder="Rua, bairro, cidade..."
              prefix={<span className="text-red-500 text-base">●</span>}
            />
            {errors.destinationAddress && <span className="text-xs text-red-500 -mt-2">{errors.destinationAddress}</span>}

            {/* Estimativa */}
            {routeLoading && (
              <div className="flex items-center gap-2 text-xs text-gray-400 animate-pulse">
                <div className="w-3 h-3 border border-taxi-400 border-t-transparent rounded-full animate-spin" />
                Calculando estimativa...
              </div>
            )}
            {estimate && !routeLoading && (
              <div className="bg-taxi-50 border border-taxi-200 rounded-xl px-3 py-2.5 flex items-start gap-2">
                <span className="text-taxi-600 text-base mt-0.5">💰</span>
                <div>
                  <p className="text-xs font-bold text-taxi-700">
                    Estimativa: R$ {estimate.min}–R$ {estimate.max}
                  </p>
                  <p className="text-xs text-taxi-600 mt-0.5">
                    ~{estimate.distanceKm.toFixed(1)} km · Valor final negociado com o motorista
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Data e Horário */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col gap-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Quando</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Data" error={errors.scheduledDate}>
                <Input
                  type="date"
                  min={today}
                  value={form.scheduledDate}
                  onChange={(e) => set('scheduledDate', e.target.value)}
                  error={errors.scheduledDate}
                />
              </Field>
              <Field label="Horário" error={errors.scheduledTime}>
                <Input
                  type="time"
                  value={form.scheduledTime}
                  onChange={(e) => set('scheduledTime', e.target.value)}
                  error={errors.scheduledTime}
                />
              </Field>
            </div>
          </div>

          {/* Passageiros e veículo */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col gap-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Passageiros e veículo</p>

            <Field label="Número de passageiros">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => set('passengerCount', Math.max(1, form.passengerCount - 1))}
                  className="w-9 h-9 rounded-full border border-gray-200 text-gray-600 flex items-center justify-center text-lg font-bold hover:border-gray-400 transition-colors"
                >
                  −
                </button>
                <span className="text-base font-semibold text-gray-900 w-6 text-center">{form.passengerCount}</span>
                <button
                  type="button"
                  onClick={() => set('passengerCount', Math.min(15, form.passengerCount + 1))}
                  className="w-9 h-9 rounded-full border border-gray-200 text-gray-600 flex items-center justify-center text-lg font-bold hover:border-gray-400 transition-colors"
                >
                  +
                </button>
              </div>
            </Field>

            <div className="flex flex-wrap gap-2">
              <Checkbox
                label="Van / 7 lugares"
                icon="🚐"
                checked={form.needsLargeVehicle}
                onChange={handleLargeVehicle}
              />
              <Checkbox
                label="Acessibilidade"
                icon="♿"
                checked={form.needsAccessibility}
                onChange={(v) => set('needsAccessibility', v)}
              />
              <Checkbox
                label="Bagagem extra"
                icon="🧳"
                checked={form.hasLuggage}
                onChange={(v) => set('hasLuggage', v)}
              />
            </div>
          </div>

          {/* Dados do passageiro */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col gap-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Seus dados</p>
            <Field label="Seu nome" error={errors.passengerName}>
              <Input
                type="text"
                placeholder="Nome completo"
                value={form.passengerName}
                onChange={(e) => set('passengerName', e.target.value)}
                error={errors.passengerName}
              />
            </Field>
            <Field label="WhatsApp / Telefone" error={errors.passengerPhone}>
              <Input
                type="tel"
                placeholder="(11) 99999-9999"
                value={form.passengerPhone}
                onChange={(e) => set('passengerPhone', e.target.value)}
                error={errors.passengerPhone}
              />
            </Field>
          </div>

          {/* Observações */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Observações (opcional)</label>
            <textarea
              rows={3}
              placeholder="Ex: viagem de madrugada, precisa de cadeirinha, muito bagageiro, endereço de difícil acesso..."
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none resize-none bg-white text-gray-900 placeholder-gray-300 focus:border-taxi-500 focus:ring-2 focus:ring-taxi-100 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-taxi-500 hover:bg-taxi-600 disabled:opacity-60 text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm shadow flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <span>💬</span>
                Solicitar corrida via WhatsApp
              </>
            )}
          </button>

          <p className="text-xs text-gray-400 text-center px-4">
            Ao enviar, você será redirecionado ao WhatsApp para confirmar os detalhes com o despachante.
            O valor final é negociado diretamente com o motorista.
          </p>
        </form>
      </div>
    </PageContainer>
  );
}
