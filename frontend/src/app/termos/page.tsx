import { PageContainer } from '@/components/layout/PageContainer';

export default function TermosPage() {
  return (
    <PageContainer>
      <div className="mb-6 pt-2">
        <h1 className="text-2xl font-black text-gray-900">Termos de Uso</h1>
        <p className="text-gray-400 text-xs mt-1">Última atualização: maio de 2025</p>
      </div>

      <div className="flex flex-col gap-4">
        {[
          {
            title: '1. Aceitação dos termos',
            content: `Ao acessar o Taxi Combinado, você concorda com estes Termos de Uso. Se não concordar, não utilize o aplicativo.`,
          },
          {
            title: '2. Descrição do serviço',
            content: `O Taxi Combinado é uma ferramenta de cálculo de preço de corridas de táxi. Os valores calculados são estimativas baseadas nos dados informados pelo usuário e nas tarifas oficiais da Prefeitura de São Paulo. Não somos responsáveis por valores cobrados ou acordados entre taxista e passageiro.`,
          },
          {
            title: '3. Uso adequado',
            content: `O app destina-se a uso pessoal e profissional por taxistas. É proibido:
• Usar o app para fins ilegais
• Tentar acessar sistemas internos ou banco de dados
• Reproduzir ou distribuir o conteúdo sem autorização`,
          },
          {
            title: '4. Precisão das informações',
            content: `As tarifas pré-configuradas refletem as tabelas oficiais vigentes, mas podem estar desatualizadas. Sempre verifique as tarifas atuais com a Prefeitura de SP ou órgãos reguladores. O Taxi Combinado não garante a precisão dos cálculos para fins de cobrança oficial.`,
          },
          {
            title: '5. Limitação de responsabilidade',
            content: `O Taxi Combinado é fornecido "como está", sem garantias expressas ou implícitas. Não nos responsabilizamos por perdas financeiras decorrentes do uso das calculadoras ou divergências com valores reais.`,
          },
          {
            title: '6. Propriedade intelectual',
            content: `O código, design e conteúdo do Taxi Combinado são protegidos por direitos autorais. É proibida a cópia ou reprodução sem autorização por escrito.`,
          },
          {
            title: '7. Alterações nos termos',
            content: `Podemos atualizar estes termos a qualquer momento. O uso contínuo após alterações implica aceitação dos novos termos.`,
          },
          {
            title: '8. Contato',
            content: `Dúvidas: taxicombinado@gmail.com`,
          },
        ].map((section) => (
          <div key={section.title} className="bg-white rounded-2xl shadow-card p-5">
            <h2 className="font-bold text-gray-800 text-base mb-2">{section.title}</h2>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{section.content}</p>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
