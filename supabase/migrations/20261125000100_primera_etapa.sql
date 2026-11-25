-- Primera etapa del SRS/SAD 1.1. Migración aditiva: no altera cuentas ni diagnósticos originales.
begin;

alter table public.usuarios drop constraint if exists usuarios_rol_check;
alter table public.usuarios add constraint usuarios_rol_check check (rol in ('agricultor','agronomo','admin'));
alter table public.usuarios add column gestionar_catalogo boolean not null default false;

create table public.parcelas (
  id uuid primary key default gen_random_uuid(),
  propietario_id uuid not null references public.usuarios(id),
  codigo text not null check (length(trim(codigo)) between 1 and 40),
  nombre text not null check (length(trim(nombre)) between 1 and 120),
  archivada boolean not null default false,
  creado_en timestamptz not null default now(),
  unique (id, propietario_id)
);
create unique index parcelas_codigo_unico on public.parcelas(propietario_id, lower(trim(codigo)));
create table public.olivos (
  id uuid primary key default gen_random_uuid(),
  parcela_id uuid not null references public.parcelas(id),
  codigo text not null check (length(trim(codigo)) between 1 and 40),
  archivado boolean not null default false,
  creado_en timestamptz not null default now(),
  unique(id, parcela_id)
);
create unique index olivos_codigo_unico on public.olivos(parcela_id, lower(trim(codigo)));

alter table public.analisis
  add column parcela_id uuid,
  add column olivo_id uuid,
  add column imagen_public_id text,
  add column imagen_privada boolean not null default false,
  add column estado_diagnostico text not null default 'posible_afeccion'
    check (estado_diagnostico in ('sano','posible_afeccion','no_reconocido')),
  add column advertencias_imagen text[] not null default '{}',
  add column procesamiento_imagen jsonb not null default '{}',
  add column eliminado_en timestamptz,
  add constraint analisis_parcela_propietario_fk foreign key(parcela_id,usuario_id)
    references public.parcelas(id,propietario_id),
  add constraint analisis_olivo_parcela_fk foreign key(olivo_id,parcela_id)
    references public.olivos(id,parcela_id);
alter table public.analisis drop constraint if exists analisis_severidad_check;
alter table public.analisis add constraint analisis_severidad_check check (severidad in ('leve','moderado','grave','no_aplica'));
update public.analisis set estado_diagnostico='sano' where plaga_detectada='Hoja Sana';
create index analisis_parcela_fecha on public.analisis(parcela_id,creado_en desc);
create index analisis_olivo_fecha on public.analisis(olivo_id,creado_en desc);

create table public.solicitudes_revision (
  id uuid primary key default gen_random_uuid(),
  analisis_id uuid not null references public.analisis(id),
  propietario_id uuid not null references public.usuarios(id),
  agronomo_id uuid references public.usuarios(id),
  estado text not null default 'pendiente' check (estado in ('pendiente','en_revision','revisada','cancelada')),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create unique index solicitud_activa_unica on public.solicitudes_revision(analisis_id)
  where estado in ('pendiente','en_revision');
create index solicitudes_agronomo on public.solicitudes_revision(agronomo_id,estado);
create table public.revisiones_agronomicas (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid not null references public.solicitudes_revision(id),
  autor_id uuid not null references public.usuarios(id),
  autor_nombre text not null,
  version integer not null check (version>0),
  conclusion text not null check (conclusion in ('confirmada','corregida','no_concluyente')),
  plaga_corregida text,
  observaciones text not null check (length(trim(observaciones)) between 1 and 4000),
  revision_anterior_id uuid,
  creado_en timestamptz not null default now(),
  unique(solicitud_id,version),
  unique(id,solicitud_id),
  foreign key(revision_anterior_id,solicitud_id) references public.revisiones_agronomicas(id,solicitud_id),
  check ((version=1 and revision_anterior_id is null) or (version>1 and revision_anterior_id is not null)),
  check (conclusion<>'corregida' or (plaga_corregida is not null and length(trim(plaga_corregida)) between 1 and 200))
);
create table public.enlaces_compartidos (
  id uuid primary key default gen_random_uuid(),
  analisis_id uuid not null references public.analisis(id),
  propietario_id uuid not null references public.usuarios(id),
  huella text not null unique check (huella ~ '^[a-f0-9]{64}$'),
  campos text[] not null check (
    cardinality(campos)>0 and campos <@ array['imagen','diagnostico','recomendacion','notas','ubicacion','revision']::text[]
  ),
  creado_en timestamptz not null default now(),
  vence_en timestamptz not null,
  revocado_en timestamptz,
  check (vence_en>creado_en and vence_en<=creado_en+interval '30 days')
);
create table public.eventos_auditoria (
  id bigint generated always as identity primary key,
  actor_id uuid,
  accion text not null,
  recurso_id uuid,
  recurso_tipo text not null,
  resultado text not null default 'permitido',
  creado_en timestamptz not null default now()
);
alter table public.notificaciones drop constraint if exists notificaciones_tipo_check;
alter table public.notificaciones add constraint notificaciones_tipo_check
 check (tipo in ('analisis_completo','alerta','solicitud_revision','revision_emitida'));
alter table public.notificaciones add column solicitud_id uuid references public.solicitudes_revision(id);

create function public.es_admin() returns boolean language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.usuarios where id=(select auth.uid()) and rol='admin') $$;
create function public.puede_gestionar_catalogo() returns boolean language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.usuarios where id=(select auth.uid()) and
 (rol='admin' or (rol='agronomo' and gestionar_catalogo))) $$;
create function public.puede_leer_analisis(p_id uuid) returns boolean language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.analisis a where a.id=p_id and a.eliminado_en is null and
 (a.usuario_id=(select auth.uid()) or exists(
   select 1 from public.solicitudes_revision s join public.usuarios u on u.id=s.agronomo_id
   where s.analisis_id=a.id and s.agronomo_id=(select auth.uid()) and s.estado<>'cancelada' and u.rol='agronomo'
 ))) $$;
create function public.auditar(p_accion text,p_id uuid,p_tipo text,p_actor uuid default auth.uid())
returns void language sql security definer set search_path=''
as $$ insert into public.eventos_auditoria(actor_id,accion,recurso_id,recurso_tipo)
 values(p_actor,p_accion,p_id,p_tipo) $$;

create function public.validar_asociacion_analisis() returns trigger language plpgsql security definer set search_path=''
as $$
begin
  if TG_OP='INSERT' and new.parcela_id is null then
    raise exception 'Seleccione una parcela para el nuevo análisis.' using errcode='23514';
  end if;
  if new.olivo_id is not null and new.parcela_id is null then
    raise exception 'El olivo necesita una parcela.' using errcode='23514';
  end if;
  if TG_OP='INSERT' or new.parcela_id is distinct from old.parcela_id or new.olivo_id is distinct from old.olivo_id then
    if new.parcela_id is not null and not exists(select 1 from public.parcelas p
      where p.id=new.parcela_id and p.propietario_id=new.usuario_id and not p.archivada) then
      raise exception 'La parcela no está disponible.' using errcode='23514';
    end if;
    if new.olivo_id is not null and not exists(select 1 from public.olivos o
      where o.id=new.olivo_id and o.parcela_id=new.parcela_id and not o.archivado) then
      raise exception 'El olivo no pertenece a una parcela activa.' using errcode='23514';
    end if;
  end if;
  return new;
end; $$;
create trigger validar_asociacion_analisis before insert or update on public.analisis
 for each row execute function public.validar_asociacion_analisis();
create function public.validar_olivo_activo() returns trigger language plpgsql security definer set search_path=''
as $$ begin
  if TG_OP='INSERT' or new.parcela_id is distinct from old.parcela_id or (old.archivado and not new.archivado) then
    if not exists(select 1 from public.parcelas p where p.id=new.parcela_id and not p.archivada) then
      raise exception 'La parcela está archivada.' using errcode='23514';
    end if;
  end if;
  return new;
end; $$;
create trigger validar_olivo_activo before insert or update on public.olivos
 for each row execute function public.validar_olivo_activo();
create function public.auditar_cultivo() returns trigger language plpgsql security definer set search_path=''
as $$ begin
  perform public.auditar(lower(TG_OP),new.id,TG_TABLE_NAME);
  return new;
end; $$;
create trigger auditar_parcelas after insert or update on public.parcelas for each row execute function public.auditar_cultivo();
create trigger auditar_olivos after insert or update on public.olivos for each row execute function public.auditar_cultivo();

create function public.solicitar_revision(p_analisis uuid) returns public.solicitudes_revision
language plpgsql security definer set search_path=''
as $$ declare resultado public.solicitudes_revision;
begin
  if not exists(select 1 from public.analisis where id=p_analisis and usuario_id=auth.uid() and eliminado_en is null) then
    raise exception 'El análisis no está disponible.' using errcode='42501';
  end if;
  insert into public.solicitudes_revision(analisis_id,propietario_id) values(p_analisis,auth.uid()) returning * into resultado;
  perform public.auditar('solicitar_revision',resultado.id,'solicitudes_revision');
  return resultado;
end; $$;
create function public.gestionar_solicitud(p_id uuid,p_accion text,p_agronomo uuid default null)
returns public.solicitudes_revision language plpgsql security definer set search_path=''
as $$ declare s public.solicitudes_revision;
begin
 select * into s from public.solicitudes_revision where id=p_id for update;
 if not found then raise exception 'Solicitud no disponible.' using errcode='42501'; end if;
 if p_accion='asignar' then
   if not public.es_admin() or s.estado not in ('pendiente','en_revision') then
     raise exception 'No puede asignar esta solicitud.' using errcode='42501'; end if;
   if not exists(select 1 from public.usuarios where id=p_agronomo and rol='agronomo') then
     raise exception 'Seleccione un agrónomo autorizado.' using errcode='23514'; end if;
   update public.solicitudes_revision set agronomo_id=p_agronomo,estado='pendiente',actualizado_en=now() where id=p_id returning * into s;
   insert into public.notificaciones(usuario_id,mensaje,tipo,solicitud_id)
     values(p_agronomo,'Tiene una solicitud de revisión asignada.','solicitud_revision',s.id);
 elsif p_accion='iniciar' then
   if s.agronomo_id is distinct from auth.uid() or s.estado<>'pendiente' or
      not exists(select 1 from public.usuarios where id=auth.uid() and rol='agronomo') then
     raise exception 'No puede iniciar esta revisión.' using errcode='42501'; end if;
   update public.solicitudes_revision set estado='en_revision',actualizado_en=now() where id=p_id returning * into s;
 elsif p_accion='cancelar' then
   if not (s.propietario_id=auth.uid() or public.es_admin()) or s.estado='cancelada' then
     raise exception 'No puede cancelar esta solicitud.' using errcode='42501'; end if;
   update public.solicitudes_revision set estado='cancelada',actualizado_en=now() where id=p_id returning * into s;
 else raise exception 'Acción inválida.' using errcode='23514';
 end if;
 perform public.auditar(p_accion||'_revision',s.id,'solicitudes_revision');
 return s;
end; $$;
create function public.emitir_revision(p_solicitud uuid,p_conclusion text,p_observaciones text,
  p_plaga_corregida text default null,p_anterior uuid default null)
returns public.revisiones_agronomicas language plpgsql security definer set search_path=''
as $$ declare s public.solicitudes_revision; ultima public.revisiones_agronomicas; nueva public.revisiones_agronomicas;
begin
 select * into s from public.solicitudes_revision where id=p_solicitud for update;
 if not found or s.agronomo_id is distinct from auth.uid() or s.estado not in ('en_revision','revisada') or
    not exists(select 1 from public.usuarios where id=auth.uid() and rol='agronomo') or
    not exists(select 1 from public.analisis where id=s.analisis_id and eliminado_en is null) then
   raise exception 'No tiene permiso para emitir esta revisión.' using errcode='42501'; end if;
 select * into ultima from public.revisiones_agronomicas where solicitud_id=s.id order by version desc limit 1;
 if ultima.id is distinct from p_anterior then
   raise exception 'La revisión cambió. Recargue antes de rectificar.' using errcode='40001'; end if;
 insert into public.revisiones_agronomicas(solicitud_id,autor_id,autor_nombre,version,conclusion,plaga_corregida,observaciones,revision_anterior_id)
 values(s.id,auth.uid(),(select nombre from public.usuarios where id=auth.uid()),coalesce(ultima.version,0)+1,p_conclusion,
   case when p_conclusion='corregida' then nullif(trim(p_plaga_corregida),'') else null end,trim(p_observaciones),ultima.id)
 returning * into nueva;
 update public.solicitudes_revision set estado='revisada',actualizado_en=now() where id=s.id;
 insert into public.notificaciones(usuario_id,mensaje,tipo,solicitud_id)
 values(s.propietario_id,'Se ha emitido una revisión agronómica de su análisis.','revision_emitida',s.id);
 perform public.auditar('emitir_revision',nueva.id,'revisiones_agronomicas');
 return nueva;
end; $$;

create function public.crear_enlace(p_analisis uuid,p_huella text,p_campos text[],p_dias integer default 7)
returns jsonb language plpgsql security definer set search_path=''
as $$ declare a public.analisis; e public.enlaces_compartidos;
begin
 select * into a from public.analisis where id=p_analisis and usuario_id=auth.uid() and eliminado_en is null;
 if not found then raise exception 'El análisis no está disponible.' using errcode='42501'; end if;
 if p_dias not between 1 and 30 then raise exception 'El plazo debe ser de 1 a 30 días.' using errcode='23514'; end if;
 if 'imagen'=any(p_campos) and not a.imagen_privada then
   raise exception 'La fotografía histórica necesita migración privada antes de compartirla.' using errcode='23514'; end if;
 insert into public.enlaces_compartidos(analisis_id,propietario_id,huella,campos,vence_en)
 values(a.id,auth.uid(),p_huella,p_campos,now()+make_interval(days=>p_dias)) returning * into e;
 perform public.auditar('crear_enlace',e.id,'enlaces_compartidos');
 return jsonb_build_object('id',e.id,'campos',e.campos,'vence_en',e.vence_en);
end; $$;
create function public.revocar_enlace(p_id uuid) returns void language plpgsql security definer set search_path=''
as $$ begin
 update public.enlaces_compartidos set revocado_en=coalesce(revocado_en,now()) where id=p_id and propietario_id=auth.uid();
 if not found then raise exception 'Enlace no disponible.' using errcode='42501'; end if;
 perform public.auditar('revocar_enlace',p_id,'enlaces_compartidos');
end; $$;

-- Solo el servidor puede resolver la huella y recuperar la referencia de almacenamiento.
create function public.consultar_enlace(p_huella text) returns jsonb language plpgsql security definer set search_path=''
as $$ declare e public.enlaces_compartidos; a public.analisis; resultado jsonb;
begin
 select * into e from public.enlaces_compartidos where huella=p_huella and revocado_en is null and vence_en>now();
 if not found then return null; end if;
 select * into a from public.analisis where id=e.analisis_id and eliminado_en is null;
 if not found then return null; end if;
 resultado=jsonb_build_object('campos',e.campos,'vence_en',e.vence_en,'creado_en',a.creado_en);
 if 'diagnostico'=any(e.campos) then resultado=resultado||jsonb_build_object('plaga_detectada',a.plaga_detectada,
  'confianza',a.confianza,'severidad',a.severidad,'descripcion',a.descripcion,'modelo_version',a.modelo_version,'estado_diagnostico',a.estado_diagnostico); end if;
 if 'recomendacion'=any(e.campos) then resultado=resultado||jsonb_build_object('recomendacion',a.recomendacion); end if;
 if 'notas'=any(e.campos) then resultado=resultado||jsonb_build_object('notas',a.notas,'plaga_corregida',a.plaga_corregida); end if;
 if 'ubicacion'=any(e.campos) then resultado=resultado||jsonb_build_object(
   'parcela',(select jsonb_build_object('codigo',p.codigo,'nombre',p.nombre) from public.parcelas p where p.id=a.parcela_id),
   'olivo',(select jsonb_build_object('codigo',o.codigo) from public.olivos o where o.id=a.olivo_id)); end if;
 if 'revision'=any(e.campos) then resultado=resultado||jsonb_build_object('revisiones',coalesce((
   select jsonb_agg(jsonb_build_object('autor_nombre',r.autor_nombre,'creado_en',r.creado_en,'conclusion',r.conclusion,
   'observaciones',r.observaciones,'plaga_corregida',r.plaga_corregida,'version',r.version) order by r.creado_en)
   from public.revisiones_agronomicas r join public.solicitudes_revision s on s.id=r.solicitud_id where s.analisis_id=a.id),'[]'::jsonb)); end if;
 if 'imagen'=any(e.campos) and a.imagen_privada then resultado=resultado||jsonb_build_object('_imagen_public_id',a.imagen_public_id); end if;
 return resultado;
end; $$;
create function public.eliminar_analisis_seguro(p_id uuid) returns void language plpgsql security definer set search_path=''
as $$ begin
 update public.analisis set eliminado_en=now() where id=p_id and usuario_id=auth.uid() and eliminado_en is null;
 if not found then raise exception 'Análisis no disponible.' using errcode='42501'; end if;
 update public.enlaces_compartidos set revocado_en=coalesce(revocado_en,now()) where analisis_id=p_id;
 update public.solicitudes_revision set estado='cancelada',actualizado_en=now() where analisis_id=p_id and estado<>'cancelada';
 perform public.auditar('retirar_analisis',p_id,'analisis');
end; $$;
create function public.gestionar_perfil_profesional(p_usuario uuid,p_rol text,p_catalogo boolean default false)
returns void language plpgsql security definer set search_path=''
as $$ begin
 if not public.es_admin() or p_rol not in ('agricultor','agronomo') then
   raise exception 'No puede conceder ese rol.' using errcode='42501'; end if;
 update public.usuarios set rol=p_rol,gestionar_catalogo=(p_rol='agronomo' and p_catalogo) where id=p_usuario and rol<>'admin';
 if not found then raise exception 'Perfil no disponible.' using errcode='23514'; end if;
 perform public.auditar('gestionar_rol',p_usuario,'usuarios');
end; $$;
create function public.listar_perfiles_admin()
returns table(id uuid,nombre text,rol text,gestionar_catalogo boolean)
language plpgsql security definer set search_path=''
as $$ begin
 if not public.es_admin() then raise exception 'Operación administrativa.' using errcode='42501'; end if;
 return query select u.id,u.nombre,u.rol,u.gestionar_catalogo from public.usuarios u order by u.nombre;
end; $$;

alter table public.parcelas enable row level security;
alter table public.olivos enable row level security;
alter table public.solicitudes_revision enable row level security;
alter table public.revisiones_agronomicas enable row level security;
alter table public.enlaces_compartidos enable row level security;
alter table public.eventos_auditoria enable row level security;
grant select,insert on public.parcelas,public.olivos to authenticated;
grant update(codigo,nombre,archivada) on public.parcelas to authenticated;
grant update(codigo,archivado) on public.olivos to authenticated;
grant select on public.solicitudes_revision,public.revisiones_agronomicas to authenticated;
grant select(id,analisis_id,campos,creado_en,vence_en,revocado_en) on public.enlaces_compartidos to authenticated;
grant all on public.parcelas,public.olivos,public.solicitudes_revision,public.revisiones_agronomicas,public.enlaces_compartidos,public.eventos_auditoria to service_role;
grant usage,select on sequence public.eventos_auditoria_id_seq to service_role;

create policy parcelas_propias on public.parcelas for all to authenticated
 using (propietario_id=(select auth.uid())) with check (propietario_id=(select auth.uid()));
create policy olivos_propios on public.olivos for all to authenticated
 using (exists(select 1 from public.parcelas p where p.id=parcela_id and p.propietario_id=(select auth.uid())))
 with check (exists(select 1 from public.parcelas p where p.id=parcela_id and p.propietario_id=(select auth.uid()) and not p.archivada));
create policy parcelas_casos_asignados on public.parcelas for select to authenticated using (exists(select 1 from public.analisis a where a.parcela_id=parcelas.id and public.puede_leer_analisis(a.id)));
create policy olivos_casos_asignados on public.olivos for select to authenticated using (exists(select 1 from public.analisis a where a.olivo_id=olivos.id and public.puede_leer_analisis(a.id)));
create policy solicitudes_autorizadas on public.solicitudes_revision for select to authenticated using (
 propietario_id=(select auth.uid()) or public.es_admin() or (agronomo_id=(select auth.uid()) and estado<>'cancelada'
 and exists(select 1 from public.usuarios where id=(select auth.uid()) and rol='agronomo')));
create policy revisiones_autorizadas on public.revisiones_agronomicas for select to authenticated using (
 exists(select 1 from public.solicitudes_revision s where s.id=solicitud_id and
 (s.propietario_id=(select auth.uid()) or (s.agronomo_id=(select auth.uid()) and s.estado<>'cancelada'
 and exists(select 1 from public.usuarios where id=(select auth.uid()) and rol='agronomo')))));
create policy enlaces_propios on public.enlaces_compartidos for select to authenticated using(propietario_id=(select auth.uid()));

drop policy analisis_ver_propios on public.analisis;
create policy analisis_lectura_autorizada on public.analisis for select to authenticated using(public.puede_leer_analisis(id));
-- Diagnósticos originales: escritura solo desde el servidor. El propietario puede aportar notas/asociar registros anteriores.
revoke insert,delete on public.analisis from authenticated;
grant update(parcela_id,olivo_id) on public.analisis to authenticated;
drop policy catalogo_crear_admin on public.plagas_catalogo;
drop policy catalogo_editar_admin on public.plagas_catalogo;
drop policy catalogo_eliminar_admin on public.plagas_catalogo;
create policy catalogo_crear_autorizado on public.plagas_catalogo for insert to authenticated with check(public.puede_gestionar_catalogo());
create policy catalogo_editar_autorizado on public.plagas_catalogo for update to authenticated
 using(public.puede_gestionar_catalogo()) with check(public.puede_gestionar_catalogo());
create policy catalogo_eliminar_autorizado on public.plagas_catalogo for delete to authenticated using(public.puede_gestionar_catalogo());

-- Revocar el permiso de ejecución público predeterminado en todas las funciones nuevas.
revoke all on function public.es_admin(),public.puede_gestionar_catalogo(),public.puede_leer_analisis(uuid),
 public.auditar(text,uuid,text,uuid),public.validar_asociacion_analisis(),public.validar_olivo_activo(),public.auditar_cultivo(),
 public.solicitar_revision(uuid),public.gestionar_solicitud(uuid,text,uuid),
 public.emitir_revision(uuid,text,text,text,uuid),public.crear_enlace(uuid,text,text[],integer),
 public.revocar_enlace(uuid),public.consultar_enlace(text),public.eliminar_analisis_seguro(uuid),
 public.gestionar_perfil_profesional(uuid,text,boolean),public.listar_perfiles_admin()
 from public,anon,authenticated;
grant execute on function public.es_admin(),public.puede_gestionar_catalogo(),public.puede_leer_analisis(uuid),
 public.solicitar_revision(uuid),public.gestionar_solicitud(uuid,text,uuid),
 public.emitir_revision(uuid,text,text,text,uuid),public.crear_enlace(uuid,text,text[],integer),
 public.revocar_enlace(uuid),public.eliminar_analisis_seguro(uuid),
 public.gestionar_perfil_profesional(uuid,text,boolean),public.listar_perfiles_admin() to authenticated;
grant execute on function public.consultar_enlace(text) to service_role;

-- Consultas de historial y métricas completas; no dependen del límite de filas de PostgREST.
create function public.listar_analisis_filtrados(
 p_parcela uuid default null,p_olivo uuid default null,p_severidad text default null,p_estado text default null,
 p_busqueda text default '',p_desde timestamptz default null,p_hasta timestamptz default null,
 p_offset integer default 0,p_limite integer default 20
) returns jsonb language plpgsql stable security definer set search_path=''
as $$ begin
 if auth.uid() is null or p_offset<0 or p_limite not between 1 and 100 or length(p_busqueda)>120 then
  raise exception 'Consulta inválida.' using errcode='23514'; end if;
 return (
 with base as (
  select a.id,a.creado_en from public.analisis a where a.usuario_id=auth.uid() and a.eliminado_en is null
  and (p_parcela is null or a.parcela_id=p_parcela) and (p_olivo is null or a.olivo_id=p_olivo)
  and (p_severidad is null or a.severidad=p_severidad)
  and (p_desde is null or a.creado_en>=p_desde) and (p_hasta is null or a.creado_en<p_hasta)
  and (p_busqueda='' or position(lower(p_busqueda) in lower(a.plaga_detectada||' '||coalesce(a.plaga_corregida,'')||' '||coalesce(a.notas,'')))>0)
  and (p_estado is null or
   (p_estado in ('pendiente','en_revision') and exists(select 1 from public.solicitudes_revision s where s.analisis_id=a.id and s.estado=p_estado)) or
   (p_estado='revisada' and exists(select 1 from public.solicitudes_revision s join public.revisiones_agronomicas r on r.solicitud_id=s.id where s.analisis_id=a.id)
     and not exists(select 1 from public.solicitudes_revision s where s.analisis_id=a.id and s.estado in ('pendiente','en_revision'))) or
   (p_estado='sin_solicitud' and not exists(select 1 from public.solicitudes_revision s where s.analisis_id=a.id and (s.estado in ('pendiente','en_revision') or exists(select 1 from public.revisiones_agronomicas r where r.solicitud_id=s.id)))))
 ), pagina as (select * from base order by creado_en desc,id limit p_limite offset p_offset)
 select jsonb_build_object('ids',coalesce((select jsonb_agg(id order by creado_en desc,id) from pagina),'[]'::jsonb),'total',(select count(*) from base))
 );
end; $$;
create function public.estadisticas_propias() returns jsonb language sql stable security definer set search_path=''
as $$
 with base as (select * from public.analisis where usuario_id=auth.uid() and eliminado_en is null),
 meses as (select generate_series(
   date_trunc('month',now() at time zone 'America/Lima')-interval '5 months',
   date_trunc('month',now() at time zone 'America/Lima'),interval '1 month') as fecha),
 mensual as (
  select to_char(m.fecha,'YYYY-MM') mes,
    count(a.id) filter(where a.estado_diagnostico='sano') sanas,
    count(a.id) filter(where a.estado_diagnostico='posible_afeccion') plagas,
    count(a.id) filter(where a.estado_diagnostico='no_reconocido') inciertas
  from meses m left join base a on date_trunc('month',a.creado_en at time zone 'America/Lima')=m.fecha
  group by m.fecha order by m.fecha
 ), frecuentes as (select plaga_detectada nombre,count(*) cantidad from base where estado_diagnostico='posible_afeccion'
  group by plaga_detectada order by cantidad desc,plaga_detectada limit 5)
 select jsonb_build_object(
 'totalAnalisis',(select count(*) from base),
 'parcelasAnalizadas',(select count(distinct parcela_id) from base),
 'olivosConMuestras',(select count(distinct olivo_id) from base),
 'distribucionParcelas',coalesce((select jsonb_agg(to_jsonb(d)) from (
  select a.parcela_id,p.codigo,p.nombre,count(*) muestras,count(distinct a.olivo_id) olivos_identificados
  from base a left join public.parcelas p on p.id=a.parcela_id
  group by a.parcela_id,p.codigo,p.nombre order by count(*) desc,p.codigo nulls last
 ) d),'[]'::jsonb),
 'solicitudesPorEstado',coalesce((select jsonb_object_agg(d.estado,d.cantidad) from (
  select s.estado,count(*) cantidad from public.solicitudes_revision s join base a on a.id=s.analisis_id group by s.estado
 ) d),'{}'::jsonb),
 'parcelasActivas',(select count(*) from public.parcelas where propietario_id=auth.uid() and not archivada),
 'muestrasSinParcela',(select count(*) from base where parcela_id is null),
 'muestrasGraves30d',(select count(*) from base where estado_diagnostico='posible_afeccion' and severidad='grave' and creado_en>=now()-interval '30 days'),
 'revisionesPendientes',(select count(*) from public.solicitudes_revision s join base a on a.id=s.analisis_id where s.estado in ('pendiente','en_revision')),
 'datosGrafico',coalesce((select jsonb_agg(to_jsonb(mensual)) from mensual),'[]'::jsonb),
 'plagasMasFrecuentes',coalesce((select jsonb_agg(to_jsonb(frecuentes)) from frecuentes),'[]'::jsonb)
 )
$$;
revoke all on function public.listar_analisis_filtrados(uuid,uuid,text,text,text,timestamptz,timestamptz,integer,integer),
 public.estadisticas_propias() from public,anon,authenticated;
grant execute on function public.listar_analisis_filtrados(uuid,uuid,text,text,text,timestamptz,timestamptz,integer,integer),
 public.estadisticas_propias() to authenticated;

notify pgrst,'reload schema';
commit;

