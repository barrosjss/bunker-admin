-- ============================================================
-- Migration 016: Missing DELETE policy on memberships
-- ============================================================
-- 009_rls_policies.sql added SELECT/INSERT/UPDATE for memberships but no
-- DELETE. RLS defaults to deny, so `.delete()` from Finanzas silently
-- affected 0 rows (no error, no deletion) instead of failing loudly.

CREATE POLICY "Admins and owners can delete memberships"
  ON memberships FOR DELETE TO authenticated
  USING (
    member_id IN (
      SELECT id FROM members WHERE establishment_id = get_my_establishment_id()
    )
    AND get_my_role() IN ('owner', 'admin')
  );
