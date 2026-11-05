import { STAGES, CASES, SOLUTIONS, EVIDENCE, GUARDRAILS, defaultEconomics, calculateEconomics, calculateReadiness } from './decision-engine.js';

(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const STORAGE_KEY = 'cioDecisionLab:v1';
  const BEST_KEY = 'cioDecisionLab:best:v1';
  const stages = STAGES;
  const scenarios = CASES;
  const solutions = SOLUTIONS;
  const evidence = EVIDENCE;
  const guardrails = GUARDRAILS;
  let state = loadState();
  let toastTimer;

  function freshState() {
    return { started: false, stage: 0, scenario: null, evidence: [], solution: null, surface: 'existing', guardrails: [], economics: null, decision: null, finished: false, lastScore: 0 };
  }
  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && saved.v === 1 && saved.state) return { ...freshState(), ...saved.state, started: false };
    } catch (_) { /* storage may be unavailable */ }
    return freshState();
  }
  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, state: { ...state, started: false } }));
      $('#saveState').innerHTML = '<i></i> PROGRESSO LOCAL';
    } catch (_) {
      $('#saveState').innerHTML = '<i></i> SEM SALVAMENTO';
    }
  }
  function money(value, compact = false) {
    const n = Number.isFinite(value) ? value : 0;
    if (compact && Math.abs(n) >= 1000000) return `R$ ${(n / 1000000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`;
    if (compact && Math.abs(n) >= 10000) return `R$ ${(n / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} mil`;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n);
  }
  function currentCase() { return state.scenario ? scenarios[state.scenario] : null; }
  function initialEconomics() { state.economics = defaultEconomics(state.scenario, state.economics || {}); }
  function calc() { return calculateEconomics(state); }
  function readiness() { return calculateReadiness(state, state.stage).total; }
  function updateBestScore() {
    try { const best = Number(localStorage.getItem(BEST_KEY) || 0); $('#bestScore').textContent = best ? `${best}/100` : '—'; } catch (_) { $('#bestScore').textContent = '—'; }
  }
  function scrollBehavior() { return matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'; }
  function setStartVisible() {
    updateBestScore();
    $('#welcome').hidden = state.started;
    $('#gameShell').hidden = !state.started;
    if (!state.started) {
      const saved = (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (_) { return null; } })();
      if (saved && saved.state && saved.state.scenario) $('#beginButton').innerHTML = 'CONTINUAR DESAFIO <span>↗</span>';
    }
  }
  function render() {
    if (!state.started) return;
    document.body.classList.toggle('champion-mode', state.finished && readiness() >= 85);
    updateBestScore();
    renderStepper();
    renderStage();
    renderBoard();
  }
  function renderStepper() {
    $('#stepper').innerHTML = stages.map((label, index) => {
      const done = index < state.stage || state.finished;
      return `<button type="button" class="step-button ${index === state.stage && !state.finished ? 'current' : ''} ${done ? 'done' : ''}" data-stage="${index}" ${index > state.stage && !state.finished ? 'disabled' : ''} aria-current="${index === state.stage && !state.finished ? 'step' : 'false'}"><span class="step-count">${done ? '✓' : String(index + 1).padStart(2, '0')}</span><span>${label}</span></button>`;
    }).join('');
  }
  function stageHeader(index, pill, title, intro) {
    $('#gameTitle').textContent = state.finished ? 'Decisão registrada' : `Etapa ${String(index + 1).padStart(2, '0')} · ${stages[index]}`;
    $('#gameSubtitle').textContent = state.finished ? 'Seu memorando executivo está pronto para compartilhar.' : currentCase() ? currentCase().title : 'Escolha o caso que o conselho trouxe para a mesa.';
    return `<div class="stage-topline"><span class="stage-kicker">${pill}</span><span class="stage-pill">${stages[index].toUpperCase()} · ${String(index + 1).padStart(2, '0')}/05</span></div><h3>${title}</h3><p class="stage-intro">${intro}</p>`;
  }
  function actionRow(previous, nextLabel, hint, disabled = false) {
    return `<div class="stage-actions"><span class="hint">${hint}</span><div class="button-row">${previous ? '<button class="secondary-button" data-back type="button">← VOLTAR</button>' : ''}<button class="continue-button" data-next type="button" ${disabled ? 'disabled' : ''}>${nextLabel} <span aria-hidden="true">→</span></button></div></div>`;
  }
  function renderStage() {
    const panel = $('#stagePanel');
    if (state.finished) { panel.innerHTML = renderOutcome(); return; }
    const caseInfo = currentCase();
    if (state.stage === 0) {
      panel.innerHTML = stageHeader(0, 'O CONSELHO TROUXE TRÊS CASOS FICCIONAIS', 'Escolha o problema antes da tecnologia.', 'Cada cenário foi criado para testar um tipo de decisão. Os números são didáticos e serão tratados como premissas, não como dados de uma empresa real.') +
        `<div class="scenario-grid">${Object.entries(scenarios).map(([id, item]) => `<button type="button" class="scenario-card ${state.scenario === id ? 'selected' : ''}" data-scenario="${id}" aria-pressed="${state.scenario === id}"><span class="select-check">${state.scenario === id ? '✓' : ''}</span><div class="scenario-icon">${item.icon}</div><div class="stage-kicker">${item.sector}</div><h4>${item.title}</h4><p>${item.issue}</p><div class="case-facts">${item.facts}</div></button>`).join('')}</div>` +
        (caseInfo ? `<div class="scenario-insight"><strong>O que este caso põe à prova:</strong> ${caseInfo.lesson}</div>` : '') +
        actionRow(false, 'DEFINIR O PROBLEMA', 'Escolha um caso para continuar.', !state.scenario);
    } else if (state.stage === 1) {
      panel.innerHTML = stageHeader(1, 'SEPARAR OBSERVAÇÃO DE SUPOSIÇÃO', 'Que evidência pediria antes de investir?', 'Selecione o que mediria no processo atual. Um caso convincente precisa de volume e esforço reais, mas também de exceções, riscos e um dono do resultado.') +
        `<div class="evidence-list">${evidence.map(item => `<label class="evidence-option"><input type="checkbox" data-evidence="${item.id}" ${state.evidence.includes(item.id) ? 'checked' : ''}><span><strong>${item.title}</strong><small>${item.desc}</small></span></label>`).join('')}</div>` +
        `<div class="callout"><b>Distinção importante:</b> tempo liberado representa capacidade disponível. Só vira economia financeira quando a organização consegue capturá-lo ou redirecioná-lo para trabalho de valor.</div>` +
        actionRow(true, 'AVALIAR A SOLUÇÃO', 'Marque as evidências que levaria ao comitê.');
    } else if (state.stage === 2) {
      panel.innerHTML = stageHeader(2, 'ESCOLHER O MECANISMO E A SUPERFÍCIE', 'Qual abordagem se encaixa no trabalho?', `Caso: ${caseInfo.title}. Compare capacidade necessária, complexidade e custo de operação. A recomendação do jogo depende do problema; não há prêmio automático por usar IA.`) +
        `<div class="solution-grid">${solutions.map(item => `<button type="button" class="solution-card ${state.solution === item.id ? 'selected' : ''}" data-solution="${item.id}" aria-pressed="${state.solution === item.id}"><div class="solution-num">${item.num}</div><h4>${item.name}</h4><p>${item.desc}</p><span class="fit-tag">${item.tag}</span></button>`).join('')}</div>` +
        `<div class="delivery-row"><div class="select-wrap"><label for="surface">SUPERFÍCIE PARA O USUÁRIO</label><select id="surface"><option value="existing" ${state.surface === 'existing' ? 'selected' : ''}>Usar a interface existente</option><option value="simple" ${state.surface === 'simple' ? 'selected' : ''}>Criar app ou workflow simples</option><option value="custom" ${state.surface === 'custom' ? 'selected' : ''}>Criar aplicação sob medida</option></select></div><div class="select-wrap"><label>CONTROLES PARA O PILOTO</label><div class="guardrail-grid">${guardrails.map(item => `<label class="guardrail"><input type="checkbox" data-guard="${item.id}" ${state.guardrails.includes(item.id) ? 'checked' : ''}>${item.title}</label>`).join('')}</div></div></div>` +
        `<div class="callout" id="solutionCallout">${state.solution ? solutionNote(state.solution) : 'Escolha uma abordagem. Para IA, inclua revisão humana, rastreabilidade e um caminho de exceção antes de testar em produção.'}</div>` +
      actionRow(true, 'MODELAR CUSTOS E VALOR', 'Defina também como o usuário fará o trabalho.', !state.solution || (state.solution === 'api-ai' && !state.guardrails.includes('review')));
    } else if (state.stage === 3) {
      initialEconomics();
      panel.innerHTML = stageHeader(3, 'PREMISSAS EDITÁVEIS · VALORES FICTÍCIOS', 'O caso fecha economicamente?', 'Ajuste as premissas. O tempo poupado deve ser líquido da revisão humana e do retrabalho. O cálculo não inclui benefícios que não foram medidos, como receita, retenção ou redução de risco.') +
        `<div class="economics-grid"><div class="controls-list">${rangeControl('volume', 'Casos processados por mês', 100, 5000, 10, state.economics.volume, 'Unidades mensais estimadas')}${rangeControl('minutes', 'Minutos líquidos liberados por caso', 0, 30, 1, state.economics.minutes, 'Desconte revisão, exceções e retrabalho')}${rangeControl('hourly', 'Custo-hora carregado', 20, 250, 1, state.economics.hourly, 'Premissa interna; não é valor de mercado')}${rangeControl('capture', 'Percentual de capacidade capturável', 0, 100, 5, state.economics.capture, 'Inclui adoção e realização efetiva do benefício')}${rangeControl('build', 'Investimento inicial estimado', 0, 500000, 1000, state.economics.build, 'Construção, integração, configuração ou implantação')}${rangeControl('run', 'Operação e manutenção por mês', 0, 30000, 100, state.economics.run, 'Suporte, monitoramento, licença ou assinatura')}${state.solution === 'api-ai' ? rangeControl('aiCase', 'Custo variável de IA por caso', 0, .15, .005, state.economics.aiCase, 'Premissa ilustrativa; valide com uso e fornecedor') : ''}</div><div class="economy-results" id="economyResults"></div></div>` +
        `<div class="callout"><b>Leitura do cálculo:</b> o benefício anual é capacidade potencialmente capturada; custo do primeiro ano inclui investimento inicial, operação e, quando aplicável, inferência. Não é uma previsão nem uma análise financeira completa.</div>` +
        actionRow(true, 'LEVAR AO COMITÊ', 'Edite as premissas ou avance para a decisão.');
      bindEconomics(); renderEconomics();
    } else {
      const c = calc();
      panel.innerHTML = stageHeader(4, 'DECISÃO DE INVESTIMENTO', 'O que você recomendaria ao conselho?', 'Escolha o próximo passo coerente com a evidência e as premissas. Um piloto com critério de parada pode ser melhor que um compromisso amplo; também é válido interromper ou reformular uma ideia.') +
        `<div class="decision-grid">${[
          ['pilot', '◉', 'Piloto com prazo e limite', 'Testar em escopo pequeno, definir um responsável e medir contra a linha de base.'],
          ['extend', '↗', 'Estender o que já existe', 'Usar a plataforma e as integrações disponíveis, com custo e esforço confirmados.'],
          ['buy', '▣', 'Comprar ou contratar', 'Comparar produto pronto, licença, custo total, dados, integração e saída do fornecedor.'],
          ['build', '▧', 'Construir solução maior', 'Investir em produto sob medida quando escopo, evidência e operação justificarem.'],
          ['stop', 'Ⅱ', 'Parar ou reformular', 'Não financiar a solução atual; validar outra causa, processo ou oportunidade.']
        ].map(([id, icon, title, desc]) => `<button class="decision-card ${state.decision === id ? 'selected' : ''}" type="button" data-decision="${id}" aria-pressed="${state.decision === id}"><span class="d-icon">${icon}</span><h4>${title}</h4><p>${desc}</p></button>`).join('')}</div>` +
        `<div class="scenario-insight"><strong>Premissas atuais:</strong> benefício anual capturável ${money(c.annualBenefit)} · custo estimado no primeiro ano ${money(c.yearCost)} · ${c.net >= 0 ? 'saldo estimado positivo' : 'saldo estimado negativo'}. O jogo não trata estimativas como resultados observados.</div>` +
        actionRow(true, 'REGISTRAR DECISÃO', 'A pontuação mede qualidade da decisão, não sofisticação tecnológica.', !state.decision);
    }
    panel.scrollTop = 0;
  }
  function rangeControl(id, label, min, max, step, value, help) {
    const shown = id === 'aiCase' ? `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}` : id === 'capture' ? `${value}%` : id === 'build' || id === 'run' || id === 'hourly' ? money(Number(value)) : `${Number(value).toLocaleString('pt-BR')}${id === 'minutes' ? ' min' : ''}`;
    return `<div class="control-row"><label for="${id}">${label}</label><output for="${id}" id="${id}Output">${shown}</output><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}"><small class="control-help">${help}</small></div>`;
  }
  function bindEconomics() {
    $('#stagePanel').querySelectorAll('input[type="range"]').forEach(input => input.addEventListener('input', () => {
      const key = input.id;
      state.economics[key] = Number(input.value);
      const output = $(`#${key}Output`);
      output.textContent = key === 'aiCase' ? `R$ ${Number(input.value).toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}` : key === 'capture' ? `${input.value}%` : ['build', 'run', 'hourly'].includes(key) ? money(Number(input.value)) : `${Number(input.value).toLocaleString('pt-BR')}${key === 'minutes' ? ' min' : ''}`;
      renderEconomics(); renderBoard(); persist();
    }));
  }
  function renderEconomics() {
    const c = calc();
    const root = $('#economyResults'); if (!root) return;
    const max = Math.max(c.annualBenefit, c.yearCost, 1);
    root.innerHTML = `<h4>ESTIMATIVA · 12 MESES</h4><div class="result-line"><span>Capacidade liberada</span><strong>${c.grossHours.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} h/mês</strong></div><div class="result-line"><span>Benefício capturável estimado</span><strong>${money(c.annualBenefit)}</strong></div><div class="result-line"><span>Investimento inicial</span><strong>${money(state.economics.build)}</strong></div><div class="result-line"><span>Operação e manutenção</span><strong>${money(c.annualOperatingCost)}</strong></div>${state.solution === 'api-ai' ? `<div class="result-line"><span>Inferência de IA</span><strong>${money(c.annualAiCost)}</strong></div>` : ''}<div class="result-line"><span>Custo total estimado no 1º ano</span><strong>${money(c.yearCost)}</strong></div><div class="result-line emphasis"><span>Saldo simples estimado</span><strong>${money(c.net)}</strong></div><div class="economy-chart" aria-label="Comparação entre benefício e custo estimados"><div class="eco-column"><i style="height:${Math.max(3, c.annualBenefit / max * 80)}%"></i><span>benefício</span></div><div class="eco-column cost"><i style="height:${Math.max(3, c.yearCost / max * 80)}%"></i><span>custo</span></div></div><div class="result-line"><span>Retorno simples sobre custo¹</span><strong>${c.roi === null ? 'n/a' : `${(c.roi * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`}</strong></div><div class="result-line"><span>Recuperação do investimento²</span><strong>${c.payback === null ? 'não estimada' : `${c.payback.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} meses`}</strong></div><p class="formula-note">¹ (benefício capturável − custo do 1º ano) ÷ custo do 1º ano. ² estimativa simples baseada no saldo mensal antes do investimento inicial; sem desconto, impostos ou custos de oportunidade.</p>`;
  }
  function solutionNote(id) {
    const notes = {
      process: 'Teste primeiro se padronização, retirada de etapas ou clareza de responsabilidade resolve a causa. Software novo não é requisito para melhorar um processo.',
      workflow: 'Um workflow simples pode tornar critérios, responsáveis e exceções visíveis. Avalie se a plataforma existente já atende antes de construir outra aplicação.',
      api: 'Use uma integração baseada em regras determinísticas quando os dados e as regras são estruturados. A API conecta sistemas; as validações precisam ser definidas no serviço. Uma API não garante que o processo ou os dados de origem estejam corretos.',
      'api-ai': 'Use IA apenas na parte que exige interpretação de conteúdo variável. Planeje avaliação de qualidade, revisão humana, privacidade, custo por caso e fallback para falhas.',
      platform: 'Uma plataforma maior exige justificativa de escopo e operação. Confirme que vários fluxos ou requisitos realmente não cabem numa extensão menor.'
    };
    return notes[id];
  }
  function renderBoard() {
    const scores = calculateReadiness(state, state.stage);
    const score = scores.total;
    $('#readinessScore').textContent = state.scenario ? score : '—';
    $('#scoreRing').style.setProperty('--score', `${score * 3.6}deg`);
    $('#scoreCaption').textContent = !state.scenario ? 'Faça as escolhas do desafio para montar o caso.' : score >= 80 ? 'Decisão bem preparada para um próximo passo controlado.' : score >= 55 ? 'Boa direção; ainda há evidências ou controles a completar.' : 'Ainda há incerteza relevante antes de comprometer investimento.';
    const values = [
      ['Evidência', state.stage >= 1 || state.evidence.length > 0 ? scores.evidence / 20 : 0],
      ['Adequação', state.solution ? scores.fit / 30 : 0],
      ['Controles', state.solution ? scores.guardrail / 20 : 0],
      ['Economia', state.stage >= 3 || state.finished ? scores.economics / 20 : 0],
      ['Decisão', state.decision ? scores.decision / 10 : 0]
    ];
    $('#signalList').innerHTML = values.map(([label, value]) => `<div class="signal"><span>${label}</span><b>${Math.round(value * 100)}%</b><div class="signal-track"><i style="width:${Math.round(value * 100)}%"></i></div></div>`).join('');
    const c = calc(); const max = Math.max(c.annualBenefit, c.yearCost, 1);
    $('#barChart').innerHTML = `<div class="bar-set"><i class="bar benefit" style="height:${Math.max(3, c.annualBenefit / max * 65)}px"></i><span>benefício</span></div><div class="bar-set"><i class="bar cost" style="height:${Math.max(3, c.yearCost / max * 65)}px"></i><span>custo</span></div>`;
    const caseInfo = currentCase();
    const note = state.solution === 'api-ai' ? 'Inclua custo variável por caso, qualidade do resultado, revisão humana e uma rota de exceção.' : state.solution === 'platform' ? 'A complexidade amplia implantação e operação. Exija evidência de que a solução menor não atende.' : state.solution === 'api' ? 'Integração pode reduzir trabalho manual, mas requer monitoramento, reconciliação e tratamento de falhas.' : state.solution === 'workflow' ? 'Uma aplicação simples pode bastar quando o fluxo e as regras são conhecidos.' : state.solution === 'process' ? 'Antes de comprar tecnologia, teste se a causa pode ser removida no próprio processo.' : caseInfo ? caseInfo.lesson : 'Uma boa decisão começa pela evidência do problema.';
    $('#advisorNote').textContent = note;
    if (state.started) persist();
  }
  function expectedDecisionText() {
    const labels = { pilot: 'Piloto com prazo e limite', extend: 'Estender o que já existe', buy: 'Comprar ou contratar', build: 'Construir solução maior', stop: 'Parar ou reformular' };
    return labels[state.decision] || 'A definir';
  }
  function renderOutcome() {
    const c = calc(); const score = readiness(); const solutionName = solutions.find(item => item.id === state.solution)?.name || 'A definir';
    const champion = score >= 85;
    const rank = champion ? 'CAMPEÃO DO INVESTIMENTO RESPONSÁVEL' : score >= 60 ? 'ESTRATEGISTA EM EVOLUÇÃO' : 'INVESTIGADOR DE PREMISSAS';
    const next = state.decision === 'pilot' ? 'Defina duração, população, responsável e critérios para parar ou expandir.' : state.decision === 'extend' ? 'Confirme capacidade da plataforma, esforço de integração e custo operacional com as equipes responsáveis.' : state.decision === 'buy' ? 'Compare custo total de propriedade, tratamento de dados, integração, níveis de serviço e plano de saída do fornecedor.' : state.decision === 'build' ? 'Valide escopo, suporte, segurança e alternativas menores antes de aprovar investimento.' : 'Investigue a causa do problema e reformule a hipótese antes de propor tecnologia.';
    return `<div class="stage-topline"><span class="stage-kicker">DESAFIO CONCLUÍDO · ${currentCase().sector}</span><span class="stage-pill">DECISÃO ${String(score).padStart(2, '0')}/100</span></div><div class="win-badge ${champion ? 'champion' : ''}"><span aria-hidden="true">${champion ? '🏆' : '✦'}</span>${rank}</div><h3>${expectedDecisionText()}</h3><p class="stage-intro">${next}</p><div class="outcome"><h4>Resumo para o comitê</h4><p><b>Problema:</b> ${currentCase().issue}<br><b>Abordagem:</b> ${solutionName}; superfície escolhida: ${surfaceName()}<br><b>Economia estimada em 12 meses:</b> benefício capturável ${money(c.annualBenefit)}; custo no primeiro ano ${money(c.yearCost)}; saldo simples ${money(c.net)}.<br><b>Qualidade da decisão:</b> ${score}/100. Esta pontuação mede a clareza das premissas, adequação, controles e próximos passos; não prevê sucesso do projeto.<br><b>Próximo gate:</b> ${next}</p></div><div class="memo-actions"><button class="continue-button" type="button" data-copy-memo>COPIAR MEMORANDO</button><button class="secondary-button accent" type="button" data-download-memo>BAIXAR .TXT</button><button class="secondary-button" type="button" data-share-result>COMPARTILHAR RESUMO ↗</button></div><div class="callout"><b>Outras perguntas para o CIO:</b> a solução pode ser comprada ou estendida? Que custo de suporte e mudança organizacional foi omitido? Quais dados podem sair do ambiente? Como reverter a decisão? Qual métrica fará o piloto parar ou escalar?</div><div class="stage-actions"><span class="hint">Progresso salvo apenas neste navegador.</span><div class="button-row"><button class="secondary-button" data-back type="button">← REVISAR</button><button class="continue-button" data-play-again type="button">NOVO DESAFIO ↻</button></div></div>`;
  }
  function surfaceName() { return ({ existing: 'interface já existente', simple: 'app ou workflow simples', custom: 'aplicação sob medida' })[state.surface] || 'a definir'; }
  function memoText() {
    const c = calc(); const caseInfo = currentCase();
    return `CIO DECISION LAB — MEMORANDO DE DECISÃO\n\nCaso: ${caseInfo.title} (${caseInfo.sector})\nContexto: ${caseInfo.issue}\n\nAbordagem escolhida: ${solutions.find(item => item.id === state.solution)?.name}\nSuperfície para o usuário: ${surfaceName()}\nDecisão: ${expectedDecisionText()}\n\nEvidências a levantar: ${state.evidence.map(id => evidence.find(item => item.id === id)?.title).join('; ') || 'nenhuma selecionada'}\nControles do piloto: ${state.guardrails.map(id => guardrails.find(item => item.id === id)?.title).join('; ') || 'nenhum selecionado'}\n\nPremissas editáveis (exercício, não dados observados): ${state.economics.volume} casos/mês; ${state.economics.minutes} minutos líquidos/caso; custo-hora ${money(state.economics.hourly)}; ${state.economics.capture}% de capacidade capturável; investimento inicial ${money(state.economics.build)}; operação/licenças mensais ${money(state.economics.run)}${state.solution === 'api-ai' ? `; IA ${money(state.economics.aiCase)} por caso` : ''}.\n\nBenefício capturável estimado (12 meses): ${money(c.annualBenefit)}\nOperação e manutenção no primeiro ano: ${money(c.annualOperatingCost)}${state.solution === 'api-ai' ? `\nCusto estimado de inferência no primeiro ano: ${money(c.annualAiCost)}` : ''}\nCusto total estimado no primeiro ano: ${money(c.yearCost)}\nSaldo simples: ${money(c.net)}\nPontuação de prontidão da decisão: ${readiness()}/100 (não é previsão de sucesso nem ROI comprovado).\n\nPróximo gate sugerido: ${state.decision === 'pilot' ? 'Definir duração, escopo, responsável, linha de base e critérios de parada/expansão.' : state.decision === 'extend' ? 'Confirmar capacidade, esforço de integração e custo de operação.' : state.decision === 'buy' ? 'Comparar custo total de propriedade, tratamento de dados, integração, níveis de serviço e plano de saída do fornecedor.' : state.decision === 'build' ? 'Confirmar escopo, custo total, segurança, suporte e alternativas menores.' : 'Reformular a hipótese e investigar a causa do problema.'}\n\nNota: simulação educativa com valores fictícios e editáveis. O cálculo é simples e não inclui impostos, desconto, custo de oportunidade nem benefícios não medidos. Horas liberadas não são economia de caixa até serem capturadas ou redirecionadas.`;
  }
  function finalise() {
    state.finished = true; state.lastScore = readiness(); document.body.classList.toggle('champion-mode', state.lastScore >= 85);
    try { const best = Number(localStorage.getItem(BEST_KEY) || 0); if (state.lastScore > best) localStorage.setItem(BEST_KEY, String(state.lastScore)); } catch (_) { /* no persistent storage */ }
    persist(); render(); $('#stagePanel').scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
  }
  function toast(message) {
    const node = $('#toast'); node.textContent = message; node.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => node.classList.remove('show'), 2300);
  }
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); toast('Memorando copiado.'); }
    catch (_) {
      const area = document.createElement('textarea'); area.value = text; area.style.position = 'fixed'; area.style.opacity = '0'; document.body.appendChild(area); area.select();
      try { document.execCommand('copy'); toast('Memorando copiado.'); } catch (e) { toast('Não foi possível copiar neste navegador.'); }
      area.remove();
    }
  }
  function chooseStage(index) {
    if (index < 0 || index > 4 || index > state.stage) return;
    state.stage = index; state.finished = false; persist(); render();
  }

  $('#beginButton').addEventListener('click', () => { state.started = true; persist(); setStartVisible(); render(); });
  $('#restartButton').addEventListener('click', () => { if (confirm('Recomeçar e apagar as escolhas deste desafio?')) { document.body.classList.remove('champion-mode'); state = freshState(); state.started = true; persist(); render(); window.scrollTo({ top: 0, behavior: scrollBehavior() }); } });
  $('#resetRecord').addEventListener('click', () => { try { localStorage.removeItem(BEST_KEY); } catch (_) {} updateBestScore(); toast('Recorde local apagado.'); });
  $('#stepper').addEventListener('click', event => { const button = event.target.closest('[data-stage]'); if (button && !button.disabled) chooseStage(Number(button.dataset.stage)); });
  $('#stagePanel').addEventListener('change', event => {
    const target = event.target;
    if (target.matches('[data-evidence]')) {
      const id = target.dataset.evidence; state.evidence = target.checked ? [...new Set([...state.evidence, id])] : state.evidence.filter(item => item !== id);
      renderBoard(); persist();
    }
    if (target.matches('[data-guard]')) {
      const id = target.dataset.guard; state.guardrails = target.checked ? [...new Set([...state.guardrails, id])] : state.guardrails.filter(item => item !== id);
      const scrollY = window.scrollY; renderStage(); renderBoard(); window.scrollTo(0, scrollY);
    }
    if (target.id === 'surface') { state.surface = target.value; renderBoard(); persist(); }
  });
  $('#stagePanel').addEventListener('click', event => {
    const target = event.target.closest('button'); if (!target) return;
    if (target.dataset.scenario) {
      if (state.scenario !== target.dataset.scenario) { state.scenario = target.dataset.scenario; state.economics = null; state.solution = null; state.guardrails = []; state.decision = null; }
      renderStage(); renderBoard();
    } else if (target.dataset.solution) {
      state.solution = target.dataset.solution;
      if (state.solution === 'api-ai' && !state.guardrails.includes('review')) state.guardrails.push('review');
      initialEconomics(); renderStage(); renderBoard();
    } else if (target.dataset.decision) { state.decision = target.dataset.decision; renderStage(); renderBoard(); }
    else if (target.hasAttribute('data-next')) {
      if (state.stage < 4) { state.stage += 1; render(); window.scrollTo({ top: 0, behavior: scrollBehavior() }); }
      else if (state.decision) finalise();
    } else if (target.hasAttribute('data-back')) { if (state.finished) state.finished = false; state.stage = Math.max(0, state.stage - 1); persist(); render(); window.scrollTo({ top: 0, behavior: scrollBehavior() }); }
    else if (target.hasAttribute('data-copy-memo')) copyText(memoText());
    else if (target.hasAttribute('data-download-memo')) {
      const blob = new Blob([memoText()], { type: 'text/plain;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'memorando-decisao-cio.txt'; link.click(); URL.revokeObjectURL(url); toast('Memorando baixado.');
    } else if (target.hasAttribute('data-share-result')) copyText(`Minha decisão no CIO Decision Lab: ${expectedDecisionText()} · ${solutions.find(item => item.id === state.solution)?.name} · pontuação de prontidão ${readiness()}/100. Simulação educativa com premissas fictícias. Acesse: ${location.origin}/games/decisao-cio/`);
    else if (target.hasAttribute('data-play-again')) { document.body.classList.remove('champion-mode'); state = freshState(); state.started = true; persist(); render(); window.scrollTo({ top: 0, behavior: scrollBehavior() }); }
  });
  setStartVisible();
})();
