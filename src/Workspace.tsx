import { useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabase'
import {
  ArrowDownRight, ArrowRight, Atom, Check, ChevronDown, CircleHelp,
  Command, Download, FileText, FolderOpen, Lightbulb, Menu, Plus, Search, Upload,
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

type DirectionDraft = { opportunity: string; tension: string; distinction: string; validation: string }
type CloudProject = { id: string; name: string; category: string; stage: string; color: string; investigation_answers: string[]; interpretation_notes: string; direction_notes: DirectionDraft; updated_at?: string }

function Workspace({ userId }: { userId?: string }) {
  const [cloudReady, setCloudReady] = useState(!userId || !supabase)
  const [cloudError, setCloudError] = useState('')
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
  const [interpretationProject, setInterpretationProject] = useState<string | null>(null)
  const [interpretationNotes, setInterpretationNotes] = useState<Record<string, string>>(() => { try { return JSON.parse(localStorage.getItem('brandsmith.interpretations') || '{}') as Record<string, string> } catch { return {} } })
  const [draftInterpretation, setDraftInterpretation] = useState('')
  const [directionProject, setDirectionProject] = useState<string | null>(null)
  const emptyDirection: DirectionDraft = { opportunity: '', tension: '', distinction: '', validation: '' }
  const [directionNotes, setDirectionNotes] = useState<Record<string, DirectionDraft>>(() => { try { return JSON.parse(localStorage.getItem('brandsmith.directions') || '{}') as Record<string, DirectionDraft> } catch { return {} } })
  const [draftDirection, setDraftDirection] = useState<DirectionDraft>(emptyDirection)
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

  useEffect(() => {
    if (!userId || !supabase) { setCloudReady(true); return }
    let cancelled = false
    async function loadCloudProjects() {
      setCloudReady(false)
      setCloudError('')
      const { data, error } = await supabase!
        .from('brand_projects')
        .select('id,name,category,stage,color,investigation_answers,interpretation_notes,direction_notes,updated_at')
        .eq('owner_id', userId)
        .order('updated_at', { ascending: false })
      if (cancelled) return
      if (error) {
        setCloudError('Não foi possível carregar os projetos da nuvem. Confira se a migração do Supabase foi aplicada.')
        setCloudReady(true)
        return
      }
      const rows = (data || []) as CloudProject[]
      if (rows.length > 0) {
        const nextProjects: Project[] = rows.map(row => ({
          id: row.id, name: row.name, category: row.category, stage: row.stage,
          color: row.color || 'lime', updated: 'Salvo na nuvem',
        }))
        const nextInvestigations: Record<string, string[]> = {}
        const nextInterpretations: Record<string, string> = {}
        const nextDirections: Record<string, DirectionDraft> = {}
        rows.forEach(row => {
          nextInvestigations[row.id] = Array.isArray(row.investigation_answers) ? row.investigation_answers : []
          nextInterpretations[row.id] = row.interpretation_notes || ''
          nextDirections[row.id] = row.direction_notes || { opportunity: '', tension: '', distinction: '', validation: '' }
        })
        setProjects(nextProjects); setInvestigations(nextInvestigations)
        setInterpretationNotes(nextInterpretations); setDirectionNotes(nextDirections)
        localStorage.setItem('brandsmith.projects', JSON.stringify(nextProjects))
        localStorage.setItem('brandsmith.investigations', JSON.stringify(nextInvestigations))
        localStorage.setItem('brandsmith.interpretations', JSON.stringify(nextInterpretations))
        localStorage.setItem('brandsmith.directions', JSON.stringify(nextDirections))
      } else {
        // First cloud login: migrate this browser's existing projects and related notes.
        const localProjects = (() => { try { return JSON.parse(localStorage.getItem('brandsmith.projects') || 'null') as Project[] | null } catch { return null } })()
        const localInvestigations = (() => { try { return JSON.parse(localStorage.getItem('brandsmith.investigations') || '{}') as Record<string, string[]> } catch { return {} } })()
        const localInterpretations = (() => { try { return JSON.parse(localStorage.getItem('brandsmith.interpretations') || '{}') as Record<string, string> } catch { return {} } })()
        const localDirections = (() => { try { return JSON.parse(localStorage.getItem('brandsmith.directions') || '{}') as Record<string, DirectionDraft> } catch { return {} } })()
        const sourceProjects = Array.isArray(localProjects) ? localProjects : projects
        const idMap = new Map<string, string>()
        const migrated = sourceProjects.map(project => {
          const id = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(project.id) ? project.id : crypto.randomUUID()
          idMap.set(project.id, id)
          return { ...project, id }
        })
        const answers: Record<string, string[]> = {}
        const interpretations: Record<string, string> = {}
        const directions: Record<string, DirectionDraft> = {}
        migrated.forEach(project => {
          const oldId = [...idMap.entries()].find(([, newId]) => newId === project.id)?.[0] || project.id
          answers[project.id] = localInvestigations[oldId] || []
          interpretations[project.id] = localInterpretations[oldId] || ''
          directions[project.id] = localDirections[oldId] || { opportunity: '', tension: '', distinction: '', validation: '' }
        })
        const { error: migrationError } = await supabase!.from('brand_projects').upsert(
          migrated.map(project => ({
            id: project.id, owner_id: userId, name: project.name, category: project.category,
            stage: project.stage, color: project.color || 'lime',
            investigation_answers: answers[project.id],
            interpretation_notes: interpretations[project.id],
            direction_notes: directions[project.id],
          })),
          { onConflict: 'id' },
        )
        if (cancelled) return
        if (migrationError) {
          setCloudError('Não foi possível migrar os dados locais. Eles continuam neste navegador; confira a migração e as políticas do Supabase.')
        } else {
          setProjects(migrated); setInvestigations(answers); setInterpretationNotes(interpretations); setDirectionNotes(directions)
          localStorage.setItem('brandsmith.projects', JSON.stringify(migrated))
          localStorage.setItem('brandsmith.investigations', JSON.stringify(answers))
          localStorage.setItem('brandsmith.interpretations', JSON.stringify(interpretations))
          localStorage.setItem('brandsmith.directions', JSON.stringify(directions))
          setNotice('Projetos e registros deste navegador foram transferidos para sua conta.')
        }
      }
      if (!cancelled) setCloudReady(true)
    }
    void loadCloudProjects()
    return () => { cancelled = true }
  // Load once per authenticated account; subsequent changes are handled by the sync effect below.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  useEffect(() => {
    if (!userId || !supabase || !cloudReady || cloudError) return
    const rows = projects.map(project => ({
      id: project.id, owner_id: userId, name: project.name, category: project.category,
      stage: project.stage, color: project.color || 'lime',
      investigation_answers: investigations[project.id] || [],
      interpretation_notes: interpretationNotes[project.id] || '',
      direction_notes: directionNotes[project.id] || { opportunity: '', tension: '', distinction: '', validation: '' },
    }))
    if (rows.length === 0) return
    let cancelled = false
    const timer = window.setTimeout(async () => {
      const { error } = await supabase!.from('brand_projects').upsert(rows, { onConflict: 'id' })
      if (!cancelled && error) setCloudError('A sincronização falhou. Seus dados locais continuam disponíveis; verifique a conexão com o Supabase.')
    }, 500)
    return () => { cancelled = true; window.clearTimeout(timer) }
  }, [userId, cloudReady, cloudError, projects, investigations, interpretationNotes, directionNotes])

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

  function exportProjectBrief(project: Project) {
    const answers = investigations[project.id] || []
    const direction = directionNotes[project.id] || emptyDirection
    const questionLabels = [
      'O que você está construindo?',
      'Por que isso precisa existir?',
      'Para quem isso importa — e em que situação?',
      'O que já sabemos de verdade?',
      'O que você já prefere ou quer evitar?',
      'O que ainda é uma aposta?',
    ]
    const lines = [
      '# BRANDSMITH — Dossiê do projeto',
      '',
      `**Projeto:** ${project.name}`,
      `**Categoria:** ${project.category}`,
      `**Etapa atual:** ${project.stage}`,
      `**Exportado em:** ${new Date().toLocaleDateString('pt-BR')}`,
      '',
      '> Documento de trabalho. Respostas e hipóteses refletem o que foi registrado no projeto; não são verificações independentes.',
      '',
      '## 1. Investigação',
      ...questionLabels.flatMap((label, index) => ['', `### ${index + 1}. ${label}`, answers[index]?.trim() || '_Ainda não respondido._']),
      '',
      '## 2. Interpretação',
      '',
      '### Dúvidas, contradições e pontos a verificar',
      interpretationNotes[project.id]?.trim() || '_Nenhuma nota registrada._',
      '',
      '## 3. Direção estratégica em exploração',
      '',
      '### Oportunidade relevante',
      direction.opportunity.trim() || '_Ainda não registrada._',
      '',
      '### Tensão a resolver',
      direction.tension.trim() || '_Ainda não registrada._',
      '',
      '### Hipótese de diferenciação',
      direction.distinction.trim() || '_Ainda não registrada._',
      '',
      '### O que precisa ser validado',
      direction.validation.trim() || '_Ainda não registrado._',
      '',
      '## Limites desta síntese',
      '- A organização das respostas não comprova a veracidade das afirmações.',
      '- Hipóteses continuam sendo hipóteses até serem verificadas.',
      '- Este documento não representa uma estratégia final aprovada, a menos que isso tenha sido explicitamente decidido fora deste fluxo.',
      '',
      '---',
      'Gerado pelo BRANDSMITH — O óbvio não cria marcas extraordinárias.',
    ]
    const blob = new Blob([lines.join('\\n')], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const slug = project.name.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'projeto'
    link.href = url
    link.download = `brandsmith-${slug}.md`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    setNotice('Dossiê exportado em Markdown. Você pode abrir e editar o arquivo em qualquer editor de texto.')
  }

  function exportBackup() {
    const backup = {
      format: 'brandsmith-backup',
      version: 1,
      exportedAt: new Date().toISOString(),
      projects,
      investigations,
      interpretations: interpretationNotes,
      directions: directionNotes,
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `brandsmith-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    setNotice('Backup exportado. Guarde o arquivo em um local seguro.')
  }

  async function importBackup(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const data: unknown = JSON.parse(await file.text())
      if (!data || typeof data !== 'object') throw new Error('Arquivo inválido')
      const backup = data as Record<string, unknown>
      if (backup.format !== 'brandsmith-backup' || backup.version !== 1 || !Array.isArray(backup.projects)) {
        throw new Error('Este arquivo não parece ser um backup compatível do BRANDSMITH.')
      }
      const validProjects = backup.projects.every((item) => item && typeof item === 'object' &&
        typeof (item as Record<string, unknown>).id === 'string' &&
        typeof (item as Record<string, unknown>).name === 'string' &&
        typeof (item as Record<string, unknown>).category === 'string' &&
        typeof (item as Record<string, unknown>).stage === 'string')
      const validRecord = (value: unknown) => value !== null && typeof value === 'object' && !Array.isArray(value)
      if (!validProjects || !validRecord(backup.investigations) || !validRecord(backup.interpretations) || !validRecord(backup.directions)) {
        throw new Error('O backup está incompleto ou contém dados em formato inesperado.')
      }
      if (!window.confirm('Importar este backup substituirá os projetos e dados salvos neste navegador. Exporte um backup atual antes de continuar, se quiser preservá-lo. Deseja continuar?')) return
      const nextProjects = backup.projects as Project[]
      const nextInvestigations = backup.investigations as Record<string, string[]>
      const nextInterpretations = backup.interpretations as Record<string, string>
      const nextDirections = backup.directions as Record<string, DirectionDraft>
      localStorage.setItem('brandsmith.projects', JSON.stringify(nextProjects))
      localStorage.setItem('brandsmith.investigations', JSON.stringify(nextInvestigations))
      localStorage.setItem('brandsmith.interpretations', JSON.stringify(nextInterpretations))
      localStorage.setItem('brandsmith.directions', JSON.stringify(nextDirections))
      setProjects(nextProjects)
      setInvestigations(nextInvestigations)
      setInterpretationNotes(nextInterpretations)
      setDirectionNotes(nextDirections)
      setSelectedProject(null)
      setActiveNav('Projetos')
      setNotice('Backup importado. Os projetos e registros foram restaurados neste navegador.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Não foi possível importar esse arquivo.')
    }
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
          <div className="topbar-right"><span className="status-dot" />{userId ? (cloudError ? 'Sincronização pendente' : cloudReady ? 'Conta conectada' : 'Carregando projetos…') : 'MVP em construção'}<button className="icon-button" aria-label="Ajuda" onClick={() => setNotice('Esta é a primeira estrutura navegável do BRANDSMITH. Os projetos ficam salvos neste navegador nesta etapa.')}><CircleHelp size={18} /></button></div>
        </header>

        {cloudError && <div className="notice-inline" role="status">{cloudError}</div>}
        <div className="page-content">
          {activeProject ? (
            <section className="project-detail">
              <button className="back-link" onClick={() => setSelectedProject(null)}>← Voltar para projetos</button>
              <div className="eyebrow"><span className="eyebrow-line" />PROJETO / PONTO DE PARTIDA</div>
              <div className="detail-heading"><div><h1>{activeProject.name}<span className="lime-period">.</span></h1><p className="lead">{activeProject.category}</p></div><span className="stage-pill"><span />{activeProject.stage}</span></div>
              <div className="detail-callout"><div className="callout-icon"><Sparkles size={21} /></div><div><span className="mini-label">ANTES DE CRIAR, VAMOS ENTENDER</span><h2>O que torna essa marca necessária?</h2><p>Uma marca forte começa com perguntas melhores, não com soluções visuais apressadas. A investigação vai revelar o contexto, as tensões e as oportunidades que merecem ser exploradas.</p><button className="primary-button" onClick={() => { setInvestigationProject(activeProject.id); setQuestionIndex((investigations[activeProject.id] || []).length >= investigationQuestions.length ? investigationQuestions.length : (investigations[activeProject.id] || []).length); setCurrentAnswer((investigations[activeProject.id] || []).length >= investigationQuestions.length ? '' : (investigations[activeProject.id] || [])[(investigations[activeProject.id] || []).length] || '') }} >Começar investigação <ArrowRight size={16} /></button></div></div>
              {(investigations[activeProject.id]?.length || 0) >= 6 && <div className="interpretation-entry"><div><span className="mini-label">PRÓXIMA ETAPA</span><h3>Separar o que sabemos do que ainda precisamos descobrir.</h3><p>Organize evidências, preferências e hipóteses antes de formular uma direção estratégica.</p></div><button className="secondary-button" onClick={() => { setInterpretationProject(activeProject.id); setDraftInterpretation(interpretationNotes[activeProject.id] || '') }}>Interpretar investigação <ArrowRight size={15} /></button></div>}
              {activeProject.stage === 'Interpretação validada' && <div className="interpretation-entry direction-entry"><div><span className="mini-label">ETAPA 03 · DIRECIONAR</span><h3>Que caminho estratégico merece ser explorado?</h3><p>Registre uma oportunidade, a tensão que a marca precisa resolver e uma hipótese de diferenciação. Nada será definido automaticamente.</p></div><button className="primary-button" onClick={() => { setDirectionProject(activeProject.id); setDraftDirection(directionNotes[activeProject.id] || emptyDirection) }}>Construir direção <ArrowRight size={15} /></button></div>}
              <div className="export-brief-row"><div><span className="mini-label">SEU TRABALHO, FORA DO APP</span><p>Exporte as respostas, notas e hipóteses reunidas em um dossiê editável.</p></div><button className="secondary-button" onClick={() => exportProjectBrief(activeProject)}><FileText size={16} /> Exportar dossiê (.md)</button></div>
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
                <div className="backup-actions"><button className="secondary-button" onClick={exportBackup}><Download size={15} /> Exportar backup</button><label className="secondary-button backup-import"><Upload size={15} /> Importar backup<input type="file" accept="application/json,.json" onChange={importBackup} /></label></div>
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
      {directionProject && <div className="modal-backdrop investigation-backdrop"><section className="investigation-modal direction-modal" role="dialog" aria-modal="true" aria-labelledby="direction-title"><div className="investigation-top"><span className="mini-label">ETAPA 03 · DIRECIONAR</span><button className="icon-button" onClick={() => setDirectionProject(null)} aria-label="Fechar direção"><X size={18} /></button></div><div className="eyebrow"><span className="eyebrow-line" />UMA DIREÇÃO É UMA HIPÓTESE, NÃO UM SLOGAN</div><h2 id="direction-title">Que caminho vale a pena explorar<span className="lime-period">?</span></h2><p className="investigation-prompt">Use a interpretação validada como ponto de partida. Registre possibilidades que possam ser discutidas e testadas — não precisa chegar a uma resposta definitiva.</p><div className="direction-fields"><label htmlFor="direction-opportunity">01 · OPORTUNIDADE RELEVANTE<textarea id="direction-opportunity" rows={3} value={draftDirection.opportunity} onChange={e => setDraftDirection({ ...draftDirection, opportunity: e.target.value })} placeholder="Que necessidade ou possibilidade parece merecer atenção?" /></label><label htmlFor="direction-tension">02 · TENSÃO A RESOLVER<textarea id="direction-tension" rows={3} value={draftDirection.tension} onChange={e => setDraftDirection({ ...draftDirection, tension: e.target.value })} placeholder="Que conflito, expectativa ou barreira a marca precisa enfrentar?" /></label><label htmlFor="direction-distinction">03 · HIPÓTESE DE DIFERENCIAÇÃO<textarea id="direction-distinction" rows={3} value={draftDirection.distinction} onChange={e => setDraftDirection({ ...draftDirection, distinction: e.target.value })} placeholder="O que poderia tornar esta proposta relevante de um jeito próprio?" /></label><label htmlFor="direction-validation">04 · O QUE PRECISA SER VALIDADO<textarea id="direction-validation" rows={3} value={draftDirection.validation} onChange={e => setDraftDirection({ ...draftDirection, validation: e.target.value })} placeholder="Que evidência, conversa ou experimento ajudaria a avaliar essa hipótese?" /></label></div><div className="investigation-actions"><button className="secondary-button" onClick={() => setDirectionProject(null)}>Voltar depois</button><button className="secondary-button" onClick={() => { const next = { ...directionNotes, [directionProject]: draftDirection }; setDirectionNotes(next); try { localStorage.setItem('brandsmith.directions', JSON.stringify(next)) } catch { setNotice('Não foi possível salvar a direção neste navegador.'); return } const updated = projects.map(p => p.id === directionProject ? { ...p, stage: 'Direção em elaboração', updated: 'Rascunho estratégico salvo' } : p); saveProjects(updated); setDirectionProject(null); setNotice('Rascunho estratégico salvo. A direção ainda não foi validada.') }}>Salvar rascunho</button><button className="primary-button" onClick={() => { if (![draftDirection.opportunity, draftDirection.tension, draftDirection.distinction, draftDirection.validation].some(value => value.trim())) { setNotice('Registre pelo menos uma hipótese antes de validar.'); return } const next = { ...directionNotes, [directionProject]: draftDirection }; setDirectionNotes(next); try { localStorage.setItem('brandsmith.directions', JSON.stringify(next)) } catch { setNotice('Não foi possível salvar a direção neste navegador.'); return } const updated = projects.map(p => p.id === directionProject ? { ...p, stage: 'Direção para revisar', updated: 'Rascunho de direção criado' } : p); saveProjects(updated); setDirectionProject(null); setNotice('Direção registrada para sua revisão. Ela ainda não está aprovada como estratégia final.') }}>Registrar direção <Check size={16} /></button></div><p className="investigation-footnote"><Check size={14} />Registrar uma direção não equivale a aprovar uma estratégia definitiva.</p></section></div>}
      {interpretationProject && <div className="modal-backdrop investigation-backdrop"><section className="investigation-modal interpretation-modal" role="dialog" aria-modal="true" aria-labelledby="interpretation-title"><div className="investigation-top"><span className="mini-label">ETAPA 02 · INTERPRETAR</span><button className="icon-button" onClick={() => setInterpretationProject(null)} aria-label="Fechar interpretação"><X size={18} /></button></div><div className="eyebrow"><span className="eyebrow-line" />ORGANIZAR NÃO É CONCLUIR</div><h2 id="interpretation-title">O que é evidência, preferência ou hipótese<span className="lime-period">?</span></h2><p className="investigation-prompt">A classificação inicial se baseia na pergunta em que cada resposta foi registrada; ela não verifica se a afirmação é verdadeira. Revise as notas e identifique o que ainda precisa ser investigado.</p><div className="interpretation-groups"><article><span className="interpretation-tag evidence">01 · EVIDÊNCIAS E CONTEXTO</span><p>{investigations[interpretationProject]?.[0] || "Contexto ainda não informado."}</p><small>O contexto é relato do projeto; evidências verificáveis ainda precisam ser identificadas.</small><p>{investigations[interpretationProject]?.[3] || "Nenhuma evidência ou observação descrita."}</p></article><article><span className="interpretation-tag preference">02 · PREFERÊNCIAS DECLARADAS</span><p>{investigations[interpretationProject]?.[4] || "Nenhuma preferência declarada."}</p><small>Preferências orientam escolhas, mas não comprovam necessidades do público.</small></article><article><span className="interpretation-tag hypothesis">03 · HIPÓTESES A VERIFICAR</span><p>{investigations[interpretationProject]?.[1] || "Motivação ainda não descrita."}</p><p>{investigations[interpretationProject]?.[2] || "Público e contexto de uso ainda não descritos."}</p><p>{investigations[interpretationProject]?.[5] || "Nenhuma hipótese explicitada."}</p><small>Motivação e público são questões a investigar, não fatos confirmados.</small></article></div><label className="answer-label" htmlFor="interpretation-notes">DÚVIDAS, CONTRADIÇÕES E PONTOS A VERIFICAR</label><textarea id="interpretation-notes" rows={4} value={draftInterpretation} onChange={e => setDraftInterpretation(e.target.value)} placeholder="O que não está claro? Que afirmações precisam de evidência? Há respostas que entram em conflito?" /><div className="investigation-actions"><button className="secondary-button" onClick={() => setInterpretationProject(null)}>Voltar depois</button><button className="secondary-button" onClick={() => { const next = { ...interpretationNotes, [interpretationProject]: draftInterpretation }; setInterpretationNotes(next); try { localStorage.setItem("brandsmith.interpretations", JSON.stringify(next)) } catch { setNotice("Não foi possível salvar a interpretação neste navegador."); return } const updated = projects.map(p => p.id === interpretationProject ? { ...p, stage: "Interpretação em revisão", updated: "Interpretação salva" } : p); saveProjects(updated); setInterpretationProject(null); setNotice("Rascunho salvo. A interpretação continua pendente de validação.") }}>Salvar rascunho</button><button className="primary-button" onClick={() => { const next = { ...interpretationNotes, [interpretationProject]: draftInterpretation }; setInterpretationNotes(next); try { localStorage.setItem("brandsmith.interpretations", JSON.stringify(next)) } catch { setNotice("Não foi possível salvar a interpretação neste navegador."); return } const updated = projects.map(p => p.id === interpretationProject ? { ...p, stage: "Interpretação validada", updated: "Etapa 02 validada" } : p); saveProjects(updated); setInterpretationProject(null); setNotice("Interpretação validada por você. As hipóteses continuam identificadas como hipóteses.") }}>Validar interpretação <Check size={16} /></button></div><p className="investigation-footnote"><Check size={14} />A interpretação fica provisória até ser revisada por você.</p></section></div>}
      {investigationProject && <div className="modal-backdrop investigation-backdrop"><section className="investigation-modal" role="dialog" aria-modal="true" aria-labelledby="investigation-title"><div className="investigation-top"><span className="mini-label">INVESTIGAÇÃO ADAPTATIVA · {String(Math.min(questionIndex + 1, investigationQuestions.length)).padStart(2, '0')} / 06</span><button className="icon-button" onClick={() => setInvestigationProject(null)} aria-label="Fechar investigação"><X size={18} /></button></div><div className="investigation-progress">{investigationQuestions.map((item, i) => <span key={item.kind} className={i <= questionIndex ? 'done' : ''} />)}</div>{questionIndex < investigationQuestions.length ? <><div className="eyebrow"><span className="eyebrow-line" />VAMOS INVESTIGAR ANTES DE CONCLUIR</div><h2 id="investigation-title">{question.title}<span className="lime-period">.</span></h2><p className="investigation-prompt">{question.prompt}</p><label className="answer-label" htmlFor="investigation-answer">SUA RESPOSTA</label><textarea id="investigation-answer" autoFocus rows={5} value={currentAnswer} onChange={e => setCurrentAnswer(e.target.value)} placeholder="Escreva livremente. Não existe resposta certa nesta etapa..." /><div className="investigation-actions"><button className="secondary-button" onClick={() => { if (questionIndex > 0) { setQuestionIndex(questionIndex - 1); setCurrentAnswer(currentInvestigation[questionIndex - 1] || '') } else setInvestigationProject(null) }}>{questionIndex > 0 ? 'Voltar' : 'Sair'}</button><button className="primary-button" disabled={!currentAnswer.trim()} onClick={saveInvestigationAnswer}>{questionIndex === investigationQuestions.length - 1 ? 'Organizar síntese' : 'Continuar'} <ArrowRight size={16} /></button></div><p className="investigation-footnote"><Check size={14} />Você pode revisar suas respostas. Nenhuma decisão estratégica será tomada automaticamente.</p></> : <><div className="eyebrow"><span className="eyebrow-line" />PRIMEIRA LEITURA · PARA VALIDAR</div><h2 id="investigation-title">O que sabemos até aqui<span className="lime-period">.</span></h2><p className="investigation-prompt">Esta síntese organiza suas respostas por natureza. Ela não é uma estratégia final nem uma conclusão sobre o mercado.</p><div className="synthesis-list">{investigationQuestions.map((item, i) => <article className="synthesis-item" key={item.kind}><span>{String(i + 1).padStart(2, '0')} · {item.kind.toUpperCase()}</span><p>{(currentInvestigation[i] || 'Ainda não respondido.').trim()}</p></article>)}</div><div className="investigation-actions"><button className="secondary-button" onClick={() => { setQuestionIndex(5); setCurrentAnswer(currentInvestigation[5] || '') }}>Revisar última resposta</button><button className="primary-button" onClick={() => { setSummaryApproved({ ...summaryApproved, [investigationProject]: true }); const updated = projects.map(p => p.id === investigationProject ? { ...p, stage: 'Investigação para revisar', updated: 'Investigação concluída' } : p); saveProjects(updated); setInvestigationProject(null); setNotice('Síntese registrada para sua revisão. Ela ainda não define o posicionamento da marca.') }}>Validar esta organização <Check size={16} /></button></div><p className="investigation-footnote"><Check size={14} />Validar significa aprovar a organização das informações, não transformar hipóteses em fatos.</p></>}</section></div>}
      {showCreate && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowCreate(false) }}><section className="create-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-top"><span className="mini-label">NOVO PROJETO / 01</span><button className="icon-button" onClick={() => setShowCreate(false)} aria-label="Fechar"><X size={18} /></button></div><div className="modal-symbol">✳</div><h2 id="modal-title">Toda marca começa<br />com uma <em>boa pergunta.</em></h2><p>Vamos abrir um espaço para investigar o que essa ideia pode se tornar. Você não precisa ter todas as respostas agora.</p><form onSubmit={createProject}><label htmlFor="project-name">Como vamos chamar este projeto?</label><input id="project-name" autoFocus placeholder="Nome da marca ou do projeto" value={projectName} onChange={(event) => setProjectName(event.target.value)} required maxLength={80} /><label htmlFor="project-category">Em que universo ele existe? <span>OPCIONAL</span></label><input id="project-category" placeholder="Ex.: alimentação, tecnologia, cultura..." value={category} onChange={(event) => setCategory(event.target.value)} maxLength={100} /><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setShowCreate(false)}>Cancelar</button><button type="submit" className="primary-button">Criar espaço <ArrowRight size={16} /></button></div></form><div className="modal-footnote"><Check size={14} />Você mantém o controle das decisões em todas as etapas.</div></section></div>}
    </div>
  )
}

function ArrowUpRightIcon() {
  return <ArrowDownRight size={17} style={{ transform: 'rotate(-135deg)' }} />
}

export default Workspace
