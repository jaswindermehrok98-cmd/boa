create table if not exists public.mosaic_rooms (
 id uuid primary key,
 token_hash text not null,
 document jsonb not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists mosaic_rooms_updated_at_idx on public.mosaic_rooms(updated_at desc);
create table if not exists public.mosaic_room_versions (
 id bigint generated always as identity primary key,
 room_id uuid not null references public.mosaic_rooms(id) on delete cascade,
 label text not null default 'Checkpoint',
 document jsonb not null,
 created_at timestamptz not null default now()
);
create index if not exists mosaic_room_versions_room_created_idx on public.mosaic_room_versions(room_id,created_at desc);
alter table public.mosaic_rooms enable row level security;
alter table public.mosaic_room_versions enable row level security;
revoke all on public.mosaic_rooms from anon, authenticated;
revoke all on public.mosaic_room_versions from anon, authenticated;
-- No browser policies: server routes validate room invite tokens and use service-role access.