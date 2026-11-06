create table if not exists public.cart_items (
    id uuid primary key default gen_random_uuid(),
    product_id integer not null,
    qty integer not null check (qty > 0),
    updated_at timestamptz not null default now()
);

create table if not exists public.orders (
    id uuid primary key default gen_random_uuid(),
    status text not null default 'current',
    address text not null default '',
    latitude double precision,
    longitude double precision,
    subtotal double precision not null default 0,
    delivery_fee double precision not null default 0,
    total double precision not null default 0,
    created_at timestamptz not null default now()
);

create table if not exists public.order_items (
    id uuid primary key default gen_random_uuid(),
    product_id integer,
    name text not null default '',
    price double precision not null default 0,
    qty integer not null default 1,
    image_url text,
    category text
);

alter table public.cart_items
    add column if not exists user_id uuid references auth.users (id) on delete cascade,
    add column if not exists product_id integer,
    add column if not exists qty integer,
    add column if not exists updated_at timestamptz default now();

alter table public.orders
    add column if not exists user_id uuid references auth.users (id) on delete cascade,
    add column if not exists status text default 'current',
    add column if not exists address text default '',
    add column if not exists latitude double precision,
    add column if not exists longitude double precision,
    add column if not exists subtotal double precision default 0,
    add column if not exists delivery_fee double precision default 0,
    add column if not exists total double precision default 0,
    add column if not exists created_at timestamptz default now();

alter table public.order_items
    add column if not exists order_id uuid references public.orders (id) on delete cascade,
    add column if not exists product_id integer,
    add column if not exists name text,
    add column if not exists price double precision,
    add column if not exists qty integer,
    add column if not exists image_url text,
    add column if not exists category text;

create unique index if not exists cart_items_user_product_idx
    on public.cart_items (user_id, product_id);

create index if not exists cart_items_user_idx on public.cart_items (user_id);
create index if not exists orders_user_idx on public.orders (user_id, created_at desc);
create index if not exists order_items_order_idx on public.order_items (order_id);

alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

grant select, insert, update, delete on table public.cart_items to authenticated;
grant select, insert, update on table public.orders to authenticated;
grant select, insert on table public.order_items to authenticated;

drop policy if exists "Users manage own cart" on public.cart_items;
create policy "Users manage own cart"
    on public.cart_items
    for all
    to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

drop policy if exists "Users read own orders" on public.orders;
create policy "Users read own orders"
    on public.orders
    for select
    to authenticated
    using ((select auth.uid()) = user_id);

drop policy if exists "Users create own orders" on public.orders;
create policy "Users create own orders"
    on public.orders
    for insert
    to authenticated
    with check ((select auth.uid()) = user_id);

drop policy if exists "Users update own orders" on public.orders;
create policy "Users update own orders"
    on public.orders
    for update
    to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

drop policy if exists "Users read own order items" on public.order_items;
create policy "Users read own order items"
    on public.order_items
    for select
    to authenticated
    using (
        exists (
            select 1 from public.orders
            where orders.id = order_items.order_id
              and orders.user_id = (select auth.uid())
        )
    );

drop policy if exists "Users create own order items" on public.order_items;
create policy "Users create own order items"
    on public.order_items
    for insert
    to authenticated
    with check (
        exists (
            select 1 from public.orders
            where orders.id = order_items.order_id
              and orders.user_id = (select auth.uid())
        )
    );
