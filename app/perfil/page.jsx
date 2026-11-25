'use client'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader, Button, Notice, Loading } from '@/components/ui/kit'
export default function Page() {
  const auth = useAuth(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null),
    [message, setMessage] = useState(null)
  async function action(fn, text) {
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      await fn()
      setMessage(text)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  if (!auth.objPerfil)
    return (
      <div className="page">
        <Loading>Obteniendo su perfil…</Loading>
        <Button variant="secondary" onClick={() => auth.obtenerPerfil()}>
          Volver a cargar perfil
        </Button>
      </div>
    )
  return (
    <div className="page">
      <PageHeader
        eyebrow="SU CUENTA"
        title="Mi perfil"
        description="Mantenga sus datos actualizados y proteja el acceso al cuaderno de su olivar."
      />
      {error && <Notice type="error">{error}</Notice>}
      {message && <Notice type="success">{message}</Notice>}
      <div className="form-grid">
        <section className="panel stack">
          <h2>Información personal</h2>
          <p className="muted">{auth.objUsuario?.email}</p>
          <p>
            Rol:{' '}
            {auth.objPerfil.rol === 'agronomo'
              ? 'Agrónomo autorizado'
              : auth.objPerfil.rol === 'admin'
                ? 'Administrador'
                : 'Agricultor'}
          </p>
          <form
            key={auth.objPerfil.id}
            className="stack"
            onSubmit={(e) => {
              e.preventDefault()
              const f = new FormData(e.currentTarget)
              action(
                () => auth.actualizarPerfil(f.get('nombre'), f.get('zona')),
                'Perfil actualizado.',
              )
            }}
          >
            <label htmlFor="profile-name">
              Nombre completo
              <input
                id="profile-name"
                name="nombre"
                defaultValue={auth.objPerfil.nombre}
                maxLength={120}
                required
                autoComplete="name"
              />
            </label>
            <label htmlFor="profile-zone">
              Zona geográfica
              <input
                id="profile-zone"
                name="zona"
                defaultValue={auth.objPerfil.zona_geografica || ''}
                maxLength={120}
              />
            </label>
            <Button disabled={busy}>Guardar datos</Button>
          </form>
        </section>
        <section className="panel stack">
          <h2>Cambiar contraseña</h2>
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault()
              const form = e.currentTarget,
                f = new FormData(form)
              if (f.get('password') !== f.get('repeat')) {
                setError('Las contraseñas no coinciden.')
                return
              }
              action(async () => {
                await auth.cambiarContrasena(f.get('password'))
                form.reset()
              }, 'Contraseña actualizada.')
            }}
          >
            <label htmlFor="profile-password">
              Nueva contraseña
              <input
                id="profile-password"
                name="password"
                type="password"
                minLength={8}
                autoComplete="new-password"
                required
              />
            </label>
            <label htmlFor="profile-repeat">
              Repetir contraseña
              <input
                id="profile-repeat"
                name="repeat"
                type="password"
                minLength={8}
                autoComplete="new-password"
                required
              />
            </label>
            <p className="muted">Use al menos 8 caracteres.</p>
            <Button disabled={busy}>Actualizar contraseña</Button>
          </form>
        </section>
      </div>
    </div>
  )
}
