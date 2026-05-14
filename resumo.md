# Taxi Combinado — Resumo do Sistema

Aplicação full-stack para taxistas brasileiros calcularem tarifas, gerenciarem sua operação e conectarem-se a parceiros.

**Stack:** Express.js + TypeScript + Prisma + PostgreSQL (backend) · Next.js 16 + React + TailwindCSS (frontend)
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

### Agendamento de Corrida
- Formulário com nome, telefone, origem, destino, data/hora
- Opções de passageiros, veículo grande, acessibilidade e bagagem
- Estimativa de preço com base na distância
- Geração de link direto para WhatsApp

### Autenticação
- Cadastro e login de motoristas (email + senha, JWT em cookie de 30 dias)
- Cadastro de admins protegido por código secreto
- Sessões anônimas rastreadas mesmo sem login (cookie de 365 dias)
- Cotações anônimas vinculadas ao usuário no momento do cadastro

### Histórico de Cotações
- Exibe cotações do banco (autenticado) ou do localStorage (offline)
- Paginação, data, origem, destino, preço recomendado, lucro e margem
- Sincronização automática de cotações locais ao fazer login

### Conta do Motorista
- **Perfil:** telefone, WhatsApp, cidade, estado, ponto de táxi, métodos de pagamento
- **Veículo:** marca, modelo, ano, tipo de combustível, consumo, parcela, seguro, estacionamento
- **Custos mensais:** 16 categorias (combustível estimado, aluguel do carro, seguro, manutenção, pneus, óleo, lavagem, pedágios, taxas de app, contador, licenças, outros)
- **Log de manutenção:** categoria, descrição, valor, odômetro
- **Log de abastecimento:** preço por litro, litros, odômetro, posto
- **Resumo financeiro:** meta diária/horária e custo por km calculados automaticamente

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

## Banco de Dados (17 modelos)

| Modelo | Descrição |
|--------|-----------|
| `User` | Conta de motorista ou admin |
| `Vehicle` | Dados do veículo |
| `DriverProfile` | Perfil estendido do motorista |
| `DriverMonthlyCost` | Custos mensais detalhados |
| `MaintenanceLog` | Registro de manutenções |
| `FuelLog` | Registro de abastecimentos |
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
| `RideRequest` | Solicitação de corrida agendada |

---

## Páginas do Frontend

| Rota | Página |
|------|--------|
| `/` | Calculadora de tarifa |
| `/agendar` | Solicitar corrida agendada |
| `/historico` | Histórico de cotações |
| `/minha-conta` | Conta do motorista |
| `/configuracoes` | Presets e configurações |
| `/parceiros` | Diretório de parceiros |
| `/anuncie` | Candidatura para parceiros |
| `/entrar` | Login |
| `/cadastro` | Cadastro |
| `/admin` | Dashboard administrativo |
| `/sobre` | Sobre o app |
| `/termos` | Termos de uso |
| `/privacidade` | Política de privacidade |
| `/cookies` | Política de cookies |

---

## Integrações Externas

- **Google Maps:** autocomplete de endereços e cálculo de rotas
- **Mapbox:** fallback para cálculo de rotas
- **WhatsApp Web:** link gerado para contato direto no agendamento
