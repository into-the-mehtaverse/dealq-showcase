create table if not exists upload_files (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid not null references uploads(id) on delete cascade,
  file_type text not null,  -- e.g., 'pdf', 'excel'
  filename text not null,
  file_path text not null,
  uploaded_at timestamptz default now() not null,
  doc_type text
);
