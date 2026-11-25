import { AuthProvider } from '@/hooks/useAuth'
import AppShell from '@/components/ui/AppShell'
import './globals.css'
export const metadata = {
  title: 'OlivoScan · Cuaderno del olivar',
  description:
    'Análisis preliminares del olivo por parcela y revisión agronómica para La Aceitunera en Ilo.',
}
export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  )
}
