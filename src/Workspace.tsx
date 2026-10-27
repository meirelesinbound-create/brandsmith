import { useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabase'
import { BrandMark } from './components/BrandMark'
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

type DirectionDraft = { opportunity: string; tension: string; distinction: string; validation: string; brandPromise?: string; personality?: string; voicePrinciples?: string; visualTerritory?: string; avoidances?: string; expressionValidation?: string; expressionApproved?: boolean; identityGenerated?: boolean }
type CloudProject = { id: string; name: string; category: string; stage: string; color: string; investigation_answers: string[]; interpretation_notes: string; direction_notes: DirectionDraft; updated_at?: string }


function exportIdentityLogoSvg(title: string, palette: { hex: string }[], _symbol: string) {
  const escapeXml = (value: string) => value.replace(/[&<>"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character] || character)
  const safeTitle = escapeXml(title).toUpperCase()
  const background = palette[0]?.hex || '#111111'
  const foreground = palette[1]?.hex || '#F2F0E9'
  const accent = palette[2]?.hex || '#D7FF38'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="420" viewBox="0 0 1200 420" role="img" aria-labelledby="title desc">
  <title id="title">${safeTitle} — proposta de identidade</title>
  <desc id="desc">Composição tipográfica BRANDSMITH inspirada na rota Ruptura Editorial: contraste forte, tipografia condensada e corte diagonal de acento.</desc>
  <rect width="1200" height="420" fill="${background}"/>
  <path d="M0 0H18V420H0Z" fill="${accent}"/>
  <text x="74" y="78" fill="${accent}" font-family="IBM Plex Mono,monospace" font-size="15" letter-spacing="3">BRANDSMITH / RUPTURA EDITORIAL</text>
  <text x="70" y="250" fill="${foreground}" font-family="Barlow Condensed,Impact,Arial Narrow,sans-serif" font-size="112" font-weight="800" letter-spacing="-3">${safeTitle}</text>
  <path d="M610 112H644L570 276H536Z" fill="${accent}"/>
  <path d="M74 290H1126" stroke="${foreground}" stroke-opacity=".24" stroke-width="1"/>
  <text x="74" y="344" fill="${foreground}" opacity=".82" font-family="IBM Plex Mono,monospace" font-size="18" letter-spacing="1.5">O ÓBVIO NÃO CRIA MARCAS EXTRAORDINÁRIAS.</text>
  <text x="1126" y="385" text-anchor="end" fill="${accent}" font-family="IBM Plex Mono,monospace" font-size="12">CONCEITO TIPOGRÁFICO / REVISE ANTES DE USO FINAL</text>
</svg>`
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const slug = title.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'marca'
  link.href = url
  link.download = `brandsmith-conceito-${slug}.svg`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}


function exportBrandGuide(title: string, category: string, identity: DirectionDraft, palette: { name: string; hex: string }[], typeTitle: string, symbol: string) {
  const clean = (value?: string) => (value || 'A definir na próxima revisão.').trim()
  const markdown = [
    `# Sistema de marca — ${title}`,
    '',
    `> Documento de trabalho gerado pelo BRANDSMITH. Status: proposta para revisão; não representa validação de mercado nem aprovação final.`,
    '',
    '## 01. Contexto',
    `- **Marca/projeto:** ${title}`,
    `- **Categoria:** ${category || 'Não informada'}`,
    `- **Símbolo provisório de estudo:** ${symbol}`,
    '',
    '## 02. Núcleo estratégico',
    `- **Promessa:** ${clean(identity.brandPromise)}`,
    `- **Personalidade:** ${clean(identity.personality)}`,
    `- **Princípios de voz:** ${clean(identity.voicePrinciples)}`,
    `- **Hipótese de diferenciação:** ${clean(identity.distinction)}`,
    `- **Oportunidade:** ${clean(identity.opportunity)}`,
    `- **Tensão a resolver:** ${clean(identity.tension)}`,
    '',
    '## 03. Sistema visual proposto',
    `- **Território visual:** ${clean(identity.visualTerritory)}`,
    `- **Direção tipográfica:** ${typeTitle}`,
    '',
    '| Cor | Função | HEX |',
    '|---|---|---|',
    ...palette.map((color, index) => `| ${color.name} | ${['Base e estrutura', 'Respiro e leitura', 'Acento e reconhecimento', 'Apoio e profundidade'][index] || 'Cor complementar'} | ${color.hex} |`),
    '',
    '## 04. Princípios de expressão',
    `- **O que evitar:** ${clean(identity.avoidances)}`,
    `- **Critérios de validação:** ${clean(identity.expressionValidation)}`,
    '',
    '## 05. Aplicação e validação',
    '- Teste a leitura da marca em tamanhos pequenos, fundos claros e escuros e em uma aplicação real do negócio.',
    '- Verifique contraste e legibilidade antes de publicar.',
    '- Compare a proposta com alternativas da categoria para identificar códigos visuais excessivamente comuns.',
    '- Registre feedback do público pretendido e ajuste o sistema antes de considerar a identidade final.',
    '',
    '## Limites desta versão',
    'Paleta, tipografia, símbolo e aplicações são hipóteses de direção visual. Este documento não comprova disponibilidade de marca, acessibilidade integral, pesquisa de concorrência ou validação com usuários.',
    '',
  ].join('\n')
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const slug = title.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'marca'
  link.href = url
  link.download = `brandsmith-sistema-de-marca-${slug}.md`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

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
  const [generatingAnalysis, setGeneratingAnalysis] = useState(false)
  const [analysisFeedback, setAnalysisFeedback] = useState('')
  const [directionProject, setDirectionProject] = useState<string | null>(null)
  const emptyDirection: DirectionDraft = { opportunity: '', tension: '', distinction: '', validation: '' }
  const [directionNotes, setDirectionNotes] = useState<Record<string, DirectionDraft>>(() => { try { return JSON.parse(localStorage.getItem('brandsmith.directions') || '{}') as Record<string, DirectionDraft> } catch { return {} } })
  const [draftDirection, setDraftDirection] = useState<DirectionDraft>(emptyDirection)
  type CreativeDirection = { name: string; strategicIdea: string; audienceMoment: string; promise: string; personality: string; visualTerritory: string; risk: string; validation: string }
  const [creativeDirections, setCreativeDirections] = useState<CreativeDirection[]>([])
  const [generatingDirections, setGeneratingDirections] = useState(false)
  const [directionsFeedback, setDirectionsFeedback] = useState('')
  const [expressionProject, setExpressionProject] = useState<string | null>(null)
  const [identityProject, setIdentityProject] = useState<string | null>(null)
  const [identityView, setIdentityView] = useState('system')
  const emptyExpression = { brandPromise: '', personality: '', voicePrinciples: '', visualTerritory: '', avoidances: '', expressionValidation: '' }
  const [draftExpression, setDraftExpression] = useState(emptyExpression)
  const [generatingExpression, setGeneratingExpression] = useState(false)
  const [expressionFeedback, setExpressionFeedback] = useState('')
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
  const normalizedInvestigation = currentInvestigation.map(answer => (answer || '').toLocaleLowerCase('pt-BR'))
  const projectContext = normalizedInvestigation[0] || ''
  const motivationContext = normalizedInvestigation[1] || ''
  const audienceContext = normalizedInvestigation[2] || ''
  const evidenceContext = normalizedInvestigation[3] || ''
  const has = (text: string, pattern: RegExp) => pattern.test(text)
  const question = questionIndex === 2 && has(`${projectContext} ${motivationContext}`, /concorr|mercado|alternativ|substitu|categoria|diferenc|escolh|oferta/)
    ? { ...baseQuestion, title: 'Em que situação alguém escolheria você?', prompt: 'Você trouxe sinais de mercado ou alternativas. Pense numa situação concreta: o que essa pessoa estaria tentando resolver, o que usaria hoje e o que precisaria perceber para considerar sua proposta?' }
    : questionIndex === 2 && has(`${projectContext} ${motivationContext}`, /comunidade|cultura|criador|conte[uú]do|arte|impacto|causa|educa/)
      ? { ...baseQuestion, title: 'Quem sentiria falta se isso não existisse?', prompt: 'Em vez de descrever um público amplo, imagine uma pessoa ou grupo real. Em que momento essa ideia entraria na vida deles e o que mudaria, mesmo que pouco?' }
      : questionIndex === 3 && has(`${projectContext} ${motivationContext}`, /cliente|usuári|vendi|lan[cç]|test|prot[oó]tipo|atendimento|experiên|aconteceu|observei/)
        ? { ...baseQuestion, title: 'Que sinais concretos você já observou?', prompt: 'Você mencionou uma experiência, teste ou contato com pessoas. O que aconteceu exatamente, com quem e o que foi observado diretamente — separado da sua interpretação?' }
        : questionIndex === 3 && has(`${projectContext} ${motivationContext}`, /ideia|pretend|quero|gostaria|imagino|ainda n[aã]o|come[cç]ar|futuro/)
          ? { ...baseQuestion, title: 'O que já é evidência — e o que ainda é desejo?', prompt: 'É válido estar no começo. Separe o que você já viu, ouviu ou testou daquilo que espera que aconteça. Se ainda não há evidências, qual seria o primeiro sinal observável?' }
          : questionIndex === 4 && has(`${projectContext} ${motivationContext} ${audienceContext}`, /premium|luxo|sofistica|acess[ií]vel|popular|barat|democrat|exclusiv/)
            ? { ...baseQuestion, title: 'Que percepção você quer construir — e qual evitar?', prompt: 'Você sinalizou uma posição sobre valor ou acesso. Que impressão deveria surgir no primeiro contato? E que associação faria a marca parecer errada para você?' }
            : questionIndex === 4 && has(`${projectContext} ${motivationContext}`, /sustent|social|impacto|[ée]tic|inclus|transpar|respons[aá]vel/)
              ? { ...baseQuestion, title: 'Como esse valor apareceria em decisões reais?', prompt: 'Você citou um valor importante. Que comportamento, escolha ou limite provaria esse compromisso na prática — e o que seria apenas discurso?' }
              : questionIndex === 5 && has(`${projectContext} ${motivationContext} ${audienceContext} ${evidenceContext}`, /concorr|mercado|alternativ|cliente|usuári|demanda|pre[cç]o|vendi|compra/)
                ? { ...baseQuestion, title: 'Qual hipótese pode invalidar sua ideia?', prompt: 'Pelo que você contou, a relação entre público, necessidade e escolha parece central. Qual suposição, se estiver errada, faria você repensar a proposta? Como poderia verificá-la com baixo custo?' }
                : questionIndex === 5 && has(`${projectContext} ${motivationContext} ${audienceContext}`, /comunidade|cultura|criador|conte[uú]do|arte|impacto|causa|educa/)
                  ? { ...baseQuestion, title: 'O que você precisa descobrir antes de avançar?', prompt: 'Qual dúvida sobre as pessoas, o contexto ou o efeito da ideia mais influencia suas próximas decisões? Que conversa ou pequeno experimento ajudaria a respondê-la?' }
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

  async function generateStrategicAnalysis() {
    setAnalysisFeedback('')
    if (!interpretationProject) return
    if (!userId || !supabase) {
      const message = 'Entre na sua conta para gerar uma análise estratégica por IA.'
      setAnalysisFeedback(message)
      setNotice(message)
      return
    }
    const answers = investigations[interpretationProject] || []
    if (!answers.some(answer => answer.trim())) {
      const message = 'Responda ao menos uma pergunta da investigação antes de gerar a análise.'
      setAnalysisFeedback(message)
      setNotice(message)
      return
    }
    setGeneratingAnalysis(true)
    setAnalysisFeedback('Conectando ao serviço de IA…')
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !sessionData.session?.access_token) {
        throw new Error('Sua sessão não está disponível. Entre novamente e tente de novo.')
      }
      const project = projects.find(item => item.id === interpretationProject)
      const response = await fetch('/api/strategy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          projectName: project?.name || 'Projeto sem nome',
          category: project?.category || 'A definir',
          answers,
          existingNotes: draftInterpretation,
        }),
      })
      const result = await response.json() as { analysis?: string; error?: string }
      if (!response.ok) throw new Error(result.error || 'Não foi possível gerar a análise estratégica.')
      if (!result.analysis?.trim()) throw new Error('A IA retornou uma análise vazia. Tente novamente.')
      setDraftInterpretation(result.analysis.trim())
      const message = 'Análise estratégica gerada. Revise as hipóteses e edite o texto antes de salvar.'
      setAnalysisFeedback(message)
      setNotice(message)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha inesperada ao gerar a análise.'
      setAnalysisFeedback(`Não foi possível gerar a análise: ${message}`)
      setNotice(message)
    } finally {
      setGeneratingAnalysis(false)
    }
  }

  async function generateCreativeDirections() {
    setDirectionsFeedback('')
    if (!directionProject) return
    if (!userId || !supabase) {
      setDirectionsFeedback('Entre na sua conta para gerar direções criativas com IA.')
      return
    }
    const answers = investigations[directionProject] || []
    const project = projects.find(item => item.id === directionProject)
    setGeneratingDirections(true)
    setDirectionsFeedback('Criando três territórios estratégicos distintos…')
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !sessionData.session?.access_token) throw new Error('Sua sessão não está disponível. Entre novamente e tente de novo.')
      const response = await fetch('/api/directions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionData.session.access_token}` },
        body: JSON.stringify({
          projectName: project?.name || 'Projeto sem nome',
          category: project?.category || 'A definir',
          answers,
          analysis: interpretationNotes[directionProject] || '',
          currentDirection: draftDirection,
        }),
      })
      const result = await response.json() as { directions?: CreativeDirection[]; error?: string }
      if (!response.ok) throw new Error(result.error || 'Não foi possível gerar as direções.')
      if (!Array.isArray(result.directions) || result.directions.length !== 3) throw new Error('A IA não retornou três direções completas. Tente novamente.')
      setCreativeDirections(result.directions)
      setDirectionsFeedback('Três territórios gerados. Compare as diferenças e selecione um para editar — nenhum será aplicado automaticamente.')
    } catch (error) {
      setDirectionsFeedback(error instanceof Error ? error.message : 'Falha inesperada ao gerar direções.')
    } finally {
      setGeneratingDirections(false)
    }
  }

  async function generateBrandExpression() {
    setExpressionFeedback('')
    if (!expressionProject) return
    if (!userId || !supabase) {
      setExpressionFeedback('Entre na sua conta para gerar uma proposta de expressão com IA.')
      return
    }
    const project = projects.find(item => item.id === expressionProject)
    const currentDirection = directionNotes[expressionProject] || emptyDirection
    setGeneratingExpression(true)
    setExpressionFeedback('Construindo uma proposta coerente com a investigação e a direção…')
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !sessionData.session?.access_token) throw new Error('Sua sessão não está disponível. Entre novamente e tente de novo.')
      const response = await fetch('/api/expression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionData.session.access_token}` },
        body: JSON.stringify({
          projectName: project?.name || 'Projeto sem nome',
          category: project?.category || 'A definir',
          investigation: investigations[expressionProject] || [],
          analysis: interpretationNotes[expressionProject] || '',
          direction: currentDirection,
          currentExpression: draftExpression,
        }),
      })
      const result = await response.json() as { expression?: typeof emptyExpression; error?: string }
      if (!response.ok) throw new Error(result.error || 'Não foi possível gerar a proposta.')
      if (!result.expression || Object.values(emptyExpression).some(key => typeof result.expression?.[key as keyof typeof emptyExpression] !== 'string' || !result.expression?.[key as keyof typeof emptyExpression].trim())) throw new Error('A IA não retornou os seis campos completos. Tente novamente.')
      setDraftExpression(result.expression)
      setExpressionFeedback('Proposta gerada. Revise e edite os seis campos antes de salvar; nada foi aprovado automaticamente.')
    } catch (error) {
      setExpressionFeedback(error instanceof Error ? error.message : 'Não foi possível gerar a proposta. Tente novamente.')
    } finally {
      setGeneratingExpression(false)
    }
  }

  function selectCreativeDirection(direction: CreativeDirection) {
    setDraftDirection({
      opportunity: direction.strategicIdea,
      tension: direction.audienceMoment,
      distinction: direction.promise,
      validation: direction.validation,
    })
    setDirectionsFeedback(`“${direction.name}” foi levado ao rascunho. Revise e ajuste os campos antes de salvar.`)
  }

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
    stage: 'Expressão em elaboração' | 'Expressão para revisar' | 'Expressão aprovada' | 'Identidade visual construída',
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
      const importConfirmation = userId && supabase
        ? 'Importar este backup substituirá os dados salvos neste navegador e combinará os projetos do backup com os da sua conta. Projetos que já estão na nuvem e não aparecem no backup serão preservados. Deseja continuar?'
        : 'Importar este backup substituirá os projetos e dados salvos neste navegador. Exporte um backup atual antes de continuar, se quiser preservá-lo. Deseja continuar?'
      if (!window.confirm(importConfirmation)) return
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
          <BrandMark size={30} />
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
              <div className="interpretation-entry"><div><span className="mini-label">ETAPA 02 · INTERPRETAR</span><h3>Separar o que sabemos do que ainda precisamos descobrir.</h3><p>{(investigations[activeProject.id] || []).some(answer => answer.trim()) ? 'Abra a interpretação para revisar as respostas e, se estiver conectado à sua conta, gerar uma análise estratégica com IA.' : 'Abra esta etapa para consultar a análise. Para gerar uma análise com IA, primeiro registre ao menos uma resposta na investigação.'}</p></div><button className="secondary-button" onClick={() => { setInterpretationProject(activeProject.id); setDraftInterpretation(interpretationNotes[activeProject.id] || '') }}>Abrir interpretação e IA <Sparkles size={15} /></button></div>
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
                      if (![current.brandPromise, current.personality, current.voicePrinciples, current.visualTerritory, current.avoidances, current.expressionValidation].some(value => typeof value === 'string' && value.trim())) {
                        setNotice('Registre pelo menos uma dimensão da expressão antes de aprová-la.')
                        return
                      }
                      const nextDirections = { ...directionNotes, [activeProject.id]: { ...current, expressionApproved: true } }
                      if (!saveExpressionChanges(activeProject.id, 'Expressão aprovada', nextDirections)) return
                      setNotice('Expressão aprovada. A próxima etapa é construir a primeira proposta de identidade visual.')
                    }}>Aprovar expressão <Check size={16} /></button>}
                    {activeProject.stage === 'Expressão aprovada' && <span className="stage-state"><Check size={14} /> Aprovação registrada</span>}
                  </div>
                </section>
              })()}
              {['Expressão aprovada', 'Identidade visual construída'].includes(activeProject.stage) && <div className="interpretation-entry identity-entry"><div><span className="mini-label">{activeProject.stage === 'Identidade visual construída' ? 'SISTEMA VISUAL SALVO' : 'PRÓXIMA ETAPA · IDENTIDADE VISUAL'}</span><h3>{activeProject.stage === 'Identidade visual construída' ? 'Sua direção visual está registrada.' : 'Transforme a expressão aprovada em uma primeira direção visual.'}</h3><p>{activeProject.stage === 'Identidade visual construída' ? 'Você pode reabrir o sistema visual a qualquer momento para consultar as cores, a tipografia, as aplicações e as diretrizes.' : 'O BRANDSMITH organiza uma proposta inicial de paleta, tipografia, formas e aplicações a partir das decisões do projeto. Você poderá revisar antes de considerar qualquer escolha definitiva.'}</p></div><button className="primary-button" onClick={() => { setIdentityView('system'); setIdentityProject(activeProject.id) }}>{activeProject.stage === 'Identidade visual construída' ? <><Sparkles size={16} /> Reabrir sistema visual</> : <><Sparkles size={16} /> Construir identidade visual <ArrowRight size={15} /></>}</button></div>}
              {identityProject === activeProject.id && (() => {
                const identity = directionNotes[activeProject.id] || emptyDirection
                const strategyText = [activeProject.name, activeProject.category, identity.brandPromise, identity.personality, identity.voicePrinciples, identity.visualTerritory, identity.avoidances, identity.opportunity, identity.tension, identity.distinction, directionNotes[activeProject.id]?.validation].filter(Boolean).join(' ').toLowerCase()
                const hash = [...strategyText].reduce((value, char) => ((value * 31) + char.charCodeAt(0)) >>> 0, 7)
                const palettes = [
                  [{name:'Carvão',hex:'#171717'},{name:'Osso',hex:'#F3EFE5'},{name:'Pulso',hex:'#D7FF38'},{name:'Musgo',hex:'#7A8F78'}],
                  [{name:'Noite',hex:'#171B35'},{name:'Névoa',hex:'#F2F0FA'},{name:'Faísca',hex:'#FF6B4A'},{name:'Lavanda',hex:'#A89BE7'}],
                  [{name:'Cacau',hex:'#39251F'},{name:'Linho',hex:'#F1E4CE'},{name:'Solar',hex:'#F2B544'},{name:'Oliva',hex:'#78804B'}],
                  [{name:'Azul profundo',hex:'#102F3C'},{name:'Gelo',hex:'#E7F0ED'},{name:'Coral',hex:'#F27666'},{name:'Mar',hex:'#5B9E9A'}],
                  [{name:'Ameixa',hex:'#35152F'},{name:'Pérola',hex:'#F6EDF1'},{name:'Choque',hex:'#F3A6D2'},{name:'Vinho',hex:'#96516F'}],
                  [{name:'Grafite',hex:'#252525'},{name:'Papel',hex:'#F4F1E8'},{name:'Cobalto',hex:'#3559E8'},{name:'Prata',hex:'#A7ACB4'}],
                ]
                const paletteIndex = strategyText.match(/natureza|terra|org[aâ]nic|sustent|calma|artesanal/) ? 2 : strategyText.match(/tecnolog|digital|precis|inova|dados|futuro/) ? 3 : strategyText.match(/luxo|sofistic|eleg|exclusiv|premium/) ? 4 : strategyText.match(/divers|criativ|cultura|humor|irrever|ousad|rebeld/) ? 5 : hash % palettes.length
                const palette = palettes[paletteIndex]
                const condensed = /ousad|rebeld|irrever|energia|impacto|humor|cultura|jovem/.test(strategyText)
                const serif = /tradi[cç][aã]o|hist[oó]ria|autor|liter|sofistic|artesanal|eleg/.test(strategyText)
                const typeTitle = condensed ? 'Impacto sem pedir licença.' : serif ? 'Caráter que atravessa o tempo.' : paletteIndex === 3 ? 'Ideias em movimento.' : paletteIndex === 2 ? 'Feito com intenção.' : 'Clareza com personalidade.'
                const symbol = paletteIndex === 0 ? '✳' : paletteIndex === 1 ? '◒' : paletteIndex === 2 ? '✳' : paletteIndex === 3 ? '↗' : paletteIndex === 4 ? '✦' : '✕'
                const title = activeProject.name.trim() || 'Nova marca'
                const visualPage = identityView
                return <div className="modal-backdrop investigation-backdrop"><section className="investigation-modal identity-modal identity-modal-expanded" role="dialog" aria-modal="true" aria-labelledby="identity-title"><div className="investigation-top"><span className="mini-label">ETAPA 04 · SISTEMA DE IDENTIDADE</span><button className="icon-button" onClick={() => setIdentityProject(null)} aria-label="Fechar proposta visual"><X size={18} /></button></div><div className="eyebrow"><span className="eyebrow-line" />DIREÇÃO VISUAL PROPOSTA · {paletteIndex === 0 ? 'CONTRASTE EDITORIAL' : paletteIndex === 1 ? 'EXPRESSÃO CONTEMPORÂNEA' : paletteIndex === 2 ? 'CALOR ORGÂNICO' : paletteIndex === 3 ? 'PRECISÃO EM MOVIMENTO' : paletteIndex === 4 ? 'SOFISTICAÇÃO EXPRESSIVA' : 'ENERGIA GRÁFICA'}</div><h2 id="identity-title">Uma direção visual com intenção<span className="lime-period">.</span></h2><p className="investigation-prompt">Esta proposta parte das respostas e decisões registradas neste projeto. Explore as aplicações e revise as hipóteses; nenhuma escolha é definitiva antes da sua validação.</p><nav className="identity-pages" aria-label="Seções da identidade visual">{[{id:'system',label:'Sistema'},{id:'palette',label:'Cores & tipo'},{id:'applications',label:'Aplicações'},{id:'guidelines',label:'Diretrizes'}].map(page => <button key={page.id} className={visualPage === page.id ? 'identity-page-active' : ''} onClick={() => setIdentityView(page.id)}>{page.label}</button>)}</nav>
                  {visualPage === 'system' && <><div className="identity-board"><div className="identity-board-top"><span>{title.toUpperCase()} / CONCEPT 01</span><span>VISUAL STUDY</span></div><div className="identity-board-hero identity-hero-personal" style={{background:palette[0].hex,color:palette[1].hex}}><span className="identity-mark">{symbol}</span><strong>{title.toUpperCase()}</strong><small>{identity.brandPromise?.trim() || identity.distinction?.trim() || identity.opportunity?.trim() || 'Uma proposta em busca de expressão própria.'}</small><i style={{background:palette[2].hex}} /></div><div className="identity-swatches">{palette.map(color => <div className="identity-swatch" key={color.hex}><span style={{background:color.hex}} /><strong>{color.name}</strong><code>{color.hex}</code></div>)}</div><div className="identity-type-sample"><span className="mini-label">DIREÇÃO TIPOGRÁFICA</span><strong className={condensed ? 'identity-condensed' : serif ? 'identity-serif' : ''}>{typeTitle}</strong><p>{condensed ? 'Títulos condensados e assertivos, com ritmo editorial; texto de apoio simples para equilibrar a energia.' : serif ? 'Títulos com contraste e caráter; uma sans-serif neutra mantém a leitura contemporânea.' : 'Títulos de alto contraste e boa presença, com sans-serif funcional para leitura e informação.'}</p></div><div className="identity-board-notes"><div><span className="mini-label">PERSONALIDADE</span><p>{identity.personality?.trim() || 'Hipótese a validar a partir da investigação.'}</p></div><div><span className="mini-label">TERRITÓRIO VISUAL</span><p>{identity.visualTerritory?.trim() || 'Direção proposta a partir das tensões estratégicas registradas.'}</p></div><div><span className="mini-label">EVITAR</span><p>{identity.avoidances?.trim() || 'Códigos que ainda precisam ser definidos.'}</p></div></div></div></>}
                  <div className="identity-export-actions"><button className="secondary-button" onClick={() => exportIdentityLogoSvg(title, palette, symbol)}><Download size={15} /> Exportar proposta de logo em SVG</button><button className="secondary-button" onClick={() => exportBrandGuide(title, activeProject.category, identity, palette, typeTitle, symbol)}><Download size={15} /> Exportar sistema de marca (.md)</button><span className="investigation-footnote">O guia reúne estratégia, paleta, direção tipográfica e critérios de validação. Documento editável; proposta ainda sujeita à revisão.</span></div>
                  {visualPage === 'palette' && <div className="identity-detail-grid"><section className="identity-detail-card"><span className="mini-label">PALETA E FUNÇÃO</span><h3>Cada cor tem um papel.</h3><p>A combinação foi selecionada a partir do território e da personalidade registrados, não apenas do nome da marca.</p><div className="identity-large-swatches">{palette.map((color,index) => <div key={color.hex}><span style={{background:color.hex}}/><strong>{color.name}</strong><code>{color.hex}</code><small>{['Base e estrutura','Respiro e leitura','Acento e reconhecimento','Apoio e profundidade'][index]}</small></div>)}</div></section><section className="identity-detail-card"><span className="mini-label">HIERARQUIA TIPOGRÁFICA</span><h3 className={condensed ? 'identity-condensed' : serif ? 'identity-serif' : ''}>{title}</h3><p>Título / {condensed ? 'condensada de impacto' : serif ? 'serifada expressiva' : 'sans-serif de personalidade'}</p><div className="identity-type-row"><strong>Ag</strong><div><b>Texto e interface</b><p>Sans-serif de alta legibilidade para textos longos, controles e informação funcional.</p></div></div><div className="identity-type-row"><code>01 / NOTAS</code><p>Monoespaçada para códigos, legendas, dados e detalhes técnicos.</p></div></section></div>}
                  {visualPage === 'applications' && <div className="identity-applications"><section className="identity-application-card identity-social-card" style={{background:palette[0].hex,color:palette[1].hex}}><span className="mini-label">01 / POST SOCIAL</span><span className="identity-application-symbol" style={{color:palette[2].hex}}>{symbol}</span><h3>{title.toUpperCase()}</h3><p>{identity.brandPromise?.trim() || identity.distinction?.trim() || 'Uma ideia que merece ser reconhecida.'}</p><div style={{background:palette[2].hex,color:palette[0].hex}}>IDEIA EM FOCO ↗</div></section><section className="identity-application-card identity-card-paper"><span className="mini-label">02 / CARTÃO DE MARCA</span><span className="identity-application-symbol" style={{color:palette[2].hex}}>{symbol}</span><h3>{title}</h3><p>{identity.personality?.trim() || 'Personalidade em construção'}</p><div className="identity-card-stripe" style={{background:palette[3].hex}}/></section><section className="identity-application-card identity-poster" style={{background:palette[2].hex,color:palette[0].hex}}><span className="mini-label">03 / PÔSTER</span><span>{symbol}</span><h3>{typeTitle}</h3><p>{identity.voicePrinciples?.trim() || identity.visualTerritory?.trim() || 'Uma direção visual que pode evoluir.'}</p></section></div>}
                  {visualPage === 'guidelines' && <div className="identity-detail-grid"><section className="identity-detail-card"><span className="mini-label">REGRAS DE COMPOSIÇÃO</span><h3>Reconhecimento vem da consistência.</h3><ul><li>Usar a cor de acento em um ponto de foco, não em todos os elementos.</li><li>Manter contraste suficiente entre fundo e texto.</li><li>Combinar um título expressivo com texto de apoio legível.</li><li>Usar o símbolo como assinatura, sem substituir o nome quando a marca ainda está em construção.</li></ul></section><section className="identity-detail-card"><span className="mini-label">DECISÕES A VALIDAR</span><h3>Hipóteses, não verdades.</h3><ul><li>Se a paleta expressa a personalidade e o território desejados.</li><li>Se a direção tipográfica combina com o público e os pontos de contato.</li><li>Se os exemplos funcionam nos contextos reais da marca.</li><li>Se o símbolo é distintivo o bastante ou precisa ser redesenhado.</li></ul><p><strong>Base estratégica:</strong> {[identity.personality,identity.visualTerritory,identity.brandPromise,identity.distinction].filter(Boolean).join(' · ') || 'Ainda faltam decisões estratégicas para personalizar melhor a proposta.'}</p></section></div>}
                  <div className="investigation-actions"><button className="secondary-button" onClick={() => setIdentityProject(null)}>Continuar depois</button><button className="primary-button" onClick={() => { const next = { ...directionNotes, [activeProject.id]: { ...identity, identityGenerated: true, identityPalette: palette.map(color => color.hex).join(','), identityDirection: ['Contraste editorial','Expressão contemporânea','Calor orgânico','Precisão em movimento','Sofisticação expressiva','Energia gráfica'][paletteIndex], identityVisualPage: visualPage } }; if (!saveExpressionChanges(activeProject.id, 'Identidade visual construída', next)) return; setIdentityProject(null); setNotice('Sistema visual salvo. Ele continua disponível no projeto para você reabrir e revisar.') }}><Check size={15} /> Salvar sistema visual</button></div></section></div>
              })()}
              <div className="export-brief-row"><div><span className="mini-label">SEU TRABALHO, FORA DO APP</span><p>Exporte as respostas, notas e hipóteses reunidas em um dossiê editável.</p></div><button className="secondary-button" onClick={() => exportProjectBrief(activeProject)}><FileText size={16} /> Exportar dossiê (.md)</button></div>
              <div className="section-heading"><div><span className="mini-label">O PROCESSO</span><h2>Um caminho, não uma fórmula.</h2></div><span className="section-aside">04 ETAPAS · VOCÊ VALIDA CADA UMA</span></div>
              <div className="stage-list">{stages.map((stage, index) => { const Icon = stage.icon; const currentStageIndex = ['Ponto de partida', 'Investigação para revisar'].includes(activeProject.stage) ? 0 : activeProject.stage === 'Investigação concluída' ? 1 : ['Interpretação em revisão', 'Interpretação validada'].includes(activeProject.stage) ? 2 : ['Direção em elaboração', 'Direção para revisar'].includes(activeProject.stage) ? 2 : ['Expressão em elaboração', 'Expressão para revisar', 'Expressão aprovada', 'Identidade visual construída'].includes(activeProject.stage) ? 3 : 0; const isCurrentStage = index === currentStageIndex; const isReviewStage = isCurrentStage && activeProject.stage.endsWith('para revisar'); const stageState = index < currentStageIndex ? 'Concluída' : index > currentStageIndex ? 'Aguardando' : isReviewStage ? 'Para revisar' : activeProject.stage === 'Ponto de partida' ? 'Próxima etapa' : 'Em andamento'; return <div className="stage-row" key={stage.number}><span className="stage-number">{stage.number}</span><div className="stage-icon"><Icon size={18} /></div><div className="stage-copy"><h3>{stage.name}</h3><p>{stage.detail}</p></div><span className="stage-state">{stageState}</span><ArrowDownRight className="stage-arrow" size={17} /></div> })}</div>
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
                  {filteredProjects.map((project) => (
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
      {expressionProject && <div className="modal-backdrop investigation-backdrop"><section className="investigation-modal expression-modal" role="dialog" aria-modal="true" aria-labelledby="expression-title"><div className="investigation-top"><span className="mini-label">ETAPA 04 · EXPRESSAR</span><button className="icon-button" onClick={() => setExpressionProject(null)} aria-label="Fechar expressão"><X size={18} /></button></div><div className="eyebrow"><span className="eyebrow-line" />TRADUZIR A DIREÇÃO SEM PULAR A VALIDAÇÃO</div><h2 id="expression-title">Que forma essa marca pode assumir<span className="lime-period">?</span></h2><p className="investigation-prompt">Use a direção estratégica como ponto de partida. Gere uma hipótese editável com IA ou escreva cada dimensão manualmente. A aprovação continua sendo sua.</p><div className="analysis-generator"><button type="button" className="secondary-button" onClick={() => void generateBrandExpression()} disabled={generatingExpression}><Sparkles size={16} /> {generatingExpression ? "Construindo expressão…" : "Gerar proposta de expressão com IA"}</button><p className="investigation-footnote" role="status" aria-live="polite">{expressionFeedback || "A proposta usa a investigação, a análise e a direção registrada; revise cada campo antes de enviar para revisão."}</p></div><div className="expression-fields">
<label htmlFor="expression-promise">01 · PROMESSA DA MARCA<textarea id="expression-promise" rows={3} value={draftExpression.brandPromise} onChange={e => setDraftExpression({ ...draftExpression, brandPromise: e.target.value })} placeholder="Que valor a marca quer entregar, de forma relevante e crível?" /></label>
<label htmlFor="expression-personality">02 · PERSONALIDADE<textarea id="expression-personality" rows={3} value={draftExpression.personality} onChange={e => setDraftExpression({ ...draftExpression, personality: e.target.value })} placeholder="Se a marca fosse uma presença, como se comportaria? Que traços não combinam?" /></label>
<label htmlFor="expression-voice">03 · PRINCÍPIOS DE VOZ<textarea id="expression-voice" rows={3} value={draftExpression.voicePrinciples} onChange={e => setDraftExpression({ ...draftExpression, voicePrinciples: e.target.value })} placeholder="Como fala, que palavras privilegia e que tom evita?" /></label>
<label htmlFor="expression-visual">04 · TERRITÓRIO VISUAL<textarea id="expression-visual" rows={3} value={draftExpression.visualTerritory} onChange={e => setDraftExpression({ ...draftExpression, visualTerritory: e.target.value })} placeholder="Que referências, contrastes, materiais, cores ou formas merecem exploração?" /></label>
<label htmlFor="expression-avoid">05 · O QUE EVITAR<textarea id="expression-avoid" rows={3} value={draftExpression.avoidances} onChange={e => setDraftExpression({ ...draftExpression, avoidances: e.target.value })} placeholder="Liste clichês, códigos genéricos e escolhas que contradizem a direção." /></label>
<label htmlFor="expression-validation">06 · COMO VALIDAR<textarea id="expression-validation" rows={3} value={draftExpression.expressionValidation} onChange={e => setDraftExpression({ ...draftExpression, expressionValidation: e.target.value })} placeholder="Que critérios ou pessoas ajudarão a avaliar se essa expressão faz sentido?" /></label>
</div><div className="investigation-actions"><button className="secondary-button" onClick={() => setExpressionProject(null)}>Cancelar</button><button className="secondary-button" onClick={() => { const current = directionNotes[expressionProject] || emptyDirection; const nextDirections = { ...directionNotes, [expressionProject]: { ...current, ...draftExpression, expressionApproved: false } }; if (!saveExpressionChanges(expressionProject, 'Expressão em elaboração', nextDirections)) return; setExpressionProject(null); setNotice('Rascunho de expressão salvo. Ele continua sujeito à sua revisão.') }}><Check size={15} /> Salvar rascunho</button><button className="primary-button" onClick={() => { if (!Object.values(draftExpression).some(value => value.trim())) { setNotice('Preencha pelo menos um campo da expressão antes de enviar para revisão.'); return } const current = directionNotes[expressionProject] || emptyDirection; const nextDirections = { ...directionNotes, [expressionProject]: { ...current, ...draftExpression, expressionApproved: false } }; if (!saveExpressionChanges(expressionProject, 'Expressão para revisar', nextDirections)) return; setExpressionProject(null); setNotice('Expressão salva no projeto e marcada como “Expressão para revisar”. Isso não envia o material a outra pessoa nem gera uma identidade final.') }}>Enviar para revisão <ArrowRight size={15} /></button></div></section></div>}
      {directionProject && <div className="modal-backdrop investigation-backdrop"><section className="investigation-modal direction-modal" role="dialog" aria-modal="true" aria-labelledby="direction-title"><div className="investigation-top"><span className="mini-label">ETAPA 03 · DIRECIONAR</span><button className="icon-button" onClick={() => setDirectionProject(null)} aria-label="Fechar direção"><X size={18} /></button></div><div className="eyebrow"><span className="eyebrow-line" />UMA DIREÇÃO É UMA HIPÓTESE, NÃO UM SLOGAN</div><h2 id="direction-title">Que caminho vale a pena explorar<span className="lime-period">?</span></h2><p className="investigation-prompt">Use a interpretação validada como ponto de partida. Registre possibilidades que possam ser discutidas e testadas — não precisa chegar a uma resposta definitiva.</p><div className="analysis-generator">
        <button type="button" className="secondary-button" onClick={() => void generateCreativeDirections()} disabled={generatingDirections}>
          <Sparkles size={16} /> {generatingDirections ? 'Explorando territórios…' : 'Gerar 3 direções criativas com IA'}
        </button>
        <p className="investigation-footnote" role="status" aria-live="polite">{directionsFeedback || 'Cada direção deve explorar uma lógica estratégica diferente. Compare as promessas, os riscos e os territórios antes de escolher.'}</p>
      </div>
      {creativeDirections.length > 0 && <div className="creative-directions-list" aria-label="Direções criativas geradas">{creativeDirections.map((direction, index) => <article className="creative-direction-card" key={`${direction.name}-${index}`}><span className="mini-label">TERRITÓRIO 0${index + 1}</span><h3>{direction.name}</h3><p><strong>Ideia estratégica</strong><br />{direction.strategicIdea}</p><p><strong>Momento do público</strong><br />{direction.audienceMoment}</p><p><strong>Promessa possível</strong><br />{direction.promise}</p><p><strong>Personalidade</strong><br />{direction.personality}</p><p><strong>Território visual</strong><br />{direction.visualTerritory}</p><p><strong>Risco a observar</strong><br />{direction.risk}</p><p><strong>Como testar</strong><br />{direction.validation}</p><button type="button" className="secondary-button" onClick={() => selectCreativeDirection(direction)}>Levar ao rascunho</button></article>)}</div>}
      <div className="direction-fields"><label htmlFor="direction-opportunity">01 · OPORTUNIDADE RELEVANTE<textarea id="direction-opportunity" rows={3} value={draftDirection.opportunity} onChange={e => setDraftDirection({ ...draftDirection, opportunity: e.target.value })} placeholder="Que necessidade ou possibilidade parece merecer atenção?" /></label><label htmlFor="direction-tension">02 · TENSÃO A RESOLVER<textarea id="direction-tension" rows={3} value={draftDirection.tension} onChange={e => setDraftDirection({ ...draftDirection, tension: e.target.value })} placeholder="Que conflito, expectativa ou barreira a marca precisa enfrentar?" /></label><label htmlFor="direction-distinction">03 · HIPÓTESE DE DIFERENCIAÇÃO<textarea id="direction-distinction" rows={3} value={draftDirection.distinction} onChange={e => setDraftDirection({ ...draftDirection, distinction: e.target.value })} placeholder="O que poderia tornar esta proposta relevante de um jeito próprio?" /></label><label htmlFor="direction-validation">04 · O QUE PRECISA SER VALIDADO<textarea id="direction-validation" rows={3} value={draftDirection.validation} onChange={e => setDraftDirection({ ...draftDirection, validation: e.target.value })} placeholder="Que evidência, conversa ou experimento ajudaria a avaliar essa hipótese?" /></label></div><div className="investigation-actions"><button className="secondary-button" onClick={() => setDirectionProject(null)}>Voltar depois</button><button className="secondary-button" onClick={() => { const next = { ...directionNotes, [directionProject]: draftDirection }; const previous = localStorage.getItem('brandsmith.directions'); try { localStorage.setItem('brandsmith.directions', JSON.stringify(next)) } catch { setNotice('Não foi possível salvar a direção neste navegador.'); return } const updated = projects.map(p => p.id === directionProject ? { ...p, stage: 'Direção em elaboração', updated: 'Rascunho estratégico salvo' } : p); if (!saveProjects(updated)) { try { if (previous === null) localStorage.removeItem('brandsmith.directions'); else localStorage.setItem('brandsmith.directions', previous) } catch { /* Best-effort rollback. */ } return } setDirectionNotes(next); setDirectionProject(null); setNotice('Rascunho estratégico salvo. A direção ainda não foi validada.') }}>Salvar rascunho</button><button className="primary-button" onClick={() => { if (![draftDirection.opportunity, draftDirection.tension, draftDirection.distinction, draftDirection.validation].some(value => value.trim())) { setNotice('Registre pelo menos uma hipótese antes de validar.'); return } const next = { ...directionNotes, [directionProject]: draftDirection }; const previous = localStorage.getItem('brandsmith.directions'); try { localStorage.setItem('brandsmith.directions', JSON.stringify(next)) } catch { setNotice('Não foi possível salvar a direção neste navegador.'); return } const updated = projects.map(p => p.id === directionProject ? { ...p, stage: 'Direção para revisar', updated: 'Rascunho de direção criado' } : p); if (!saveProjects(updated)) { try { if (previous === null) localStorage.removeItem('brandsmith.directions'); else localStorage.setItem('brandsmith.directions', previous) } catch { /* Best-effort rollback. */ } return } setDirectionNotes(next); setDirectionProject(null); setNotice('Direção registrada para sua revisão. Ela ainda não está aprovada como estratégia final.') }}>Registrar direção <Check size={16} /></button></div><p className="investigation-footnote"><Check size={14} />Registrar uma direção não equivale a aprovar uma estratégia definitiva.</p></section></div>}
      {interpretationProject && <div className="modal-backdrop investigation-backdrop"><section className="investigation-modal interpretation-modal" role="dialog" aria-modal="true" aria-labelledby="interpretation-title"><div className="investigation-top"><span className="mini-label">ETAPA 02 · INTERPRETAR</span><button className="icon-button" onClick={() => setInterpretationProject(null)} aria-label="Fechar interpretação"><X size={18} /></button></div><div className="eyebrow"><span className="eyebrow-line" />ORGANIZAR NÃO É CONCLUIR</div><h2 id="interpretation-title">O que é evidência, preferência ou hipótese<span className="lime-period">?</span></h2><p className="investigation-prompt">A classificação inicial se baseia na pergunta em que cada resposta foi registrada; ela não verifica se a afirmação é verdadeira. Revise as notas e identifique o que ainda precisa ser investigado.</p><div className="interpretation-groups"><article><span className="interpretation-tag evidence">01 · EVIDÊNCIAS E CONTEXTO</span><p>{investigations[interpretationProject]?.[0] || "Contexto ainda não informado."}</p><small>O contexto é relato do projeto; evidências verificáveis ainda precisam ser identificadas.</small><p>{investigations[interpretationProject]?.[3] || "Nenhuma evidência ou observação descrita."}</p></article><article><span className="interpretation-tag preference">02 · PREFERÊNCIAS DECLARADAS</span><p>{investigations[interpretationProject]?.[4] || "Nenhuma preferência declarada."}</p><small>Preferências orientam escolhas, mas não comprovam necessidades do público.</small></article><article><span className="interpretation-tag hypothesis">03 · HIPÓTESES A VERIFICAR</span><p>{investigations[interpretationProject]?.[1] || "Motivação ainda não descrita."}</p><p>{investigations[interpretationProject]?.[2] || "Público e contexto de uso ainda não descritos."}</p><p>{investigations[interpretationProject]?.[5] || "Nenhuma hipótese explicitada."}</p><small>Motivação e público são questões a investigar, não fatos confirmados.</small></article></div><div className="analysis-generator">
        <button type="button" className="secondary-button" onClick={() => void generateStrategicAnalysis()} disabled={generatingAnalysis}>
          <Sparkles size={16} /> {generatingAnalysis ? 'Analisando investigação…' : 'Gerar análise estratégica com IA'}
        </button>
        <p className="investigation-footnote" role="status" aria-live="polite">{analysisFeedback || (!userId ? 'Entre em uma conta para habilitar a análise por IA.' : 'A análise distingue relatos, evidências, inferências e hipóteses. Você poderá revisar e editar o resultado antes de salvar.')}</p>
      </div>
      <label className="answer-label" htmlFor="interpretation-notes">ANÁLISE E NOTAS DE INTERPRETAÇÃO</label><textarea id="interpretation-notes" rows={8} value={draftInterpretation} onChange={e => setDraftInterpretation(e.target.value)} placeholder="Gere uma análise com IA ou registre suas dúvidas, contradições e pontos a verificar. Você pode editar o texto antes de salvar." /><div className="investigation-actions"><button className="secondary-button" onClick={() => setInterpretationProject(null)}>Voltar depois</button><button className="secondary-button" onClick={() => { const next = { ...interpretationNotes, [interpretationProject]: draftInterpretation }; const previous = localStorage.getItem("brandsmith.interpretations"); try { localStorage.setItem("brandsmith.interpretations", JSON.stringify(next)) } catch { setNotice("Não foi possível salvar a interpretação neste navegador."); return } const updated = projects.map(p => p.id === interpretationProject ? { ...p, stage: "Interpretação em revisão", updated: "Interpretação salva" } : p); if (!saveProjects(updated)) { try { if (previous === null) localStorage.removeItem("brandsmith.interpretations"); else localStorage.setItem("brandsmith.interpretations", previous) } catch { /* Best-effort rollback. */ } return } setInterpretationNotes(next); setInterpretationProject(null); setNotice("Rascunho salvo. A interpretação continua pendente de validação.") }}>Salvar rascunho</button><button className="primary-button" onClick={() => { const next = { ...interpretationNotes, [interpretationProject]: draftInterpretation }; const previous = localStorage.getItem("brandsmith.interpretations"); try { localStorage.setItem("brandsmith.interpretations", JSON.stringify(next)) } catch { setNotice("Não foi possível salvar a interpretação neste navegador."); return } const updated = projects.map(p => p.id === interpretationProject ? { ...p, stage: "Interpretação validada", updated: "Etapa 02 validada" } : p); if (!saveProjects(updated)) { try { if (previous === null) localStorage.removeItem("brandsmith.interpretations"); else localStorage.setItem("brandsmith.interpretations", previous) } catch { /* Best-effort rollback. */ } return } setInterpretationNotes(next); setInterpretationProject(null); setNotice("Interpretação validada por você. As hipóteses continuam identificadas como hipóteses.") }}>Validar interpretação <Check size={16} /></button></div><p className="investigation-footnote"><Check size={14} />A interpretação fica provisória até ser revisada por você.</p></section></div>}
      {investigationProject && <div className="modal-backdrop investigation-backdrop"><section className="investigation-modal" role="dialog" aria-modal="true" aria-labelledby="investigation-title"><div className="investigation-top"><span className="mini-label">INVESTIGAÇÃO ADAPTATIVA · {String(Math.min(questionIndex + 1, investigationQuestions.length)).padStart(2, '0')} / 06</span><button className="icon-button" onClick={() => setInvestigationProject(null)} aria-label="Fechar investigação"><X size={18} /></button></div><div className="investigation-progress">{investigationQuestions.map((item, i) => <span key={item.kind} className={i <= questionIndex ? 'done' : ''} />)}</div>{questionIndex < investigationQuestions.length ? <><div className="eyebrow"><span className="eyebrow-line" />VAMOS INVESTIGAR ANTES DE CONCLUIR</div><h2 id="investigation-title">{question.title}<span className="lime-period">.</span></h2><p className="investigation-prompt">{question.prompt}</p><label className="answer-label" htmlFor="investigation-answer">SUA RESPOSTA</label><textarea id="investigation-answer" autoFocus rows={5} value={currentAnswer} onChange={e => setCurrentAnswer(e.target.value)} placeholder="Escreva livremente. Não existe resposta certa nesta etapa..." /><div className="investigation-actions"><button className="secondary-button" onClick={() => { if (questionIndex > 0) { setQuestionIndex(questionIndex - 1); setCurrentAnswer(currentInvestigation[questionIndex - 1] || '') } else setInvestigationProject(null) }}>{questionIndex > 0 ? 'Voltar' : 'Sair'}</button><button className="primary-button" disabled={!currentAnswer.trim()} onClick={saveInvestigationAnswer}>{questionIndex === investigationQuestions.length - 1 ? 'Organizar síntese' : 'Continuar'} <ArrowRight size={16} /></button></div><p className="investigation-footnote"><Check size={14} />Você pode revisar suas respostas. Nenhuma decisão estratégica será tomada automaticamente.</p></> : <><div className="eyebrow"><span className="eyebrow-line" />PRIMEIRA LEITURA · PARA VALIDAR</div><h2 id="investigation-title">O que sabemos até aqui<span className="lime-period">.</span></h2><p className="investigation-prompt">Esta síntese organiza suas respostas por natureza. Ela não é uma estratégia final nem uma conclusão sobre o mercado.</p><div className="synthesis-list">{investigationQuestions.map((item, i) => <article className="synthesis-item" key={item.kind}><span>{String(i + 1).padStart(2, '0')} · {item.kind.toUpperCase()}</span><p>{(currentInvestigation[i] || 'Ainda não respondido.').trim()}</p></article>)}</div><div className="investigation-actions"><button className="secondary-button" onClick={() => { setQuestionIndex(5); setCurrentAnswer(currentInvestigation[5] || '') }}>Revisar última resposta</button><button className="primary-button" onClick={() => { setSummaryApproved({ ...summaryApproved, [investigationProject]: true }); const updated = projects.map(p => p.id === investigationProject ? { ...p, stage: 'Investigação concluída', updated: 'Investigação validada' } : p); if (!saveProjects(updated)) return; setInvestigationProject(null); setNotice('Investigação validada. Agora você pode interpretar as respostas e separar evidências de hipóteses.') }}>Validar esta organização <Check size={16} /></button></div><p className="investigation-footnote"><Check size={14} />Validar significa aprovar a organização das informações, não transformar hipóteses em fatos.</p></>}</section></div>}
      {showCreate && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowCreate(false) }}><section className="create-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-top"><span className="mini-label">NOVO PROJETO / 01</span><button className="icon-button" onClick={() => setShowCreate(false)} aria-label="Fechar"><X size={18} /></button></div><div className="modal-symbol">✳</div><h2 id="modal-title">Toda marca começa<br />com uma <em>boa pergunta.</em></h2><p>Vamos abrir um espaço para investigar o que essa ideia pode se tornar. Você não precisa ter todas as respostas agora.</p><form onSubmit={createProject}><label htmlFor="project-name">Como vamos chamar este projeto?</label><input id="project-name" autoFocus placeholder="Nome da marca ou do projeto" value={projectName} onChange={(event) => setProjectName(event.target.value)} required maxLength={80} /><label htmlFor="project-category">Em que universo ele existe? <span>OPCIONAL</span></label><input id="project-category" placeholder="Ex.: alimentação, tecnologia, cultura..." value={category} onChange={(event) => setCategory(event.target.value)} maxLength={100} /><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setShowCreate(false)}>Cancelar</button><button type="submit" className="primary-button">Criar espaço <ArrowRight size={16} /></button></div></form><div className="modal-footnote"><Check size={14} />Você mantém o controle das decisões em todas as etapas.</div></section></div>}
    </div>
  )
}

function ArrowUpRightIcon() {
  return <ArrowDownRight size={17} style={{ transform: 'rotate(-135deg)' }} />
}

export default Workspace
