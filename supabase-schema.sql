-- FAQ responses table (ALL answers stored here, no code hardcoding)
create table if not exists public.faq_responses (
  id bigserial primary key,
  keyword text not null unique,
  answer text not null,
  updated_at timestamptz not null default now()
);

-- Examples (insert your actual content)
insert into public.faq_responses (keyword, answer) values
('fees-bca', 'BCA fees are ₹100,000 per year. Do you want the detailed breakdown?'),
('syllabus-bca', 'BCA syllabus covers programming, data structures, DBMS, and OS.'),
('admission', 'Admissions open in June. Please see the application checklist.'),
('default', 'Here to help! Ask me about fees, syllabus, admissions, departments, or campus info.')
on conflict (keyword) do nothing;

-- Admins table (maps Supabase Auth user_id to admin role)
create table if not exists public.admins (
  id bigserial primary key,
  user_id uuid not null unique,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

-- Example: add an existing Supabase Auth user as admin
-- insert into public.admins (user_id, role) values ('<auth_user_id_uuid>', 'admin');