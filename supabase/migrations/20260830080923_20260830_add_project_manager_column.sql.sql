/*
# Add project_manager column to projects table

## Why
The frontend already references a "Project Manager" field in the project form,
the project type, the CSV export, and the demo project — but the column does not
exist in the database yet, causing inserts/updates to silently fail.

## Changes
1. Add `project_manager` text column (NOT NULL, default empty string) to `projects`.
2. Backfill: every existing row gets an empty string (handled by the DEFAULT).

## Safety
- ADD COLUMN IF NOT EXISTS is idempotent.
- No existing columns are dropped or renamed.
*/

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS project_manager text NOT NULL DEFAULT '';
