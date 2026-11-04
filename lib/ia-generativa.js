// ============================================================
// ARCHIVO: lib/ia-generativa.js
// MODULO: Base
// DESCRIPCION: Modulo para conectar con modelos de lenguaje (OpenAI o Claude)
//              para generar recomendaciones personalizadas de tratamientos.
//              Incluye un catalogo de fallbacks detallados de alta calidad
//              cuando no hay llaves de API configuradas.
// SPRINT: 3
// RF: RF-004
// ============================================================

// Catalogo estatico de recomendaciones detalladas para uso offline o desarrollo sin API Keys
const RECOMENDACIONES_FALLBACK = {
  'Mosca del olivo': {
    leve: `### Recomendaciones para Mosca del Olivo (Severidad Leve)

#### 🌱 Tratamiento Orgánico y Preventivo
- **Trampeo de Monitoreo:** Instalar mosqueros o botellas de plastico recicladas con solucion de fosfato diamonico al 4% (40g por litro de agua) para monitorear la densidad de la plaga.
- **Barrera Física:** Aplicar caolin (arcilla blanca molida) a dosis de 3-5 kg por cada 100 L de agua sobre hojas y frutos. Crea una pelicula blanca protectora que despista a la mosca adulta y evita la picadura de puesta.
- **Fauna Útil:** Favorecer las poblaciones de parasitoides autoctonos (como *Opius concolor* o *Pnyxiopalpus*) evitando el uso de insecticidas de amplio espectro.

#### 🧪 Tratamiento Químico
- **Acción Focalizada:** En severidad leve no se aconseja tratamiento quimico generalizado. Si la densidad de mosca capturada supera los umbrales de tratamiento (1-2 moscas por trampa y dia), realizar aplicaciones localizadas con parche de **Spinosad** formulado como cebo atrayente en la cara sur de los arboles (pulverizar solo un metro cuadrado por arbol).
`,
    moderado: `### Recomendaciones para Mosca del Olivo (Severidad Moderada)

#### 🌱 Tratamiento Orgánico y Preventivo
- **Trampeo Masivo:** Colocar trampas de captura masiva (mosqueros comerciales con atrayentes alimenticios y feromonas) a razon de 50 a 80 trampas por hectarea para reducir la poblacion adulta de forma fisica.
- **Aplicación de Hongos Entomopatógenos:** Considerar el tratamiento foliar con *Beauveria bassiana* en condiciones de alta humedad relativa.
- **Uso de Spinosad:** Realizar pulverizaciones de cebo ecologico (mezcla de Spinosad con proteina hidrolizada) sobre las zonas mas soleadas del olivar.

#### 🧪 Tratamiento Químico
- **Pulverización Localizada (Cebo):** Utilizar insecticidas cebo especificos como **Deltametrina** o **Lambda-cihalotrina** mezclados con proteinas hidrolizadas (atrayente) al 1% o 2%. Se aplica solo en una parte de la copa de los arboles, reduciendo drasticamente el impacto ambiental.
- **Alternancia de Materias Activas:** Evitar resistencias alternando materias quimicas con diferente modo de accion.
`,
    grave: `### Recomendaciones para Mosca del Olivo (Severidad Grave)

#### 🌱 Tratamiento Orgánico y Preventivo
- **Cosecha Anticipada:** Planificar la recoleccion temprana de la aceituna para evitar que las picaduras de la mosca aumenten la acidez del aceite y propicien la caida del fruto.
- **Retirada de Frutos:** Recoger e inactivar (enterrar o compostar adecuadamente) los frutos caidos al suelo, evitando que las pupas completen su ciclo biologico e inicien nuevas generaciones.
- **Trampeo Masivo Severo:** Mantener y reforzar el trampeo de captura total en todo el perimetro de la parcela.

#### 🧪 Tratamiento Químico
- **Tratamiento Larvicida Total:** Aplicar insecticidas sistemicos o de penetracion autorizados (como **Fosmet** o formulados especificos permitidos) en pulverizacion total a la copa para controlar las larvas que ya estan activas dentro del fruto.
- **⚠️ Advertencia de Seguridad:** Respetar de manera estricta los plazos de seguridad de los agroquimicos antes de la cosecha para garantizar que no queden residuos en el aceite de oliva.
`
  },
  'Prays del olivo (Polilla)': {
    leve: `### Recomendaciones para Prays del Olivo (Severidad Leve)

#### 🌱 Tratamiento Orgánico y Preventivo
- **Monitoreo con Feromonas:** Instalar trampas tipo Delta con feromona sexual especifica para vigilar las curvas de vuelo de los adultos.
- **Favorecer la Fauna Útil:** Mantener la cubierta vegetal para fomentar depredadores naturales como el crisopido (*Chrysoperla carnea*), que consume huevos y larvas de Prays.

#### 🧪 Tratamiento Químico
- **Sin Intervención Química:** Con severidad leve no se justifica la aplicacion de pesticidas quimicos. Monitorear estrechamente la generacion antofaga (flor) y carpofaga (fruto).
`,
    moderado: `### Recomendaciones para Prays del Olivo (Severidad Moderada)

#### 🌱 Tratamiento Orgánico y Preventivo
- **Tratamiento con Bacillus thuringiensis:** Realizar pulverizaciones foliares con *Bacillus thuringiensis* subespecie *kurstaki* a la dosis recomendada por el fabricante. Este tratamiento biologico debe realizarse al inicio del brote o floracion (cuando se observe un 5-10% de flores abiertas), ya que actua por ingestion en las larvas jovenes.

#### 🧪 Tratamiento Químico
- **Pulverización en Generación Antófaga:** En caso de superar los umbrales economicos (mas del 10% de inflorescencias atacadas), aplicar insecticidas especificos como **Deltametrina** o **Beta-ciflutrina** antes de la apertura total de la flor para no afectar a los polinizadores.
`,
    grave: `### Recomendaciones para Prays del Olivo (Severidad Grave)

#### 🌱 Tratamiento Orgánico y Preventivo
- **Poda de Aclareo:** Podar ramas secas o excesivamente densas para mejorar la iluminacion y ventilacion interior de la copa, dificultando el refugio de los adultos de la polilla.
- **Mantenimiento Biológico:** Aumentar la biodiversidad y cubiertas en el suelo para maximizar los indices de parasitismo natural de larvas.

#### 🧪 Tratamiento Químico
- **Tratamiento de Choque Carpófago:** Si el ataque se produce en la aceituna (generacion carpofaga, caida de frutos de San Juan), se requiere un tratamiento a base de materias activas penetrantes como **Fosmet** o **Dimetoato** (si esta autorizado en su region) al inicio del vuelo de la tercera generacion (mes de junio).
- **⚠️ Advertencia:** No pulverizar durante las horas de maxima actividad de las abejas y respetar escrupulosamente las fichas tecnicas de los productos.
`
  },
  'Cochinilla tiznada (Saissetia oleae)': {
    leve: `### Recomendaciones para Cochinilla Tiznada (Severidad Leve)

#### 🌱 Tratamiento Orgánico y Preventivo
- **Poda de Ventilación:** Realizar podas que favorezcan la aireacion y entrada de luz solar directa en el interior del follaje. La cochinilla prospera en ambientes sombrios, humedos y densos.
- **Lavado de Melaza:** Si hay restos de melaza pegajosa, pulverizar agua a alta presion mezclada con **Jabon Potasico** al 1-2% para limpiar las hojas y ahogar los estadios larvarios jovenes.

#### 🧪 Tratamiento Químico
- **No Recomendado:** La cochinilla en estado leve no requiere tratamientos quimicos sinteticos y es facilmente controlable mediante poda y jabon potasico.
`,
    moderado: `### Recomendaciones para Cochinilla Tiznada (Severidad Moderada)

#### 🌱 Tratamiento Orgánico y Preventivo
- **Jabón Potásico + Aceite de Neem:** Aplicar una mezcla de jabon potasico al 2% y aceite de neem. Esto disuelve el escudo protector de las cochinillas jovenes y detiene su alimentacion.
- **Fauna Auxiliar:** Respetar a mariquitas (como *Chilocorus bipustulatus*) y parasitoides (*Metaphycus*) que devoran activamente a este insecto.

#### 🧪 Tratamiento Químico
- **Tratamiento en Momento Clave:** Aplicar insecticidas quimicos reguladores del crecimiento (como **Piriproxifen** o **Spirotetramat**) enfocando la aplicacion en el momento en que se produce la maxima eclosion de huevos (verano, presencia de larvas moviles de primer/segundo estadio). Las formas adultas protegidas con caparazon oscuro son inmunes a la mayoria de insecticidas.
`,
    grave: `### Recomendaciones para Cochinilla Tiznada (Severidad Grave)

#### 🌱 Tratamiento Orgánico y Preventivo
- **Lavado Sistemático de Negrilla:** La acumulacion grave de negrilla (hongo tiznado) bloquea la fotosintesis. Lavar intensivamente las copas con jabon potasico para desprender el hongo y limpiar el follaje.
- **Poda Drástica de Saneamiento:** Eliminar ramas extremadamente infestadas y quemarlas o triturarlas adecuadamente fuera de la parcela.

#### 🧪 Tratamiento Químico
- **Aplicación Combinada:** Realizar un tratamiento con insecticidas autorizados combinados con **Aceite de Parafina** (aceite mineral de verano) al 1% para actuar por asfixia sobre la plaga.
- **⚠️ Precaución de Fitotoxicidad:** No aplicar aceite mineral con temperaturas superiores a 30°C o en condiciones de estres hidrico severo para no quemar las hojas.
`
  },
  'Repilo del olivo (Spilocaea oleagina)': {
    leve: `### Recomendaciones para Repilo del Olivo (Severidad Leve)

#### 🌱 Tratamiento Orgánico y Preventivo
- **Poda de Aclareo:** Podar el arbol de manera selectiva para evitar microclimas de alta humedad relativa y sombreado prolongado dentro de la copa.
- **Monitoreo Foliar:** Inspeccionar las hojas inferiores y mas interiores del arbol, que son las mas propensas a desarrollar los circulos concentricos oscuros.

#### 🧪 Tratamiento Químico
- **Tratamiento Cúprico Preventivo:** Realizar una aplicacion foliar con compuestos de cobre (como **Oxicloruro de Cobre** o **Caldo Bordeles**) al inicio del otoño (antes de las lluvias persistentes) para evitar la germinacion de las esporas del hongo.
`,
    moderado: `### Recomendaciones para Repilo del Olivo (Severidad Moderada)

#### 🌱 Tratamiento Orgánico y Preventivo
- **Tratamiento con Cobre Ecológico:** Aplicar formulaciones de cobre permitidas en agricultura ecologica (como el **Hidroxido de Cobre** o **Sulfato Tribasico**).
- **Nutrición Correcta:** Asegurar un aporte equilibrado de potasio y nitrogeno. Evitar el exceso de fertilizacion nitrogenada, ya que estimula brotes demasiado tiernos y propensos a la infeccion por hongos.

#### 🧪 Tratamiento Químico
- **Fungicidas de Síntesis / Sistémicos:** En periodos de lluvias prolongadas y temperaturas suaves (15-20°C), los cobres pueden lavarse. Aplicar fungicidas sistemicos o penetrantes con efecto curativo (como **Tebuconazol**, **Kresoxim-metil** o **Difenoconazol**) para detener las infecciones ya establecidas en el interior de la hoja.
`,
    grave: `### Recomendaciones para Repilo del Olivo (Severidad Grave)

#### 🌱 Tratamiento Orgánico y Preventivo
- **Retirada de Hojas Caídas:** Recoger o triturar las hojas caidas al suelo para acelerar su descomposicion y disminuir la carga de esporas fungicas invernales en la parcela.
- **Retrasar Fertilización Nitrogenada:** Suspender de inmediato los abonos de nitrogeno de rapida liberacion.

#### 🧪 Tratamiento Químico
- **Tratamiento Curativo y Protector Inmediato:** Realizar una aplicacion combinada de fungicidas sistemicos (ej. **Difenoconazol** + **Kresoxim-metil**) con compuestos de cobre. Esto provee un control curativo de choque y una barrera protectora de larga duracion.
- **⚠️ Advertencia:** Respetar los plazos indicados en la etiqueta y evitar aplicaciones repetitivas de fungicidas del mismo grupo quimico para prevenir cepas de hongos resistentes.
`
  },
  'Hoja Sana': {
    leve: `### Recomendaciones para Hoja Sana (Monitoreo General)

#### 🌱 Mantenimiento Orgánico
- **Nutrición Equilibrada:** Mantener las practicas de abonado organico o compostaje para sostener la fertilidad natural del suelo.
- **Riego Óptimo:** Controlar la humedad del suelo evitando encharcamientos en la base del tronco que puedan favorecer hongos radiculares como el *Verticillium*.
- **Poda Regular:** Mantener podas anuales preventivas para asegurar una buena iluminacion del follaje y favorecer la maduracion del fruto.

#### 🧪 Manejo Químico Preventivo
- **Monitoreo Continuo:** No se requiere la aplicacion de tratamientos quimicos ni fungicidas en este estado. Mantener inspecciones visuales cada 15 dias, especialmente al inicio de la primavera y del otoño.
`,
    moderado: `### Recomendaciones para Hoja Sana (Monitoreo General)

#### 🌱 Mantenimiento Orgánico
- **Nutrición Equilibrada:** Mantener las practicas de abonado organico o compostaje para sostener la fertilidad natural del suelo.
- **Riego Óptimo:** Controlar la humedad del suelo evitando encharcamientos en la base del tronco que puedan favorecer hongos radiculares como el *Verticillium*.
- **Poda Regular:** Mantener podas anuales preventivas para asegurar una buena iluminacion del follaje y favorecer la maduracion del fruto.

#### 🧪 Manejo Químico Preventivo
- **Monitoreo Continuo:** No se requiere la aplicacion de tratamientos quimicos ni fungicidas en este estado. Mantener inspecciones visuales cada 15 dias, especialmente al inicio de la primavera y del otoño.
`,
    grave: `### Recomendaciones para Hoja Sana (Monitoreo General)

#### 🌱 Mantenimiento Orgánico
- **Nutrición Equilibrada:** Mantener las practicas de abonado organico o compostaje para sostener la fertilidad natural del suelo.
- **Riego Óptimo:** Controlar la humedad del suelo evitando encharcamientos en la base del tronco que puedan favorecer hongos radiculares como el *Verticillium*.
- **Poda Regular:** Mantener podas anuales preventivas para asegurar una buena iluminacion del follaje y favorecer la maduracion del fruto.

#### 🧪 Manejo Químico Preventivo
- **Monitoreo Continuo:** No se requiere la aplicacion de tratamientos quimicos ni fungicidas en este estado. Mantener inspecciones visuales cada 15 dias, especialmente al inicio de la primavera y del otoño.
`
  }
}

// Funcion que genera recomendaciones de tratamiento basadas en la plaga y nivel de severidad.
// Utiliza Claude de Anthropic o GPT de OpenAI si las llaves estan disponibles en el archivo .env.local.
// En caso contrario, retorna una recomendacion enriquecida del catalogo estatico en español.
export async function generarRecomendacion(plaga, severidad) {
  const severidadNormalizada = (severidad || 'leve').toLowerCase()
  
  // Limpiar posibles variaciones del nombre de la plaga
  let plagaNormalizada = plaga || 'Hoja Sana'
  if (plagaNormalizada.includes('Mosca')) plagaNormalizada = 'Mosca del olivo'
  if (plagaNormalizada.includes('Prays') || plagaNormalizada.includes('Polilla')) plagaNormalizada = 'Prays del olivo (Polilla)'
  if (plagaNormalizada.includes('Cochinilla')) plagaNormalizada = 'Cochinilla tiznada (Saissetia oleae)'
  if (plagaNormalizada.includes('Repilo')) plagaNormalizada = 'Repilo del olivo (Spilocaea oleagina)'
  if (plagaNormalizada.includes('Sana')) plagaNormalizada = 'Hoja Sana'

  // 1. Caso 1: Intentar conexion con Claude de Anthropic si hay API Key disponible
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1200,
          system: 'Eres un experto agrónomo especialista en el cultivo del olivo. Generas sugerencias de tratamiento altamente profesionales, estructuradas y detalladas en español. Devuelve tu respuesta formateada en Markdown con secciones claras para tratamiento ecológico/orgánico, tratamiento químico y advertencias de seguridad.',
          messages: [
            {
              role: 'user',
              content: `Genera una recomendación de tratamiento detallada para la plaga: "${plaga}" con nivel de severidad: "${severidad}".`
            }
          ]
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.content && data.content[0] && data.content[0].text) {
          return data.content[0].text
        }
      }
    } catch (error) {
      console.error('Error al consultar modelo de Anthropic:', error)
      // Continuar al fallback si ocurre un error de red o timeout
    }
  }

  // 2. Caso 2: Intentar conexion con OpenAI si hay API Key disponible
  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Eres un experto agrónomo especialista en el cultivo del olivo. Generas sugerencias de tratamiento altamente profesionales, estructuradas y detalladas en español. Devuelve tu respuesta formateada en Markdown con secciones claras para tratamiento ecológico/orgánico, tratamiento químico y advertencias de seguridad.'
            },
            {
              role: 'user',
              content: `Genera una recomendación de tratamiento para la plaga: "${plaga}" con nivel de severidad: "${severidad}".`
            }
          ],
          max_tokens: 1200,
          temperature: 0.7
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.choices && data.choices[0] && data.choices[0].message) {
          return data.choices[0].message.content
        }
      }
    } catch (error) {
      console.error('Error al consultar modelo de OpenAI:', error)
      // Continuar al fallback si falla la conexión
    }
  }

  // 3. Fallback: Retornar recomendación enriquecida offline
  const recomendacionPlaga = RECOMENDACIONES_FALLBACK[plagaNormalizada] || RECOMENDACIONES_FALLBACK['Hoja Sana']
  return recomendacionPlaga[severidadNormalizada] || recomendacionPlaga['leve']
}
