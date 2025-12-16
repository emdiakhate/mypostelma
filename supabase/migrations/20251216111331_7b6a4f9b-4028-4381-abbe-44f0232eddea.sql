-- Add email metadata fields to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS email_subject TEXT,
ADD COLUMN IF NOT EXISTS email_to TEXT,
ADD COLUMN IF NOT EXISTS email_cc TEXT,
ADD COLUMN IF NOT EXISTS email_from TEXT;