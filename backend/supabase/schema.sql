-- ============================================================
-- Cloud Foundations · Esquema completo para Supabase
-- Pega TODO este archivo en el SQL Editor y ejecuta.
-- Si ves un error, cópialo y compártelo.
-- ============================================================

begin;

-- 1) Catalogo de servicios AWS
create table if not exists public.services (
  id          text primary key,
  name        text not null,
  short_name  text not null,
  category    text not null,
  description text not null,
  purpose     text not null,
  status      text not null default 'Disponible',
  icon        text not null default 'apps',
  icon_tone   text not null default 'neutral'
);

-- 2) Regiones
create table if not exists public.regions (
  code         text primary key,
  name         text not null,
  location     text not null,
  flag         text not null,
  services     text[] not null default '{}',
  resources    int not null default 0,
  availability text not null default 'No calculada',
  status       text not null default 'Operativa',
  tone         text not null default 'neutral'
);

-- 3) Configuracion de costos (una sola fila, id = 1)
create table if not exists public.cost_config (
  id                int primary key default 1 check (id = 1),
  usage_hours       int not null default 720,
  quantities        jsonb not null default '{}',
  budget            numeric not null default 450,
  usage_profiles    jsonb not null default '[]',
  cost_trend        jsonb not null default '[]',
  cost_distribution jsonb not null default '[]'
);

-- 4) Propuestas de planificacion
create table if not exists public.planning_proposals (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  solution_name     text not null,
  application_type  text not null,
  description       text not null default '',
  region            text not null default 'us-east-1',
  users             text not null default '',
  availability      text not null default '',
  objective         text not null default '',
  selected_services text[] not null default '{}',
  deployment_configuration jsonb not null default '{"mode":"single-region","trafficStrategy":"active-passive","replication":"none","failover":"manual","locations":[]}'::jsonb,
  created_at        timestamptz not null default now()
);

create index if not exists planning_proposals_region_idx
  on public.planning_proposals (region);

alter table public.planning_proposals add column if not exists cost_configuration jsonb;
alter table public.planning_proposals add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.planning_proposals add column if not exists deployment_configuration jsonb not null default '{"mode":"single-region","trafficStrategy":"active-passive","replication":"none","failover":"manual","locations":[]}'::jsonb;

-- 5) Estado global de la aplicacion (una sola fila, id = 1)
create table if not exists public.app_state (
  id                   int primary key default 1 check (id = 1),
  active_region        text not null default 'us-east-1' references public.regions(code),
  active_proposal_id   uuid references public.planning_proposals(id) on delete set null,
  last_security_review text not null default 'Hace 5 minutos',
  last_network_test    text not null default 'Hace 2 minutos'
);

-- 5.1) Estado privado de cada usuario autenticado
create table if not exists public.user_state (
  user_id             uuid primary key references auth.users(id) on delete cascade,
  active_region       text not null default 'us-east-1' references public.regions(code),
  active_proposal_id  uuid references public.planning_proposals(id) on delete set null,
  last_security_review text not null default 'Aún no ejecutada',
  last_network_test    text not null default 'Aún no ejecutada'
);

-- 6) Notificaciones
create table if not exists public.notifications (
  id     text primary key,
  title  text not null,
  detail text not null,
  tone   text not null default 'info'
);

-- 7) Controles de seguridad
create table if not exists public.security_checks (
  label    text primary key,
  detail   text not null,
  status   text not null,
  tone     text not null,
  icon     text not null,
  scope    text not null,
  coverage text not null,
  action   text not null
);

-- 8) Recursos desplegados por region
create table if not exists public.infrastructure_resources (
  id          text primary key,
  region_code text not null references public.regions(code),
  name        text not null,
  service     text not null,
  zone        text not null,
  state       text not null,
  metric      text not null,
  icon        text not null default 'dns'
);

create index if not exists infrastructure_resources_region_idx
  on public.infrastructure_resources (region_code);

-- ============================================================
-- Datos iniciales
-- ============================================================

insert into public.services (id, name, short_name, category, description, purpose, status, icon, icon_tone) values
  ('ec2',        'Amazon EC2',       'EC2',        'Compute',    'Servidores virtuales escalables para ejecutar aplicaciones.', 'Capa de aplicacion y procesamiento',               'En uso',     'dns',                   'info'),
  ('s3',         'Amazon S3',        'S3',         'Storage',    'Almacenamiento de objetos con alta durabilidad.',           'Archivos, respaldos y contenido estatico',        'En uso',     'database',              'success'),
  ('rds',        'Amazon RDS',       'RDS',        'Database',   'Base de datos relacional administrada y segura.',           'Persistencia de datos transaccionales',           'En uso',     'storage',               'warning'),
  ('iam',        'AWS IAM',          'IAM',        'Security',   'Control de identidades, roles y permisos de acceso.',       'Gobierno de acceso y cuentas',                    'En uso',     'admin_panel_settings',  'success'),
  ('vpc',        'Amazon VPC',       'VPC',        'Networking', 'Red virtual aislada para controlar el trafico Cloud.',      'Segmentacion y conectividad privada',             'En uso',     'hub',                   'info'),
  ('route53',    'Amazon Route 53',  'Route 53',   'Networking', 'Servicio DNS administrado con alta disponibilidad.',        'Resolucion de dominios y routing',                'Disponible', 'language',              'neutral'),
  ('cloudfront', 'Amazon CloudFront','CloudFront', 'Delivery',   'Red de distribucion de contenido de baja latencia.',       'Entrega global de contenido',                     'En uso',     'public',                'info');

insert into public.regions (code, name, location, flag, services, resources, availability, status, tone) values
  ('us-east-1', 'US East (N. Virginia)',   'Estados Unidos', 'US', '{EC2,S3,RDS,VPC}',    48, 'No calculada', 'Operativa', 'success'),
  ('eu-west-1', 'EU (Ireland)',            'Irlanda',        'IE', '{EC2,S3,CloudFront}', 21, 'No calculada', 'Operativa', 'success'),
  ('sa-east-1', 'South America (Sao Paulo)','Brasil',        'BR', '{S3,CloudFront}',      9, 'No calculada', 'Revision',  'warning');

-- Catálogo global para la planificación simulada. Las ubicaciones con prefijo
-- pe- representan sedes propias del ejercicio; no son regiones AWS reales.
insert into public.regions (code, name, location, flag, services, resources, availability, status, tone) values
  ('pe-lima-1',          'Cloud Perú (Lima)',             'Perú',             'PE', '{EC2,S3,RDS,VPC}',    0, 'No calculada', 'Disponible', 'neutral'),
  ('pe-arequipa-1',      'Cloud Perú (Arequipa)',         'Perú',             'PE', '{EC2,S3,RDS,VPC}',    0, 'No calculada', 'Disponible', 'neutral'),
  ('pe-la-libertad-1',   'Cloud Perú (La Libertad)',      'Perú',             'PE', '{EC2,S3,VPC}',        0, 'No calculada', 'Disponible', 'neutral'),
  ('us-west-2',          'US West (Oregon)',              'Estados Unidos',    'US', '{EC2,S3,RDS,VPC}',    0, 'No calculada', 'Disponible', 'neutral'),
  ('ca-central-1',       'Canada (Central)',              'Canadá',            'CA', '{EC2,S3,RDS}',        0, 'No calculada', 'Disponible', 'neutral'),
  ('eu-central-1',       'Europe (Frankfurt)',            'Alemania',          'DE', '{EC2,S3,RDS,VPC}',    0, 'No calculada', 'Disponible', 'neutral'),
  ('ap-southeast-1',     'Asia Pacific (Singapore)',      'Singapur',          'SG', '{EC2,S3,RDS,VPC}',    0, 'No calculada', 'Disponible', 'neutral'),
  ('ap-northeast-1',     'Asia Pacific (Tokyo)',          'Japón',             'JP', '{EC2,S3,RDS}',        0, 'No calculada', 'Disponible', 'neutral'),
  ('ap-south-1',         'Asia Pacific (Mumbai)',         'India',             'IN', '{EC2,S3,VPC}',        0, 'No calculada', 'Disponible', 'neutral'),
  ('ap-southeast-2',     'Asia Pacific (Sydney)',        'Australia',         'AU', '{EC2,S3,CloudFront}', 0, 'No calculada', 'Disponible', 'neutral'),
  ('af-south-1',         'Africa (Cape Town)',            'Sudáfrica',         'ZA', '{EC2,S3,VPC}',        0, 'No calculada', 'Disponible', 'neutral'),
  ('me-south-1',         'Middle East (Bahrain)',         'Baréin',            'BH', '{EC2,S3,VPC}',        0, 'No calculada', 'Disponible', 'neutral')
on conflict (code) do update set
  name = excluded.name,
  location = excluded.location,
  flag = excluded.flag,
  services = excluded.services,
  availability = excluded.availability,
  status = excluded.status,
  tone = excluded.tone;

-- Regiones AWS adicionales del catálogo oficial.
insert into public.regions (code, name, location, flag, services, resources, availability, status, tone) values
  ('us-east-2',        'US East (Ohio)',              'Estados Unidos',       'US', '{EC2,S3,RDS,VPC}',    0, 'No calculada', 'Disponible', 'neutral'),
  ('us-west-1',        'US West (N. California)',    'Estados Unidos',       'US', '{EC2,S3,VPC}',        0, 'No calculada', 'Disponible', 'neutral'),
  ('ap-east-1',        'Asia Pacific (Hong Kong)',    'Hong Kong',            'HK', '{EC2,S3,VPC}',        0, 'No calculada', 'Disponible', 'neutral'),
  ('ap-south-2',       'Asia Pacific (Hyderabad)',   'India',                'IN', '{EC2,S3,VPC}',        0, 'No calculada', 'Disponible', 'neutral'),
  ('ap-southeast-2',   'Asia Pacific (Sydney)',      'Australia',            'AU', '{EC2,S3,RDS,VPC}',    0, 'No calculada', 'Disponible', 'neutral'),
  ('ap-southeast-4',   'Asia Pacific (Melbourne)',   'Australia',            'AU', '{EC2,S3,VPC}',        0, 'No calculada', 'Disponible', 'neutral'),
  ('ap-southeast-3',   'Asia Pacific (Jakarta)',     'Indonesia',            'ID', '{EC2,S3,VPC}',        0, 'No calculada', 'Disponible', 'neutral'),
  ('ap-southeast-5',   'Asia Pacific (Malaysia)',    'Malasia',              'MY', '{EC2,S3,VPC}',        0, 'No calculada', 'Disponible', 'neutral'),
  ('ap-southeast-6',   'Asia Pacific (New Zealand)', 'Nueva Zelanda',        'NZ', '{EC2,S3,VPC}',        0, 'No calculada', 'Disponible', 'neutral'),
  ('ap-southeast-7',   'Asia Pacific (Thailand)',    'Tailandia',            'TH', '{EC2,S3,VPC}',        0, 'No calculada', 'Disponible', 'neutral'),
  ('ap-east-2',        'Asia Pacific (Taipei)',     'Taiwán',               'TW', '{EC2,S3,VPC}',        0, 'No calculada', 'Disponible', 'neutral'),
  ('ap-northeast-2',   'Asia Pacific (Seoul)',      'Corea del Sur',         'KR', '{EC2,S3,RDS,VPC}',    0, 'No calculada', 'Disponible', 'neutral'),
  ('ap-northeast-3',   'Asia Pacific (Osaka)',      'Japón',                'JP', '{EC2,S3,VPC}',        0, 'No calculada', 'Disponible', 'neutral'),
  ('ca-west-1',        'Canada West (Calgary)',     'Canadá',               'CA', '{EC2,S3,VPC}',        0, 'No calculada', 'Disponible', 'neutral'),
  ('eu-west-2',        'Europe (London)',           'Reino Unido',           'GB', '{EC2,S3,RDS,VPC}',    0, 'No calculada', 'Disponible', 'neutral'),
  ('eu-south-1',       'Europe (Milan)',            'Italia',                'IT', '{EC2,S3,VPC}',        0, 'No calculada', 'Disponible', 'neutral'),
  ('eu-west-3',        'Europe (Paris)',            'Francia',               'FR', '{EC2,S3,RDS,VPC}',    0, 'No calculada', 'Disponible', 'neutral'),
  ('eu-south-2',       'Europe (Spain)',            'España',                'ES', '{EC2,S3,VPC}',        0, 'No calculada', 'Disponible', 'neutral'),
  ('eu-north-1',       'Europe (Stockholm)',        'Suecia',                'SE', '{EC2,S3,RDS,VPC}',    0, 'No calculada', 'Disponible', 'neutral'),
  ('eu-central-2',     'Europe (Zurich)',           'Suiza',                 'CH', '{EC2,S3,VPC}',        0, 'No calculada', 'Disponible', 'neutral'),
  ('il-central-1',     'Israel (Tel Aviv)',         'Israel',                'IL', '{EC2,S3,VPC}',        0, 'No calculada', 'Disponible', 'neutral'),
  ('mx-central-1',     'Mexico (Central)',          'México',                'MX', '{EC2,S3,VPC}',        0, 'No calculada', 'Disponible', 'neutral'),
  ('me-central-1',     'Middle East (UAE)',         'Emiratos Árabes Unidos','AE', '{EC2,S3,VPC}',        0, 'No calculada', 'Disponible', 'neutral')
on conflict (code) do update set
  name = excluded.name,
  location = excluded.location,
  flag = excluded.flag,
  services = excluded.services,
  availability = excluded.availability,
  status = excluded.status,
  tone = excluded.tone;

insert into public.cost_config (id, usage_hours, quantities, budget, usage_profiles, cost_trend, cost_distribution) values (
  1,
  720,
  '{"Amazon EC2": 3, "Amazon RDS": 1, "Amazon S3": 2, "CloudFront": 1, "Route 53": 1}',
  450,
  '[{"hours": 720, "label": "Operacion continua", "detail": "24/7 - 720 h/mes"},
    {"hours": 176, "label": "Horario laboral",     "detail": "8x5 - 176 h/mes"},
    {"hours": 80,  "label": "Desarrollo",          "detail": "Uso parcial - 80 h/mes"}]',
  '[{"month": "Abr", "cost": 286}, {"month": "May", "cost": 302}, {"month": "Jun", "cost": 318},
    {"month": "Jul", "cost": 341}, {"month": "Ago", "cost": 352}, {"month": "Sep", "cost": 369}]',
  '[{"name": "Compute",    "value": 184, "fill": "#2563eb"},
    {"name": "Database",   "value": 96,  "fill": "#f59e0b"},
    {"name": "Storage",    "value": 42,  "fill": "#16a34a"},
    {"name": "Delivery",   "value": 31,  "fill": "#7c3aed"},
    {"name": "Networking", "value": 16,  "fill": "#64748b"}]'
);

insert into public.notifications (id, title, detail, tone) values
  ('n1', 'Propuesta guardada',  'La solucion quedo persistida en la base.',  'success'),
  ('n2', 'Costos actualizados', 'El presupuesto se recalculo con los ultimos cambios.', 'info'),
  ('n3', 'Riesgos revisados',   '1 control requiere atencion en seguridad.', 'warning');

insert into public.security_checks (label, detail, status, tone, icon, scope, coverage, action) values
  ('Modelo de responsabilidad compartida', 'Controles Cloud configurados', 'Correcto', 'success', 'verified_user',    'Seguridad de la nube y seguridad en la nube', 'Responsabilidades documentadas para la arquitectura actual.', 'Mantener la matriz de responsabilidades actualizada.'),
  ('Identidades y accesos IAM',            'Roles con minimo privilegio',  'Correcto', 'success', 'manage_accounts',  'Roles, politicas y minimo privilegio',        'Los accesos principales estan asignados mediante roles.',      'Revisar permisos amplios durante la proxima auditoria.'),
  ('Proteccion de cuentas',                'MFA pendiente en 1 usuario',   'Revision', 'warning', 'lock_person',      'MFA, credenciales y acceso raiz',             '1 usuario todavia requiere activar MFA.',                      'Activar MFA y validar el acceso de emergencia.'),
  ('Proteccion de datos',                  'Cifrado activo en recursos',   'Correcto', 'success', 'encrypted',        'Cifrado, respaldos y exposicion',             'El cifrado esta activo en los recursos evaluados.',            'Conservar las llaves y politicas de respaldo vigentes.'),
  ('Cumplimiento',                         '2 politicas requieren atencion','Atencion','danger',  'policy',           'Politicas, evidencias y controles',           '2 politicas necesitan revision antes del cierre.',             'Asignar responsable y fecha a cada hallazgo.');

insert into public.infrastructure_resources (id, region_code, name, service, zone, state, metric, icon) values
  ('i-east101',     'us-east-1', 'app-server-01',      'EC2',        'us-east-1a', 'En ejecucion', 'CPU 38%',       'dns'),
  ('i-east102',     'us-east-1', 'app-server-02',      'EC2',        'us-east-1b', 'En ejecucion', 'CPU 24%',       'dns'),
  ('db-east101',    'us-east-1', 'cloudops-production','RDS',        'us-east-1a', 'Disponible',    '64 conexiones', 'storage'),
  ('bucket-east1',  'us-east-1', 'cloudops-assets',    'S3',         'Regional',   'Activo',        '18.4 GB',       'database'),
  ('vpc-east1',     'us-east-1', 'production-vpc',     'VPC',        'us-east-1',  'Disponible',    '2 subredes',    'hub'),
  ('dist-east1',    'us-east-1', 'web-distribution',   'CloudFront', 'Global',     'Desplegado',    '42 ms',         'public'),
  ('i-uwest101',    'eu-west-1', 'app-server-01',      'EC2',        'eu-west-1a', 'En ejecucion', 'CPU 38%',       'dns'),
  ('i-uwest102',    'eu-west-1', 'app-server-02',      'EC2',        'eu-west-1b', 'En ejecucion', 'CPU 24%',       'dns'),
  ('bucket-uwest1', 'eu-west-1', 'cloudops-assets',    'S3',         'Regional',   'Activo',        '18.4 GB',       'database'),
  ('dist-uwest1',   'eu-west-1', 'web-distribution',   'CloudFront', 'Global',     'Desplegado',    '42 ms',         'public'),
  ('bucket-saest1', 'sa-east-1', 'cloudops-assets',    'S3',         'Regional',   'Activo',        '18.4 GB',       'database'),
  ('dist-saest1',   'sa-east-1', 'web-distribution',   'CloudFront', 'Global',     'Desplegado',    '42 ms',         'public');

insert into public.app_state (id, active_region) values (1, 'us-east-1');

-- ============================================================
-- Row Level Security
-- ============================================================
-- La app accede a Supabase exclusivamente a traves del backend.
-- El backend debe usar SUPABASE_SERVICE_ROLE_KEY, que omite RLS.
-- anon y authenticated quedan sin acceso directo a estas tablas.
alter table public.services enable row level security;
alter table public.regions enable row level security;
alter table public.cost_config enable row level security;
alter table public.planning_proposals enable row level security;
alter table public.app_state enable row level security;
alter table public.notifications enable row level security;
alter table public.security_checks enable row level security;
alter table public.infrastructure_resources enable row level security;
alter table public.user_state enable row level security;

revoke all on table
  public.services,
  public.regions,
  public.cost_config,
  public.planning_proposals,
  public.app_state,
  public.notifications,
  public.security_checks,
  public.infrastructure_resources,
  public.user_state
from anon, authenticated;

revoke all on all sequences in schema public from anon, authenticated;

-- Acceso completo solo para el backend con la service role key.
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant select, insert, update, delete on public.planning_proposals, public.user_state to authenticated;

drop policy if exists service_role_all on public.services;
create policy service_role_all on public.services for all to service_role using (true) with check (true);
drop policy if exists service_role_all on public.regions;
create policy service_role_all on public.regions for all to service_role using (true) with check (true);
drop policy if exists service_role_all on public.cost_config;
create policy service_role_all on public.cost_config for all to service_role using (true) with check (true);
drop policy if exists service_role_all on public.planning_proposals;
create policy service_role_all on public.planning_proposals for all to service_role using (true) with check (true);
drop policy if exists service_role_all on public.app_state;
create policy service_role_all on public.app_state for all to service_role using (true) with check (true);
drop policy if exists service_role_all on public.notifications;
create policy service_role_all on public.notifications for all to service_role using (true) with check (true);
drop policy if exists service_role_all on public.security_checks;
create policy service_role_all on public.security_checks for all to service_role using (true) with check (true);
drop policy if exists service_role_all on public.infrastructure_resources;
create policy service_role_all on public.infrastructure_resources for all to service_role using (true) with check (true);
drop policy if exists service_role_all on public.user_state;
create policy service_role_all on public.user_state for all to service_role using (true) with check (true);

drop policy if exists authenticated_own_proposals on public.planning_proposals;
create policy authenticated_own_proposals on public.planning_proposals
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists authenticated_own_state on public.user_state;
create policy authenticated_own_state on public.user_state
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists avatars_public_read on storage.objects;
create policy avatars_public_read on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists avatars_user_insert on storage.objects;
create policy avatars_user_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists avatars_user_update on storage.objects;
create policy avatars_user_update on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid()::text))
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists avatars_user_delete on storage.objects;
create policy avatars_user_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));

-- ============================================================
-- Permisos para el backend
-- ============================================================

commit;
