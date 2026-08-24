-- Update projects SELECT policy to also match by email for pending members
DROP POLICY IF EXISTS "team_members_view_owner_projects" ON projects;
CREATE POLICY "team_members_view_owner_projects"
  ON projects FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.owner_id = projects.owner_id
        AND (
          (tm.user_id = auth.uid() AND tm.can_view_all = true)
          OR (tm.user_id IS NULL
              AND lower(trim(tm.email)) = lower(trim(auth.jwt() ->> 'email'))
              AND tm.can_view_all = true)
        )
    )
  );
