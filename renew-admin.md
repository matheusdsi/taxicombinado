Você vai implementar uma reformulação completa do ADMIN do Táxi Combinado.

OBJETIVO GERAL
Criar um admin moderno, organizado, operacional e visualmente parecido com o layout de referência enviado:
- sidebar escura
- conteúdo claro
- cards brancos arredondados
- ícones
- destaques em amarelo, verde e azul
- gráficos simples
- tabelas limpas
- filtros no topo
- painel responsivo
- experiência premium e organizada

IMPORTANTE
Antes de modificar qualquer coisa:
1. Analise o admin atual.
2. Entenda as páginas, componentes, rotas, tabelas, APIs e dados já existentes.
3. Preserve tudo que já funciona.
4. Não quebrar backend, autenticação, banco, permissões ou APIs existentes.
5. Reaproveitar componentes e endpoints sempre que possível.
6. Se algum dado ainda não existir, criar UI preparada com fallback/estado vazio.
7. Não remover informações importantes já existentes; reorganizar melhor.

==================================================
CONTEXTO DO SISTEMA
==================================================

O Táxi Combinado é uma plataforma para taxistas.

Hoje o sistema possui ou está evoluindo para ter:

- calculadora de corridas
- cálculo por categoria: comum/luxo/executivo
- cálculo por bandeira: 1 ou 2
- só ida, ida e volta, volta vazia
- pedágio
- extra manual
- trânsito aplicado
- custo de combustível
- sobra estimada
- histórico de cotações
- Minha Meta
- parceiros
- desafio/rota do dia
- perfil público de taxista
- agendamento de corridas
- status de corrida/agendamento
- usuários/taxistas/passageiros
- admin para operação geral

O admin precisa ajudar a operar e auditar o sistema.

==================================================
MENU LATERAL DO ADMIN
==================================================

Criar sidebar escura fixa no desktop com logo Táxi Combinado no topo.

Itens do menu, nesta ordem:

1. Dashboard
2. Usuários
3. Taxistas
4. Passageiros
5. Parceiros
6. Cotações
7. Corridas Agendadas
8. Corridas Realizadas
9. Financeiro
10. Planos e Assinaturas
11. Metas e Desafios
12. Avaliações
13. Notificações
14. Suporte
15. Configurações
16. Relatórios

No rodapé da sidebar:
- avatar do admin
- nome “Administrador”
- e-mail
- status online

No mobile:
- sidebar deve virar menu colapsável/drawer.

==================================================
DESIGN SYSTEM
==================================================

Usar visual próximo da referência:

Cores:
- fundo geral: #F8FAFC ou similar
- sidebar: azul/preto escuro
- amarelo principal: #F5B800 / #FFC400
- verde sucesso: #16A34A
- azul informação: #2563EB
- vermelho alerta: #DC2626
- cinza texto: #64748B
- texto principal: #0F172A

Cards:
- fundo branco
- borda leve
- border-radius 16px/20px
- sombra sutil
- muito espaçamento
- hierarquia visual clara

Componentes:
- KPI cards
- tabelas
- filtros
- badges
- status pills
- gráficos simples
- cards de resumo
- modais de detalhe

Badges:
- Bandeira 1
- Bandeira 2
- Comum
- Luxo
- Executivo
- Só ida
- Ida e volta
- Volta vazia
- Pedágio
- Trânsito aplicado
- Extra manual
- Pendente
- Aceito
- Realizado/Pago
- Cancelado

==================================================
PÁGINA 1 — DASHBOARD
==================================================

Rota:
admin/dashboard

Objetivo:
Visão geral da operação.

Topo:
- título: Dashboard
- subtítulo: Visão geral do sistema
- filtro de período
- filtro de estado/cidade
- botão Atualizar
- botão Exportar relatório

Cards principais:
1. Usuários ativos
2. Novos usuários
3. Cotações realizadas
4. Corridas agendadas
5. Corridas realizadas
6. Faturamento estimado

Cada card deve ter:
- ícone
- número principal
- comparação com período anterior
- link “ver detalhes”

Gráficos:
1. Cotações por dia
2. Corridas agendadas x realizadas
3. Faturamento estimado
4. Cotações por região
5. Top destinos
6. Cotações por categoria
7. Cotações por bandeira
8. Cotações por tipo

Tabelas/cards:
- Cotações recentes
- Agendamentos próximos
- Corridas realizadas recentes
- Taxistas em destaque
- Atividade recente
- Usuários recentes

Métricas secundárias:
- Taxímetro médio
- Distância média
- Ticket médio
- Sobra média estimada
- Valor médio por km
- Taxistas ativos
- Parceiros ativos

==================================================
PÁGINA 2 — USUÁRIOS
==================================================

Rota:
admin/usuarios

Objetivo:
Gerenciar todos os usuários.

Mostrar:
- total de usuários
- novos usuários no período
- usuários recorrentes
- usuários com conta
- usuários anônimos
- usuários ativos hoje/7 dias/30 dias

Tabela:
- nome
- e-mail/telefone
- tipo: taxista/passageiro/admin/anônimo
- data de cadastro
- último acesso
- quantidade de cotações
- criou perfil?
- criou meta?
- status

Filtros:
- tipo
- status
- data
- recorrente
- com perfil
- com agendamento

Ações:
- ver detalhes
- bloquear/desbloquear
- editar tipo
- abrir histórico do usuário

Detalhe do usuário:
- dados básicos
- cotações realizadas
- metas
- agendamentos
- perfil, se houver
- eventos principais

==================================================
PÁGINA 3 — TAXISTAS
==================================================

Rota:
admin/taxistas

Objetivo:
Gerenciar taxistas cadastrados e perfis públicos.

Cards:
- taxistas cadastrados
- taxistas ativos
- perfis públicos criados
- taxistas com agendamento ativo
- taxistas com corridas realizadas
- taxistas pendentes de revisão

Tabela:
- nome
- WhatsApp
- cidade/região
- categoria/carro
- perfil público ativo?
- link público
- número de cotações
- número de agendamentos
- corridas realizadas
- avaliação média
- status

Filtros:
- cidade
- categoria
- atende aeroporto
- pet
- 7 lugares
- luxo
- executivo
- perfil ativo
- status

Detalhe do taxista:
- dados pessoais
- WhatsApp
- foto
- carro
- categorias atendidas
- link público
- agendamentos
- corridas realizadas
- cotações
- receita estimada
- status do perfil

Ações:
- aprovar/reprovar perfil
- destacar taxista
- copiar link público
- abrir WhatsApp
- editar categorias
- desativar perfil

==================================================
PÁGINA 4 — PASSAGEIROS
==================================================

Rota:
admin/passageiros

Objetivo:
Visualizar passageiros que solicitaram agendamentos ou usaram formulários.

Cards:
- passageiros únicos
- novos passageiros
- passageiros com agendamento
- passageiros recorrentes

Tabela:
- nome
- WhatsApp
- e-mail, se houver
- origem do cadastro
- data
- número de solicitações
- última solicitação
- status

Detalhe:
- dados básicos
- agendamentos solicitados
- taxistas relacionados
- observações
- histórico de contatos

==================================================
PÁGINA 5 — PARCEIROS
==================================================

Rota:
admin/parceiros

Objetivo:
Gerenciar parceiros/anunciantes.

Cards:
- parceiros ativos
- parceiros pendentes
- cliques em parceiros
- WhatsApps iniciados
- categorias mais clicadas

Tabela:
- nome do parceiro
- categoria: oficina/seguro/pneus/lava-rápido/etc.
- cidade/região
- WhatsApp
- status
- cliques
- visualizações
- data de cadastro
- plano, se existir

Ações:
- cadastrar parceiro
- editar
- ativar/desativar
- ver métricas
- abrir WhatsApp

Detalhe:
- descrição
- serviços
- logo/imagem
- link/WhatsApp
- métricas de clique
- origem dos cliques

==================================================
PÁGINA 6 — COTAÇÕES
==================================================

Rota:
admin/cotacoes

Esta é uma das páginas mais importantes.

Objetivo:
Auditar todos os cálculos.

Cards:
- total de cotações
- cotações hoje
- ticket médio
- distância média
- valor por km médio
- sobra média
- cotações com trânsito
- cotações com pedágio
- cotações com extra

Tabela obrigatória:
- data/hora
- origem
- destino
- distância original
- distância considerada
- categoria: comum/luxo/executivo
- bandeira: 1/2
- tipo: só ida/ida e volta/volta vazia
- taxímetro base
- trânsito aplicado
- pedágio
- extra manual
- preço final
- custo
- sobra estimada
- usuário/taxista, se houver

Filtros:
- período
- categoria
- bandeira
- tipo
- com pedágio
- com trânsito
- com extra
- valor acima de X
- cidade/estado
- usuário

Na listagem, cada linha ou card precisa mostrar de forma clara:
Exemplo:
R$ 1.688,59
Luxo • Bandeira 2 • Só ida
175,2 km • Pedágio R$ 0 • Trânsito R$ 38 • Extra 0%

Modal de detalhe da cotação:
Título:
Detalhes da cotação

Mostrar:
- origem completa
- destino completo
- data/hora
- usuário
- categoria
- bandeira
- tipo
- distância original
- distância considerada
- duração normal
- duração com trânsito
- tempo extra de trânsito
- taxímetro base
- adicional de trânsito
- pedágio
- extra manual em R$
- extra manual em %
- preço final
- custo combustível
- custo total
- sobra estimada
- valor por km

Bloco “Como chegamos nesse valor”:
1. Bandeirada
2. Km rodado
3. Bandeira aplicada
4. Trânsito
5. Pedágio
6. Extra
7. Total

Ações:
- copiar detalhes
- abrir rota no Google Maps
- marcar como suspeita
- adicionar observação interna
- excluir, se permitido

IMPORTANTE:
Essa página precisa resolver o problema de auditoria:
o admin deve conseguir entender rapidamente por que um valor ficou alto.

==================================================
PÁGINA 7 — CORRIDAS AGENDADAS
==================================================

Rota:
admin/corridas-agendadas

Objetivo:
Gerenciar solicitações de agendamento.

Cards:
- agendamentos pendentes
- agendamentos aceitos
- agendamentos para hoje
- agendamentos cancelados
- agendamentos por taxista

Tabela:
- data/hora da solicitação
- data/hora da corrida
- passageiro
- WhatsApp passageiro
- taxista
- origem
- destino
- valor estimado
- status
- observações

Status:
- pendente
- aceito
- realizado/pago
- cancelado

Ações:
- abrir WhatsApp do passageiro
- abrir WhatsApp do taxista
- alterar status
- ver detalhes
- atribuir taxista
- cancelar

Detalhe:
- dados do passageiro
- dados do taxista
- rota
- informações da corrida
- histórico de status
- observações internas

==================================================
PÁGINA 8 — CORRIDAS REALIZADAS
==================================================

Rota:
admin/corridas-realizadas

Objetivo:
Acompanhar corridas concluídas/pagas.

Cards:
- corridas realizadas
- valor total estimado
- ticket médio
- taxistas com mais corridas
- rotas mais realizadas

Tabela:
- data
- passageiro
- taxista
- origem
- destino
- valor
- status de pagamento
- forma de pagamento, se existir
- avaliação

Ações:
- ver detalhes
- editar status
- registrar observação
- abrir WhatsApp

==================================================
PÁGINA 9 — FINANCEIRO
==================================================

Rota:
admin/financeiro

Objetivo:
Visão financeira estimada da plataforma.

IMPORTANTE:
No momento, muitos valores podem ser estimados, pois pagamentos não passam obrigatoriamente pela plataforma.

Cards:
- faturamento estimado
- ticket médio
- valor total cotado
- valor de corridas realizadas
- receita potencial de parceiros
- receita potencial de planos
- comissões potenciais
- custo estimado de operação

Gráficos:
- faturamento estimado por dia
- ticket médio por período
- receita por origem
- ranking de taxistas por valor movimentado

Tabela:
- movimentações estimadas
- taxista
- tipo
- valor
- origem
- status

==================================================
PÁGINA 10 — PLANOS E ASSINATURAS
==================================================

Rota:
admin/planos-assinaturas

Objetivo:
Preparar monetização futura.

Mostrar:
- planos existentes
- assinaturas ativas
- usuários no plano grátis
- usuários no plano Pro
- destaques pagos
- créditos de lead

Planos sugeridos:
- Grátis
- Pro
- Destaque
- Premium

Tabela:
- usuário/taxista
- plano
- status
- início
- fim
- valor
- forma de pagamento
- renovação

Mesmo que ainda não esteja monetizando, criar estrutura visual e fallback.

==================================================
PÁGINA 11 — METAS E DESAFIOS
==================================================

Rota:
admin/metas-desafios

Objetivo:
Gerenciar Minha Meta e desafios/rota do dia.

Seções:
1. Minha Meta
- usuários que criaram meta
- meta média diária
- meta média mensal
- usuários ativos com meta

2. Desafio/Rota do Dia
- rota atual
- número de participantes
- palpites
- vencedores
- histórico de desafios

Ações:
- criar nova rota do dia
- editar desafio
- ativar/desativar
- ver respostas

==================================================
PÁGINA 12 — AVALIAÇÕES
==================================================

Rota:
admin/avaliacoes

Objetivo:
Gerenciar avaliações de taxistas/corridas.

Cards:
- avaliação média
- total de avaliações
- avaliações pendentes
- avaliações negativas

Tabela:
- taxista
- passageiro
- nota
- comentário
- corrida
- data
- status

Ações:
- aprovar
- ocultar
- responder
- ver corrida

==================================================
PÁGINA 13 — NOTIFICAÇÕES
==================================================

Rota:
admin/notificacoes

Objetivo:
Gerenciar notificações internas/futuras push/e-mail/WhatsApp.

Mostrar:
- notificações enviadas
- notificações pendentes
- notificações de agendamento
- templates

Tipos:
- novo agendamento
- corrida cancelada
- lembrete
- sistema
- parceiro
- desafio

Preparar estrutura para futuro PWA push/WhatsApp.

==================================================
PÁGINA 14 — SUPORTE
==================================================

Rota:
admin/suporte

Objetivo:
Centralizar feedbacks, bugs e contatos.

Incluir principalmente feedback pós-cálculo.

Cards:
- feedbacks recebidos
- bugs reportados
- valores contestados
- chamados abertos
- chamados resolvidos

Tabela:
- tipo
- usuário
- rota
- valor calculado
- valor que taxista cobraria
- mensagem
- data
- status

Status:
- novo
- em análise
- resolvido
- descartado

Ações:
- ver detalhe
- responder WhatsApp
- marcar resolvido
- vincular à cotação

==================================================
PÁGINA 15 — CONFIGURAÇÕES
==================================================

Rota:
admin/configuracoes

Objetivo:
Configurar regras gerais do sistema.

Seções:
1. Tarifas
- bandeirada comum
- km comum bandeira 1
- km comum bandeira 2
- hora parada comum
- bandeirada luxo
- km luxo bandeira 1
- km luxo bandeira 2
- hora parada luxo

2. Trânsito
- ativar/desativar adicional
- limite máximo %
- regra de cálculo
- texto explicativo

3. Pedágio
- regra de inclusão
- manual/automático
- exibir no cálculo

4. Categorias
- comum
- luxo
- executivo

5. Parceiros
- categorias de parceiros

6. Sistema
- logo
- cores
- textos principais

IMPORTANTE:
Toda alteração crítica deve exigir confirmação.

==================================================
PÁGINA 16 — RELATÓRIOS
==================================================

Rota:
admin/relatorios

Objetivo:
Gerar relatórios da operação.

Relatórios:
- cotações por período
- cotações por categoria
- cotações por bandeira
- rotas mais calculadas
- taxistas ativos
- agendamentos
- corridas realizadas
- parceiros
- usuários recorrentes
- feedbacks de cálculo

Filtros:
- período
- cidade
- categoria
- bandeira
- tipo
- taxista

Ações:
- exportar CSV
- exportar PDF, se já existir
- baixar relatório

==================================================
COMPONENTES REUTILIZÁVEIS
==================================================

Criar ou melhorar componentes:

- AdminLayout
- Sidebar
- Topbar
- KpiCard
- DataTable
- FilterBar
- StatusBadge
- CategoryBadge
- FlagBadge
- RideTypeBadge
- EmptyState
- LoadingState
- ErrorState
- DetailModal
- ChartCard
- MetricCard

==================================================
RESPONSIVIDADE
==================================================

Desktop:
- sidebar fixa
- grid amplo
- tabelas completas

Tablet:
- sidebar colapsável
- cards em 2 colunas

Mobile:
- drawer menu
- cards empilhados
- tabelas viram cards
- filtros em botão/modal

==================================================
LÓGICAS IMPORTANTES
==================================================

1. Cálculo alto não deve parecer bug:
Sempre exibir categoria, bandeira, tipo, trânsito, extra e pedágio.

2. Cotações precisam ser auditáveis:
O admin deve conseguir entender rapidamente o preço.

3. Agendamento precisa ser operacional:
Admin deve conseguir ver pendentes, abrir WhatsApp e alterar status.

4. Taxistas precisam ser gerenciáveis:
Perfil público, link, status e categorias precisam aparecer claramente.

5. Financeiro é estimado:
Não fingir que é dinheiro recebido se ainda não passa pela plataforma.

6. Feedback pós-cálculo precisa ir para suporte:
Qualquer reclamação de valor deve virar item analisável.

==================================================
CRITÉRIOS DE ACEITE
==================================================

A implementação estará correta se:

1. Sidebar tem todos os menus solicitados.
2. Dashboard parece visualmente próximo da referência.
3. Todas as páginas têm estrutura mínima funcional.
4. Admin atual foi analisado e reaproveitado.
5. Nenhuma lógica existente foi quebrada.
6. Cotações exibem categoria, bandeira, tipo, trânsito, pedágio e extra.
7. Agendamentos têm status e ações.
8. Taxistas têm perfil público e link.
9. Feedback pós-cálculo aparece no suporte.
10. Layout é responsivo.
11. Dados ausentes têm fallback/estado vazio.
12. O sistema fica mais fácil de operar.
13. O admin fica mais organizado, bonito e confiável.