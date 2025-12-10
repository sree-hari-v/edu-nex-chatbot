alter table public.faq_responses
add column if not exists keywords text[] default '{}';