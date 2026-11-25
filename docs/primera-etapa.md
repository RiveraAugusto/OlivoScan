# Primera etapa de OlivoScan

Implementación del SRS y SAD 1.1 aprobados, con los documentos originales actualizados antes de programar:

- [SRS original](https://docs.google.com/document/d/1DgZY-AXToLHj-NJvlRqeXJjneFAMjchW/edit).
- [SAD original](https://docs.google.com/document/d/1d1qO0XEIA3EX6qNX3UQb-xvEpO9U-9QH/edit).

## Alcance

Renovación de las pantallas principales; RF-17 parcelas con identificador opcional de olivo; RF-18 revisión agronómica con autoría, estados y versiones; RNF-004 privacidad, RNF-006 usabilidad, RNF-007 compatibilidad y RNF-010 procesamiento de imágenes.

Todo el cultivo es de olivo. No se exige crear un árbol ni elegir especies para analizar. Los registros anteriores conservan su ubicación desconocida hasta que el propietario la asocie. Se archivan parcelas y olivos, sin destruir el historial.

La IA original, el aporte del agricultor y las versiones profesionales son fuentes diferentes. El resultado no reconocido nunca equivale a sano. La confianza declarada por Gemini no representa exactitud validada. No se implementa seguimiento de casos ni entrenamiento automático. Una exactitud superior al 90 % necesita un conjunto etiquetado independiente y un protocolo todavía por acordar.

## Arquitectura

Next.js App Router y React; Supabase Auth/PostgreSQL con RLS; Gemini como proveedor de orientación preliminar; Cloudinary autenticado; jsPDF para exportación. Las rutas usan `lib/server/http.js` para autenticar y aplicar errores y cabeceras seguras. Los contratos están en `lib/contracts.js`. Las transiciones de revisión se ejecutan mediante funciones PostgreSQL con permisos limitados y bloqueo de fila.

| Actor                          | Permisos                                                                                                          |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Propietario                    | Sus parcelas, olivos y muestras; observaciones propias; solicitud y cancelación de revisión; compartir y revocar. |
| Agrónomo autorizado y asignado | Consulta de la muestra asignada; iniciar, emitir y rectificar revisión.                                           |
| Administrador                  | Roles, permiso de catálogo y asignaciones. Administrar no concede acceso al diagnóstico ni a sus imágenes.        |
| Destinatario de enlace         | Solo campos seleccionados mientras siga vigente. Sin escritura ni emisión de revisiones.                          |

El permiso de catálogo es independiente del permiso de revisión. Las revisiones no se sobrescriben: toda rectificación enlaza la anterior. El sistema registra al autor con su cuenta y una copia de su nombre; no representa una firma digital certificada.

Los enlaces usan 32 bytes aleatorios, conservan únicamente SHA-256 en base de datos y llevan el secreto en el fragmento del navegador, no en la ruta ni en la consulta HTTP. El navegador envía el secreto en una cabecera para cada lectura. La fotografía se sirve desde el backend, con nueva autorización y sin revelar una URL permanente del proveedor. No hay caché HTTP de estas respuestas. Revocar bloquea nuevas consultas; no puede retirar una copia ya descargada.

## Fotografías

JPEG, PNG o WebP; máximo 10 MiB y 24 megapíxeles por entrada. Se comprueba el contenido real, se rechazan imágenes corruptas o animadas y se conserva la orientación y relación de aspecto. Se genera JPEG sin EXIF, sin ampliar imágenes pequeñas, con lado mayor de hasta 2048 píxeles. La calidad baja progresivamente de 95 a 90 y 85 para intentar alcanzar 2 MiB, conservando una copia de mayor peso si reducirla más comprometería el detalle.

Las advertencias técnicas de iluminación, foco y resolución no bloquean por sí solas una imagen válida. Los valores iniciales son heurísticos: lado menor inferior a 512 píxeles, luminosidad media inferior a 35 o superior a 235, y varianza del Laplaciano inferior a 35 sobre miniatura gris de 128 píxeles. No se presentan como umbrales agronómicos calibrados. Antes de activarlos como bloqueos se requiere evaluación con imágenes etiquetadas y registro de falsos rechazos. El especialista debe verificar que la compresión conserva los síntomas.

## Validación

`npm test` ejecuta contratos, imágenes con Sharp y la migración real en PostgreSQL mediante PGlite. `npm run test:e2e` usa Chromium y WebKit con servicios de interfaz simulados y un servidor Next de producción. No contiene una excepción de autenticación de producción. Las políticas de acceso se prueban por separado con roles SQL reales.

Los ensayos de navegador no sustituyen la integración con el proyecto Supabase/Cloudinary/Gemini configurado, las cámaras reales ni la validación agronómica. Ver la [matriz de aceptación](aceptacion-primera-etapa.md) y la [guía de migración](migracion-primera-etapa.md).
