ROADMAP COMPLETO — TÁXI COMBINADO
Visão geral do produto, MVP e evolução futura

==================================================
1. VISÃO CENTRAL DO PRODUTO
==================================================

O Táxi Combinado não deve ser apenas uma calculadora.

A visão maior é criar uma plataforma para o ecossistema de táxi, começando pelo taxista e evoluindo para passageiros, parceiros e empresas.

O produto deve começar resolvendo uma dor simples:

“Quanto devo cobrar nessa corrida combinada sem sair no prejuízo?”

Mas pode evoluir para:

- calculadora de corrida combinada;
- controle de custos do taxista;
- metas mensais e diárias;
- registro de abastecimento;
- parceiros e benefícios;
- afiliados;
- taxistas listados;
- passageiros solicitando corrida;
- intermediação de corridas combinadas;
- comissão sobre corridas fechadas;
- motoristas pagando para aparecer;
- empresas, hotéis e clínicas solicitando motoristas;
- bot no WhatsApp;
- dados agregados de mercado;
- SEO e conteúdo;
- AdSense como receita complementar.

O posicionamento não deve ser:

“Mais um Uber/99.”

O posicionamento correto é:

“Plataforma para calcular, combinar e intermediar corridas de táxi com confiança.”

Ou:

“Ferramentas, corridas e benefícios para taxistas.”

Ou:

“Corridas combinadas com taxistas de confiança.”

==================================================
2. PRINCÍPIO ESTRATÉGICO
==================================================

O produto deve crescer em camadas.

Camada 1:
Taxista usa porque precisa calcular corrida e controlar lucro.

Camada 2:
Taxista volta porque acompanha custos, metas, combustível e histórico.

Camada 3:
Parceiros querem aparecer porque existe audiência de taxistas.

Camada 4:
Passageiros chegam para pedir corridas combinadas.

Camada 5:
Taxistas pagam para aparecer melhor ou receber oportunidades.

Camada 6:
Você intermedeia corridas e cobra comissão.

Camada 7:
Empresas, hotéis, clínicas e parceiros usam a rede.

Camada 8:
Dados agregados viram inteligência de mercado.

==================================================
3. RECEITAS POSSÍVEIS
==================================================

O sistema deve ter várias fontes de receita.

1. Comissão por corrida fechada
- Comissão inicial sugerida: 6%
- Mínimo por corrida: R$ 5
- Corridas premium podem ter 8% a 10%
- Exemplos premium:
  - aeroporto;
  - viagem longa;
  - executivo;
  - bilíngue;
  - carro blindado;
  - 7 lugares;
  - corrida com espera;
  - corrida para empresa.

2. Parceiros/anunciantes
Categorias:
- postos;
- oficinas;
- pneus;
- borracharias;
- lava-rápidos;
- seguros;
- proteção veicular;
- tag de pedágio;
- maquininhas;
- contabilidade;
- financiamento;
- rastreador;
- acessórios;
- lavagem;
- troca de óleo.

Planos sugeridos:
- Parceiro básico: R$ 99/mês;
- Parceiro destaque: R$ 199/mês;
- Parceiro premium: R$ 299+/mês.

3. Taxistas pagando para aparecer
Planos possíveis:
- Grátis: usa calculadora e aparece básico;
- Destaque: R$ 29/mês;
- Pro: R$ 49/mês;
- Premium: R$ 99/mês.

4. Afiliados
Exemplos:
- PneuStore;
- seguro;
- tag de pedágio;
- proteção veicular;
- maquininha;
- rastreador;
- financiamento;
- consórcio;
- aluguel de carro;
- peças e acessórios.

5. Passageiro
Futuramente:
- taxa de reserva;
- sinal para corrida agendada;
- taxa para corrida premium;
- taxa de urgência;
- taxa para motorista substituto.

6. Empresas, hotéis e clínicas
Possibilidades:
- mensalidade;
- comissão por corrida;
- plano white-label;
- painel próprio;
- relatório mensal.

7. AdSense
Uso apenas em páginas públicas e conteúdo SEO.
Não deve ser a receita principal.

==================================================
4. ARQUITETURA RECOMENDADA
==================================================

Como o projeto vai crescer bastante, usar arquitetura separada desde o início.

Frontend:
- Next.js;
- TypeScript;
- Tailwind;
- Vercel.

Backend:
- NestJS ou Fastify;
- TypeScript;
- Railway;
- Toda regra de negócio no backend.

Banco:
- PostgreSQL no Railway;
- Prisma ORM.

Futuro:
- workers;
- cron jobs;
- WhatsApp webhooks;
- relatórios mensais;
- painel admin;
- filas.

Regra importante:
O frontend não deve conter lógica sensível de negócio.
O frontend coleta dados e exibe resultado.
O backend valida, calcula, salva, registra eventos e retorna resposta.

Segurança:
- Não usar token em localStorage;
- Não usar token em sessionStorage;
- Visitante anônimo usa anonymous_id em cookie;
- anonymous_id não é autenticação;
- Se houver login futuro, usar cookie HttpOnly, Secure e SameSite;
- API keys ficam no backend;
- CORS restrito;
- validação com Zod/class-validator;
- rate limit;
- logs de erro;
- secrets em environment variables.

==================================================
5. MÓDULOS DO SISTEMA
==================================================

O sistema completo pode ser dividido nestes módulos:

1. Calculadora de corrida;
2. Histórico e rotas favoritas;
3. Controle de custos e metas;
4. Abastecimentos;
5. Parceiros e afiliados;
6. SEO e conteúdo;
7. Solicitação de corrida por passageiros;
8. Cadastro/listagem de taxistas;
9. Matching motorista x solicitação;
10. Admin de leads;
11. Controle de comissão;
12. Planos de destaque para taxistas;
13. Empresas, hotéis e clínicas;
14. Programa de indicação;
15. WhatsApp bot;
16. Avaliações e reputação;
17. Recibos, comprovantes e fechamento mensal;
18. Relatórios e dados agregados;
19. App/PWA futuro;
20. Expansão para outros nichos, como caminhoneiros.

==================================================
FASE 1 — MVP: CALCULADORA DE CORRIDA
==================================================

Objetivo:
Validar se taxistas usam a ferramenta para calcular corrida combinada.

Funcionalidades:

1. Calculadora manual
Campos:
- origem;
- destino;
- paradas extras;
- tipo de corrida:
  - só ida;
  - ida e volta;
  - ida com volta vazia;
- distância ida;
- distância volta;
- tempo estimado;
- pedágio ida;
- pedágio volta;
- estacionamento;
- outros custos.

2. Dados do carro
Campos:
- combustível;
- consumo em km/l;
- preço do combustível;
- custo extra por km;
- observação de custo.

3. Tarifa
Campos:
- bandeirada;
- valor por km;
- valor por minuto/hora parado;
- tipo de cobrança do tempo;
- multiplicador de bandeira.

4. Margem
Campos:
- margem desejada;
- valor mínimo pelo tempo do motorista;
- valor que o taxista pretende cobrar.

5. Resultado
Mostrar:
- custo combustível;
- custo pedágio;
- custo extra por km;
- outros custos;
- custo total;
- preço pelo modelo de tarifa;
- preço mínimo;
- preço recomendado;
- preço ideal;
- lucro estimado;
- margem;
- preço por km;
- custo por km;
- impacto da volta vazia.

6. Alertas
Exemplos:
- “Esse valor pode gerar prejuízo.”
- “Essa corrida considera volta vazia.”
- “Confira se existe pedágio no trajeto.”
- “Seu combustível representa uma parte alta do custo.”
- “O preço informado está abaixo do mínimo recomendado.”

7. WhatsApp
Botões:
- copiar orçamento;
- compartilhar no WhatsApp;
- nova simulação.

Texto:
“Olá! A corrida de [origem] até [destino] fica em R$ [valor]. O valor considera deslocamento, tempo de viagem e custos da corrida.”

8. Banco
Salvar toda cotação, mesmo sem login.

Tabelas:
- anonymous_sessions;
- quotes;
- quote_stops;
- quote_events.

Métricas:
- cotações por dia;
- taxistas únicos;
- cotações por taxista;
- preço médio;
- lucro médio;
- rotas mais simuladas;
- volta vazia;
- pedágio médio.

==================================================
FASE 2 — CONTROLE DE CUSTOS E METAS
==================================================

Objetivo:
Transformar o app em ferramenta de sobrevivência financeira do taxista.

Página:
/minha-meta

Campos:
- prestação do carro;
- seguro;
- proteção veicular;
- internet/celular;
- lavagem;
- manutenção;
- estacionamento;
- diária/aluguel do carro;
- outros custos fixos;
- lucro pessoal desejado;
- dias trabalhados por mês;
- horas trabalhadas por dia;
- km médio por mês.

Cálculos:
- custos fixos totais;
- gasto médio com combustível;
- meta mínima mensal;
- meta diária;
- meta por hora;
- meta por km.

Fórmulas:
custosFixos = soma dos custos fixos
metaMinimaMensal = custosFixos + combustivelMedioMensal + lucroDesejado
metaDiaria = metaMinimaMensal / diasTrabalhados
metaHora = metaDiaria / horasPorDia
metaKm = metaMinimaMensal / kmMedioMensal

Integração com calculadora:
Ao calcular corrida, mostrar:
- quanto representa da meta diária;
- se está acima/abaixo da meta por km;
- quanto faltaria para bater a meta do dia;
- quanto ajuda na meta mensal.

Exemplos:
“Essa corrida cobre 38% da sua meta diária.”
“Esse valor está abaixo da sua meta mínima por km.”
“Seu carro precisa faturar R$ 7.500/mês para não dar prejuízo.”

Tabelas:
- driver_monthly_costs;
- monthly_driver_summaries.

Métricas:
- taxistas com meta cadastrada;
- meta mensal média;
- custo fixo médio;
- meta diária média;
- meta por km média.

==================================================
FASE 3 — ABASTECIMENTOS E CONSUMO REAL
==================================================

Objetivo:
Calcular consumo real do carro e custo real por km.

Página:
/abastecimentos

Campos:
- data;
- km atual;
- tipo de combustível;
- litros abastecidos;
- valor total pago;
- preço por litro;
- posto;
- cidade/UF.

Cálculos:
- consumo médio real;
- custo por km com combustível;
- gasto mensal com combustível;
- km rodado estimado;
- preço médio do combustível;
- evolução do consumo.

Integração:
- usar consumo real na calculadora;
- sugerir atualização quando o consumo variar;
- mostrar parceiros de combustível;
- mostrar afiliados/parceiros relacionados.

Tabela:
- fuel_logs.

Métricas:
- abastecimentos cadastrados;
- combustível médio;
- custo por km;
- postos mais cadastrados;
- cidades de abastecimento.

==================================================
FASE 4 — HISTÓRICO, ROTAS FAVORITAS E RECORRÊNCIA
==================================================

Objetivo:
Fazer o taxista voltar.

Páginas:
/historico
/rotas-favoritas

Funcionalidades:

1. Histórico
Mostrar:
- origem;
- destino;
- data;
- preço recomendado;
- lucro;
- tipo de corrida;
- botão recalcular;
- botão copiar WhatsApp.

2. Rotas favoritas
Campos:
- nome da rota;
- origem;
- destino;
- paradas;
- pedágio padrão;
- tipo de corrida;
- observações.

3. Recalcular
Permitir recalcular com:
- novo combustível;
- novo pedágio;
- nova margem;
- nova distância;
- nova tarifa.

4. Resumo de uso
Mostrar:
- total de cotações;
- valor total cotado;
- lucro estimado total;
- média por corrida;
- rotas mais simuladas;
- possível prejuízo evitado.

Prejuízo evitado:
Se o taxista pretendia cobrar R$ 100 e o app recomendou R$ 130, registrar R$ 30 como prejuízo evitado.

Tabelas:
- favorite_routes;
- quote_events.

Métricas:
- rotas favoritadas;
- recálculos;
- histórico acessado;
- prejuízo evitado;
- recorrência.

==================================================
FASE 5 — PARCEIROS, AFILIADOS E BENEFÍCIOS
==================================================

Objetivo:
Monetizar sem cobrar diretamente do taxista no início.

Página:
/parceiros
/anuncie

Categorias:
- posto;
- oficina;
- troca de óleo;
- pneus;
- borracharia;
- lava-rápido;
- seguro;
- proteção veicular;
- tag de pedágio;
- maquininha;
- contabilidade;
- financiamento;
- rastreador;
- acessórios;
- peças;
- lavagem.

Funcionalidades:

1. Página de parceiros
Cada parceiro:
- nome;
- categoria;
- cidade/bairro;
- oferta;
- descrição;
- WhatsApp;
- site;
- selo de verificado;
- validade.

2. Parceiros contextuais
Mostrar dentro do fluxo:
- combustível alto → posto/cartão combustível;
- pedágio → tag de pedágio;
- distância alta → pneus/oficina;
- custos cadastrados → seguro/proteção;
- abastecimento → posto parceiro;
- meta ruim → redução de custos.

3. Afiliados
Exemplo:
- PneuStore.

Locais para afiliado:
- página de parceiros;
- página de custos;
- abastecimentos;
- resultado de corrida longa;
- artigos SEO.

4. Página anuncie
Campos:
- empresa;
- responsável;
- WhatsApp;
- e-mail;
- categoria;
- cidade;
- estado;
- mensagem.

5. Rastreamento
Criar:
- partner_impressions;
- partner_clicks;
- affiliate_clicks.

Placements:
- quote_result;
- partners_page;
- fuel_alert;
- toll_alert;
- costs_page;
- fuel_logs_page;
- home_banner;
- seo_article.

Modelos de receita:
- parceiro básico: R$ 99/mês;
- parceiro destaque: R$ 199/mês;
- premium: R$ 299+/mês;
- afiliado: comissão por venda.

Métricas:
- impressões;
- cliques;
- CTR;
- leads;
- WhatsApp clicks;
- afiliados clicados;
- categoria mais clicada.

==================================================
FASE 6 — SEO, CONTEÚDO E ADSENSE
==================================================

Objetivo:
Atrair tráfego orgânico e gerar receita complementar.

Páginas:
- Calculadora de corrida de táxi;
- Como calcular corrida combinada;
- Quanto cobrar em corrida de táxi;
- Quanto um taxista precisa faturar por dia;
- Como calcular custo por km;
- Como calcular lucro em corrida;
- Como calcular combustível da corrida;
- Quanto custa táxi para aeroporto;
- Custo de pneu para taxista;
- Controle de custos para taxista.

SEO local:
- Táxi São Paulo para Guarulhos;
- Táxi Congonhas para Guarulhos;
- Táxi São Paulo para Santos;
- Táxi para aeroporto com malas;
- Táxi para viagem com pet;
- Táxi 7 lugares em São Paulo;
- Táxi executivo em São Paulo.

AdSense:
- usar em páginas públicas;
- evitar no fluxo principal;
- receita complementar.

==================================================
FASE 7 — MODO PASSAGEIRO: SOLICITAR TAXISTA CONFIÁVEL
==================================================

Objetivo:
Validar demanda de passageiros sem virar Uber/99.

Página:
/encontrar-taxista

Home:
- Sou taxista;
- Sou passageiro.

Formulário passageiro:
- nome;
- WhatsApp;
- origem;
- destino;
- data;
- horário;
- tipo:
  - só ida;
  - ida e volta;
  - com espera;
- passageiros;
- malas;
- bagagem;
- observações.

Categorias especiais:
- pet;
- 7 lugares;
- muitas malas;
- bilíngue;
- blindado;
- executivo;
- aeroporto;
- madrugada;
- idoso;
- consulta médica;
- viagem longa;
- motorista mulher;
- cadeirinha;
- Pix;
- cartão;
- recibo.

Campos condicionais:
Pet:
- tipo;
- porte;
- vai com tutor?

Malas:
- quantidade.

Bilíngue:
- idioma.

Cadeirinha:
- idade da criança.

Resultado:
- salvar solicitação;
- mostrar faixa estimada;
- não prometer disponibilidade automática;
- dizer que um taxista entrará em contato.

Texto:
“Recebemos sua solicitação. Um taxista de confiança entrará em contato pelo WhatsApp para confirmar disponibilidade e valor final.”

Tabela:
- ride_requests;
- ride_request_capabilities.

Métricas:
- solicitações;
- categorias pedidas;
- rotas pedidas;
- taxa de fechamento;
- ticket médio.

==================================================
FASE 8 — TAXISTAS LISTADOS E MOTORISTAS CONFIÁVEIS
==================================================

Objetivo:
Criar uma base de taxistas que possam aparecer para passageiros e receber oportunidades.

Página:
/taxistas

Cadastro do taxista:
- nome;
- WhatsApp;
- cidade;
- estado;
- região;
- modelo do carro;
- cor;
- ano;
- lugares;
- capacidade de malas;
- idiomas;
- categorias atendidas;
- Pix;
- cartão;
- recibo;
- observações.

Capacidades:
- pets;
- seven_seats;
- bilingual;
- large_luggage;
- armored;
- airport;
- night;
- long_trip;
- executive;
- elderly;
- child_seat;
- female_driver;
- pix;
- card;
- receipt.

Listagem:
- nome;
- cidade;
- carro;
- categorias;
- botão solicitar orçamento;
- selo destaque;
- selo verificado futuro.

Planos:
Grátis:
- usa calculadora;
- aparece básico.

Destaque:
- R$ 29/mês;
- aparece melhor.

Pro:
- R$ 49/mês;
- perfil completo;
- destaque por região/categoria.

Premium:
- R$ 99/mês;
- prioridade em leads especiais.

Tabelas:
- trusted_drivers;
- driver_capabilities;
- trusted_driver_capabilities;
- driver_profiles;
- driver_plan_subscriptions.

Métricas:
- motoristas cadastrados;
- pagantes;
- visualizações;
- cliques no WhatsApp;
- categorias mais buscadas.

==================================================
FASE 9 — MATCHING DE CORRIDAS E MOTORISTAS
==================================================

Objetivo:
Sugerir motoristas compatíveis com cada solicitação.

Regras simples:
- mesma cidade/região;
- atende categoria solicitada;
- atende horário;
- aceita tipo de corrida;
- prioridade do plano;
- score futuro.

Score:
+30 atende todas as capacidades
+10 mesma região
+10 aceita horário
+10 plano premium
+5 boa avaliação
-20 recusou leads parecidos
-20 comissão pendente

Resultado no admin:
- motoristas compatíveis;
- score;
- capacidades atendidas;
- capacidades faltantes;
- botão enviar lead.

Tabela:
- ride_matches.

==================================================
FASE 10 — ADMIN DE LEADS E INTERMEDIAÇÃO
==================================================

Objetivo:
Controlar solicitação, motorista, status, fechamento e comissão.

Página:
/admin/solicitacoes

Mostrar:
- origem;
- destino;
- data;
- horário;
- passageiro;
- WhatsApp;
- categorias;
- estimativa;
- status;
- motorista;
- valor fechado;
- comissão;
- pagamento da comissão.

Status:
- new;
- sent_to_driver;
- driver_accepted;
- passenger_contacted;
- quoted;
- accepted;
- completed;
- canceled;
- commission_pending;
- commission_paid.

Ações:
- copiar mensagem para motorista;
- abrir WhatsApp do motorista;
- abrir WhatsApp do passageiro;
- atribuir motorista;
- alterar status;
- registrar valor fechado;
- registrar comissão;
- marcar comissão paga.

Mensagem para motorista:
“Nova solicitação:
Origem:
Destino:
Data/hora:
Passageiros:
Malas:
Necessidades:
Estimativa:
Passageiro:
WhatsApp:”

Mensagem para passageiro:
“Olá, recebi sua solicitação de corrida de [origem] para [destino]. Posso confirmar disponibilidade e valor por aqui.”

Tabela:
- ride_deals;
- ride_commissions.

==================================================
FASE 11 — COMISSÃO E MODELOS DE COBRANÇA
==================================================

Objetivo:
Garantir que você consiga “levar o seu”.

Modelo inicial:
- 6% sobre corrida fechada;
- mínimo R$ 5.

Modelo premium:
- viagens longas: 8%;
- executivo/bilíngue/blindado: 10%;
- lead exclusivo: taxa maior.

Controle:
- valor da corrida;
- motorista;
- passageiro;
- status;
- comissão;
- vencimento;
- pago/não pago;
- data de pagamento.

Possíveis modelos:
1. Comissão após fechamento;
2. Lead pago;
3. Créditos pré-pagos;
4. Mensalidade para destaque;
5. Taxa de reserva do passageiro.

Créditos:
- lead comum: 1 crédito;
- aeroporto: 2 créditos;
- viagem longa: 3 créditos;
- executivo: 5 créditos.

Futuro:
- Pix;
- Stripe;
- Mercado Pago;
- carteira de créditos.

Tabela:
- ride_commissions;
- driver_credit_wallets;
- driver_credit_transactions.

==================================================
FASE 12 — EMPRESAS, HOTÉIS, CLÍNICAS E CONDOMÍNIOS
==================================================

Objetivo:
Criar canais B2B de demanda.

Públicos:
- hotéis;
- pousadas;
- clínicas;
- hospitais;
- consultórios;
- laboratórios;
- empresas;
- escritórios;
- eventos;
- restaurantes;
- condomínios;
- portarias;
- agências de turismo.

Produto:
“Tenha uma rede de taxistas confiáveis para seus clientes, pacientes, hóspedes ou funcionários.”

Funcionalidades:
- página própria para parceiro;
- QR Code rastreável;
- solicitação de corrida;
- relatório mensal;
- comissão por corrida;
- motoristas preferidos.

Exemplos:
/hotel/nome-do-hotel
/clinica/nome-da-clinica
/condominio/nome

Receitas:
- mensalidade;
- comissão;
- taxa por lead;
- white-label.

Tabela:
- referral_partners;
- business_accounts;
- business_ride_requests.

==================================================
FASE 13 — PROGRAMA DE INDICAÇÃO
==================================================

Objetivo:
Fazer terceiros gerarem demanda.

Quem pode indicar:
- taxistas;
- passageiros;
- hotéis;
- clínicas;
- porteiros;
- condomínios;
- oficinas;
- parceiros;
- empresas.

Modelo:
- link próprio;
- QR Code;
- comissão por corrida fechada.

Exemplos:
/indicar/joao
/indicar/hotel-x
/indicar/porteiro-carlos

Campos:
- parceiro;
- tipo;
- comissão;
- status;
- total gerado.

Tabela:
- referral_partners;
- referral_clicks;
- referral_conversions;
- referral_commissions.

==================================================
FASE 14 — CORRIDAS ESPECIAIS E PACOTES
==================================================

Objetivo:
Fugir da corrida comum e focar em tickets maiores.

Categorias:
- aeroporto;
- pet;
- 7 lugares;
- muitas malas;
- bilíngue;
- blindado;
- executivo;
- idoso;
- consulta médica;
- casamento;
- evento;
- viagem curta;
- transfer;
- turismo;
- motorista por diária;
- mensalista.

Páginas específicas:
- Táxi para aeroporto;
- Táxi para pet;
- Táxi 7 lugares;
- Táxi executivo;
- Táxi para idoso;
- Táxi para consulta médica;
- Táxi para viagem;
- Transfer para Guarulhos;
- Transfer para Congonhas;
- Motorista por diária.

Precificação:
- pet: +10%;
- 7 lugares: +25%;
- bilíngue: +25%;
- executivo: +30%;
- blindado: sob consulta ou +100%;
- madrugada: +20%;
- muitas malas: +10%;
- espera: por hora.

==================================================
FASE 15 — AGENDA, CLIENTES RECORRENTES E FECHAMENTO
==================================================

Objetivo:
Ajudar taxistas que têm clientes próprios.

Funcionalidades:
- agenda de corridas;
- cliente recorrente;
- valores combinados anteriores;
- lembretes;
- status da corrida;
- fechamento mensal;
- recibo;
- comprovante.

Casos:
- empresa mensal;
- clínica;
- escola;
- idoso;
- aeroporto recorrente;
- cliente particular.

Tabelas:
- driver_customers;
- scheduled_rides;
- ride_receipts;
- monthly_billing_reports.

Receita:
- plano Pro para taxista;
- cobrança por recibo;
- mensalidade;
- comissão se veio da plataforma.

==================================================
FASE 16 — RECIBOS, COMPROVANTES E ORÇAMENTO PROFISSIONAL
==================================================

Objetivo:
Profissionalizar corrida combinada.

Funcionalidades:
- link de orçamento;
- comprovante da corrida;
- recibo simples;
- PDF;
- aceite do passageiro;
- valor combinado;
- observações;
- data/hora;
- motorista;
- status.

Exemplo:
“Corrida combinada confirmada:
Origem:
Destino:
Data:
Horário:
Valor:
Pedágio incluso:
Motorista:”

Tabela:
- ride_quotes_public;
- ride_receipts;
- ride_acceptances.

==================================================
FASE 17 — AVALIAÇÕES E REPUTAÇÃO
==================================================

Objetivo:
Criar confiança e priorizar bons motoristas.

Depois da corrida:
- passageiro avalia;
- motorista também pode avaliar passageiro.

Critérios:
- pontualidade;
- educação;
- limpeza;
- segurança;
- preço respeitado;
- comunicação.

Score do motorista:
- estrelas;
- corridas concluídas;
- taxa de aceite;
- taxa de cancelamento;
- comissões pagas;
- tempo de resposta.

Uso:
- ranking;
- prioridade de leads;
- selo confiável.

Tabelas:
- driver_reviews;
- passenger_reviews;
- driver_scores.

==================================================
FASE 18 — WHATSAPP BOT
==================================================

Objetivo:
Permitir cálculo e operação via WhatsApp.

Usar WhatsApp Cloud API oficial.

Fluxo taxista:
Mensagem:
“Moema para Guarulhos, volta vazia, gasolina 5,80, faz 9 por litro.”

Sistema:
- recebe webhook;
- IA extrai campos;
- backend valida;
- backend calcula;
- salva cotação;
- responde.

Resposta:
“Preço mínimo: R$ 125
Preço recomendado: R$ 170
Lucro estimado: R$ 78”

Comandos futuros:
- calcular corrida;
- registrar abastecimento;
- ver meta do dia;
- ver histórico;
- salvar rota;
- ver parceiros;
- aceitar lead;
- responder solicitação.

Importante:
IA não calcula.
IA interpreta.
Backend calcula.

Tabelas:
- whatsapp_contacts;
- whatsapp_messages;
- whatsapp_quote_sessions.

==================================================
FASE 19 — PAINEL DE DADOS E INTELIGÊNCIA
==================================================

Objetivo:
Transformar uso em inteligência.

Dados internos:
- cotações por dia;
- cidades;
- bairros;
- rotas;
- preço médio;
- custo médio;
- margem média;
- volta vazia;
- pedágio médio;
- combustível;
- meta média;
- custo fixo médio;
- parceiros clicados;
- categorias de passageiro.

Dados para parceiros:
Sempre agregados.

Exemplos:
- “Taxistas da região X simulam Y corridas por mês.”
- “Combustível médio informado: R$ X.”
- “Custo médio por km: R$ Y.”
- “Rotas para aeroporto têm maior ticket.”

Nunca vender:
- dados individuais;
- endereço exato de pessoa;
- histórico identificável.

Tabelas:
- daily_route_analytics;
- city_analytics;
- partner_reports;
- category_analytics.

==================================================
FASE 20 — APP/PWA
==================================================

Objetivo:
Melhorar acesso e recorrência.

Começar como web mobile.
Depois virar PWA.

PWA:
- ícone na tela inicial;
- manifest;
- cache básico;
- experiência de app;
- notificações futuras.

App Android:
Só depois de validar uso real.

Não começar com Android nativo.

==================================================
FASE 21 — EXPANSÃO PARA CAMINHONEIRO
==================================================

Objetivo:
Reaproveitar a lógica para outro público.

Produto futuro separado:
Calculadora de frete/lucro para caminhoneiro.

Dor:
“Esse frete compensa ou vou rodar no prejuízo?”

Funcionalidades:
- origem/destino;
- diesel;
- Arla;
- pedágio;
- pneus;
- manutenção;
- diária;
- financiamento;
- comissão/agenciador;
- volta vazia;
- frete retorno;
- lucro desejado;
- valor oferecido.

Resultado:
- custo total;
- frete mínimo;
- frete recomendado;
- lucro;
- ganho por km;
- ganho por dia;
- alerta de prejuízo.

Não começar agora.
Guardar como expansão futura.

==================================================
PRIORIDADE REAL DE IMPLEMENTAÇÃO
==================================================

Ordem recomendada:

1. Backend separado + banco;
2. Frontend mobile-first;
3. Calculadora manual;
4. Salvamento de cotações;
5. Histórico simples;
6. Parceiros básicos;
7. Impressões e cliques;
8. Página anuncie;
9. Controle de custos;
10. Metas mensais/diárias;
11. Abastecimentos;
12. Rotas favoritas;
13. Afiliado PneuStore;
14. Parceiros contextuais;
15. SEO/conteúdo;
16. Modo passageiro;
17. Cadastro/listagem de taxistas;
18. Admin de leads;
19. Comissão;
20. Programa de indicação;
21. Empresas/hotéis/clínicas;
22. Recibos e comprovantes;
23. Avaliações;
24. WhatsApp bot;
25. PWA;
26. Produto para caminhoneiro.

==================================================
O QUE NÃO FAZER AGORA
==================================================

Não implementar no MVP:
- app Android nativo;
- rastreamento em tempo real;
- taxímetro GPS;
- marketplace automático complexo;
- pagamento online complexo;
- login obrigatório;
- tabela oficial de tarifa por cidade;
- comparação automática com Uber/99;
- painel admin gigante;
- WhatsApp bot antes da calculadora validar;
- venda de dados individuais;
- scraping de WhatsApp;
- scraping de Uber/99;
- API de pedágio obrigatória no início.

==================================================
META DE R$ 5.000/MÊS
==================================================

Distribuição sugerida:

1. Corridas intermediadas:
Meta: R$ 2.500/mês

Com comissão de 6%:
Precisa movimentar R$ 41.666/mês em corridas.

Se ticket médio for R$ 200:
209 corridas/mês
aprox. 7 corridas/dia

2. Parceiros:
Meta: R$ 1.500/mês

Exemplo:
10 parceiros x R$ 99 = R$ 990
3 parceiros destaque x R$ 199 = R$ 597
Total: R$ 1.587

3. Taxistas destaque:
Meta: R$ 1.000/mês

Exemplo:
20 taxistas x R$ 49 = R$ 980

Total:
R$ 5.000/mês

==================================================
FOCO DO MVP
==================================================

O MVP deve provar 3 coisas:

1. Taxista usa para calcular corrida.
2. Taxista volta porque controla custos/metas.
3. Parceiros têm interesse porque há uso e cliques.

Fluxo principal:
Taxista entra
→ calcula corrida
→ vê preço mínimo, recomendado e lucro
→ salva cotação
→ compartilha no WhatsApp
→ vê parceiro relevante
→ cadastra custos
→ acompanha meta mensal/diária

Depois:
Passageiro entra
→ solicita taxista confiável
→ sistema indica motorista
→ corrida fecha
→ você recebe comissão

Frase central do produto:
“Calcule, combine e lucre mais com suas corridas de táxi.”