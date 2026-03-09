# Supabase Storage Bucket Setup for Company Branding

## Required Storage Bucket

The Business Settings feature requires a Supabase Storage bucket named `company-branding` to store business logo uploads.

## Setup Instructions

1. **Go to Supabase Dashboard**

   - Navigate to: `https://supabase.com/dashboard/project/<your-supabase-project-id>/storage/buckets`

2. **Create New Bucket**

   - Click "New bucket"
   - Bucket name: `company-branding`
   - Make bucket public: **Yes** (required for public logo access on invoices)
   - File size limit: 2MB (recommended)
   - Allowed MIME types: `image/png`, `image/jpeg`, `image/webp`, `image/svg+xml`

3. **Set Bucket Policies**

If you are uploading logos through the API service-role path, public read is usually the only requirement. If you still want direct bucket policies, adapt them to the current bucket/folder structure:

```sql
-- Allow authenticated users to upload their own logos
CREATE POLICY "Users can upload their own logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-branding'
  AND (storage.foldername(name))[1] = 'companies'
);

-- Allow authenticated users to update their own logos
CREATE POLICY "Users can update their own logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'company-branding'
  AND (storage.foldername(name))[1] = 'companies'
);

-- Allow public read access to all logos
CREATE POLICY "Public read access to logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'company-branding');
```

## File Structure

Uploaded logos are stored with the following structure:

```
company-branding/
  └── companies/
      └── {profile_id}/logo
```

## Usage in Application

The settings page (`/settings`) allows users to:

- Upload a business logo (PNG, JPG, SVG)
- Preview the logo before saving
- Update/replace existing logo
- Logo URL is saved to `profiles.logo_url` field

## Troubleshooting

**Upload fails with "bucket not found":**

- Verify the bucket name is exactly `company-branding`
- Check bucket exists in Supabase Dashboard

**Upload fails with "permission denied":**

- Ensure user is authenticated
- Verify bucket policies are created
- Check bucket is set to public

**Logo doesn't display:**

- Verify bucket is public
- Check logo URL is saved correctly in profiles table
- Ensure public read policy is enabled
