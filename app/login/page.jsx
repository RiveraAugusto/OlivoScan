'use client'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button, Notice, PageHeader, Loading } from '@/components/ui/kit'
function Login() {
  const auth = useAuth(),
    router = useRouter(),
    params = useSearchParams()
  const [choice, setMode] = useState('login'),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(null),
    [error, setError] = useState(null)
  const mode = auth.recuperando ? 'password' : choice
  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setMessage(null)
    const f = new FormData(event.currentTarget),
      email = f.get('email'),
      password = f.get('password')
    try {
      if (mode === 'reset') {
        await auth.recuperarContrasena(email)
        setMessage(
          'Si el correo corresponde a una cuenta, recibirá un enlace para restablecer su contraseña.',
        )
      } else if (mode === 'signup') {
        const data = await auth.registrarse(email, password, f.get('nombre'), f.get('zona'))
        if (data.session) router.replace('/parcelas')
        else setMessage('Revise su correo para confirmar el registro y después inicie sesión.')
      } else if (mode === 'password') {
        await auth.cambiarContrasena(password)
        router.replace('/dashboard')
      } else {
        await auth.iniciarSesion(email, password)
        const next = params.get('next')
        router.replace(next?.startsWith('/') && !next.startsWith('//') ? next : '/dashboard')
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="page" style={{ maxWidth: 600 }}>
      <PageHeader
        eyebrow="BIENVENIDO AL OLIVAR"
        title={
          mode === 'signup'
            ? 'Crear su cuenta'
            : mode === 'reset'
              ? 'Recuperar el acceso'
              : mode === 'password'
                ? 'Elegir nueva contraseña'
                : 'Iniciar sesión'
        }
        description="Sus fotografías y diagnósticos son privados."
      />
      <div className="panel stack">
        {error && <Notice type="error">{error}</Notice>}
        {message && <Notice type="success">{message}</Notice>}
        <form className="stack" onSubmit={submit}>
          {mode === 'signup' && (
            <>
              <label htmlFor="nombre">
                Nombre completo
                <input id="nombre" name="nombre" autoComplete="name" maxLength={120} required />
              </label>
              <label htmlFor="zona">
                Zona geográfica
                <input id="zona" name="zona" maxLength={120} placeholder="Por ejemplo, Ilo" />
              </label>
            </>
          )}
          {mode !== 'password' && (
            <label htmlFor="email">
              Correo electrónico
              <input id="email" name="email" type="email" autoComplete="email" required />
            </label>
          )}
          {mode !== 'reset' && (
            <label htmlFor="password">
              Contraseña
              <input
                id="password"
                name="password"
                type="password"
                minLength={mode === 'login' ? 1 : 8}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
              />
              {mode !== 'login' && <span className="muted">Utilice al menos 8 caracteres.</span>}
            </label>
          )}
          <Button disabled={busy}>
            {busy
              ? 'Procesando…'
              : mode === 'signup'
                ? 'Crear cuenta'
                : mode === 'reset'
                  ? 'Enviar enlace'
                  : mode === 'password'
                    ? 'Guardar contraseña'
                    : 'Entrar a mi panel'}
          </Button>
        </form>
        {mode !== 'password' && (
          <div className="actions">
            <Button
              variant="secondary"
              onClick={() => {
                setMode(mode === 'signup' ? 'login' : 'signup')
                setMessage(null)
                setError(null)
              }}
            >
              {mode === 'signup' ? 'Ya tengo una cuenta' : 'Crear una cuenta'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setMode(mode === 'reset' ? 'login' : 'reset')
                setMessage(null)
                setError(null)
              }}
            >
              {mode === 'reset' ? 'Volver a iniciar sesión' : 'Olvidé mi contraseña'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <Login />
    </Suspense>
  )
}
