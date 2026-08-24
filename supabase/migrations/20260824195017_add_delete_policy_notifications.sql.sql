/*
# Add DELETE policy to notifications table

1. Security
- Allow authenticated users to delete notifications they own (owner_id = auth.uid())
- Allow team members to delete notifications owned by their manager (tm.user_id = auth.uid() AND tm.owner_id = notifications.owner_id)
- Matches the existing SELECT/INSERT policy pattern (org_members_read_notifications / org_members_insert_notifications)
*/

DROP POLICY IF EXISTS "org_members_delete_notifications" ON notifications;

CREATE POLICY "org_members_delete_notifications"
ON notifications FOR DELETE
TO authenticated
USING (
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.owner_id = notifications.owner_id
    AND tm.user_id = auth.uid()
  )
);
