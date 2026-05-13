import { PageContainer } from '@/components/layout/PageContainer';

export default function PrivacidadePage() {
  return (
    <PageContainer>
      <div className="mb-6 pt-2">
        <h1 className="text-2xl font-black text-gray-900">Política de Privacidade</h1>
        <p className="text-gray-400 text-xs mt-1">Última atualização: maio de 2025</p>
      </div>

      <div className="flex flex-col gap-4">
        {[
          {
            title: '1. Dados que coletamos',
            content: `Coletamos apenas dados necessários para o funcionamento do app:

• Identificador anônimo (cookie pct_anonymous_id): UUID gerado automaticamente para associar seu histórico de cotações. Não é vinculado a nenhum dado pessoal.
• Dados de corridas calculadas: distâncias, tempos, valores — sem informação de localização GPS.
• Dados técnicos de acesso: IP (anonimizado após 30 dias) e user agent para fins de segurança.`,
          },
          {
            title: '2. Como usamos os dados',
            content: `Usamos os dados exclusivamente para:
• Exibir seu histórico de cotações na mesma sessão/dispositivo
• Melhorar a experiência do app
• Gerar estatísticas agregadas e anônimas de uso`,
          },
          {
            title: '3. Cookies',
            content: `Usamos apenas 1 cookie funcional:
• pct_anonymous_id: identificador anônimo, válido por 365 dias, SameSite=Lax.

Não usamos cookies de rastreamento, publicidade ou analytics de terceiros.`,
          },
          {
            title: '4. Compartilhamento de dados',
            content: `Não vendemos, alugamos ou compartilhamos seus dados com terceiros para fins comerciais. Seus dados podem ser processados por provedores de infraestrutura (hosting, banco de dados) sujeitos a acordos de confidencialidade.`,
          },
          {
            title: '5. Seus direitos (LGPD)',
            content: `Conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018), você tem direito a:
• Acessar seus dados
• Solicitar a exclusão do seu histórico
• Revogar o consentimento de cookies

Para exercer esses direitos, entre em contato: taxicombinado@gmail.com`,
          },
          {
            title: '6. Segurança',
            content: `Adotamos práticas de segurança como HTTPS, cookies HttpOnly, e não armazenamos dados sensíveis. Tokens nunca são guardados em localStorage.`,
          },
          {
            title: '7. Contato',
            content: `Dúvidas sobre privacidade: taxicombinado@gmail.com`,
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
