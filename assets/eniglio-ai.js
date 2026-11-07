(() => {
  if (document.querySelector('[data-eniglio-ai-launcher]')) return

  const assistantOrigin = 'https://eniglio-assistente-ia.beadedwand.chatgpt.site'
  const scope = document.currentScript?.dataset.app || 'engineering'
  const prompts = {
    cio: 'Analise os dados de TI fornecidos e indique riscos, lacunas e próximas ações.',
    architecture: 'Revise os requisitos e as escolhas de arquitetura. Explique os trade-offs e as informações que faltam.',
    solution: 'Revise a necessidade e sugira um fluxo mínimo, regras e critérios de aceite.',
    planner: 'Revise o plano de entrega, as dependências e as premissas de prazo e custo.',
    academy: 'Explique o conteúdo deste exercício com um exemplo e uma pergunta para eu praticar.',
    engineering: 'Ajude-me a compreender o exercício e a avaliar minhas hipóteses.',
    challenge: 'Explique os trade-offs deste cenário de decisão de TI.',
  }
  let child
  let nonce
  let pendingContext = ''
  let pendingQuestion = ''

  const trigger = document.createElement('button')
  trigger.type = 'button'
  trigger.dataset.eniglioAiLauncher = ''
  trigger.textContent = '✦ Consultar IA'
  trigger.setAttribute('aria-haspopup', 'dialog')
  Object.assign(trigger.style, {
    position: 'fixed', right: '18px', bottom: '18px', zIndex: '2000',
    padding: '12px 18px', background: '#08665a', color: 'white', border: '1px solid #b9e5d9',
    borderRadius: '100px', font: '600 14px system-ui,sans-serif', cursor: 'pointer',
    boxShadow: '0 4px 20px #10283b30',
  })

  const dialog = document.createElement('dialog')
  dialog.setAttribute('aria-labelledby', 'eniglio-ai-title')
  Object.assign(dialog.style, {
    width: 'min(600px,calc(100vw - 24px))', maxHeight: '90vh', overflow: 'auto',
    border: '1px solid #bacfd8', borderRadius: '16px', padding: '24px',
    color: '#183247', background: '#fff', font: '15px/1.6 system-ui,sans-serif',
  })
  dialog.innerHTML = `
    <h2 id="eniglio-ai-title">Consultar a Groq</h2>
    <p>O assistente privado abre em outra aba e exige login com ChatGPT.</p>
    <label style="display:block;font-weight:650" for="eniglio-ai-question">Pergunta inicial</label>
    <textarea id="eniglio-ai-question" rows="3" maxlength="6000" style="width:100%;font:inherit;border:1px solid #adc5ce;border-radius:8px;padding:10px"></textarea>
    <p><label><input id="eniglio-ai-include" type="checkbox"> Incluir o contexto desta tela</label></p>
    <label style="display:block;font-weight:650" for="eniglio-ai-context">Contexto para revisar</label>
    <textarea id="eniglio-ai-context" rows="6" maxlength="18000" style="width:100%;font:inherit;border:1px solid #adc5ce;border-radius:8px;padding:10px" placeholder="Você também pode colar um contexto aqui."></textarea>
    <p style="font-size:13px">Revise o texto. A pergunta e o contexto serão enviados à Groq quando você confirmar a consulta no assistente.</p>
    <p id="eniglio-ai-status" role="status"></p>
    <div style="display:flex;gap:10px;justify-content:end;flex-wrap:wrap">
      <button type="button" id="eniglio-ai-close">Fechar</button>
      <button type="button" id="eniglio-ai-copy">Copiar contexto</button>
      <button type="button" id="eniglio-ai-open">Abrir assistente</button>
    </div>
  `
  for (const button of dialog.querySelectorAll('button')) {
    Object.assign(button.style, {
      font: 'inherit', padding: '8px 12px', border: '1px solid #adc5ce',
      borderRadius: '8px', background: 'white', color: '#183247', cursor: 'pointer',
    })
  }

  const context = dialog.querySelector('#eniglio-ai-context')
  const question = dialog.querySelector('#eniglio-ai-question')
  const include = dialog.querySelector('#eniglio-ai-include')
  const status = dialog.querySelector('#eniglio-ai-status')

  function capture() {
    const main = document.querySelector('main') || document.body
    const fields = [...main.querySelectorAll('input,textarea,select')]
      .filter(field => {
        if (dialog.contains(field) || field.type === 'password' || field.type === 'hidden') return false
        if (field.autocomplete?.includes('password')) return false
        return field.getClientRects().length && field.value
      })
      .map(field => {
        const label = field.labels?.[0]?.textContent?.trim() || field.name || field.id || 'Campo'
        return label.slice(0, 100) + ' = ' + field.value.slice(0, 3000)
      })
    const text = main.innerText.slice(0, 10000)
    return ('Aplicação: ' + document.title + '\n\nConteúdo visível\n' + text + '\n\nCampos preenchidos\n' + fields.join('\n')).slice(0, 18000)
  }

  trigger.addEventListener('click', () => {
    question.value = prompts[scope] || prompts.engineering
    status.textContent = ''
    dialog.showModal()
  })
  include.addEventListener('change', () => {
    context.value = include.checked ? capture() : ''
  })
  dialog.querySelector('#eniglio-ai-close').addEventListener('click', () => dialog.close())
  dialog.querySelector('#eniglio-ai-copy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(question.value + '\n\n' + context.value)
      status.textContent = 'Copiado. Você pode colar o texto no assistente se o login interromper a transferência.'
    } catch {
      status.textContent = 'Selecione e copie o texto dos campos acima.'
    }
  })
  dialog.querySelector('#eniglio-ai-open').addEventListener('click', () => {
    nonce = crypto.randomUUID()
    pendingContext = context.value.slice(0, 18000)
    pendingQuestion = question.value.slice(0, 6000)
    const url = new URL(assistantOrigin)
    url.searchParams.set('app', scope)
    url.searchParams.set('origin', location.origin)
    url.searchParams.set('handoff', nonce)
    child = window.open(url.href, '_blank')
    status.textContent = child
      ? 'Assistente aberto. Após o login, confira o contexto recebido. Use “Copiar contexto” se precisar transferir o texto manualmente.'
      : 'O navegador bloqueou a nova aba. Permita pop-ups para abrir o assistente.'
  })
  window.addEventListener('message', event => {
    if (event.origin !== assistantOrigin || event.source !== child) return
    if (event.data?.type !== 'eniglio-ai-ready' || event.data.nonce !== nonce) return
    child.postMessage({
      type: 'eniglio-ai-context', nonce,
      context: pendingContext, question: pendingQuestion,
    }, assistantOrigin)
    status.textContent = 'Contexto transferido. Revise e envie sua pergunta no assistente.'
  })

  document.body.append(trigger, dialog)
})()
