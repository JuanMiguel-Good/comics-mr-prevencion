/*
  # Fix WhatsApp storage without policy conflicts

  1. Changes
    - Add documentation for WhatsApp storage in user metadata
    - No policy changes to avoid conflicts
  
  2. Notes
    - WhatsApp is stored in auth.users.user_metadata
    - This migration just documents the change
    - No actual schema changes needed
*/

-- WhatsApp data is stored in auth.users.user_metadata as:
-- {
--   "whatsapp": "+57123456789",
--   "first_name": "Juan",
--   "last_name": "Miguel", 
--   "full_name": "Juan Miguel"
-- }

-- This is a documentation-only migration
-- The WhatsApp storage is handled by the application code
SELECT 1; -- No-op query to make migration valid