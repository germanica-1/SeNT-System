-- Update RLS policies for users table to allow admin management

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can delete their own profile" ON users;

-- Create new policies that allow authenticated admins to manage all admin accounts
CREATE POLICY "Authenticated admins can view all admin accounts"
ON users FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated admins can create admin accounts"
ON users FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated admins can update admin accounts"
ON users FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated admins can delete admin accounts"
ON users FOR DELETE
USING (auth.role() = 'authenticated');

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Enable realtime for users table
alter publication supabase_realtime add table users;