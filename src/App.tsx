import { useMemo, useState } from 'react'
import {
  ArrowDownRight, ArrowRight, Atom, Check, ChevronDown, CircleHelp,
  Command, FileText, FolderOpen, Lightbulb, Menu, Plus, Search,
  Settings2, Sparkles, Target, X
} from 'lucide-react'

type Project = {
  id: string
  name: string
  category: string
  stage: string
  updated: string
  color: string
}

const initialProjects: Project[] = [
  { id: 'p1', name: 'Cadê o Roteirista?', category: 'Cultura & conteúdo', stage: 'Investigação concluída', updated: 'Estudo de caso', color: 'lime' },
  { id: 'p2', name: 'Projeto sem nome', category: 'Ainda por descobrir', stage: 'Ponto de partida', updated: 'Exemplo de projeto', color: 'paper' },
]

const stages = [
  { number: '01', name: 'Investigar', detail: 'Entender o contexto antes de propor respostas', icon: Search },
  { number: '02', name: 'Interpretar', detail: 'Separar evidências, hipóteses e tensões', icon: Atom },
  { number: '03', name: 'Direcionar', detail: 'Construir e validar um caminho estratégico', icon: Target },
  { number: '04', name: 'Expressar', detail: 'Transformar direção em linguagem e identidade', icon: Lightbulb },
]

function App() {
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem('brandsmith.projects')
      return saved ? JSON.parse(saved) as Project[] : initialProjects
    } catch {
      return initialProjects
    }
  })
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [category, setCategory] = useState('')
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [activeNav, setActiveNav] = useState('Projetos')
  const [notice, setNotice] = useState('')
  const [investigationProject, setInvestigationProject] = useState<string | null>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [investigations, setInvestigations] = useState<Record<string, string[]>>(() => {
    try { return JSON.parse(localStorage.getItem('brandsmith.investigations') || '{}') as Record<string, string[]> } catch { return {} }
  })
  const [summaryApproved, setSummaryApproved] = useState<Record<string, boolean>>({})
  const investigationQuestions = [
    { title: 'O que você está construindo?', prompt: 'Conte com suas palavras o que é a marca, produto ou projeto. Não precisa ter a resposta pronta.', kind: 'contexto' },
    { title: 'Por que isso precisa existir?', prompt: 'Que necessidade, incômodo ou oportunidade fez essa ideia nascer?', kind: 'motivação' },
    { title: 'Para quem isso importa — e em que situação?', prompt: 'Descreva pessoas e circunstâncias reais, não apenas uma faixa demográfica.', kind: 'público' },
    { title: 'O que já sabemos de verdade?', prompt: 'Traga exemplos, observações, dados ou experiências que sustentam o que você contou. Se ainda não houver evidências, diga isso.', kind: 'evidências' },
    { title: 'O que você já prefere ou quer evitar?', prompt: 'Registre gostos, referências, limites e coisas que não combinam com o projeto. Preferência não é prova — é um dado sobre você.', kind: 'preferências' },
    { title: 'O que ainda é uma aposta?', prompt: 'Que suposição sobre o público, o mercado ou o valor da ideia você gostaria de verificar?', kind: 'hipóteses' },
  ]
  const currentInvestigation = investigationProject ? investigations[investigationProject] || [] : []
  const baseQuestion = investigationQuestions[questionIndex]
  const motivationAnswer = (currentInvestigation[1] || '').toLowerCase()
  const question = questionIndex === 2 && /concorr|mercado|alternativ|marca|produto/.test(motivationAnswer)
    ? { ...baseQuestion, title: 'O que faria alguém escolher sua proposta?', prompt: 'Você mencionou um contexto de mercado ou alternativas. Em que situação sua proposta seria realmente mais relevante — e para quem?' }
    : questionIndex === 3 && /experiên|aconteceu|cliente|usuári|vivi|observei/.test((currentInvestigation[0] || '').toLowerCase())
      ? { ...baseQuestion, title: 'Que sinais concretos você já observou?', prompt: 'Você descreveu uma experiência ou observação. O que aconteceu, com quem e qual parte é observação direta — em vez de interpretação?' }
      : baseQuestion
  function saveInvestigationAnswer() {
    if (!investigationProject || !currentAnswer.trim()) return
    const nextAnswers = [...currentInvestigation]
    nextAnswers[questionIndex] = currentAnswer.trim()
    const next = { ...investigations, [investigationProject]: nextAnswers }
    setInvestigations(next)
    try { localStorage.setItem('brandsmith.investigations', JSON.stringify(next)) } catch { setNotice('Não foi possível salvar a investigação neste navegador.') }
    setCurrentAnswer('')
    if (questionIndex < investigationQuestions.length - 1) setQuestionIndex(questionIndex + 1)
    else setQuestionIndex(investigationQuestions.length)
  }

  const filteredProjects = useMemo(
    () => projects.filter((project) => project.name.toLowerCase().includes(search.toLowerCase()) || project.category.toLowerCase().includes(search.toLowerCase())),
    [projects, search],
  )

  function saveProjects(next: Project[]) {
    setProjects(next)
    try {
      localStorage.setItem('brandsmith.projects', JSON.stringify(next))
    } catch {
      setNotice('Não foi possível salvar neste navegador.')
    }
  }

  function createProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = projectName.trim()
    if (!name) return
    const project: Project = {
      id: `p-${Date.now()}`,
      name,
      category: category.trim() || 'A definir',
      stage: 'Ponto de partida',
      updated: 'Criado agora',
      color: 'lime',
    }
    saveProjects([project, ...projects])
    setProjectName('')
    setCategory('')
    setShowCreate(false)
    setSelectedProject(project.id)
    setNotice('Projeto criado. O próximo passo é investigar antes de definir a direção.')
  }

  const activeProject = projects.find((project) => project.id === selectedProject)

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand-lockup" href="#" onClick={(event) => { event.preventDefault(); setSelectedProject(null); setActiveNav('Projetos') }} aria-label="BRANDSMITH início">
          <span className="brand-symbol">B<span>✳</span></span>
          <span className="brand-word">BRANDSMITH<span className="brand-period">.</span></span>
        </a>
        <div className="workspace-label">ESPAÇO DE TRABALHO <ChevronDown size={13} /></div>
        <div className="workspace-card"><span className="workspace-avatar">M</span><span><strong>Meu estúdio</strong><small>Plano de exploração</small></span><Settings2 size={16} /></div>
        <div className="nav-label">WORKSPACE</div>
        <nav className="navigation">
          <button className={activeNav === 'Projetos' ? 'nav-item active' : 'nav-item'} onClick={() => { setActiveNav('Projetos'); setSelectedProject(null) }}><FolderOpen size={17} />Projetos<span className="nav-count">{projects.length}</span></button>
          <button className={activeNav === 'Biblioteca' ? 'nav-item active' : 'nav-item'} onClick={() => { setActiveNav('Biblioteca'); setSelectedProject(null); setNotice('A biblioteca de referências entra numa próxima etapa do MVP.') }}><FileText size={17} />Biblioteca</button>
        </nav>
        <div className="sidebar-bottom">
          <div className="principle-card"><span className="principle-mark">✳</span><p>Não aceite a primeira resposta como a melhor resposta.</p><span>UM PRINCÍPIO BRANDSMITH</span></div>
          <button className="help-link" onClick={() => setNotice('O BRANDSMITH conduz o processo por etapas. Você valida cada síntese antes de avançar.')}><CircleHelp size={16} />Como funciona</button>
          <div className="profile-row"><span className="profile-avatar">MI</span><span><strong>Meu perfil</strong><small>Espaço pessoal</small></span><Menu size={17} /></div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><span className="crumb-slash">/</span><strong>{activeProject ? activeProject.name : activeNav}</strong></div>
          <div className="topbar-right"><span className="status-dot" />MVP em construção<button className="icon-button" aria-label="Ajuda" onClick={() => setNotice('Esta é a primeira estrutura navegável do BRANDSMITH. Os projetos ficam salvos neste navegador nesta etapa.')}><CircleHelp size={18} /></button></div>
        </header>

        <div className="page-content">
          {activeProject ? (
            <section className="project-detail">
              <button className="back-link" onClick={() => setSelectedProject(null)}>← Voltar para projetos</button>
              <div className="eyebrow"><span className="eyebrow-line" />PROJETO / PONTO DE PARTIDA</div>
              <div className="detail-heading"><div><h1>{activeProject.name}<span className="lime-period">.</span></h1><p className="lead">{activeProject.category}</p></div><span className="stage-pill"><span />{activeProject.stage}</span></div>
              <div className="detail-callout"><div className="callout-icon"><Sparkles size={21} /></div><div><span className="mini-label">ANTES DE CRIAR, VAMOS ENTENDER</span><h2>O que torna essa marca necessária?</h2><p>Uma marca forte começa com perguntas melhores, não com soluções visuais apressadas. A investigação vai revelar o contexto, as tensões e as oportunidades que merecem ser exploradas.</p><button className="primary-button" onClick={() => { setInvestigationProject(activeProject.id); setQuestionIndex((investigations[activeProject.id] || []).length >= investigationQuestions.length ? investigationQuestions.length : (investigations[activeProject.id] || []).length); setCurrentAnswer((investigations[activeProject.id] || []).length >= investigationQuestions.length ? '' : (investigations[activeProject.id] || [])[(investigations[activeProject.id] || []).length] || '') }} >Começar investigação <ArrowRight size={16} /></button></div></div>
              <div className="section-heading"><div><span className="mini-label">O PROCESSO</span><h2>Um caminho, não uma fórmula.</h2></div><span className="section-aside">04 ETAPAS · VOCÊ VALIDA CADA UMA</span></div>
              <div className="stage-list">{stages.map((stage, index) => { const Icon = stage.icon; return <div className="stage-row" key={stage.number}><span className="stage-number">{stage.number}</span><div className="stage-icon"><Icon size={18} /></div><div className="stage-copy"><h3>{stage.name}</h3><p>{stage.detail}</p></div><span className="stage-state">{index === 0 ? 'Próxima etapa' : 'Aguardando'}</span><ArrowDownRight className="stage-arrow" size={17} /></div> })}</div>
              <div className="notice-inline"><Check size={16} />As decisões estratégicas só serão consolidadas depois de investigadas e validadas por você.</div>
            </section>
          ) : (
            <>
              <section className="welcome-block">
                <div className="eyebrow"><span className="eyebrow-line" />ESTÚDIO DE BRANDING COM IA</div>
                <h1>O óbvio não cria<br />marcas <em>extraordinárias.</em></h1>
                <p>Todo projeto começa com uma pergunta. O nosso trabalho é descobrir quais perguntas ainda não foram feitas.</p>
                <div className="welcome-stamp"><span>BS</span><span>THINK<br />DIFFERENTLY</span></div>
              </section>

              <section className="projects-section">
                <div className="section-heading projects-heading"><div><span className="mini-label">SEU ESPAÇO CRIATIVO</span><h2>Projetos<span className="lime-period">.</span> <span className="project-total">{projects.length.toString().padStart(2, '0')}</span></h2></div><button className="primary-button" onClick={() => setShowCreate(true)}><Plus size={17} /> Novo projeto</button></div>
                <div className="project-toolbar"><div className="search-box"><Search size={16} /><input aria-label="Buscar projetos" placeholder="Buscar projetos..." value={search} onChange={(event) => setSearch(event.target.value)} /><kbd><Command size={11} /> K</kbd></div><span className="sort-label">ORDENADOS POR ATIVIDADE <ChevronDown size={13} /></span></div>
                <div className="project-grid">
                  {filteredProjects.map((project, index) => (
                    <button className={`project-card ${project.color}`} key={project.id} onClick={() => setSelectedProject(project.id)}>
                      <div className="project-card-top"><span className="project-type">{project.category}</span><span className="card-arrow"><ArrowUpRightIcon /></span></div>
                      <div className="project-art"><span className="art-grid" /><span className="art-word">{index === 0 ? <>CADÊ O<br />ROTEIRISTA<span>?</span></> : <>{project.name.split(' ').slice(0, 2).join(' ').toUpperCase()}<span>.</span></>}</span><span className="art-mark">✳</span></div>
                      <div className="project-card-bottom"><div><h3>{project.name}</h3><p>{project.stage}</p></div><span className="card-open"><ArrowRight size={17} /></span></div>
                      <div className="card-progress"><span style={{ width: project.stage === 'Investigação concluída' ? '26%' : '5%' }} /></div>
                    </button>
                  ))}
                  <button className="new-project-card" onClick={() => setShowCreate(true)}><span className="new-project-icon"><Plus size={22} /></span><strong>Uma ideia nova?</strong><span>Comece um projeto do zero.</span><span className="new-project-cta">Criar projeto <ArrowRight size={15} /></span></button>
                </div>
                {filteredProjects.length === 0 && <div className="empty-search">Nenhum projeto encontrado. Tente outro termo ou crie um novo projeto.</div>}
              </section>

              <section className="bottom-note"><div className="note-symbol">✳</div><div><strong>O processo é adaptativo. O pensamento é seu.</strong><p>A IA ajuda a investigar, confrontar e organizar ideias. Você decide o que faz sentido e o que merece seguir adiante.</p></div><span className="note-index">01 / 04</span></section>
            </>
          )}
        </div>
        <footer className="footer"><span>BRANDSMITH<span className="lime-period">.</span> <span>O óbvio não é o destino.</span></span><span>FEITO PARA QUESTIONAR <span className="footer-star">✳</span></span></footer>
      </main>

      {notice && <div className="toast" role="status"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Fechar aviso"><X size={15} /></button></div>}
      {investigationProject && <div className="modal-backdrop investigation-backdrop"><section className="investigation-modal" role="dialog" aria-modal="true" aria-labelledby="investigation-title"><div className="investigation-top"><span className="mini-label">INVESTIGAÇÃO ADAPTATIVA · {String(Math.min(questionIndex + 1, investigationQuestions.length)).padStart(2, '0')} / 06</span><button className="icon-button" onClick={() => setInvestigationProject(null)} aria-label="Fechar investigação"><X size={18} /></button></div><div className="investigation-progress">{investigationQuestions.map((item, i) => <span key={item.kind} className={i <= questionIndex ? 'done' : ''} />)}</div>{questionIndex < investigationQuestions.length ? <><div className="eyebrow"><span className="eyebrow-line" />VAMOS INVESTIGAR ANTES DE CONCLUIR</div><h2 id="investigation-title">{question.title}<span className="lime-period">.</span></h2><p className="investigation-prompt">{question.prompt}</p><label className="answer-label" htmlFor="investigation-answer">SUA RESPOSTA</label><textarea id="investigation-answer" autoFocus rows={5} value={currentAnswer} onChange={e => setCurrentAnswer(e.target.value)} placeholder="Escreva livremente. Não existe resposta certa nesta etapa..." /><div className="investigation-actions"><button className="secondary-button" onClick={() => { if (questionIndex > 0) { setQuestionIndex(questionIndex - 1); setCurrentAnswer(currentInvestigation[questionIndex - 1] || '') } else setInvestigationProject(null) }}>{questionIndex > 0 ? 'Voltar' : 'Sair'}</button><button className="primary-button" disabled={!currentAnswer.trim()} onClick={saveInvestigationAnswer}>{questionIndex === investigationQuestions.length - 1 ? 'Organizar síntese' : 'Continuar'} <ArrowRight size={16} /></button></div><p className="investigation-footnote"><Check size={14} />Você pode revisar suas respostas. Nenhuma decisão estratégica será tomada automaticamente.</p></> : <><div className="eyebrow"><span className="eyebrow-line" />PRIMEIRA LEITURA · PARA VALIDAR</div><h2 id="investigation-title">O que sabemos até aqui<span className="lime-period">.</span></h2><p className="investigation-prompt">Esta síntese organiza suas respostas por natureza. Ela não é uma estratégia final nem uma conclusão sobre o mercado.</p><div className="synthesis-list">{investigationQuestions.map((item, i) => <article className="synthesis-item" key={item.kind}><span>{String(i + 1).padStart(2, '0')} · {item.kind.toUpperCase()}</span><p>{(currentInvestigation[i] || 'Ainda não respondido.').trim()}</p></article>)}</div><div className="investigation-actions"><button className="secondary-button" onClick={() => { setQuestionIndex(5); setCurrentAnswer(currentInvestigation[5] || '') }}>Revisar última resposta</button><button className="primary-button" onClick={() => { setSummaryApproved({ ...summaryApproved, [investigationProject]: true }); const updated = projects.map(p => p.id === investigationProject ? { ...p, stage: 'Investigação para revisar', updated: 'Investigação concluída' } : p); saveProjects(updated); setInvestigationProject(null); setNotice('Síntese registrada para sua revisão. Ela ainda não define o posicionamento da marca.') }}>Validar esta organização <Check size={16} /></button></div><p className="investigation-footnote"><Check size={14} />Validar significa aprovar a organização das informações, não transformar hipóteses em fatos.</p></>}</section></div>}
      {showCreate && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowCreate(false) }}><section className="create-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-top"><span className="mini-label">NOVO PROJETO / 01</span><button className="icon-button" onClick={() => setShowCreate(false)} aria-label="Fechar"><X size={18} /></button></div><div className="modal-symbol">✳</div><h2 id="modal-title">Toda marca começa<br />com uma <em>boa pergunta.</em></h2><p>Vamos abrir um espaço para investigar o que essa ideia pode se tornar. Você não precisa ter todas as respostas agora.</p><form onSubmit={createProject}><label htmlFor="project-name">Como vamos chamar este projeto?</label><input id="project-name" autoFocus placeholder="Nome da marca ou do projeto" value={projectName} onChange={(event) => setProjectName(event.target.value)} required maxLength={80} /><label htmlFor="project-category">Em que universo ele existe? <span>OPCIONAL</span></label><input id="project-category" placeholder="Ex.: alimentação, tecnologia, cultura..." value={category} onChange={(event) => setCategory(event.target.value)} maxLength={100} /><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setShowCreate(false)}>Cancelar</button><button type="submit" className="primary-button">Criar espaço <ArrowRight size={16} /></button></div></form><div className="modal-footnote"><Check size={14} />Você mantém o controle das decisões em todas as etapas.</div></section></div>}
    </div>
  )
}

function ArrowUpRightIcon() {
  return <ArrowDownRight size={17} style={{ transform: 'rotate(-135deg)' }} />
}

export default App
