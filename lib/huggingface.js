// ============================================================
// ARCHIVO: lib/huggingface.js
// MODULO: Base
// DESCRIPCION: Conexion con el motor de IA en Hugging Face.
//              Utiliza un mockup en desarrollo para simular los diagnosticos.
// SPRINT: 2
// RF: RF-002
// ============================================================

// Constante para controlar si se usa el modelo simulado o la llamada real a Hugging Face
const USAR_MOCKUP = true

// Listado de plagas y diagnosticos de mockup para simular variedad en el testeo
const PLAGAS_MOCKUP = [
  {
    plaga: 'Mosca del olivo',
    confianza: 87.3,
    severidad: 'moderado',
    descripcion: 'Presencia de larvas en el fruto que afectan la pulpa y reducen la calidad del aceite. Se recomienda inspección detallada de los frutos afectados.',
    modelo_version: 'mock-v1',
  },
  {
    plaga: 'Prays del olivo (Polilla)',
    confianza: 93.5,
    severidad: 'grave',
    descripcion: 'La polilla del olivo ataca hojas, flores y frutos en sus distintas generaciones. Genera caida masiva de flores y frutos en verano.',
    modelo_version: 'mock-v1',
  },
  {
    plaga: 'Cochinilla tiznada (Saissetia oleae)',
    confianza: 81.2,
    severidad: 'leve',
    descripcion: 'Insecto chupador de savia que segrega melaza. Esto propicia la aparicion del hongo de la negrilla en hojas y tallos tiernos.',
    modelo_version: 'mock-v1',
  },
  {
    plaga: 'Repilo del olivo (Spilocaea oleagina)',
    confianza: 78.6,
    severidad: 'moderado',
    descripcion: 'Enfermedad fungica caracterizada por manchas circulares oscuras rodeadas de un halo amarillento en las hojas, provocando caida de follaje.',
    modelo_version: 'mock-v1',
  },
  {
    plaga: 'Hoja Sana',
    confianza: 99.1,
    severidad: 'leve',
    descripcion: 'La hoja analizada se encuentra en optimas condiciones. No se observan sintomas de plagas, hongos ni deficiencias nutricionales visibles.',
    modelo_version: 'mock-v1',
  },
]

// Funcion que procesa la imagen enviada consultando al modelo o retornando una simulacion
// Recibe la URL publica o local de la imagen procesada
// Devuelve un objeto con la plaga detectada, nivel de confianza, severidad, descripcion y version del modelo
export async function analizarImagen(imagenUrl) {
  try {
    if (USAR_MOCKUP) {
      // Simular un retraso de red realista de 2 segundos
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Seleccionar un diagnostico aleatorio de la lista de mockup
      const objRandom = PLAGAS_MOCKUP[Math.floor(Math.random() * PLAGAS_MOCKUP.length)]
      return objRandom
    }

    // Llamada real al modelo en Hugging Face Spaces (Sprint 5)
    if (!process.env.HUGGINGFACE_API_URL) {
      throw new Error('La variable de entorno HUGGINGFACE_API_URL no esta definida.')
    }

    const response = await fetch(process.env.HUGGINGFACE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imagen_url: imagenUrl }),
    })

    if (!response.ok) {
      throw new Error('Error al conectar con la API de inferencia de Hugging Face.')
    }

    const objResultado = await response.json()
    return objResultado
  } catch (error) {
    console.error('Error al analizar imagen en lib/huggingface:', error)
    throw new Error('No se pudo completar el analisis de la imagen.')
  }
}
