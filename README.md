# BRANDSMITH

Parceiro de branding e direção criativa com IA que questiona o óbvio e conduz a criação de marcas distintas e fundamentadas.

> O óbvio não cria marcas extraordinárias.

## Objetivo

Construir um MVP para apoiar projetos de branding por meio de investigação adaptativa, registro de evidências e hipóteses, decisões persistentes e sínteses validadas pelo usuário.

## Estado do projeto

As funcionalidades são desenvolvidas em branches separadas e propostas por pull requests para revisão antes de qualquer merge.

## Persistência em nuvem

A migração inicial do Supabase está em `supabase/migrations/20261023000100_create_brand_projects.sql`.
Ela cria a tabela `public.brand_projects` com os campos de trabalho do projeto e políticas de Row Level Security (RLS) para que cada usuário autenticado só possa ler, criar, atualizar ou apagar as próprias linhas.

### Configuração

1. Aplique a migração no projeto Supabase destinado ao BRANDSMITH usando o SQL Editor do projeto.
2. Copie `.env.example` para `.env.local` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` com os dados do painel **Connect** ou **Settings → API Keys**.
3. Para hospedagem, configure essas mesmas variáveis no ambiente de build/publicação.
4. Use somente a chave pública/publishable (ou anon legada) no frontend. Nunca exponha uma chave `secret` ou `service_role`.

O cliente Supabase fica centralizado em `src/lib/supabase.ts`. Com as variáveis configuradas e a migração SQL aplicada, a aplicação exige autenticação e sincroniza projetos, respostas da investigação, notas de interpretação e direção estratégica. No primeiro acesso de uma conta sem projetos na nuvem, os dados existentes no navegador são migrados para essa conta; os dados locais não são apagados. Se já houver projetos na nuvem, eles são carregados como fonte principal. Faça um backup JSON antes de testar em um navegador com trabalho importante.


## Análise estratégica com IA (Cloudflare Workers AI)

A etapa **Interpretar** pode gerar uma análise fundamentada das respostas da investigação. A análise é um rascunho para revisão: distingue relatos, evidências apresentadas, inferências e hipóteses; aponta tensões e lacunas; propõe caminhos estratégicos e próximos testes. O usuário continua responsável por revisar e decidir. O resultado é salvo nas notas de interpretação e passa a integrar o dossiê exportado.

### Configuração do Worker

O endpoint `POST /api/strategy` roda no mesmo domínio da aplicação. O token de sessão é validado no Supabase antes de chamar o modelo; a chave não é colocada no frontend.

1. No projeto Cloudflare Workers do BRANDSMITH, habilite o **Workers AI** e mantenha o binding `AI` definido em `wrangler.jsonc`.
2. Configure `SUPABASE_URL` com a URL do projeto Supabase usado pelo BRANDSMITH.
3. Configure `SUPABASE_ANON_KEY` com a chave pública/publishable (ou anon legada) desse mesmo projeto. Para deploy por Wrangler, use `wrangler secret put SUPABASE_URL` e `wrangler secret put SUPABASE_ANON_KEY`; em deploy pelo painel, cadastre os valores nas configurações do Worker. Nunca use uma chave `service_role` ou `secret`.
4. Publique o Worker junto com os assets estáticos. A configuração faz as rotas `/api/*` passarem pelo Worker e entrega as demais rotas ao site estático.
5. Para desenvolvimento local, use `wrangler dev` com um arquivo local `.dev.vars` contendo as duas variáveis; não versione esse arquivo.

Se o binding ou as variáveis não estiverem configurados, a interface exibirá o erro retornado pelo endpoint em vez de simular uma análise. O modelo atual é `@cf/zai-org/glm-4.7-flash` (definido em `worker/index.ts`); disponibilidade e limites dependem da conta Cloudflare.
