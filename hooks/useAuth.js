'use client'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
const Context = createContext({})
function authMessage(error) {
  const text = (error?.message || '').toLowerCase()
  if (text.includes('email not confirmed')) return 'Confirme su correo antes de iniciar sesión.'
  if (text.includes('invalid login')) return 'Correo o contraseña incorrectos.'
  if (text.includes('rate limit')) return 'Espere unos minutos antes de volver a intentarlo.'
  if (text.includes('already registered'))
    return 'Revise su correo o recupere el acceso a su cuenta.'
  return 'No se pudo completar la operación. Revise su conexión e inténtelo nuevamente.'
}
export function AuthProvider({ children }) {
  const [objUsuario, setUsuario] = useState(null),
    [objPerfil, setPerfil] = useState(null),
    [cargando, setCargando] = useState(true),
    [recuperando, setRecuperando] = useState(false)
  const current = useRef(null)
  async function obtenerPerfil(id = current.current) {
    if (!id) return
    const { data, error } = await supabase
      .from('usuarios')
      .select('id,nombre,zona_geografica,rol,gestionar_catalogo')
      .eq('id', id)
      .single()
    if (current.current === id) setPerfil(error ? null : data)
  }
  useEffect(() => {
    let alive = true
    function receive(event, session) {
      if (!alive) return
      const id = session?.user?.id || null
      if (current.current !== id) setPerfil(null)
      current.current = id
      setUsuario(session?.user || null)
      setCargando(false)
      if (event === 'PASSWORD_RECOVERY') setRecuperando(true)
      // Do not await a second Auth operation inside Supabase's auth-state callback.
      if (id)
        queueMicrotask(() => {
          if (alive) obtenerPerfil(id)
        })
    }
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(receive)
    supabase.auth
      .getSession()
      .then(({ data }) => receive('INITIAL_SESSION', data.session))
      .catch(() => receive('INITIAL_SESSION', null))
    return () => {
      alive = false
      current.current = null
      subscription.unsubscribe()
    }
  }, [])
  async function checked(promise) {
    const { data, error } = await promise
    if (error) throw new Error(authMessage(error))
    return data
  }
  const iniciarSesion = (email, password) =>
    checked(supabase.auth.signInWithPassword({ email, password }))
  const registrarse = (email, password, nombre, zona_geografica) =>
    checked(
      supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + '/login',
          data: { nombre, zona_geografica },
        },
      }),
    )
  async function cerrarSesion() {
    await checked(supabase.auth.signOut({ scope: 'local' }))
    current.current = null
    setUsuario(null)
    setPerfil(null)
    setRecuperando(false)
  }
  async function actualizarPerfil(nombre, zona_geografica) {
    const data = await checked(
      supabase
        .from('usuarios')
        .update({ nombre, zona_geografica })
        .eq('id', current.current)
        .select('id,nombre,zona_geografica,rol,gestionar_catalogo')
        .single(),
    )
    setPerfil(data)
    return data
  }
  async function cambiarContrasena(password) {
    await checked(supabase.auth.updateUser({ password }))
    setRecuperando(false)
  }
  const recuperarContrasena = (email) =>
    checked(
      supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/login?recovery=true',
      }),
    )
  return (
    <Context.Provider
      value={{
        objUsuario,
        objPerfil,
        cargando,
        recuperando,
        iniciarSesion,
        registrarse,
        cerrarSesion,
        actualizarPerfil,
        cambiarContrasena,
        recuperarContrasena,
        obtenerPerfil,
      }}
    >
      {children}
    </Context.Provider>
  )
}
export const useAuth = () => useContext(Context)
