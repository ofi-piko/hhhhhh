create table if not exists public."user" (
    id uuid not null references auth.users (id) on delete cascade,
    phone text not null,
    city text not null,
    address text not null,
    theme text not null check (theme in ('light', 'dark')),
    language text not null check (language in ('uz', 'ru', 'en')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    status text null,
    constraint user_phone_key unique (phone)
);

create unique index if not exists user_id_unique_idx
    on public."user" using btree (id);

alter table public."user" enable row level security;

grant select, insert, update on table public."user" to authenticated;
