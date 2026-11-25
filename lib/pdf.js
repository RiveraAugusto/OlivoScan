import { jsPDF } from 'jspdf'
import { imageBlob } from './client-api'
export async function generarPDF(a, nombre = 'Responsable del cultivo') {
  const doc = new jsPDF(),
    margin = 18,
    width = 174,
    bottom = 277
  let y = 22
  function page() {
    doc.addPage()
    y = 22
  }
  function text(value, size = 11, bold = false) {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(size)
    doc.setTextColor(35, 50, 27)
    const lines = doc.splitTextToSize(
      String(value ?? '')
        .replaceAll('#### ', '')
        .replaceAll('–', '-')
        .replaceAll('—', '-'),
      width,
    )
    for (const line of lines) {
      if (y + 6 > bottom) page()
      doc.text(line, margin, y)
      y += size * 0.43 + 1.5
    }
    y += 3
  }
  function section(title, value) {
    if (y + 20 > bottom) page()
    text(title, 13, true)
    text(value)
  }
  const date = (v) =>
    v ? new Date(v).toLocaleString('es-PE', { timeZone: 'America/Lima' }) : 'Sin fecha'
  text('OlivoScan | Informe de muestra', 20, true)
  text(nombre)
  text('Fecha de muestra: ' + date(a.creado_en))
  text(
    'Parcela: ' +
      (a.parcela ? a.parcela.codigo + ' - ' + a.parcela.nombre : 'Registro histórico sin parcela'),
  )
  text('Olivo: ' + (a.olivo?.codigo || 'No identificado (opcional)'))
  if (a.imagen_url) {
    const blob = await imageBlob(a.imagen_url)
    const data = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(new Error('No se pudo preparar la fotografía del PDF.'))
      reader.readAsDataURL(blob)
    })
    const properties = doc.getImageProperties(data),
      scale = Math.min(width / properties.width, 85 / properties.height),
      w = properties.width * scale,
      h = properties.height * scale
    if (y + h > bottom) page()
    doc.addImage(data, 'JPEG', margin, y, w, h)
    y += h + 10
  } else text('Fotografía histórica pendiente de migración a almacenamiento privado.')
  section('Diagnóstico original de IA', a.plaga_detectada)
  text('Estado: ' + a.estado_diagnostico + ' | Severidad: ' + a.severidad)
  if (a.estado_diagnostico !== 'no_reconocido')
    text(
      'Confianza declarada por el modelo: ' + a.confianza + ' %. No equivale a precisión validada.',
    )
  text(a.descripcion)
  text('Modelo: ' + (a.modelo_version || 'No registrado'))
  if (a.advertencias_imagen?.length)
    section('Advertencias de calidad', a.advertencias_imagen.join(' '))
  section('Orientaciones preliminares', a.recomendacion)
  section('Observaciones del agricultor', a.notas || 'Sin observaciones.')
  if (a.plaga_corregida) text('Corrección comunicada por el agricultor: ' + a.plaga_corregida)
  text('Las observaciones del agricultor no sustituyen una revisión profesional.')
  const revisions = (a.solicitudes || [])
    .flatMap((s) => s.revisiones || [])
    .sort((x, z) => new Date(x.creado_en) - new Date(z.creado_en))
  section(
    'Revisiones agronómicas',
    revisions.length ? 'Se conservan todas las versiones.' : 'Sin revisión profesional emitida.',
  )
  for (const r of revisions) {
    section(
      'Versión ' + r.version + ' | ' + r.conclusion,
      r.autor_nombre + ' | ' + date(r.creado_en),
    )
    if (r.plaga_corregida) text('Diagnóstico corregido: ' + r.plaga_corregida)
    text(r.observaciones)
    if (r.revision_anterior_id) text('Rectifica la revisión anterior: ' + r.revision_anterior_id)
  }
  section(
    'Alcance del informe',
    'El diagnóstico es preliminar. Requiere valoración agronómica antes de decidir tratamientos. No representa una precisión demostrada en campo.',
  )
  for (let i = 1; i <= doc.getNumberOfPages(); i++) {
    doc.setPage(i)
    doc.setFontSize(9)
    doc.text('OlivoScan | Privado | Página ' + i + ' de ' + doc.getNumberOfPages(), margin, 288)
  }
  doc.save('OlivoScan_muestra_' + a.id + '.pdf')
}
