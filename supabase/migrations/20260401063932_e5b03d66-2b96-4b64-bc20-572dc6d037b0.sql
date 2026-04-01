create extension if not exists pgcrypto;

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'app_role' and n.nspname = 'public'
  ) then
    create type public.app_role as enum ('admin', 'moderator', 'user');
  end if;
end $$;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  display_name text,
  avatar_url text,
  bio text,
  basic_info jsonb not null default '{}'::jsonb,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create table if not exists public.recipes (
  id text primary key,
  title text not null,
  description text not null,
  image_url text not null,
  time_text text not null,
  difficulty text not null,
  moods text[] not null default '{}',
  category text not null,
  steps text[] not null default '{}',
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_recipes_moods on public.recipes using gin (moods);
create index if not exists idx_recipes_category on public.recipes (category);

alter table public.recipes enable row level security;

create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ingredients enable row level security;

create table if not exists public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id text not null references public.recipes(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  note text,
  created_at timestamptz not null default now(),
  unique (recipe_id, ingredient_id)
);

create index if not exists idx_recipe_ingredients_recipe on public.recipe_ingredients (recipe_id);
create index if not exists idx_recipe_ingredients_ingredient on public.recipe_ingredients (ingredient_id);

alter table public.recipe_ingredients enable row level security;

create table if not exists public.recipe_reviews (
  id uuid primary key default gen_random_uuid(),
  recipe_id text not null references public.recipes(id) on delete cascade,
  user_id uuid not null,
  rating integer not null,
  title text,
  content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recipe_reviews_rating_range check (rating between 1 and 5),
  unique (recipe_id, user_id)
);

create index if not exists idx_recipe_reviews_recipe on public.recipe_reviews (recipe_id);
create index if not exists idx_recipe_reviews_user on public.recipe_reviews (user_id);

alter table public.recipe_reviews enable row level security;

drop policy if exists "Users can view their own roles" on public.user_roles;
create policy "Users can view their own roles"
on public.user_roles
for select
to authenticated
using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Admins can manage roles" on public.user_roles;
create policy "Admins can manage roles"
on public.user_roles
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'::public.app_role))
with check (public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'::public.app_role))
with check (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Admins can remove profiles" on public.profiles;
create policy "Admins can remove profiles"
on public.profiles
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Anyone can view recipes" on public.recipes;
create policy "Anyone can view recipes"
on public.recipes
for select
using (true);

drop policy if exists "Admins can manage recipes" on public.recipes;
create policy "Admins can manage recipes"
on public.recipes
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'::public.app_role))
with check (public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Anyone can view ingredients" on public.ingredients;
create policy "Anyone can view ingredients"
on public.ingredients
for select
using (true);

drop policy if exists "Admins can manage ingredients" on public.ingredients;
create policy "Admins can manage ingredients"
on public.ingredients
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'::public.app_role))
with check (public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Anyone can view recipe ingredients" on public.recipe_ingredients;
create policy "Anyone can view recipe ingredients"
on public.recipe_ingredients
for select
using (true);

drop policy if exists "Admins can manage recipe ingredients" on public.recipe_ingredients;
create policy "Admins can manage recipe ingredients"
on public.recipe_ingredients
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'::public.app_role))
with check (public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Anyone can view recipe reviews" on public.recipe_reviews;
create policy "Anyone can view recipe reviews"
on public.recipe_reviews
for select
using (true);

drop policy if exists "Users can create their own recipe reviews" on public.recipe_reviews;
create policy "Users can create their own recipe reviews"
on public.recipe_reviews
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own recipe reviews" on public.recipe_reviews;
create policy "Users can update their own recipe reviews"
on public.recipe_reviews
for update
to authenticated
using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'::public.app_role))
with check (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Users can delete their own recipe reviews" on public.recipe_reviews;
create policy "Users can delete their own recipe reviews"
on public.recipe_reviews
for delete
to authenticated
using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'::public.app_role));

drop trigger if exists update_profiles_updated_at on public.profiles;
create trigger update_profiles_updated_at
before update on public.profiles
for each row
execute function public.update_updated_at_column();

drop trigger if exists update_recipes_updated_at on public.recipes;
create trigger update_recipes_updated_at
before update on public.recipes
for each row
execute function public.update_updated_at_column();

drop trigger if exists update_ingredients_updated_at on public.ingredients;
create trigger update_ingredients_updated_at
before update on public.ingredients
for each row
execute function public.update_updated_at_column();

drop trigger if exists update_recipe_reviews_updated_at on public.recipe_reviews;
create trigger update_recipe_reviews_updated_at
before update on public.recipe_reviews
for each row
execute function public.update_updated_at_column();

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Avatar images are publicly accessible" on storage.objects;
create policy "Avatar images are publicly accessible"
on storage.objects
for select
using (bucket_id = 'avatars');

drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

insert into public.recipes (id, title, description, image_url, time_text, difficulty, moods, category, steps)
values
  ('pho-bo', 'Phở Bò', 'Món phở truyền thống với nước dùng ninh xương bò thơm lừng, bánh phở mềm mịn.', 'https://images.unsplash.com/photo-1503764654157-72d979d9af2f?w=600', '120 phút', 'Trung bình', array['thugian','buon','met'], 'Món nước', array['Ninh xương bò trong 4-5 tiếng với hành nướng và gừng nướng.','Thêm quế, hồi, thảo quả vào nồi nước dùng.','Thái thịt bò mỏng.','Trụng bánh phở trong nước sôi.','Xếp bánh phở, thịt bò vào tô, chan nước dùng nóng.','Thêm hành lá, rau mùi, giá đỗ và chanh.']),
  ('bun-cha', 'Bún Chả Hà Nội', 'Bún chả với chả viên và chả miếng nướng than hoa, nước mắm chua ngọt đậm đà.', 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600', '60 phút', 'Trung bình', array['vui','haohung'], 'Món nước', array['Ướp thịt lợn xay với gia vị, nặn thành viên.','Thái thịt ba chỉ mỏng, ướp gia vị.','Nướng chả trên bếp than.','Pha nước mắm chua ngọt.','Bày bún, chả, rau sống ra đĩa. Chấm với nước mắm.']),
  ('com-tam', 'Cơm Tấm Sườn Bì Chả', 'Cơm tấm Sài Gòn với sườn nướng mật ong, bì, chả trứng và đồ chua.', 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600', '45 phút', 'Dễ', array['vui','haohung','thugian'], 'Món cơm', array['Ướp sườn với nước mắm, đường, tỏi băm, dầu hào.','Nướng sườn trên bếp than hoặc lò nướng.','Nấu cơm tấm.','Làm bì: trộn bì heo với thính gạo.','Làm chả: trộn trứng, thịt xay, hấp chín.','Bày cơm, sườn, bì, chả. Rưới mỡ hành.']),
  ('banh-mi', 'Bánh Mì Thịt', 'Bánh mì giòn với pate, thịt nguội, đồ chua và rau mùi — biểu tượng ẩm thực Việt.', 'https://images.unsplash.com/photo-1600688640154-9619e002df30?w=600', '15 phút', 'Dễ', array['vui','haohung','met'], 'Món ăn nhanh', array['Nướng giòn bánh mì.','Phết pate lên mặt trong bánh mì.','Xếp thịt nguội, dưa leo, đồ chua, rau mùi.','Thêm nước tương, ớt tùy thích.']),
  ('goi-cuon', 'Gỏi Cuốn', 'Gỏi cuốn tươi mát với tôm, thịt, bún, rau sống cuốn trong bánh tráng.', 'https://images.unsplash.com/photo-1562967916-eb82221dfb44?w=600', '30 phút', 'Dễ', array['thugian','vui'], 'Món khai vị', array['Luộc tôm và thịt, thái mỏng.','Nhúng bánh tráng vào nước ấm cho mềm.','Xếp rau sống, bún, tôm, thịt lên bánh tráng.','Cuộn chặt tay.','Pha tương đậu phộng để chấm.']),
  ('ca-kho-to', 'Cá Kho Tộ', 'Cá lóc kho tộ đậm đà với nước màu, tiêu, ớt — món cơm gia đình truyền thống miền Nam.', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600', '50 phút', 'Trung bình', array['thugian','buon'], 'Món mặn', array['Cắt cá thành khúc, ướp nước mắm, đường, tiêu.','Phi hành tím và tỏi trong tộ đất.','Xếp cá vào tộ, thêm nước màu.','Kho nhỏ lửa 30-40 phút đến khi sánh.','Rắc tiêu, ớt trước khi ăn.']),
  ('bo-luc-lac', 'Bò Lúc Lắc', 'Thịt bò cắt hạt lựu xào lửa lớn với tỏi, bơ — thơm nức mũi.', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600', '20 phút', 'Dễ', array['haohung','vui'], 'Món xào', array['Cắt bò hạt lựu, ướp xì dầu, đường, tiêu, tỏi.','Đun chảo lửa lớn với bơ.','Xào bò nhanh tay, lắc chảo đều.','Bày lên đĩa rau xà lách, cà chua.']),
  ('che-ba-mau', 'Chè Ba Màu', 'Chè ba màu mát lạnh với đậu đỏ, đậu xanh, thạch và nước cốt dừa.', 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600', '60 phút', 'Trung bình', array['vui','thugian','met'], 'Tráng miệng', array['Nấu đậu đỏ với đường đến mềm.','Nấu đậu xanh với đường đến nhừ.','Cắt thạch thành sợi nhỏ.','Xếp từng lớp vào ly: đậu đỏ, đậu xanh, thạch.','Rưới nước cốt dừa, thêm đá bào.']),
  ('mi-quang', 'Mì Quảng', 'Đặc sản miền Trung với mì vàng, nước lèo tôm thịt đậm đà, ăn kèm bánh tráng nướng.', 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=600', '90 phút', 'Khó', array['haohung','vui'], 'Món nước', array['Nấu nước lèo từ xương, tôm.','Xào tôm, thịt với nghệ và gia vị.','Luộc trứng cút.','Trụng mì, xếp vào tô.','Chan nước lèo, xếp tôm, thịt, trứng.','Ăn kèm rau sống, đậu phộng, bánh tráng nướng.']),
  ('canh-chua', 'Canh Chua Cá Lóc', 'Canh chua miền Tây với me, dứa, cà chua, giá đỗ — chua ngọt thanh mát.', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600', '40 phút', 'Dễ', array['thugian','met','buon'], 'Món canh', array['Nấu nước me chua.','Thêm dứa, cà chua vào nồi.','Cho cá lóc phi lê vào nấu chín.','Thêm giá đỗ, đậu bắp.','Rắc rau om, ớt trước khi tắt bếp.']),
  ('banh-xeo', 'Bánh Xèo', 'Bánh xèo giòn rụm với nhân tôm, thịt, giá đỗ — cuốn rau sống chấm nước mắm.', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600', '45 phút', 'Trung bình', array['vui','haohung'], 'Món chiên', array['Pha bột bánh xèo với nghệ và nước cốt dừa.','Xào nhân tôm, thịt.','Đổ bột vào chảo nóng, xếp nhân, giá đỗ.','Đậy nắp cho bánh giòn.','Gấp đôi bánh, ăn kèm rau sống và nước mắm chua ngọt.']),
  ('sup-ga', 'Súp Gà Ngô Non', 'Súp gà nóng hổi với ngô non, nấm — món ăn nhẹ nhàng khi trời lạnh hoặc khi mệt.', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600', '35 phút', 'Dễ', array['met','buon','thugian'], 'Món canh', array['Luộc gà, xé sợi nhỏ.','Nấu nước dùng gà với ngô non và nấm.','Hòa bột năng với nước, cho vào nồi khuấy đều.','Đánh trứng, rưới vào nồi.','Rắc hành lá, tiêu. Ăn nóng.']),
  ('thit-kho-trung', 'Thịt Kho Trứng', 'Thịt ba chỉ kho trứng với nước dừa — món ngon cổ truyền ngày Tết miền Nam.', 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600', '90 phút', 'Trung bình', array['thugian','buon'], 'Món mặn', array['Cắt thịt ba chỉ vuông, ướp nước mắm, đường.','Luộc trứng vịt, bóc vỏ.','Thắng nước màu (caramel) trong nồi.','Cho thịt vào xào, thêm nước dừa.','Cho trứng vào, kho nhỏ lửa 60-90 phút.']),
  ('xoi-xeo', 'Xôi Xéo', 'Xôi đậu xanh vàng ươm với hành phi giòn — bữa sáng quen thuộc Hà Nội.', 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=600', '60 phút', 'Trung bình', array['vui','thugian'], 'Món xôi', array['Ngâm nếp và đậu xanh qua đêm.','Hấp nếp chín với nghệ.','Hấp đậu xanh riêng, nghiền mịn.','Phi hành tím giòn.','Xếp xôi, đậu xanh vào đĩa, rưới mỡ hành phi.']),
  ('bun-bo-hue', 'Bún Bò Huế', 'Bún bò cay nồng đặc trưng xứ Huế với giò heo, chả cua và sả.', 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600', '180 phút', 'Khó', array['haohung','vui'], 'Món nước', array['Ninh giò heo và xương bò 3-4 tiếng.','Phi sả băm, thêm ớt bột tạo màu đỏ.','Nêm mắm ruốc vào nước dùng.','Thái thịt bò, chả cua.','Trụng bún, chan nước dùng, xếp topping.','Ăn kèm rau sống, chanh, ớt.'])
on conflict (id) do nothing;

insert into public.ingredients (name)
values
  ('bánh phở'),('thịt bò'),('xương bò'),('hành tây'),('gừng'),('quế'),('hồi'),('rau mùi'),('giá đỗ'),('chanh'),
  ('bún'),('thịt lợn'),('nước mắm'),('đường'),('tỏi'),('ớt'),('dấm'),('rau sống'),('đu đủ xanh'),('gạo tấm'),
  ('sườn heo'),('trứng'),('bì heo'),('đồ chua'),('bánh mì'),('pate'),('thịt nguội'),('dưa leo'),('cà rốt'),('củ cải'),
  ('bánh tráng'),('tôm'),('thịt lợn luộc'),('tương đậu phộng'),('cá lóc'),('tiêu'),('hành tím'),('nước màu'),('bơ'),('xì dầu'),
  ('cà chua'),('rau xà lách'),('đậu đỏ'),('đậu xanh'),('thạch'),('nước cốt dừa'),('đá bào'),('mì Quảng'),('trứng cút'),('đậu phộng'),
  ('bánh tráng nướng'),('me'),('dứa'),('đậu bắp'),('rau om'),('bột gạo'),('bột nghệ'),('hành lá'),('gà'),('ngô non'),('nấm'),
  ('bột năng'),('thịt ba chỉ'),('trứng vịt'),('nước dừa'),('gạo nếp'),('dầu ăn'),('muối'),('nghệ'),('giò heo'),('chả cua'),('sả'),('mắm ruốc'),('ớt bột')
on conflict (name) do nothing;

insert into public.recipe_ingredients (recipe_id, ingredient_id)
select v.recipe_id, i.id
from (
  values
  ('pho-bo','bánh phở'),('pho-bo','thịt bò'),('pho-bo','xương bò'),('pho-bo','hành tây'),('pho-bo','gừng'),('pho-bo','quế'),('pho-bo','hồi'),('pho-bo','rau mùi'),('pho-bo','giá đỗ'),('pho-bo','chanh'),
  ('bun-cha','bún'),('bun-cha','thịt lợn'),('bun-cha','nước mắm'),('bun-cha','đường'),('bun-cha','tỏi'),('bun-cha','ớt'),('bun-cha','dấm'),('bun-cha','rau sống'),('bun-cha','đu đủ xanh'),
  ('com-tam','gạo tấm'),('com-tam','sườn heo'),('com-tam','trứng'),('com-tam','bì heo'),('com-tam','nước mắm'),('com-tam','đường'),('com-tam','tỏi'),('com-tam','đồ chua'),
  ('banh-mi','bánh mì'),('banh-mi','pate'),('banh-mi','thịt nguội'),('banh-mi','dưa leo'),('banh-mi','cà rốt'),('banh-mi','củ cải'),('banh-mi','rau mùi'),('banh-mi','ớt'),
  ('goi-cuon','bánh tráng'),('goi-cuon','tôm'),('goi-cuon','thịt lợn luộc'),('goi-cuon','bún'),('goi-cuon','rau sống'),('goi-cuon','giá đỗ'),('goi-cuon','tương đậu phộng'),
  ('ca-kho-to','cá lóc'),('ca-kho-to','nước mắm'),('ca-kho-to','đường'),('ca-kho-to','tiêu'),('ca-kho-to','ớt'),('ca-kho-to','hành tím'),('ca-kho-to','tỏi'),('ca-kho-to','nước màu'),
  ('bo-luc-lac','thịt bò'),('bo-luc-lac','tỏi'),('bo-luc-lac','bơ'),('bo-luc-lac','xì dầu'),('bo-luc-lac','đường'),('bo-luc-lac','tiêu'),('bo-luc-lac','cà chua'),('bo-luc-lac','rau xà lách'),
  ('che-ba-mau','đậu đỏ'),('che-ba-mau','đậu xanh'),('che-ba-mau','thạch'),('che-ba-mau','nước cốt dừa'),('che-ba-mau','đường'),('che-ba-mau','đá bào'),
  ('mi-quang','mì Quảng'),('mi-quang','tôm'),('mi-quang','thịt lợn'),('mi-quang','trứng cút'),('mi-quang','đậu phộng'),('mi-quang','bánh tráng nướng'),('mi-quang','rau sống'),
  ('canh-chua','cá lóc'),('canh-chua','me'),('canh-chua','dứa'),('canh-chua','cà chua'),('canh-chua','giá đỗ'),('canh-chua','đậu bắp'),('canh-chua','rau om'),('canh-chua','ớt'),
  ('banh-xeo','bột gạo'),('banh-xeo','bột nghệ'),('banh-xeo','tôm'),('banh-xeo','thịt lợn'),('banh-xeo','giá đỗ'),('banh-xeo','hành lá'),('banh-xeo','nước cốt dừa'),
  ('sup-ga','gà'),('sup-ga','ngô non'),('sup-ga','nấm'),('sup-ga','trứng'),('sup-ga','hành lá'),('sup-ga','tiêu'),('sup-ga','bột năng'),
  ('thit-kho-trung','thịt ba chỉ'),('thit-kho-trung','trứng vịt'),('thit-kho-trung','nước dừa'),('thit-kho-trung','nước mắm'),('thit-kho-trung','đường'),('thit-kho-trung','tiêu'),('thit-kho-trung','hành tím'),
  ('xoi-xeo','gạo nếp'),('xoi-xeo','đậu xanh'),('xoi-xeo','hành tím'),('xoi-xeo','dầu ăn'),('xoi-xeo','muối'),('xoi-xeo','nghệ'),
  ('bun-bo-hue','bún'),('bun-bo-hue','giò heo'),('bun-bo-hue','thịt bò'),('bun-bo-hue','chả cua'),('bun-bo-hue','sả'),('bun-bo-hue','mắm ruốc'),('bun-bo-hue','ớt bột'),('bun-bo-hue','rau sống')
) as v(recipe_id, ingredient_name)
join public.ingredients i on i.name = v.ingredient_name
on conflict (recipe_id, ingredient_id) do nothing;