# Comments Functionality Setup Instructions

## Database Setup

To enable comments functionality, you need to add the comments table to your Supabase database.

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `mxrljbfxcgzmkmtdedoi`
3. Navigate to **SQL Editor** in the left sidebar
4. Create a new query and copy-paste the contents of `supabase/add-comments-table.sql`
5. Click **Run** to execute the query

### Option 2: Using Supabase CLI (if you have it installed)

```bash
supabase db push
```

## What Gets Created

The migration will create:

- **comments table** with proper relationships to posts and users
- **Indexes** for optimal query performance
- **Row Level Security (RLS) policies** for secure access
- **Real-time subscriptions** for live comment updates

## Features Enabled

Once the database is set up, users will be able to:

✅ **View Comments**: Click on any post to see its comments
✅ **Add Comments**: Write new comments on posts
✅ **Edit Comments**: Long-press your own comments to edit them
✅ **Delete Comments**: Long-press your own comments to delete them
✅ **Real-time Updates**: See new comments appear instantly
✅ **Proper Security**: Users can only edit/delete their own comments

## Testing the Feature

1. Run the database migration above
2. Start your development server: `npm start`
3. Navigate to any post in the app
4. Click on the post to open the detail view
5. Try adding, editing, and deleting comments

## File Structure

The comments functionality includes:

```
fragments-test/
├── app/post/[id].tsx           # Post detail screen with comments
├── lib/services/comment.ts     # Comment service for API calls
├── types/index.ts              # Comment type definitions
└── supabase/
    └── add-comments-table.sql  # Database migration
```

## Troubleshooting

If you encounter issues:

1. **Comments not loading**: Check that the migration ran successfully
2. **Permission errors**: Verify RLS policies were created correctly
3. **Real-time not working**: Ensure the comments table is added to the realtime publication

For any issues, check the browser console or React Native logs for detailed error messages.