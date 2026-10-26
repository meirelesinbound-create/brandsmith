interface Env {
  AI: {
    run(model: string, input: { messages: Array<{ role: string; content: string }> }): Promise<unknown>
  }
  ASSETS: { fetch(request: Request): Promise<Response> }
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
})

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname !== "/api/strategy") return env.ASSETS.fetch(request)
    if (request.method !== "POST") return json({ error: "Método não permitido." }, 405)

    const authorization = request.headers.get("Authorization") || ""
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : ""
    if (!token) return json({ error: "Entre na sua conta para usar a análise estratégica." }, 401)
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
      // Never log secret values; record only whether each runtime binding is present.
      console.error("Missing Supabase runtime binding", {
        hasSupabaseUrl: typeof env.SUPABASE_URL === "string" && env.SUPABASE_URL.length > 0,
        hasSupabaseAnonKey: typeof env.SUPABASE_ANON_KEY === "string" && env.SUPABASE_ANON_KEY.length > 0,
      })
      return json({ error: "A integração segura com o Supabase ainda não foi configurada no Worker." }, 503)
    }

    let userResponse: Response
    try {
      userResponse = await fetch(new URL("/auth/v1/user", env.SUPABASE_URL), {
        headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
      })
    } catch {
      return json({ error: "Não foi possível verificar sua sessão. Tente novamente." }, 502)
    }
    if (!userResponse.ok) return json({ error: "Sua sessão expirou. Entre novamente e tente de novo." }, 401)

    let payload: { projectName?: unknown; category?: unknown; answers?: unknown; existingNotes?: unknown }
    try {
      payload = await request.json() as typeof payload
    } catch {
      return json({ error: "O pedido enviado não é um JSON válido." }, 400)
    }
    const projectName = typeof payload.projectName === "string" ? payload.projectName.trim().slice(0, 160) : ""
    const category = typeof payload.category === "string" ? payload.category.trim().slice(0, 160) : "A definir"
    const answers = Array.isArray(payload.answers)
      ? payload.answers.slice(0, 6).map(value => typeof value === "string" ? value.trim().slice(0, 2500) : "")
      : []
    const existingNotes = typeof payload.existingNotes === "string" ? payload.existingNotes.trim().slice(0, 5000) : ""
    if (!projectName || !answers.some(Boolean)) {
      return json({ error: "Informe o nome do projeto e ao menos uma resposta da investigação." }, 400)
    }

    const prompt = [
      "Você é BRANDSMITH, estrategista sênior de marcas. Trabalhe em português brasileiro, com rigor, clareza e pensamento crítico.",
      "Sua tarefa é transformar respostas iniciais em uma análise estratégica útil para discussão — não apenas reorganizar nem aprovar o que foi dito.",
      "Não invente dados de mercado, pesquisas, concorrentes ou fatos externos. Diferencie explicitamente: RELATO DO PROJETO, EVIDÊNCIA APRESENTADA, INFERÊNCIA e HIPÓTESE A VALIDAR.",
      "Aponte contradições e lacunas sem tratar ausência de informação como prova. Se houver pouca informação, produza uma análise preliminar honesta e faça perguntas específicas.",
      "Não use clichês de branding, adjetivos genéricos ou slogans vazios. Fundamente cada recomendação nas respostas fornecidas e explique o raciocínio.",
      "Entregue Markdown com estas seções: 1) LEITURA CENTRAL; 2) O QUE SABEMOS (separando relatos e evidências); 3) INFERÊNCIAS E POR QUÊ; 4) TENSÕES E CONTRADIÇÕES; 5) PÚBLICO E SITUAÇÃO DE USO (inclua o que não sabemos); 6) OPORTUNIDADES ESTRATÉGICAS (3 caminhos distintos, com benefício, risco e condição de validade); 7) HIPÓTESE DE POSICIONAMENTO (rascunho, não decisão); 8) PROPOSTA DE VALOR E DIFERENCIAÇÃO (hipóteses); 9) PERSONALIDADE E PRINCÍPIOS DE VOZ preliminares; 10) TERRITÓRIO VISUAL preliminar, apenas se houver sinais suficientes; 11) PERGUNTAS PRIORITÁRIAS; 12) PRÓXIMOS TESTES CONCRETOS.",
      "Feche com uma recomendação provisória que explicite o que fazer primeiro e qual evidência mudaria sua opinião. Não diga que algo foi validado ou aprovado.",
      `PROJETO: ${projectName}`,
      `CATEGORIA: ${category || "A definir"}`,
      "RESPOSTAS DA INVESTIGAÇÃO (a ordem corresponde às perguntas do roteiro):",
      `1. O que está sendo construído: ${answers[0] || "Não informado"}`,
      `2. Por que precisa existir: ${answers[1] || "Não informado"}`,
      `3. Para quem e em que situação: ${answers[2] || "Não informado"}`,
      `4. Evidências/observações disponíveis: ${answers[3] || "Não informado"}`,
      `5. Preferências e limites declarados: ${answers[4] || "Não informado"}`,
      `6. Hipóteses que o usuário quer verificar: ${answers[5] || "Não informado"}`,
      `NOTAS HUMANAS DE INTERPRETAÇÃO JÁ REGISTRADAS: ${existingNotes || "Nenhuma"}`,
    ].join("\n\n")

    try {
      const result = await env.AI.run("@cf/zai-org/glm-4.7-flash", {
        messages: [
          { role: "system", content: "Seja um parceiro estratégico exigente, transparente sobre incerteza e orientado a decisões úteis. Não confunda relato com evidência." },
          { role: "user", content: prompt },
        ],
      })
      const output = result && typeof result === "object" ? result as Record<string, unknown> : {}
      const choices = Array.isArray(output.choices) ? output.choices : []
      const firstChoice = choices[0] && typeof choices[0] === "object"
        ? choices[0] as Record<string, unknown>
        : {}
      const message = firstChoice.message && typeof firstChoice.message === "object"
        ? firstChoice.message as Record<string, unknown>
        : {}
      const candidates = [
        output.response,
        output.output_text,
        output.generated_text,
        message.content,
        firstChoice.text,
      ]
      const analysis = candidates.find(value => typeof value === "string" && value.trim().length > 0)
      if (typeof analysis !== "string") {
        console.error("Workers AI returned no usable text", {
          resultKeys: Object.keys(output),
          responseType: typeof output.response,
          responseLength: typeof output.response === "string" ? output.response.length : null,
          choiceCount: choices.length,
          finishReason: firstChoice.finish_reason ?? firstChoice.finishReason ?? null,
        })
        return json({ error: "O modelo de IA respondeu sem texto. Tente novamente; se persistir, consulte os logs do Worker." }, 502)
      }
      return json({ analysis: analysis.trim() })
    } catch (error) {
      // Keep the underlying provider error in Worker logs so configuration/model
      // failures can be diagnosed without exposing internals to the browser.
      const details = error instanceof Error
        ? { name: error.name, message: error.message }
        : { message: String(error) }
      console.error("Workers AI strategy request failed", details)
      return json({
        error: "A análise por IA falhou ao consultar o modelo. Consulte os logs do Worker para identificar a causa.",
      }, 502)
    }
  },
}
