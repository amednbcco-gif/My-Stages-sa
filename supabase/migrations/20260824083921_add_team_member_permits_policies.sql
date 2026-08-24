-- Add team member access policies to project_permits
-- Team members (linked via user_id to team_members row owned by the project owner)
-- should be able to manage permits on projects they have access to.

-- Team members can view permits on their owner's projects
DROP POLICY IF EXISTS "team_members_view_permits" ON project_permits;
CREATE POLICY "team_members_view_permits"
  ON project_permits FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.owner_id = project_permits.owner_id
        AND tm.user_id = auth.uid()
    )
  );

-- Team members can insert permits if they have edit access
-- (either can_edit_all or a field-scope permission for the "permit" milestone)
DROP POLICY IF EXISTS "team_members_insert_permits" ON project_permits;
CREATE POLICY "team_members_insert_permits"
  ON project_permits FOR INSERT
  TO authenticated WITH CHECK (
    owner_id IN (
      SELECT tm.owner_id FROM team_members tm
      WHERE tm.user_id = auth.uid()
        AND (tm.can_edit_all = true
             OR EXISTS (
               SELECT 1 FROM project_permissions pp
               WHERE pp.team_member_id = tm.id
                 AND pp.project_id = project_permits.project_id
                 AND pp.can_edit = true
                 AND pp.field = 'permit'
             ))
    )
  );

-- Team members can update permits if they have edit access
DROP POLICY IF EXISTS "team_members_update_permits" ON project_permits;
CREATE POLICY "team_members_update_permits"
  ON project_permits FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.owner_id = project_permits.owner_id
        AND tm.user_id = auth.uid()
        AND (tm.can_edit_all = true
             OR EXISTS (
               SELECT 1 FROM project_permissions pp
               WHERE pp.team_member_id = tm.id
                 AND pp.project_id = project_permits.project_id
                 AND pp.can_edit = true
                 AND pp.field = 'permit'
             ))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.owner_id = project_permits.owner_id
        AND tm.user_id = auth.uid()
        AND (tm.can_edit_all = true
             OR EXISTS (
               SELECT 1 FROM project_permissions pp
               WHERE pp.team_member_id = tm.id
                 AND pp.project_id = project_permits.project_id
                 AND pp.can_edit = true
                 AND pp.field = 'permit'
             ))
    )
  );

-- Team members can delete permits if they have edit access
DROP POLICY IF EXISTS "team_members_delete_permits" ON project_permits;
CREATE POLICY "team_members_delete_permits"
  ON project_permits FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.owner_id = project_permits.owner_id
        AND tm.user_id = auth.uid()
        AND (tm.can_edit_all = true
             OR EXISTS (
               SELECT 1 FROM project_permissions pp
               WHERE pp.team_member_id = tm.id
                 AND pp.project_id = project_permits.project_id
                 AND pp.can_edit = true
                 AND pp.field = 'permit'
             ))
    )
  );
