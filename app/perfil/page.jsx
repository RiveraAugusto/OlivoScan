// ============================================================
// ARCHIVO: app/perfil/page.jsx
// MODULO: Perfil
// DESCRIPCION: Pagina de perfil de usuario. Permite gestionar
//              los datos de la cuenta y seguridad.
// SPRINT: 1
// RF: RF-010
// ============================================================

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import ClsPerfilFormulario from '@/components/perfil/PerfilFormulario'
import ClsPerfilCambiarContrasena from '@/components/perfil/PerfilCambiarContrasena'
import { User, Shield, Sprout } from 'lucide-react'

function ClsPerfilPage() {
  const { objUsuario, objPerfil, actualizarPerfil, cambiarContrasena, cargando } = useAuth()
  const router = useRouter()

  // Proteger la ruta: si no esta autenticado y termino de cargar, redirigir a login
  useEffect(() => {
    if (!cargando && !objUsuario) {
      router.push('/login')
    }
  }, [objUsuario, cargando, router])

  // Mostrar un indicador de carga premium mientras se inicializa la sesion
  if (cargando || !objUsuario) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
        <Sprout className="w-12 h-12 text-olive-500 animate-bounce" />
        <p className="mt-4 text-sm font-medium text-olive-700">
          Cargando perfil, por favor espere...
        </p>
      </div>
    )
  }

  // Formatear la fecha de creacion para mostrarla de forma legible
  const fechaRegistro = objPerfil?.creado_en
    ? new Date(objPerfil.creado_en).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'No disponible'

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      {/* Encabezado del Perfil */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-glass border border-olive-100 mb-8 flex flex-col sm:flex-row items-center gap-6">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-olive-500 text-white font-bold text-2xl border-4 border-olive-100 shadow-sm shrink-0">
          {objPerfil?.nombre ? objPerfil.nombre.charAt(0).toUpperCase() : objUsuario.email.charAt(0).toUpperCase()}
        </div>
        <div className="text-center sm:text-left">
          <h2 className="text-2xl font-bold text-olive-950">
            {objPerfil?.nombre || 'Usuario de OlivoScan'}
          </h2>
          <p className="text-sm text-olive-600 font-medium">
            {objUsuario.email}
          </p>
          <p className="text-xs text-olive-500 mt-1">
            Miembro desde el {fechaRegistro}
          </p>
        </div>
      </div>

      {/* Secciones de Formularios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Lado Izquierdo: Informacion del Perfil */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-olive-900 font-bold px-1">
            <User className="w-5 h-5 text-olive-500" />
            <span>Información de Contacto</span>
          </div>
          <ClsPerfilFormulario
            objPerfil={objPerfil}
            actualizarPerfil={actualizarPerfil}
          />
        </div>

        {/* Lado Derecho: Seguridad de la Cuenta */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-olive-900 font-bold px-1">
            <Shield className="w-5 h-5 text-olive-500" />
            <span>Seguridad</span>
          </div>
          <ClsPerfilCambiarContrasena
            cambiarContrasena={cambiarContrasena}
          />
        </div>
      </div>
    </div>
  )
}

export default ClsPerfilPage
