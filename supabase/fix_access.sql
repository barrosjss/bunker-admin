-- Fix access by looking up the user ID automatically based on email
-- Run this in your Supabase SQL Editor

DO $$
DECLARE
  target_user_id UUID;
  target_email TEXT := 'jesus.reinaldo.barros@gmail.com';
BEGIN
  -- Look up the user ID from auth.users
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_email;

  -- If user doesn't exist, raise an error
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found in auth.users table. Please check the email address.', target_email;
  END IF;

  -- Insert into staff table
  INSERT INTO staff (user_id, email, name, role)
  VALUES (
    target_user_id,
    target_email,
    'Jesus Barros', 
    'admin'
  );
  
  RAISE NOTICE 'Successfully added staff member for user %', target_email;
END $$;
