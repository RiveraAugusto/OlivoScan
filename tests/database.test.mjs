import { PGlite } from '@electric-sql/pglite'
import { readFile } from 'node:fs/promises'
import { beforeAll, afterAll, describe, it, expect } from 'vitest'
let db
const U = '10000000-0000-4000-8000-000000000001',
  V = '10000000-0000-4000-8000-000000000002',
  G = '10000000-0000-4000-8000-000000000003',
  A = '10000000-0000-4000-8000-000000000004'
const P = '20000000-0000-4000-8000-000000000001',
  Q = '20000000-0000-4000-8000-000000000002',
  O = '30000000-0000-4000-8000-000000000001'
const X = '40000000-0000-4000-8000-000000000001',
  H = '40000000-0000-4000-8000-000000000002'
async function as(user, task) {
  await db.exec('begin; set local role authenticated;')
  await db.query("select set_config('request.jwt.claim.sub',$1,true)", [user])
  try {
    return await task()
  } finally {
    await db.exec('rollback')
  }
}
async function committed(user, task) {
  await db.exec('begin; set local role authenticated;')
  await db.query("select set_config('request.jwt.claim.sub',$1,true)", [user])
  try {
    const r = await task()
    await db.exec('commit')
    return r
  } catch (e) {
    await db.exec('rollback')
    throw e
  }
}
beforeAll(async () => {
  db = new PGlite()
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}',created_at timestamptz default now());
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to authenticated,service_role;
    grant execute on function auth.uid() to authenticated,service_role;
  `)
  await db.exec(
    await readFile(
      new URL('../supabase/migrations/20261103000100_inicializar_olivoscan.sql', import.meta.url),
      'utf8',
    ),
  )
  for (const [id, nombre] of [
    [U, 'Propietario'],
    [V, 'Otro propietario'],
    [G, 'Profesional'],
    [A, 'Administrador'],
  ])
    await db.query('insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)', [
      id,
      id + '@example.test',
      JSON.stringify({ nombre }),
    ])
  await db.query(
    "insert into public.analisis(id,usuario_id,imagen_url,plaga_detectada,confianza,severidad) values($1,$2,'https://legacy.example.test/old.jpg','Hoja Sana',80,'leve')",
    [H, U],
  )
  await db.exec(
    await readFile(
      new URL('../supabase/migrations/20261125000100_primera_etapa.sql', import.meta.url),
      'utf8',
    ),
  )
  await db.query("update public.usuarios set rol='admin' where id=$1", [A])
  await db.query("update public.usuarios set rol='agronomo' where id=$1", [G])
  await db.query(
    "insert into public.parcelas(id,propietario_id,codigo,nombre) values($1,$2,'NORTE','Parcela Norte'),($3,$4,'SUR','Parcela Sur')",
    [P, U, Q, V],
  )
  await db.query("insert into public.olivos(id,parcela_id,codigo) values($1,$2,'OLV-025')", [O, P])
  await db.query(
    "insert into public.analisis(id,usuario_id,parcela_id,imagen_url,imagen_public_id,imagen_privada,plaga_detectada,confianza,severidad) values($1,$2,$3,'cloudinary://olivoscan/privadas/test','olivoscan/privadas/test',true,'Repilo',81,'moderado')",
    [X, U, P],
  )
})
afterAll(async () => {
  await db?.close()
})
describe('Migración y propiedad', () => {
  it('conserva el historial anterior sin fabricar parcela ni olivo', async () => {
    const { rows } = await as(U, () =>
      db.query('select parcela_id,olivo_id,plaga_detectada from analisis where id=$1', [H]),
    )
    expect(rows[0]).toEqual({ parcela_id: null, olivo_id: null, plaga_detectada: 'Hoja Sana' })
  })
  it('permite analizar por parcela sin identificar el olivo', async () => {
    const { rows } = await db.query('select olivo_id from analisis where id=$1', [X])
    expect(rows[0].olivo_id).toBeNull()
  })
  it('oculta análisis, parcelas y olivos ajenos', async () => {
    await as(V, async () => {
      expect((await db.query('select * from analisis where id=$1', [X])).rows).toHaveLength(0)
      expect((await db.query('select * from parcelas where id=$1', [P])).rows).toHaveLength(0)
      expect((await db.query('select * from olivos where id=$1', [O])).rows).toHaveLength(0)
    })
  })
  it('el administrador no obtiene el contenido de análisis por administrar cuentas', async () => {
    expect(
      (await as(A, () => db.query('select * from analisis where id=$1', [X]))).rows,
    ).toHaveLength(0)
  })
  it('exige parcela para nuevos diagnósticos', async () => {
    await expect(
      db.query(
        "insert into analisis(usuario_id,imagen_url,plaga_detectada,confianza,severidad) values($1,'x','x',10,'leve')",
        [U],
      ),
    ).rejects.toThrow()
  })
  it('rechaza una asociación a una parcela ajena', async () => {
    await expect(
      as(U, () => db.query('update analisis set parcela_id=$1 where id=$2', [Q, H])),
    ).rejects.toThrow()
  })
  it('el propietario puede asociar un registro anterior a su parcela sin olivo', async () => {
    await as(U, async () => {
      await db.query('update analisis set parcela_id=$1 where id=$2', [P, H])
      expect(
        (await db.query('select parcela_id,olivo_id from analisis where id=$1', [H])).rows[0],
      ).toEqual({ parcela_id: P, olivo_id: null })
    })
  })
  it('rechaza códigos de parcela duplicados ignorando mayúsculas y espacios', async () => {
    await expect(
      as(U, () =>
        db.query(
          "insert into parcelas(propietario_id,codigo,nombre) values($1,' norte ','Duplicada')",
          [U],
        ),
      ),
    ).rejects.toThrow()
  })
  it('el rol y los originales de IA no son editables desde el cliente', async () => {
    await expect(
      as(U, () => db.query("update usuarios set rol='admin' where id=$1", [U])),
    ).rejects.toThrow()
    await expect(
      as(U, () => db.query("update analisis set plaga_detectada='Inventado' where id=$1", [X])),
    ).rejects.toThrow()
  })
  it('una parcela archivada conserva historial y bloquea nuevas asociaciones', async () => {
    await committed(U, () => db.query('update parcelas set archivada=true where id=$1', [P]))
    expect(
      (await as(U, () => db.query('select id from analisis where id=$1', [X]))).rows,
    ).toHaveLength(1)
    await expect(
      as(U, () => db.query('update analisis set parcela_id=$1 where id=$2', [P, H])),
    ).rejects.toThrow()
    await committed(U, () => db.query('update parcelas set archivada=false where id=$1', [P]))
  })
})
describe('Revisión profesional y trazabilidad', () => {
  let requestId, revisionId
  it('solicita una revisión y evita solicitudes activas duplicadas', async () => {
    requestId = (
      await committed(U, () => db.query('select (public.solicitar_revision($1)).id', [X]))
    ).rows[0].id
    await expect(
      as(U, () => db.query('select public.solicitar_revision($1)', [X])),
    ).rejects.toThrow()
    expect(
      (await as(G, () => db.query('select id from analisis where id=$1', [X]))).rows,
    ).toHaveLength(0)
  })
  it('solo un administrador puede asignar un profesional autorizado', async () => {
    await expect(
      as(U, () => db.query("select gestionar_solicitud($1,'asignar',$2)", [requestId, G])),
    ).rejects.toThrow()
    await committed(A, () =>
      db.query("select gestionar_solicitud($1,'asignar',$2)", [requestId, G]),
    )
    expect(
      (await as(G, () => db.query('select id from analisis where id=$1', [X]))).rows,
    ).toHaveLength(1)
    expect(
      (await as(G, () => db.query('select id from parcelas where id=$1', [P]))).rows,
    ).toHaveLength(1)
  })
  it('diferencia feedback del agricultor y revisión profesional', async () => {
    await as(U, async () => {
      await db.query("update analisis set notas='Observación' where id=$1", [X])
      expect((await db.query('select * from revisiones_agronomicas')).rows).toHaveLength(0)
    })
  })
  it('emite y rectifica mediante versiones conservando la IA original', async () => {
    await committed(G, () => db.query("select gestionar_solicitud($1,'iniciar')", [requestId]))
    revisionId = (
      await committed(G, () =>
        db.query("select (emitir_revision($1,'confirmada','Revisión profesional',null,null)).id", [
          requestId,
        ]),
      )
    ).rows[0].id
    await committed(G, () =>
      db.query(
        "select emitir_revision($1,'corregida','Rectificación documentada','Otra afección',$2)",
        [requestId, revisionId],
      ),
    )
    const rows = (
      await as(U, () =>
        db.query('select version,autor_id from revisiones_agronomicas order by version'),
      )
    ).rows
    expect(rows).toEqual([
      { version: 1, autor_id: G },
      { version: 2, autor_id: G },
    ])
    expect(
      (await db.query('select plaga_detectada from analisis where id=$1', [X])).rows[0]
        .plaga_detectada,
    ).toBe('Repilo')
    await expect(
      as(G, () =>
        db.query("select emitir_revision($1,'confirmada','Versión obsoleta',null,$2)", [
          requestId,
          revisionId,
        ]),
      ),
    ).rejects.toThrow()
  })
  it('las revisiones emitidas no pueden sobrescribirse ni borrarse', async () => {
    await expect(
      as(G, () =>
        db.query("update revisiones_agronomicas set observaciones='Cambiar' where id=$1", [
          revisionId,
        ]),
      ),
    ).rejects.toThrow()
    await expect(
      as(U, () => db.query('delete from revisiones_agronomicas where id=$1', [revisionId])),
    ).rejects.toThrow()
  })
  it('cancelar o revocar rol bloquea el acceso nuevo sin borrar las revisiones', async () => {
    await committed(U, () => db.query("select gestionar_solicitud($1,'cancelar')", [requestId]))
    expect(
      (await as(G, () => db.query('select * from analisis where id=$1', [X]))).rows,
    ).toHaveLength(0)
    expect((await as(U, () => db.query('select * from revisiones_agronomicas'))).rows).toHaveLength(
      2,
    )
  })
  it('el permiso de revisar no concede edición de catálogo', async () => {
    expect((await as(G, () => db.query('select puede_gestionar_catalogo() ok'))).rows[0].ok).toBe(
      false,
    )
  })
})
describe('Enlaces privados y auditoría', () => {
  let linkId
  const hash = 'a'.repeat(64)
  it('solo el propietario publica campos expresamente seleccionados', async () => {
    await expect(
      as(V, () => db.query("select crear_enlace($1,$2,array['diagnostico'],7)", [X, hash])),
    ).rejects.toThrow()
    const r = await committed(U, () =>
      db.query("select crear_enlace($1,$2,array['diagnostico'],7) e", [X, hash]),
    )
    linkId = r.rows[0].e.id
    expect(JSON.stringify(r.rows[0])).not.toContain(hash)
  })
  it('no expone notas, ubicación, imagen ni revisión no seleccionadas', async () => {
    await db.exec('set role service_role')
    try {
      const r = await db.query('select consultar_enlace($1) e', [hash])
      expect(r.rows[0].e.plaga_detectada).toBe('Repilo')
      for (const field of ['notas', 'parcela', 'olivo', '_imagen_public_id', 'revisiones'])
        expect(r.rows[0].e).not.toHaveProperty(field)
    } finally {
      await db.exec('reset role')
    }
  })
  it('compartir revisiones conserva autoría y vínculo entre versiones sin publicar otros campos', async () => {
    const hash = 'e'.repeat(64)
    await committed(U, () => db.query("select crear_enlace($1,$2,array['revision'],7)", [X, hash]))
    await db.exec('set role service_role')
    try {
      const value = (await db.query('select consultar_enlace($1) d', [hash])).rows[0].d
      expect(value.revisiones).toHaveLength(2)
      const first = value.revisiones.find((r) => r.version === 1),
        second = value.revisiones.find((r) => r.version === 2)
      expect(first.autor_nombre).toBe('Profesional')
      expect(second.revision_anterior_id).toBe(first.id)
      expect(value).not.toHaveProperty('notas')
      expect(value).not.toHaveProperty('plaga_detectada')
    } finally {
      await db.exec('reset role')
    }
  })
  it('el cliente y anon no resuelven huellas ni consultan la tabla completa', async () => {
    await expect(as(U, () => db.query('select consultar_enlace($1)', [hash]))).rejects.toThrow()
    await expect(as(U, () => db.query('select huella from enlaces_compartidos'))).rejects.toThrow()
  })
  it('la revocación se aplica a las nuevas consultas y conserva auditoría sin secretos', async () => {
    await committed(U, () => db.query('select revocar_enlace($1)', [linkId]))
    await db.exec('set role service_role')
    try {
      expect((await db.query('select consultar_enlace($1) e', [hash])).rows[0].e).toBeNull()
    } finally {
      await db.exec('reset role')
    }
    const audit = (
      await db.query('select accion from eventos_auditoria where recurso_id=$1 order by id', [
        linkId,
      ])
    ).rows.map((r) => r.accion)
    expect(audit).toEqual(['crear_enlace', 'revocar_enlace'])
    expect(JSON.stringify((await db.query('select * from eventos_auditoria')).rows)).not.toContain(
      hash,
    )
  })
  it('rechaza plazos superiores a 30 días y fotografías heredadas aún públicas', async () => {
    await expect(
      as(U, () =>
        db.query("select crear_enlace($1,$2,array['diagnostico'],31)", [X, 'b'.repeat(64)]),
      ),
    ).rejects.toThrow()
    await expect(
      as(U, () => db.query("select crear_enlace($1,$2,array['imagen'],7)", [H, 'b'.repeat(64)])),
    ).rejects.toThrow()
  })
  it('retirar un análisis cancela acceso compartido y revisiones manteniendo la trazabilidad', async () => {
    const h = 'c'.repeat(64)
    await committed(U, () => db.query("select crear_enlace($1,$2,array['diagnostico'],7)", [X, h]))
    await as(U, async () => {
      await db.query('select eliminar_analisis_seguro($1)', [X])
      expect((await db.query('select * from analisis where id=$1', [X])).rows).toHaveLength(0)
    })
  })
})

describe('Integridad adicional de parcelas y revisiones', () => {
  it('rechaza un olivo perteneciente a otra parcela y códigos duplicados dentro de una parcela', async () => {
    await expect(
      db.query("insert into olivos(parcela_id,codigo) values($1,' olv-025 ')", [P]),
    ).rejects.toThrow()
    const foreign = (
      await db.query("insert into olivos(parcela_id,codigo) values($1,'AJENO') returning id", [Q])
    ).rows[0].id
    await expect(
      as(U, () => db.query('update analisis set olivo_id=$1 where id=$2', [foreign, X])),
    ).rejects.toThrow()
  })
  it('un olivo archivado conserva muestras antiguas y bloquea nuevas asociaciones', async () => {
    await as(U, async () => {
      await db.query('update analisis set olivo_id=$1 where id=$2', [O, X])
      await db.query('update olivos set archivado=true where id=$1', [O])
      expect(
        (await db.query('select olivo_id from analisis where id=$1', [X])).rows[0].olivo_id,
      ).toBe(O)
    })
    await committed(U, () => db.query('update olivos set archivado=true where id=$1', [O]))
    await expect(
      as(U, () => db.query('update analisis set olivo_id=$1 where id=$2', [O, X])),
    ).rejects.toThrow()
    await committed(U, () => db.query('update olivos set archivado=false where id=$1', [O]))
  })
  it('filtra por parcela y olivo sin alterar el total por paginación', async () => {
    await as(U, async () => {
      await db.query('update analisis set olivo_id=$1 where id=$2', [O, X])
      const r = (
        await db.query(
          'select listar_analisis_filtrados(p_parcela=>$1,p_olivo=>$2,p_limite=>1) d',
          [P, O],
        )
      ).rows[0].d
      expect(r.total).toBe(1)
      expect(r.ids).toEqual([X])
      const stats = (await db.query('select estadisticas_propias() d')).rows[0].d
      expect(stats.totalAnalisis).toBe(2)
      expect(stats.parcelasAnalizadas).toBe(1)
      expect(stats.olivosConMuestras).toBe(1)
      expect(stats.distribucionParcelas.find((p) => p.parcela_id === P).muestras).toBe(1)
      expect(stats.distribucionParcelas.find((p) => p.parcela_id === null).muestras).toBe(1)
    })
  })
  it('emite no concluyente, impide corrección vacía y bloquea un rol retirado', async () => {
    const request = (await committed(U, () => db.query('select (solicitar_revision($1)).id', [H])))
      .rows[0].id
    await committed(A, () => db.query("select gestionar_solicitud($1,'asignar',$2)", [request, G]))
    await committed(G, () => db.query("select gestionar_solicitud($1,'iniciar')", [request]))
    await expect(
      as(G, () =>
        db.query("select emitir_revision($1,'corregida','Falta diagnóstico',null,null)", [request]),
      ),
    ).rejects.toThrow()
    const revision = (
      await committed(G, () =>
        db.query(
          "select (emitir_revision($1,'no_concluyente','Se requiere visita de campo',null,null)).id",
          [request],
        ),
      )
    ).rows[0].id
    expect(
      (
        await as(U, () =>
          db.query('select conclusion from revisiones_agronomicas where id=$1', [revision]),
        )
      ).rows[0].conclusion,
    ).toBe('no_concluyente')
    await expect(
      as(A, async () => {
        await db.query("select gestionar_perfil_profesional($1,'agricultor',false)", [G])
        await db.query("select set_config('request.jwt.claim.sub',$1,true)", [G])
        expect((await db.query('select * from analisis where id=$1', [H])).rows).toHaveLength(0)
        await db.query("select emitir_revision($1,'confirmada','Sin permiso',null,$2)", [
          request,
          revision,
        ])
      }),
    ).rejects.toThrow()
  })
  it('el vencimiento real bloquea tanto los datos como la referencia a la imagen', async () => {
    const hash = 'd'.repeat(64)
    const link = (
      await committed(U, () =>
        db.query("select crear_enlace($1,$2,array['imagen'],1) d", [X, hash]),
      )
    ).rows[0].d.id
    await db.exec('set role service_role')
    try {
      const value = (await db.query('select consultar_enlace($1) d', [hash])).rows[0].d
      expect(value._imagen_public_id).toBe('olivoscan/privadas/test')
      expect(value).not.toHaveProperty('notas')
    } finally {
      await db.exec('reset role')
    }
    await db.query(
      "update enlaces_compartidos set creado_en=now()-interval '2 days',vence_en=now()-interval '1 day' where id=$1",
      [link],
    )
    await db.exec('set role service_role')
    try {
      expect((await db.query('select consultar_enlace($1) d', [hash])).rows[0].d).toBeNull()
    } finally {
      await db.exec('reset role')
    }
  })
})
