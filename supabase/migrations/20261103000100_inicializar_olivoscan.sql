-- Estructura necesaria para el funcionamiento de OlivoScan.
-- Conserva las cuentas de Supabase Auth existentes.
create table public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  nombre text not null default '',
  zona_geografica text not null default '',
  foto_url text,
  rol text not null default 'agricultor' check (rol in ('agricultor', 'admin')),
  creado_en timestamptz not null default now()
);

create table public.analisis (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  imagen_url text not null,
  plaga_detectada text not null,
  confianza numeric not null check (confianza between 0 and 100),
  severidad text not null check (severidad in ('leve', 'moderado', 'grave')),
  descripcion text,
  recomendacion text,
  modelo_version text,
  plaga_corregida text,
  notas text,
  creado_en timestamptz not null default now()
);

create table public.notificaciones (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  mensaje text not null,
  tipo text not null default 'analisis_completo' check (tipo in ('analisis_completo', 'alerta')),
  leida boolean not null default false,
  creado_en timestamptz not null default now()
);

create table public.plagas_catalogo (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  descripcion text not null,
  sintomas text not null,
  condiciones text not null,
  tratamiento_quimico text not null,
  tratamiento_organico text not null,
  imagen_referencia_url text,
  meses_riesgo text[] not null default '{}',
  creado_en timestamptz not null default now()
);

create index analisis_usuario_fecha_idx on public.analisis(usuario_id, creado_en desc);
create index notificaciones_usuario_fecha_idx on public.notificaciones(usuario_id, creado_en desc);

create function public.crear_perfil_olivoscan()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.usuarios(id, email, nombre, zona_geografica)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'nombre', ''),
    coalesce(new.raw_user_meta_data ->> 'zona_geografica', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.crear_perfil_olivoscan() from public, anon, authenticated;

create trigger olivoscan_perfil_nuevo_usuario
after insert on auth.users
for each row execute function public.crear_perfil_olivoscan();

-- Dar perfil también a las cuentas registradas antes de esta migración.
insert into public.usuarios(id, email, nombre, zona_geografica, creado_en)
select id, email,
       coalesce(raw_user_meta_data ->> 'nombre', ''),
       coalesce(raw_user_meta_data ->> 'zona_geografica', ''),
       coalesce(created_at, now())
from auth.users
on conflict (id) do nothing;

alter table public.usuarios enable row level security;
alter table public.analisis enable row level security;
alter table public.notificaciones enable row level security;
alter table public.plagas_catalogo enable row level security;

revoke all on public.usuarios, public.analisis, public.notificaciones, public.plagas_catalogo from anon, authenticated;
grant usage on schema public to authenticated, service_role;
grant all on public.usuarios, public.analisis, public.notificaciones, public.plagas_catalogo to service_role;

grant select on public.usuarios to authenticated;
grant update (nombre, zona_geografica, foto_url) on public.usuarios to authenticated;
grant select, insert, delete on public.analisis to authenticated;
grant update (plaga_corregida, notas) on public.analisis to authenticated;
grant select, insert on public.notificaciones to authenticated;
grant update (leida) on public.notificaciones to authenticated;
grant select, insert, update, delete on public.plagas_catalogo to authenticated;

create policy usuarios_ver_perfil on public.usuarios
for select to authenticated using ((select auth.uid()) = id);
create policy usuarios_editar_perfil on public.usuarios
for update to authenticated
using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy analisis_ver_propios on public.analisis
for select to authenticated using ((select auth.uid()) = usuario_id);
create policy analisis_crear_propios on public.analisis
for insert to authenticated with check ((select auth.uid()) = usuario_id);
create policy analisis_editar_propios on public.analisis
for update to authenticated
using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);
create policy analisis_eliminar_propios on public.analisis
for delete to authenticated using ((select auth.uid()) = usuario_id);

create policy notificaciones_ver_propias on public.notificaciones
for select to authenticated using ((select auth.uid()) = usuario_id);
create policy notificaciones_crear_propias on public.notificaciones
for insert to authenticated with check ((select auth.uid()) = usuario_id);
create policy notificaciones_leer_propias on public.notificaciones
for update to authenticated
using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);

create policy catalogo_consultar on public.plagas_catalogo
for select to authenticated using (true);
create policy catalogo_crear_admin on public.plagas_catalogo
for insert to authenticated with check (
  exists (select 1 from public.usuarios where id = (select auth.uid()) and rol = 'admin')
);
create policy catalogo_editar_admin on public.plagas_catalogo
for update to authenticated using (
  exists (select 1 from public.usuarios where id = (select auth.uid()) and rol = 'admin')
) with check (
  exists (select 1 from public.usuarios where id = (select auth.uid()) and rol = 'admin')
);
create policy catalogo_eliminar_admin on public.plagas_catalogo
for delete to authenticated using (
  exists (select 1 from public.usuarios where id = (select auth.uid()) and rol = 'admin')
);


-- Catalogo inicial, procedente de las fichas del proyecto.
insert into public.plagas_catalogo (nombre, descripcion, sintomas, condiciones, tratamiento_quimico, tratamiento_organico, imagen_referencia_url, meses_riesgo) values
('Mosca del olivo', 'Bactrocera oleae. Es la plaga más importante del olivar. La larva se alimenta de la pulpa de la aceituna, reduciendo el rendimiento y la calidad del aceite.', 'Picaduras de puesta en la superficie del fruto, galerías internas en la pulpa excavadas por las larvas, caída prematura de aceitunas.', 'Temperaturas moderadas (20-25°C) y humedad relativa alta. Se detiene su actividad con temperaturas mayores a 35°C.', 'Aplicaciones de cebo con Deltametrina o Lambda-cihalotrina al 1-2% mezclados con proteínas hidrolizadas, o tratamientos sistémicos con Fosmet en pulverización total.', 'Trampeo masivo con fosfato diamónico al 4%, aplicación de caolín como barrera física y uso de Spinosad ecológico.', '/images/mosca_olivo.png', ARRAY['Julio','Agosto','Septiembre','Octubre','Noviembre']::text[]),
('Prays del olivo (Polilla)', 'Prays oleae. Polilla que ataca al olivo en tres generaciones distintas: filófaga (hojas), antófaga (flores) y carpófaga (frutos).', 'Galerías sinuosas en las hojas, caída de capullos florales secos, caída prematura de frutos en verano (caída de San Juan).', 'Primaveras suaves para la generación de la flor, y principios de verano para el ataque al fruto.', 'Tratamientos preventivos en generación antófaga con Deltametrina antes de floración, o insecticidas penetrantes como Fosmet al inicio de la tercera generación.', 'Tratamientos foliares con Bacillus thuringiensis subespecie kurstaki durante el inicio de la floración, y fomento de crisopas depredadoras.', '/images/prays_olivo.png', ARRAY['Abril','Mayo','Junio','Septiembre','Octubre']::text[]),
('Cochinilla tiznada (Saissetia oleae)', 'Saissetia oleae. Insecto chupador que succiona la savia del olivo y excreta una melaza pegajosa sobre la cual se desarrolla la negrilla o tiznado.', 'Escudos oscuros con forma de H en ramas y hojas, presencia de melaza brillante y pegajosa, y una capa de polvo negro (negrilla) que cubre las hojas.', 'Copas densas y sombrías, alta humedad ambiental y temperaturas templadas. Es sensible al calor seco del verano extremo.', 'Tratamientos localizados con Piriproxifen o Spirotetramat durante la máxima eclosión de larvas móviles en verano.', 'Podas de ventilación para facilitar la entrada de luz solar, lavados de melaza con jabón potásico al 1-2%, y protección de mariquitas depredadoras.', '/images/cochinilla_tiznada.png', ARRAY['Junio','Julio','Agosto','Septiembre','Octubre']::text[]),
('Repilo del olivo (Spilocaea oleagina)', 'Spilocaea oleagina. Hongo fitopatógeno muy extendido que ataca principalmente a las hojas del olivo, provocando una severa defoliación y debilitamiento del árbol.', 'Manchas circulares oscuras rodeadas por una aureola amarilla en el haz de las hojas, desecación foliar y posterior caída masiva de hojas.', 'Humedad relativa muy alta (lluvias) y temperaturas suaves (15-20°C). Típico de otoño y primavera.', 'Aplicación de fungicidas de síntesis como Difenoconazol, Tebuconazol o Kresoxim-metil durante periodos de alta presión de infección.', 'Tratamientos preventivos con compuestos de cobre (oxicloruro o hidróxido de cobre) antes de lluvias persistentes, y eliminación de hojas caídas del suelo.', '/images/repilo_olivo.png', ARRAY['Febrero','Marzo','Abril','Octubre','Noviembre','Diciembre']::text[]),
('Hoja Sana', 'Estado óptimo del follaje del olivo. El color verde brillante y la turgencia indican un equilibrio nutricional y la ausencia de fitopatógenos o insectos plaga.', 'Hojas limpias, sin manchas ni picaduras, color verde uniforme y correcto desarrollo de brotes nuevos.', 'Buenas prácticas culturales, riego adecuado y equilibrado, podas regulares de aclareo y nutrición óptima del suelo.', 'No se requiere ningún tratamiento químico ni fitosanitario.', 'Mantenimiento del abonado orgánico, riego sin encharcar y monitoreo regular preventivo cada 15 días.', '/images/hoja_sana.png', ARRAY[]::text[])
on conflict (nombre) do nothing;

notify pgrst, 'reload schema';
