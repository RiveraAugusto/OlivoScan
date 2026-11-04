// ============================================================
// ARCHIVO: lib/gemini.js
// MODULO: Base
// DESCRIPCION: Conexion con la API de Gemini para diagnostico visual de plagas.
//              Requiere una clave configurada para generar diagnosticos reales.
// ============================================================


async function solicitarGemini(url, opciones) {
  for (let intento = 0; intento < 2; intento++) {
    try {
      const respuesta = await fetch(url, { ...opciones, signal: AbortSignal.timeout(60000) })
      if (intento === 0 && [429, 503].includes(respuesta.status)) {
        await respuesta.body?.cancel()
        await new Promise((resolve) => setTimeout(resolve, 1000))
        continue
      }
      return respuesta
    } catch (error) {
      if (error.name === 'TimeoutError') {
        if (intento === 0) continue
        throw new Error('El diagnostico esta tardando mas de lo esperado. Vuelve a intentarlo en unos instantes.')
      }
      throw error
    }
  }
}

/**
 * Analiza una imagen utilizando la API oficial de Google Gemini.
 * @param {Buffer} fileBuffer Buffer binario de la imagen
 * @param {string} mimeType Tipo MIME de la imagen (ej: 'image/jpeg')
 * @returns {Promise<Object>} JSON con la estructura solicitada
 */
export async function analizarImagenConGemini(fileBuffer, mimeType) {
  const apiKey = process.env.GEMINI_API_KEY
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite'
  console.info('[OlivoScan] Modelo de diagnostico:', modelName)

  if (!apiKey) {
    throw new Error('El servicio de diagnostico por imagen aun no esta configurado.')
  }

  try {
    // Convertir el buffer de imagen a base64
    const base64Data = fileBuffer.toString('base64')

    // Definir el prompt detallado y optimizado
    const prompt = `Rol: Eres un backend de análisis fitosanitario especializado en el cultivo del olivo en Tacna, Perú (específicamente adaptado a las condiciones áridas, de alta salinidad en suelos y aguas, y el cultivo dominante de la variedad Criolla/Sevillana en zonas como La Yarada-Los Palos).

Tu tarea es analizar la imagen provista y devolver exclusivamente un objeto JSON que cumpla estrictamente con la estructura definida. No incluyas introducciones, ni bloques de código markdown, solo el JSON plano.

REGLAS DE VALIDACIÓN Y ANÁLISIS:
1. "es_olivo": Evalúa detalladamente si la imagen es una hoja, rama o fruto de olivo. Si es falso (ej. es un perro, una persona, otra planta u objeto cualquiera), pon "es_olivo": false, "tiene_plaga": false, completa "mensaje_error" con un mensaje explicativo y de orientación al agricultor en español (ej: "La imagen no corresponde a un olivo. Por favor, suba una foto nítida de la hoja, fruto o rama del olivo.") y deja los demás campos en null o vacíos.
2. "tiene_plaga": Si "es_olivo" es verdadero, evalúa si hay signos de plagas o enfermedades típicas del olivo en Tacna (como cochinilla móvil u orthezia [Orthezia olivicola], cochinilla negra de la oliva [Saissetia oleae], polilla de los brotes o margaronia [Palpita unionalis], barrenillo del olivo [Phloeotribus scarabaeoides], trips [Liothrips oleae], hongo del repilo [Spilocaea oleagina], fumagina [Capnodium sp.], etc.). Si la planta está sana, pon false.
3. "porcentaje_certeza": Un valor entero de 0 a 100 que indique qué tan seguro estás de tu diagnóstico (ya sea de la presencia de la plaga o de que la planta está sana). Solo pon 0 si no corresponde a un olivo ("es_olivo" es falso).
4. "recomendaciones": Deben ser específicas para la realidad agrícola de Tacna, Perú, basadas en el Manejo Integrado de Plagas (MIP), priorizando el control cultural y biológico y usando agroquímicos autorizados por SENASA Perú en el control químico si la plaga lo amerita. Si la hoja está sana o no es olivo, estos campos pueden ser de monitoreo preventivo o estar vacíos/null.

ESTRUCTURA DEL JSON DE RETORNO:
{
  "es_olivo": boolean,
  "mensaje_error": "string o null si es_olivo es true",
  "tiene_plaga": boolean,
  "diagnostico": {
    "plaga_nombre_comun": "string o null ('Hoja Sana' si tiene_plaga es false)",
    "plaga_nombre_cientifico": "string o null",
    "porcentaje_certeza": integer,
    "nivel_severidad": "Leve" | "Moderado" | "Severo" | "Ninguno",
    "sintomas_observados": "string detallando minuciosamente lo visto en la imagen o null"
  },
  "recomendaciones": {
    "cultural_mecanico": "string o null",
    "biologico_ecologico": "string o null",
    "quimico_senasa": "string o null"
  }
}`

    const response = await solicitarGemini(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`,
      {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                  }
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            maxOutputTokens: 3072,
            thinkingConfig: { thinkingLevel: 'minimal' }
          }
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error en la llamada a la API de Gemini (${response.status}):`, errorText)
      if (response.status === 429 || response.status === 503) {
        throw new Error('El servicio de diagnostico esta ocupado. Vuelve a intentarlo en unos instantes.')
      }
      throw new Error(`No se pudo completar el diagnostico de la imagen. Codigo: ${response.status}`)
    }

    const data = await response.json()
    
    // Obtener el texto del contenido generado por Gemini
    const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!textOutput) {
      throw new Error('Gemini no generó ninguna respuesta válida para la imagen provista.')
    }

    // Parsear la salida JSON directamente ya que forzamos responseMimeType: 'application/json'
    const parsedData = JSON.parse(textOutput.trim())
    if (typeof parsedData.es_olivo !== 'boolean' || (parsedData.es_olivo && (
      typeof parsedData.tiene_plaga !== 'boolean' ||
      !Number.isFinite(parsedData.diagnostico?.porcentaje_certeza) ||
      parsedData.diagnostico.porcentaje_certeza < 0 ||
      parsedData.diagnostico.porcentaje_certeza > 100 ||
      !['Leve', 'Moderado', 'Severo', 'Ninguno'].includes(parsedData.diagnostico?.nivel_severidad)
    ))) {
      throw new Error('El servicio no devolvio un diagnostico valido. Intenta nuevamente con otra fotografia.')
    }
    return parsedData

  } catch (error) {
    console.error('Error al analizar imagen con Gemini en lib/gemini.js:', error)
    // Lanzar error descriptivo
    throw new Error(error.message || 'No se pudo completar el análisis fitosanitario de la imagen.')
  }
}
