create table if not exists public.promocodes (
    id uuid primary key default gen_random_uuid()
);

alter table public.promocodes
    add column if not exists name text,
    add column if not exists action text;

create unique index if not exists promocodes_name_idx on public.promocodes (name);

alter table public.promocodes enable row level security;

grant select on table public.promocodes to authenticated, anon;

drop policy if exists "Anyone can read promocodes" on public.promocodes;
create policy "Anyone can read promocodes"
    on public.promocodes
    for select
    to authenticated, anon
    using (true);

insert into public.promocodes (name, action)
values ('HALALFOOD', '25%')
on conflict (name) do nothing;
