create table if not exists students (
  id serial primary key,
  name text not null,
  name_key text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists attendance (
  id serial primary key,
  student_id integer not null references students (id) on delete cascade,
  day date not null,
  status text not null check (status in ('Hadir', 'Izin', 'Sakit', 'Alpa')),
  note text not null default '',
  updated_at timestamptz not null default now(),
  unique (student_id, day)
);

create index if not exists attendance_day_idx on attendance (day desc);

create table if not exists tasks (
  id serial primary key,
  title text not null,
  subject text not null default '',
  due date,
  priority text not null default 'normal' check (priority in ('normal', 'tinggi')),
  description text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists admin_sessions (
  token text primary key,
  created_at timestamptz not null default now()
);

insert into students (name, name_key, sort_order) values
  ('Teguh', 'teguh', 1),
  ('Rivan', 'rivan', 2),
  ('Rangga', 'rangga', 3),
  ('Anwar', 'anwar', 4),
  ('Fradil', 'fradil', 5),
  ('Nazam', 'nazam', 6),
  ('Rafi', 'rafi', 7),
  ('Satria', 'satria', 8),
  ('Iksan', 'iksan', 9),
  ('Rahmat', 'rahmat', 10),
  ('Hori', 'hori', 11),
  ('Nazril', 'nazril', 12),
  ('Fahrizal', 'fahrizal', 13),
  ('Kiki', 'kiki', 14),
  ('Husni', 'husni', 15),
  ('Azmi', 'azmi', 16),
  ('Ajihad', 'ajihad', 17),
  ('Deril', 'deril', 18),
  ('Faarih', 'faarih', 19),
  ('Fajar', 'fajar', 20),
  ('Fadil', 'fadil', 21),
  ('Toyibur', 'toyibur', 22),
  ('Lucky', 'lucky', 23),
  ('Risma', 'risma', 24),
  ('Dika', 'dika', 25),
  ('Adis', 'adis', 26),
  ('Yopti', 'yopti', 27),
  ('Angga', 'angga', 28),
  ('Arga', 'arga', 29),
  ('Rizki.F', 'rizki.f', 30)
on conflict (name_key) do nothing;
