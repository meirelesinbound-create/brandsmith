import { useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { ArrowRight, Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

type AuthScreenProps = {
  onAuthenticated: (session: Session | null) => void
}

export default function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) {
      setError('A conexão com o Supabase não está configurada neste ambiente.')
      return
    }
    setBusy(true)
    setError('')
    setMessage('')
    try {
      if (mode === 'signup') {
        const { data, error: authError } = await supabase.auth.signUp({ email: email.trim(), password })
        if (authError) throw authError
        if (data.session) {
          onAuthenticated(data.session)
        } else {
          setMessage('Conta criada. Confira seu e-mail para confirmar o cadastro e depois entre no BRANDSMITH.')
        }
      } else {
        const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (authError) throw authError
        onAuthenticated(data.session)
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível autenticar. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-panel" aria-labelledby="auth-title">
        <span className="auth-brand">BRANDSMITH<span>.</span></span>
        <div className="auth-eyebrow"><span /> ESPAÇO CRIATIVO PESSOAL</div>
        <h1 id="auth-title">{mode === 'signin' ? <>Seu próximo projeto<br /><em>começa aqui.</em></> : <>Abra seu espaço<br /><em>de criação.</em></>}</h1>
        <p className="auth-intro">Entre para continuar explorando ideias, investigar oportunidades e construir marcas com personalidade própria.</p>
        <form className="auth-form" onSubmit={submit}>
          <label htmlFor="auth-email">E-MAIL</label>
          <input id="auth-email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="voce@exemplo.com" required maxLength={254} />
          <label htmlFor="auth-password">SENHA</label>
          <div className="auth-password">
            <input id="auth-password" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} value={password} onChange={event => setPassword(event.target.value)} placeholder={mode === 'signup' ? 'Mínimo de 6 caracteres' : 'Sua senha'} required minLength={6} />
            <button type="button" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
          </div>
          {error && <p className="auth-feedback error" role="alert">{error}</p>}
          {message && <p className="auth-feedback success" role="status">{message}</p>}
          <button className="auth-submit" type="submit" disabled={busy}>{busy ? <><LoaderCircle className="auth-spinner" size={16} /> Aguarde…</> : <>{mode === 'signin' ? 'Entrar no BRANDSMITH' : 'Criar conta'} <ArrowRight size={16} /></>}</button>
        </form>
        <p className="auth-switch">{mode === 'signin' ? 'Ainda não tem uma conta?' : 'Já tem uma conta?'} <button type="button" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setMessage('') }}>{mode === 'signin' ? 'Criar conta' : 'Entrar'}</button></p>
        <div className="auth-footnote">O óbvio não cria marcas extraordinárias.</div>
      </section>
    </main>
  )
}
