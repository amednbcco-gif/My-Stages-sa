/*
# Add GPS coordinates to projects

1. Modified Tables
- `projects`
  - `latitude`  (double precision, nullable) — GPS latitude of the project site
  - `longitude` (double precision, nullable) — GPS longitude of the project site

2. Security
- No RLS policy changes. Existing owner-scoped policies on `projects` cover the new columns automatically.

3. Notes
- Both columns are nullable so existing projects are not affected.
- Stored as `double precision` for accurate coordinate math.
*/

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS latitude  double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;