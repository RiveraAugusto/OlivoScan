# Matriz de aceptación de la primera etapa

Referencia: 34 criterios incorporados al SRS 1.1. Las comprobaciones automáticas son evidencias parciales: no se declara aprobada una prueba de campo, dispositivo real o proveedor que no se haya ejecutado.

| Criterio  | Implementación y evidencia                                                                               | Validación adicional                                                   |
| --------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| CA-006-01 | Estilos de controles de 48 × 48 CSS; comprobación de áreas en Playwright.                                | Medir también en dispositivos reales.                                  |
| CA-006-02 | Tipografía principal de 16 px, estados, foco visible y contraste; axe en pantallas principales.          | Inspección de foco/errores y legibilidad en campo.                     |
| CA-006-03 | Controles nativos, etiquetas, enlace de salto y diálogos; prueba de foco/Escape.                         | Recorrido completo con teclado y lector de pantalla.                   |
| CA-006-04 | Carga, errores, sesión vencida y resultado no reconocido diferenciados; contratos y flujo de interfaz.   | Red móvil lenta, interrupción y recuperación reales.                   |
| CA-006-05 | Componentes de interfaz compartidos en las pantallas renovadas.                                          | Prueba de uso en campo documentada.                                    |
| CA-007-01 | El informe de navegador adjunta motor, versión, sistema y anchos de referencia.                          | Registrar dispositivos reales y versiones actual/anterior.             |
| CA-007-02 | Flujos de captura, historial, parcelas, revisión, compartir y PDF en Playwright con servicios simulados. | Integración con proveedores reales y matriz completa de Chrome/Safari. |
| CA-007-03 | Entrada de cámara trasera y galería con formatos explícitos.                                             | Android/Chrome e iPhone/Safari reales: obligatorio y pendiente.        |
| CA-007-04 | Diseño adaptable, diálogos nativos, columnas flexibles y área segura móvil.                              | Teclado virtual, giro y ampliación en dispositivos reales.             |
| CA-010-01 | Sharp valida decodificación y formato real; pruebas corruptos, MIME, vacío, tamaño y tres formatos.      | Probar fotografías reales del conjunto de aceptación.                  |
| CA-010-02 | Copia con orientación y proporciones conservadas; métricas de tamaño/dimensiones; prueba Sharp.          | Registrar un lote de originales y procesadas.                          |
| CA-010-03 | Heurísticas de foco/luz/resolución solo informativas; umbrales documentados.                             | Etiquetado, falsos rechazos y calibración con especialista.            |
| CA-010-04 | Compresión limitada y sin ampliación artificial.                                                         | Comparación agronómica de síntomas antes/después: pendiente.           |
| CA-010-05 | Reencodificación sin EXIF; prueba de metadatos; foto conservada ante error del análisis.                 | Revisión de sustitución/reintento en campo.                            |
| CA-004-01 | Propiedad y RLS en base de datos; rutas autenticadas; pruebas de acceso cruzado SQL/HTTP.                | Intentos contra API y REST del Supabase de revisión.                   |
| CA-004-02 | Asignación exclusiva del administrador, revisión exclusiva del agrónomo asignado.                        | Recorrido con cuatro cuentas reales.                                   |
| CA-004-03 | Consentimiento y lista de campos; solo SHA-256 persistido; SQL prueba omisión de campos.                 | Verificación extremo a extremo con proveedor privado.                  |
| CA-004-04 | Vigencia/revocación en cada lectura de contenido e imagen; APIs sin caché; enlaces antiguos 410.         | Migrar imágenes heredadas y comprobar CDN y enlaces reales.            |
| CA-004-05 | Eventos de creación/revocación referencian el enlace y su alcance inmutable; sin token.                  | Revisar registros del entorno y retención.                             |
| CA-004-06 | Cancelar asignación o retirar rol bloquea acceso nuevo; versiones conservadas.                           | Confirmar política institucional de conservación.                      |
| CA-017-01 | Índices únicos por propietario/parcela, insensibles a mayúsculas y espacios.                             | Datos de prueba del equipo.                                            |
| CA-017-02 | Claves compuestas y validación de propiedad y pertenencia; pruebas SQL.                                  | Verificar API de revisión configurada.                                 |
| CA-017-03 | Migración conserva referencias nulas heredadas; asociación autorizada desde detalle.                     | Reconciliar inventario antes y después de migración.                   |
| CA-017-04 | Filtros SQL paginados; referencias en detalle y PDF.                                                     | Revisar un PDF con parcela y olivo reales.                             |
| CA-017-05 | Archivo sin borrado; bloqueos para nuevas asociaciones de parcelas/olivos archivados.                    | Verificar datos existentes del entorno.                                |
| CA-017-06 | Solo mismo ID y parcela permiten describir mismo olivo; aviso al comparar distintas muestras.            | Revisión agronómica de interpretación.                                 |
| CA-017-07 | Flujo por parcela sin olivo: formulario, análisis, revisión y exportación.                               | Completar el flujo con proveedores reales.                             |
| CA-017-08 | Olivo opcional, clave compuesta y texto “Olivo no identificado”.                                         | Inspeccionar registros y PDF del lote real.                            |
| CA-018-01 | Solicitud, asignación, inicio y estados; notificaciones del especialista/propietario.                    | Recorrido con usuarios de prueba reales.                               |
| CA-018-02 | Índice de solicitud activa única y verificaciones en RPC; pruebas SQL.                                   | Concurrencia de dos sesiones en entorno de revisión.                   |
| CA-018-03 | Confirmación/corrección/no concluyente, autor y original inmutable.                                      | Revisión por especialista autorizado.                                  |
| CA-018-04 | Versiones anexadas, vínculo anterior, bloqueo de fila y rechazo de versión obsoleta.                     | Recorrido simultáneo de dos pestañas.                                  |
| CA-018-05 | Versiones visibles al propietario y PDF con autor/fecha/conclusión.                                      | Revisión documental del PDF con datos reales.                          |
| CA-018-06 | Feedback del agricultor separado y sin cambio de estado profesional.                                     | Confirmación con usuario del cultivo.                                  |

## Estado de ejecución

- 43 pruebas locales: contratos, procesamiento real de imágenes, límites HTTP y PostgreSQL/PGlite.
- Compilación de producción y ESLint.
- Auditoría npm tras actualizar Next.js y dependencias.
- Pruebas de interfaz en GitHub Actions para Chromium y WebKit sobre Linux, anchos 360/390/768/1024/1440. El workflow conserva resultados, versiones y capturas. El entorno local impide arrancar los procesos de navegador; la evidencia de ejecución está en los checks de la rama. WebKit sobre Linux no acredita Safari en macOS/iOS.
- No se han aplicado migraciones a producción ni ejecutado llamadas de diagnóstico con claves reales durante esta implementación.
- Las pruebas de campo, cámaras reales, matriz actual/anterior de Chrome/Safari, detalle de síntomas y exactitud del modelo siguen pendientes. La segunda etapa no se implementó.
