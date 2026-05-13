Essa ferramenta chama "Taxi combinado" é focada para taxi da cidade de são paulo, entao esses valores de bandeirada etc usam como pré set mas tem que permitir o taxista alterar ali na tela do calculo, o pré set tem que ser o valor do taxi comum mas deixar algo facil pro luxo tambem
para as categorias  Acessível, Comum, Comum-Rádio, Especial e Executivo: o valor da bandeirada é R$ 6,55, a tarifa quilométrica R$ 4,80 e a tarifa horária R$ 55,50.
Já para a categoria Luxo, o preço da  bandeirada  é de  R$ 9,83, a tarifa quilométrica R$ 7,20 e a tarifa horária R$ 83,25 
Bandeira 2: aos domingos e feriados ou no período entre 20h e 6h nos dias úteis, acréscimo de 30% (trinta por cento) na tarifa quilométrica para todas as categorias.

Você é um engenheiro full stack sênior e product engineer. Quero que você desenvolva a primeira versão de um produto web mobile-first chamado “Taxi combinado”.

==================================================
1. CONTEXTO DO PRODUTO
==================================================

O produto é uma calculadora de corrida combinada para taxistas.

A dor:
Taxistas muitas vezes dão preço de corrida combinada “no olho” e não sabem se estão tendo lucro ou prejuízo, principalmente quando existe volta vazia, pedágio, combustível caro, trânsito, paradas extras, tempo parado e custos reais do carro.

Objetivo:
Criar um site/app web mobile-first onde o taxista informa origem, destino, possíveis paradas, dados do carro e regras de cobrança, e o sistema calcula:

- distância estimada
- tempo estimado
- custo de combustível
- custo de pedágio
- custo extra por km
- custo total estimado
- preço mínimo para não sair no prejuízo
- preço recomendado
- preço ideal com boa margem
- lucro estimado
- margem estimada
- mensagem pronta para enviar no WhatsApp ao cliente

Além disso, todas as cotações devem ser salvas no banco de dados, mesmo sem login, porque esses dados serão um ativo estratégico do produto.

O usuário poderá usar sem cadastro.
Login/cadastro não é obrigatório.
Login só será necessário futuramente caso o usuário queira salvar histórico entre dispositivos ou recuperar suas cotações.

==================================================
2. PRINCÍPIO CENTRAL DO PRODUTO
==================================================

O produto não é apenas uma calculadora de rota.

Ele deve responder claramente para o taxista:

1. Quanto essa corrida vai me custar?
2. Qual o mínimo que eu posso cobrar?
3. Qual preço recomendado?
4. Quanto vai sobrar de lucro?
5. Vale a pena fazer essa corrida?
6. Estou cobrando barato demais?
7. A volta vazia está acabando com meu lucro?
8. O pedágio foi considerado?

A comunicação deve ser simples, direta e popular.

Evitar termos técnicos como:
- margem operacional líquida
- precificação dinâmica
- estrutura tarifária avançada
- custo marginal

Usar termos simples:
- custo
- lucro
- preço mínimo
- preço recomendado
- quanto sobra
- cuidado para não sair no prejuízo

==================================================
3. STACK TÉCNICA
==================================================

Usar preferencialmente:

- Vercel
- railway
- Next.js com App Router
- TypeScript
- Tailwind CSS
- React Hook Form
- Zod para validação
- banco PostgreSQL comum
- Prisma ou SQL ORM
- API Routes/Server Actions
- Arquitetura preparada para Google Routes API ou Mapbox Directions API
- Deploy preparado para Vercel ou similar

Importante:
- O site deve ser mobile-first.
- Deve funcionar muito bem no celular.
- Não precisa ser app Android nesta primeira versão.
- Estruturar pensando em virar PWA futuramente.

==================================================
4. REGRAS CRÍTICAS DE SEGURANÇA
==================================================

1. Não usar localStorage para tokens.
2. Não usar sessionStorage para tokens.
3. Não salvar token, refresh token ou credencial em localStorage/sessionStorage.
4. Se houver autenticação opcional no futuro, usar cookies HttpOnly, Secure e SameSite.
5. Sessão autenticada sempre via cookie seguro.
6. anonymous_id pode ser salvo em cookie comum não sensível, pois NÃO é token de autenticação.
7. Preferências simples não sensíveis podem ser salvas localmente, mas nunca credenciais.
8. Chaves de API de mapa devem ficar somente no backend.
9. Nunca expor chave sensível no frontend.
10. Toda chamada para API de rota deve passar pelo backend.
11. Validar dados no frontend e no backend.
12. Sanitizar entradas do usuário.
13. Não confiar em valores calculados no cliente.
14. O backend deve recalcular os valores antes de salvar a cotação.
15. Usar variáveis de ambiente para credenciais.
16. Não salvar dados desnecessários.
17. Não vender ou expor dados individuais.
18. Relatórios para parceiros devem usar apenas dados agregados.

==================================================
5. USO SEM LOGIN E IDENTIFICAÇÃO ANÔNIMA
==================================================

O usuário deve conseguir usar a calculadora sem criar conta.

Ao acessar o site, criar ou recuperar um anonymous_id.

Esse anonymous_id:
- deve ser UUID
- deve ser salvo em cookie comum não sensível
- não deve ser considerado autenticação
- não dá acesso a dados privados
- serve apenas para analytics, histórico local/anônimo e agrupamento de uso

Exemplo:
anonymous_id = "uuid-v4"

Cookie:
- nome: pct_anonymous_id
- SameSite=Lax
- Secure em produção
- expiração longa, por exemplo 180 ou 365 dias
- NÃO HttpOnly obrigatório, pois não é token de auth, mas pode ser HttpOnly se o backend gerenciar tudo

Importante:
Mesmo sem login, cada cotação deve ser salva no banco vinculada ao anonymous_id.

Futuramente, se o usuário criar conta, poderemos vincular cotações antigas ao user_id.

==================================================
6. PRIVACIDADE E USO DOS DADOS
==================================================

Os dados das cotações são valiosos para gerar inteligência de mercado, mas devem ser tratados com cuidado.

Objetivo dos dados:
- melhorar o produto
- entender padrões de corridas combinadas
- gerar estatísticas agregadas
- identificar rotas, regiões, custos e oportunidades
- criar relatórios para parceiros
- medir interesse por cidade, bairro, combustível e tipo de corrida

Dados individuais não devem ser vendidos ou expostos.

Dados para parceiros devem ser agregados.

Exemplo de dado que pode ser vendido/mostrado:
“Na região de Campinas/SP, as simulações de corrida para aeroporto têm distância média de X km, preço médio de R$ Y e margem média de Z%.”

Exemplo de dado que NÃO deve ser vendido/mostrado:
“Um taxista específico saiu da Rua X para Rua Y às 18h e cobrou R$ Z.”

Endereços e coordenadas:
- Para uso operacional, pode salvar origem/destino digitados.
- Para analytics, preferir bairro, cidade e UF.
- Se salvar coordenadas, salvar coordenadas arredondadas.
- Evitar usar coordenadas exatas em relatórios.
- Criar colunas separadas para dado bruto e dado normalizado/agregado.

Criar uma página de Política de Privacidade simples:
Rota: /privacidade

Ela deve informar:
- que o usuário pode usar sem cadastro
- que as simulações são salvas para melhorar o serviço
- que dados podem gerar estatísticas agregadas
- que dados individuais não serão vendidos
- que não é necessário informar placa, CPF ou dados sensíveis
- que o usuário pode solicitar exclusão futura dos dados
- que os valores são estimativas

Criar uma mensagem simples de consentimento/cookies:
“Usamos dados das simulações para calcular corridas, melhorar o serviço e gerar estatísticas agregadas sobre custos e deslocamentos de táxi. Não vendemos dados individuais de motoristas ou passageiros.”

Botões:
- Entendi
- Ver política de privacidade

==================================================
7. BANCO DE DADOS — MODELO COMPLETO
==================================================

Criar estrutura de banco pensando em PostgreSQL.

Pode usar Prisma schema ou SQL migrations.

Tabelas principais:

--------------------------------------------------
7.1 users
--------------------------------------------------

Usuários cadastrados futuramente. Não é obrigatório no MVP, mas deixar preparado.

Campos:
- id UUID primary key
- name text nullable
- email text unique nullable
- phone text nullable
- password_hash text nullable, se auth própria for usada futuramente
- created_at timestamp
- updated_at timestamp

Observação:
Não implementar login obrigatório agora.
Pode deixar a tabela preparada.

--------------------------------------------------
7.2 anonymous_sessions
--------------------------------------------------

Representa visitantes anônimos.

Campos:
- id UUID primary key
- anonymous_id UUID unique not null
- user_id UUID nullable references users(id)
- first_seen_at timestamp
- last_seen_at timestamp
- user_agent_hash text nullable
- ip_hash text nullable
- approximate_city text nullable
- approximate_state text nullable
- approximate_country text nullable
- created_at timestamp
- updated_at timestamp

Importante:
- Não salvar IP puro se não for necessário.
- Se quiser registrar IP, salvar hash ou usar apenas para segurança/log temporário.
- user_agent_hash deve ser hash, não necessariamente o user agent completo.

--------------------------------------------------
7.3 vehicles
--------------------------------------------------

Configurações de veículo do usuário ou visitante anônimo.

Campos:
- id UUID primary key
- user_id UUID nullable references users(id)
- anonymous_id UUID nullable
- vehicle_name text nullable
- fuel_type text not null
  Valores sugeridos:
  gasoline
  ethanol
  gnv
  diesel
  hybrid
  electric
  other
- consumption_km_per_liter numeric nullable
- electricity_kwh_per_km numeric nullable
- cost_per_km numeric nullable
- created_at timestamp
- updated_at timestamp

Observação:
No MVP, focar em combustível por km/l.
Elétrico pode ficar preparado para o futuro.

--------------------------------------------------
7.4 taxi_fare_profiles
--------------------------------------------------

Configuração de tarifa do taxista.

Campos:
- id UUID primary key
- user_id UUID nullable references users(id)
- anonymous_id UUID nullable
- profile_name text nullable
- city text nullable
- state text nullable
- base_fare numeric not null default 0
- price_per_km numeric not null default 0
- waiting_price numeric not null default 0
- waiting_charge_type text not null default 'minute'
  Valores:
  minute
  hour
- flag_name text nullable
  Exemplo:
  Bandeira 1
  Bandeira 2
  Personalizada
- flag_multiplier numeric not null default 1
- default_margin_percent numeric not null default 30
- default_driver_minimum_value numeric not null default 0
- default_consider_empty_return boolean default false
- created_at timestamp
- updated_at timestamp

--------------------------------------------------
7.5 quotes
--------------------------------------------------

Tabela principal de cotações/simulações.

Campos:
- id UUID primary key
- user_id UUID nullable references users(id)
- anonymous_id UUID nullable
- session_id UUID nullable references anonymous_sessions(id)

Dados de rota digitados:
- origin_text text nullable
- destination_text text nullable
- origin_place_id text nullable
- destination_place_id text nullable

Dados normalizados:
- origin_neighborhood text nullable
- origin_city text nullable
- origin_state text nullable
- origin_country text nullable
- destination_neighborhood text nullable
- destination_city text nullable
- destination_state text nullable
- destination_country text nullable

Coordenadas arredondadas:
- origin_lat_rounded numeric nullable
- origin_lng_rounded numeric nullable
- destination_lat_rounded numeric nullable
- destination_lng_rounded numeric nullable

Dados de rota:
- route_mode text not null
  Valores:
  automatic
  manual
- map_provider text nullable
  Valores:
  google
  mapbox
  manual
- distance_km numeric not null
- return_distance_km numeric nullable
- total_distance_km numeric not null
- duration_minutes numeric not null
- estimated_waiting_minutes numeric nullable

Tipo de corrida:
- trip_type text not null
  Valores:
  one_way
  round_trip
  empty_return
- has_stops boolean default false
- has_empty_return boolean default false

Dados do carro:
- fuel_type text nullable
- fuel_price_per_liter numeric nullable
- consumption_km_per_liter numeric nullable
- vehicle_extra_cost_per_km numeric nullable

Dados de tarifa:
- base_fare numeric not null default 0
- price_per_km numeric not null default 0
- waiting_price numeric not null default 0
- waiting_charge_type text not null default 'minute'
- flag_multiplier numeric not null default 1

Custos:
- fuel_cost numeric not null default 0
- vehicle_extra_cost numeric not null default 0
- toll_outbound numeric not null default 0
- toll_return numeric not null default 0
- toll_total numeric not null default 0
- parking_cost numeric not null default 0
- extra_costs numeric not null default 0
- total_cost numeric not null default 0

Preço:
- fare_price numeric not null default 0
- minimum_price numeric not null default 0
- recommended_price numeric not null default 0
- ideal_price numeric not null default 0
- custom_charged_price numeric nullable

Lucro:
- estimated_profit_recommended numeric not null default 0
- estimated_margin_recommended numeric not null default 0
- estimated_profit_custom numeric nullable
- estimated_margin_custom numeric nullable

Parâmetros:
- desired_margin_percent numeric not null default 30
- driver_minimum_value numeric not null default 0

Metadados:
- source text not null default 'web'
- device_type text nullable
- user_agent_hash text nullable
- ip_hash text nullable
- created_at timestamp
- updated_at timestamp

Importante:
O backend deve calcular e salvar todos os campos finais.
O frontend pode calcular para UX, mas o backend é a fonte confiável.

--------------------------------------------------
7.6 quote_stops
--------------------------------------------------

Paradas intermediárias.

Campos:
- id UUID primary key
- quote_id UUID references quotes(id) on delete cascade
- stop_order integer not null
- stop_text text nullable
- stop_place_id text nullable
- stop_neighborhood text nullable
- stop_city text nullable
- stop_state text nullable
- stop_country text nullable
- stop_lat_rounded numeric nullable
- stop_lng_rounded numeric nullable
- created_at timestamp

--------------------------------------------------
7.7 quote_events
--------------------------------------------------

Eventos de interação com a cotação.

Campos:
- id UUID primary key
- quote_id UUID nullable references quotes(id) on delete cascade
- anonymous_id UUID nullable
- user_id UUID nullable references users(id)
- event_type text not null
  Exemplos:
  quote_calculated
  whatsapp_copied
  whatsapp_shared
  quote_saved
  quote_recalculated
  partner_clicked_after_quote
- event_metadata jsonb nullable
- created_at timestamp

Isso será útil para entender comportamento.

--------------------------------------------------
7.8 partners
--------------------------------------------------

Parceiros comerciais.

Campos:
- id UUID primary key
- name text not null
- slug text unique nullable
- category text not null
  Valores sugeridos:
  fuel_station
  mechanic
  oil_change
  tire_shop
  car_wash
  insurance
  vehicle_protection
  toll_tag
  card_machine
  accounting
  accessories
  financing
  other
- description text nullable
- offer_title text nullable
- offer_description text nullable
- whatsapp text nullable
- phone text nullable
- website_url text nullable
- address text nullable
- neighborhood text nullable
- city text nullable
- state text nullable
- country text default 'BR'
- lat_rounded numeric nullable
- lng_rounded numeric nullable
- is_verified boolean default false
- is_featured boolean default false
- active boolean default true
- starts_at timestamp nullable
- ends_at timestamp nullable
- created_at timestamp
- updated_at timestamp

--------------------------------------------------
7.9 partner_clicks
--------------------------------------------------

Cliques em parceiros.

Campos:
- id UUID primary key
- partner_id UUID references partners(id)
- quote_id UUID nullable references quotes(id)
- anonymous_id UUID nullable
- user_id UUID nullable references users(id)
- click_type text not null
  Exemplos:
  whatsapp
  phone
  details
  website
- city text nullable
- state text nullable
- created_at timestamp

--------------------------------------------------
7.10 partner_leads
--------------------------------------------------

Empresas interessadas em anunciar.

Campos:
- id UUID primary key
- business_name text nullable
- contact_name text nullable
- whatsapp text nullable
- email text nullable
- category text nullable
- city text nullable
- state text nullable
- message text nullable
- source text default 'anuncie_page'
- created_at timestamp

--------------------------------------------------
7.11 daily_route_analytics
--------------------------------------------------

Tabela agregada diária para analytics.

Campos:
- id UUID primary key
- date date not null
- origin_city text nullable
- origin_state text nullable
- origin_neighborhood text nullable
- destination_city text nullable
- destination_state text nullable
- destination_neighborhood text nullable
- trip_type text nullable
- fuel_type text nullable
- total_quotes integer not null default 0
- avg_distance_km numeric nullable
- avg_duration_minutes numeric nullable
- avg_total_cost numeric nullable
- avg_recommended_price numeric nullable
- avg_price_per_km numeric nullable
- avg_profit numeric nullable
- avg_margin numeric nullable
- avg_fuel_price numeric nullable
- avg_consumption_km_per_liter numeric nullable
- percent_empty_return numeric nullable
- avg_toll_total numeric nullable
- created_at timestamp
- updated_at timestamp

Pode ser preenchida futuramente por cron job.
No MVP, deixar migration/model preparado.

--------------------------------------------------
7.12 city_analytics
--------------------------------------------------

Resumo por cidade.

Campos:
- id UUID primary key
- date date not null
- city text not null
- state text nullable
- total_quotes integer not null default 0
- unique_anonymous_users integer nullable
- avg_distance_km numeric nullable
- avg_recommended_price numeric nullable
- avg_profit numeric nullable
- avg_margin numeric nullable
- most_used_fuel_type text nullable
- created_at timestamp
- updated_at timestamp

--------------------------------------------------
7.13 app_feedback
--------------------------------------------------

Feedback dos taxistas.

Campos:
- id UUID primary key
- user_id UUID nullable
- anonymous_id UUID nullable
- quote_id UUID nullable references quotes(id)
- rating integer nullable
- feedback_text text nullable
- created_at timestamp

==================================================
8. ÍNDICES RECOMENDADOS
==================================================

Criar índices para:

quotes:
- created_at
- anonymous_id
- user_id
- origin_city, origin_state
- destination_city, destination_state
- trip_type
- fuel_type
- recommended_price
- total_distance_km

partner_clicks:
- partner_id
- created_at
- city, state

partners:
- category
- city, state
- active
- is_featured

daily_route_analytics:
- date
- origin_city, origin_state
- destination_city, destination_state

==================================================
9. PÁGINAS DO PRODUTO
==================================================

Criar as seguintes páginas:

--------------------------------------------------
9.1 Página principal — Calculadora
Rota: /
--------------------------------------------------

Essa é a tela principal do produto.

Header:
Nome:
Preço Certo Táxi

Subtítulo:
“Calcule quanto cobrar em corridas combinadas sem sair no prejuízo.”

CTA:
“Calcular corrida”

Formulário dividido em etapas ou cards.

Seção 1 — Rota

Campos:
- Origem
- Destino
- Paradas extras, opcional
- Botão “Adicionar parada”
- Tipo de corrida:
  - Só ida
  - Ida e volta
  - Ida com volta vazia
- Modo de cálculo:
  - Automático por mapa/API
  - Manual

Modo automático:
- origem, destino e paradas são enviadas ao backend
- backend chama provider de mapa
- retorna distância, tempo e, futuramente, pedágio

Modo manual:
- distância da ida em km
- distância da volta em km, opcional
- distância total considerada em km
- tempo estimado em minutos

Seção 2 — Dados do carro

Campos:
- Consumo médio do carro em km/l
- Preço do combustível por litro
- Tipo de combustível:
  - Gasolina
  - Etanol
  - GNV
  - Diesel
  - Híbrido
  - Elétrico
  - Outro
- Custo extra por km, opcional

Ajuda do campo custo extra por km:
“Use para considerar desgaste, pneu, óleo e manutenção. Se não souber, deixe em branco.”

Seção 3 — Tarifa do táxi

Campos:
- Bandeirada
- Valor por km rodado
- Valor por minuto parado ou por hora parada
- Tipo de cobrança do tempo:
  - Por minuto
  - Por hora
- Bandeira:
  - Bandeira 1
  - Bandeira 2
  - Personalizada
- Multiplicador da bandeira
  Exemplo:
  Bandeira 1 = 1
  Bandeira 2 = 1.2

Observação:
Não tentar usar tabela oficial por cidade no MVP.
Cada taxista configura os próprios valores.

Seção 4 — Custos extras

Campos:
- Pedágio de ida
- Pedágio de volta
- Estacionamento
- Outras taxas/custos
- Observação interna da cotação, opcional

Seção 5 — Margem e preço desejado

Campos:
- Margem desejada em %
- Valor mínimo pelo tempo do motorista, opcional
- Valor que pretendo cobrar, opcional

Botão:
“Calcular corrida”

Ao calcular:
- enviar dados para POST /api/quote/calculate
- backend calcula
- backend salva no banco
- frontend mostra resultado

--------------------------------------------------
9.2 Resultado da cotação
--------------------------------------------------

Depois do cálculo, mostrar um card premium.

Resumo:
- distância considerada
- tempo estimado
- tipo de corrida
- origem
- destino
- paradas, se houver

Custos:
- custo combustível
- custo por desgaste/manutenção
- custo pedágio
- outros custos
- custo total estimado

Preço:
- preço pelo modelo de tarifa
- preço mínimo para não sair no prejuízo
- preço recomendado
- preço ideal com margem
- valor que o taxista pretende cobrar, se informado

Lucro:
- lucro estimado no preço recomendado
- margem estimada no preço recomendado
- lucro no preço informado, se houver
- margem no preço informado, se houver

Destaque principal:
Preço recomendado deve ser o número mais visível da tela.

Exemplo:
“Preço recomendado: R$ 125,00”

Alertas inteligentes:

Se lucro for baixo:
“Atenção: essa corrida tem lucro baixo. Considere aumentar o valor.”

Se preço informado for menor que o mínimo:
“Esse valor pode gerar prejuízo.”

Se volta vazia estiver ativada:
“Essa simulação considera volta vazia. Isso aumenta bastante o custo real.”

Se pedágio estiver zerado:
“Confira se existe pedágio no trajeto. Pedágio não informado pode reduzir seu lucro.”

Se consumo estiver muito baixo ou muito alto:
“Confira se o consumo do carro foi preenchido corretamente.”

Se margem for alta:
“Preço com boa margem, mas avalie se o cliente aceitará esse valor.”

Botões:
1. Copiar orçamento
2. Compartilhar no WhatsApp
3. Nova simulação
4. Salvar cotação, se login existir futuramente
5. Enviar feedback sobre cálculo

Texto de WhatsApp:

“Olá! A corrida de [origem] até [destino] fica em R$ [preço recomendado].

O valor considera deslocamento, tempo de viagem e custos da corrida.

Se quiser, posso confirmar a disponibilidade.”

Se houver paradas:
“com parada em [paradas]”

Se houver pedágio:
“O valor considera os pedágios informados.”

--------------------------------------------------
9.3 Página de configurações
Rota: /configuracoes
--------------------------------------------------

Objetivo:
Permitir que o taxista configure padrões para não preencher tudo de novo.

Campos:
- Nome do motorista, opcional
- Cidade
- Estado
- Consumo padrão do carro
- Tipo de combustível padrão
- Preço padrão do combustível
- Bandeirada padrão
- Valor por km padrão
- Valor por minuto/hora parado padrão
- Custo extra por km padrão
- Margem desejada padrão
- Considerar volta vazia por padrão

Sem login:
- salvar preferências simples localmente e/ou no banco vinculadas ao anonymous_id
- nunca salvar token em localStorage
- preferências não sensíveis podem ser salvas no navegador
- também pode salvar no banco vinculadas ao anonymous_id

--------------------------------------------------
9.4 Página de histórico
Rota: /historico
--------------------------------------------------

Objetivo:
Mostrar últimas cotações do visitante.

Sem login:
- buscar últimas cotações pelo anonymous_id
- mostrar apenas no mesmo dispositivo/navegador
- permitir abrir cotação
- permitir recalcular
- permitir copiar mensagem novamente

Texto:
“Seu histórico fica vinculado a este aparelho/navegador. Em breve você poderá criar uma conta para acessar de qualquer lugar.”

Card da cotação:
- origem → destino
- data
- distância
- preço recomendado
- lucro estimado
- botão ver detalhes
- botão copiar WhatsApp

Importante:
- Não expor histórico de outro usuário.
- anonymous_id não é autenticação forte, então não mostrar dados extremamente sensíveis.
- Para o MVP, tudo bem mostrar as próprias cotações do cookie atual.

--------------------------------------------------
9.5 Página de parceiros
Rota: /parceiros
--------------------------------------------------

Objetivo:
Monetização indireta.

Título:
“Benefícios para Taxistas”

Subtítulo:
“Encontre descontos e serviços úteis para economizar no dia a dia.”

Categorias:
- Postos de combustível
- Oficinas
- Troca de óleo
- Borracharia
- Pneus
- Lava-rápido
- Seguro/proteção veicular
- Tag de pedágio
- Maquininhas
- Contabilidade/MEI
- Acessórios para carro
- Financiamento
- Outros

Cada card:
- nome do parceiro
- categoria
- bairro/cidade
- oferta
- descrição curta
- botão “Chamar no WhatsApp”
- botão “Ver detalhes”
- selo “Parceiro verificado”, opcional
- validade da oferta, opcional

Ao clicar:
- registrar partner_clicks no banco
- abrir WhatsApp ou detalhe

Criar dados mockados ou seed inicial no banco.

CTA para empresas:
“Quer anunciar para taxistas?”
Texto:
“Se você tem posto, oficina, lava-rápido, seguro, pneus ou serviços para motoristas, anuncie aqui.”
Botão:
“Quero ser parceiro”

--------------------------------------------------
9.6 Página anuncie
Rota: /anuncie
--------------------------------------------------

Objetivo:
Captar parceiros.

Título:
“Anuncie para taxistas da sua região”

Texto:
“Taxistas compram combustível, fazem manutenção, trocam pneus, usam lava-rápido e contratam serviços todos os meses. Apareça para motoristas no momento certo.”

Blocos de valor:
- Apareça para motoristas ativos
- Divulgue descontos e ofertas
- Receba contatos pelo WhatsApp
- Entenda demanda por região

Formulário:
- Nome da empresa
- Nome do responsável
- WhatsApp
- E-mail
- Categoria
- Cidade
- Estado
- Mensagem

Ao enviar:
- salvar em partner_leads
- mostrar sucesso
- botão para chamar no WhatsApp

Planos apenas visuais:
- Básico: aparecer na lista
- Destaque: aparecer no topo da categoria
- Oferta: card com cupom ou benefício exclusivo

Não implementar pagamento agora.

--------------------------------------------------
9.7 Página sobre
Rota: /sobre
--------------------------------------------------

Explicar:
- o que é o Preço Certo Táxi
- para quem é
- como funciona
- que os valores são estimativas
- que cada cidade pode ter tarifa diferente
- que o taxista deve conferir rota, pedágio e trânsito

--------------------------------------------------
9.8 Página política de privacidade
Rota: /privacidade
--------------------------------------------------

Explicar de forma simples:
- uso sem cadastro
- uso de cookies
- uso de anonymous_id
- salvamento das cotações
- uso dos dados para estatísticas agregadas
- não venda de dados individuais
- possibilidade futura de exclusão de dados
- contato para dúvidas

--------------------------------------------------
9.9 Página termos de uso
Rota: /termos
--------------------------------------------------

Explicar:
- cálculo é estimativo
- o app não substitui taxímetro oficial
- o taxista é responsável pelo valor combinado
- pedágio e rota devem ser conferidos
- valores podem variar conforme trânsito e cidade

==================================================
10. LÓGICA DE CÁLCULO
==================================================

Criar função isolada:

src/lib/calculateTaxiQuote.ts

Ela deve ser testável e não depender de React.

Inputs:

- distanceKm
- returnDistanceKm
- totalDistanceKm
- estimatedMinutes
- estimatedWaitingMinutes
- tripType
- consumptionKmPerLiter
- fuelPricePerLiter
- fuelType
- baseFare
- pricePerKm
- waitingPrice
- waitingChargeType
- flagMultiplier
- tollOutbound
- tollReturn
- parkingCost
- extraCosts
- vehicleExtraCostPerKm
- desiredMarginPercent
- driverMinimumValue
- customChargedPrice

Regras:

1. Distância considerada

Se tripType = one_way:
totalDistanceKm = distanceKm

Se tripType = round_trip:
totalDistanceKm = distanceKm + returnDistanceKm

Se tripType = empty_return:
totalDistanceKm = distanceKm + returnDistanceKm
hasEmptyReturn = true

Se returnDistanceKm não for informado:
em round_trip ou empty_return, considerar returnDistanceKm = distanceKm

2. Combustível

litersUsed = totalDistanceKm / consumptionKmPerLiter

fuelCost = litersUsed * fuelPricePerLiter

Se consumptionKmPerLiter <= 0:
retornar erro de validação.

3. Custo extra por km

vehicleExtraCost = totalDistanceKm * vehicleExtraCostPerKm

Se vehicleExtraCostPerKm vazio:
considerar 0.

4. Pedágio

tollTotal = tollOutbound + tollReturn

5. Outros custos

otherCosts = parkingCost + extraCosts

6. Custo total

totalCost = fuelCost + vehicleExtraCost + tollTotal + otherCosts

7. Cobrança por tempo

Se estimatedWaitingMinutes existir:
usar estimatedWaitingMinutes para taxa de tempo parado.

Se não existir:
pode usar estimatedMinutes como aproximação simples, mas deixar isso claro.

Se waitingChargeType = minute:
timeCharge = estimatedMinutes * waitingPrice

Se waitingChargeType = hour:
timeCharge = (estimatedMinutes / 60) * waitingPrice

8. Tarifa estimada

farePrice = (baseFare + (distanceKm * pricePerKm) + timeCharge) * flagMultiplier

Observação:
- Usar distanceKm para tarifa principal.
- Usar totalDistanceKm para custo real.
- Isso permite considerar volta vazia no custo, mas não cobrar como km direto se o taxista não quiser.

9. Preço mínimo

minimumPrice = totalCost + driverMinimumValue

10. Preço recomendado

priceWithMargin = totalCost / (1 - desiredMarginPercent / 100)

Se desiredMarginPercent >= 90:
limitar ou validar para evitar distorção.

recommendedPrice = max(farePrice, priceWithMargin, minimumPrice)

11. Preço ideal

idealPrice = recommendedPrice * 1.15

12. Lucro

estimatedProfitRecommended = recommendedPrice - totalCost

estimatedMarginRecommended = estimatedProfitRecommended / recommendedPrice * 100

Se customChargedPrice existir:
estimatedProfitCustom = customChargedPrice - totalCost
estimatedMarginCustom = estimatedProfitCustom / customChargedPrice * 100

13. Preço por km

pricePerKmRecommended = recommendedPrice / distanceKm

costPerKmTotal = totalCost / totalDistanceKm

14. Arredondamento

Valores monetários:
- calcular com precisão
- exibir com 2 casas decimais
- armazenar numeric no banco

15. Alertas

Gerar array de alerts:

- low_profit
- negative_profit
- custom_price_below_minimum
- empty_return_enabled
- toll_missing
- high_fuel_cost
- invalid_consumption
- high_margin
- check_route

==================================================
11. API ROUTES
==================================================

--------------------------------------------------
POST /api/quote/calculate
--------------------------------------------------

Recebe os dados do formulário.
Valida com Zod.
Garante/cria anonymous_id/session.
Calcula com calculateTaxiQuote.
Salva em quotes.
Salva stops em quote_stops.
Salva evento em quote_events.
Retorna resultado completo.

Retorno:
{
  quoteId,
  summary,
  costs,
  prices,
  profit,
  alerts,
  whatsappMessage
}

--------------------------------------------------
GET /api/quotes/history
--------------------------------------------------

Busca últimas cotações pelo anonymous_id.

Query params:
- limit
- page

Retorna:
- lista de cotações resumidas

--------------------------------------------------
GET /api/quotes/:id
--------------------------------------------------

Busca uma cotação específica.
No MVP:
- permitir somente se anonymous_id do cookie for igual ao anonymous_id da cotação
- ou se user_id futuro for dono

--------------------------------------------------
POST /api/route/calculate
--------------------------------------------------

Recebe:
- origem
- destino
- paradas
- provider

Se API de mapa não estiver configurada:
retornar erro amigável:
“Cálculo automático de rota ainda não configurado. Use o modo manual.”

Se configurada:
- chamar provider no backend
- retornar distância
- duração
- coordenadas arredondadas
- bairros/cidades se disponíveis
- pedágio se provider suportar futuramente

--------------------------------------------------
GET /api/partners
--------------------------------------------------

Lista parceiros ativos.
Filtros:
- cidade
- estado
- categoria
- destaque

--------------------------------------------------
POST /api/partners/click
--------------------------------------------------

Registra clique em parceiro.

Campos:
- partner_id
- quote_id nullable
- click_type

--------------------------------------------------
POST /api/partner-leads
--------------------------------------------------

Recebe lead da página /anuncie.
Valida.
Salva em partner_leads.

--------------------------------------------------
POST /api/feedback
--------------------------------------------------

Recebe feedback do usuário sobre o app ou cotação.

==================================================
12. VALIDAÇÕES COM ZOD
==================================================

Criar schemas:

quoteInputSchema:
- routeMode obrigatório
- tripType obrigatório
- distanceKm obrigatório se manual
- estimatedMinutes obrigatório se manual
- origin/destination obrigatórios se automático
- consumptionKmPerLiter > 0
- fuelPricePerLiter >= 0
- baseFare >= 0
- pricePerKm >= 0
- waitingPrice >= 0
- tollOutbound >= 0
- tollReturn >= 0
- parkingCost >= 0
- extraCosts >= 0
- desiredMarginPercent >= 0 e <= 80
- customChargedPrice >= 0 se informado

partnerLeadSchema:
- businessName opcional
- contactName opcional
- whatsapp obrigatório ou email obrigatório
- category opcional
- city opcional
- state opcional

partnerClickSchema:
- partnerId obrigatório
- clickType obrigatório

==================================================
13. COMPONENTES
==================================================

Criar componentes:

Layout:
- Header
- BottomNavigation
- PageContainer
- MobileCard

Quote:
- TaxiQuoteForm
- RouteFields
- StopsFields
- CarCostFields
- FareFields
- ExtraCostFields
- MarginFields
- QuoteResultCard
- QuoteSummaryCard
- CostBreakdown
- PriceRecommendationCard
- ProfitCard
- AlertCard
- WhatsAppShareButton
- CopyButton

Partners:
- PartnerCard
- PartnerCategoryFilter
- PartnerCTA
- PartnerLeadForm

UI:
- MoneyInput
- NumberInput
- TextInput
- SelectInput
- ToggleGroup
- EmptyState
- LoadingButton
- ConsentBanner

==================================================
14. NAVEGAÇÃO MOBILE
==================================================

Criar bottom navigation fixa no mobile:

Itens:
- Calcular
- Histórico
- Parceiros
- Configurações

No desktop, pode virar menu no topo.

==================================================
15. UX/UI
==================================================

Design:
- mobile-first
- botões grandes
- cards com borda arredondada
- fundo claro
- texto grande e legível
- resultado principal bem destacado
- pouca fricção
- sem dashboard complexo

A tela principal deve parecer uma calculadora simples e confiável.

Hierarquia do resultado:
1. Preço recomendado
2. Lucro estimado
3. Custo total
4. Alertas
5. Detalhamento

Textos simples:
- “Quanto você deve cobrar”
- “Quanto essa corrida custa”
- “Quanto sobra para você”
- “Cuidado: pode dar prejuízo”

Não usar excesso de gráficos no MVP.

==================================================
16. PÁGINA DE PARCEIROS — MONETIZAÇÃO
==================================================

A página de parceiros deve ser pensada como futura fonte de receita.

Categorias prioritárias:
1. Posto de combustível
2. Oficina
3. Troca de óleo
4. Pneu
5. Borracharia
6. Lava-rápido
7. Seguro/proteção veicular
8. Tag de pedágio
9. Maquininha
10. Contabilidade/MEI
11. Acessórios

Cada card deve ter CTA forte.

Exemplos:
- “Chamar no WhatsApp”
- “Ver oferta”
- “Como chegar”

Registrar todos os cliques.

No futuro, isso será usado para provar valor para parceiros.

==================================================
17. ANALYTICS INTERNO FUTURO
==================================================

Não precisa criar painel admin completo agora, mas preparar dados para no futuro mostrar:

- total de cotações
- cotações por dia
- cidades com mais uso
- bairros mais simulados
- rotas mais simuladas
- preço médio por km
- custo médio por km
- combustível mais usado
- consumo médio informado
- margem média
- percentual de volta vazia
- valor médio de pedágio
- parceiros mais clicados
- leads de parceiros recebidos

Se possível, criar uma rota simples protegida por variável ambiente ou basic auth:

/admin

Mas se isso atrasar o MVP, apenas deixar banco preparado.

==================================================
18. MAPAS E ROTAS
==================================================

Arquitetura para mapas:

src/lib/maps/getRouteEstimate.ts
src/lib/maps/providers/googleRoutes.ts
src/lib/maps/providers/mapboxDirections.ts

No MVP:
- permitir modo manual obrigatório
- modo automático pode ficar preparado
- se não houver API key, não quebrar o sistema

Provider deve retornar:
- distanceKm
- durationMinutes
- origin normalized data
- destination normalized data
- rounded coordinates
- raw provider response opcional, mas cuidado para não salvar coisa desnecessária

Não expor API key no frontend.

==================================================
19. FORMATAÇÃO
==================================================

Criar helpers:

formatCurrencyBRL:
Entrada number
Saída “R$ 123,45”

formatDistance:
Entrada km
Saída “12,3 km”

formatDuration:
Entrada minutos
Saída “1h 20min” ou “45min”

parseMoneyInput:
Aceitar:
- 10
- 10.50
- 10,50
- R$ 10,50

==================================================
20. SEEDS / DADOS MOCKADOS
==================================================

Criar alguns parceiros mockados ou seed:

1. Posto Parceiro Centro
Categoria: fuel_station
Cidade: São Paulo
Oferta: Desconto especial para taxistas

2. Oficina Rápida Motor
Categoria: mechanic
Cidade: São Paulo
Oferta: Revisão com condição especial

3. Lava-rápido do Taxista
Categoria: car_wash
Cidade: São Paulo
Oferta: Lavagem com preço fixo para taxistas

4. Tag Pedágio Fácil
Categoria: toll_tag
Cidade: Online
Oferta: Tag de pedágio sem burocracia

5. Proteção Auto Motorista
Categoria: vehicle_protection
Cidade: Online
Oferta: Cotação para taxistas

==================================================
21. COPY PRINCIPAL DO PRODUTO
==================================================

Headline:
“Calcule quanto cobrar na corrida combinada.”

Subheadline:
“Veja custo, lucro e preço recomendado antes de passar o valor para o cliente.”

Botão:
“Calcular corrida”

Resultado:
“Preço recomendado”

Explicação:
“Esse valor considera os custos informados, distância, tempo e margem desejada.”

Alertas:
“Cuidado para não sair no prejuízo.”
“Essa corrida considera volta vazia.”
“Confira se existe pedágio no trajeto.”
“Seu preço informado está abaixo do mínimo recomendado.”

Página parceiros:
“Economize mais no dia a dia como taxista.”

Página anuncie:
“Anuncie para taxistas da sua região.”

==================================================
22. CRITÉRIOS DE ACEITE
==================================================

A entrega estará correta se:

1. Usuário consegue acessar o site pelo celular.
2. Usuário consegue calcular corrida sem login.
3. Usuário consegue usar modo manual sem API de mapa.
4. Backend calcula a cotação.
5. Cotação é salva no banco.
6. anonymous_id é criado e salvo em cookie.
7. Resultado mostra custo, preço mínimo, preço recomendado, lucro e margem.
8. Botão de WhatsApp gera mensagem pronta.
9. Histórico mostra cotações do visitante atual.
10. Página de parceiros existe.
11. Cliques em parceiros são registrados.
12. Página anuncie salva leads no banco.
13. Página de privacidade existe.
14. Nenhum token é salvo em localStorage/sessionStorage.
15. Chaves sensíveis ficam em .env.
16. Código está tipado com TypeScript.
17. Validações com Zod existem.
18. Cálculo está separado em função testável.
19. Layout é mobile-first.
20. Sistema não quebra sem API de mapa.
21. Banco possui estrutura para analytics futuro.
22. Dados individuais não são expostos para parceiros.
23. O produto parece simples, útil e confiável para taxistas.

==================================================
23. NÃO FAZER AGORA
==================================================

Não implementar:
- app Android nativo
- marketplace de corridas
- pagamento
- assinatura
- painel administrativo complexo
- login obrigatório
- taxímetro em tempo real
- tracking GPS contínuo
- chat entre cliente e taxista
- tabela oficial de tarifa por cidade
- comparação com Uber/99
- venda de dados individuais
- coleta de CPF, placa ou documentos

==================================================
24. FOCO DO MVP
==================================================

Foque em lançar rápido uma calculadora web mobile-first que:

- calcula corrida combinada
- mostra preço recomendado
- mostra lucro
- salva cotações no banco
- gera dados úteis para analytics
- tem página de parceiros para monetização futura
- funciona sem login
- é simples para taxista usar

O MVP precisa ser útil mesmo sem mapa automático.

O modo manual precisa funcionar perfeitamente.

A versão inicial deve ser simples, mas a arquitetura deve estar preparada para virar:
- PWA
- app Android
- produto de dados agregados
- canal de parceiros
- ferramenta para pontos/cooperativas de táxi

==================================================
25. ENTREGÁVEIS ESPERADOS
==================================================

Entregar:

1. Estrutura do projeto Next.js.
2. Páginas principais.
3. Componentes principais.
4. Função de cálculo.
5. Schemas de validação.
6. Rotas de API.
7. Modelo de banco/migrations.
8. Seeds de parceiros.
9. Cookie anonymous_id.
10. Salvamento de cotação no banco.
11. Histórico por anonymous_id.
12. Página de parceiros.
13. Página anuncie.
14. Página privacidade.
15. Página termos.
16. Helpers de formatação.
17. Código limpo, tipado e organizado.

IMPORTANTE:
Priorize funcionamento real do fluxo principal:

Entrar no site → preencher corrida → calcular → salvar no banco → mostrar resultado → compartilhar no WhatsApp.

Esse fluxo precisa estar impecável.