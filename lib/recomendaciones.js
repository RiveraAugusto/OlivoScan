// Lectura compartida del formato de recomendaciones para la web y los reportes.
export function separarFormatoEnLinea(texto) {
  return String(texto).split(/(\*\*[^*\n]+\*\*|__[^_\n]+__|\*[^*\n]+\*|_[^_\n]+_|\x60[^\x60\n]+\x60)/g)
    .filter(Boolean)
    .map((parte) => {
      const negrita = (parte.startsWith('**') && parte.endsWith('**')) ||
        (parte.startsWith('__') && parte.endsWith('__'))
      const cursiva = !negrita && ((parte.startsWith('*') && parte.endsWith('*')) ||
        (parte.startsWith('_') && parte.endsWith('_')))
      const codigo = parte.startsWith('\x60') && parte.endsWith('\x60')
      return {
        texto: negrita ? parte.slice(2, -2) : cursiva || codigo ? parte.slice(1, -1) : parte,
        negrita,
        cursiva,
      }
    })
}

export function parsearTextoRecomendacion(texto) {
  if (typeof texto !== 'string' || !texto.trim()) return []

  const bloques = []
  let despuesDeBlanco = true

  for (const linea of texto.replace(/\r\n?/g, '\n').split('\n')) {
    const contenido = linea.trim()
    if (!contenido) {
      despuesDeBlanco = true
      continue
    }

    const titulo = contenido.match(/^#{1,6}\s+(.+?)(?:\s+#+)?$/)
    const elemento = contenido.match(/^(?:[-+*]|\d+[.)])\s+(.+)$/)
    const anterior = bloques.at(-1)

    if (titulo) {
      bloques.push({ tipo: 'titulo', texto: titulo[1] })
    } else if (elemento) {
      if (anterior?.tipo === 'lista' && !despuesDeBlanco) {
        anterior.elementos.push(elemento[1])
      } else {
        bloques.push({ tipo: 'lista', elementos: [elemento[1]] })
      }
    } else if (anterior?.tipo === 'lista' && !despuesDeBlanco && /^\s{2,}\S/.test(linea)) {
      anterior.elementos[anterior.elementos.length - 1] += ' ' + contenido
    } else if (anterior?.tipo === 'parrafo' && !despuesDeBlanco) {
      anterior.texto += ' ' + contenido
    } else {
      bloques.push({ tipo: 'parrafo', texto: contenido })
    }
    despuesDeBlanco = false
  }

  return bloques.map((bloque) => bloque.tipo === 'lista'
    ? { tipo: 'lista', elementos: bloque.elementos.map(separarFormatoEnLinea) }
    : { tipo: bloque.tipo, fragmentos: separarFormatoEnLinea(bloque.texto) })
}

