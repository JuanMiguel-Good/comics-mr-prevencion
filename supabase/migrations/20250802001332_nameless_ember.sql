/*
  # Add WhatsApp field to users table

  1. New Fields
    - Add `whatsapp` field to users table via user metadata
    - Store WhatsApp number for user contact information

  2. Notes
    - WhatsApp will be stored in user_metadata since we're using Supabase Auth
    - No direct table changes needed as we use auth.users metadata
*/

-- This migration documents that WhatsApp is stored in auth.users.raw_user_meta_data
-- No actual schema changes needed as we use Supabase's built-in user metadata system

-- Example of metadata structure:
-- {
--   "first_name": "Juan",
--   "last_name": "Pérez", 
--   "full_name": "Juan Pérez",
--   "whatsapp": "+573001234567",
--   "role": "user"
-- }