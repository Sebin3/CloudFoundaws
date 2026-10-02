-- Ejecutar una vez en el SQL Editor de Supabase para una base existente.
alter table public.planning_proposals
  add column if not exists cost_configuration jsonb;
notify pgrst, 'reload schema';
