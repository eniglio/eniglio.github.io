/* Pure decision data and calculations. Kept separate from the browser UI so a future native app can reuse the same rules. */
export const STAGES = ['Caso', 'Evidência', 'Solução', 'Economia', 'Decisão'];
export const CASES = {
  supplier: {
    icon: '↔', title: 'Faturas de fornecedores', sector: 'OPERAÇÕES · DISTRIBUIÇÃO',
    issue: 'A equipe copia campos de faturas para o ERP. A maior parte dos dados é estruturada, mas há exceções e retrabalho.',
    facts: '1.800 faturas/mês · ERP com interface de integração existente · caso ficcional',
    recommended: 'api', baseline: { volume: 1800, minutes: 5, hourly: 42, capture: 45, build: 15000, run: 800, aiCase: 0 },
    lesson: 'Os campos são estruturados e o ERP já oferece integração. Uma API com validação e fila de exceções pode resolver o fluxo sem adicionar IA ao caminho principal.'
  },
  contracts: {
    icon: '⌕', title: 'Revisão de contratos', sector: 'JURÍDICO · COMPRAS',
    issue: 'Analistas procuram obrigações e cláusulas em contratos com redações variadas. A decisão final precisa de revisão humana.',
    facts: '650 contratos/mês · texto variável · revisão humana obrigatória · caso ficcional',
    recommended: 'api-ai', baseline: { volume: 650, minutes: 12, hourly: 58, capture: 40, build: 65000, run: 6200, aiCase: 0.035 },
    lesson: 'A variação semântica do texto pode justificar IA. A proposta precisa mostrar referências ao trecho de origem, revisão humana, controle de acesso e medição de erros.'
  },
  approvals: {
    icon: '✓', title: 'Aprovações de acesso', sector: 'IDENTIDADE · CONTROLES',
    issue: 'Pedidos de acesso seguem critérios conhecidos, mas circulam por e-mail e às vezes ficam sem responsável claro.',
    facts: '420 pedidos/mês · política explícita · plataforma de workflow já disponível · caso ficcional',
    recommended: 'workflow', baseline: { volume: 420, minutes: 4, hourly: 47, capture: 35, build: 18000, run: 1200, aiCase: 0 },
    lesson: 'A regra é explícita e a plataforma já existe. Melhorar o workflow e registrar aprovações pode bastar; IA generativa não acrescenta valor claro a esta decisão.'
  }
};

export const SOLUTIONS = [
  { id: 'process', num: '01', name: 'Ajustar processo', desc: 'Eliminar etapas, padronizar entradas ou esclarecer responsabilidades.', tag: 'Sem software novo' },
  { id: 'workflow', num: '02', name: 'Workflow ou app simples', desc: 'Formulário, regras claras, fila de trabalho e histórico de decisões.', tag: 'Baixa complexidade' },
  { id: 'api', num: '03', name: 'API e integração', desc: 'Troca confiável de dados estruturados entre sistemas existentes.', tag: 'Integração' },
  { id: 'api-ai', num: '04', name: 'API integrada com IA', desc: 'IA para texto ou conteúdo variável, com validação e controles.', tag: 'IA com guardrails' },
  { id: 'platform', num: '05', name: 'Aplicação/plataforma maior', desc: 'Produto sob medida para vários fluxos, equipes ou regras distintas.', tag: 'Maior investimento' }
];

export const EVIDENCE = [
  { id: 'baseline', title: 'Tempo e custo atuais', desc: 'Meça o fluxo completo, incluindo revisão e retrabalho; separe tempo de espera de trabalho ativo.' },
  { id: 'exceptions', title: 'Erros, exceções e retrabalho', desc: 'Registre frequência, impacto e quem corrige os casos fora do caminho normal.' },
  { id: 'volume', title: 'Volume, variação e sazonalidade', desc: 'Confirme a demanda real por período e os tipos de caso que mudam o esforço.' },
  { id: 'risk', title: 'Dados, controles e adoção', desc: 'Identifique dados sensíveis, usuários afetados, responsável pelo resultado e processo de fallback.' }
];

export const GUARDRAILS = [
  { id: 'owner', title: 'Dono do resultado nomeado' },
  { id: 'data', title: 'Dados e acesso revisados' },
  { id: 'fallback', title: 'Fallback e tratamento de exceções' },
  { id: 'review', title: 'Revisão humana do resultado' }
];

export function defaultEconomics(caseId, existing = {}) {
  const baseline = CASES[caseId]?.baseline || {};
  return Object.fromEntries(['volume', 'minutes', 'hourly', 'capture', 'build', 'run', 'aiCase'].map(key => [key, existing[key] ?? baseline[key] ?? 0]));
}

export function calculateEconomics(state) {
  const e = state.economics || {};
  const grossHours = (Number(e.volume) || 0) * (Number(e.minutes) || 0) / 60;
  const monthlyBenefit = grossHours * (Number(e.hourly) || 0) * (Number(e.capture) || 0) / 100;
  const aiCost = state.solution === 'api-ai' ? (Number(e.volume) || 0) * (Number(e.aiCase) || 0) : 0;
  const monthlyCost = (Number(e.run) || 0) + aiCost;
  const annualBenefit = monthlyBenefit * 12;
  const yearCost = (Number(e.build) || 0) + monthlyCost * 12;
  const net = annualBenefit - yearCost;
  const roi = yearCost > 0 ? net / yearCost : null;
  const payback = monthlyBenefit > monthlyCost && e.build > 0 ? Number(e.build) / (monthlyBenefit - monthlyCost) : null;
  return { grossHours, monthlyBenefit, aiCost, annualBenefit, annualOperatingCost: (Number(e.run) || 0) * 12, annualAiCost: aiCost * 12, yearCost, net, roi, payback };
}

export function calculateReadiness(state, stage = 0) {
  const evidenceWeights = { baseline: 6, exceptions: 5, volume: 4, risk: 5 };
  const evidence = Math.min(20, (state.evidence || []).reduce((sum, id) => sum + (evidenceWeights[id] || 0), 0));
  let fit = 0;
  if (state.solution && CASES[state.scenario]) {
    if (state.solution === CASES[state.scenario].recommended) fit = 30;
    else if (({ supplier: ['workflow', 'process'], contracts: ['workflow', 'platform'], approvals: ['process', 'api'] })[state.scenario].includes(state.solution)) fit = 20;
    else if (state.solution === 'platform') fit = 8;
    else if (state.scenario !== 'contracts' && state.solution === 'api-ai') fit = 7;
    else fit = 10;
  }
  const guardWeights = { owner: 6, data: 6, fallback: 5, review: state.solution === 'api-ai' ? 3 : 2 };
  const guardrail = Math.min(20, (state.guardrails || []).reduce((sum, id) => sum + (guardWeights[id] || 0), 0));
  const c = calculateEconomics(state);
  let economics = 0;
  if (stage >= 3 || state.finished) {
    economics = c.yearCost === 0 ? 12 : c.net >= 0 ? 20 : c.net >= -Math.max(15000, c.yearCost * .2) ? 13 : 6;
  }
  let decision = 0;
  if (state.decision) {
    const sensible = c.net < 0 ? ['stop', 'pilot'].includes(state.decision) :
      evidence < 10 ? ['pilot', 'stop'].includes(state.decision) :
      state.solution === 'platform' ? ['pilot', 'stop', 'build', 'buy'].includes(state.decision) :
      ['pilot', 'extend', 'buy'].includes(state.decision);
    if (state.decision === 'build' && (state.solution !== 'platform' || evidence < 15 || c.net < 0)) decision = 1;
    else if (['extend', 'buy'].includes(state.decision) && state.surface === 'custom') decision = 3;
    else if (sensible && fit >= 20) decision = 10;
    else if (sensible) decision = 7;
    else decision = 3;
  }
  return { total: Math.min(100, evidence + fit + guardrail + economics + decision), evidence, fit, guardrail, economics, decision };
}
