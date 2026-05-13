'use client';

import { useState, useEffect } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { NumberInput } from '@/components/ui/NumberInput';
import { SelectInput } from '@/components/ui/SelectInput';
import { LoadingButton } from '@/components/ui/LoadingButton';

const SETTINGS_KEY = 'pct_driver_settings';

interface DriverSettings {
  fuelType: string;
  consumptionKmPerLiter: number;
  fuelPricePerLiter: number;
  vehicleExtraCostPerKm: number;
  baseFare: number;
  pricePerKm: number;
  waitingPricePerMinute: number;
  desiredMarginPercent: number;
  driverMinimumValue: number;
}

const defaultSettings: DriverSettings = {
  fuelType: 'gasoline',
  consumptionKmPerLiter: 10,
  fuelPricePerLiter: 6.0,
  vehicleExtraCostPerKm: 0,
  baseFare: 6.55,
  pricePerKm: 4.8,
  waitingPricePerMinute: Number((55.5 / 60).toFixed(4)),
  desiredMarginPercent: 20,
  driverMinimumValue: 0,
};

export default function ConfiguracoesPage() {
  const [settings, setSettings] = useState<DriverSettings>(defaultSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch {
      // Use defaults
    }
  }, []);

  const update = <K extends keyof DriverSettings>(key: K, value: DriverSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const save = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const reset = () => {
    setSettings(defaultSettings);
    localStorage.removeItem(SETTINGS_KEY);
  };

  const applyPreset = (preset: 'comum' | 'luxo') => {
    if (preset === 'comum') {
      setSettings((prev) => ({
        ...prev,
        baseFare: 6.55,
        pricePerKm: 4.8,
        waitingPricePerMinute: Number((55.5 / 60).toFixed(4)),
      }));
    } else {
      setSettings((prev) => ({
        ...prev,
        baseFare: 9.83,
        pricePerKm: 7.2,
        waitingPricePerMinute: Number((83.25 / 60).toFixed(4)),
      }));
    }
  };

  return (
    <PageContainer>
      <div className="mb-4 pt-2">
        <h1 className="text-2xl font-black text-gray-900">Configurações</h1>
        <p className="text-gray-500 text-sm mt-1">
          Salve seus dados padrão para preencher o formulário mais rápido
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-4 text-sm text-amber-700">
        <strong>Dica:</strong> As configurações salvas aqui são usadas como padrão ao abrir a calculadora.
      </div>

      {/* Veículo */}
      <div className="bg-white rounded-2xl shadow-card p-4 mb-3">
        <h2 className="font-bold text-gray-800 text-base mb-3 flex items-center gap-2">
          🚗 Veículo e Combustível
        </h2>
        <div className="flex flex-col gap-3">
          <SelectInput
            label="Tipo de combustível"
            value={settings.fuelType}
            onChange={(v) => update('fuelType', v)}
            options={[
              { value: 'gasoline', label: 'Gasolina' },
              { value: 'ethanol', label: 'Etanol' },
              { value: 'gnv', label: 'GNV' },
              { value: 'diesel', label: 'Diesel' },
              { value: 'flex', label: 'Flex' },
            ]}
          />
          <div className="grid grid-cols-2 gap-3">
            <NumberInput
              label="Consumo médio"
              value={settings.consumptionKmPerLiter}
              onChange={(v) => update('consumptionKmPerLiter', v)}
              suffix="km/l"
              step={0.1}
              min={1}
            />
            <MoneyInput
              label="Preço combustível"
              value={settings.fuelPricePerLiter}
              onChange={(v) => update('fuelPricePerLiter', v)}
              hint="Por litro"
            />
          </div>
          <MoneyInput
            label="Custo extra por km"
            value={settings.vehicleExtraCostPerKm}
            onChange={(v) => update('vehicleExtraCostPerKm', v)}
            hint="Manutenção, depreciação, seguro por km"
          />
        </div>
      </div>

      {/* Tarifa */}
      <div className="bg-white rounded-2xl shadow-card p-4 mb-3">
        <h2 className="font-bold text-gray-800 text-base mb-3 flex items-center gap-2">
          🏁 Tarifa padrão
        </h2>
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => applyPreset('comum')}
            className="flex-1 bg-taxi-50 border border-taxi-200 text-taxi-700 text-xs font-medium py-2 px-3 rounded-xl hover:bg-taxi-100 transition-colors"
          >
            🚕 Comum/Especial
          </button>
          <button
            onClick={() => applyPreset('luxo')}
            className="flex-1 bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium py-2 px-3 rounded-xl hover:bg-gray-100 transition-colors"
          >
            🚙 Luxo
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <MoneyInput
              label="Bandeirada"
              value={settings.baseFare}
              onChange={(v) => update('baseFare', v)}
            />
            <MoneyInput
              label="Tarifa por km"
              value={settings.pricePerKm}
              onChange={(v) => update('pricePerKm', v)}
            />
          </div>
          <MoneyInput
            label="Tarifa por minuto parado"
            value={settings.waitingPricePerMinute}
            onChange={(v) => update('waitingPricePerMinute', v)}
            hint="Tarifa hora SP: R$ 55,50 ÷ 60 = R$ 0,925/min"
          />
        </div>
      </div>

      {/* Precificação */}
      <div className="bg-white rounded-2xl shadow-card p-4 mb-4">
        <h2 className="font-bold text-gray-800 text-base mb-3 flex items-center gap-2">
          💰 Precificação padrão
        </h2>
        <div className="flex flex-col gap-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-medium text-gray-700">Margem desejada</label>
              <span className="text-sm font-bold text-taxi-600">{settings.desiredMarginPercent}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={80}
              step={5}
              value={settings.desiredMarginPercent}
              onChange={(e) => update('desiredMarginPercent', Number(e.target.value))}
              className="w-full"
            />
          </div>
          <MoneyInput
            label="Mínimo que aceito pelo meu tempo"
            value={settings.driverMinimumValue}
            onChange={(v) => update('driverMinimumValue', v)}
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="flex-none px-4 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Resetar
        </button>
        <LoadingButton onClick={save} fullWidth variant={saved ? 'secondary' : 'primary'}>
          {saved ? '✅ Salvo com sucesso!' : 'Salvar configurações'}
        </LoadingButton>
      </div>
    </PageContainer>
  );
}
