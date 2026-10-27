import { sanitizeSvg } from "./svg"

interface LogoEnv {
  AI: { run(model: string, input: { messages: Array<{ role: string; content: string }> }): Promise<unknown> }
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } })
const text = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : ""
const ROUTES = ["estrategica", "distintiva", "nao_convencional"] as const

export async function handleLogoConcepts(request: Request, env: LogoEnv): Promise<Response> {
  if (request.method !== "POST") return json({ error: "Método não permitido." }, 405)
  const authorization = request.headers.get("Authorization") || ""
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : ""
  if (!token) return json({ error: "Entre na sua conta para gerar conceitos de logo." }, 401)
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return json({ error: "A integração segura com o Supabase ainda não foi configurada no Worker." }, 503)
  let userResponse: Response
  try { userResponse = await fetch(new URL("/auth/v1/user", env.SUPABASE_URL), { headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: \`Bearer \${token}\` } }) }
  catch { return json({ error: "Não foi possível verificar sua sessão. Tente novamente." }, 502) }
  if (!userResponse.ok) return json({ error: "Sua sessão expirou. Entre novamente e tente de novo." }, 401)
  let payload: Record<string, unknown>
  try { payload = await request.json() as Record<string, unknown> } catch { return json({ error: "O pedido enviado não é um JSON válido." }, 400) }
  const projectName = text(payload.projectName, 160)
  const category = text(payload.category, 160) || "A definir"
  const expression = payload.expression && typeof payload.expression === "object" ? JSON.stringify(payload.expression).slice(0, 3000) : ""
  const direction = payload.direction && typeof payload.direction === "object" ? JSON.stringify(payload.direction).slice(0, 2500) : ""
  const answers = Array.isArray(payload.investigation) ? payload.investigation.slice(0, 6).map(v => text(v, 1200)) : []
  const boldness = Math.min(5, Math.max(1, Number(payload.boldness) || 4))
  if (!projectName || (!expression && !direction)) return json({ error: "Registre a direção estratégica ou a expressão da marca antes de gerar conceitos de logo." }, 400)
  const prompt = [
    "Você é diretor de criação de identidades. Gere EXATAMENTE três conceitos de SÍMBOLO de logo para a marca abaixo, em português brasileiro.",
    "Os três conceitos devem seguir lógicas diferentes, nesta ordem e com estes valores de route: (1) estrategica: a mais alinhada ao mercado e ao público; (2) distintiva: foge claramente dos clichês da categoria; (3) nao_convencional: quebra regra com intenção (espaço negativo, símbolo gerado por regra, forma derivada do nome ou do processo, sistema modular etc.).",
    \`Nível de ousadia pedido: \${boldness} de 5. O conceito nao_convencional nunca fica abaixo de 3.\`,
    "TESTE ANTI-BIBLIOTECA: rejeite símbolos genéricos (lâmpada, folha, globo, engrenagem, escudo, coração, aperto de mão, seta ascendente) a menos que subvertidos com ideia clara. Em antiLibrary explique o que torna o símbolo específico DESTA marca.",
    "Não invente fatos, pesquisa, concorrentes ou validação. Fundamente cada conceito no material recebido e diga o risco real de cada um.",
    "Cada conceito tem um campo svg com SVG de símbolo: viewBox=\"0 0 400 400\", apenas elementos svg, g, path, circle, ellipse, rect, line, polyline, polygon; sem text, style, script, image, use, gradientes ou filtros; geometria simples e legível em 32px.",
    "Retorne SOMENTE JSON válido com concepts: três objetos com route, name, idea, rationale, antiLibrary, risk e svg.",
    \`MARCA: \${projectName}\`, \`CATEGORIA: \${category}\`, "RESPOSTAS DA INVESTIGAÇÃO:", ...answers.map((v, i) => \`\${i + 1}. \${v || "Não informado"}\`),
    \`DIREÇÃO ESTRATÉGICA: \${direction || "Não registrada"}\`, \`EXPRESSÃO DA MARCA: \${expression || "Não registrada"}\`,
  ].join("\n\n")
  try {
    const result = await env.AI.run("@cf/zai-org/glm-4.7-flash", { messages: [
      { role: "system", content: "Você é um diretor criativo rigoroso. Desafie o óbvio, não invente evidências e entregue geometria SVG simples e válida." },
      { role: "user", content: prompt },
    ] })
    const output = result && typeof result === "object" ? result as Record<string, unknown> : {}
    const choices = Array.isArray(output.choices) ? output.choices : []
    const first = choices[0] && typeof choices[0] === "object" ? choices[0] as Record<string, unknown> : {}
    const message = first.message && typeof first.message === "object" ? first.message as Record<string, unknown> : {}
    const raw = [output.response, output.output_text, output.generated_text, message.content, first.text].find(v => typeof v === "string" && v.trim())
    if (typeof raw !== "string") return json({ error: "A IA não retornou conceitos em texto. Tente novamente." }, 502)
    const cleaned = raw.trim().replace(/^\x60{3}(?:json)?\s*/i, "").replace(/\s*\x60{3}$/, "")
    let parsed: unknown
    try { parsed = JSON.parse(cleaned) } catch {
      const start = cleaned.indexOf("{"), end = cleaned.lastIndexOf("}")
      if (start < 0 || end <= start) return json({ error: "A resposta da IA não veio em formato estruturado. Tente novamente." }, 502)
      try { parsed = JSON.parse(cleaned.slice(start, end + 1)) } catch { return json({ error: "A resposta da IA não veio em JSON válido. Tente novamente." }, 502) }
    }
    const list = parsed && typeof parsed === "object" && Array.isArray((parsed as { concepts?: unknown }).concepts) ? (parsed as { concepts: unknown[] }).concepts : []
    const concepts = list.slice(0, 3).map((item, index) => {
      const entry = item && typeof item === "object" ? item as Record<string, unknown> : {}
      return { route: ROUTES[index], name: text(entry.name, 120), idea: text(entry.idea, 800), rationale: text(entry.rationale, 1200), antiLibrary: text(entry.antiLibrary, 800), risk: text(entry.risk, 800), svg: sanitizeSvg(entry.svg) }
    })
    if (concepts.length !== 3 || concepts.some(c => !c.name || !c.idea || !c.rationale || !c.antiLibrary || !c.risk)) return json({ error: "A IA não retornou três conceitos completos. Tente novamente." }, 502)
    return json({ concepts })
  } catch (error) {
    console.error("Workers AI logo concepts request failed", error instanceof Error ? { name: error.name, message: error.message } : { message: String(error) })
    return json({ error: "Não foi possível gerar os conceitos de logo. Tente novamente." }, 502)
  }
}
