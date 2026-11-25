# Preparación de un entorno de revisión

Esta rama no aplica cambios a producción ni activa despliegues automáticos. El merge requiere autorización posterior.

## Orden de puesta en marcha

1. Respaldar la base de datos y obtener inventario de imágenes y usuarios. Crear un entorno de revisión de Supabase/Cloudinary; conservar el entorno actual hasta comprobar el respaldo.
2. En instalaciones nuevas, aplicar primero `supabase/migrations/20261103000100_inicializar_olivoscan.sql`. En una instalación existente, verificar que esa migración forma parte de su historial. No ejecutar de nuevo el catálogo inicial sobre producción.
3. Aplicar `supabase/migrations/20261125000100_primera_etapa.sql`. Es una transacción aditiva; no fabrica parcelas ni olivos para registros históricos. Si falla, corregir el esquema de partida antes de reintentar. No eliminar tablas o datos para forzarla.
4. Configurar las variables del ejemplo en el entorno de revisión y ejecutar `npm ci`, `npm test`, `npm run build` y `npm start`.
5. Comprobar con cuentas separadas: propietario A, propietario B, administrador y agrónomo. Verificar API y REST directo, asignación/revocación, PDF, filtros y enlaces.
6. Migrar y verificar todas las imágenes históricas antes de considerar cumplida la privacidad. La aplicación bloquea la visualización y publicación de imágenes históricas todavía públicas; este bloqueo no retira por sí mismo una URL pública que alguien ya conozca.
7. Completar las pruebas de cámara, campo y revisión de detalle de imágenes. Revisar el resultado con el equipo antes de autorizar merge o puesta en producción.

## Credenciales

Solo `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` llegan al navegador. `SUPABASE_SERVICE_ROLE_KEY`, claves de Cloudinary y `GEMINI_API_KEY` son exclusivas del servidor. No copiarlas al repositorio ni a informes. El análisis necesita el rol de servicio para conservar inmutable el diagnóstico de IA; las lecturas normales usan el token del usuario y RLS.

El primer administrador se designa desde una consola de base de datos con autoridad, después de verificar su identidad. No existe un formulario para autoconcederse ese rol. Ejemplo de operación controlada:

```sql
update public.usuarios set rol='admin'
where id='UUID-DE-LA-CUENTA-VERIFICADA';
```

A partir de ahí, Administración puede conceder o retirar el rol de agrónomo y su permiso independiente de catálogo. La acreditación profesional es responsabilidad del administrador, no una comprobación automática del programa. La asignación se realiza desde Revisiones.

## Imágenes históricas

`scripts/migrar-imagenes.mjs` permite inventariar y migrar recursos Cloudinary del mismo proyecto; funciona en modo de lectura por defecto. Debe ejecutarse solo contra el entorno elegido, con su respaldo y credenciales cargadas en el proceso:

```bash
node --env-file=.env.local scripts/migrar-imagenes.mjs
node --env-file=.env.local scripts/migrar-imagenes.mjs --apply
```

La migración conserva una copia privada JPEG sin EXIF, solicita la eliminación e invalidación del recurso público y comprueba su URL anterior antes de habilitar el registro privado. Conserva un diario local para poder reintentar sin crear copias innecesarias. No imprime las URLs ni credenciales. Una CDN puede tardar en invalidar recursos: los pendientes deben revisarse y repetirse tras la propagación. Verificar también las variantes públicas conocidas y el proveedor antes de cerrar la aceptación de privacidad.

Los archivos de `public/uploads`, recursos de otro proveedor y URLs que no se puedan identificar de forma segura quedan pendientes de intervención manual; no se descargan desde direcciones arbitrarias. Para esos archivos, preparar una copia privada sin EXIF, verificarla, retirar la copia del directorio público y de sus cachés, y actualizar `imagen_public_id`, `imagen_url` y `imagen_privada` desde una operación administrativa. No marcar un registro como privado mientras su copia pública siga accesible. Los diagnósticos y revisiones se conservan.

## Conservación y reversión

Archivar una parcela u olivo no borra nada. Retirar una muestra la oculta, revoca sus enlaces y cancela las asignaciones; conserva datos y versiones para trazabilidad. La retirada no equivale a borrado físico ni a ejercicio de derechos de eliminación. El equipo debe aprobar su política de conservación y eliminación antes de producción.

Si se debe revertir la aplicación, evitar volver al código antiguo de enlaces públicos. Mantener cerrados los endpoints antiguos y las fotografías autenticadas. La migración no dispone de un `down` destructivo automático: restaurar desde respaldo o preparar una migración correctiva revisada que conserve las nuevas revisiones. Una vuelta directa al código anterior no es compatible con el nuevo control de escritura y privacidad.
