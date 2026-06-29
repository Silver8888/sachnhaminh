-- schema.sql - Thiết lập Cơ sở dữ liệu Supabase cho Sach Nha Minh

-- =========================================================================
-- 1. XÓA BẢNG CŨ (Nếu có - để đảm bảo cài đặt sạch)
-- =========================================================================
drop table if exists registrations cascade;
drop table if exists events cascade;
drop table if exists sub_categories cascade;
drop table if exists contacts cascade;
drop table if exists books cascade;
drop table if exists gallery cascade;
drop table if exists articles cascade;
drop table if exists profiles cascade;
drop table if exists roles cascade;
drop table if exists slides cascade;

-- =========================================================================
-- 2. TẠO BẢNG DỮ LIỆU
-- =========================================================================

-- Bảng phân quyền Admin theo email
create table roles (
    email text primary key,
    is_admin boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bảng hồ sơ người dùng (đồng bộ từ Supabase Auth)
create table profiles (
    id uuid primary key references auth.users on delete cascade,
    email text unique not null,
    is_admin boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bảng Slides (Banner trang chủ)
create table slides (
    id uuid primary key default gen_random_uuid(),
    image_url text,
    heading_vi text,
    heading_en text,
    description_vi text,
    description_en text,
    content_vi text,
    content_en text,
    effect text,
    "order" integer default 0,
    heading_font_size integer,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bảng Tin tức / Bài viết
create table articles (
    id uuid primary key default gen_random_uuid(),
    title_vi text not null,
    title_en text,
    summary_vi text,
    summary_en text,
    content_vi text,
    content_en text,
    date text,
    image text,
    category text, -- 'school', 'skills', v.v.
    event_id uuid references events(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bảng Gallery (Phòng truyền thống hình ảnh/video)
create table gallery (
    id uuid primary key default gen_random_uuid(),
    type text check (type in ('image', 'video')) not null,
    category text,
    url text,
    thumbnail text,
    title text,
    event_id text, -- ID sự kiện liên quan (nếu có)
    video_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bảng Điểm sách
create table books (
    id uuid primary key default gen_random_uuid(),
    title_vi text not null,
    title_en text,
    author text,
    category text,
    price_vi text,
    price_en text,
    cover_url text,
    review_vi text,
    review_en text,
    summary_vi text,
    summary_en text,
    rating integer default 5,
    is_hot_month boolean default false,
    is_typical_10 boolean default false,
    is_must_read_100 boolean default false,
    publisher text,
    year text,
    translator text,
    isbn text,
    age text,
    tiki_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bảng Danh mục sự kiện con (Global)
create table sub_categories (
    id uuid primary key default gen_random_uuid(),
    name_vi text not null,
    name_en text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bảng Phân loại sự kiện chính
create table event_classifications (
    id text primary key,
    name_vi text not null,
    name_en text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bảng Sự kiện
create table events (
    id uuid primary key default gen_random_uuid(),
    title_vi text not null,
    title_en text,
    date text,
    time text,
    end_time text,
    location text,
    description_vi text,
    description_en text,
    image text,
    category text default 'sachnhaminh', -- 'sachnhaminh' hoặc 'external'
    sub_category_id uuid references sub_categories(id) on delete set null,
    max_attendees integer default 0,
    approved_count integer default 0,
    code text,
    day integer,
    content_vi text,
    content_en text,
    created_by text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bảng Đăng ký sự kiện
create table registrations (
    id uuid primary key default gen_random_uuid(),
    event_id uuid references events(id) on delete cascade not null,
    name text not null,
    email text not null,
    phone text,
    participants integer default 1,
    participants_info jsonb default '[]'::jsonb,
    status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
    ticket_sent boolean default false,
    checked_in boolean default false,
    checked_in_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bảng Liên hệ
create table contacts (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    email text not null,
    phone text,
    message text,
    status text default 'new' check (status in ('new', 'read')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =========================================================================
-- 3. CƠ CHẾ ĐỒNG BỘ PROFILE TỪ AUTH.USERS SANG PUBLIC.PROFILES
-- =========================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, is_admin)
  values (
    new.id,
    new.email,
    exists(select 1 from public.roles r where lower(r.email) = lower(new.email) and r.is_admin = true) or new.email = 'cuongnt.aclw@gmail.com'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================================
-- 4. KÍCH HOẠT ROW LEVEL SECURITY (RLS) & THIẾT LẬP CHÍNH SÁCH BẢO MẬT
-- =========================================================================
alter table roles enable row level security;
alter table profiles enable row level security;
alter table slides enable row level security;
alter table articles enable row level security;
alter table gallery enable row level security;
alter table books enable row level security;
alter table sub_categories enable row level security;
alter table event_classifications enable row level security;
alter table events enable row level security;
alter table registrations enable row level security;
alter table contacts enable row level security;


-- Hàm kiểm tra người dùng có phải admin không
create or replace function public.is_admin()
returns boolean as $$
begin
  return (
    auth.jwt()->>'email' = 'cuongnt.aclw@gmail.com'
    or exists (
      select 1 from public.roles 
      where lower(roles.email) = lower(auth.jwt()->>'email') 
        and roles.is_admin = true
    )
    or exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() 
        and profiles.is_admin = true
    )
  );
end;
$$ language plpgsql security definer;

-- CHÍNH SÁCH: roles
create policy "Chỉ Admin được xem và chỉnh sửa roles" on roles 
    for all using (public.is_admin());

-- CHÍNH SÁCH: profiles
create policy "Mọi người dùng có quyền tự đọc profile của mình" on profiles 
    for select using (auth.uid() = id or public.is_admin());
create policy "Chỉ Admin được chỉnh sửa profiles" on profiles 
    for all using (public.is_admin());

-- CHÍNH SÁCH: slides
create policy "Cho phép mọi người đọc slides" on slides for select using (true);
create policy "Chỉ Admin quản lý slides" on slides for all using (public.is_admin());

-- CHÍNH SÁCH: articles
create policy "Cho phép mọi người đọc articles" on articles for select using (true);
create policy "Chỉ Admin quản lý articles" on articles for all using (public.is_admin());

-- CHÍNH SÁCH: gallery
create policy "Cho phép mọi người đọc gallery" on gallery for select using (true);
create policy "Chỉ Admin quản lý gallery" on gallery for all using (public.is_admin());

-- CHÍNH SÁCH: books
create policy "Cho phép mọi người đọc books" on books for select using (true);
create policy "Chỉ Admin quản lý books" on books for all using (public.is_admin());

-- CHÍNH SÁCH: sub_categories
create policy "Cho phép mọi người đọc sub_categories" on sub_categories for select using (true);
create policy "Chỉ Admin quản lý sub_categories" on sub_categories for all using (public.is_admin());

-- CHÍNH SÁCH: event_classifications
create policy "Cho phép mọi người đọc event_classifications" on event_classifications for select using (true);
create policy "Chỉ Admin quản lý event_classifications" on event_classifications for all using (public.is_admin());


-- CHÍNH SÁCH: events
create policy "Cho phép mọi người đọc events" on events for select using (true);
create policy "Chỉ Admin quản lý events" on events for all using (public.is_admin());

-- CHÍNH SÁCH: registrations
create policy "Cho phép mọi người đăng ký sự kiện" on registrations for insert with check (true);
create policy "Chỉ Admin quản lý đăng ký sự kiện" on registrations for all using (public.is_admin());

-- CHÍNH SÁCH: contacts
create policy "Cho phép mọi người gửi liên hệ" on contacts for insert with check (true);
create policy "Chỉ Admin quản lý liên hệ" on contacts for all using (public.is_admin());

-- =========================================================================
-- 5. KHỞI TẠO DỮ LIỆU BAN ĐẦU (SEED DATA)
-- =========================================================================

-- Khởi tạo quyền Admin cho chủ sở hữu
insert into roles (email, is_admin) values ('cuongnt.aclw@gmail.com', true) on conflict (email) do update set is_admin = true;

-- Khởi tạo danh mục sự kiện mặc định
insert into sub_categories (name_vi, name_en) values 
('Văn Hóa', 'Culture'),
('Nghệ Thuật', 'Art'),
('Thể Thao', 'Sport'),
('Thẩm Mỹ', 'Aesthetics')
on conflict do nothing;

-- Khởi tạo phân loại sự kiện mặc định
insert into event_classifications (id, name_vi, name_en) values
('sachnhaminh', 'Sách Nhà Mình', 'Sach Nha Minh'),
('external', 'Sự kiện bên ngoài', 'External Events')
on conflict (id) do nothing;


-- Bảng Site Settings (Cấu hình Website)
CREATE TABLE IF NOT EXISTS public.site_settings (
    id text PRIMARY KEY,
    theme text,
    font text,
    site_name text,
    site_logo text,
    contact_address text,
    contact_phone text,
    facebook_url text,
    instagram_url text,
    custom_color text,
    custom_font text,
    show_spotlight boolean DEFAULT true,
    show_book_review boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Kích hoạt RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Chính sách đọc site_settings công khai
DROP POLICY IF EXISTS "Cho phép đọc site_settings công khai" ON public.site_settings;
CREATE POLICY "Cho phép đọc site_settings công khai" ON public.site_settings FOR SELECT USING (true);

-- Chính sách chỉnh sửa site_settings chỉ dành cho Admin
DROP POLICY IF EXISTS "Chỉ Admin được chỉnh sửa site_settings" ON public.site_settings;
CREATE POLICY "Chỉ Admin được chỉnh sửa site_settings" ON public.site_settings FOR ALL USING (public.is_admin());

-- Khởi tạo dữ liệu cấu hình mặc định
INSERT INTO public.site_settings (id, theme, font, site_name, show_spotlight, show_book_review) VALUES
    ('global', 'pastelRed', 'serif', 'Sách nhà Mình', true, true)
ON CONFLICT (id) DO NOTHING;


