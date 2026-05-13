import { PageContainer } from '@/components/layout/PageContainer';
import Link from 'next/link';

export const metadata = {
  title: 'Política de Privacidade — Taxi Combinado',
  description: 'Como o Taxi Combinado coleta, usa e protege seus dados pessoais, em conformidade com a LGPD.',
};

const sections = [
  {
    title: '1. Quem somos (Controlador de Dados)',
    content: `Taxi Combinado ("nós", "nosso", "Controlador")
E-mail: taxicombinado@gmail.com

Somos responsáveis pelo tratamento dos seus dados pessoais conforme descrito nesta Política e em conformidade com a Lei Geral de Proteção de Dados — LGPD (Lei 13.709/2018).`,
  },
  {
    title: '2. Dados que Coletamos',
    content: `Coletamos apenas os dados estritamente necessários para o funcionamento do Serviço:

DADOS COLETADOS AUTOMATICAMENTE
• Identificador anônimo (cookie pct_anonymous_id): UUID gerado automaticamente para associar seu histórico de cotações. Não vinculado a nenhum dado pessoal identificável.
• Dados técnicos de acesso: endereço IP (anonimizado após 30 dias), tipo de dispositivo, sistema operacional e navegador — utilizados exclusivamente para segurança e estabilidade.
• Google Tag Manager: coletamos dados de uso agregados e anônimos para análise de desempenho.

DADOS FORNECIDOS VOLUNTARIAMENTE (apenas se criar conta)
• Nome (opcional)
• Endereço de e-mail
• Senha (armazenada em formato hash bcrypt — nunca em texto simples)

DADOS DAS COTAÇÕES
• Endereços de origem e destino digitados
• Parâmetros de cálculo (distância, tipo de corrida, custos informados)
• Valores calculados
• Não coletamos dados de localização GPS.`,
  },
  {
    title: '3. Base Legal para o Tratamento (LGPD)',
    content: `Tratamos seus dados com base nas seguintes bases legais previstas no art. 7º da LGPD:

• Execução de contrato (art. 7º, V): para fornecer as funcionalidades do Serviço que você solicitou, como salvar cotações e manter sua conta.
• Legítimo interesse (art. 7º, IX): para segurança, prevenção de fraudes e melhoria do Serviço, sempre com respeito aos seus direitos.
• Consentimento (art. 7º, I): para cookies não essenciais e comunicações de marketing, quando aplicável. O consentimento pode ser revogado a qualquer tempo.
• Cumprimento de obrigação legal (art. 7º, II): quando exigido por lei ou autoridade competente.`,
  },
  {
    title: '4. Como Usamos os Dados',
    content: `Utilizamos seus dados exclusivamente para:

• Fornecer e melhorar as funcionalidades do Taxi Combinado
• Salvar e exibir seu histórico de cotações
• Garantir a segurança e integridade do Serviço
• Gerar estatísticas agregadas e anônimas de uso (nunca individualizadas)
• Responder às suas solicitações e exercício de direitos
• Cumprir obrigações legais e regulatórias

NÃO utilizamos seus dados para publicidade direcionada, venda a terceiros ou enriquecimento de perfis comportamentais.`,
  },
  {
    title: '5. Cookies e Tecnologias Similares',
    content: `Utilizamos os seguintes cookies:

ESSENCIAIS (não podem ser recusados sem impacto no funcionamento)
• pct_anonymous_id — identificador de sessão anônima (365 dias, SameSite=Lax, HttpOnly)
• pct_cookie_consent — registro da sua escolha de consentimento

FUNCIONAIS (localStorage — não são cookies, ficam apenas no seu dispositivo)
• pct_local_quotes — histórico de cotações salvo localmente

DE ANÁLISE (apenas se você aceitar)
• Google Tag Manager / Google Analytics — dados de uso agregados e anônimos

Você pode gerenciar suas preferências a qualquer momento. Para mais detalhes, consulte nossa Política de Cookies em /cookies.`,
  },
  {
    title: '6. Compartilhamento de Dados',
    content: `Não vendemos, alugamos nem comercializamos seus dados pessoais.

Podemos compartilhar dados com:
• Provedores de infraestrutura (hospedagem, banco de dados): sujeitos a acordos de processamento de dados e obrigações de confidencialidade.
• Google (Tag Manager/Analytics): dados anônimos e agregados.
• Autoridades competentes: quando exigido por lei, decisão judicial ou regulação aplicável.

Todos os fornecedores são avaliados quanto à conformidade com a LGPD e regulações equivalentes.`,
  },
  {
    title: '7. Transferência Internacional de Dados',
    content: `Parte da nossa infraestrutura pode estar localizada fora do Brasil. Nesses casos, garantimos que a transferência ocorre com salvaguardas adequadas, incluindo cláusulas contratuais padrão e certificações de conformidade, conforme exigido pelo art. 33 da LGPD.`,
  },
  {
    title: '8. Retenção de Dados',
    content: `Mantemos seus dados pelo tempo necessário para as finalidades descritas:

• Dados de conta: enquanto a conta estiver ativa, mais 30 dias após o encerramento
• Histórico de cotações: enquanto a conta estiver ativa ou por até 12 meses para usuários anônimos
• Logs de acesso (IP): anonimizados após 30 dias
• Dados de suporte: 5 anos conforme exigências legais

Após os períodos de retenção, os dados são anonimizados ou excluídos de forma segura.`,
  },
  {
    title: '9. Seus Direitos (LGPD)',
    content: `Conforme os arts. 17 a 22 da LGPD, você tem direito a:

• Confirmação e acesso: saber se tratamos seus dados e obter uma cópia
• Correção: corrigir dados incompletos, inexatos ou desatualizados
• Anonimização, bloqueio ou eliminação: de dados desnecessários ou tratados em desconformidade
• Portabilidade: receber seus dados em formato estruturado
• Eliminação: dos dados tratados com base no consentimento
• Informação: sobre com quem compartilhamos seus dados
• Revogação do consentimento: a qualquer momento, sem custo
• Revisão de decisões automatizadas: quando aplicável
• Oposição: ao tratamento baseado em legítimo interesse

Para exercer qualquer direito, envie sua solicitação para taxicombinado@gmail.com. Responderemos em até 15 dias úteis.`,
  },
  {
    title: '10. Segurança dos Dados',
    content: `Adotamos medidas técnicas e organizacionais para proteger seus dados:

• Comunicação criptografada via HTTPS/TLS
• Senhas armazenadas com hash bcrypt (fator de custo 12)
• Cookies de sessão com flags HttpOnly e SameSite
• Acesso ao banco de dados restrito por autenticação e rede privada
• Não armazenamos dados de pagamento (não processamos pagamentos)
• Auditorias periódicas de segurança

Em caso de incidente que afete seus direitos, notificaremos a ANPD e os titulares afetados conforme exigido pela LGPD.`,
  },
  {
    title: '11. Crianças e Adolescentes',
    content: `O Taxi Combinado não é direcionado a menores de 18 anos. Não coletamos intencionalmente dados pessoais de crianças ou adolescentes. Se identificarmos tal coleta, excluiremos os dados imediatamente.`,
  },
  {
    title: '12. Encarregado de Dados (DPO)',
    content: `Nosso Encarregado de Proteção de Dados (Data Protection Officer) está disponível para atender suas solicitações e dúvidas relacionadas à privacidade:

E-mail: taxicombinado@gmail.com
Assunto: [LGPD] — sua solicitação`,
  },
  {
    title: '13. Alterações nesta Política',
    content: `Podemos atualizar esta Política periodicamente. Alterações significativas serão comunicadas por e-mail (para usuários com conta) ou mediante destaque na interface do aplicativo, com antecedência mínima de 10 dias.

A data de "última atualização" no topo desta página sempre refletirá a versão mais recente.`,
  },
  {
    title: '14. Contato e Reclamações',
    content: `Para dúvidas, solicitações ou reclamações sobre privacidade:

E-mail: taxicombinado@gmail.com

Você também tem o direito de apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD): www.gov.br/anpd`,
  },
];

export default function PrivacidadePage() {
  return (
    <PageContainer>
      <div style={{ marginBottom: 24, paddingTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Link href="/" style={{ color: 'var(--gray-400)', fontSize: 13, textDecoration: 'none' }}>← Voltar</Link>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--ink)', lineHeight: 1.1 }}>Política de Privacidade</h1>
        <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>Última atualização: maio de 2025 · Versão 1.0 · Em conformidade com a LGPD (Lei 13.709/2018)</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <Link href="/termos" style={{ fontSize: 12, color: 'var(--gray-500)', textDecoration: 'underline' }}>Termos de Uso</Link>
          <span style={{ color: 'var(--gray-300)' }}>·</span>
          <Link href="/cookies" style={{ fontSize: 12, color: 'var(--gray-500)', textDecoration: 'underline' }}>Política de Cookies</Link>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sections.map((s) => (
          <div key={s.title} className="tc-card">
            <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)', marginBottom: 8 }}>{s.title}</div>
            <p style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.65, whiteSpace: 'pre-line' }}>{s.content}</p>
          </div>
        ))}
      </div>

      <div className="tc-card" style={{ marginTop: 10, background: 'var(--yellow-soft)', borderColor: '#FCEBA8' }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)', marginBottom: 4 }}>Exercer seus direitos (LGPD)</div>
        <p style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.5 }}>
          Envie um e-mail para{' '}
          <a href="mailto:taxicombinado@gmail.com" style={{ color: 'var(--ink)', fontWeight: 700 }}>taxicombinado@gmail.com</a>{' '}
          com o assunto <strong>[LGPD]</strong> e descrevendo sua solicitação. Responderemos em até 15 dias úteis.
        </p>
      </div>
    </PageContainer>
  );
}
