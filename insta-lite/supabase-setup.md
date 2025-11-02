# Supabase Setup Instructions

## 1. Get Your Supabase Credentials

1. Go to your Supabase project: https://supabase.com/dashboard/project/pvwnsrxtdztjjmltlbke
2. Navigate to **Settings** → **API**
3. Copy your:
   - **Project URL** (looks like: `https://pvwnsrxtdztjjmltlbke.supabase.co`)
   - **anon/public key** (the `anon` key from the API keys section)

## 1.5. Disable Email Confirmation (IMPORTANT!)

For development, you should disable email confirmation:
1. Go to **Authentication** → **Settings** in your Supabase dashboard
2. Scroll to **Email Auth** section
3. **Disable** the "Confirm email" toggle
4. Save changes

This allows users to sign in immediately after signup without email verification.

## 2. Set Up Environment Variables

Create a `.env.local` file in the `insta-lite` directory with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://pvwnsrxtdztjjmltlbke.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

Replace `your_anon_key_here` with your actual anon key from step 1.

## 3. Create the Profiles Table

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the following SQL to create the `profiles` table:

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  handle TEXT NOT NULL UNIQUE,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read all profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Create policy to allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create policy to allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create a function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, handle, avatar)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE('@' || (NEW.raw_user_meta_data->>'handle'), '@' || split_part(NEW.email, '@', 1)),
    'https://picsum.photos/seed/' || COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)) || '/80'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 4. (Optional) Create Posts Table for Persistence

If you want to store posts in the database, run this SQL:

```sql
-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow everyone to read posts
CREATE POLICY "Posts are viewable by everyone"
  ON posts FOR SELECT
  USING (true);

-- Create policy to allow users to insert their own posts
CREATE POLICY "Users can insert their own posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own posts
CREATE POLICY "Users can update their own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own posts
CREATE POLICY "Users can delete their own posts"
  ON posts FOR DELETE
  USING (auth.uid() = user_id);
```

## 5. Restart Your Dev Server

After setting up the environment variables, restart your Next.js dev server:

```bash
npm run dev
```

## Troubleshooting

- **"Missing Supabase environment variables"**: Make sure `.env.local` exists and has the correct values
- **"relation 'profiles' does not exist"**: Make sure you've run the SQL to create the profiles table
- **Authentication errors**: Check that your Supabase project is active and your API keys are correct

