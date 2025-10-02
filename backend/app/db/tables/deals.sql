CREATE TABLE IF NOT EXISTS deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_name text,
  address text,
  city text,
  state text,
  zip_code text,
  number_of_units int,
  year_built int,
  parking_spaces int,
  gross_square_feet int,
  asking_price numeric,

  t12 jsonb,        -- detailed T-12 financial line items
  rent_roll jsonb,  -- detailed rent roll data

  description text,              -- additional deal description or notes
  excel_file_path text,           -- link to generated Excel file
  image_path text,                -- link to generated image file
  status text NOT NULL DEFAULT 'new',
  revenue numeric,
  expenses numeric,
  market_description text, -- description of the market the property is in

  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
