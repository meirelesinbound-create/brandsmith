import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import AuthScreen from './components/AuthScreen'
import Workspace from './Workspace'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    let active = true
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (error) console.error('Falha ao recuperar a sessão do BRANDSMITH.', error)
      setSession(data.session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  if (!isSupabaseConfigured) {
    return (
      <div className="app-shell">
        <main className="main-area">
          <div className="page-content">
            <section className="welcome-block">
              <div className="eyebrow"><span className="eyebrow-line" />ESTÚDIO DE BRANDING COM IA</div>
              <h1>O óbvio não cria<br /><em>marcas extraordinárias.</em></h1>
              <p>A conexão com a conta ainda não foi configurada neste ambiente. Configure as variáveis públicas do Supabase para ativar a autenticação. Nenhuma credencial secreta deve ser adicionada ao frontend.</p>
            </section>
          </div>
        </main>
      </div>
    )
  }

  if (loading) {
    return <div className="auth-screen"><div className="auth-panel"><span className="auth-brand">BRANDSMITH<span>.</span></span><p>Preparando seu espaço criativo…</p></div></div>
  }

  if (!session) return <AuthScreen onAuthenticated={setSession} />
  return <Workspace />
}
