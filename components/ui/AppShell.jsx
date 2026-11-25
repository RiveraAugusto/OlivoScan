'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Sprout,
  LayoutDashboard,
  ScanLine,
  MapPin,
  History,
  ClipboardCheck,
  BookOpen,
  ArrowLeftRight,
  UserRound,
  ShieldCheck,
  Menu,
  LogOut,
  Plus,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import NotificationBell from './NotificationBell'
import { Modal, Loading, Notice } from './kit'
const primary = [
  ['/dashboard', 'Panel', LayoutDashboard],
  ['/analisis', 'Analizar', ScanLine],
  ['/parcelas', 'Parcelas', MapPin],
  ['/historial', 'Historial', History],
  ['/revisiones', 'Revisiones', ClipboardCheck],
]
const secondary = [
  ['/catalogo', 'Catálogo', BookOpen],
  ['/comparar', 'Comparar muestras', ArrowLeftRight],
  ['/perfil', 'Mi perfil', UserRound],
]
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="OlivoScan inicio">
      <span className="brand-mark">
        <Sprout size={26} />
      </span>
      OlivoScan
    </Link>
  )
}
export default function AppShell({ children }) {
  const path = usePathname(),
    router = useRouter(),
    { objUsuario, objPerfil, cargando, cerrarSesion } = useAuth()
  const [menu, setMenu] = useState(false),
    [error, setError] = useState(null)
  const publicPage = path === '/' || path === '/login' || path.startsWith('/analisis/compartido')
  useEffect(() => {
    if (!publicPage && !cargando && !objUsuario)
      router.replace('/login?next=' + encodeURIComponent(path))
  }, [publicPage, cargando, objUsuario, path, router])
  const links = [
    ...primary,
    ...secondary,
    ...(objPerfil?.rol === 'admin' ? [['/administracion', 'Administración', ShieldCheck]] : []),
  ]
  function nav(items, close = false) {
    return items.map(([href, label, Icon]) => (
      <Link
        key={href}
        href={href}
        className="nav-link"
        aria-current={path === href || path.startsWith(href + '/') ? 'page' : undefined}
        onClick={() => close && setMenu(false)}
      >
        <Icon size={21} />
        {label}
      </Link>
    ))
  }
  async function logout() {
    setError(null)
    try {
      await cerrarSesion()
      router.replace('/login')
    } catch (e) {
      setError(e.message)
    }
  }
  if (publicPage)
    return (
      <>
        <a className="skip-link" href="#contenido">
          Ir al contenido
        </a>
        <header className="public-header">
          <Brand />
          <Link className="btn btn-secondary" href={objUsuario ? '/dashboard' : '/login'}>
            {objUsuario ? 'Mi panel' : 'Iniciar sesión'}
          </Link>
        </header>
        <main id="contenido">{children}</main>
        <footer className="app-footer">OlivoScan · La Aceitunera · Ilo, Moquegua</footer>
      </>
    )
  if (!objUsuario)
    return (
      <main id="contenido" className="page">
        <Loading>Comprobando su sesión…</Loading>
      </main>
    )
  return (
    <div className="workspace">
      <a className="skip-link" href="#contenido">
        Ir al contenido
      </a>
      <aside className="sidebar">
        <Brand />
        <nav aria-label="Navegación principal">{nav(primary)}</nav>
        <nav aria-label="Herramientas">{nav(links.slice(primary.length))}</nav>
        <div className="stack" style={{ marginTop: 'auto' }}>
          <p className="muted">
            La Aceitunera
            <br />
            Ilo, Moquegua
          </p>
          <button className="nav-link" onClick={logout}>
            <LogOut size={21} />
            Cerrar sesión
          </button>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="topbar">
          <div className="desktop-only muted">Cuaderno de diagnóstico del olivar</div>
          <div className="mobile-only">
            <Brand />
          </div>
          <div className="actions">
            <NotificationBell />
            <div className="desktop-only actions">
              <span className="avatar" aria-hidden="true">
                {objPerfil?.nombre?.charAt(0) || 'O'}
              </span>
              <div>
                <strong>{objPerfil?.nombre || 'Mi cuenta'}</strong>
                <div className="muted">
                  {objPerfil?.rol === 'agronomo'
                    ? 'Agrónomo autorizado'
                    : objPerfil?.rol === 'admin'
                      ? 'Administración'
                      : 'Responsable del cultivo'}
                </div>
              </div>
            </div>
            <Link href="/analisis" className="btn btn-primary desktop-only">
              <Plus size={20} />
              Nuevo análisis
            </Link>
            <button
              className="btn btn-secondary btn-icon mobile-only"
              aria-label="Abrir menú"
              onClick={() => setMenu(true)}
            >
              <Menu size={22} />
            </button>
          </div>
        </header>
        {error && (
          <div className="page">
            <Notice type="error">{error}</Notice>
          </div>
        )}
        <main id="contenido">{children}</main>
        <footer className="app-footer">
          Apoyo preliminar al diagnóstico. Las decisiones requieren revisión agronómica.
        </footer>
      </div>
      <nav className="bottom-nav" aria-label="Navegación móvil">
        {primary.map(([href, label, Icon]) => (
          <Link
            key={href}
            href={href}
            aria-current={path === href || path.startsWith(href + '/') ? 'page' : undefined}
          >
            <Icon size={22} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <Modal open={menu} onClose={() => setMenu(false)} title="Menú de OlivoScan">
        <nav aria-label="Todas las secciones">{nav(links, true)}</nav>
        <button className="nav-link" onClick={logout}>
          <LogOut size={20} />
          Cerrar sesión
        </button>
      </Modal>
    </div>
  )
}
