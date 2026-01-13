# Supabase Database Setup

This directory contains the database schema and setup files for the Fragments mobile app.

## Setup Instructions

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Run the database setup script**:
   - Go to your Supabase dashboard
   - Navigate to the SQL Editor
   - Copy and paste the contents of `setup-database.sql`
   - Click "Run" to execute the script

3. **Configure environment variables**:
   - Copy your Supabase URL and anon key from the project settings
   - Add them to your `.env.local` file:
     ```
     EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
     EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. **Enable Real-time** (if not already enabled):
   - Go to Database > Replication in your Supabase dashboard
   - Enable replication for the `posts` table

## Database Schema

### Users Table
- `id`: UUID (Primary Key)
- `email`: Text (Unique, Not Null)
- `name`: Text (Not Null)
- `avatar_url`: Text (Optional)
- `created_at`: Timestamp with Time Zone
- `updated_at`: Timestamp with Time Zone

### Posts Table
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key to users.id)
- `content`: Text (Not Null)
- `image_url`: Text (Optional)
- `created_at`: Timestamp with Time Zone
- `updated_at`: Timestamp with Time Zone

## Security Policies

The database uses Row Level Security (RLS) with the following policies:

### Users Table
- Users can only view their own profile
- Users can update their own profile
- Users can create their own profile (during registration)

### Posts Table
- All authenticated users can view posts
- Users can only create posts as themselves
- Users can update their own posts
- Users can delete their own posts

## Real-time Subscriptions

The `posts` table is configured for real-time subscriptions, allowing the app to receive live updates when new posts are created or existing posts are modified.

## Automatic User Profile Creation

A database trigger automatically creates a user profile in the `users` table when a new user signs up through Supabase Auth. The profile uses the email and extracts a default name from the email address.

## Password Reset Configuration

The app includes comprehensive password reset functionality with the following features:

### 🔧 Configuration Files
- `password-reset-config.sql` - Database functions, tables, and security configuration
- `password-reset-setup-guide.md` - Detailed setup instructions for Supabase Dashboard
- `PASSWORD_RESET_README.md` - Complete documentation and overview

### 🚀 Quick Setup
1. Run `password-reset-config.sql` in Supabase SQL Editor
2. Configure email templates in Authentication > Email Templates
3. Set up rate limiting and security settings
4. Test with `scripts/validate-password-reset-setup.js`

### ✅ Features
- **Custom email templates** with security notices
- **1-hour token expiration** for security
- **Rate limiting** (3 attempts per 15 minutes)
- **Security monitoring** and suspicious activity detection
- **Session invalidation** on password reset
- **Comprehensive error handling**

### 📊 Database Components
- `password_reset_attempts` table for rate limiting
- `password_reset_security_events` table for monitoring
- Security functions for validation and logging
- Automatic cleanup and maintenance

For detailed setup instructions, see `password-reset-setup-guide.md`.