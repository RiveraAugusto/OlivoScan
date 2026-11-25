import { z } from 'zod'
const optionalText=z.string().max(8000).nullish()
export const diagnosticoSchema=z.object({
 es_olivo:z.boolean(),calidad_suficiente:z.boolean(),reconocido:z.boolean(),tiene_plaga:z.boolean(),
 mensaje_error:optionalText,
 diagnostico:z.object({
  plaga_nombre_comun:optionalText,plaga_nombre_cientifico:optionalText,
  porcentaje_certeza:z.number().finite().min(0).max(100),
  nivel_severidad:z.enum(['Leve','Moderado','Severo','Ninguno']),
  sintomas_observados:optionalText
 }).nullish(),
 recomendaciones:z.object({cultural_mecanico:optionalText,biologico_ecologico:optionalText,quimico_senasa:optionalText}).nullish()
}).superRefine((v,ctx)=>{
 if(v.es_olivo && v.calidad_suficiente && v.reconocido && (!v.diagnostico || (v.tiene_plaga && (!v.diagnostico.plaga_nombre_comun || v.diagnostico.nivel_severidad==='Ninguno'))))
  ctx.addIssue({code:'custom',message:'El diagnóstico está incompleto.'})
})
export function normalizeDiagnosis(raw) {
 const d=diagnosticoSchema.parse(raw)
 const unknown=!d.es_olivo || !d.calidad_suficiente || !d.reconocido
 const state=unknown?'no_reconocido':d.tiene_plaga?'posible_afeccion':'sano'
 const severity=state!=='posible_afeccion'?'no_aplica':({Leve:'leve',Moderado:'moderado',Severo:'grave'}[d.diagnostico.nivel_severidad])
 const recommendations=unknown?'No se dispone de un diagnóstico concluyente. Tome una fotografía más nítida o solicite revisión agronómica.':
  ['#### Orientaciones culturales y preventivas',d.recomendaciones?.cultural_mecanico || 'Mantenga la observación de la muestra.',
   '#### Orientaciones biológicas',d.recomendaciones?.biologico_ecologico || 'Consulte las fichas técnicas con un especialista.',
   '#### Consulta profesional',d.recomendaciones?.quimico_senasa || 'La elección de productos y dosis requiere revisión agronómica.',
   'Estas orientaciones no sustituyen una evaluación profesional ni constituyen una prescripción.'].join('\n\n')
 return {
  estado_diagnostico:state,
  plaga_detectada:unknown?'No reconocido':d.tiene_plaga?d.diagnostico.plaga_nombre_comun:'Hoja Sana',
  confianza:unknown?0:d.diagnostico.porcentaje_certeza,
  severidad:severity,
  descripcion:unknown?(d.mensaje_error || 'La imagen no permite una conclusión sobre el olivo.'):(d.diagnostico.sintomas_observados || 'No se observan signos de afección en esta muestra.'),
  recomendacion:recommendations
 }
}
