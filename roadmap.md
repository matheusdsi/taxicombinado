# Roadmap - Taxi Combinado

Atualizado em: 2026-05-13

Este roadmap reflete o que foi encontrado no codigo atual do projeto, nao apenas a visao inicial. O arquivo antigo `roadpmap.md` continua na raiz como referencia historica, mas esta com nome incorreto e texto quebrado por encoding.

## Visao Do Produto

O Taxi Combinado deve crescer em camadas:

1. Taxista calcula corrida combinada sem sair no prejuizo.
2. Taxista salva historico, cria conta e volta para consultar simulacoes.
3. Parceiros aparecem para uma audiencia de taxistas.
4. Admin acompanha uso real, rotas, valores, parceiros, leads e feedback.
5. Taxista passa a controlar custos, metas, abastecimentos e recorrencia.
6. Passageiros solicitam taxistas confiaveis.
7. A plataforma intermedeia corridas, destaque de motoristas e comissoes.

Posicionamento recomendado:

> Calcule, combine e lucre mais com suas corridas de taxi.

## Tese De Produto Mais Importante

O maior valor do Taxi Combinado nao e apenas fazer uma conta. E mostrar para o taxista aquilo que normalmente fica invisivel quando ele passa preco "no olho".

Muitos motoristas sabem quanto pagaram no combustivel, mas nao sabem transformar em custo real por corrida:

- volta vazia;
- tempo parado;
- espera;
- pedagio de ida e volta;
- estacionamento;
- lavagem;
- pneu;
- oleo;
- manutencao;
- seguro/protecao;
- diaria ou aluguel do carro;
- financiamento/prestacao;
- internet/celular;
- depreciacao;
- dias parados;
- meta pessoal de lucro.

Por isso, a experiencia deve ensinar sem parecer aula. O app deve perguntar aos poucos, sugerir valores, explicar o impacto e mostrar frases simples:

- "Essa corrida parece boa, mas a volta vazia come R$ X do seu lucro."
- "Se voce nao colocar manutencao e pneu na conta, esta cobrando barato sem perceber."
- "Para sobrar R$ X no mes, seu minimo por km precisa ser R$ Y."
- "Esse valor cobre combustivel, mas quase nao cobre o carro."
- "Seu preco pretendido paga a corrida, mas nao ajuda na meta do dia."

Isso muda a prioridade: antes de criar marketplace, passageiro, app ou muitos parceiros, o produto precisa virar uma ferramenta de consciencia de custo e decisao rapida.

## Principios De UX Para Custos Invisiveis

1. Nao pedir tudo de uma vez.
2. Comecar com calculadora simples.
3. Depois do resultado, mostrar "custos que voce talvez nao colocou".
4. Permitir usar valores sugeridos por padrao.
5. Explicar cada custo em linguagem popular.
6. Mostrar impacto em reais, nao apenas em porcentagem.
7. Salvar aprendizados como perfil do motorista.
8. Repetir a mensagem central: preco bom e aquele que paga a corrida, o carro e o motorista.

Exemplos de componentes importantes:

- checklist de custos esquecidos;
- assistente de custo por km;
- simulador "e se eu colocar manutencao?";
- alerta de volta vazia;
- alerta de combustivel alto;
- meta diaria no resultado;
- prejuizo evitado no historico;
- comparacao entre "valor que eu ia cobrar" e "valor recomendado".

## Estado Atual Do Sistema

### Arquitetura

Implementado:

- Frontend em Next.js, React, TypeScript e Tailwind.
- Backend em Express, TypeScript, Prisma e PostgreSQL.
- Deploy preparado para Railway no backend.
- Proxy de API no frontend em `src/app/api/[...path]/route.ts`.
- Prisma schema com usuarios, sessoes anonimas, cotacoes, paradas, eventos, parceiros, leads, cliques, feedback e algumas tabelas analiticas.
- Cookies HttpOnly para login de taxista e admin.
- Sessao anonima via cookie.
- CORS restrito a origens configuradas e dominios do projeto.
- Validacao com Zod nos principais endpoints.

Pendente ou parcial:

- Testes automatizados.
- Rate limit.
- Logs estruturados e observabilidade.
- Tratamento padronizado de erros.
- Politica clara de backup/migracao em producao.
- Revisao de encoding nos textos existentes, pois varios arquivos exibem caracteres quebrados.

### Calculadora De Corrida

Implementado:

- Tela principal com calculadora mobile-first.
- Campos de origem, destino, tipo de corrida, distancia, volta, custos, combustivel, tarifa, bandeira, margem e valor pretendido.
- Tipos de corrida: so ida, ida e volta, volta vazia.
- Calculo no backend em `calculateTaxiQuote`.
- Resultado com preco minimo, tarifa, recomendado, ideal, custo, lucro, margem, alertas e custo por km.
- Botao de copiar orcamento.
- Compartilhamento por WhatsApp.
- Salvamento da cotacao no banco quando disponivel.
- Fallback em localStorage quando necessario.
- Eventos basicos em dataLayer no frontend.

Pendente ou parcial:

- Campo de paradas extras na UI.
- Tempo estimado ainda chega como `0` no envio da calculadora, mesmo quando rota automatica retorna duracao.
- `vehicleExtraCostPerKm` e `driverMinimumValue` existem no backend/schema, mas a tela principal envia `0`.
- Configuracoes salvas em `/configuracoes` ainda nao alimentam automaticamente a calculadora.
- Presets de tarifa estao fixos para SP e precisam de contexto/disclaimer melhor antes de expandir.
- Recalculo a partir de uma cotacao do historico ainda nao esta completo.

### Rotas, Enderecos E Mapas

Implementado:

- Endpoint `/api/route/calculate`.
- Provedores Google, Mapbox e manual no backend.
- Autocomplete de enderecos via Google Places.
- Fallback manual quando API de mapa nao esta configurada.
- Flag admin para mostrar ou esconder passos da rota.

Pendente ou parcial:

- UI nao exibe mapa, apenas dados e passos quando disponiveis.
- Duracao automatica nao esta integrada ao payload final da cotacao.
- Pedagio ainda e manual.
- Nao ha cache de rotas.

### Historico E Conta De Taxista

Implementado:

- Pagina `/historico`.
- Historico por sessao anonima ou por usuario logado.
- Fallback local em localStorage.
- Cadastro e login de taxista.
- Vinculo de cotacoes anonimas ao criar conta ou entrar.
- Paginas `/cadastro` e `/entrar`.
- Contexto de autenticacao no frontend.
- Central `/minha-conta` para dados opcionais do motorista, carro, custos, metas, abastecimentos e manutencoes.
- API `/api/account` autenticada para salvar dados parciais da conta.
- Modelos de banco para perfil do motorista, custos mensais, abastecimentos e manutencoes.

Pendente ou parcial:

- Sincronizacao de cotacoes locais existe no backend, mas precisa confirmar fluxo automatico no frontend.
- Historico ainda nao tem botao de recalcular, favoritar ou copiar WhatsApp direto por item.
- Dados da `/minha-conta` ainda nao alimentam automaticamente a calculadora.
- Nao ha recuperacao de senha.

### Configuracoes Do Taxista

Implementado:

- Pagina `/configuracoes`.
- Salvamento local de combustivel, consumo, tarifa, margem e minimo desejado.
- Nova pagina `/minha-conta` cobre a evolucao dessa ideia de forma mais completa e vinculada ao usuario logado.

Pendente ou parcial:

- Configuracoes nao parecem ser aplicadas automaticamente na calculadora.
- `/configuracoes` pode ser absorvida ou redirecionada para `/minha-conta`.
- Falta aplicar os dados salvos da conta como default da calculadora.
- Falta usar custo por km e meta diaria salvos no resultado da cotacao.

### Parceiros, Anuncie E Monetizacao Inicial

Implementado:

- Pagina `/parceiros`.
- Filtro por categoria.
- Listagem de parceiros ativos.
- Parceiros premium/destaque.
- Tracking de clique.
- Pagina `/anuncie`.
- Formulario de interesse de anunciante.
- Admin cria, ativa/desativa e marca parceiro como premium.
- Leads de parceiros no banco.

Pendente ou parcial:

- Impressao de parceiro ainda nao e registrada, so clique.
- Formulario `/anuncie` salva candidatura como feedback JSON, nao como modelo proprio de lead de anunciante.
- Parceiros contextuais no resultado da corrida ainda sao um card fixo, nao selecionados por categoria/custo/rota.
- Nao ha planos, cobranca, contrato ou status comercial do anunciante.
- Afiliados ainda nao implementados.

### Admin E Analytics

Implementado:

- Login/cadastro de admin com secret.
- Painel `/admin`.
- Metricas de cotacoes, sessoes, parceiros, cliques, leads e feedback.
- Series dos ultimos 30 dias.
- Top origens/destinos.
- Distribuicoes por preco, distancia, combustivel, tipo de corrida e alertas.
- Atividade recente.
- Gestao basica de parceiros.
- Feature flag `showRouteSteps`.

Pendente ou parcial:

- Admin nao tem busca/filtros avancados.
- Nao ha exportacao CSV.
- Nao ha painel especifico para leads de anunciantes.
- Nao ha auditoria de acoes admin.
- Tabelas analiticas agregadas existem no schema, mas nao ha job de agregacao.

### Conteudo, SEO, PWA E Legal

Implementado:

- Paginas publicas basicas: `/sobre`, `/termos`, `/privacidade`, `/cookies`.
- Manifest em `frontend/public/manifest.json`.
- Footer legal e banner de consentimento.

Pendente ou parcial:

- Sitemap/robots precisam ser confirmados no frontend.
- Conteudo SEO programatico ainda nao implementado.
- PWA ainda parece parcial: manifest existe, mas falta service worker/cache/offline.
- AdSense nao implementado.

## Fases Atualizadas

### Fase 1 - MVP Calculadora

Status: quase concluida.

Pronto:

- Backend separado.
- Banco e Prisma.
- Calculadora manual.
- Cotacoes persistidas.
- Resultado e WhatsApp.
- Alertas.
- Sessao anonima.
- Historico simples.

Falta para fechar:

- Corrigir encoding/textos quebrados.
- Integrar duracao da rota automatica ao calculo.
- Usar `vehicleExtraCostPerKm` e `driverMinimumValue` na UI principal.
- Aplicar configuracoes salvas na calculadora.
- Adicionar paradas extras ou remover temporariamente do escopo visivel.
- Rodar build/teste de sanidade antes de considerar MVP fechado.

### Fase 2 - Retencao Do Taxista

Status: iniciada.

Pronto:

- Conta de taxista.
- Historico por usuario.
- Configuracoes locais.

Proximos itens:

- Perfil simples do taxista.
- Configuracoes salvas no backend.
- Veiculos e perfis de tarifa reais.
- Recalcular a partir do historico.
- Copiar/compartilhar item do historico.
- Resumo de uso: total cotado, lucro estimado, media por corrida e prejuizo evitado.

### Fase 3 - Parceiros E Receita Inicial

Status: iniciada.

Pronto:

- Parceiros publicos.
- Clique em parceiro.
- Pagina anuncie.
- Admin cadastra parceiros.

Proximos itens:

- Registrar impressoes.
- Criar modelo proprio para leads de anunciante.
- Parceiros contextuais no resultado.
- Relatorio simples por parceiro.
- Primeiro pacote comercial manual: basico, destaque e premium.

### Fase 4 - Custos, Metas E Abastecimentos

Status: nao implementada.

Proximos itens:

- `/minha-meta`.
- Custos fixos mensais.
- Meta mensal, diaria, por hora e por km.
- Integracao da meta no resultado da corrida.
- `/abastecimentos`.
- Consumo real e custo real por km.

### Fase 5 - SEO E Conteudo

Status: nao implementada.

Proximos itens:

- Sitemap e robots.
- Paginas editoriais principais.
- Paginas locais/rotas com cuidado para nao criar conteudo fraco.
- Schema markup basico.
- Medicao de trafego organico.

### Fase 6 - Passageiro E Motoristas Confiaveis

Status: futuro.

Proximos itens:

- `/encontrar-taxista`.
- Solicitar corrida por passageiro.
- Cadastro/listagem de taxistas confiaveis.
- Admin de solicitacoes.
- Matching simples.
- Controle de status e comissao.

## Proximos Passos Recomendados

### 1. Criar O Assistente De Custos Invisiveis

Prioridade maxima de produto.

O motorista geralmente nao sabe quanto colocar em "custo extra por km". Entao nao basta adicionar o campo. O sistema precisa ajudar a descobrir.

Implementar:

- card no resultado: "Custos que talvez voce nao colocou";
- checklist com pneu, oleo, manutencao, seguro/protecao, lavagem, diaria/aluguel, prestacao e celular;
- botao "calcular meu custo por km";
- formulario simples para transformar custos mensais em custo por km;
- sugestao de custo extra por km com base no que ele informou;
- opcao "usar esse valor nas proximas corridas";
- explicacao curta: "Esse valor nao e taxa a mais: e o custo real do carro rodando."

Por que vem antes:

- e uma dor mais forte que um campo tecnico;
- aumenta confianca no preco recomendado;
- faz o taxista perceber valor no app;
- prepara o caminho para metas, abastecimentos e parceiros.

Resultado esperado:

- O taxista entende que combustivel nao e o unico custo da corrida.

### 2. Integrar Meta Do Dia No Resultado

Implementar uma primeira versao leve antes da pagina completa de metas.

- Usar os dados opcionais da `/minha-conta`: renda desejada, dias trabalhados, horas por dia e km mensal.
- Calcular meta diaria, meta por hora e meta por km.
- No resultado da corrida, mostrar:
  - "Essa corrida cobre X% da sua meta diaria";
  - "Faltam R$ X para bater a meta de hoje";
  - "Abaixo/acima do minimo por km da sua meta".

Por que e relevante:

- transforma a calculadora em decisao de trabalho;
- cria motivo para voltar no dia seguinte;
- conversa melhor com a realidade do motorista.

### 3. Corrigir O Fluxo Principal Da Calculadora

Prioridade maxima.

- Corrigir textos com encoding quebrado em frontend, backend e roadmap antigo.
- Corrigir o nome `roadpmap.md` ou remover depois que este `roadmap.md` for adotado.
- Fazer a calculadora usar tempo estimado real quando rota automatica estiver disponivel.
- Expor custo extra por km e minimo do motorista com ajuda guiada, nao como campo cru.
- Fazer `/configuracoes` preencher os defaults da calculadora.
- Incluir paradas extras ou assumir oficialmente que ficam para depois.
- Validar build do frontend e backend.

Resultado esperado:

- Produto principal confiavel para usar e mostrar para taxistas.

### 4. Melhorar Historico Para Gerar Retorno

- Adicionar acao "recalcular" em cada item do historico.
- Adicionar "copiar WhatsApp" em cada item.
- Mostrar resumo de uso: total cotado, lucro estimado, media por corrida e prejuizo evitado.
- Destacar "prejuizo evitado": diferenca entre valor pretendido e recomendado.
- Sincronizar localStorage com conta de forma explicita ao login/cadastro.

Resultado esperado:

- Taxista tem motivo para voltar, nao apenas calcular uma vez.

### 5. Implementar Abastecimentos Como Prova Do Custo Real

Abastecimento e mais concreto que uma meta completa. Ele ajuda o taxista a sair do "acho que meu carro faz 10 km/l" para consumo real.

Implementar:

- pagina `/abastecimentos`;
- data, km atual, litros, valor pago, posto e cidade;
- consumo medio real;
- custo real por km de combustivel;
- alerta quando o consumo piora;
- botao para usar consumo real na calculadora.

Resultado esperado:

- O app passa a calcular com dados do proprio motorista, nao apenas estimativas.

### 6. Transformar Parceiros Em Receita Testavel

- Registrar impressoes de parceiros.
- Separar `PartnerLead` de `AdvertiserApplication`.
- Criar relatorio admin por parceiro: impressoes, cliques, CTR e leads.
- Implementar parceiro contextual ligado a custo real:
  - combustivel alto -> posto/tag/cartao combustivel;
  - custo por km alto -> oficina/pneus/oleo;
  - pedagio recorrente -> tag de pedagio;
  - meta apertada -> reducao de custos.
- Criar 3 planos comerciais visiveis internamente no admin.

Resultado esperado:

- Da para vender os primeiros parceiros manualmente com dados reais.

### 7. Implementar Minha Meta Completa

- Criar schema/tabelas de custos mensais.
- Criar `/minha-meta`.
- Mostrar na calculadora quanto a corrida representa da meta diaria e por km.

Resultado esperado:

- O produto deixa de ser so calculadora e vira ferramenta financeira do taxista.

### 8. Preparar Crescimento Organico

- Confirmar `robots.txt`, `sitemap.xml`, metadata e canonical.
- Criar 5 paginas SEO uteis primeiro, focadas em dor real:
  - como calcular corrida combinada;
  - como calcular custo por km do taxi;
  - quanto cobrar em corrida com volta vazia;
  - quanto um taxista precisa faturar por dia;
  - como saber se uma corrida da lucro.
- Medir quais paginas geram cotacoes.

Resultado esperado:

- Trafego organico com utilidade real e sem inflar escopo.

## Ordem De Implementacao Recomendada

1. Sanidade tecnica: encoding, builds, envs, rotas principais.
2. Assistente de custos invisiveis.
3. Meta diaria simples no resultado.
4. Calculadora completa: duracao real, custo extra por km guiado, minimo do motorista, configuracoes aplicadas.
5. Historico melhorado: recalcular, copiar, resumo e prejuizo evitado.
6. Abastecimentos e consumo real.
7. Parceiros contextuais baseados nos custos do motorista.
8. Parceiros mensuraveis: impressoes, CTR, leads de anunciante, relatorio.
9. Minha Meta completa.
10. SEO inicial focado em custo/lucro/volta vazia.
11. Passageiro solicita taxista.
12. Cadastro/listagem de taxistas confiaveis.
13. Admin de leads e comissao.
14. PWA completo.
15. WhatsApp bot.

## O Que Nao Fazer Agora

- App Android nativo.
- Marketplace automatico complexo.
- Pagamento online completo.
- Taximetro GPS.
- Rastreamento em tempo real.
- Comparacao com Uber/99.
- WhatsApp bot antes de validar uso real da calculadora.
- Muitos artigos SEO antes de medir conversao.
- Painel grande de comissao antes de existir demanda de passageiros.

## Meta De Receita Inicial

Meta de R$ 5.000/mes continua realista apenas depois de haver uso recorrente e oferta comercial simples:

- Parceiros locais: 10 x R$ 99 = R$ 990.
- Parceiros destaque: 5 x R$ 199 = R$ 995.
- Taxistas destaque/pro futuro: 40 x R$ 49 = R$ 1.960.
- Intermediacao futura: R$ 1.000 a R$ 1.500 em comissoes.

Antes disso, o foco deve ser:

- Taxistas usando a calculadora.
- Taxistas voltando pelo historico/meta.
- Parceiros clicados e interessados em anunciar.
