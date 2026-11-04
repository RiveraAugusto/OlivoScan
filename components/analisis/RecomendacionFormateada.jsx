import { parsearTextoRecomendacion } from '@/lib/recomendaciones'

function TextoEnLinea({ fragmentos }) {
  return fragmentos.map((fragmento, indice) => fragmento.negrita
    ? <strong key={indice} className="font-semibold">{fragmento.texto}</strong>
    : fragmento.cursiva
      ? <em key={indice}>{fragmento.texto}</em>
      : <span key={indice}>{fragmento.texto}</span>)
}

export default function RecomendacionFormateada({ texto }) {
  return (
    <div className="space-y-3">
      {parsearTextoRecomendacion(texto).map((bloque, indice) => {
        if (bloque.tipo === 'titulo') {
          return <h6 key={indice} className="font-bold text-olive-900"><TextoEnLinea fragmentos={bloque.fragmentos} /></h6>
        }
        if (bloque.tipo === 'lista') {
          return (
            <ul key={indice} className="list-disc pl-5 space-y-2">
              {bloque.elementos.map((fragmentos, elemento) => (
                <li key={elemento}><TextoEnLinea fragmentos={fragmentos} /></li>
              ))}
            </ul>
          )
        }
        return <p key={indice}><TextoEnLinea fragmentos={bloque.fragmentos} /></p>
      })}
    </div>
  )
}

