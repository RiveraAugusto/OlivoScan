// ============================================================
// ARCHIVO: lib/pdf.js
// MODULO: Base
// DESCRIPCION: Modulo de utilidad para la creacion, diseño y descarga
//              de reportes de diagnostico en formato PDF usando jsPDF.
// SPRINT: 4
// RF: RF-006
// ============================================================

import { jsPDF } from 'jspdf'
import { parsearTextoRecomendacion } from './recomendaciones'

// Convierte una URL de imagen (Cloudinary o ruta local) a base64 usando un canvas de navegador.
// Recibe la URL de la imagen.
// Devuelve una promesa con la representacion base64 de la imagen.
async function convertirImagenABase64(urlImagen) {
  return new Promise((resolve, reject) => {
    // Si la imagen ya es base64, resolver directamente
    if (urlImagen.startsWith('data:')) {
      resolve(urlImagen)
      return
    }

    const objImg = new Image()
    objImg.crossOrigin = 'anonymous' // Evitar bloqueos de CORS para recursos externos como Cloudinary

    objImg.onload = () => {
      try {
        const objCanvas = document.createElement('canvas')
        objCanvas.width = objImg.width
        objCanvas.height = objImg.height
        const objCtx = objCanvas.getContext('2d')
        objCtx.drawImage(objImg, 0, 0)
        
        // Comprimir a JPEG con calidad 85%
        const strBase64 = objCanvas.toDataURL('image/jpeg', 0.85)
        resolve(strBase64)
      } catch (error) {
        reject(new Error('Fallo al renderizar la imagen en canvas.'))
      }
    }

    objImg.onerror = (err) => {
      reject(new Error('No se pudo cargar la imagen del servidor.'))
    }

    objImg.src = urlImagen
  })
}

// Genera un archivo PDF con un diseño premium y lo descarga en el navegador.
// Recibe el objeto completo de analisis (objAnalisis) y opcionalmente el nombre del agricultor.
export async function generarPDF(objAnalisis, nombreAgricultor = 'Agricultor') {
  try {
    // 1. Crear documento PDF tamaño A4 (210mm x 297mm) en orientacion vertical
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    // 2. Colores de la paleta del proyecto (Tema Oliva)
    const COLOR_PRIMARIO = [63, 98, 18] // olive-800 (#3f6212)
    const COLOR_TEXTO = [30, 41, 29] // olive-950 (#1e291d)
    const COLOR_SECUNDARIO = [101, 138, 93] // olive-600
    const COLOR_NEUTRO_LIGHT = [244, 246, 243] // olive-50/30

    // Paleta de colores para severidad
    const COLORES_SEVERIDAD = {
      leve: [34, 197, 94], // verde (#22c55e)
      moderado: [234, 179, 8], // amarillo/naranja (#eab308)
      grave: [239, 68, 68] // rojo (#ef4444)
    }

    // 3. Dibujar marco decorativo superior (Cabecera premium)
    doc.setFillColor(COLOR_PRIMARIO[0], COLOR_PRIMARIO[1], COLOR_PRIMARIO[2])
    doc.rect(0, 0, 210, 30, 'F')

    // Titulo principal en blanco sobre la cabecera
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.setTextColor(255, 255, 255)
    doc.text('OlivoScan', 15, 18)

    // Subtitulo de la cabecera
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text('Reporte Técnico de Diagnóstico Foliar', 15, 25)

    // Fecha del reporte a la derecha de la cabecera
    const strFechaReporte = new Date(objAnalisis.creado_en || new Date()).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    doc.setFontSize(9)
    doc.text(strFechaReporte, 140, 20)

    // 4. Seccion de Datos Generales del Diagnostico (Fila de metadatos)
    let yPos = 42
    doc.setTextColor(COLOR_TEXTO[0], COLOR_TEXTO[1], COLOR_TEXTO[2])
    
    // Titulo de datos del titular
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Datos de la Evaluación', 15, yPos)
    
    yPos += 5
    doc.setDrawColor(210, 220, 205)
    doc.line(15, yPos, 195, yPos)

    yPos += 7
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.text('Propietario / Técnico:', 15, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(nombreAgricultor, 52, yPos)

    doc.setFont('helvetica', 'bold')
    doc.text('ID del Análisis:', 115, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(objAnalisis.id || 'N/A', 142, yPos)

    yPos += 6
    doc.setFont('helvetica', 'bold')
    doc.text('Modelo de IA:', 15, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(objAnalisis.modelo_version || 'mock-v1', 40, yPos)

    doc.setFont('helvetica', 'bold')
    doc.text('Fecha Captura:', 115, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(strFechaReporte, 142, yPos)

    yPos += 12

    // 5. Grid de Diagnostico: Imagen (Izquierda) e Indicadores (Derecha)
    // Dimensiones para pintar la imagen: 70mm x 70mm
    const imgWidth = 70
    const imgHeight = 70
    const xImg = 15
    const xInfo = 95

    // Intentar pintar la imagen del analisis. Si falla, dibujar caja de texto de reemplazo
    try {
      const strBase64Img = await convertirImagenABase64(objAnalisis.imagen_url)
      doc.addImage(strBase64Img, 'JPEG', xImg, yPos, imgWidth, imgHeight)
      // Dibujar borde a la imagen
      doc.setDrawColor(COLOR_SECUNDARIO[0], COLOR_SECUNDARIO[1], COLOR_SECUNDARIO[2])
      doc.rect(xImg, yPos, imgWidth, imgHeight, 'S')
    } catch (errImg) {
      console.warn('Advertencia al insertar imagen en PDF:', errImg.message)
      // Dibujar caja de error en vez de la imagen
      doc.setFillColor(245, 245, 245)
      doc.rect(xImg, yPos, imgWidth, imgHeight, 'F')
      doc.setDrawColor(220, 220, 220)
      doc.rect(xImg, yPos, imgWidth, imgHeight, 'S')
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(8.5)
      doc.setTextColor(150, 150, 150)
      doc.text('[Imagen no disponible offline]', xImg + 12, yPos + 35)
    }

    // Informacion de Diagnostico al lado derecho
    doc.setTextColor(COLOR_TEXTO[0], COLOR_TEXTO[1], COLOR_TEXTO[2])
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('Diagnóstico Detectado:', xInfo, yPos + 6)
    
    doc.setFontSize(16)
    doc.setTextColor(COLOR_PRIMARIO[0], COLOR_PRIMARIO[1], COLOR_PRIMARIO[2])
    const plagaNombre = objAnalisis.plaga_corregida || objAnalisis.plaga_detectada
    doc.text(plagaNombre, xInfo, yPos + 13)

    // Si hubo correccion del agricultor, indicarlo
    if (objAnalisis.plaga_corregida) {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(8.5)
      doc.setTextColor(100, 100, 100)
      doc.text(`* Corregido por agricultor (Original: ${objAnalisis.plaga_detectada})`, xInfo, yPos + 18)
    }

    // Porcentaje de confianza
    doc.setTextColor(COLOR_TEXTO[0], COLOR_TEXTO[1], COLOR_TEXTO[2])
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('Confianza del Diagnóstico:', xInfo, yPos + 26)
    doc.setFont('helvetica', 'normal')
    doc.text(`${Number(objAnalisis.confianza).toFixed(1)}%`, xInfo + 46, yPos + 26)

    // Nivel de Severidad
    doc.setFont('helvetica', 'bold')
    doc.text('Nivel de Severidad:', xInfo, yPos + 33)
    
    // Dibujar Badge de Severidad con color asociado
    const strSev = objAnalisis.severidad || 'leve'
    const rgbSev = COLORES_SEVERIDAD[strSev] || [128, 128, 128]
    doc.setFillColor(rgbSev[0], rgbSev[1], rgbSev[2])
    doc.rect(xInfo + 34, yPos + 29, 24, 5.5, 'F')
    doc.setFontSize(8.5)
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    // Centrar texto del badge levemente
    const offsetTextoBadge = strSev === 'leve' ? 8.5 : (strSev === 'grave' ? 7.5 : 5)
    doc.text(strSev.toUpperCase(), xInfo + 34 + offsetTextoBadge, yPos + 33)

    // Descripcion del Diagnostico
    doc.setTextColor(COLOR_TEXTO[0], COLOR_TEXTO[1], COLOR_TEXTO[2])
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('Descripción de la Afección:', xInfo, yPos + 44)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    
    const strDesc = objAnalisis.descripcion || 'No se brindan observaciones especificas en este analisis.'
    const lineasDesc = doc.splitTextToSize(strDesc, 100)
    doc.text(lineasDesc, xInfo, yPos + 49)

    yPos += imgHeight + 8 // Bajar cursor despues de la seccion del Grid

    // 6. Caja de Notas de Campo (si existen)
    if (objAnalisis.notas) {
      doc.setFillColor(COLOR_NEUTRO_LIGHT[0], COLOR_NEUTRO_LIGHT[1], COLOR_NEUTRO_LIGHT[2])
      doc.rect(15, yPos, 180, 20, 'F')
      doc.setDrawColor(210, 220, 205)
      doc.rect(15, yPos, 180, 20, 'S')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(COLOR_PRIMARIO[0], COLOR_PRIMARIO[1], COLOR_PRIMARIO[2])
      doc.text('Notas de Campo:', 18, yPos + 6)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(COLOR_TEXTO[0], COLOR_TEXTO[1], COLOR_TEXTO[2])
      
      const lineasNotas = doc.splitTextToSize(objAnalisis.notas, 172)
      doc.text(lineasNotas, 18, yPos + 12)

      yPos += 26
    }

    // 7. Recomendaciones de Tratamiento (Generadas por la IA)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(COLOR_PRIMARIO[0], COLOR_PRIMARIO[1], COLOR_PRIMARIO[2])
    doc.text('Recomendaciones de Tratamiento Generadas por IA', 15, yPos)
    
    yPos += 4
    doc.setDrawColor(COLOR_PRIMARIO[0], COLOR_PRIMARIO[1], COLOR_PRIMARIO[2])
    doc.line(15, yPos, 195, yPos)

    yPos += 7
    doc.setFontSize(9)
    doc.setTextColor(COLOR_TEXTO[0], COLOR_TEXTO[1], COLOR_TEXTO[2])

    const strRecom = objAnalisis.recomendacion || 'Realice inspecciones periodicas de sus olivos. Consulte fichas tecnicas si la severidad es moderada.'
    
    const limiteAlturaPagina = 280

    function asegurarEspacio(altura = 5.5) {
      if (yPos + altura > limiteAlturaPagina) {
        doc.addPage()
        doc.setFillColor(COLOR_PRIMARIO[0], COLOR_PRIMARIO[1], COLOR_PRIMARIO[2])
        doc.rect(0, 0, 210, 15, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.setTextColor(255, 255, 255)
        doc.text('OlivoScan - Continuacion de recomendaciones', 15, 10)
        yPos = 25
      }
    }

    function escribirFragmentos(fragmentos, { titulo = false, elemento = false } = {}) {
      const inicioX = elemento ? 20 : 15
      const anchoMaximo = 195 - inicioX
      const tamanoFuente = titulo ? 10 : 9
      const lineas = []
      let linea = []
      let anchoLinea = 0
      doc.setFontSize(tamanoFuente)

      for (const fragmento of fragmentos) {
        const estilo = titulo || fragmento.negrita ? 'bold' : fragmento.cursiva ? 'italic' : 'normal'
        doc.setFont('helvetica', estilo)
        for (const palabra of fragmento.texto.match(/\S+|\s+/g) || []) {
          const esEspacio = /^\s+$/.test(palabra)
          if (esEspacio && linea.length === 0) continue
          const partes = esEspacio ? [' '] : doc.splitTextToSize(palabra, anchoMaximo)
          for (const parte of partes) {
            const ancho = doc.getTextWidth(parte)
            if (linea.length && anchoLinea + ancho > anchoMaximo) {
              lineas.push(linea)
              linea = []
              anchoLinea = 0
              if (esEspacio) continue
            }
            linea.push({ texto: parte, estilo, ancho })
            anchoLinea += ancho
          }
        }
      }
      if (linea.length) lineas.push(linea)

      if (titulo) {
        yPos += 2
        asegurarEspacio(14)
      }
      lineas.forEach((fragmentosLinea, indice) => {
        asegurarEspacio()
        doc.setFontSize(tamanoFuente)
        const color = titulo ? COLOR_PRIMARIO : COLOR_TEXTO
        doc.setTextColor(...color)
        if (elemento && indice === 0) {
          doc.setFont('helvetica', 'normal')
          doc.text('•', 15, yPos)
        }
        let x = inicioX
        fragmentosLinea.forEach((fragmento) => {
          doc.setFont('helvetica', fragmento.estilo)
          doc.text(fragmento.texto, x, yPos)
          x += fragmento.ancho
        })
        yPos += 5.5
      })
      yPos += 1.5
    }

    for (const bloque of parsearTextoRecomendacion(strRecom)) {
      if (bloque.tipo === 'lista') {
        bloque.elementos.forEach((fragmentos) => escribirFragmentos(fragmentos, { elemento: true }))
      } else {
        escribirFragmentos(bloque.fragmentos, { titulo: bloque.tipo === 'titulo' })
      }
    }

    // 8. Footer (Pie de pagina con fines informativos)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(140, 140, 140)
    
    // Siempre pintar pie de pagina en la pagina actual
    const totalPaginas = doc.getNumberOfPages()
    for (let j = 1; j <= totalPaginas; j++) {
      doc.setPage(j)
      // Linea de footer
      doc.setDrawColor(230, 230, 230)
      doc.line(15, 287, 195, 287)
      const textoPie = 'OlivoScan - Detección temprana de plagas. Este reporte es meramente informativo y de soporte para la toma de decisiones agrónomas.'
      doc.text(doc.splitTextToSize(textoPie, 150), 15, 291, { lineHeightFactor: 1.1 })
      doc.text(`Página ${j} de ${totalPaginas}`, 195, 291, { align: 'right' })
    }

    // 9. Descargar el archivo
    const strNombreArchivo = `olivoscan-reporte-${objAnalisis.id?.substring(0, 8) || 'analisis'}.pdf`
    doc.save(strNombreArchivo)
    
    return true
  } catch (error) {
    console.error('Error al generar PDF del diagnostico:', error)
    throw new Error('No se pudo generar el reporte en PDF.')
  }
}
