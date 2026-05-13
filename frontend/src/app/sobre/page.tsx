import { PageContainer } from '@/components/layout/PageContainer';
import Link from 'next/link';

export default function SobrePage() {
  return (
    <PageContainer>
      <div className="mb-6 pt-2">
        <h1 className="text-2xl font-black text-gray-900">Sobre o Taxi Combinado</h1>
      </div>

      <div className="flex flex-col gap-4">
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h2 className="font-bold text-gray-800 text-lg mb-2">O que é?</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            O <strong>Taxi Combinado</strong> é uma calculadora gratuita desenvolvida para taxistas de São Paulo.
            Ele ajuda você a calcular o preço justo de cada corrida, considerando combustível, pedágios, tempo,
            desgaste do veículo e margem de lucro.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-5">
          <h2 className="font-bold text-gray-800 text-lg mb-3">Como funciona?</h2>
          <div className="flex flex-col gap-3">
            {[
              { n: '1', title: 'Informe a rota', desc: 'Distância e tempo estimado da corrida' },
              { n: '2', title: 'Configure seu carro', desc: 'Consumo e preço do combustível' },
              { n: '3', title: 'Defina a tarifa', desc: 'Pré-configurado com as tarifas de SP' },
              { n: '4', title: 'Veja o preço justo', desc: 'Calculamos o mínimo, recomendado e ideal' },
            ].map((step) => (
              <div key={step.n} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 bg-taxi-500 text-white text-sm font-bold rounded-full flex items-center justify-center">
                  {step.n}
                </span>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{step.title}</p>
                  <p className="text-gray-500 text-xs">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-5">
          <h2 className="font-bold text-gray-800 text-lg mb-2">Tarifas de SP (2024)</h2>
          <div className="overflow-hidden rounded-xl border border-gray-100">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2 text-gray-600 font-medium">Tipo</th>
                  <th className="text-right px-3 py-2 text-gray-600 font-medium">Bandeirada</th>
                  <th className="text-right px-3 py-2 text-gray-600 font-medium">Por km</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-3 py-2 text-gray-700">Comum / Especial</td>
                  <td className="px-3 py-2 text-right text-gray-700">R$ 6,55</td>
                  <td className="px-3 py-2 text-right text-gray-700">R$ 4,80</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-gray-700">Luxo</td>
                  <td className="px-3 py-2 text-right text-gray-700">R$ 9,83</td>
                  <td className="px-3 py-2 text-right text-gray-700">R$ 7,20</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-gray-500 text-xs" colSpan={3}>
                    Bandeira 2 (+30%): domingos, feriados e das 20h às 6h
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-5">
          <h2 className="font-bold text-gray-800 text-lg mb-2">Privacidade</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Não coletamos dados pessoais. Usamos um identificador anônimo para salvar seu histórico de cotações.
            Nenhuma informação sua é vendida ou compartilhada.
          </p>
          <Link href="/privacidade" className="text-taxi-600 text-sm font-medium hover:underline mt-2 inline-block">
            Ver política de privacidade →
          </Link>
        </div>

        <div className="bg-taxi-50 rounded-2xl p-5 border border-taxi-200">
          <h2 className="font-bold text-gray-800 text-lg mb-2">Contato</h2>
          <p className="text-gray-600 text-sm">
            Sugestões, bugs ou parcerias:{' '}
            <a href="mailto:taxicombinado@gmail.com" className="text-taxi-600 font-medium">
              taxicombinado@gmail.com
            </a>
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
