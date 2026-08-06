/*
# STAGES - Infrastructure Project Tracker Schema

Creates the complete database schema for STAGES, an infrastructure project tracker
that bridges field engineers and corporate finance. Multi-user with role-based
permissions (Manager / Site Engineer).

New tables: profiles, projects, project_notes, stage_attachments, team_members,
project_permissions. RLS enabled on all. Storage bucket stage-attachments created.
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text DEFAULT '',
  phone text DEFAULT '',
  role text DEFAULT 'engineer',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  project_name text DEFAULT '',
  po_number text DEFAULT '',
  plan_no text DEFAULT '',
  po_value_usd numeric DEFAULT 0,
  po_value_sar numeric DEFAULT 0,
  site_id text DEFAULT '',
  sn text DEFAULT '',
  status text DEFAULT 'Pending',
  stage1 jsonb DEFAULT '{"surveyStatus":"pending","designStatus":"pending","dboqStatus":"pending","sendDocsDate":"","receiveDocsDate":""}'::jsonb,
  stage2 jsonb DEFAULT '{"poReceiveStatus":"pending","aboqStatus":"pending","baselineStartDate":"","baselineEndDate":""}'::jsonb,
  stage3 jsonb DEFAULT '{"permitsStatus":"pending","civilActualMeters":0,"hddActualMeters":0,"fiberSplicingStatus":"pending","patchingStatus":"pending","actualStartDate":"","actualEndDate":""}'::jsonb,
  stage4 jsonb DEFAULT '{"patStatus":"pending","patReqNo":"","owsPatRequestDate":"","patStartDate":"","gisStatus":"pending","crqHoStatus":"pending","crqHoNo":"","crqHoSubmittedFilesDate":""}'::jsonb,
  stage5 jsonb DEFAULT '{"pcrStatus":"pending","pcrRef":"","sdnStatus":"pending","rfsStatus":"pending","pacStatus":"pending","pacCrqStatus":"pending","pacCrqNo":""}'::jsonb,
  stage6 jsonb DEFAULT '{"facStatus":"pending","facDate":"","clearancePermit":"pending","facCrqStatus":"pending","facCrqNo":""}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_projects" ON projects;
CREATE POLICY "select_own_projects" ON projects FOR SELECT
  TO authenticated USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "insert_own_projects" ON projects;
CREATE POLICY "insert_own_projects" ON projects FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "update_own_projects" ON projects;
CREATE POLICY "update_own_projects" ON projects FOR UPDATE
  TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "delete_own_projects" ON projects;
CREATE POLICY "delete_own_projects" ON projects FOR DELETE
  TO authenticated USING (auth.uid() = owner_id);

-- Project notes table
CREATE TABLE IF NOT EXISTS project_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  author_id uuid DEFAULT auth.uid(),
  body text NOT NULL DEFAULT '',
  category text DEFAULT 'general',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE project_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notes" ON project_notes;
CREATE POLICY "select_own_notes" ON project_notes FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_notes.project_id AND projects.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_notes" ON project_notes;
CREATE POLICY "insert_own_notes" ON project_notes FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_notes.project_id AND projects.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_notes" ON project_notes;
CREATE POLICY "delete_own_notes" ON project_notes FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_notes.project_id AND projects.owner_id = auth.uid())
  );

-- Stage attachments table
CREATE TABLE IF NOT EXISTS stage_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  stage text DEFAULT '',
  field text DEFAULT '',
  file_path text NOT NULL,
  file_name text DEFAULT '',
  file_type text DEFAULT '',
  file_size bigint DEFAULT 0,
  uploaded_by uuid DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stage_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_attachments" ON stage_attachments;
CREATE POLICY "select_own_attachments" ON stage_attachments FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = stage_attachments.project_id AND projects.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_attachments" ON stage_attachments;
CREATE POLICY "insert_own_attachments" ON stage_attachments FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = stage_attachments.project_id AND projects.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_attachments" ON stage_attachments;
CREATE POLICY "delete_own_attachments" ON stage_attachments FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = stage_attachments.project_id AND projects.owner_id = auth.uid())
  );

-- Team members table
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  email text DEFAULT '',
  full_name text DEFAULT '',
  phone text DEFAULT '',
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  can_add_projects boolean DEFAULT false,
  can_view_all boolean DEFAULT false,
  can_edit_all boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_team" ON team_members;
CREATE POLICY "select_own_team" ON team_members FOR SELECT
  TO authenticated USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "insert_own_team" ON team_members;
CREATE POLICY "insert_own_team" ON team_members FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "update_own_team" ON team_members;
CREATE POLICY "update_own_team" ON team_members FOR UPDATE
  TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "delete_own_team" ON team_members;
CREATE POLICY "delete_own_team" ON team_members FOR DELETE
  TO authenticated USING (auth.uid() = owner_id);

-- Project permissions table
CREATE TABLE IF NOT EXISTS project_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  team_member_id uuid NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  scope text DEFAULT 'project',
  stage text DEFAULT '',
  field text DEFAULT '',
  can_edit boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE project_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_perms" ON project_permissions;
CREATE POLICY "select_own_perms" ON project_permissions FOR SELECT
  TO authenticated USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "insert_own_perms" ON project_permissions;
CREATE POLICY "insert_own_perms" ON project_permissions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "update_own_perms" ON project_permissions;
CREATE POLICY "update_own_perms" ON project_permissions FOR UPDATE
  TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "delete_own_perms" ON project_permissions;
CREATE POLICY "delete_own_perms" ON project_permissions FOR DELETE
  TO authenticated USING (auth.uid() = owner_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_notes_project ON project_notes(project_id);
CREATE INDEX IF NOT EXISTS idx_attachments_project ON stage_attachments(project_id);
CREATE INDEX IF NOT EXISTS idx_team_owner ON team_members(owner_id);
CREATE INDEX IF NOT EXISTS idx_perms_project ON project_permissions(project_id);

-- Storage bucket for attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('stage-attachments', 'stage-attachments', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "allow authenticated uploads" ON storage.objects;
CREATE POLICY "allow authenticated uploads" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'stage-attachments');

DROP POLICY IF EXISTS "allow authenticated reads" ON storage.objects;
CREATE POLICY "allow authenticated reads" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'stage-attachments');

DROP POLICY IF EXISTS "allow authenticated deletes" ON storage.objects;
CREATE POLICY "allow authenticated deletes" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'stage-attachments');

-- Auto-generate sn (short name) on project insert
CREATE OR REPLACE FUNCTION generate_project_sn()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sn IS NULL OR NEW.sn = '' THEN
    NEW.sn := 'PRJ-' || UPPER(SUBSTRING(NEW.id::text, 1, 6));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_sn ON projects;
CREATE TRIGGER trg_generate_sn
  BEFORE INSERT ON projects
  FOR EACH ROW EXECUTE FUNCTION generate_project_sn();
