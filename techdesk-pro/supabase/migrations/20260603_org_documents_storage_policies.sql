-- Storage policies for the organization-documents bucket.
--
-- app/portal/documents/page.js uploads to organization-documents with path
-- `<orgId>/<timestamp>-<filename>` via the browser client, but the bucket had
-- no storage.objects policies at all — every client upload failed with
-- "new row violates row-level security policy" (confirmed in live E2E
-- testing 2026-06-03). Admin signed-URL reads (app/admin/document/page.js)
-- also had no covering policy.
--
-- Mirrors the existing document-jobs / ticket-attachments policy style but
-- scopes clients to their own org folder via get_user_org_id().

drop policy if exists clients_upload_org_documents on storage.objects;
create policy clients_upload_org_documents
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'organization-documents'
  and (storage.foldername(name))[1] = public.get_user_org_id()::text
);

drop policy if exists clients_read_org_documents on storage.objects;
create policy clients_read_org_documents
on storage.objects for select
to authenticated
using (
  bucket_id = 'organization-documents'
  and (storage.foldername(name))[1] = public.get_user_org_id()::text
);

drop policy if exists admins_manage_org_documents on storage.objects;
create policy admins_manage_org_documents
on storage.objects for all
to authenticated
using (bucket_id = 'organization-documents' and public.is_admin())
with check (bucket_id = 'organization-documents' and public.is_admin());
