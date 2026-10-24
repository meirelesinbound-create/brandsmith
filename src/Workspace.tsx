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

type DirectionDraft = { opportunity: string; tension: string; distinction: string; validation: string; brandPromise?: string; personality?: string; voicePrinciples?: string; visualTerritory?: string; avoidances?: string; expressionValidation?: string; expressionApproved?: boolean }
type CloudProject = { id: string; name: string; category: string; stage: string; color: string; investigation_answers: string[]; interpretation_notes: string; direction_notes: DirectionDraft; updated_at?: string }

function Workspace({ userId }: { userId?: string }) {
  const [cloudReady, setCloudReady] = useState(!userId || !supabase)
  const [cloudError, setCloudError] = useState('')
  const [syncError, setSyncError] = useState('')
  const [syncAttempt, setSyncAttempt] = useState(0)
  const [loadAttempt, setLoadAttempt] = useState(0)
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
  const [expressionProject, setExpressionProject] = useState<string | null>(null)
  const emptyExpression = { brandPromise: '', personality: '', voicePrinciples: '', visualTerritory: '', avoidances: '', expressionValidation: '' }
  const [draftExpression, setDraftExpression] = useState(emptyExpression)
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
    try {
      localStorage.setItem('brandsmith.investigations', JSON.stringify(next))
    } catch {
      setNotice('Não foi possível salvar a investigação neste navegador. Sua resposta continua no campo; libere espaço ou habilite o armazenamento e tente novamente.')
      return
    }
    setInvestigations(next)
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

        // Preserve projects that exist only in this browser instead of replacing them
        // with the cloud list. Their IDs and related notes are migrated together.
        const localProjects = (() => {
          try { return JSON.parse(localStorage.getItem('brandsmith.projects') || '[]') as Project[] } catch { return [] }
        })()
        const localInvestigations = (() => {
          try { return JSON.parse(localStorage.getItem('brandsmith.investigations') || '{}') as Record<string, string[]> } catch { return {} }
        })()
        const localInterpretations = (() => {
          try { return JSON.parse(localStorage.getItem('brandsmith.interpretations') || '{}') as Record<string, string> } catch { return {} }
        })()
        const localDirections = (() => {
          try { return JSON.parse(localStorage.getItem('brandsmith.directions') || '{}') as Record<string, DirectionDraft> } catch { return {} }
        })()
        const cloudIds = new Set(nextProjects.map(project => project.id))
        const localOnly = (Array.isArray(localProjects) ? localProjects : []).filter(project => !cloudIds.has(project.id))
        const migratedLocal = localOnly.map(project => {
          const id = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(project.id) ? project.id : crypto.randomUUID()
          nextInvestigations[id] = localInvestigations[project.id] || []
          nextInterpretations[id] = localInterpretations[project.id] || ''
          nextDirections[id] = localDirections[project.id] || { opportunity: '', tension: '', distinction: '', validation: '' }
          return { ...project, id }
        })
        if (migratedLocal.length) {
          const { error: localMigrationError } = await supabase!.from('brand_projects').upsert(
            migratedLocal.map(project => ({
              id: project.id, owner_id: userId, name: project.name, category: project.category,
              stage: project.stage, color: project.color || 'lime',
              investigation_answers: nextInvestigations[project.id],
              interpretation_notes: nextInterpretations[project.id],
              direction_notes: nextDirections[project.id],
            })),
            { onConflict: 'id' },
          )
          if (cancelled) return
          if (localMigrationError) {
            // Show the account's cloud data even when migrating browser-only projects fails.
            // Keep local-only projects in browser storage for a later retry.
            setProjects(nextProjects)
            setInvestigations(Object.fromEntries(rows.map(row => [row.id, Array.isArray(row.investigation_answers) ? row.investigation_answers : []])))
            setInterpretationNotes(Object.fromEntries(rows.map(row => [row.id, row.interpretation_notes || ''])))
            setDirectionNotes(Object.fromEntries(rows.map(row => [row.id, row.direction_notes || { opportunity: '', tension: '', distinction: '', validation: '' }])) as Record<string, DirectionDraft>)
            setCloudError('Alguns projetos deste navegador ainda não foram transferidos. Os dados locais foram mantidos; os projetos da conta estão exibidos. Verifique a conexão e tente novamente.')
            setCloudReady(true)
            return
          }
        }
        const allProjects = [...nextProjects, ...migratedLocal]
        setProjects(allProjects); setInvestigations(nextInvestigations)
        setInterpretationNotes(nextInterpretations); setDirectionNotes(nextDirections)
        try {
          localStorage.setItem('brandsmith.projects', JSON.stringify(allProjects))
          localStorage.setItem('brandsmith.investigations', JSON.stringify(nextInvestigations))
          localStorage.setItem('brandsmith.interpretations', JSON.stringify(nextInterpretations))
          localStorage.setItem('brandsmith.directions', JSON.stringify(nextDirections))
        } catch {
          setNotice('Os projetos foram carregados da conta, mas não foi possível atualizar a cópia deste navegador.')
        }
      } else {
        // First cloud login: migrate this browser's existing projects and related notes.
        const localProjects = (() => { try { return JSON.parse(localStorage.getItem('brandsmith.projects') || 'null') as Project[] | null } catch { return null } })()
        const localInvestigations = (() => { try { return JSON.parse(localStorage.getItem('brandsmith.investigations') || '{}') as Record<string, string[]> } catch { return {} } })()
        const localInterpretations = (() => { try { return JSON.parse(localStorage.getItem('brandsmith.interpretations') || '{}') as Record<string, string> } catch { return {} } })()
        const localDirections = (() => { try { return JSON.parse(localStorage.getItem('brandsmith.directions') || '{}') as Record<string, DirectionDraft> } catch { return {} } })()
        const sourceProjects = Array.isArray(localProjects) ? localProjects : []
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
          try {
            localStorage.setItem('brandsmith.projects', JSON.stringify(migrated))
            localStorage.setItem('brandsmith.investigations', JSON.stringify(answers))
            localStorage.setItem('brandsmith.interpretations', JSON.stringify(interpretations))
            localStorage.setItem('brandsmith.directions', JSON.stringify(directions))
            setNotice('Projetos e registros deste navegador foram transferidos para sua conta.')
          } catch {
            setNotice('Os projetos foram transferidos para sua conta, mas o navegador não conseguiu atualizar a cópia local. Confira o espaço disponível no armazenamento deste navegador.')
          }
        }
      }
      if (!cancelled) setCloudReady(true)
    }
    void loadCloudProjects()
    return () => { cancelled = true }
  // Load once per authenticated account; subsequent changes are handled by the sync effect below.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, loadAttempt])

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
      if (cancelled) return
      if (error) {
        setSyncError('A sincronização falhou. As alterações locais continuam disponíveis, mas ainda não foram confirmadas na nuvem. Verifique a conexão e tente novamente.')
      } else {
        setSyncError('')
      }
    }, 500)
    return () => { cancelled = true; window.clearTimeout(timer) }
  }, [userId, cloudReady, cloudError, syncAttempt, projects, investigations, interpretationNotes, directionNotes])

  const filteredProjects = useMemo(
    () => projects.filter((project) => project.name.toLowerCase().includes(search.toLowerCase()) || project.category.toLowerCase().includes(search.toLowerCase())),
    [projects, search],
  )

  function saveProjects(next: Project[]): boolean {
    try {
      localStorage.setItem('brandsmith.projects', JSON.stringify(next))
    } catch {
      setNotice('Não foi possível salvar o projeto neste navegador. Libere espaço ou habilite o armazenamento e tente novamente.')
      return false
    }
    setProjects(next)
    return true
  }

  function saveExpressionChanges(
    projectId: string,
    stage: 'Expressão em elaboração' | 'Expressão para revisar' | 'Expressão aprovada',
    nextDirections: Record<string, DirectionDraft>,
  ): boolean {
    const nextProjects = projects.map(project =>
      project.id === projectId ? { ...project, stage, updated: 'Atualizado agora' } : project,
    )
    const keys = ['brandsmith.directions', 'brandsmith.projects']
    const previous = new Map(keys.map(key => [key, localStorage.getItem(key)]))
    try {
      localStorage.setItem('brandsmith.directions', JSON.stringify(nextDirections))
      localStorage.setItem('brandsmith.projects', JSON.stringify(nextProjects))
    } catch {
      for (const key of keys) {
        try {
          const value = previous.get(key)
          if (value == null) localStorage.removeItem(key)
          else localStorage.setItem(key, value)
        } catch { /* Keep the original save error visible even if rollback is blocked. */ }
      }
      setNotice('Não foi possível salvar a expressão e a etapa neste navegador. Nenhuma alteração foi confirmada. Libere espaço ou habilite o armazenamento e tente novamente.')
      return false
    }
    setDirectionNotes(nextDirections)
    setProjects(nextProjects)
    return true
  }

  function createProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = projectName.trim()
    if (!name) return
    const project: Project = {
      id: crypto.randomUUID(),
      name,
      category: category.trim() || 'A definir',
      stage: 'Ponto de partida',
      updated: 'Criado agora',
      color: 'lime',
    }
    if (!saveProjects([project, ...projects])) return
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
      '## 4. Expressão da marca em exploração',
      '',
      '### Promessa da marca',
      direction.brandPromise?.trim() || '_Ainda não registrada._',
      '',
      '### Personalidade',
      direction.personality?.trim() || '_Ainda não registrada._',
      '',
      '### Princípios de voz',
      direction.voicePrinciples?.trim() || '_Ainda não registrados._',
      '',
      '### Território visual',
      direction.visualTerritory?.trim() || '_Ainda não registrado._',
      '',
      '### O que evitar',
      direction.avoidances?.trim() || '_Ainda não registrado._',
      '',
      '### Critério de validação da expressão',
      direction.expressionValidation?.trim() || '_Ainda não registrado._',
      '',
      '### Estado da expressão',
      project.stage === 'Expressão aprovada' ? 'Expressão aprovada explicitamente no Brandsmith.' : 'Expressão ainda não aprovada como decisão final.',
      '',
      '## Limites desta síntese',
      '- A organização das respostas não comprova a veracidade das afirmações.',
      '- Hipóteses continuam sendo hipóteses até serem verificadas.',
      '- Este documento não representa uma estratégia final aprovada, a menos que isso tenha sido explicitamente decidido fora deste fluxo.',
      '',
      '---',
      'Gerado pelo BRANDSMITH — O óbvio não cria marcas extraordinárias.',
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' })
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
      const validRecord = (value: unknown): value is Record<string, unknown> =>
        value !== null && typeof value === 'object' && !Array.isArray(value)
      const validProjects = backup.projects.every((item) => item && validRecord(item) &&
        typeof item.id === 'string' && item.id.trim().length > 0 &&
        typeof item.name === 'string' && item.name.trim().length > 0 &&
        item.name.length <= 200 &&
        typeof item.category === 'string' &&
        typeof item.stage === 'string' &&
        (item.color === undefined || typeof item.color === 'string'))
      const projectIds = validProjects
        ? backup.projects.map(item => (item as Record<string, unknown>).id as string)
        : []
      const uniqueProjectIds = new Set(projectIds).size === projectIds.length
      const validInvestigations = validRecord(backup.investigations) &&
        Object.values(backup.investigations).every(value => Array.isArray(value) && value.every(answer => typeof answer === 'string'))
      const validInterpretations = validRecord(backup.interpretations) &&
        Object.values(backup.interpretations).every(value => typeof value === 'string')
      const directionFields = ['opportunity', 'tension', 'distinction', 'validation', 'brandPromise', 'personality', 'voicePrinciples', 'visualTerritory', 'avoidances', 'expressionValidation', 'expressionApproved']
      const validDirections = validRecord(backup.directions) &&
        Object.values(backup.directions).every(value => validRecord(value) &&
          Object.entries(value).every(([key, field]) => directionFields.includes(key) &&
            (key === 'expressionApproved' ? typeof field === 'boolean' : typeof field === 'string')))
      const relatedIds = [
        ...Object.keys(validRecord(backup.investigations) ? backup.investigations : {}),
        ...Object.keys(validRecord(backup.interpretations) ? backup.interpretations : {}),
        ...Object.keys(validRecord(backup.directions) ? backup.directions : {}),
      ]
      const allRelatedIdsExist = relatedIds.every(id => projectIds.includes(id))
      if (!validProjects || !uniqueProjectIds || !validInvestigations || !validInterpretations ||
        !validDirections || !allRelatedIdsExist) {
        throw new Error('O backup está incompleto ou contém dados inconsistentes. Nenhum dado foi alterado.')
      }
      if (!window.confirm('Importar este backup substituirá os projetos e dados salvos neste navegador. Exporte um backup atual antes de continuar, se quiser preservá-lo. Deseja continuar?')) return
      const sourceProjects = backup.projects as Project[]
      const sourceInvestigations = backup.investigations as Record<string, string[]>
      const sourceInterpretations = backup.interpretations as Record<string, string>
      const sourceDirections = backup.directions as Record<string, DirectionDraft>
      const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
      const idMap = new Map(sourceProjects.map(project => [project.id, isUuid(project.id) ? project.id : crypto.randomUUID()]))
      const nextProjects = sourceProjects.map(project => ({ ...project, id: idMap.get(project.id)! }))
      const remapRecords = <T,>(records: Record<string, T>): Record<string, T> =>
        Object.fromEntries(Object.entries(records).map(([id, value]) => [idMap.get(id) || id, value]))
      const nextInvestigations = remapRecords(sourceInvestigations)
      const nextInterpretations = remapRecords(sourceInterpretations)
      const nextDirections = remapRecords(sourceDirections)
      let restoredProjects = nextProjects
      let restoredInvestigations = nextInvestigations
      let restoredInterpretations = nextInterpretations
      let restoredDirections = nextDirections

      // Snapshot local values so a failed cloud restore can roll back local writes.
      const localKeys = ['brandsmith.projects', 'brandsmith.investigations', 'brandsmith.interpretations', 'brandsmith.directions']
      const localSnapshot = new Map(localKeys.map(key => [key, localStorage.getItem(key)]))

      // For signed-in users, merge the backup with cloud projects rather than
      // letting old cloud rows reappear on the next login after a local restore.
      if (userId && supabase) {
        const { data: cloudRows, error: cloudLoadError } = await supabase
          .from('brand_projects')
          .select('id,name,category,stage,color,investigation_answers,interpretation_notes,direction_notes,updated_at')
          .eq('owner_id', userId)
        if (cloudLoadError) throw new Error('Não foi possível conferir os projetos da conta. Nenhum dado foi restaurado; tente novamente.')
        const cloudProjects = (cloudRows || []) as CloudProject[]
        const hasLegacyProjectIds = sourceProjects.some(project => !isUuid(project.id))
        if (hasLegacyProjectIds && cloudProjects.length > 0 &&
          !window.confirm('Este backup contém IDs antigos de projetos e sua conta já tem projetos salvos na nuvem. Não é possível identificar com segurança quais projetos são equivalentes; restaurar pode criar duplicatas. Nenhum projeto da nuvem será apagado. Se não tiver certeza, cancele e exporte um backup atualizado da conta. Deseja continuar mesmo assim?')) return
        const backupIds = new Set(nextProjects.map(project => project.id))
        const existingCloudProjects: Project[] = cloudProjects
          .filter(row => !backupIds.has(row.id))
          .map(row => ({ id: row.id, name: row.name, category: row.category, stage: row.stage, color: row.color || 'lime', updated: 'Salvo na nuvem' }))
        restoredProjects = [...nextProjects, ...existingCloudProjects]
        restoredInvestigations = { ...Object.fromEntries(cloudProjects.filter(row => !backupIds.has(row.id)).map(row => [row.id, Array.isArray(row.investigation_answers) ? row.investigation_answers : []])), ...nextInvestigations }
        restoredInterpretations = { ...Object.fromEntries(cloudProjects.filter(row => !backupIds.has(row.id)).map(row => [row.id, row.interpretation_notes || ''])), ...nextInterpretations }
        restoredDirections = { ...Object.fromEntries(cloudProjects.filter(row => !backupIds.has(row.id)).map(row => [row.id, row.direction_notes || { opportunity: '', tension: '', distinction: '', validation: '' }])), ...nextDirections }

      }

      // Write local records first. If storage fails, the cloud remains untouched.
      try {
        localStorage.setItem('brandsmith.projects', JSON.stringify(restoredProjects))
        localStorage.setItem('brandsmith.investigations', JSON.stringify(restoredInvestigations))
        localStorage.setItem('brandsmith.interpretations', JSON.stringify(restoredInterpretations))
        localStorage.setItem('brandsmith.directions', JSON.stringify(restoredDirections))
      } catch {
        localKeys.forEach(key => {
          const previous = localSnapshot.get(key)
          try {
            if (previous === null || previous === undefined) localStorage.removeItem(key)
            else localStorage.setItem(key, previous)
          } catch { /* Best-effort rollback when browser storage is unavailable. */ }
        })
        throw new Error('Não foi possível gravar o backup neste navegador. A conta na nuvem não foi alterada; libere espaço e tente novamente.')
      }

      // Only mutate cloud after local storage has accepted the backup. Roll back
      // the local snapshot if the cloud rejects the restore.
      if (userId && supabase) {
        const { error: cloudSaveError } = await supabase.from('brand_projects').upsert(
          nextProjects.map(project => ({
            id: project.id, owner_id: userId, name: project.name, category: project.category,
            stage: project.stage, color: project.color || 'lime',
            investigation_answers: nextInvestigations[project.id] || [],
            interpretation_notes: nextInterpretations[project.id] || '',
            direction_notes: nextDirections[project.id] || { opportunity: '', tension: '', distinction: '', validation: '' },
          })),
          { onConflict: 'id' },
        )
        if (cloudSaveError) {
          localKeys.forEach(key => {
            const previous = localSnapshot.get(key)
            try {
              if (previous === null || previous === undefined) localStorage.removeItem(key)
              else localStorage.setItem(key, previous)
            } catch { /* Best-effort rollback if storage is unavailable. */ }
          })
          throw new Error('Não foi possível restaurar o backup na conta. Os dados locais anteriores foram preservados; tente novamente.')
        }
      }
      setProjects(restoredProjects)
      setInvestigations(restoredInvestigations)
      setInterpretationNotes(restoredInterpretations)
      setDirectionNotes(restoredDirections)
      setSelectedProject(null)
      setActiveNav('Projetos')
      setNotice(userId && supabase
        ? 'Backup restaurado e combinado com os projetos que já estavam na conta. Nenhum projeto antigo foi apagado.'
        : 'Backup importado. Os projetos e registros foram restaurados neste navegador.')
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

        {cloudError && <div className="notice-inline" role="status">{cloudError} <button className="secondary-button" onClick={() => { setCloudReady(false); setCloudError(''); setLoadAttempt(attempt => attempt + 1) }}>Tentar carregar novamente</button></div>}
        {syncError && <div className="notice-inline" role="status">{syncError} <button className="secondary-button" onClick={() => { setSyncError(''); setSyncAttempt(attempt => attempt + 1) }}>Tentar sincronizar novamente</button></div>}
        <div className="page-content">
          {activeProject ? (
            <section className="project-detail">
              <button className="back-link" onClick={() => setSelectedProject(null)}>← Voltar para projetos</button>
              <div className="eyebrow"><span className="eyebrow-line" />PROJETO / PONTO DE PARTIDA</div>
              <div className="detail-heading"><div><h1>{activeProject.name}<span className="lime-period">.</span></h1><p className="lead">{activeProject.category}</p></div><span className="stage-pill"><span />{activeProject.stage}</span></div>
              <div className="detail-callout"><div className="callout-icon"><Sparkles size={21} /></div><div><span className="mini-label">ANTES DE CRIAR, VAMOS ENTENDER</span><h2>O que torna essa marca necessária?</h2><p>Uma marca forte começa com perguntas melhores, não com soluções visuais apressadas. A investigação vai revelar o contexto, as tensões e as oportunidades que merecem ser exploradas.</p><button className="primary-button" onClick={() => { setInvestigationProject(activeProject.id); setQuestionIndex((investigations[activeProject.id] || []).length >= investigationQuestions.length ? investigationQuestions.length : (investigations[activeProject.id] || []).length); setCurrentAnswer((investigations[activeProject.id] || []).length >= investigationQuestions.length ? '' : (investigations[activeProject.id] || [])[(investigations[activeProject.id] || []).length] || '') }} >Começar investigação <ArrowRight size={16} /></button></div></div>
              {(investigations[activeProject.id]?.length || 0) >= 6 && <div className="interpretation-entry"><div><span className="mini-label">PRÓXIMA ETAPA</span><h3>Separar o que sabemos do que ainda precisamos descobrir.</h3><p>Organize evidências, preferências e hipóteses antes de formular uma direção estratégica.</p></div><button className="secondary-button" onClick={() => { setInterpretationProject(activeProject.id); setDraftInterpretation(interpretationNotes[activeProject.id] || '') }}>Interpretar investigação <ArrowRight size={15} /></button></div>}
              {activeProject.stage === 'Interpretação validada' && <div className="interpretation-entry direction-entry"><div><span className="mini-label">ETAPA 03 · DIRECIONAR</span><h3>Que caminho estratégico merece ser explorado?</h3><p>Registre uma oportunidade, a tensão que a marca precisa resolver e uma hipótese de diferenciação. Nada será definido automaticamente.</p></div><button className="primary-button" onClick={() => { setDirectionProject(activeProject.id); setDraftDirection(directionNotes[activeProject.id] || emptyDirection) }}>Construir direção <ArrowRight size={15} /></button></div>}
              {['Direção em elaboração', 'Direção para revisar', 'Expressão em elaboração', 'Expressão para revisar', 'Expressão aprovada'].includes(activeProject.stage) && <div className="interpretation-entry expression-entry"><div><span className="mini-label">ETAPA 04 · EXPRESSAR</span><h3>Como a direção pode ganhar voz e forma?</h3><p>Organize promessa, personalidade, linguagem e território visual como hipóteses para revisar. O BRANDSMITH ainda não gera uma identidade automaticamente.</p></div><button className="primary-button" onClick={() => { setExpressionProject(activeProject.id); setDraftExpression({ ...emptyExpression, ...directionNotes[activeProject.id] }) }}>Explorar expressão <ArrowRight size={15} /></button></div>}
              {['Expressão para revisar', 'Expressão aprovada'].includes(activeProject.stage) && (() => {
                const expression = directionNotes[activeProject.id] || emptyDirection
                const fields = [
                  ['Promessa da marca', expression.brandPromise],
                  ['Personalidade', expression.personality],
                  ['Princípios de voz', expression.voicePrinciples],
                  ['Território visual', expression.visualTerritory],
                  ['O que evitar', expression.avoidances],
                  ['Critérios de validação', expression.expressionValidation],
                ] as const
                return <section className="interpretation-entry expression-review" aria-labelledby="expression-review-title">
                  <div className="eyebrow"><span className="eyebrow-line" />ETAPA 04 · REVISÃO</div>
                  <h3 id="expression-review-title">{activeProject.stage === 'Expressão aprovada' ? 'Expressão aprovada por você' : 'Revise a expressão antes de aprovar'}</h3>
                  <p>{activeProject.stage === 'Expressão aprovada' ? 'Esta versão foi explicitamente aprovada. Você ainda pode reabrir e editar a expressão se a direção mudar.' : 'Leia cada dimensão e confirme se ela representa a direção que você quer explorar. Campos vazios continuam identificados como não definidos.'}</p>
                  <div className="expression-review-grid">{fields.map(([label, value]) => <article key={label} className="expression-review-item"><span className="mini-label">{label}</span><p>{value?.trim() || 'Ainda não definido.'}</p></article>)}</div>
                  <div className="investigation-actions">
                    <button className="secondary-button" onClick={() => { setExpressionProject(activeProject.id); setDraftExpression({ ...emptyExpression, ...expression }) }}>Editar expressão</button>
                    {activeProject.stage === 'Expressão para revisar' && <button className="primary-button" onClick={() => {
                      const current = directionNotes[activeProject.id] || emptyDirection
                      if (!Object.values(current).some(value => typeof value === 'string' && value.trim())) {
                        setNotice('Registre pelo menos uma dimensão da expressão antes de aprová-la.')
                        return
                      }
                      const nextDirections = { ...directionNotes, [activeProject.id]: { ...current, expressionApproved: true } }
                      if (!saveExpressionChanges(activeProject.id, 'Expressão aprovada', nextDirections)) return
                      setNotice('Expressão aprovada e salva no projeto. Isso registra sua decisão, mas não gera automaticamente uma identidade visual.')
                    }}>Aprovar expressão <Check size={16} /></button>}
                    {activeProject.stage === 'Expressão aprovada' && <span className="stage-state"><Check size={14} /> Aprovação registrada</span>}
                  </div>
                </section>
              })()}
              <div className="export-brief-row"><div><span className="mini-label">SEU TRABALHO, FORA DO APP</span><p>Exporte as respostas, notas e hipóteses reunidas em um dossiê editável.</p></div><button className="secondary-button" onClick={() => exportProjectBrief(activeProject)}><FileText size={16} /> Exportar dossiê (.md)</button></div>
              <div className="section-heading"><div><span className="mini-label">O PROCESSO</span><h2>Um caminho, não uma fórmula.</h2></div><span className="section-aside">04 ETAPAS · VOCÊ VALIDA CADA UMA</span></div>
              <div className="stage-list">{stages.map((stage, index) => { const Icon = stage.icon; const currentStageIndex = ['Ponto de partida', 'Investigação para revisar'].includes(activeProject.stage) ? 0 : activeProject.stage === 'Investigação concluída' ? 1 : ['Interpretação em revisão', 'Interpretação validada'].includes(activeProject.stage) ? 2 : ['Direção em elaboração', 'Direção para revisar'].includes(activeProject.stage) ? 2 : ['Expressão em elaboração', 'Expressão para revisar', 'Expressão aprovada'].includes(activeProject.stage) ? 3 : 0; const isCurrentStage = index === currentStageIndex; const isReviewStage = isCurrentStage && activeProject.stage.endsWith('para revisar'); const stageState = index < currentStageIndex ? 'Concluída' : index > currentStageIndex ? 'Aguardando' : isReviewStage ? 'Para revisar' : activeProject.stage === 'Ponto de partida' ? 'Próxima etapa' : 'Em andamento'; return <div className="stage-row" key={stage.number}><span className="stage-number">{stage.number}</span><div className="stage-icon"><Icon size={18} /></div><div className="stage-copy"><h3>{stage.name}</h3><p>{stage.detail}</p></div><span className="stage-state">{stageState}</span><ArrowDownRight className="stage-arrow" size={17} /></div> })}</div>
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
                      <div className="project-art"><span className="art-grid" /><span className="art-word">{project.name.split(' ').slice(0, 2).join(' ').toUpperCase()}<span>.</span></span><span className="art-mark">✳</span></div>
                      <div className="project-card-bottom"><div><h3>{project.name}</h3><p>{project.stage}</p></div><span className="card-open"><ArrowRight size={17} /></span></div>
                      <div className="card-progress"><span style={{ width: ({ 'Ponto de partida': '5%', 'Investigação para revisar': '20%', 'Investigação concluída': '25%', 'Interpretação em revisão': '45%', 'Interpretação validada': '50%', 'Direção em elaboração': '65%', 'Direção para revisar': '75%', 'Expressão em elaboração': '85%', 'Expressão para revisar': '95%' } as Record<string, string>)[project.stage] || '5%' }} /></div>
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
      {expressionProject && <div className="modal-backdrop investigation-backdrop"><section className="investigation-modal expression-modal" role="dialog" aria-modal="true" aria-labelledby="expression-title"><div className="investigation-top"><span className="mini-label">ETAPA 04 · EXPRESSAR</span><button className="icon-button" onClick={() => setExpressionProject(null)} aria-label="Fechar expressão"><X size={18} /></button></div><div className="eyebrow"><span className="eyebrow-line" />TRADUZIR A DIREÇÃO SEM PULAR A VALIDAÇÃO</div><h2 id="expression-title">Que forma essa marca pode assumir<span className="lime-period">?</span></h2><p className="investigation-prompt">Use a direção estratégica como ponto de partida. Registre possibilidades; não é uma geração automática nem uma identidade final.</p><div className="expression-fields">
<label htmlFor="expression-promise">01 · PROMESSA DA MARCA<textarea id="expression-promise" rows={3} value={draftExpression.brandPromise} onChange={e => setDraftExpression({ ...draftExpression, brandPromise: e.target.value })} placeholder="Que valor a marca quer entregar, de forma relevante e crível?" /></label>
<label htmlFor="expression-personality">02 · PERSONALIDADE<textarea id="expression-personality" rows={3} value={draftExpression.personality} onChange={e => setDraftExpression({ ...draftExpression, personality: e.target.value })} placeholder="Se a marca fosse uma presença, como se comportaria? Que traços não combinam?" /></label>
<label htmlFor="expression-voice">03 · PRINCÍPIOS DE VOZ<textarea id="expression-voice" rows={3} value={draftExpression.voicePrinciples} onChange={e => setDraftExpression({ ...draftExpression, voicePrinciples: e.target.value })} placeholder="Como fala, que palavras privilegia e que tom evita?" /></label>
<label htmlFor="expression-visual">04 · TERRITÓRIO VISUAL<textarea id="expression-visual" rows={3} value={draftExpression.visualTerritory} onChange={e => setDraftExpression({ ...draftExpression, visualTerritory: e.target.value })} placeholder="Que referências, contrastes, materiais, cores ou formas merecem exploração?" /></label>
<label htmlFor="expression-avoid">05 · O QUE EVITAR<textarea id="expression-avoid" rows={3} value={draftExpression.avoidances} onChange={e => setDraftExpression({ ...draftExpression, avoidances: e.target.value })} placeholder="Liste clichês, códigos genéricos e escolhas que contradizem a direção." /></label>
<label htmlFor="expression-validation">06 · COMO VALIDAR<textarea id="expression-validation" rows={3} value={draftExpression.expressionValidation} onChange={e => setDraftExpression({ ...draftExpression, expressionValidation: e.target.value })} placeholder="Que critérios ou pessoas ajudarão a avaliar se essa expressão faz sentido?" /></label>
</div><div className="investigation-actions"><button className="secondary-button" onClick={() => setExpressionProject(null)}>Cancelar</button><button className="secondary-button" onClick={() => { const current = directionNotes[expressionProject] || emptyDirection; const nextDirections = { ...directionNotes, [expressionProject]: { ...current, ...draftExpression, expressionApproved: false } }; if (!saveExpressionChanges(expressionProject, 'Expressão em elaboração', nextDirections)) return; setExpressionProject(null); setNotice('Rascunho de expressão salvo. Ele continua sujeito à sua revisão.') }}><Check size={15} /> Salvar rascunho</button><button className="primary-button" onClick={() => { if (!Object.values(draftExpression).some(value => value.trim())) { setNotice('Preencha pelo menos um campo da expressão antes de enviar para revisão.'); return } const current = directionNotes[expressionProject] || emptyDirection; const nextDirections = { ...directionNotes, [expressionProject]: { ...current, ...draftExpression, expressionApproved: false } }; if (!saveExpressionChanges(expressionProject, 'Expressão para revisar', nextDirections)) return; setExpressionProject(null); setNotice('Expressão salva no projeto e marcada como “Expressão para revisar”. Isso não envia o material a outra pessoa nem gera uma identidade final.') }}>Enviar para revisão <ArrowRight size={15} /></button></div></section></div>}
      {directionProject && <div className="modal-backdrop investigation-backdrop"><section className="investigation-modal direction-modal" role="dialog" aria-modal="true" aria-labelledby="direction-title"><div className="investigation-top"><span className="mini-label">ETAPA 03 · DIRECIONAR</span><button className="icon-button" onClick={() => setDirectionProject(null)} aria-label="Fechar direção"><X size={18} /></button></div><div className="eyebrow"><span className="eyebrow-line" />UMA DIREÇÃO É UMA HIPÓTESE, NÃO UM SLOGAN</div><h2 id="direction-title">Que caminho vale a pena explorar<span className="lime-period">?</span></h2><p className="investigation-prompt">Use a interpretação validada como ponto de partida. Registre possibilidades que possam ser discutidas e testadas — não precisa chegar a uma resposta definitiva.</p><div className="direction-fields"><label htmlFor="direction-opportunity">01 · OPORTUNIDADE RELEVANTE<textarea id="direction-opportunity" rows={3} value={draftDirection.opportunity} onChange={e => setDraftDirection({ ...draftDirection, opportunity: e.target.value })} placeholder="Que necessidade ou possibilidade parece merecer atenção?" /></label><label htmlFor="direction-tension">02 · TENSÃO A RESOLVER<textarea id="direction-tension" rows={3} value={draftDirection.tension} onChange={e => setDraftDirection({ ...draftDirection, tension: e.target.value })} placeholder="Que conflito, expectativa ou barreira a marca precisa enfrentar?" /></label><label htmlFor="direction-distinction">03 · HIPÓTESE DE DIFERENCIAÇÃO<textarea id="direction-distinction" rows={3} value={draftDirection.distinction} onChange={e => setDraftDirection({ ...draftDirection, distinction: e.target.value })} placeholder="O que poderia tornar esta proposta relevante de um jeito próprio?" /></label><label htmlFor="direction-validation">04 · O QUE PRECISA SER VALIDADO<textarea id="direction-validation" rows={3} value={draftDirection.validation} onChange={e => setDraftDirection({ ...draftDirection, validation: e.target.value })} placeholder="Que evidência, conversa ou experimento ajudaria a avaliar essa hipótese?" /></label></div><div className="investigation-actions"><button className="secondary-button" onClick={() => setDirectionProject(null)}>Voltar depois</button><button className="secondary-button" onClick={() => { const next = { ...directionNotes, [directionProject]: draftDirection }; const previous = localStorage.getItem('brandsmith.directions'); try { localStorage.setItem('brandsmith.directions', JSON.stringify(next)) } catch { setNotice('Não foi possível salvar a direção neste navegador.'); return } const updated = projects.map(p => p.id === directionProject ? { ...p, stage: 'Direção em elaboração', updated: 'Rascunho estratégico salvo' } : p); if (!saveProjects(updated)) { try { if (previous === null) localStorage.removeItem('brandsmith.directions'); else localStorage.setItem('brandsmith.directions', previous) } catch { /* Best-effort rollback. */ } return } setDirectionNotes(next); setDirectionProject(null); setNotice('Rascunho estratégico salvo. A direção ainda não foi validada.') }}>Salvar rascunho</button><button className="primary-button" onClick={() => { if (![draftDirection.opportunity, draftDirection.tension, draftDirection.distinction, draftDirection.validation].some(value => value.trim())) { setNotice('Registre pelo menos uma hipótese antes de validar.'); return } const next = { ...directionNotes, [directionProject]: draftDirection }; const previous = localStorage.getItem('brandsmith.directions'); try { localStorage.setItem('brandsmith.directions', JSON.stringify(next)) } catch { setNotice('Não foi possível salvar a direção neste navegador.'); return } const updated = projects.map(p => p.id === directionProject ? { ...p, stage: 'Direção para revisar', updated: 'Rascunho de direção criado' } : p); if (!saveProjects(updated)) { try { if (previous === null) localStorage.removeItem('brandsmith.directions'); else localStorage.setItem('brandsmith.directions', previous) } catch { /* Best-effort rollback. */ } return } setDirectionNotes(next); setDirectionProject(null); setNotice('Direção registrada para sua revisão. Ela ainda não está aprovada como estratégia final.') }}>Registrar direção <Check size={16} /></button></div><p className="investigation-footnote"><Check size={14} />Registrar uma direção não equivale a aprovar uma estratégia definitiva.</p></section></div>}
      {interpretationProject && <div className="modal-backdrop investigation-backdrop"><section className="investigation-modal interpretation-modal" role="dialog" aria-modal="true" aria-labelledby="interpretation-title"><div className="investigation-top"><span className="mini-label">ETAPA 02 · INTERPRETAR</span><button className="icon-button" onClick={() => setInterpretationProject(null)} aria-label="Fechar interpretação"><X size={18} /></button></div><div className="eyebrow"><span className="eyebrow-line" />ORGANIZAR NÃO É CONCLUIR</div><h2 id="interpretation-title">O que é evidência, preferência ou hipótese<span className="lime-period">?</span></h2><p className="investigation-prompt">A classificação inicial se baseia na pergunta em que cada resposta foi registrada; ela não verifica se a afirmação é verdadeira. Revise as notas e identifique o que ainda precisa ser investigado.</p><div className="interpretation-groups"><article><span className="interpretation-tag evidence">01 · EVIDÊNCIAS E CONTEXTO</span><p>{investigations[interpretationProject]?.[0] || "Contexto ainda não informado."}</p><small>O contexto é relato do projeto; evidências verificáveis ainda precisam ser identificadas.</small><p>{investigations[interpretationProject]?.[3] || "Nenhuma evidência ou observação descrita."}</p></article><article><span className="interpretation-tag preference">02 · PREFERÊNCIAS DECLARADAS</span><p>{investigations[interpretationProject]?.[4] || "Nenhuma preferência declarada."}</p><small>Preferências orientam escolhas, mas não comprovam necessidades do público.</small></article><article><span className="interpretation-tag hypothesis">03 · HIPÓTESES A VERIFICAR</span><p>{investigations[interpretationProject]?.[1] || "Motivação ainda não descrita."}</p><p>{investigations[interpretationProject]?.[2] || "Público e contexto de uso ainda não descritos."}</p><p>{investigations[interpretationProject]?.[5] || "Nenhuma hipótese explicitada."}</p><small>Motivação e público são questões a investigar, não fatos confirmados.</small></article></div><label className="answer-label" htmlFor="interpretation-notes">DÚVIDAS, CONTRADIÇÕES E PONTOS A VERIFICAR</label><textarea id="interpretation-notes" rows={4} value={draftInterpretation} onChange={e => setDraftInterpretation(e.target.value)} placeholder="O que não está claro? Que afirmações precisam de evidência? Há respostas que entram em conflito?" /><div className="investigation-actions"><button className="secondary-button" onClick={() => setInterpretationProject(null)}>Voltar depois</button><button className="secondary-button" onClick={() => { const next = { ...interpretationNotes, [interpretationProject]: draftInterpretation }; const previous = localStorage.getItem("brandsmith.interpretations"); try { localStorage.setItem("brandsmith.interpretations", JSON.stringify(next)) } catch { setNotice("Não foi possível salvar a interpretação neste navegador."); return } const updated = projects.map(p => p.id === interpretationProject ? { ...p, stage: "Interpretação em revisão", updated: "Interpretação salva" } : p); if (!saveProjects(updated)) { try { if (previous === null) localStorage.removeItem("brandsmith.interpretations"); else localStorage.setItem("brandsmith.interpretations", previous) } catch { /* Best-effort rollback. */ } return } setInterpretationNotes(next); setInterpretationProject(null); setNotice("Rascunho salvo. A interpretação continua pendente de validação.") }}>Salvar rascunho</button><button className="primary-button" onClick={() => { const next = { ...interpretationNotes, [interpretationProject]: draftInterpretation }; const previous = localStorage.getItem("brandsmith.interpretations"); try { localStorage.setItem("brandsmith.interpretations", JSON.stringify(next)) } catch { setNotice("Não foi possível salvar a interpretação neste navegador."); return } const updated = projects.map(p => p.id === interpretationProject ? { ...p, stage: "Interpretação validada", updated: "Etapa 02 validada" } : p); if (!saveProjects(updated)) { try { if (previous === null) localStorage.removeItem("brandsmith.interpretations"); else localStorage.setItem("brandsmith.interpretations", previous) } catch { /* Best-effort rollback. */ } return } setInterpretationNotes(next); setInterpretationProject(null); setNotice("Interpretação validada por você. As hipóteses continuam identificadas como hipóteses.") }}>Validar interpretação <Check size={16} /></button></div><p className="investigation-footnote"><Check size={14} />A interpretação fica provisória até ser revisada por você.</p></section></div>}
      {investigationProject && <div className="modal-backdrop investigation-backdrop"><section className="investigation-modal" role="dialog" aria-modal="true" aria-labelledby="investigation-title"><div className="investigation-top"><span className="mini-label">INVESTIGAÇÃO ADAPTATIVA · {String(Math.min(questionIndex + 1, investigationQuestions.length)).padStart(2, '0')} / 06</span><button className="icon-button" onClick={() => setInvestigationProject(null)} aria-label="Fechar investigação"><X size={18} /></button></div><div className="investigation-progress">{investigationQuestions.map((item, i) => <span key={item.kind} className={i <= questionIndex ? 'done' : ''} />)}</div>{questionIndex < investigationQuestions.length ? <><div className="eyebrow"><span className="eyebrow-line" />VAMOS INVESTIGAR ANTES DE CONCLUIR</div><h2 id="investigation-title">{question.title}<span className="lime-period">.</span></h2><p className="investigation-prompt">{question.prompt}</p><label className="answer-label" htmlFor="investigation-answer">SUA RESPOSTA</label><textarea id="investigation-answer" autoFocus rows={5} value={currentAnswer} onChange={e => setCurrentAnswer(e.target.value)} placeholder="Escreva livremente. Não existe resposta certa nesta etapa..." /><div className="investigation-actions"><button className="secondary-button" onClick={() => { if (questionIndex > 0) { setQuestionIndex(questionIndex - 1); setCurrentAnswer(currentInvestigation[questionIndex - 1] || '') } else setInvestigationProject(null) }}>{questionIndex > 0 ? 'Voltar' : 'Sair'}</button><button className="primary-button" disabled={!currentAnswer.trim()} onClick={saveInvestigationAnswer}>{questionIndex === investigationQuestions.length - 1 ? 'Organizar síntese' : 'Continuar'} <ArrowRight size={16} /></button></div><p className="investigation-footnote"><Check size={14} />Você pode revisar suas respostas. Nenhuma decisão estratégica será tomada automaticamente.</p></> : <><div className="eyebrow"><span className="eyebrow-line" />PRIMEIRA LEITURA · PARA VALIDAR</div><h2 id="investigation-title">O que sabemos até aqui<span className="lime-period">.</span></h2><p className="investigation-prompt">Esta síntese organiza suas respostas por natureza. Ela não é uma estratégia final nem uma conclusão sobre o mercado.</p><div className="synthesis-list">{investigationQuestions.map((item, i) => <article className="synthesis-item" key={item.kind}><span>{String(i + 1).padStart(2, '0')} · {item.kind.toUpperCase()}</span><p>{(currentInvestigation[i] || 'Ainda não respondido.').trim()}</p></article>)}</div><div className="investigation-actions"><button className="secondary-button" onClick={() => { setQuestionIndex(5); setCurrentAnswer(currentInvestigation[5] || '') }}>Revisar última resposta</button><button className="primary-button" onClick={() => { setSummaryApproved({ ...summaryApproved, [investigationProject]: true }); const updated = projects.map(p => p.id === investigationProject ? { ...p, stage: 'Investigação para revisar', updated: 'Investigação concluída' } : p); if (!saveProjects(updated)) return; setInvestigationProject(null); setNotice('Síntese registrada para sua revisão. Ela ainda não define o posicionamento da marca.') }}>Validar esta organização <Check size={16} /></button></div><p className="investigation-footnote"><Check size={14} />Validar significa aprovar a organização das informações, não transformar hipóteses em fatos.</p></>}</section></div>}
      {showCreate && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowCreate(false) }}><section className="create-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-top"><span className="mini-label">NOVO PROJETO / 01</span><button className="icon-button" onClick={() => setShowCreate(false)} aria-label="Fechar"><X size={18} /></button></div><div className="modal-symbol">✳</div><h2 id="modal-title">Toda marca começa<br />com uma <em>boa pergunta.</em></h2><p>Vamos abrir um espaço para investigar o que essa ideia pode se tornar. Você não precisa ter todas as respostas agora.</p><form onSubmit={createProject}><label htmlFor="project-name">Como vamos chamar este projeto?</label><input id="project-name" autoFocus placeholder="Nome da marca ou do projeto" value={projectName} onChange={(event) => setProjectName(event.target.value)} required maxLength={80} /><label htmlFor="project-category">Em que universo ele existe? <span>OPCIONAL</span></label><input id="project-category" placeholder="Ex.: alimentação, tecnologia, cultura..." value={category} onChange={(event) => setCategory(event.target.value)} maxLength={100} /><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setShowCreate(false)}>Cancelar</button><button type="submit" className="primary-button">Criar espaço <ArrowRight size={16} /></button></div></form><div className="modal-footnote"><Check size={14} />Você mantém o controle das decisões em todas as etapas.</div></section></div>}
    </div>
  )
}

function ArrowUpRightIcon() {
  return <ArrowDownRight size={17} style={{ transform: 'rotate(-135deg)' }} />
}

export default Workspace
