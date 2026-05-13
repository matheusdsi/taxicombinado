import { PageContainer } from '@/components/layout/PageContainer';
import Link from 'next/link';

export const metadata = {
  title: 'Termos de Uso — Taxi Combinado',
  description: 'Termos e condições de uso do aplicativo Taxi Combinado.',
};

const sections = [
  {
    title: '1. Aceitação dos Termos',
    content: `Ao acessar ou utilizar o Taxi Combinado ("Serviço"), você declara ter lido, compreendido e concordado com estes Termos de Uso ("Termos"). Se você não concordar com qualquer parte destes Termos, não utilize o Serviço.

O uso contínuo do Serviço após qualquer alteração nos Termos constitui aceitação das alterações. Recomendamos que você revise esta página periodicamente.`,
  },
  {
    title: '2. Descrição do Serviço',
    content: `O Taxi Combinado é uma ferramenta de apoio à precificação de corridas de táxi, desenvolvida para auxiliar taxistas a estimar o preço justo de corridas com base em:

• Parâmetros do veículo (consumo, combustível, desgaste)
• Tarifas municipais aplicáveis
• Custos operacionais informados pelo usuário (pedágios, estacionamento)
• Margem de lucro desejada
• Distância e duração estimadas via APIs de mapeamento

Os valores calculados são estimativas. O Taxi Combinado não é uma máquina de tarifa oficial e não substitui o taxímetro homologado. O preço final da corrida é de responsabilidade exclusiva do taxista e do passageiro.`,
  },
  {
    title: '3. Elegibilidade',
    content: `O Serviço destina-se a taxistas profissionais e pessoas com interesse em estimativas de custo de transporte. Ao utilizar o Serviço, você declara:

• Ter pelo menos 18 anos de idade
• Ter capacidade legal para celebrar contratos
• Utilizar o Serviço para fins legítimos e lícitos`,
  },
  {
    title: '4. Cadastro e Conta',
    content: `O uso básico do Taxi Combinado não requer cadastro. Para salvar seu histórico de cotações na nuvem e acessá-las em múltiplos dispositivos, você pode criar uma conta gratuita.

Ao criar uma conta, você é responsável por:
• Manter a confidencialidade da sua senha
• Todas as atividades realizadas com suas credenciais
• Notificar imediatamente sobre qualquer uso não autorizado

Reservamo-nos o direito de encerrar contas que violem estes Termos.`,
  },
  {
    title: '5. Uso Adequado',
    content: `Você concorda em não utilizar o Serviço para:

• Fins ilegais ou não autorizados
• Violar direitos de propriedade intelectual
• Transmitir vírus, malware ou código malicioso
• Tentar acessar sistemas, servidores ou dados não autorizados
• Scraping automatizado ou coleta de dados em escala
• Reproduzir, distribuir ou criar obras derivadas sem autorização expressa por escrito

Violações podem resultar em suspensão imediata do acesso sem aviso prévio.`,
  },
  {
    title: '6. Precisão das Informações',
    content: `As tarifas pré-configuradas refletem as tabelas oficiais vigentes no momento da implementação, mas podem estar desatualizadas. O usuário é responsável por verificar e ajustar os parâmetros conforme as tarifas atuais.

O Taxi Combinado:
• Não garante a precisão absoluta dos cálculos
• Não é responsável por divergências entre estimativas e valores reais
• Não constitui assessoria financeira, jurídica ou regulatória
• Recomenda sempre a conferência com órgãos reguladores (ex.: Prefeitura de SP, EMTU)`,
  },
  {
    title: '7. Propriedade Intelectual',
    content: `Todo o conteúdo do Taxi Combinado — incluindo mas não limitado a código-fonte, design, logotipos, textos, algoritmos de cálculo e interfaces — é de propriedade exclusiva do Taxi Combinado e protegido pelas leis de direitos autorais da República Federativa do Brasil (Lei 9.610/98) e tratados internacionais.

É expressamente proibida a reprodução, cópia, distribuição, modificação ou uso comercial sem autorização prévia e por escrito.`,
  },
  {
    title: '8. Privacidade e LGPD',
    content: `O tratamento de dados pessoais pelo Taxi Combinado está sujeito à nossa Política de Privacidade, disponível em /privacidade, e à Lei Geral de Proteção de Dados (Lei 13.709/2018 — LGPD).

Ao utilizar o Serviço, você consente com o tratamento de dados conforme descrito na Política de Privacidade.`,
  },
  {
    title: '9. Limitação de Responsabilidade',
    content: `Na máxima extensão permitida pela lei brasileira, o Taxi Combinado não se responsabiliza por:

• Perdas financeiras decorrentes do uso ou da impossibilidade de uso do Serviço
• Imprecisões nos cálculos ou valores estimados
• Danos indiretos, incidentais, especiais ou consequentes
• Interrupções, erros ou falhas no Serviço
• Atos de terceiros (passageiros, plataformas, órgãos reguladores)

O Serviço é fornecido "no estado em que se encontra" (as is), sem garantias expressas ou implícitas de adequação a uma finalidade específica.`,
  },
  {
    title: '10. Modificações no Serviço',
    content: `Reservamo-nos o direito de, a qualquer momento e sem aviso prévio:

• Modificar, suspender ou descontinuar qualquer funcionalidade do Serviço
• Alterar preços de planos futuros (caso venham a existir)
• Atualizar estes Termos

Alterações substanciais serão comunicadas por e-mail (quando aplicável) ou mediante destaque na interface do aplicativo.`,
  },
  {
    title: '11. Lei Aplicável e Foro',
    content: `Estes Termos são regidos pelas leis da República Federativa do Brasil. Para resolução de controvérsias, fica eleito o foro da Comarca de São Paulo/SP, com renúncia expressa a qualquer outro, por mais privilegiado que seja.`,
  },
  {
    title: '12. Contato',
    content: `Para dúvidas, sugestões ou exercício de direitos relacionados a estes Termos:

E-mail: taxicombinado@gmail.com

Responderemos em até 15 dias úteis.`,
  },
];

export default function TermosPage() {
  return (
    <PageContainer>
      <div style={{ marginBottom: 24, paddingTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Link href="/" style={{ color: 'var(--gray-400)', fontSize: 13, textDecoration: 'none' }}>← Voltar</Link>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--ink)', lineHeight: 1.1 }}>Termos de Uso</h1>
        <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>Última atualização: maio de 2025 · Versão 1.0</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <Link href="/privacidade" style={{ fontSize: 12, color: 'var(--gray-500)', textDecoration: 'underline' }}>Política de Privacidade</Link>
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
        <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)', marginBottom: 4 }}>Dúvidas ou solicitações?</div>
        <p style={{ fontSize: 13, color: 'var(--gray-600)' }}>
          Entre em contato pelo e-mail{' '}
          <a href="mailto:taxicombinado@gmail.com" style={{ color: 'var(--ink)', fontWeight: 700 }}>taxicombinado@gmail.com</a>.
          Responderemos em até 15 dias úteis.
        </p>
      </div>
    </PageContainer>
  );
}
