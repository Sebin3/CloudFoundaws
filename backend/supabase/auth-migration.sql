-- CloudFoundations · Migración de autenticación multiusuario
-- Ejecuta este archivo una sola vez sobre una base que ya tiene schema.sql.
-- No contiene datos simulados ni credenciales.

begin;

alter table public.planning_proposals
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.planning_proposals
  add column if not exists deployment_configuration jsonb not null default '{"mode":"single-region","trafficStrategy":"active-passive","replication":"none","failover":"manual","locations":[]}'::jsonb;

update public.regions set availability = 'No calculada';

create index if not exists planning_proposals_user_id_idx
  on public.planning_proposals (user_id);

create table if not exists public.user_state (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  active_region        text not null default 'us-east-1' references public.regions(code),
  active_proposal_id   uuid references public.planning_proposals(id) on delete set null,
  last_security_review text not null default 'Aún no ejecutada',
  last_network_test    text not null default 'Aún no ejecutada'
);

alter table public.planning_proposals enable row level security;
alter table public.user_state enable row level security;

revoke all on public.planning_proposals, public.user_state from anon;
grant select, insert, update, delete on public.planning_proposals, public.user_state to authenticated;
grant all on public.planning_proposals, public.user_state to service_role;

drop policy if exists service_role_all on public.planning_proposals;
create policy service_role_all on public.planning_proposals
  for all to service_role using (true) with check (true);

drop policy if exists service_role_all on public.user_state;
create policy service_role_all on public.user_state
  for all to service_role using (true) with check (true);

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

-- Regiones disponibles para distribuir una propuesta en varios países.
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

-- Bucket público para fotos de perfil. Cada usuario solo puede administrar
-- archivos dentro de la carpeta cuyo nombre es su propio UUID.
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

commit;
