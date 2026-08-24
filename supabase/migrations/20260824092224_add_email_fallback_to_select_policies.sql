-- Update team member SELECT policies to also match by email for pending members
-- whose user_id hasn't been linked yet

-- Stage attachments: allow viewing by email-matched pending members
DROP POLICY IF EXISTS "team_members_view_attachments" ON stage_attachments;
CREATE POLICY "team_members_view_attachments"
  ON stage_attachments FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM (projects p JOIN team_members tm ON tm.owner_id = p.owner_id)
      WHERE p.id = stage_attachments.project_id
        AND (
          tm.user_id = auth.uid()
          OR (tm.user_id IS NULL AND lower(trim(tm.email)) = lower(trim(auth.jwt() ->> 'email')))
        )
    )
  );

-- Project notes: allow viewing by email-matched pending members
DROP POLICY IF EXISTS "team_members_view_notes" ON project_notes;
CREATE POLICY "team_members_view_notes"
  ON project_notes FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM (projects p JOIN team_members tm ON tm.owner_id = p.owner_id)
      WHERE p.id = project_notes.project_id
        AND (
          tm.user_id = auth.uid()
          OR (tm.user_id IS NULL AND lower(trim(tm.email)) = lower(trim(auth.jwt() ->> 'email')))
        )
    )
  );

-- Project permits: allow viewing by email-matched pending members
DROP POLICY IF EXISTS "team_members_view_permits" ON project_permits;
CREATE POLICY "team_members_view_permits"
  ON project_permits FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.owner_id = project_permits.owner_id
        AND (
          tm.user_id = auth.uid()
          OR (tm.user_id IS NULL AND lower(trim(tm.email)) = lower(trim(auth.jwt() ->> 'email')))
        )
    )
  );
