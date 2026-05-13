'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageContainer } from '@/components/layout/PageContainer';
import { LoadingButton } from '@/components/ui/LoadingButton';
import { SelectInput } from '@/components/ui/SelectInput';
import { submitBecomePartner } from '@/lib/api';

const schema = z.object({
  companyName: z.string().min(2, 'Informe o nome da empresa'),
  category: z.string().min(1, 'Selecione uma categoria'),
  contactName: z.string().min(2, 'Informe seu nome'),
  phone: z.string().min(10, 'Informe um telefone válido'),
  email: z.string().email('E-mail inválido'),
  city: z.string().min(2, 'Informe a cidade'),
  message: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function AnunciePage() {
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { category: '', city: 'São Paulo' },
  });

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      await submitBecomePartner(data);
      setSuccess(true);
    } catch {
      alert('Erro ao enviar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <span className="text-7xl mb-4">🎉</span>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Solicitação enviada!</h2>
          <p className="text-gray-500 mb-6">
            Recebemos sua solicitação de parceria. Nossa equipe entrará em contato em até 2 dias úteis.
          </p>
          <a
            href="/parceiros"
            className="bg-taxi-500 text-white font-semibold px-6 py-3 rounded-xl hover:bg-taxi-600 transition-colors"
          >
            Ver parceiros atuais
          </a>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mb-6 pt-2">
        <h1 className="text-2xl font-black text-gray-900">Anuncie para taxistas</h1>
        <p className="text-gray-500 text-sm mt-1">
          Alcance centenas de taxistas de São Paulo com seu produto ou serviço
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-card p-4 mb-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { icon: '🎯', label: 'Público qualificado', desc: 'Taxistas ativos em SP' },
            { icon: '📊', label: 'Métricas reais', desc: 'Cliques e leads rastreados' },
            { icon: '💬', label: 'Suporte dedicado', desc: 'Equipe à disposição' },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-1">
              <span className="text-2xl">{item.icon}</span>
              <p className="text-xs font-semibold text-gray-700">{item.label}</p>
              <p className="text-xs text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl shadow-card p-4">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Nome da empresa <span className="text-red-500">*</span>
            </label>
            <input
              {...register('companyName')}
              placeholder="Ex: Auto Peças Central"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-base outline-none focus:border-taxi-500 focus:ring-2 focus:ring-taxi-100 transition-all"
            />
            {errors.companyName && (
              <p className="text-xs text-red-500 mt-1">{errors.companyName.message}</p>
            )}
          </div>

          <SelectInput
            label="Categoria"
            value={watch('category')}
            onChange={(v) => setValue('category', v)}
            required
            options={[
              { value: '', label: 'Selecione...' },
              { value: 'fuel_station', label: 'Posto de combustível' },
              { value: 'mechanic', label: 'Oficina mecânica' },
              { value: 'car_wash', label: 'Lava-rápido' },
              { value: 'toll_tag', label: 'Tag de pedágio' },
              { value: 'vehicle_protection', label: 'Proteção veicular' },
              { value: 'insurance', label: 'Seguro' },
              { value: 'other', label: 'Outro' },
            ]}
            error={errors.category?.message}
          />

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Seu nome <span className="text-red-500">*</span>
            </label>
            <input
              {...register('contactName')}
              placeholder="Nome do responsável"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-base outline-none focus:border-taxi-500 focus:ring-2 focus:ring-taxi-100 transition-all"
            />
            {errors.contactName && (
              <p className="text-xs text-red-500 mt-1">{errors.contactName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Telefone <span className="text-red-500">*</span>
              </label>
              <input
                {...register('phone')}
                type="tel"
                placeholder="(11) 99999-0000"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-base outline-none focus:border-taxi-500 focus:ring-2 focus:ring-taxi-100 transition-all"
              />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Cidade</label>
              <input
                {...register('city')}
                placeholder="São Paulo"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-base outline-none focus:border-taxi-500 focus:ring-2 focus:ring-taxi-100 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              E-mail <span className="text-red-500">*</span>
            </label>
            <input
              {...register('email')}
              type="email"
              placeholder="contato@empresa.com.br"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-base outline-none focus:border-taxi-500 focus:ring-2 focus:ring-taxi-100 transition-all"
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Mensagem (opcional)
            </label>
            <textarea
              {...register('message')}
              placeholder="Conte um pouco sobre seu negócio e o que gostaria de oferecer para os taxistas..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-base outline-none focus:border-taxi-500 focus:ring-2 focus:ring-taxi-100 transition-all resize-none"
            />
          </div>

          <LoadingButton type="submit" loading={loading} fullWidth size="lg">
            Enviar solicitação
          </LoadingButton>
        </div>
      </form>
    </PageContainer>
  );
}
