# BRANDSMITH

Parceiro de branding e direção criativa com IA que questiona o óbvio e conduz a criação de marcas distintas e fundamentadas.

> O óbvio não cria marcas extraordinárias.

## Objetivo

Construir um MVP para apoiar projetos de branding por meio de investigação adaptativa, registro de evidências e hipóteses, decisões persistentes e sínteses validadas pelo usuário.

## Estado do projeto

Fase inicial de estruturação do MVP. As funcionalidades serão desenvolvidas em branches separadas e propostas por pull requests para revisão antes de qualquer merge.


## Persistência em nuvem (preparação)

A migração inicial do Supabase está em `supabase/migrations/20261023000100_create_brand_projects.sql`.
Ela cria a tabela `public.brand_projects` com os campos de trabalho do projeto e políticas de Row Level Security (RLS) para que cada usuário autenticado só possa ler, criar, atualizar ou apagar as próprias linhas.

Antes de habilitar a integração no frontend:

1. Aplique a migração no projeto Supabase destinado ao BRANDSMITH.
2. Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` em `.env.local` para desenvolvimento e nas variáveis do ambiente de publicação.
3. Use somente a chave pública/anon no frontend. Nunca exponha uma chave `service_role`.
4. A sincronização no aplicativo será conectada em uma etapa posterior; até lá, a aplicação continua usando o armazenamento local do navegador.

`.env.example` documenta os nomes das variáveis sem incluir credenciais.
