'use client'
import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { AlertCircle, CheckCircle2, Info, Leaf, LoaderCircle, X } from 'lucide-react'
export function Button({ children, variant = 'primary', className = '', ...props }) {
  return (
    <button className={'btn btn-' + variant + ' ' + className} {...props}>
      {children}
    </button>
  )
}
export function ActionLink({ children, href, variant = 'primary', ...props }) {
  return (
    <Link href={href} className={'btn btn-' + variant} {...props}>
      {children}
    </Link>
  )
}
export function PageHeader({ eyebrow, title, description, action }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <div className="kicker">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </header>
  )
}
export function Notice({ children, type = 'info' }) {
  const Icon = type === 'error' ? AlertCircle : type === 'success' ? CheckCircle2 : Info
  return (
    <div className={'notice notice-' + type} role={type === 'error' ? 'alert' : 'status'}>
      <Icon size={20} />
      <div>{children}</div>
    </div>
  )
}
export function Loading({ children = 'Cargando información…' }) {
  return (
    <div className="panel empty" role="status">
      <LoaderCircle className="animate-spin" size={28} />
      <p>{children}</p>
    </div>
  )
}
export function Empty({ title = 'Todavía no hay registros', children, action }) {
  return (
    <div className="empty">
      <Leaf size={32} />
      <h2>{title}</h2>
      {children && <p className="muted">{children}</p>}
      {action}
    </div>
  )
}
export function Modal({ open, onClose, title, children }) {
  const ref = useRef(null)
  useEffect(() => {
    const dialog = ref.current
    if (open && !dialog.open) {
      dialog.showModal()
      dialog
        .querySelector(
          'input:not([type="hidden"]):not(:disabled),select:not(:disabled),textarea:not(:disabled)',
        )
        ?.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])
  return (
    <dialog ref={ref} className="dialog" aria-label={title} onCancel={onClose} onClose={onClose}>
      <div className="dialog-header">
        <h2>{title}</h2>
        <Button
          type="button"
          variant="secondary"
          className="btn-icon"
          aria-label="Cerrar diálogo"
          onClick={onClose}
        >
          <X size={20} />
        </Button>
      </div>
      {open && children}
    </dialog>
  )
}
export function StatusTag({ state }) {
  const labels = {
    pendiente: 'Pendiente de asignación o inicio',
    en_revision: 'En revisión',
    revisada: 'Revisión emitida',
    cancelada: 'Cancelada',
    sin_solicitud: 'Sin revisión profesional',
    sano: 'Sin signos visibles',
    posible_afeccion: 'Posible afección',
    no_reconocido: 'No reconocido',
    leve: 'Leve',
    moderado: 'Moderado',
    grave: 'Grave',
    no_aplica: 'No aplica',
  }
  const style = ['grave'].includes(state)
    ? 'danger'
    : ['pendiente', 'en_revision', 'no_reconocido', 'moderado'].includes(state)
      ? 'warning'
      : ['revisada', 'sano'].includes(state)
        ? 'success'
        : ''
  return <span className={'tag tag-' + style}>{labels[state] || state}</span>
}
export const fecha = (value) =>
  value
    ? new Intl.DateTimeFormat('es-PE', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'America/Lima',
      }).format(new Date(value))
    : 'Sin fecha'
