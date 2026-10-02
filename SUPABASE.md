# Cloud Foundations · Base de datos en Supabase

> Estado: el backend ya está conectado a este proyecto (`backend/.env`). Solo falta crear las tablas con el SQL de abajo.

Instrucciones: en tu proyecto de [Supabase](https://supabase.com), abre **SQL Editor → New query**, pega **todo el bloque SQL de abajo** y ejecuta (`Run`). No hace falta hacer nada más.

Después de ejecutarlo, comparte conmigo la conexión:

- **Project URL** (Settings → API → *Project URL*, algo como `https://xxxx.supabase.co`)
- **service role key** (Settings → API → *service_role*)

> Nota: las tablas quedan protegidas con **Row Level Security (RLS)**. La aplicación accede a Supabase a través del backend, que debe usar `SUPABASE_SERVICE_ROLE_KEY`. No expongas esa clave en el frontend ni la compartas.

---

## SQL a copiar y pegar

```sql
-- ============================================================
-- Cloud Foundations · Esquema completo para Supabase
-- Pega todo este bloque en el SQL Editor y ejecuta.
-- ============================================================

begin;

-- 1) Catálogo de servicios AWS
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
  availability text not null default '99.9%',
  status       text not null default 'Operativa',
  tone         text not null default 'neutral'
);

-- 3) Configuración de costos (una sola fila, id = 1)
create table if not exists public.cost_config (
  id                int primary key default 1 check (id = 1),
  usage_hours       int not null default 720,
  quantities        jsonb not null default '{}',
  budget            numeric not null default 450,
  usage_profiles    jsonb not null default '[]',
  cost_trend        jsonb not null default '[]',
  cost_distribution jsonb not null default '[]'
);

-- 4) Propuestas de planificación
create table if not exists public.planning_proposals (
  id                uuid primary key default gen_random_uuid(),
  solution_name     text not null,
  application_type  text not null,
  description       text not null default '',
  region            text not null default 'us-east-1',
  users             text not null default '',
  availability      text not null default '',
  objective         text not null default '',
  selected_services text[] not null default '{}',
  created_at        timestamptz not null default now()
);

create index if not exists planning_proposals_region_idx
  on public.planning_proposals (region);

-- 5) Estado global de la aplicación (una sola fila, id = 1)
create table if not exists public.app_state (
  id                   int primary key default 1 check (id = 1),
  active_region        text not null default 'us-east-1' references public.regions(code),
  active_proposal_id   uuid references public.planning_proposals(id),
  last_security_review text not null default 'Hace 5 minutos',
  last_network_test    text not null default 'Hace 2 minutos'
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

-- 8) Recursos desplegados por región
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
  ('ec2',        'Amazon EC2',       'EC2',        'Compute',    'Servidores virtuales escalables para ejecutar aplicaciones.', 'Capa de aplicación y procesamiento',              'En uso',     'dns',                   'info'),
  ('s3',         'Amazon S3',        'S3',         'Storage',    'Almacenamiento de objetos con alta durabilidad.',           'Archivos, respaldos y contenido estático',        'En uso',     'database',              'success'),
  ('rds',        'Amazon RDS',       'RDS',        'Database',   'Base de datos relacional administrada y segura.',           'Persistencia de datos transaccionales',           'En uso',     'storage',               'warning'),
  ('iam',        'AWS IAM',          'IAM',        'Security',   'Control de identidades, roles y permisos de acceso.',       'Gobierno de acceso y cuentas',                    'En uso',     'admin_panel_settings',  'success'),
  ('vpc',        'Amazon VPC',       'VPC',        'Networking', 'Red virtual aislada para controlar el tráfico Cloud.',      'Segmentación y conectividad privada',             'En uso',     'hub',                   'info'),
  ('route53',    'Amazon Route 53',  'Route 53',   'Networking', 'Servicio DNS administrado con alta disponibilidad.',        'Resolución de dominios y routing',                'Disponible', 'language',              'neutral'),
  ('cloudfront', 'Amazon CloudFront','CloudFront', 'Delivery',   'Red de distribución de contenido de baja latencia.',       'Entrega global de contenido',                     'En uso',     'public',                'info');

insert into public.regions (code, name, location, flag, services, resources, availability, status, tone) values
  ('us-east-1', 'US East (N. Virginia)',   'Estados Unidos', '🇺🇸', '{EC2,S3,RDS,VPC}',     48, '99.99%', 'Operativa', 'success'),
  ('eu-west-1', 'EU (Ireland)',            'Irlanda',        '🇮🇪', '{EC2,S3,CloudFront}',  21, '99.98%', 'Operativa', 'success'),
  ('sa-east-1', 'South America (São Paulo)','Brasil',        '🇧🇷', '{S3,CloudFront}',       9, '99.95%', 'Revisión',  'warning');

insert into public.cost_config (id, usage_hours, quantities, budget, usage_profiles, cost_trend, cost_distribution) values (
  1,
  720,
  '{"Amazon EC2": 3, "Amazon RDS": 1, "Amazon S3": 2, "CloudFront": 1, "Route 53": 1}',
  450,
  '[{"hours": 720, "label": "Operación continua", "detail": "24/7 · 720 h/mes"},
    {"hours": 176, "label": "Horario laboral",     "detail": "8×5 · 176 h/mes"},
    {"hours": 80,  "label": "Desarrollo",          "detail": "Uso parcial · 80 h/mes"}]',
  '[{"month": "Abr", "cost": 286}, {"month": "May", "cost": 302}, {"month": "Jun", "cost": 318},
    {"month": "Jul", "cost": 341}, {"month": "Ago", "cost": 352}, {"month": "Sep", "cost": 369}]',
  '[{"name": "Compute",    "value": 184, "fill": "#2563eb"},
    {"name": "Database",   "value": 96,  "fill": "#f59e0b"},
    {"name": "Storage",    "value": 42,  "fill": "#16a34a"},
    {"name": "Delivery",   "value": 31,  "fill": "#7c3aed"},
    {"name": "Networking", "value": 16,  "fill": "#64748b"}]'
);

insert into public.notifications (id, title, detail, tone) values
  ('n1', 'Propuesta guardada',  'La solución quedó persistida en el backend.',    'success'),
  ('n2', 'Costos actualizados', 'El presupuesto se recalculó con los últimos cambios.', 'info'),
  ('n3', 'Riesgos revisados',   '1 control requiere atención en seguridad.',      'warning');

insert into public.security_checks (label, detail, status, tone, icon, scope, coverage, action) values
  ('Modelo de responsabilidad compartida', 'Controles Cloud configurados',        'Correcto',  'success', 'verified_user',    'Seguridad de la nube y seguridad en la nube', 'Responsabilidades documentadas para la arquitectura actual.',     'Mantener la matriz de responsabilidades actualizada.'),
  ('Identidades y accesos IAM',            'Roles con mínimo privilegio',         'Correcto',  'success', 'manage_accounts',  'Roles, políticas y mínimo privilegio',        'Los accesos principales están asignados mediante roles.',         'Revisar permisos amplios durante la próxima auditoría.'),
  ('Protección de cuentas',                'MFA pendiente en 1 usuario',          'Revisión',  'warning', 'lock_person',      'MFA, credenciales y acceso raíz',             '1 usuario todavía requiere activar MFA.',                         'Activar MFA y validar el acceso de emergencia.'),
  ('Protección de datos',                  'Cifrado activo en recursos',          'Correcto',  'success', 'encrypted',        'Cifrado, respaldos y exposición',             'El cifrado está activo en los recursos evaluados.',               'Conservar las llaves y políticas de respaldo vigentes.'),
  ('Cumplimiento',                         '2 políticas requieren atención',      'Atención',  'danger',  'policy',           'Políticas, evidencias y controles',           '2 políticas necesitan revisión antes del cierre.',                'Asignar responsable y fecha a cada hallazgo.');

insert into public.infrastructure_resources (id, region_code, name, service, zone, state, metric, icon) values
  -- us-east-1 (48 recursos)
  ('i-east101',     'us-east-1', 'app-server-01',      'EC2',        'us-east-1a', 'En ejecución', 'CPU 38%',        'dns'),
  ('i-east102',     'us-east-1', 'app-server-02',      'EC2',        'us-east-1b', 'En ejecución', 'CPU 24%',        'dns'),
  ('db-east101',    'us-east-1', 'cloudops-production','RDS',        'us-east-1a', 'Disponible',    '64 conexiones',  'storage'),
  ('bucket-east1',  'us-east-1', 'cloudops-assets',    'S3',         'Regional',   'Activo',        '18.4 GB',        'database'),
  ('vpc-east1',     'us-east-1', 'production-vpc',     'VPC',        'us-east-1',  'Disponible',    '2 subredes',     'hub'),
  ('dist-east1',    'us-east-1', 'web-distribution',   'CloudFront', 'Global',     'Desplegado',    '42 ms',          'public'),
  -- eu-west-1 (21 recursos)
  ('i-uwest101',    'eu-west-1', 'app-server-01',      'EC2',        'eu-west-1a', 'En ejecución', 'CPU 38%',        'dns'),
  ('i-uwest102',    'eu-west-1', 'app-server-02',      'EC2',        'eu-west-1b', 'En ejecución', 'CPU 24%',        'dns'),
  ('bucket-uwest1', 'eu-west-1', 'cloudops-assets',    'S3',         'Regional',   'Activo',        '18.4 GB',        'database'),
  ('dist-uwest1',   'eu-west-1', 'web-distribution',   'CloudFront', 'Global',     'Desplegado',    '42 ms',          'public'),
  -- sa-east-1 (9 recursos)
  ('bucket-saest1', 'sa-east-1', 'cloudops-assets',    'S3',         'Regional',   'Activo',        '18.4 GB',        'database'),
  ('dist-saest1',   'sa-east-1', 'web-distribution',   'CloudFront', 'Global',     'Desplegado',    '42 ms',          'public');

insert into public.app_state (id, active_region) values (1, 'us-east-1');

-- ============================================================
-- Row Level Security
-- ============================================================
-- La app accede a Supabase exclusivamente a través del backend.
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

revoke all on table
  public.services,
  public.regions,
  public.cost_config,
  public.planning_proposals,
  public.app_state,
  public.notifications,
  public.security_checks,
  public.infrastructure_resources
from anon, authenticated;

revoke all on all sequences in schema public from anon, authenticated;

-- Acceso completo solo para el backend con la service role key.
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

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

-- ============================================================
-- Permisos para el backend
-- ============================================================

commit;
```

---

## Después de ejecutarlo

Con el esquema creado, el backend dev de `tsx` recarga solo y ya puede operar. Para confirmar:

1. Abre `http://localhost:4000/api/health` → debe mostrar `"tablesReady": true`.
2. Prueba alguno de los endpoints (ej. `GET /api/services`).

Cualquier registro nuevo (propuestas, región activa, costos, revisiones) quedará guardado en esta base de Supabase.

¿Tienes también pensado usar los buckets de Supabase (para los respaldos/estáticos) o con las 8 tablas te alcanza?
