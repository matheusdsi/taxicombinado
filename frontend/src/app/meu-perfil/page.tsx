'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface PublicProfile {
  id?: string;
  slug?: string;
  displayName: string;
  photoUrl: string;
  city: string;
  whatsapp: string;
  car: string;
  catAirport: boolean;
  catExec: boolean;
  catLuxo: boolean;
  catPet: boolean;
  cat7seats: boolean;
  catTravel: boolean;
  bio: string;
  lgpdConsent: boolean;
  isActive?: boolean;
}

const EMPTY: PublicProfile = {
  displayName: '',
  photoUrl: '',
  city: '',
  whatsapp: '',
  car: '',
  catAirport: false,
  catExec: false,
  catLuxo: false,
  catPet: false,
  cat7seats: false,
  catTravel: false,
  bio: '',
  lgpdConsent: false,
};

const CATS = [
  { key: 'catAirport', label: 'Aeroporto' },
  { key: 'catExec',    label: 'Executivo' },
  { key: 'catLuxo',    label: 'Luxo' },
  { key: 'catPet',     label: 'Pet' },
  { key: 'cat7seats',  label: '7 lugares' },
  { key: 'catTravel',  label: 'Viagem' },
] as const;

export default function MeuPerfilPage() {
  const { driver: user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState<PublicProfile>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/entrar');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    api.get('/api/profile/me').then((res) => {
      if (res.data.data) {
        const p = res.data.data;
        setForm({
          ...EMPTY,
          ...p,
          photoUrl: p.photoUrl ?? '',
          city: p.city ?? '',
          whatsapp: p.whatsapp ?? '',
          car: p.car ?? '',
          bio: p.bio ?? '',
          lgpdConsent: p.lgpdConsent ?? false,
        });
      }
    }).catch(() => {}).finally(() => setLoadingProfile(false));
  }, [user]);

  const set = (key: keyof PublicProfile, value: string | boolean) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await api.put('/api/profile/me', {
        ...form,
        photoUrl: form.photoUrl || undefined,
        city: form.city || undefined,
        whatsapp: form.whatsapp || undefined,
        car: form.car || undefined,
        bio: form.bio || undefined,
      });
      setForm((f) => ({ ...f, ...res.data.data, photoUrl: res.data.data.photoUrl ?? '', city: res.data.data.city ?? '', whatsapp: res.data.data.whatsapp ?? '', car: res.data.data.car ?? '', bio: res.data.data.bio ?? '' }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { error?: string } } };
      setError(e2?.response?.data?.error ?? 'Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const deleteProfile = async () => {
    if (!confirm('Remover seu perfil público? Os dados serão excluídos (direito LGPD).')) return;
    await api.delete('/api/profile/me');
    setForm(EMPTY);
  };

  if (authLoading || loadingProfile) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--gray-200)', borderTopColor: 'var(--ink)', animation: 'spin 0.9s linear infinite' }} />
      </div>
    );
  }

  const profileUrl = form.slug ? `/t/${form.slug}` : null;

  return (
    <div style={{ maxWidth: 540, margin: '0 auto', padding: '24px 16px 80px' }}>
      <div style={{ marginBottom: 20 }}>
        <Link href="/" style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-500)', textDecoration: 'none' }}>← Voltar</Link>
        <div style={{ fontSize: 22, fontWeight: 900, marginTop: 8, color: 'var(--ink)' }}>Meu Perfil Público</div>
        <div style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 600, marginTop: 4 }}>
          Seu perfil gera um link para passageiros te encontrarem e agendarem.
        </div>
        {profileUrl && (
          <a href={profileUrl} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 12, fontWeight: 800, color: 'var(--green)', textDecoration: 'none', background: 'var(--green-soft)', padding: '6px 12px', borderRadius: 8 }}>
            Ver meu perfil público →
          </a>
        )}
      </div>

      <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Nome */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-500)' }}>Nome público *</label>
          <input
            value={form.displayName}
            onChange={(e) => set('displayName', e.target.value)}
            required
            maxLength={80}
            placeholder="Nome que aparece no perfil"
            style={inputStyle}
          />
        </div>

        {/* Foto */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-500)' }}>Foto (URL)</label>
          <input
            value={form.photoUrl}
            onChange={(e) => set('photoUrl', e.target.value)}
            type="url"
            maxLength={500}
            placeholder="https://... (link da sua foto)"
            style={inputStyle}
          />
          <span style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 500 }}>
            Cole o link de uma foto sua hospedada (Google Drive, LinkedIn, etc.)
          </span>
        </div>

        {/* Cidade */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-500)' }}>Cidade</label>
          <input
            value={form.city}
            onChange={(e) => set('city', e.target.value)}
            maxLength={80}
            placeholder="Ex: São Paulo - SP"
            style={inputStyle}
          />
        </div>

        {/* WhatsApp */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-500)' }}>WhatsApp</label>
          <input
            value={form.whatsapp}
            onChange={(e) => set('whatsapp', e.target.value)}
            type="tel"
            maxLength={20}
            placeholder="11999999999"
            style={inputStyle}
          />
          <span style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 500 }}>
            Seu WhatsApp não fica visível na página — é usado apenas para gerar um link seguro de contato.
          </span>
        </div>

        {/* Carro */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-500)' }}>Carro</label>
          <input
            value={form.car}
            onChange={(e) => set('car', e.target.value)}
            maxLength={80}
            placeholder="Ex: Toyota Corolla 2022"
            style={inputStyle}
          />
        </div>

        {/* Categorias */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-500)', display: 'block', marginBottom: 8 }}>Categorias de serviço</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {CATS.map(({ key, label }) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', border: `1.5px solid ${form[key] ? 'var(--ink)' : 'var(--gray-200)'}`, borderRadius: 10, cursor: 'pointer', background: form[key] ? 'var(--ink)' : 'var(--surface)' }}>
                <input type="checkbox" checked={form[key]} onChange={(e) => set(key, e.target.checked)} style={{ display: 'none' }} />
                <span style={{ fontSize: 12, fontWeight: 800, color: form[key] ? '#fff' : 'var(--gray-700)' }}>{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Bio */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-500)' }}>Sobre você (até 280 caracteres)</label>
          <textarea
            value={form.bio}
            onChange={(e) => set('bio', e.target.value)}
            maxLength={280}
            rows={3}
            placeholder="Ex: Motorista há 15 anos, especializado em viagens ao interior e aeroportos."
            style={{ ...inputStyle, resize: 'vertical', height: 80 }}
          />
          <span style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 500 }}>{form.bio.length}/280</span>
        </div>

        {/* Consentimento LGPD */}
        <div style={{ background: 'var(--blue-soft)', borderRadius: 12, padding: '12px 14px' }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.lgpdConsent}
              onChange={(e) => set('lgpdConsent', e.target.checked)}
              required
              style={{ width: 18, height: 18, accentColor: 'var(--ink)', flexShrink: 0, marginTop: 2 }}
            />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1E3A8A', lineHeight: 1.5 }}>
              Concordo que meus dados (nome, cidade, carro, categorias e bio) fiquem visíveis publicamente no link do meu perfil. Meu WhatsApp é usado apenas para gerar links de contato e <strong>não é exibido diretamente</strong>. Posso excluir meu perfil a qualquer momento.
            </span>
          </label>
        </div>

        {error && (
          <div style={{ background: 'var(--red-soft)', color: '#7F1D1D', borderRadius: 12, padding: '10px 14px', fontSize: 13, fontWeight: 600 }}>{error}</div>
        )}

        <button type="submit" disabled={saving || !form.lgpdConsent}
          style={{ background: form.lgpdConsent ? 'var(--ink)' : 'var(--gray-300)', color: '#fff', border: 0, borderRadius: 14, padding: '14px 16px', fontFamily: 'inherit', fontWeight: 800, fontSize: 15, cursor: form.lgpdConsent ? 'pointer' : 'not-allowed', transition: 'background 0.15s' }}>
          {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar perfil'}
        </button>

        {form.slug && (
          <button type="button" onClick={deleteProfile}
            style={{ background: 'transparent', color: 'var(--red)', border: '1.5px solid var(--red)', borderRadius: 14, padding: '10px 16px', fontFamily: 'inherit', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            Excluir meu perfil público (LGPD)
          </button>
        )}
      </form>

      {form.slug && (
        <div style={{ marginTop: 24 }}>
          <Link href="/meu-perfil/agendamentos"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--yellow-soft)', border: '1px solid #FCEBA8', borderRadius: 14, padding: '14px 16px', textDecoration: 'none', color: 'var(--ink)' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14 }}>Agendamentos recebidos</div>
              <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>Ver e gerenciar solicitações</div>
            </div>
            <span style={{ fontSize: 18 }}>→</span>
          </Link>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1.5px solid var(--gray-200)',
  borderRadius: 12,
  padding: '11px 14px',
  fontFamily: 'inherit',
  fontSize: 14,
  color: 'var(--ink)',
  background: 'var(--surface)',
  outline: 'none',
  boxSizing: 'border-box',
  marginTop: 6,
};
