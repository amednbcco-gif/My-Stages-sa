-- Update the projects UPDATE policy to also match team members by email
-- when user_id is not yet linked (pending members who signed in)
DROP POLICY IF EXISTS "team_members_edit_permitted_projects" ON projects;

CREATE POLICY "team_members_edit_permitted_projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    -- Owner can always update
    auth.uid() = owner_id
    OR
    -- Team member with user_id linked
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.owner_id = projects.owner_id
        AND tm.user_id = auth.uid()
        AND (
          tm.can_edit_all = true
          OR EXISTS (
            SELECT 1 FROM project_permissions pp
            WHERE pp.team_member_id = tm.id
              AND pp.project_id = projects.id
              AND pp.can_edit = true
          )
        )
    )
    OR
    -- Team member matched by email (pending link, user_id still null)
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.owner_id = projects.owner_id
        AND tm.user_id IS NULL
        AND lower(trim(tm.email)) = lower(trim(auth.jwt() ->> 'email'))
        AND (
          tm.can_edit_all = true
          OR EXISTS (
            SELECT 1 FROM project_permissions pp
            WHERE pp.team_member_id = tm.id
              AND pp.project_id = projects.id
              AND pp.can_edit = true
          )
        )
    )
  )
  WITH CHECK (
    auth.uid() = owner_id
    OR
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.owner_id = projects.owner_id
        AND tm.user_id = auth.uid()
        AND (
          tm.can_edit_all = true
          OR EXISTS (
            SELECT 1 FROM project_permissions pp
            WHERE pp.team_member_id = tm.id
              AND pp.project_id = projects.id
              AND pp.can_edit = true
          )
        )
    )
    OR
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.owner_id = projects.owner_id
        AND tm.user_id IS NULL
        AND lower(trim(tm.email)) = lower(trim(auth.jwt() ->> 'email'))
        AND (
          tm.can_edit_all = true
          OR EXISTS (
            SELECT 1 FROM project_permissions pp
            WHERE pp.team_member_id = tm.id
              AND pp.project_id = projects.id
              AND pp.can_edit = true
          )
        )
    )
  );

-- Also update the stage_attachments policies to match by email for pending members
DROP POLICY IF EXISTS "team_members_insert_attachments" ON stage_attachments;
CREATE POLICY "team_members_insert_attachments"
  ON stage_attachments FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM (projects p JOIN team_members tm ON tm.owner_id = p.owner_id)
      WHERE p.id = stage_attachments.project_id
        AND (
          (tm.user_id = auth.uid() AND (
            tm.can_edit_all = true
            OR EXISTS (
              SELECT 1 FROM project_permissions pp
              WHERE pp.team_member_id = tm.id
                AND pp.project_id = stage_attachments.project_id
                AND pp.can_edit = true
                AND (pp.field = stage_attachments.field OR stage_attachments.field = '_stage')
            )
          ))
          OR
          (tm.user_id IS NULL
            AND lower(trim(tm.email)) = lower(trim(auth.jwt() ->> 'email'))
            AND (
              tm.can_edit_all = true
              OR EXISTS (
                SELECT 1 FROM project_permissions pp
                WHERE pp.team_member_id = tm.id
                  AND pp.project_id = stage_attachments.project_id
                  AND pp.can_edit = true
                  AND (pp.field = stage_attachments.field OR stage_attachments.field = '_stage')
              )
            )
          )
        )
    )
  );

DROP POLICY IF EXISTS "team_members_delete_attachments" ON stage_attachments;
CREATE POLICY "team_members_delete_attachments"
  ON stage_attachments FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM (projects p JOIN team_members tm ON tm.owner_id = p.owner_id)
      WHERE p.id = stage_attachments.project_id
        AND (
          (tm.user_id = auth.uid() AND (
            tm.can_edit_all = true
            OR EXISTS (
              SELECT 1 FROM project_permissions pp
              WHERE pp.team_member_id = tm.id
                AND pp.project_id = stage_attachments.project_id
                AND pp.can_edit = true
                AND (pp.field = stage_attachments.field OR stage_attachments.field = '_stage')
            )
          ))
          OR
          (tm.user_id IS NULL
            AND lower(trim(tm.email)) = lower(trim(auth.jwt() ->> 'email'))
            AND (
              tm.can_edit_all = true
              OR EXISTS (
                SELECT 1 FROM project_permissions pp
                WHERE pp.team_member_id = tm.id
                  AND pp.project_id = stage_attachments.project_id
                  AND pp.can_edit = true
                  AND (pp.field = stage_attachments.field OR stage_attachments.field = '_stage')
              )
            )
          )
        )
    )
  );

-- Update project_notes team member policies to match by email
DROP POLICY IF EXISTS "team_members_insert_notes" ON project_notes;
CREATE POLICY "team_members_insert_notes"
  ON project_notes FOR INSERT
  TO authenticated WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM (projects p JOIN team_members tm ON tm.owner_id = p.owner_id)
      WHERE p.id = project_notes.project_id
        AND (
          tm.user_id = auth.uid()
          OR (tm.user_id IS NULL AND lower(trim(tm.email)) = lower(trim(auth.jwt() ->> 'email')))
        )
    )
  );

-- Update project_permits team member policies to match by email
DROP POLICY IF EXISTS "team_members_insert_permits" ON project_permits;
CREATE POLICY "team_members_insert_permits"
  ON project_permits FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.owner_id = project_permits.owner_id
        AND (
          (tm.user_id = auth.uid())
          OR (tm.user_id IS NULL AND lower(trim(tm.email)) = lower(trim(auth.jwt() ->> 'email')))
        )
        AND (
          tm.can_edit_all = true
          OR EXISTS (
            SELECT 1 FROM project_permissions pp
            WHERE pp.team_member_id = tm.id
              AND pp.project_id = project_permits.project_id
              AND pp.can_edit = true
              AND pp.field = 'permit'
          )
        )
    )
  );

DROP POLICY IF EXISTS "team_members_update_permits" ON project_permits;
CREATE POLICY "team_members_update_permits"
  ON project_permits FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.owner_id = project_permits.owner_id
        AND (
          (tm.user_id = auth.uid())
          OR (tm.user_id IS NULL AND lower(trim(tm.email)) = lower(trim(auth.jwt() ->> 'email')))
        )
        AND (
          tm.can_edit_all = true
          OR EXISTS (
            SELECT 1 FROM project_permissions pp
            WHERE pp.team_member_id = tm.id
              AND pp.project_id = project_permits.project_id
              AND pp.can_edit = true
              AND pp.field = 'permit'
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.owner_id = project_permits.owner_id
        AND (
          (tm.user_id = auth.uid())
          OR (tm.user_id IS NULL AND lower(trim(tm.email)) = lower(trim(auth.jwt() ->> 'email')))
        )
        AND (
          tm.can_edit_all = true
          OR EXISTS (
            SELECT 1 FROM project_permissions pp
            WHERE pp.team_member_id = tm.id
              AND pp.project_id = project_permits.project_id
              AND pp.can_edit = true
              AND pp.field = 'permit'
          )
        )
    )
  );

DROP POLICY IF EXISTS "team_members_delete_permits" ON project_permits;
CREATE POLICY "team_members_delete_permits"
  ON project_permits FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.owner_id = project_permits.owner_id
        AND (
          (tm.user_id = auth.uid())
          OR (tm.user_id IS NULL AND lower(trim(tm.email)) = lower(trim(auth.jwt() ->> 'email')))
        )
        AND (
          tm.can_edit_all = true
          OR EXISTS (
            SELECT 1 FROM project_permissions pp
            WHERE pp.team_member_id = tm.id
              AND pp.project_id = project_permits.project_id
              AND pp.can_edit = true
              AND pp.field = 'permit'
          )
        )
    )
  );
