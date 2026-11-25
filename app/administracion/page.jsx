'use client'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useResource } from '@/hooks/useResource'
import { api } from '@/lib/client-api'
import { PageHeader, Notice, Loading, Button } from '@/components/ui/kit'
function ProfileRole({ profile, onSave }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(null)
  async function submit(e) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setBusy(true)
    setError(null)
    try {
      await onSave({
        usuario_id: profile.id,
        rol: f.get('rol'),
        gestionar_catalogo: f.get('catalogo') === 'on',
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <article className="panel stack">
      <h2>{profile.nombre}</h2>
      <p className="muted">ID: {profile.id}</p>
      {error && <Notice type="error">{error}</Notice>}
      {profile.rol === 'admin' ? (
        <p className="tag">Administrador · gestión fuera de esta pantalla</p>
      ) : (
        <form className="stack" onSubmit={submit}>
          <label htmlFor={'role-' + profile.id}>
            Rol
            <select id={'role-' + profile.id} name="rol" defaultValue={profile.rol}>
              <option value="agricultor">Agricultor</option>
              <option value="agronomo">Agrónomo autorizado</option>
            </select>
          </label>
          <label className="checkbox-label">
            <input name="catalogo" type="checkbox" defaultChecked={profile.gestionar_catalogo} />
            Autorizar gestión del catálogo (permiso independiente)
          </label>
          <Button disabled={busy}>
            {busy ? 'Guardando…' : 'Guardar permisos de ' + profile.nombre}
          </Button>
        </form>
      )}
    </article>
  )
}
export default function Page() {
  const { objPerfil, cargando } = useAuth(),
    resource = useResource(objPerfil?.rol === 'admin' ? '/api/administracion' : null),
    [message, setMessage] = useState(null)
  if (cargando || !objPerfil)
    return (
      <div className="page">
        <Loading />
      </div>
    )
  if (objPerfil.rol !== 'admin')
    return (
      <div className="page">
        <Notice type="error">Esta sección requiere un administrador autorizado.</Notice>
      </div>
    )
  return (
    <div className="page">
      <PageHeader
        eyebrow="ACCESOS DEL EQUIPO"
        title="Administración"
        description="Autorice especialistas y otorgue por separado el permiso para gestionar el catálogo."
      />
      <Notice>
        Verifique la identidad y acreditación profesional antes de otorgar el rol de agrónomo. El
        sistema registra la autorización; no verifica por sí mismo las credenciales profesionales.
      </Notice>
      {resource.error && <Notice type="error">{resource.error}</Notice>}
      {message && <Notice type="success">{message}</Notice>}
      {resource.loading ? (
        <Loading />
      ) : (
        <div className="grid-cards">
          {(resource.data || []).map((p) => (
            <ProfileRole
              key={p.id + '-' + p.rol + '-' + p.gestionar_catalogo}
              profile={p}
              onSave={async (body) => {
                await api('/api/administracion', { method: 'PATCH', body })
                setMessage('Permisos actualizados y auditados.')
                resource.reload()
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
