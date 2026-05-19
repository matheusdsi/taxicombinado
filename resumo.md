# Taxi Combinado — Resumo do Sistema

Aplicação full-stack para taxistas brasileiros calcularem tarifas, gerenciarem sua operação e conectarem-se a parceiros. Agora também inclui perfil público do taxista com agendamento por passageiros.

**Stack:** Express.js + TypeScript + Prisma + PostgreSQL (backend) · Next.js + React + TailwindCSS (frontend)
**Deploy:** Frontend no Vercel · Backend no Railway · Banco PostgreSQL

---

## Funcionalidades

### Calculadora de Tarifa
- Cálculo completo com breakdown de custos: combustível, manutenção, pedágios, estacionamento, extras
- Três opções de preço: mínimo, recomendado e ideal
- Alertas automáticos: lucro baixo/negativo, retorno vazio, pedágio não informado, margem alta
- Funciona 100% offline no navegador (sem necessidade de backend)
- Salva até 50 cotações no localStorage

### Cálculo de Rota
- Integração com Google Maps (Directions API) para distância e duração
- Fallback para Mapbox se o Google não estiver disponível
- Fallback final para entrada manual de distância
- Passos turn-by-turn opcionais (controlado por feature flag)

### Agendamento de Corrida (via perfil público)
- Passageiro acessa o link `/t/[slug]` do taxista
- Formulário com nome, WhatsApp, origem, destino, data/hora
- Opções de quantidade de passageiros e bagagem
- Estimativa de preço calculada automaticamente com base na distância (via `fareEstimate`)
- Link direto para WhatsApp gerado no resultado
- Passageiro dá consentimento LGPD ao enviar

### Autenticação
- Cadastro e login de motoristas (email + senha, JWT em cookie de 30 dias)
- Cadastro de admins protegido por código secreto
- Sessões anônimas rastreadas mesmo sem login (cookie de 365 dias)
- Cotações anônimas vinculadas ao usuário no momento do cadastro

### Histórico de Cotações
- Exibe cotações do banco (autenticado) ou do localStorage (offline)
- Paginação, data, origem, destino, preço recomendado, lucro e margem
- Sincronização automática de cotações locais ao fazer login

### Conta do Motorista (`/minha-conta`)
- **Perfil:** telefone, WhatsApp, cidade, estado, ponto de táxi, métodos de pagamento
- **Veículo:** marca, modelo, ano, tipo de combustível, consumo, parcela, seguro, estacionamento
- **Custos mensais:** 16 categorias (combustível estimado, aluguel do carro, seguro, manutenção, pneus, óleo, lavagem, pedágios, taxas de app, contador, licenças, outros)
- **Log de manutenção:** categoria, descrição, valor, odômetro
- **Log de abastecimento:** preço por litro, litros, odômetro, posto
- **Resumo financeiro:** meta diária/horária e custo por km calculados automaticamente

### Perfil Público do Taxista (`/meu-perfil` e `/t/[slug]`)
- Taxista cria perfil público com nome, cidade, carro, foto, bio (até 280 chars) e categorias de serviço
- Categorias: Aeroporto, Executivo, Luxo, Pet, 7 lugares, Viagem
- Slug único gerado automaticamente
- WhatsApp **não** é exposto diretamente — link seguro via endpoint `/api/profile/:slug/whatsapp`
- Botão para compartilhar o perfil no WhatsApp
- LGPD: consentimento obrigatório, botão de exclusão disponível

### Agendamentos do Taxista (`/agendamentos`)
- Lista todos os agendamentos recebidos pelo perfil público
- Status: pendente, aceito, realizado, cancelado com fluxo de transição
- Cards de estatísticas: realizados, pendentes, a confirmar, potencial financeiro em aberto
- Alerta visual para corridas aceitas com data já vencida
- Filtro por status
- Ação rápida de WhatsApp para cada passageiro com mensagem pré-formatada
- Estimativa de preço exibida no card (min/max)

### Minha Meta (`/minha-meta`)
- Simulador de meta mensal com custos fixos detalhados: combustível, prestação, seguro, proteção veicular, manutenção, lavagem, celular, estacionamento, pneus, óleo, rastreador etc.
- Calcula meta diária, por hora e custo/meta por km
- Integração com cotações locais para projetar quanto já foi simulado no mês
- Salvo localmente (sem necessidade de login)

### Parceiros
- Diretório filtrado por categoria (postos, mecânicos, lavagem, tag de pedágio, seguros)
- Rastreamento de cliques e leads por parceiro
- Formulário de candidatura para novos parceiros
- Marcação de parceiros premium

### Configurações
- Presets salvos localmente: consumo, tipo de combustível, preço do litro, custo extra por km
- Tarifas configuráveis: bandeirada, preço por km, espera por hora
- Margem desejada e valor mínimo do motorista
- Presets rápidos para tarifa "Comum" e "Luxo"

### Dashboard Admin
- Contagem de cotações: hoje, ontem, últimos 7 e 30 dias
- Médias: preço, distância, duração, custo, lucro e margem
- Breakdowns: tipo de viagem, tipo de combustível, modo de rota, faixas de preço e distância
- Séries temporais: cotações por dia, preço médio por dia
- Top origens e destinos (geográfico)
- Frequência de alertas
- Feed de atividade recente (cotações, sessões, feedbacks)
- Gestão de parceiros (criar, editar, listar com métricas)
- Feature flags (ex: exibir passos da rota)

### Feedback
- Formulário de avaliação do app acessível a qualquer usuário

---

## Banco de Dados (19 modelos)

| Modelo | Descrição |
|--------|-----------|
| `User` | Conta de motorista ou admin |
| `Vehicle` | Dados do veículo |
| `DriverProfile` | Perfil estendido do motorista (conta interna) |
| `DriverMonthlyCost` | Custos mensais detalhados |
| `MaintenanceLog` | Registro de manutenções |
| `FuelLog` | Registro de abastecimentos |
| `DriverPublicProfile` | Perfil público do taxista com slug único |
| `SchedulingRequest` | Solicitação de agendamento enviada por passageiro |
| `Quote` | Cotação com todos os inputs/outputs |
| `QuoteStop` | Paradas intermediárias da rota |
| `QuoteEvent` | Auditoria de eventos da cotação |
| `TaxiFareProfile` | Presets de tarifa personalizados |
| `AnonymousSession` | Sessão de usuário não autenticado |
| `Partner` | Empresa parceira |
| `PartnerClick` | Clique rastreado em parceiro |
| `PartnerLead` | Lead gerado por parceiro |
| `DailyRouteAnalytics` | Estatísticas agregadas por rota/dia |
| `CityAnalytics` | Contagem de cotações por cidade |
| `AppFeedback` | Avaliações do app |

### Campos recentes em `SchedulingRequest`
- `estimatedPriceMin` / `estimatedPriceMax` — faixa de preço estimada pelo passageiro no momento do agendamento
- `estimatedDistanceKm` — distância estimada da rota

---

## Páginas do Frontend

| Rota | Página |
|------|--------|
| `/` | Calculadora de tarifa |
| `/agendar` | Solicitar corrida agendada (fluxo genérico) |
| `/historico` | Histórico de cotações |
| `/minha-conta` | Conta do motorista (perfil, veículo, custos, logs) |
| `/meu-perfil` | Editar perfil público do taxista |
| `/agendamentos` | Gerenciar agendamentos recebidos |
| `/minha-meta` | Simulador de meta mensal com custos fixos |
| `/configuracoes` | Presets e configurações locais |
| `/parceiros` | Diretório de parceiros |
| `/anuncie` | Candidatura para parceiros |
| `/entrar` | Login |
| `/cadastro` | Cadastro |
| `/t/[slug]` | Perfil público do taxista (visível para passageiros) |
| `/admin` | Dashboard administrativo |
| `/admin/corridas-agendadas` | Admin: corridas agendadas |
| `/admin/corridas-realizadas` | Admin: corridas realizadas |
| `/admin/cotacoes` | Admin: cotações |
| `/admin/taxistas` | Admin: gestão de taxistas |
| `/admin/parceiros` | Admin: gestão de parceiros |
| `/admin/passageiros` | Admin: passageiros |
| `/admin/financeiro` | Admin: financeiro |
| `/admin/avaliacoes` | Admin: avaliações |
| `/admin/notificacoes` | Admin: notificações |
| `/admin/suporte` | Admin: suporte |
| `/admin/relatorios` | Admin: relatórios |
| `/admin/cadastro` | Admin: cadastro |
| `/admin/configuracoes` | Admin: configurações |
| `/admin/metas-desafios` | Admin: metas e desafios |
| `/admin/planos-assinaturas` | Admin: planos e assinaturas |
| `/admin/usuarios` | Admin: usuários |
| `/desafio` | Desafio do taxista |
| `/sobre` | Sobre o app |
| `/termos` | Termos de uso |
| `/privacidade` | Política de privacidade |
| `/cookies` | Política de cookies |
| `/offline` | Página offline (PWA) |

---

## API Routes do Backend

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/quote/calculate` | Calcular e salvar cotação |
| GET | `/api/quotes/history` | Histórico de cotações por anonymous_id ou user |
| GET | `/api/quotes/:id` | Detalhes de uma cotação |
| POST | `/api/route/calculate` | Calcular rota via Google/Mapbox/manual |
| GET | `/api/places/autocomplete` | Autocomplete de endereços |
| GET | `/api/partners` | Listar parceiros |
| POST | `/api/partners/click` | Registrar clique em parceiro |
| POST | `/api/partner-leads` | Salvar candidatura de anunciante |
| POST | `/api/feedback` | Salvar feedback do app |
| GET/PUT | `/api/account` | Conta do motorista autenticado |
| POST | `/api/account/maintenance` | Salvar log de manutenção |
| POST | `/api/account/fuel-logs` | Salvar log de abastecimento |
| POST | `/api/auth/register` | Cadastro de motorista |
| POST | `/api/auth/login` | Login de motorista |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/profile/me` | Buscar perfil público próprio |
| PUT | `/api/profile/me` | Criar/atualizar perfil público |
| DELETE | `/api/profile/me` | Excluir perfil público (LGPD) |
| GET | `/api/profile/:slug` | Perfil público por slug (sem auth) |
| GET | `/api/profile/:slug/whatsapp` | Link seguro de contato do taxista |
| POST | `/api/profile/:slug/schedule` | Passageiro envia agendamento |
| GET | `/api/profile/me/schedules` | Taxista lista seus agendamentos |
| PATCH | `/api/profile/me/schedules/:id` | Atualizar status do agendamento |

---

## Integrações Externas

- **Google Maps:** autocomplete de endereços e cálculo de rotas
- **Mapbox:** fallback para cálculo de rotas
- **WhatsApp Web:** link gerado para contato direto (agendamento, perfil e cotação)

---

## Migrações Aplicadas

| Arquivo | O que faz |
|---------|-----------|
| `20260513155444_init` | Schema inicial completo |
| `20260513201358_add_ride_requests` | Adiciona `RideRequest` (agendamento genérico) |
| `20260513203000_driver_account_center` | Adiciona `DriverProfile`, `DriverMonthlyCost`, `MaintenanceLog`, `FuelLog`, campos no `Vehicle` |
| `20260514133000_add_partner_waze_url` | Adiciona `wazeUrl` em `Partner` |
| `20260514134500_add_partner_locations` | Adiciona campos de localização em `Partner` |
| `20260515165806_add_quote_source` | Adiciona campo `source` em `Quote` |
| `20260517000000_driver_public_profile` | Cria `DriverPublicProfile` e `SchedulingRequest` (agendamento vinculado ao perfil público) |
| `20260518143419_add_estimated_price_to_scheduling_request` | Adiciona `estimatedPriceMin`, `estimatedPriceMax`, `estimatedDistanceKm` em `SchedulingRequest` |

---

## Notas de Implementação

- WhatsApp do taxista **nunca** é exposto diretamente na página pública — o frontend chama `/api/profile/:slug/whatsapp` para obter o link `wa.me`, protegendo contra scraping (LGPD)
- Slug do perfil público é gerado por `slugify(displayName)` e garantido único no banco com tentativas incrementais
- `fareEstimate` no frontend calcula estimativa de preço para o passageiro ao agendar, usando as tarifas padrão de SP (Bandeira 1)
- Configurações salvas em `/configuracoes` usam localStorage — integração automática com a calculadora ainda está pendente
