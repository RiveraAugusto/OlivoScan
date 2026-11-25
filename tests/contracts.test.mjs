import { describe,it,expect } from 'vitest'
import { normalizeDiagnosis } from '../lib/diagnostico'
import { enlaceInput,revisionInput,mismaUnidad,conclusionComparacion } from '../lib/contracts'
const raw={es_olivo:true,calidad_suficiente:true,reconocido:true,tiene_plaga:false,diagnostico:{porcentaje_certeza:82,nivel_severidad:'Ninguno',sintomas_observados:'Sin signos visibles'}}
describe('Resultados y contratos',()=>{
 it('la incertidumbre nunca se convierte en hoja sana',()=>{expect(normalizeDiagnosis({...raw,reconocido:false}).estado_diagnostico).toBe('no_reconocido');expect(normalizeDiagnosis({...raw,calidad_suficiente:false}).plaga_detectada).toBe('No reconocido')})
 it('las muestras sanas no tienen severidad leve por defecto',()=>expect(normalizeDiagnosis(raw).severidad).toBe('no_aplica'))
 it('rechaza respuestas de IA incompletas o con certeza fuera de rango',()=>{expect(()=>normalizeDiagnosis({...raw,tiene_plaga:true})).toThrow();expect(()=>normalizeDiagnosis({...raw,diagnostico:{...raw.diagnostico,porcentaje_certeza:101}})).toThrow()})
 it('compartir requiere selección explícita y limita el vencimiento',()=>{const id='10000000-0000-4000-8000-000000000001';expect(enlaceInput.parse({analisis_id:id,campos:['diagnostico']}).dias).toBe(7);expect(()=>enlaceInput.parse({analisis_id:id,campos:[],dias:31})).toThrow();expect(()=>enlaceInput.parse({analisis_id:id,campos:['usuario_id']})).toThrow()})
 it('una corrección profesional requiere explicación y diagnóstico',()=>expect(()=>revisionInput.parse({solicitud_id:'10000000-0000-4000-8000-000000000001',conclusion:'corregida',observaciones:'Explicación'})).toThrow())
 it('solo identifica evolución individual del mismo árbol y parcela',()=>{expect(mismaUnidad({parcela_id:'p',olivo_id:'o'},{parcela_id:'p',olivo_id:'o'})).toBe(true);expect(mismaUnidad({parcela_id:'p'},{parcela_id:'p'})).toBe(false);expect(conclusionComparacion({parcela_id:'p'},{parcela_id:'p'})).toContain('no acredita')})
})
