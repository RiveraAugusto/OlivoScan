# OlivoScan 🌿

Cuaderno de muestras del olivar para La Aceitunera, Ilo, Moquegua. Ofrece orientación preliminar mediante IA y revisión agronómica con trazabilidad.

## Primera etapa

- Pantallas adaptables con navegación consistente y estados claros.
- Parcelas obligatorias para nuevas muestras; identificar cada olivo es opcional.
- Diagnóstico original de IA separado del aporte del agricultor y la revisión profesional.
- Asignaciones autorizadas, revisiones versionadas y notificaciones.
- Historial filtrable, comparación contextual y PDF.
- Fotografías privadas y enlaces con campos seleccionados, vencimiento y revocación.

La confianza del modelo no equivale a exactitud medida. La meta superior al 90 % necesita validación independiente. El seguimiento de casos permanece fuera de esta etapa.

## Desarrollo

Node.js 22.12 o superior; CI usa Node 24.

```bash
git clone https://github.com/RiveraAugusto/OlivoScan.git
cd OlivoScan
git switch codex/primera-etapa-olivoscan
npm ci
cp .env.example .env.local
# Completar las credenciales y preparar la base según la guía de migración.
npm run dev
```

Abrir http://localhost:3000. El proyecto utiliza Next.js/React, Supabase, Gemini, Cloudinary y jsPDF.

## Verificación

```bash
npm run lint
npm test
npm run build
npx playwright install chromium webkit
npm run test:e2e
npm audit --audit-level=moderate
```

Las pruebas de interfaz usan respuestas simuladas, mientras que las reglas de acceso se verifican ejecutando SQL real en PostgreSQL/PGlite. Se requiere además verificar los proveedores configurados y las cámaras reales antes de producción.

- [Alcance y arquitectura](docs/primera-etapa.md)
- [Matriz de aceptación](docs/aceptacion-primera-etapa.md)
- [Migración y puesta en revisión](docs/migracion-primera-etapa.md)
