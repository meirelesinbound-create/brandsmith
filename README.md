# BRANDSMITH

Parceiro de branding e direção criativa com IA que questiona o óbvio e conduz a criação de marcas distintas e fundamentadas.

> O óbvio não cria marcas extraordinárias.

## Objetivo

Construir um MVP para apoiar projetos de branding por meio de investigação adaptativa, registro de evidências e hipóteses, decisões persistentes e sínteses validadas pelo usuário.

## Estado do projeto

As funcionalidades são desenvolvidas em branches separadas e propostas por pull requests para revisão antes de qualquer merge.

## Persistência em nuvem (preparação)

A migração inicial do Supabase está em `supabase/migrations/20261023000100_create_brand_projects.sql`.
Ela cria a tabela `public.brand_projects` com os campos de trabalho do projeto e políticas de Row Level Security (RLS) para que cada usuário autenticado só possa ler, criar, atualizar ou apagar as próprias linhas.

### Configuração

1. Aplique a migração no projeto Supabase destinado ao BRANDSMITH usando o SQL Editor do projeto.
2. Copie `.env.example` para `.env.local` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` com os dados do painel **Connect** ou **Settings → API Keys**.
3. Para hospedagem, configure essas mesmas variáveis no ambiente de build/publicação.
4. Use somente a chave pública/publishable (ou anon legada) no frontend. Nunca exponha uma chave `secret` ou `service_role`.

O cliente Supabase agora tem configuração centralizada em `src/lib/supabase.ts`. A aplicação continua usando o armazenamento local até que a autenticação e a sincronização sejam conectadas nas próximas etapas; configurar o cliente, por si só, não migra nem sincroniza dados.
