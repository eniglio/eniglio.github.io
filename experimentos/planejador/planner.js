(function () {
  'use strict';

  const STORAGE_KEY = 'eniglio-delivery-planner-v1';
  const phases = [
    { id: 'discovery', label: 'Descoberta' },
    { id: 'planning', label: 'Planejamento' },
    { id: 'build', label: 'Construção' },
    { id: 'validation', label: 'Validação' },
    { id: 'launch', label: 'Lançamento' }
  ];
  const roles = ['Produto', 'Design', 'Backend', 'Frontend', 'Dados / IA', 'QA', 'Segurança', 'Plataforma'];
  const roleOptions = roles.map(function (role) { return '<option value="' + escapeHtml(role) + '">' + escapeHtml(role) + '</option>'; }).join('');

  const templates = {
    web: [
      task('discovery', 'Definir resultado e métrica de sucesso', 'Acordar baseline, público afetado e como o resultado será observado.', 'Produto', 2, false),
      task('discovery', 'Mapear jornada e principais exceções', 'Entrevistar usuários e registrar os fluxos que entram no primeiro recorte.', 'Produto', 3, false),
      task('planning', 'Priorizar o MVP e critérios de aceite', 'Converter o resultado esperado em histórias verificáveis e fora de escopo explícito.', 'Produto', 2, false),
      task('planning', 'Definir dados, acesso e integrações', 'Identificar fontes de dados, permissões, retenção e dependências externas.', 'Backend', 2, true),
      task('build', 'Implementar a experiência principal', 'Construir os fluxos de maior valor e os estados de carregamento, vazio e erro.', 'Frontend', 8, true),
      task('build', 'Implementar serviços e persistência', 'Criar endpoints, regras de negócio, validação e armazenamento necessários ao MVP.', 'Backend', 8, true),
      task('build', 'Integrar autenticação e sistemas existentes', 'Conectar os provedores confirmados e tratar indisponibilidade e permissões.', 'Backend', 4, true),
      task('validation', 'Testar fluxos críticos e regressões', 'Validar cenários principais, exceções, desempenho percebido e acessibilidade básica.', 'QA', 4, true),
      task('validation', 'Revisar segurança e privacidade', 'Verificar controles de acesso, dados coletados e exposição indevida.', 'Segurança', 2, false),
      task('launch', 'Preparar piloto e suporte', 'Definir grupo piloto, comunicação, suporte e critérios para expandir ou recuar.', 'Produto', 2, false),
      task('launch', 'Instrumentar adoção e resultado', 'Registrar eventos mínimos para observar uso, conclusão e resultado acordado.', 'Dados / IA', 2, true)
    ],
    integration: [
      task('discovery', 'Mapear sistemas, donos e fluxo atual', 'Identificar produtores, consumidores, volume, dados sensíveis e pontos de falha.', 'Produto', 3, false),
      task('discovery', 'Confirmar contrato e resultado esperado', 'Acordar dados obrigatórios, latência, disponibilidade e critério de reconciliação.', 'Backend', 2, false),
      task('planning', 'Definir arquitetura e estratégia de integração', 'Escolher síncrono, assíncrono ou lote a partir de volume, tolerância e dependências.', 'Backend', 3, true),
      task('planning', 'Definir autenticação, autorização e auditoria', 'Documentar credenciais, escopos, rotação, trilha e classificação dos dados.', 'Segurança', 2, false),
      task('build', 'Implementar adaptadores e transformação', 'Mapear contratos, validar payloads e tratar idempotência e compatibilidade.', 'Backend', 8, true),
      task('build', 'Implementar fila, retentativas e reconciliação', 'Definir política de repetição, fila de erro e recuperação sem duplicar efeitos.', 'Backend', 6, true),
      task('build', 'Integrar observabilidade e alertas', 'Registrar correlação, falhas, atrasos e volume com alertas acionáveis.', 'Plataforma', 3, true),
      task('validation', 'Testar contrato, volume e falhas', 'Simular indisponibilidade, mensagens inválidas, duplicidade e recuperação.', 'QA', 5, true),
      task('validation', 'Validar dados com os sistemas de origem', 'Comparar amostras, totais e reconciliações com os donos dos dados.', 'Dados / IA', 3, false),
      task('launch', 'Planejar ativação e reversão', 'Usar uma janela ou grupo de implantação e confirmar como interromper o fluxo.', 'Plataforma', 2, false),
      task('launch', 'Acompanhar operação assistida', 'Observar volume, erros, atrasos e chamados após a ativação.', 'Produto', 2, false)
    ],
    data: [
      task('discovery', 'Definir decisão que os dados vão apoiar', 'Identificar usuário, decisão, frequência e custo de uma resposta errada.', 'Produto', 2, false),
      task('discovery', 'Inventariar fontes e qualidade dos dados', 'Verificar disponibilidade, atualidade, definição e restrições de uso.', 'Dados / IA', 4, false),
      task('planning', 'Definir modelo semântico e indicadores', 'Acordar fórmulas, dimensões e proprietário de cada indicador.', 'Dados / IA', 3, false),
      task('planning', 'Definir acessos e governança', 'Documentar classificação, permissões, retenção e controles de exportação.', 'Segurança', 2, false),
      task('build', 'Implementar ingestão e transformação', 'Criar cargas reproduzíveis, validação de esquema e tratamento de dados inválidos.', 'Dados / IA', 8, true),
      task('build', 'Construir modelo analítico e consultas', 'Preparar modelo de consumo com granularidade e regras acordadas.', 'Dados / IA', 6, true),
      task('build', 'Criar visualização ou entrega analítica', 'Disponibilizar a informação no fluxo de trabalho do usuário.', 'Frontend', 5, true),
      task('validation', 'Validar indicadores com o negócio', 'Reconciliar valores com fontes conhecidas e registrar diferenças.', 'Produto', 3, false),
      task('validation', 'Testar qualidade, acesso e atualização', 'Monitorar completude, atraso, consistência e controle por perfil.', 'QA', 3, true),
      task('launch', 'Publicar com documentação e responsáveis', 'Definir suporte, glossário, proprietário e processo de mudança.', 'Produto', 2, false),
      task('launch', 'Acompanhar adoção e uso na decisão', 'Revisar se a informação é usada e se reduz o problema acordado.', 'Dados / IA', 2, false)
    ],
    automation: [
      task('discovery', 'Mapear processo atual e volume', 'Registrar etapas, exceções, aprovações, retrabalho e tempo de espera.', 'Produto', 3, false),
      task('discovery', 'Quantificar baseline e resultado esperado', 'Medir frequência, esforço manual e risco do processo antes da mudança.', 'Produto', 2, false),
      task('planning', 'Definir fluxo futuro e controles humanos', 'Estabelecer quando automatizar, pedir aprovação ou encaminhar para uma pessoa.', 'Produto', 3, false),
      task('planning', 'Definir sistemas, permissões e auditoria', 'Confirmar integrações e menor privilégio necessário para cada etapa.', 'Segurança', 2, false),
      task('build', 'Implementar regras e orquestração', 'Construir etapas, condições, idempotência e estados recuperáveis.', 'Backend', 7, true),
      task('build', 'Integrar sistemas e notificações', 'Conectar fontes e destinos com rastreabilidade de cada execução.', 'Backend', 6, true),
      task('build', 'Criar fila de exceção e revisão', 'Permitir corrigir casos ambíguos e retomar o processo com histórico.', 'Frontend', 4, true),
      task('validation', 'Testar exceções e controles de aprovação', 'Verificar casos-limite, falha parcial, duplicidade e aprovações.', 'QA', 4, true),
      task('validation', 'Medir tempo, qualidade e esforço residual', 'Comparar uma amostra com o baseline sem contar execução como benefício realizado.', 'Dados / IA', 2, false),
      task('launch', 'Executar piloto com limite de volume', 'Começar com supervisão, critérios de parada e responsável identificado.', 'Produto', 2, false),
      task('launch', 'Monitorar exceções e reprocessamentos', 'Definir alertas, escalonamento e revisão periódica das regras.', 'Plataforma', 2, true)
    ],
    ai: [
      task('discovery', 'Definir tarefa e limite de autonomia da IA', 'Delimitar usuários, decisões assistidas, danos possíveis e ações que exigem aprovação.', 'Produto', 3, false),
      task('discovery', 'Verificar dados, fontes e direitos de uso', 'Confirmar qualidade, acesso, privacidade e autorização para os dados.', 'Dados / IA', 4, false),
      task('planning', 'Comparar prompt, RAG, regras e modelo', 'Escolher a abordagem por necessidade de conhecimento, atualização, risco e custo.', 'Dados / IA', 3, false),
      task('planning', 'Definir critérios de qualidade e fallback', 'Acordar groundedness, relevância, limites de confiança e encaminhamento humano.', 'Produto', 3, false),
      task('build', 'Implementar integração com modelo', 'Criar prompts versionados, respostas estruturadas, timeouts e tratamento de erros.', 'Backend', 7, true),
      task('build', 'Implementar contexto e recuperação', 'Preparar ingestão, busca e citações se documentos forem necessários ao caso.', 'Dados / IA', 7, true),
      task('build', 'Criar experiência de revisão humana', 'Mostrar fontes, incerteza e ações de aceitar, editar ou recusar.', 'Frontend', 5, true),
      task('validation', 'Avaliar qualidade com conjunto representativo', 'Testar casos comuns, limites, respostas sem suporte e regressões antes de liberar.', 'QA', 5, true),
      task('validation', 'Testar prompt injection e vazamento', 'Verificar isolamento de dados, permissões, instruções maliciosas e abuso de ferramenta.', 'Segurança', 4, false),
      task('launch', 'Publicar com limites e telemetria', 'Configurar limites de uso, logs seguros, alertas e estratégia de fallback.', 'Plataforma', 3, true),
      task('launch', 'Revisar custo, qualidade e feedback', 'Acompanhar consumo e erros; revisar a solução com usuários e responsáveis.', 'Produto', 2, false)
    ]
  };

  const aiProductTasks = [
    task('planning', 'Definir política de uso e limites da IA', 'Documentar usos permitidos, dados que não podem ser enviados e decisões que exigem revisão humana.', 'Produto', 2, false, true),
    task('build', 'Preparar conjunto de avaliação e cenários de risco', 'Criar exemplos representativos, casos adversariais e critérios de aceitação antes de liberar.', 'Dados / IA', 3, false, true),
    task('validation', 'Validar grounding, segurança e regressões', 'Executar avaliação de qualidade, citações, injeção de prompt e comportamento de fallback.', 'QA', 4, false, true),
    task('validation', 'Revisar privacidade, acesso e retenção', 'Confirmar limites de dados, permissões, registros e condições do fornecedor.', 'Segurança', 2, false, true),
    task('launch', 'Instrumentar custo, latência e qualidade', 'Definir métricas, orçamento de uso, alertas e processo para rever ou desligar o recurso.', 'Plataforma', 3, false, true)
  ];

  function suggestionsFromBrief(brief) {
    const text = String(brief || '').toLowerCase();
    const rules = [
      { pattern: /aprova|approval|gestor|manager/, term: 'aprovação', phase: 'planning', title: 'Especificar estados e regras de aprovação', description: 'Acordar responsáveis, transições, prazos e trilha de cada decisão de aprovação.', role: 'Produto', days: 2, ai: false },
      { pattern: /acess|permiss|login|perfil|access/, term: 'acesso', phase: 'discovery', title: 'Definir perfis, permissões e auditoria', description: 'Confirmar quem pode solicitar, aprovar, consultar e alterar cada recurso.', role: 'Segurança', days: 2, ai: false },
      { pattern: /e-?mail|caixa de entrada/, term: 'e-mail', phase: 'build', title: 'Planejar entrada estruturada e notificações', description: 'Definir como pedidos chegam ao sistema e como as pessoas recebem atualizações.', role: 'Frontend', days: 3, ai: true },
      { pattern: /api|integra|erp|sap|crm|sistema existente/, term: 'integração', phase: 'planning', title: 'Acordar contratos e política de falhas', description: 'Confirmar formatos, donos, limites, retentativas e responsabilidade de cada sistema.', role: 'Backend', days: 2, ai: true },
      { pattern: /pagament|cobr|invoice|fatur|finance/, term: 'pagamentos', phase: 'validation', title: 'Conciliar eventos com a fonte financeira', description: 'Definir como verificar valores, duplicidade, reembolso e reconciliação.', role: 'Dados / IA', days: 3, ai: false },
      { pattern: /celular|mobile|móvel|responsiv/, term: 'uso móvel', phase: 'validation', title: 'Validar fluxos em telas pequenas', description: 'Revisar leitura, navegação, entrada de dados e acessibilidade em dispositivos móveis.', role: 'QA', days: 2, ai: true },
      { pattern: /pdf|document|contrato|política|policy/, term: 'documentos', phase: 'planning', title: 'Confirmar origem e acesso aos documentos', description: 'Identificar versões oficiais, permissões, atualização e política de retenção.', role: 'Segurança', days: 2, ai: false },
      { pattern: /volume|escala|latência|latency|desempenho|performance/, term: 'volume e desempenho', phase: 'validation', title: 'Definir limites e teste de carga', description: 'Acordar volume de pico, latência aceitável e comportamento sob saturação.', role: 'QA', days: 3, ai: false }
    ];
    return rules.filter(function (rule) { return rule.pattern.test(text); }).slice(0, 4).map(function (rule) {
      const item = task(rule.phase, rule.title, rule.description, rule.role, rule.days, rule.ai);
      item.briefMatch = rule.term;
      return item;
    });
  }

  const $ = function (id) { return document.getElementById(id); };
  const form = $('projectForm');
  const board = $('board');
  const inputs = ['projectName', 'projectType', 'projectBrief', 'productAI', 'startDate', 'operationMonths', 'teamSize', 'focusDays', 'dayRate', 'contingency', 'aiGain', 'reviewOverhead', 'assistCost', 'monthlyBenefit', 'monthlyOperations', 'monthlyCalls', 'costPerThousand'];
  let tasks = [];
  let generated = false;
  let generatedBrief = '';
  let toastTimer;

  function task(phase, title, description, role, days, aiEligible, productAI) {
    return { id: 't' + Math.random().toString(36).slice(2, 9), phase: phase, title: title, description: description, role: role, days: days, aiEligible: !!aiEligible, productAI: !!productAI, included: true };
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function localDateValue(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  function value(id, fallback) {
    const element = $(id);
    if (!element) return fallback;
    if (element.type === 'checkbox') return element.checked;
    const number = element.type === 'number' ? Number(element.value) : null;
    return element.type === 'number' ? (Number.isFinite(number) ? number : fallback) : (element.value || fallback);
  }

  function escCsv(valueText) {
    let text = String(valueText == null ? '' : valueText);
    if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }

  function currency(number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number.isFinite(number) ? number : 0);
  }

  function numberFormat(number, maximum) {
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: maximum == null ? 1 : maximum }).format(Number.isFinite(number) ? number : 0);
  }

  function roundHalf(valueNumber) {
    return Math.max(0.5, Math.ceil(valueNumber * 2) / 2);
  }

  function dateLabel(weeks, startDateText) {
    if (!startDateText || !weeks) return 'Data a definir';
    const start = new Date(startDateText + 'T12:00:00');
    if (Number.isNaN(start.getTime())) return 'Data a definir';
    const due = new Date(start.getTime());
    due.setDate(due.getDate() + Math.ceil(weeks * 7));
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(due).replace('.', '');
  }

  function saveState() {
    const data = { generated: generated, generatedBrief: generatedBrief, tasks: tasks, inputs: {} };
    inputs.forEach(function (id) {
      const element = $(id);
      if (element) data.inputs[id] = element.type === 'checkbox' ? element.checked : element.value;
    });
    let storageAvailable = false;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); storageAvailable = true; } catch (error) { /* Private browsing can disable storage. */ }
    const badge = $('saveBadgeText');
    const footer = $('saveFooterText');
    if (badge) badge.textContent = storageAvailable ? 'RASCUNHO SALVO NESTE NAVEGADOR' : 'RASCUNHO SÓ NESTA SESSÃO';
    if (footer) footer.textContent = storageAvailable ? 'Salvo localmente neste navegador' : 'Armazenamento local indisponível; mantenha esta aba aberta';
  }

  function restoreState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || !data.inputs) return false;
      inputs.forEach(function (id) {
        const element = $(id);
        if (!element || data.inputs[id] == null) return;
        if (element.type === 'checkbox') element.checked = !!data.inputs[id];
        else element.value = data.inputs[id];
      });
      generated = !!data.generated;
      generatedBrief = String(data.generatedBrief || data.inputs.projectBrief || '');
      tasks = Array.isArray(data.tasks) ? data.tasks : [];
      return generated;
    } catch (error) { return false; }
  }

  function selectedTasks() { return tasks.filter(function (item) { return item.included; }); }

  function compute() {
    const chosen = selectedTasks();
    const baseDays = chosen.reduce(function (sum, item) { return sum + Math.max(0, Number(item.days) || 0); }, 0);
    const eligibleDays = chosen.reduce(function (sum, item) { return sum + (item.aiEligible ? Math.max(0, Number(item.days) || 0) : 0); }, 0);
    const gain = Math.max(0, Math.min(80, value('aiGain', 20))) / 100;
    const review = Math.max(0, value('reviewOverhead', 15)) / 100;
    const assistedDays = Math.max(0, baseDays - eligibleDays * gain + eligibleDays * review);
    const team = Math.max(1, value('teamSize', 5));
    const focused = Math.max(0.5, Math.min(5, value('focusDays', 3)));
    const capacity = team * focused;
    const weeksBase = baseDays ? roundHalf(baseDays / capacity) : 0;
    const weeksAI = assistedDays ? roundHalf(assistedDays / capacity) : 0;
    const rate = Math.max(0, value('dayRate', 900));
    const monthlyAssist = Math.max(0, value('assistCost', 500));
    const horizon = Math.max(1, value('operationMonths', 12));
    const contingency = Math.max(0, Math.min(100, value('contingency', 15))) / 100;
    const hasProductAI = !!value('productAI', false);
    const sharedOps = Math.max(0, value('monthlyOperations', 0)) * horizon;
    const runtime = hasProductAI ? Math.max(0, value('monthlyCalls', 0)) / 1000 * Math.max(0, value('costPerThousand', 0)) * horizon : 0;
    const laborBase = baseDays * rate;
    const laborAI = assistedDays * rate;
    const licenseBase = 0;
    const licenseAI = monthlyAssist * weeksAI / 4.33;
    const reserveBase = (laborBase + licenseBase + sharedOps + runtime) * contingency;
    const reserveAI = (laborAI + licenseAI + sharedOps + runtime) * contingency;
    const totalBase = laborBase + licenseBase + sharedOps + runtime + reserveBase;
    const totalAI = laborAI + licenseAI + sharedOps + runtime + reserveAI;
    const benefit = Math.max(0, value('monthlyBenefit', 0)) * horizon;
    const phasesBase = {};
    const phasesAI = {};
    phases.forEach(function (phase) {
      const phaseTasks = chosen.filter(function (item) { return item.phase === phase.id; });
      const effort = phaseTasks.reduce(function (sum, item) { return sum + Math.max(0, Number(item.days) || 0); }, 0);
      const phaseEligible = phaseTasks.reduce(function (sum, item) { return sum + (item.aiEligible ? Math.max(0, Number(item.days) || 0) : 0); }, 0);
      phasesBase[phase.id] = { effort: effort, weeks: effort ? effort / capacity : 0 };
      const assistedEffort = Math.max(0, effort - phaseEligible * gain + phaseEligible * review);
      phasesAI[phase.id] = { effort: assistedEffort, weeks: assistedEffort ? assistedEffort / capacity : 0 };
    });
    const startDate = value('startDate', '');
    return {
      count: chosen.length, baseDays: baseDays, eligibleDays: eligibleDays, assistedDays: assistedDays,
      weeksBase: weeksBase, weeksAI: weeksAI, capacity: capacity, laborBase: laborBase, laborAI: laborAI,
      licenseBase: licenseBase, licenseAI: licenseAI, sharedOps: sharedOps, runtime: runtime, reserveBase: reserveBase,
      reserveAI: reserveAI, totalBase: totalBase, totalAI: totalAI, benefit: benefit,
      netBase: benefit - totalBase, netAI: benefit - totalAI, phasesBase: phasesBase, phasesAI: phasesAI,
      startDate: startDate, dueBase: dateLabel(weeksBase, startDate), dueAI: dateLabel(weeksAI, startDate),
      horizon: horizon, hasProductAI: hasProductAI, gainPercent: gain * 100, reviewPercent: review * 100
    };
  }

  function renderSummary(result) {
    const summary = $('summaryStrip');
    summary.innerHTML = [
      summaryItem('CARDS NO ESCOPO', String(result.count), 'Sugestões selecionadas'),
      summaryItem('ESFORÇO BASE', numberFormat(result.baseDays, 0) + ' pd', 'Pessoas-dia estimadas'),
      summaryItem('PRAZO SEM APOIO DE IA', numberFormat(result.weeksBase, 1) + ' sem.', 'Capacidade informada'),
      summaryItem('CUSTO COM APOIO DE IA', currency(result.totalAI), 'Implementação + operação')
    ].join('');
    $('cardCountBadge').textContent = String(result.count);
  }

  function summaryItem(label, amount, note) {
    return '<div class="summary-item"><span class="summary-label">' + escapeHtml(label) + '</span><strong class="summary-value">' + escapeHtml(amount) + '</strong><span class="summary-sub">' + escapeHtml(note) + '</span></div>';
  }

  function renderBoard() {
    const chosen = selectedTasks();
    board.innerHTML = phases.map(function (phase) {
      const phaseTasks = tasks.filter(function (item) { return item.phase === phase.id; });
      const includedCount = phaseTasks.filter(function (item) { return item.included; }).length;
      return '<section class="phase-column" aria-label="Fase ' + escapeHtml(phase.label) + '"><header class="phase-heading"><div><h4>' + escapeHtml(phase.label) + '</h4><small>' + includedCount + ' de ' + phaseTasks.length + ' no escopo</small></div><span class="phase-count">' + phaseTasks.length + '</span></header><div class="task-list">' + (phaseTasks.length ? phaseTasks.map(renderTask).join('') : '<div class="empty-phase">Nenhum card nesta fase.</div>') + '</div></section>';
    }).join('');
    $('includedSummary').textContent = chosen.length + ' card' + (chosen.length === 1 ? '' : 's') + ' no escopo · ' + numberFormat(chosen.reduce(function (sum, item) { return sum + (Number(item.days) || 0); }, 0), 0) + ' pessoas-dia';
  }

  function renderTask(item) {
    return '<article class="task-card ' + (item.included ? '' : 'excluded') + '" data-card-id="' + escapeHtml(item.id) + '">' +
      '<div class="task-top"><input class="include-task" data-field="included" type="checkbox" aria-label="Incluir ' + escapeHtml(item.title) + ' no escopo" ' + (item.included ? 'checked' : '') + '><input class="task-title" data-field="title" aria-label="Título do card" maxlength="100" value="' + escapeHtml(item.title) + '"><button class="task-delete" type="button" data-action="delete" aria-label="Remover card ' + escapeHtml(item.title) + '" title="Remover card">×</button></div>' +
      '<p class="task-description">' + escapeHtml(item.description) + '</p>' +
      '<div class="task-meta"><label>Responsável <select data-field="role" aria-label="Responsável sugerido">' + roleOptions.replace('value="' + escapeHtml(item.role) + '"', 'value="' + escapeHtml(item.role) + '" selected') + '</select></label><label class="task-estimate">Esforço <input type="number" min="0" step="0.5" value="' + escapeHtml(item.days) + '" data-field="days" aria-label="Esforço em pessoas-dia"> pd</label>' + (item.aiEligible ? '<span class="task-badge"><i class="legend-dot ai-dot"></i> IA pode apoiar a execução</span>' : '') + (item.briefMatch ? '<span class="task-badge brief-badge">Pista: ' + escapeHtml(item.briefMatch) + '</span>' : '') + '</div></article>';
  }

  function renderSchedule(result) {
    const gain = result.eligibleDays ? (result.baseDays - result.assistedDays) / result.eligibleDays * 100 : 0;
    const timeDelta = result.weeksBase - result.weeksAI;
    const timeNote = timeDelta === 0 ? 'O prazo arredonda para a mesma faixa de ' + numberFormat(result.weeksBase, 1) + ' semanas nos dois cenários.' : 'Prazo modelado ' + (timeDelta > 0 ? 'menor em ' : 'maior em ') + numberFormat(Math.abs(timeDelta), 1) + ' semana(s) com apoio de IA.';
    $('scheduleScenarios').innerHTML = scenarioCard('SEM APOIO DE IA', 'Execução com o processo atual e as tarefas selecionadas.', result.weeksBase, result.baseDays, result.dueBase, false, null) +
      scenarioCard('COM APOIO DE IA', 'Premissa: ' + numberFormat(result.gainPercent, 0) + '% menos esforço elegível; revisão humana adicional de ' + numberFormat(result.reviewPercent, 0) + '%.', result.weeksAI, result.assistedDays, result.dueAI, true,
        result.eligibleDays ? (gain >= 0 ? 'Redução líquida modelada de ' + numberFormat(Math.max(0, gain), 0) + '% do esforço elegível.' : 'A revisão estimada supera a redução de esforço nas tarefas elegíveis.') : 'Nenhum card selecionado está marcado como elegível a apoio de IA.') +
      (result.weeksBase && result.weeksAI ? '<p class="scenario-delta">' + escapeHtml(timeNote) + '</p>' : '');
    const maxWeeks = Math.max(result.weeksBase, result.weeksAI, 0.5);
    $('timelineChart').innerHTML = timelineLane('SEM APOIO DE IA', result.phasesBase, result.weeksBase, maxWeeks, false) + timelineLane('COM APOIO DE IA', result.phasesAI, result.weeksAI, maxWeeks, true) + '<div class="timeline-weeks"><span>0</span><span>' + numberFormat(maxWeeks / 4, 1) + '</span><span>' + numberFormat(maxWeeks / 2, 1) + '</span><span>' + numberFormat(maxWeeks * .75, 1) + '</span><span>' + numberFormat(maxWeeks, 1) + ' sem.</span></div>';
  }

  function scenarioCard(label, description, weeks, days, due, withAI, footnote) {
    return '<article class="scenario-card ' + (withAI ? 'ai-scenario' : '') + '"><div class="scenario-label"><span>' + escapeHtml(label) + '</span>' + (withAI ? '<span>SIMULAÇÃO</span>' : '<span>BASELINE</span>') + '</div><strong class="scenario-number">' + (weeks ? numberFormat(weeks, 1) + ' sem.' : 'Sem cards') + '</strong><span class="scenario-caption">' + escapeHtml(description) + '</span><div class="scenario-stats"><div><span>ESFORÇO DA EQUIPE</span><b>' + numberFormat(days, 1) + ' pd</b></div><div><span>CONCLUSÃO INDICATIVA</span><b>' + escapeHtml(due) + '</b></div></div>' + (footnote ? '<p class="scenario-delta">' + escapeHtml(footnote) + '</p>' : '') + '</article>';
  }

  function timelineLane(label, phaseValues, totalWeeks, maxWeeks, withAI) {
    const totalWidth = totalWeeks ? Math.min(100, totalWeeks / maxWeeks * 100) : 0;
    const segments = phases.map(function (phase, index) {
      const weeks = phaseValues[phase.id].weeks;
      const width = weeks && totalWeeks ? Math.min(100, weeks / totalWeeks * 100) : 0;
      return '<div class="phase-segment phase-' + index + '" style="width:' + width.toFixed(2) + '%" aria-label="' + escapeHtml(phase.label + ': ' + numberFormat(weeks, 1) + ' semanas') + '"><span>' + (width >= 12 ? escapeHtml(phase.label) : '') + '</span></div>';
    }).join('');
    const details = phases.map(function (phase) { return '<span><b>' + escapeHtml(phase.label) + '</b><small>' + numberFormat(phaseValues[phase.id].weeks, 1) + ' sem.</small></span>'; }).join('');
    return '<div class="timeline-lane ' + (withAI ? 'ai-lane' : '') + '"><div class="lane-heading"><span>' + escapeHtml(label) + '</span><b>' + numberFormat(totalWeeks, 1) + ' sem.</b></div><div class="stacked-track" role="img" aria-label="' + escapeHtml(label + ', ' + numberFormat(totalWeeks, 1) + ' semanas. ' + phases.map(function (phase) { return phase.label + ': ' + numberFormat(phaseValues[phase.id].weeks, 1) + ' semanas'; }).join('; ')) + '"><div class="phase-track-fill" style="width:' + totalWidth.toFixed(2) + '%">' + segments + '</div></div><div class="phase-details">' + details + '</div></div>';
  }

  function renderCosts(result) {
    const maxCost = Math.max(result.totalBase, result.totalAI, 1);
    const costDelta = result.totalBase - result.totalAI;
    $('costComparison').innerHTML = costCard('SEM APOIO DE IA', result.totalBase, result.laborBase, result.licenseBase, result.sharedOps, result.runtime, result.reserveBase, maxCost, false) +
      costCard('COM APOIO DE IA', result.totalAI, result.laborAI, result.licenseAI, result.sharedOps, result.runtime, result.reserveAI, maxCost, true) +
      '<div class="delta-callout" style="grid-column:1/-1">' + (costDelta >= 0 ? 'O cenário com apoio de IA estima <strong>' + currency(costDelta) + ' a menos</strong>' : 'O cenário com apoio de IA estima <strong>custo adicional de ' + currency(Math.abs(costDelta)) + '</strong>') + ' no horizonte informado, já incluindo ferramentas, operação e reserva para risco. A diferença depende das premissas de esforço e preço preenchidas.</div>';
    if (result.benefit > 0) {
      const net = result.netAI;
      const ratioLabel = result.totalAI > 0 ? numberFormat((result.benefit - result.totalAI) / result.totalAI * 100, 0) + '% sobre o custo' : 'não calculável com custo estimado igual a zero';
      $('benefitPanel').innerHTML = '<strong class="benefit-number">' + currency(result.benefit) + '</strong><p>Benefício bruto informado no horizonte de ' + result.horizon + ' meses. Depois do custo estimado do cenário com apoio de IA, o saldo ilustrativo seria <b>' + currency(net) + '</b> (' + ratioLabel + ').<small>Não é ROI comprovado: valide baseline, adoção, valor capturado e custos de mudança.</small></p>';
    } else {
      $('benefitPanel').innerHTML = '<strong class="benefit-number">Benefício não informado</strong><p>Você pode preencher o benefício bruto mensal esperado nas premissas para visualizar um saldo ilustrativo. O cálculo não valida se o benefício será realizado.</p>';
    }
    const productLabel = result.hasProductAI ? 'Mesmo custo de operação do recurso de IA' : 'Sem custo operacional de IA do produto';
    const rows = [
      breakdownRow('Trabalho de implementação', currency(result.laborBase), currency(result.laborAI)),
      breakdownRow('Licenças de apoio à construção', currency(result.licenseBase), currency(result.licenseAI)),
      breakdownRow('Infraestrutura e operação adicional', currency(result.sharedOps), currency(result.sharedOps)),
      breakdownRow(productLabel, currency(result.runtime), currency(result.runtime)),
      breakdownRow('Reserva para risco (' + numberFormat(value('contingency', 15), 0) + '%)', currency(result.reserveBase), currency(result.reserveAI)),
      breakdownRow('TOTAL ESTIMADO NO HORIZONTE', currency(result.totalBase), currency(result.totalAI), true)
    ];
    $('costBreakdownRows').innerHTML = '<div class="breakdown-row"><span></span><b class="breakdown-head">SEM APOIO DE IA</b><b class="breakdown-head">COM APOIO DE IA</b></div>' + rows.join('');
  }

  function costCard(label, total, labor, license, sharedOps, runtime, reserve, maxCost, withAI) {
    const width = Math.min(100, total / maxCost * 100);
    return '<article class="cost-card ' + (withAI ? 'ai-scenario' : '') + '"><header><span>' + escapeHtml(label) + '</span><span>' + value('operationMonths', 12) + ' MESES</span></header><strong class="cost-total">' + currency(total) + '</strong><span class="cost-subtitle">Implementação + operação + reserva</span><div class="cost-bar" aria-label="Custo proporcional"><i style="width:' + width.toFixed(1) + '%"></i></div><div class="cost-lines"><div class="cost-line"><span>Mão de obra</span><b>' + currency(labor) + '</b></div><div class="cost-line"><span>Ferramentas de construção</span><b>' + currency(license) + '</b></div><div class="cost-line"><span>Infraestrutura e operação</span><b>' + currency(sharedOps) + '</b></div><div class="cost-line"><span>' + (value('productAI', false) ? 'Inferência do modelo' : 'Inferência de IA, se ativada') + '</span><b>' + currency(runtime) + '</b></div><div class="cost-line"><span>Reserva de risco</span><b>' + currency(reserve) + '</b></div></div></article>';
  }

  function breakdownRow(label, base, ai, total) {
    return '<div class="breakdown-row' + (total ? ' breakdown-total' : '') + '"><span>' + escapeHtml(label) + '</span><b>' + escapeHtml(base) + '</b><b>' + escapeHtml(ai) + '</b></div>';
  }

  function renderAll() {
    $('resultProjectName').textContent = value('projectName', 'Novo projeto');
    $('resultBrief').textContent = value('projectBrief', '') || 'Briefing não informado. Edite esta descrição no painel à esquerda.';
    renderBoard();
    updateMetrics();
    saveState();
  }

  function updateMetrics() {
    $('resultProjectName').textContent = value('projectName', 'Novo projeto');
    $('resultBrief').textContent = value('projectBrief', '') || 'Briefing não informado. Edite esta descrição no painel à esquerda.';
    const briefCards = tasks.filter(function (item) { return item.briefMatch; });
    const briefChanged = String(value('projectBrief', '')) !== generatedBrief;
    $('briefHeuristicNote').textContent = briefChanged
      ? 'O briefing mudou desde a geração. Os cards contextualizados refletem o texto anterior; gere novamente para atualizar as pistas.'
      : briefCards.length
        ? (briefCards.length === 1 ? '1 card adicional sugerido' : briefCards.length + ' cards adicionais sugeridos') + ' por termos do briefing: ' + briefCards.map(function (item) { return item.briefMatch; }).join(', ') + '. Revise essas pistas.'
        : 'As sugestões partem do tipo de iniciativa. Nenhuma pista específica foi identificada no briefing.';
    const result = compute();
    renderSummary(result);
    renderSchedule(result);
    renderCosts(result);
  }

  function buildPlan() {
    const type = value('projectType', 'web');
    syncProductAIMode();
    generatedBrief = String(value('projectBrief', ''));
    tasks = (templates[type] || templates.web).map(function (item) { return Object.assign({}, item, { id: 't' + Math.random().toString(36).slice(2, 9) }); }).concat(suggestionsFromBrief(value('projectBrief', '')));
    if ($('productAI').checked) tasks = tasks.concat(aiProductTasks.map(function (item) { return Object.assign({}, item, { id: 't' + Math.random().toString(36).slice(2, 9) }); }));
    generated = true;
    $('emptyState').hidden = true;
    $('results').hidden = false;
    $('formStatus').textContent = 'Plano inicial gerado. Revise cards, esforço e premissas com a equipe.';
    switchTab('cards');
    renderAll();
    $('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function syncAIProductTasks() {
    syncProductAIMode();
    if (!$('productAI').checked) {
      tasks = tasks.filter(function (item) { return !item.productAI; });
    } else if (!tasks.some(function (item) { return item.productAI; })) {
      tasks = tasks.concat(aiProductTasks.map(function (item) { return Object.assign({}, item, { id: 't' + Math.random().toString(36).slice(2, 9) }); }));
    }
    renderAll();
  }

  function syncProductAIMode() {
    const isAIProduct = $('projectType').value === 'ai';
    if (isAIProduct) $('productAI').checked = true;
    $('productAI').disabled = isAIProduct;
  }

  function switchTab(name) {
    document.querySelectorAll('.tab-button').forEach(function (button) {
      const active = button.dataset.tab === name;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    document.querySelectorAll('.tab-panel').forEach(function (panel) {
      const active = panel.dataset.panel === name;
      panel.hidden = !active;
      panel.classList.toggle('active', active);
    });
  }

  function addTask() {
    tasks.push(task('build', 'Novo card de trabalho', 'Descreva o resultado verificável esperado para este card.', 'Backend', 2, false));
    renderAll();
    const titles = board.querySelectorAll('.task-title');
    if (titles.length) {
      const last = titles[titles.length - 1];
      last.focus();
      last.select();
    }
    toast('Card adicionado ao backlog.');
  }

  function exportCSV() {
    const result = compute();
    const header = ['Projeto', 'Tipo', 'Fase', 'Card', 'Responsável sugerido', 'Incluído', 'Esforço pessoas-dia', 'Elegível a apoio de IA', 'Prazo sem IA (semanas)', 'Prazo com apoio de IA (semanas)', 'Custo sem IA (R$)', 'Custo com apoio de IA (R$)', 'Premissa de redução (%)', 'Revisão adicional (%)'];
    const rows = tasks.map(function (item) {
      return [value('projectName', ''), value('projectType', ''), (phases.find(function (phase) { return phase.id === item.phase; }) || {}).label || item.phase, item.title, item.role, item.included ? 'sim' : 'não', item.days, item.aiEligible ? 'sim' : 'não', numberFormat(result.weeksBase), numberFormat(result.weeksAI), Math.round(result.totalBase), Math.round(result.totalAI), value('aiGain', 20), value('reviewOverhead', 15)];
    });
    const csv = '\ufeff' + [header].concat(rows).map(function (row) { return row.map(escCsv).join(';'); }).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plano-' + String(value('projectName', 'projeto')).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast('CSV do backlog gerado.');
  }

  function toast(message) {
    const element = $('toast');
    element.textContent = message;
    element.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { element.classList.remove('show'); }, 2400);
  }

  function loadExample() {
    $('projectName').value = 'Portal de solicitações de acesso';
    $('projectType').value = 'web';
    $('projectBrief').value = 'Gestores solicitam acessos por e-mail e não conseguem acompanhar aprovação ou prazo. Queremos registrar pedidos, encaminhar a aprovação ao responsável e dar visibilidade ao status, reduzindo atrasos e solicitações perdidas.';
    $('productAI').checked = false;
    $('formStatus').textContent = 'Exemplo carregado. Ajuste o contexto e as premissas para o seu projeto.';
    buildPlan();
  }

  function resetPlan() {
    if (!window.confirm('Limpar o plano atual e voltar ao início?')) return;
    generated = false;
    generatedBrief = '';
    tasks = [];
    try { localStorage.removeItem(STORAGE_KEY); } catch (error) { /* Ignore unavailable storage. */ }
    saveState();
    $('results').hidden = true;
    $('emptyState').hidden = false;
    $('formStatus').textContent = 'Plano limpo. Suas premissas continuam no formulário.';
    $('emptyState').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    $('formStatus').textContent = '';
    if (!value('projectName', '').trim()) {
      $('formStatus').textContent = 'Dê um nome ao projeto para gerar o plano.';
      $('projectName').focus();
      return;
    }
    buildPlan();
  });

  $('loadExample').addEventListener('click', loadExample);
  $('emptyStart').addEventListener('click', function () {
    $('briefCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
    $('projectBrief').focus({ preventScroll: true });
  });
  $('addTask').addEventListener('click', addTask);
  $('exportPlan').addEventListener('click', exportCSV);
  $('resetPlan').addEventListener('click', resetPlan);
  $('productAI').addEventListener('change', function () {
    if (generated) syncAIProductTasks(); else saveState();
  });
  $('projectType').addEventListener('change', function () {
    syncProductAIMode();
    if (generated) {
      $('formStatus').textContent = 'Tipo alterado. Clique em “Gerar plano sugerido” para atualizar os cards; suas edições atuais continuam no rascunho.';
      if ($('productAI').checked && !tasks.some(function (item) { return item.productAI; })) {
        tasks = tasks.concat(aiProductTasks.map(function (item) { return Object.assign({}, item, { id: 't' + Math.random().toString(36).slice(2, 9) }); }));
      }
      if (!$('productAI').checked) tasks = tasks.filter(function (item) { return !item.productAI; });
      renderAll();
    } else saveState();
  });
  document.querySelectorAll('.tab-button').forEach(function (button) {
    button.addEventListener('click', function () { switchTab(button.dataset.tab); });
    button.addEventListener('keydown', function (event) {
      const tabButtons = Array.from(document.querySelectorAll('.tab-button'));
      let index = tabButtons.indexOf(button);
      if (event.key === 'ArrowRight') index = (index + 1) % tabButtons.length;
      else if (event.key === 'ArrowLeft') index = (index - 1 + tabButtons.length) % tabButtons.length;
      else if (event.key === 'Home') index = 0;
      else if (event.key === 'End') index = tabButtons.length - 1;
      else return;
      event.preventDefault();
      tabButtons[index].focus();
      switchTab(tabButtons[index].dataset.tab);
    });
  });

  board.addEventListener('input', function (event) {
    const field = event.target.dataset.field;
    const card = event.target.closest('[data-card-id]');
    if (!card || !field) return;
    const item = tasks.find(function (candidate) { return candidate.id === card.dataset.cardId; });
    if (!item) return;
    if (field === 'title') {
      item.title = event.target.value;
      renderSummary(compute());
      saveState();
    }
  });

  board.addEventListener('change', function (event) {
    const field = event.target.dataset.field;
    const card = event.target.closest('[data-card-id]');
    if (!card || !field) return;
    const item = tasks.find(function (candidate) { return candidate.id === card.dataset.cardId; });
    if (!item) return;
    if (field === 'included') item.included = event.target.checked;
    if (field === 'role') item.role = event.target.value;
    if (field === 'days') item.days = Math.max(0, Number(event.target.value) || 0);
    renderAll();
  });

  board.addEventListener('click', function (event) {
    const button = event.target.closest('[data-action="delete"]');
    if (!button) return;
    const card = button.closest('[data-card-id]');
    tasks = tasks.filter(function (item) { return item.id !== card.dataset.cardId; });
    renderAll();
    toast('Card removido do plano.');
  });

  inputs.forEach(function (id) {
    const element = $(id);
    if (!element) return;
    element.addEventListener('input', function () {
      saveState();
      if (generated) updateMetrics();
    });
    element.addEventListener('change', function () {
      saveState();
      if (generated && id !== 'productAI') updateMetrics();
    });
  });

  if (!$('startDate').value) $('startDate').value = localDateValue(new Date());
  const hasSavedPlan = restoreState();
  syncProductAIMode();
  if (generated && $('productAI').checked && !tasks.some(function (item) { return item.productAI; })) {
    tasks = tasks.concat(aiProductTasks.map(function (item) { return Object.assign({}, item, { id: 't' + Math.random().toString(36).slice(2, 9) }); }));
  }
  if (!value('startDate', '')) $('startDate').value = localDateValue(new Date());
  if (hasSavedPlan) {
    $('emptyState').hidden = true;
    $('results').hidden = false;
    renderAll();
  } else {
    $('results').hidden = true;
    $('emptyState').hidden = false;
    saveState();
  }
})();
