-- CloudFoundations · Distribución global de infraestructura
-- Ejecuta este archivo después de schema.sql/auth-migration.sql sobre una base existente.
-- Agrega la configuración multiubicación de cada propuesta y el catálogo global.

begin;

alter table public.planning_proposals
  add column if not exists deployment_configuration jsonb not null default '{"mode":"single-region","trafficStrategy":"active-passive","replication":"none","failover":"manual","locations":[]}'::jsonb;

update public.regions set availability = 'No calculada';

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

commit;
