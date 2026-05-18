'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { api, calculateRoute } from '@/lib/api';
import { AddressInput } from '@/components/ui/AddressInput';

const FARE = { baseFare: 6.55, pricePerKm: 4.8 };
function estimatePrice(distanceKm: number) {
  const base = FARE.baseFare + FARE.pricePerKm * distanceKm;
  return { min: Math.round(base * 0.9), max: Math.round(base * 1.25) };
}

interface PublicProfile {
  id: string;
  slug: string;
  displayName: string;
  photoUrl?: string;
  city?: string;
  car?: string;
  catAirport: boolean;
  catExec: boolean;
  catLuxo: boolean;
  catPet: boolean;
  cat7seats: boolean;
  catTravel: boolean;
  bio?: string;
}

interface ScheduleForm {
  passengerName: string;
  passengerWhatsapp: string;
  originAddress: string;
  destinationAddress: string;
  scheduledDate: string;
  scheduledTime: string;
  passengerCount: number;
  luggageCount: number;
  notes: string;
  passengerConsent: boolean;
}

const EMPTY_FORM: ScheduleForm = {
  passengerName: '',
  passengerWhatsapp: '',
  originAddress: '',
  destinationAddress: '',
  scheduledDate: '',
  scheduledTime: '',
  passengerCount: 1,
  luggageCount: 0,
  notes: '',
  passengerConsent: false,
};

const CATS: Array<{ key: keyof PublicProfile; label: string; icon: string }> = [
  { key: 'catAirport', label: 'Aeroporto', icon: '✈️' },
  { key: 'catExec',    label: 'Executivo', icon: '💼' },
  { key: 'catLuxo',    label: 'Luxo',      icon: '⭐' },
  { key: 'catPet',     label: 'Pet',       icon: '🐾' },
  { key: 'cat7seats',  label: '7 lugares', icon: '👥' },
  { key: 'catTravel',  label: 'Viagem',    icon: '🗺️' },
];

export default function DriverPublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ScheduleForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<{ min: number; max: number; distanceKm: number } | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const routeDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tryFetchRoute = useCallback((origin: string, dest: string) => {
    if (routeDebounce.current) clearTimeout(routeDebounce.current);
    if (origin.length < 5 || dest.length < 5) return;
    routeDebounce.current = setTimeout(async () => {
      setRouteLoading(true);
      try {
        const route = await calculateRoute(origin, dest);
        if (route.distanceKm) {
          const { min, max } = estimatePrice(route.distanceKm);
          setEstimate({ min, max, distanceKm: route.distanceKm });
        }
      } catch {
        // estimativa opcional
      } finally {
        setRouteLoading(false);
      }
    }, 800);
  }, []);

  useEffect(() => {
    api.get(`/api/profile/${slug}`).then((res) => {
      setProfile(res.data.data);
    }).catch(() => {
      setNotFound(true);
    }).finally(() => setLoading(false));
  }, [slug]);

  const set = (key: keyof ScheduleForm, value: string | number | boolean) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === 'originAddress' || key === 'destinationAddress') {
        const origin = key === 'originAddress' ? String(value) : f.originAddress;
        const dest = key === 'destinationAddress' ? String(value) : f.destinationAddress;
        tryFetchRoute(origin, dest);
      }
      return next;
    });
  };

  const buildMsg = () => {
    const dateFormatted = form.scheduledDate
      ? new Date(form.scheduledDate + 'T12:00:00').toLocaleDateString('pt-BR')
      : form.scheduledDate;
    return [
      `🚖 *Novo agendamento recebido!*`,
      ``,
      `👤 Cliente: ${form.passengerName}`,
      `📱 WhatsApp: ${form.passengerWhatsapp}`,
      ``,
      `📍 Origem: ${form.originAddress}`,
      `🏁 Destino: ${form.destinationAddress}`,
      ``,
      `📅 Data: ${dateFormatted}`,
      `⏰ Horário: ${form.scheduledTime}`,
      `👥 Passageiros: ${form.passengerCount}`,
      form.luggageCount > 0 ? `🧳 Malas: ${form.luggageCount}` : null,
      form.notes ? `📝 Obs: ${form.notes}` : null,
      ``,
      `Responda para confirmar ou recusar.`,
    ].filter(Boolean).join('\n');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.originAddress.trim() || !form.destinationAddress.trim()) {
      setFormError('Informe a origem e o destino da corrida.');
      return;
    }
    if (!form.passengerConsent) {
      setFormError('Você precisa aceitar o termo de uso dos seus dados.');
      return;
    }
    setSubmitting(true);
    setFormError(null);

    // Abre uma janela em branco ainda no gesto do usuário para evitar bloqueio de popup
    const win = window.open('', '_blank');

    try {
      const [, waRes] = await Promise.all([
        api.post(`/api/profile/${slug}/schedule`, {
          ...form,
          passengerCount: Number(form.passengerCount),
          luggageCount: Number(form.luggageCount),
        }),
        api.get(`/api/profile/${slug}/whatsapp`, { params: { message: buildMsg() } }).catch(() => null),
      ]);

      const link = waRes?.data?.data?.link ?? null;
      setWhatsappLink(link);

      if (link && win) {
        win.location.href = link;
      } else if (win) {
        win.close();
      }

      setSubmitted(true);
    } catch (err: unknown) {
      win?.close();
      const e2 = err as { response?: { data?: { error?: string } } };
      setFormError(e2?.response?.data?.error ?? 'Erro ao enviar. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--gray-200)', borderTopColor: 'var(--ink)', animation: 'spin 0.9s linear infinite' }} />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div style={{ maxWidth: 400, margin: '60px auto', padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🚖</div>
        <div style={{ fontWeight: 900, fontSize: 20, color: 'var(--ink)' }}>Perfil não encontrado</div>
        <p style={{ color: 'var(--gray-500)', fontSize: 14, marginTop: 8 }}>Esse link pode ter expirado ou o taxista desativou o perfil.</p>
        <a href="/" style={{ display: 'inline-block', marginTop: 16, background: 'var(--ink)', color: '#fff', padding: '10px 20px', borderRadius: 12, textDecoration: 'none', fontWeight: 800, fontSize: 14 }}>
          Ir para Taxi Combinado →
        </a>
      </div>
    );
  }

  const activeCats = CATS.filter((c) => profile[c.key] === true);

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px 80px' }}>

      {/* Header do perfil */}
      <div style={{ background: 'var(--ink)', borderRadius: 20, padding: '24px 20px', color: '#fff', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -30, top: -30, width: 130, height: 130, borderRadius: '50%', background: 'var(--yellow)', opacity: 0.12 }} />
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {profile.photoUrl ? (
            <img src={profile.photoUrl} alt={profile.displayName}
              style={{ width: 68, height: 68, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--yellow)', flexShrink: 0 }} />
          ) : (
            <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'var(--yellow)', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 28, color: 'var(--ink)', flexShrink: 0 }}>
              {profile.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div style={{ fontWeight: 900, fontSize: 20, lineHeight: 1.1 }}>{profile.displayName}</div>
            {profile.city && <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', marginTop: 4 }}>📍 {profile.city}</div>}
            {profile.car && <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>🚗 {profile.car}</div>}
          </div>
        </div>
        {profile.bio && (
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.8)', marginTop: 14, lineHeight: 1.5, fontWeight: 600 }}>{profile.bio}</p>
        )}
      </div>

      {/* Categorias */}
      {activeCats.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1.5px solid var(--gray-200)', borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Serviços</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {activeCats.map((c) => (
              <span key={c.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'var(--gray-100)', borderRadius: 20, fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                {c.icon} {c.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Botão agendar */}
      {!showForm && !submitted && (
        <button type="button" onClick={() => setShowForm(true)}
          style={{ width: '100%', background: 'var(--yellow)', color: 'var(--ink)', border: 0, borderRadius: 16, padding: '16px', fontFamily: 'inherit', fontWeight: 900, fontSize: 16, cursor: 'pointer', marginBottom: 12 }}>
          Agendar corrida com {profile.displayName.split(' ')[0]}
        </button>
      )}

      {/* Formulário de agendamento */}
      {showForm && !submitted && (
        <form onSubmit={submit} style={{ background: 'var(--surface)', border: '1.5px solid var(--gray-200)', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)', marginBottom: 4 }}>Solicitar agendamento</div>

          <FField label="Seu nome *">
            <input value={form.passengerName} onChange={(e) => set('passengerName', e.target.value)} required maxLength={100} placeholder="Seu nome completo" style={inp} />
          </FField>

          <FField label="Seu WhatsApp *">
            <input value={form.passengerWhatsapp} onChange={(e) => set('passengerWhatsapp', e.target.value)} required type="tel" maxLength={20} placeholder="11999999999" style={inp} />
          </FField>

          <AddressInput
            label="Origem *"
            value={form.originAddress}
            onChange={(v) => set('originAddress', v)}
            placeholder="De onde você parte"
          />

          <AddressInput
            label="Destino *"
            value={form.destinationAddress}
            onChange={(v) => set('destinationAddress', v)}
            placeholder="Para onde vai"
          />

          {/* Estimativa de preço */}
          {routeLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--gray-400)', fontWeight: 600 }}>
              <div style={{ width: 12, height: 12, border: '2px solid var(--gray-300)', borderTopColor: 'var(--ink)', borderRadius: '50%', animation: 'spin 0.9s linear infinite', flexShrink: 0 }} />
              Calculando estimativa...
            </div>
          )}
          {estimate && !routeLoading && (
            <div style={{ background: '#FEFCE8', border: '1.5px solid #FDE68A', borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ fontSize: 16, lineHeight: 1, marginTop: 1 }}>💰</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#92400E' }}>
                  Estimativa: R$ {estimate.min}–R$ {estimate.max}
                </div>
                <div style={{ fontSize: 11, color: '#B45309', marginTop: 3, fontWeight: 600, lineHeight: 1.4 }}>
                  ~{estimate.distanceKm.toFixed(1)} km · Apenas uma estimativa — o valor final será combinado diretamente com o taxista.
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <FField label="Data *">
              <input value={form.scheduledDate} onChange={(e) => set('scheduledDate', e.target.value)} required type="date" style={inp} />
            </FField>
            <FField label="Horário *">
              <input value={form.scheduledTime} onChange={(e) => set('scheduledTime', e.target.value)} required type="time" style={inp} />
            </FField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <FField label="Passageiros">
              <input value={form.passengerCount} onChange={(e) => set('passengerCount', Number(e.target.value))} type="number" min={1} max={10} style={inp} />
            </FField>
            <FField label="Malas">
              <input value={form.luggageCount} onChange={(e) => set('luggageCount', Number(e.target.value))} type="number" min={0} max={20} style={inp} />
            </FField>
          </div>

          <FField label="Observações">
            <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} maxLength={500} rows={2} placeholder="Necessidades especiais, informações extras..." style={{ ...inp, resize: 'vertical', height: 64 }} />
          </FField>

          {/* Consentimento LGPD */}
          <div style={{ background: 'var(--blue-soft)', borderRadius: 12, padding: '10px 12px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.passengerConsent} onChange={(e) => set('passengerConsent', e.target.checked)}
                style={{ width: 18, height: 18, accentColor: 'var(--ink)', flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#1E3A8A', lineHeight: 1.5 }}>
                Aceito que meu nome e WhatsApp sejam compartilhados com o taxista para fins de contato sobre esta solicitação. Os dados serão usados exclusivamente para este agendamento.
              </span>
            </label>
          </div>

          {formError && (
            <div style={{ background: 'var(--red-soft)', color: '#7F1D1D', borderRadius: 10, padding: '8px 12px', fontSize: 12, fontWeight: 700 }}>{formError}</div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button type="button" onClick={() => setShowForm(false)}
              style={{ border: '1.5px solid var(--gray-200)', background: 'var(--surface)', color: 'var(--gray-700)', borderRadius: 12, padding: '12px', fontFamily: 'inherit', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" disabled={submitting}
              style={{ background: 'var(--ink)', color: '#fff', border: 0, borderRadius: 12, padding: '12px', fontFamily: 'inherit', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
              {submitting ? 'Enviando...' : 'Enviar pedido'}
            </button>
          </div>
        </form>
      )}

      {/* Sucesso */}
      {submitted && (
        <div style={{ background: 'var(--green-soft)', border: '1.5px solid var(--green)', borderRadius: 16, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
          <div style={{ fontWeight: 900, fontSize: 16, color: '#14532D' }}>Pedido enviado!</div>
          <p style={{ fontSize: 13, color: '#14532D', fontWeight: 600, marginTop: 6, lineHeight: 1.5 }}>
            O WhatsApp foi aberto para enviar os detalhes para {profile.displayName.split(' ')[0]}. Se não abriu automaticamente, toque no botão abaixo.
          </p>
          {whatsappLink && (
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 14, background: '#25D366', color: '#fff', borderRadius: 12, padding: '12px 20px', fontFamily: 'inherit', fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M12 2a10 10 0 0 0-8.6 15.07L2 22l5.07-1.32A10 10 0 1 0 12 2Zm5.27 14.27c-.22.62-1.27 1.17-1.78 1.22-.46.05-1.05.07-1.69-.1a13 13 0 0 1-1.83-.68 11.36 11.36 0 0 1-4.32-3.83c-.34-.5-1.18-1.58-1.18-3.02 0-1.43.74-2.13 1-2.43.27-.3.58-.37.78-.37l.56.01c.18 0 .42-.07.66.5l.93 2.27c.08.16.13.34.02.55l-.32.5c-.1.16-.22.34-.05.65.17.3.75 1.22 1.61 1.97 1.1.96 2.04 1.27 2.36 1.42.32.15.5.13.69-.08.18-.2.79-.92.99-1.24.2-.32.4-.27.68-.16.27.1 1.74.82 2.04.97.3.15.5.22.57.34.07.13.07.75-.16 1.37Z"/>
              </svg>
              Abrir WhatsApp de {profile.displayName.split(' ')[0]}
            </a>
          )}
          <button type="button" onClick={() => { setSubmitted(false); setWhatsappLink(null); setForm(EMPTY_FORM); setEstimate(null); }}
            style={{ display: 'block', margin: '12px auto 0', background: 'transparent', color: '#14532D', border: 0, fontFamily: 'inherit', fontWeight: 700, fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>
            Fazer outra solicitação
          </button>
        </div>
      )}

      {/* Rodapé */}
      <div style={{ marginTop: 28, textAlign: 'center', fontSize: 12, color: 'var(--gray-400)', fontWeight: 600 }}>
        Perfil criado com <a href="/" style={{ color: 'var(--ink)', fontWeight: 800, textDecoration: 'none' }}>Taxi Combinado</a>
      </div>
    </div>
  );
}

function FField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-500)' }}>{label}</label>
      {children}
    </div>
  );
}

const inp: React.CSSProperties = {
  width: '100%',
  border: '1.5px solid var(--gray-200)',
  borderRadius: 10,
  padding: '10px 12px',
  fontFamily: 'inherit',
  fontSize: 14,
  color: 'var(--ink)',
  background: 'var(--surface)',
  outline: 'none',
  boxSizing: 'border-box',
  WebkitAppearance: 'none',
  appearance: 'none',
};
