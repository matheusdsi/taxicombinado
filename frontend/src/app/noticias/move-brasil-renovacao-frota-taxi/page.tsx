import type { Metadata } from 'next';
import Link from 'next/link';
import { PageContainer } from '@/components/layout/PageContainer';

export const metadata: Metadata = {
  title: 'Move Brasil: credito para renovar taxi e carro de aplicativo | Taxi Combinado',
  description:
    'Entenda em linguagem simples o novo programa do Governo Federal que promete credito para taxistas e motoristas de aplicativo comprarem carro novo.',
  openGraph: {
    title: 'Move Brasil: credito para taxistas renovarem o carro',
    description:
      'Resumo simples do programa de ate R$ 30 bi em credito para taxistas e motoristas de aplicativo.',
    type: 'article',
    locale: 'pt_BR',
  },
};

const whoCanJoin = [
  'Taxista registrado e em atividade.',
  'Motorista de aplicativo com cadastro ativo ha pelo menos 12 meses.',
  'Motorista de app que fez no minimo 100 corridas no ultimo ano, na mesma plataforma.',
];

const steps = [
  {
    title: 'Entrar no gov.br/movebrasil',
    text: 'O pedido de elegibilidade deve ser feito na plataforma oficial do governo.',
  },
  {
    title: 'Autorizar a consulta dos dados',
    text: 'A ideia e validar as informacoes sem pedir papelada no comeco do processo.',
  },
  {
    title: 'Aguardar a resposta',
    text: 'O retorno deve chegar em ate 5 dias uteis pela caixa postal do gov.br.',
  },
  {
    title: 'Procurar o banco a partir de 19 de junho',
    text: 'Se estiver apto, o motorista escolhe um carro de ate R$ 150 mil e faz a analise de credito na instituicao financeira.',
  },
];

const appReasons = [
  'Guardar uma nocao real de quanto cada corrida precisa pagar.',
  'Comparar se uma corrida combinada cobre combustivel, pedagio e desgaste.',
  'Montar seu perfil publico para mandar aos passageiros no WhatsApp.',
];

export default function MoveBrasilNewsPage() {
  return (
    <PageContainer className="space-y-5">
      <article className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-card">
        <section className="bg-gray-950 px-5 py-6 text-white">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em]">
            <span className="rounded-full bg-taxi-500 px-3 py-1 text-gray-950">Noticia</span>
            <span className="text-gray-300">Publicado em 19/05/2026</span>
          </div>

          <h1 className="text-3xl font-black leading-tight">
            Governo anuncia credito para taxista trocar de carro
          </h1>

          <p className="mt-4 text-base font-semibold leading-relaxed text-gray-200">
            O programa Move Brasil promete ate R$ 30 bilhoes em financiamento com juros menores
            para taxistas e motoristas de aplicativo comprarem carro novo, mais economico e menos
            poluente.
          </p>

          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-white/10 px-2 py-3">
              <p className="text-lg font-black text-taxi-500">R$ 30 bi</p>
              <p className="text-[11px] font-bold text-gray-300">em credito</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-2 py-3">
              <p className="text-lg font-black text-taxi-500">R$ 150 mil</p>
              <p className="text-[11px] font-bold text-gray-300">valor maximo</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-2 py-3">
              <p className="text-lg font-black text-taxi-500">19/06</p>
              <p className="text-[11px] font-bold text-gray-300">busca por banco</p>
            </div>
          </div>
        </section>

        <section className="space-y-5 px-5 py-6">
          <div className="rounded-2xl border border-taxi-200 bg-taxi-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-taxi-800">
              Em poucas palavras
            </p>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-gray-800">
              Se voce trabalha com taxi ou aplicativo, o governo quer facilitar a compra de um
              carro novo. As regras finais de juros e prazo ainda dependem do Conselho Monetario
              Nacional, mas a Medida Provisoria ja abre o caminho para o financiamento.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-black text-gray-950">Quem pode tentar?</h2>
            <div className="space-y-2">
              {whoCanJoin.map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gray-950 text-xs font-black text-taxi-500">
                    ✓
                  </span>
                  <p className="text-sm font-semibold leading-relaxed text-gray-700">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-black text-gray-950">Que carro entra no programa?</h2>
            <p className="text-sm font-semibold leading-relaxed text-gray-700">
              O financiamento vale para carro novo de ate R$ 150 mil, desde que o modelo siga os
              criterios de sustentabilidade do programa. Entram veiculos flex, hibridos flex,
              eletricos ou movidos somente a etanol, de montadoras habilitadas no Mover.
            </p>
          </div>

          <div className="rounded-2xl bg-gray-950 p-4 text-white">
            <h2 className="text-xl font-black">Para mulher motorista pode ficar melhor</h2>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-gray-200">
              A MP permite que mulheres tenham condicoes mais favoraveis, como juros menores e
              prazos maiores. Tambem pode haver financiamento de equipamentos extras de seguranca.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-black text-gray-950">Passo a passo</h2>
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={step.title} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-taxi-500 text-sm font-black text-gray-950">
                      {index + 1}
                    </span>
                    {index < steps.length - 1 && <span className="mt-2 h-full w-px bg-gray-200" />}
                  </div>
                  <div className="pb-3">
                    <h3 className="text-sm font-black text-gray-900">{step.title}</h3>
                    <p className="mt-1 text-sm font-semibold leading-relaxed text-gray-600">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-xl font-black text-gray-950">Antes de financiar, faca conta</h2>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-gray-700">
              Carro novo ajuda, mas parcela tambem pesa. Use o Taxi Combinado para saber se suas
              corridas estao pagando combustivel, pedagio, tempo parado, manutencao e lucro.
            </p>

            <div className="mt-4 space-y-2">
              {appReasons.map((reason) => (
                <p key={reason} className="flex gap-2 text-sm font-bold text-gray-700">
                  <span className="text-taxi-700">•</span>
                  <span>{reason}</span>
                </p>
              ))}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link
                href="/"
                className="rounded-2xl bg-taxi-500 px-4 py-3 text-center text-sm font-black text-gray-950 shadow-result transition-colors hover:bg-taxi-600"
              >
                Calcular uma corrida agora
              </Link>
              <Link
                href="/meu-perfil"
                className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-center text-sm font-black text-gray-900 transition-colors hover:bg-gray-100"
              >
                Criar meu perfil publico
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/parceiros"
              className="rounded-2xl border border-gray-200 bg-gray-50 p-4 transition-colors hover:bg-white"
            >
              <p className="text-sm font-black text-gray-950">Ver parceiros</p>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-gray-600">
                Encontre descontos e contatos que podem ajudar no dia a dia do taxi.
              </p>
            </Link>
            <Link
              href="/minha-meta"
              className="rounded-2xl border border-gray-200 bg-gray-50 p-4 transition-colors hover:bg-white"
            >
              <p className="text-sm font-black text-gray-950">Planejar a meta</p>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-gray-600">
                Veja quanto precisa rodar para bater seu objetivo mensal.
              </p>
            </Link>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold leading-relaxed text-gray-500">
              Fonte: Governo do Brasil, noticia publicada em 19/05/2026. As taxas, prazos e bancos
              participantes dependem das regras finais do programa.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href="https://www.gov.br/planalto/pt-br/acompanhe-o-planalto/noticias/2026/05/governo-do-brasil-cria-programa-com-ate-r-30-bi-em-credito-para-motoristas-de-aplicativos-e-taxistas-financiarem-carro-novo"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-gray-200 px-3 py-2 text-xs font-black text-gray-700 hover:bg-gray-50"
              >
                Ler noticia oficial
              </a>
              <Link
                href="/"
                className="rounded-full border border-gray-200 px-3 py-2 text-xs font-black text-gray-700 hover:bg-gray-50"
              >
                Voltar para a home
              </Link>
            </div>
          </div>
        </section>
      </article>
    </PageContainer>
  );
}
