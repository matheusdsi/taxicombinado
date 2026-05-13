'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { PageContainer } from '@/components/layout/PageContainer';
import { useAuth } from '@/context/AuthContext';
import {
  DriverAccountData,
  createFuelLog,
  createMaintenanceLog,
  getDriverAccount,
  updateDriverAccount,
} from '@/lib/api';
import { formatCurrencyBRL } from '@/lib/formatters';

type FormState = Record<string, string | boolean>;

const emptyProfile: FormState = {
  phone: '',
  whatsapp: '',
  city: '',
  state: 'SP',
  taxiPoint: '',
  worksWithApps: false,
  acceptsPix: true,
  acceptsCard: false,
  issuesReceipt: false,
  notes: '',
};

const emptyVehicle: FormState = {
  name: '',
  brand: '',
  model: '',
  year: '',
  plateNickname: '',
  fuelType: 'gasoline',
  consumptionKmPerLiter: '',
  extraCostPerKm: '',
  monthlyInstallment: '',
  monthlyInsurance: '',
  monthlyProtection: '',
  monthlyRental: '',
  monthlyParking: '',
  notes: '',
};

const emptyCosts: FormState = {
  personalIncomeGoal: '',
  workDaysPerMonth: '',
  hoursPerDay: '',
  monthlyKmEstimate: '',
  fuelMonthlyEstimate: '',
  carInstallment: '',
  carRental: '',
  insurance: '',
  vehicleProtection: '',
  maintenanceReserve: '',
  tireReserve: '',
  oilReserve: '',
  washing: '',
  parking: '',
  tollTag: '',
  phoneBill: '',
  appFees: '',
  accountant: '',
  licenseAndTaxes: '',
  otherFixedCosts: '',
  notes: '',
};

const emptyMaintenance: FormState = {
  date: '',
  category: 'maintenance',
  description: '',
  amount: '',
  odometerKm: '',
  notes: '',
};

const emptyFuel: FormState = {
  date: '',
  fuelType: 'gasoline',
  liters: '',
  totalPaid: '',
  pricePerLiter: '',
  odometerKm: '',
  station: '',
  city: '',
};

function valueFrom(data: Record<string, unknown> | null, key: string, fallback = '') {
  const value = data?.[key];
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function boolFrom(data: Record<string, unknown> | null, key: string, fallback = false) {
  const value = data?.[key];
  return typeof value === 'boolean' ? value : fallback;
}

function compactPayload(form: FormState) {
  return Object.fromEntries(
    Object.entries(form).map(([key, value]) => [key, value === '' ? undefined : value])
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  suffix,
}: {
  label: string;
  value: string | boolean;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  suffix?: string;
}) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gray-500)' }}>{label}</span>
      <div style={{ position: 'relative' }}>
        <input
          className="tc-input"
          type={type}
          value={typeof value === 'boolean' ? '' : value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          style={suffix ? { paddingRight: 48 } : undefined}
        />
        {suffix && (
          <span style={{ position: 'absolute', right: 14, top: 14, fontSize: 12, fontWeight: 800, color: 'var(--gray-400)' }}>
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px solid var(--gray-200)', borderRadius: 12, background: 'var(--surface)' }}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--ink)' }} />
      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--gray-700)' }}>{label}</span>
    </label>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="tc-card" style={{ marginBottom: 14 }}>
      <div style={{ marginBottom: 14 }}>
        <div className="tc-section-title" style={{ marginBottom: 4 }}>{title}</div>
        <p style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 600, lineHeight: 1.35 }}>{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function SaveButton({ loading }: { loading: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{
        width: '100%',
        border: 0,
        borderRadius: 14,
        background: 'var(--ink)',
        color: '#fff',
        padding: '14px 16px',
        fontSize: 14,
        fontWeight: 900,
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.65 : 1,
      }}
    >
      {loading ? 'Salvando...' : 'Salvar esta parte'}
    </button>
  );
}

export default function MinhaContaPage() {
  const { driver, loading: authLoading } = useAuth();
  const [account, setAccount] = useState<DriverAccountData | null>(null);
  const [profile, setProfile] = useState<FormState>(emptyProfile);
  const [vehicle, setVehicle] = useState<FormState>(emptyVehicle);
  const [costs, setCosts] = useState<FormState>(emptyCosts);
  const [maintenance, setMaintenance] = useState<FormState>(emptyMaintenance);
  const [fuel, setFuel] = useState<FormState>(emptyFuel);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!driver) {
      setLoading(false);
      return;
    }

    getDriverAccount()
      .then((data) => {
        setAccount(data);
        setProfile({
          phone: valueFrom(data.profile, 'phone'),
          whatsapp: valueFrom(data.profile, 'whatsapp'),
          city: valueFrom(data.profile, 'city'),
          state: valueFrom(data.profile, 'state', 'SP'),
          taxiPoint: valueFrom(data.profile, 'taxiPoint'),
          worksWithApps: boolFrom(data.profile, 'worksWithApps'),
          acceptsPix: boolFrom(data.profile, 'acceptsPix', true),
          acceptsCard: boolFrom(data.profile, 'acceptsCard'),
          issuesReceipt: boolFrom(data.profile, 'issuesReceipt'),
          notes: valueFrom(data.profile, 'notes'),
        });
        setVehicle({
          name: valueFrom(data.vehicle, 'name'),
          brand: valueFrom(data.vehicle, 'brand'),
          model: valueFrom(data.vehicle, 'model'),
          year: valueFrom(data.vehicle, 'year'),
          plateNickname: valueFrom(data.vehicle, 'plateNickname'),
          fuelType: valueFrom(data.vehicle, 'fuelType', 'gasoline'),
          consumptionKmPerLiter: valueFrom(data.vehicle, 'consumptionKmPerLiter'),
          extraCostPerKm: valueFrom(data.vehicle, 'extraCostPerKm'),
          monthlyInstallment: valueFrom(data.vehicle, 'monthlyInstallment'),
          monthlyInsurance: valueFrom(data.vehicle, 'monthlyInsurance'),
          monthlyProtection: valueFrom(data.vehicle, 'monthlyProtection'),
          monthlyRental: valueFrom(data.vehicle, 'monthlyRental'),
          monthlyParking: valueFrom(data.vehicle, 'monthlyParking'),
          notes: valueFrom(data.vehicle, 'notes'),
        });
        setCosts({
          ...emptyCosts,
          ...Object.fromEntries(Object.keys(emptyCosts).map((key) => [key, valueFrom(data.costs, key)])),
        });
      })
      .catch(() => setMessage('Nao consegui carregar sua conta agora.'))
      .finally(() => setLoading(false));
  }, [authLoading, driver]);

  const localSummary = useMemo(() => {
    const n = (key: string) => Number(costs[key] || 0);
    const monthlyCosts = [
      'fuelMonthlyEstimate',
      'carInstallment',
      'carRental',
      'insurance',
      'vehicleProtection',
      'maintenanceReserve',
      'tireReserve',
      'oilReserve',
      'washing',
      'parking',
      'tollTag',
      'phoneBill',
      'appFees',
      'accountant',
      'licenseAndTaxes',
      'otherFixedCosts',
    ].reduce((sum, key) => sum + n(key), 0);
    const monthlyTarget = monthlyCosts + n('personalIncomeGoal');
    const workDays = n('workDaysPerMonth');
    const hours = n('hoursPerDay');
    const km = n('monthlyKmEstimate');
    return {
      monthlyCosts,
      monthlyTarget,
      dailyTarget: workDays > 0 ? monthlyTarget / workDays : null,
      hourlyTarget: workDays > 0 && hours > 0 ? monthlyTarget / workDays / hours : null,
      costPerKm: km > 0 ? monthlyCosts / km : null,
      targetPerKm: km > 0 ? monthlyTarget / km : null,
    };
  }, [costs]);

  const update = (setter: React.Dispatch<React.SetStateAction<FormState>>, key: string, value: string | boolean) => {
    setter((current) => ({ ...current, [key]: value }));
  };

  async function savePart(part: 'profile' | 'vehicle' | 'costs') {
    setSaving(part);
    setMessage('');
    try {
      const payload = part === 'profile'
        ? { profile: compactPayload(profile) }
        : part === 'vehicle'
          ? { vehicle: compactPayload(vehicle) }
          : { costs: compactPayload(costs) };
      const data = await updateDriverAccount(payload);
      setAccount(data);
      setMessage('Salvo. Voce pode preencher o resto depois.');
    } catch {
      setMessage('Nao consegui salvar agora. Confira os campos e tente de novo.');
    } finally {
      setSaving('');
    }
  }

  async function addMaintenance(event: React.FormEvent) {
    event.preventDefault();
    setSaving('maintenance');
    setMessage('');
    try {
      await createMaintenanceLog(compactPayload(maintenance));
      const data = await getDriverAccount();
      setAccount(data);
      setMaintenance(emptyMaintenance);
      setMessage('Manutencao registrada.');
    } catch {
      setMessage('Informe pelo menos descricao e valor da manutencao.');
    } finally {
      setSaving('');
    }
  }

  async function addFuel(event: React.FormEvent) {
    event.preventDefault();
    setSaving('fuel');
    setMessage('');
    try {
      await createFuelLog(compactPayload(fuel));
      const data = await getDriverAccount();
      setAccount(data);
      setFuel(emptyFuel);
      setMessage('Abastecimento registrado.');
    } catch {
      setMessage('Informe pelo menos o valor pago no abastecimento.');
    } finally {
      setSaving('');
    }
  }

  if (authLoading || loading) {
    return (
      <PageContainer>
        <div style={{ padding: '80px 0', textAlign: 'center', color: 'var(--gray-500)', fontWeight: 800 }}>Carregando sua conta...</div>
      </PageContainer>
    );
  }

  if (!driver) {
    return (
      <PageContainer>
        <div className="tc-card" style={{ marginTop: 24, textAlign: 'center', padding: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>T</div>
          <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Crie sua conta gratis</h1>
          <p style={{ color: 'var(--gray-500)', fontSize: 14, fontWeight: 600, lineHeight: 1.45, marginBottom: 18 }}>
            A central do motorista guarda carro, custos, metas, abastecimentos e manutencoes. Tudo opcional, sem burocracia.
          </p>
          <div style={{ display: 'grid', gap: 10 }}>
            <Link href="/cadastro" className="tc-btn-primary" style={{ textDecoration: 'none' }}>Criar conta gratis</Link>
            <Link href="/entrar" style={{ color: 'var(--gray-700)', fontWeight: 800, textDecoration: 'none' }}>Ja tenho conta</Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gray-400)' }}>Central do motorista</p>
            <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', marginTop: 2 }}>Minha conta</h1>
            <p style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 600, marginTop: 4 }}>Preencha no seu ritmo. Nada aqui e obrigatorio.</p>
          </div>
          <Link href="/historico" style={{ background: 'var(--gray-100)', color: 'var(--gray-700)', borderRadius: 12, padding: '10px 12px', fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>
            Historico
          </Link>
        </div>
      </div>

      <div style={{ background: 'var(--ink)', color: '#fff', borderRadius: 20, padding: 18, marginBottom: 14 }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,.62)', fontWeight: 800 }}>Seu numero do mes</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
          <Metric label="Meta mensal" value={formatCurrencyBRL(localSummary.monthlyTarget)} dark />
          <Metric label="Meta diaria" value={localSummary.dailyTarget ? formatCurrencyBRL(localSummary.dailyTarget) : 'Preencha dias'} dark />
          <Metric label="Custo por km" value={localSummary.costPerKm ? formatCurrencyBRL(localSummary.costPerKm) : 'Preencha km'} dark />
          <Metric label="Meta por km" value={localSummary.targetPerKm ? formatCurrencyBRL(localSummary.targetPerKm) : 'Preencha km'} dark />
        </div>
      </div>

      {message && (
        <div style={{ background: 'var(--yellow-soft)', border: '1px solid #FCEBA8', borderRadius: 14, padding: 12, marginBottom: 14, fontSize: 13, fontWeight: 800 }}>
          {message}
        </div>
      )}

      <Section title="Dados basicos" subtitle="So para personalizar sua conta. Pode deixar em branco.">
        <form onSubmit={(event) => { event.preventDefault(); savePart('profile'); }} style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Telefone" value={profile.phone} onChange={(v) => update(setProfile, 'phone', v)} placeholder="(11) 99999-0000" />
            <Field label="WhatsApp" value={profile.whatsapp} onChange={(v) => update(setProfile, 'whatsapp', v)} placeholder="Opcional" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 88px', gap: 10 }}>
            <Field label="Cidade" value={profile.city} onChange={(v) => update(setProfile, 'city', v)} placeholder="Sao Paulo" />
            <Field label="UF" value={profile.state} onChange={(v) => update(setProfile, 'state', v)} placeholder="SP" />
          </div>
          <Field label="Ponto, regiao ou cooperativa" value={profile.taxiPoint} onChange={(v) => update(setProfile, 'taxiPoint', v)} placeholder="Ex: Congonhas, Centro, ponto da praca..." />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Toggle label="Trabalho com apps" checked={Boolean(profile.worksWithApps)} onChange={(v) => update(setProfile, 'worksWithApps', v)} />
            <Toggle label="Aceito Pix" checked={Boolean(profile.acceptsPix)} onChange={(v) => update(setProfile, 'acceptsPix', v)} />
            <Toggle label="Aceito cartao" checked={Boolean(profile.acceptsCard)} onChange={(v) => update(setProfile, 'acceptsCard', v)} />
            <Toggle label="Dou recibo" checked={Boolean(profile.issuesReceipt)} onChange={(v) => update(setProfile, 'issuesReceipt', v)} />
          </div>
          <SaveButton loading={saving === 'profile'} />
        </form>
      </Section>

      <Section title="Meu taxi" subtitle="Esses dados ajudam a calculadora a entender o carro que paga suas contas.">
        <form onSubmit={(event) => { event.preventDefault(); savePart('vehicle'); }} style={{ display: 'grid', gap: 12 }}>
          <Field label="Nome do carro" value={vehicle.name} onChange={(v) => update(setVehicle, 'name', v)} placeholder="Ex: Meu taxi, Spin, Siena..." />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Marca" value={vehicle.brand} onChange={(v) => update(setVehicle, 'brand', v)} placeholder="Chevrolet" />
            <Field label="Modelo" value={vehicle.model} onChange={(v) => update(setVehicle, 'model', v)} placeholder="Spin" />
            <Field label="Ano" value={vehicle.year} onChange={(v) => update(setVehicle, 'year', v)} type="number" />
            <Field label="Apelido da placa" value={vehicle.plateNickname} onChange={(v) => update(setVehicle, 'plateNickname', v)} placeholder="Final 1234" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Combustivel principal" value={vehicle.fuelType} onChange={(v) => update(setVehicle, 'fuelType', v)} placeholder="gasoline, ethanol, gnv..." />
            <Field label="Consumo medio" value={vehicle.consumptionKmPerLiter} onChange={(v) => update(setVehicle, 'consumptionKmPerLiter', v)} type="number" suffix="km/l" />
            <Field label="Custo extra por km" value={vehicle.extraCostPerKm} onChange={(v) => update(setVehicle, 'extraCostPerKm', v)} type="number" placeholder="0,80" />
            <Field label="Parcela mensal" value={vehicle.monthlyInstallment} onChange={(v) => update(setVehicle, 'monthlyInstallment', v)} type="number" />
          </div>
          <SaveButton loading={saving === 'vehicle'} />
        </form>
      </Section>

      <Section title="Custos e metas" subtitle="Aqui mora o ouro: transformar custo escondido em meta clara de trabalho.">
        <form onSubmit={(event) => { event.preventDefault(); savePart('costs'); }} style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Quero sobrar no mes" value={costs.personalIncomeGoal} onChange={(v) => update(setCosts, 'personalIncomeGoal', v)} type="number" />
            <Field label="Dias trabalhados/mes" value={costs.workDaysPerMonth} onChange={(v) => update(setCosts, 'workDaysPerMonth', v)} type="number" />
            <Field label="Horas por dia" value={costs.hoursPerDay} onChange={(v) => update(setCosts, 'hoursPerDay', v)} type="number" />
            <Field label="Km por mes" value={costs.monthlyKmEstimate} onChange={(v) => update(setCosts, 'monthlyKmEstimate', v)} type="number" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Combustivel mensal" value={costs.fuelMonthlyEstimate} onChange={(v) => update(setCosts, 'fuelMonthlyEstimate', v)} type="number" />
            <Field label="Prestacao do carro" value={costs.carInstallment} onChange={(v) => update(setCosts, 'carInstallment', v)} type="number" />
            <Field label="Diaria/aluguel" value={costs.carRental} onChange={(v) => update(setCosts, 'carRental', v)} type="number" />
            <Field label="Seguro" value={costs.insurance} onChange={(v) => update(setCosts, 'insurance', v)} type="number" />
            <Field label="Protecao veicular" value={costs.vehicleProtection} onChange={(v) => update(setCosts, 'vehicleProtection', v)} type="number" />
            <Field label="Reserva manutencao" value={costs.maintenanceReserve} onChange={(v) => update(setCosts, 'maintenanceReserve', v)} type="number" />
            <Field label="Reserva pneu" value={costs.tireReserve} onChange={(v) => update(setCosts, 'tireReserve', v)} type="number" />
            <Field label="Reserva oleo" value={costs.oilReserve} onChange={(v) => update(setCosts, 'oilReserve', v)} type="number" />
            <Field label="Lavagem" value={costs.washing} onChange={(v) => update(setCosts, 'washing', v)} type="number" />
            <Field label="Estacionamento" value={costs.parking} onChange={(v) => update(setCosts, 'parking', v)} type="number" />
            <Field label="Tag/pedagio mensal" value={costs.tollTag} onChange={(v) => update(setCosts, 'tollTag', v)} type="number" />
            <Field label="Celular/internet" value={costs.phoneBill} onChange={(v) => update(setCosts, 'phoneBill', v)} type="number" />
            <Field label="Taxas de app" value={costs.appFees} onChange={(v) => update(setCosts, 'appFees', v)} type="number" />
            <Field label="Contabilidade/MEI" value={costs.accountant} onChange={(v) => update(setCosts, 'accountant', v)} type="number" />
            <Field label="Licenca/impostos" value={costs.licenseAndTaxes} onChange={(v) => update(setCosts, 'licenseAndTaxes', v)} type="number" />
            <Field label="Outros fixos" value={costs.otherFixedCosts} onChange={(v) => update(setCosts, 'otherFixedCosts', v)} type="number" />
          </div>
          <SaveButton loading={saving === 'costs'} />
        </form>
      </Section>

      <Section title="Manutencoes" subtitle="Registre o que teve que fazer no carro. Com o tempo isso vira custo real por km.">
        <form onSubmit={addMaintenance} style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Data" value={maintenance.date} onChange={(v) => update(setMaintenance, 'date', v)} type="date" />
            <Field label="Categoria" value={maintenance.category} onChange={(v) => update(setMaintenance, 'category', v)} placeholder="pneu, oleo, freio..." />
          </div>
          <Field label="O que foi feito" value={maintenance.description} onChange={(v) => update(setMaintenance, 'description', v)} placeholder="Troca de oleo, pneu, revisao..." />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Valor" value={maintenance.amount} onChange={(v) => update(setMaintenance, 'amount', v)} type="number" />
            <Field label="Km do carro" value={maintenance.odometerKm} onChange={(v) => update(setMaintenance, 'odometerKm', v)} type="number" />
          </div>
          <SaveButton loading={saving === 'maintenance'} />
        </form>
        <LogList items={account?.maintenanceLogs ?? []} empty="Nenhuma manutencao registrada ainda." amountKey="amount" titleKey="description" />
      </Section>

      <Section title="Abastecimentos" subtitle="Opcional, mas poderoso: daqui sai seu consumo real e custo real de combustivel.">
        <form onSubmit={addFuel} style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Data" value={fuel.date} onChange={(v) => update(setFuel, 'date', v)} type="date" />
            <Field label="Combustivel" value={fuel.fuelType} onChange={(v) => update(setFuel, 'fuelType', v)} />
            <Field label="Litros" value={fuel.liters} onChange={(v) => update(setFuel, 'liters', v)} type="number" />
            <Field label="Valor pago" value={fuel.totalPaid} onChange={(v) => update(setFuel, 'totalPaid', v)} type="number" />
            <Field label="Preco por litro" value={fuel.pricePerLiter} onChange={(v) => update(setFuel, 'pricePerLiter', v)} type="number" />
            <Field label="Km do carro" value={fuel.odometerKm} onChange={(v) => update(setFuel, 'odometerKm', v)} type="number" />
          </div>
          <Field label="Posto" value={fuel.station} onChange={(v) => update(setFuel, 'station', v)} placeholder="Nome do posto" />
          <SaveButton loading={saving === 'fuel'} />
        </form>
        <LogList items={account?.fuelLogs ?? []} empty="Nenhum abastecimento registrado ainda." amountKey="totalPaid" titleKey="station" />
      </Section>
    </PageContainer>
  );
}

function Metric({ label, value, dark = false }: { label: string; value: string; dark?: boolean }) {
  return (
    <div style={{ background: dark ? 'rgba(255,255,255,.08)' : 'var(--gray-50)', borderRadius: 14, padding: 12 }}>
      <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: dark ? 'rgba(255,255,255,.55)' : 'var(--gray-400)' }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 900, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function LogList({
  items,
  empty,
  amountKey,
  titleKey,
}: {
  items: Array<Record<string, unknown>>;
  empty: string;
  amountKey: string;
  titleKey: string;
}) {
  if (!items.length) {
    return <p style={{ marginTop: 12, fontSize: 12, color: 'var(--gray-400)', fontWeight: 700 }}>{empty}</p>;
  }
  return (
    <div style={{ marginTop: 14, display: 'grid', gap: 8 }}>
      {items.slice(0, 5).map((item) => (
        <div key={String(item.id)} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, borderTop: '1px solid var(--gray-100)', paddingTop: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {String(item[titleKey] || item.category || 'Registro')}
            </div>
            <div style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 700, marginTop: 2 }}>
              {item.date ? new Date(String(item.date)).toLocaleDateString('pt-BR') : ''}
            </div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--gray-700)' }}>
            {formatCurrencyBRL(Number(item[amountKey] || 0))}
          </div>
        </div>
      ))}
    </div>
  );
}
