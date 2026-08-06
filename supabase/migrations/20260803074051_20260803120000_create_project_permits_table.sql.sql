/*
# Create project_permits table

1. New Tables
- `project_permits` — stores multiple permit rows per project (one row per permit).
  - `id` (uuid, primary key)
  - `project_id` (uuid, FK to projects.id, ON DELETE CASCADE)
  - `owner_id` (uuid, NOT NULL, DEFAULT auth.uid()) — owner of the row
  - `sn` (integer, NOT NULL, DEFAULT 1) — serial number column shown in the list
  - `permit_no` (text) — permit number
  - `issued_date` (date) — date the permit was issued
  - `start_date` (date) — permit start date
  - `end_date` (date) — permit end date
  - `cw_meters` (numeric, default 0) — civil works meters (CW)
  - `permit_status` (text, NOT NULL, default 'pending') — one of: pending, inprogress, submitted, issued, closed, clearanced
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

2. Security
- Enable RLS on `project_permits`.
- Owner-scoped CRUD: each authenticated user can only access rows they own (matching the projects table pattern).
- Index on project_id for fast lookup.

3. Important Notes
- This table is separate from the stage3 JSONB column `permitsStatus` (which tracks the overall permit milestone status).
- Each project can have zero or many permit rows.
- The `sn` column is a simple integer the user can set; no auto-sequence so the user controls ordering.
*/

CREATE TABLE IF NOT EXISTS project_permits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  sn integer NOT NULL DEFAULT 1,
  permit_no text NOT NULL DEFAULT '',
  issued_date date,
  start_date date,
  end_date date,
  cw_meters numeric NOT NULL DEFAULT 0,
  permit_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE project_permits ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_project_permits_project_id ON project_permits(project_id);

DROP POLICY IF EXISTS "select_own_permits" ON project_permits;
CREATE POLICY "select_own_permits"
  ON project_permits FOR SELECT
  TO authenticated USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "insert_own_permits" ON project_permits;
CREATE POLICY "insert_own_permits"
  ON project_permits FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "update_own_permits" ON project_permits;
CREATE POLICY "update_own_permits"
  ON project_permits FOR UPDATE
  TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "delete_own_permits" ON project_permits;
CREATE POLICY "delete_own_permits"
  ON project_permits FOR DELETE
  TO authenticated USING (auth.uid() = owner_id);