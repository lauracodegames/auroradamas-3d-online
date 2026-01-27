-- Profiles table for user data
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  age integer,
  skill_level text default 'iniciante' check (skill_level in ('iniciante', 'intermediario', 'avancado', 'mestre')),
  avatar_url text,
  wins integer default 0,
  losses integer default 0,
  draws integer default 0,
  total_games integer default 0,
  is_admin boolean default false,
  is_banned boolean default false,
  ban_reason text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Game rooms table
create table if not exists public.game_rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  host_id uuid references public.profiles(id) on delete cascade,
  guest_id uuid references public.profiles(id) on delete set null,
  status text default 'waiting' check (status in ('waiting', 'playing', 'finished', 'abandoned')),
  winner_id uuid references public.profiles(id) on delete set null,
  game_state jsonb,
  is_ai_game boolean default false,
  ai_difficulty text check (ai_difficulty in ('facil', 'medio', 'dificil', 'impossivel')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Game moves table for history
create table if not exists public.game_moves (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.game_rooms(id) on delete cascade,
  player_id uuid references public.profiles(id) on delete set null,
  move_from integer[] not null,
  move_to integer[] not null,
  captured_pieces integer[][],
  move_number integer not null,
  created_at timestamp with time zone default now()
);

-- Chat messages table
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.game_rooms(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  message text,
  audio_url text,
  is_audio boolean default false,
  created_at timestamp with time zone default now()
);

-- Rankings view (top 10 players by wins)
create or replace view public.rankings as
select 
  id,
  username,
  avatar_url,
  wins,
  losses,
  draws,
  total_games,
  skill_level,
  case when total_games > 0 then round((wins::numeric / total_games) * 100, 1) else 0 end as win_rate
from public.profiles
where is_banned = false
order by wins desc, win_rate desc
limit 10;

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.game_rooms enable row level security;
alter table public.game_moves enable row level security;
alter table public.chat_messages enable row level security;

-- Drop existing policies if they exist (to make script idempotent)
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Admins can update any profile" on public.profiles;
drop policy if exists "Game rooms are viewable by everyone" on public.game_rooms;
drop policy if exists "Authenticated users can create rooms" on public.game_rooms;
drop policy if exists "Players can update their rooms" on public.game_rooms;
drop policy if exists "Game moves are viewable by everyone" on public.game_moves;
drop policy if exists "Players can insert moves" on public.game_moves;
drop policy if exists "Chat messages are viewable by room players" on public.chat_messages;
drop policy if exists "Players can insert chat messages" on public.chat_messages;

-- Profiles policies
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);
create policy "Admins can update any profile" on public.profiles for update using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- Game rooms policies
create policy "Game rooms are viewable by everyone" on public.game_rooms for select using (true);
create policy "Authenticated users can create rooms" on public.game_rooms for insert with check (auth.uid() = host_id);
create policy "Players can update their rooms" on public.game_rooms for update using (
  auth.uid() = host_id or auth.uid() = guest_id
);

-- Game moves policies
create policy "Game moves are viewable by everyone" on public.game_moves for select using (true);
create policy "Players can insert moves" on public.game_moves for insert with check (
  exists (
    select 1 from public.game_rooms 
    where id = room_id and (host_id = auth.uid() or guest_id = auth.uid())
  )
);

-- Chat messages policies
create policy "Chat messages are viewable by room players" on public.chat_messages for select using (
  exists (
    select 1 from public.game_rooms 
    where id = room_id and (host_id = auth.uid() or guest_id = auth.uid())
  )
);
create policy "Players can insert chat messages" on public.chat_messages for insert with check (
  auth.uid() = user_id and
  exists (
    select 1 from public.game_rooms 
    where id = room_id and (host_id = auth.uid() or guest_id = auth.uid())
  )
);

-- Trigger function to create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
begin
  -- Get username from metadata or generate a unique one
  v_username := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
    'player_' || substr(md5(new.id::text || now()::text), 1, 10)
  );
  
  insert into public.profiles (id, username, age, skill_level, avatar_url)
  values (
    new.id,
    v_username,
    coalesce((new.raw_user_meta_data ->> 'age')::integer, null),
    coalesce(nullif(new.raw_user_meta_data ->> 'skill_level', ''), 'iniciante'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', null)
  )
  on conflict (id) do nothing;
  return new;
exception when unique_violation then
  -- If username already exists, add random suffix
  insert into public.profiles (id, username, age, skill_level, avatar_url)
  values (
    new.id,
    v_username || '_' || substr(md5(random()::text), 1, 4),
    coalesce((new.raw_user_meta_data ->> 'age')::integer, null),
    coalesce(nullif(new.raw_user_meta_data ->> 'skill_level', ''), 'iniciante'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Create trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Function to update rankings after game
create or replace function public.update_player_stats(
  p_winner_id uuid,
  p_loser_id uuid,
  p_is_draw boolean default false
)
returns void
language plpgsql
security definer
as $$
begin
  if p_is_draw then
    update public.profiles set draws = draws + 1, total_games = total_games + 1 where id = p_winner_id;
    update public.profiles set draws = draws + 1, total_games = total_games + 1 where id = p_loser_id;
  else
    update public.profiles set wins = wins + 1, total_games = total_games + 1 where id = p_winner_id;
    update public.profiles set losses = losses + 1, total_games = total_games + 1 where id = p_loser_id;
  end if;
end;
$$;

-- Enable realtime for game rooms and chat (only if not already added)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'game_rooms'
  ) then
    alter publication supabase_realtime add table public.game_rooms;
  end if;
  
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
  
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'game_moves'
  ) then
    alter publication supabase_realtime add table public.game_moves;
  end if;
end;
$$;
