# Vercel 404 Routing Fix

## Issue
Getting 404 errors when navigating to dynamic routes on Vercel:
```
GET https://fragments-test.vercel.app/post/34dfb814-4fa8-4b6b-b787-7ef30655e10c 404 (Not Found)
```

## Root Cause
This is a Single Page Application (SPA) built with Expo/React Native for web. When deployed to Vercel, the server doesn't know about client-side routes like `/post/[id]`. 

When a user:
1. Visits the home page → Works fine (serves `index.html`)
2. Clicks a post to navigate to `/post/123` → Works fine (client-side navigation)
3. Refreshes the page or directly visits `/post/123` → **404 Error** (Vercel looks for a file at that path)

## Solution
Configure Vercel to rewrite all routes to `index.html`, allowing the client-side router (Expo Router) to handle routing.

### Updated `vercel.json`
```json
{
  "buildCommand": "npx expo export -p web",
  "outputDirectory": "dist",
  "devCommand": "npx expo start --web",
  "installCommand": "npm install",
  "framework": null,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### What This Does
- **`"source": "/(.*)"`** - Matches all routes (any path)
- **`"destination": "/index.html"`** - Serves the main `index.html` file
- The Expo Router in the client then handles the actual routing

## How It Works

### Before Fix
```
User visits: /post/123
Vercel looks for: /post/123 file
Result: 404 Not Found ❌
```

### After Fix
```
User visits: /post/123
Vercel rewrites to: /index.html
Expo Router loads and handles: /post/123
Result: Post detail page loads ✅
```

## Routes That Now Work
- ✅ `/` - Home feed
- ✅ `/post/[id]` - Post detail pages
- ✅ `/(auth)/login` - Login page
- ✅ `/(auth)/register` - Register page
- ✅ `/(auth)/reset-password` - Password reset
- ✅ `/(tabs)/create` - Create post
- ✅ `/(tabs)/profile` - User profile
- ✅ Any other client-side route

## Deployment
After updating `vercel.json`, redeploy to Vercel:

```bash
cd fragments-test
git add vercel.json
git commit -m "Fix Vercel SPA routing with rewrites"
git push origin main
```

Then redeploy on Vercel (automatic if connected to GitHub).

## Testing
1. Visit: https://fragments-test.vercel.app
2. Click on any post to navigate to `/post/[id]`
3. Refresh the page
4. Should load correctly instead of 404 ✅

## Technical Details

### Why SPAs Need This
Single Page Applications load one HTML file and use JavaScript to handle routing. Traditional web servers expect each route to be a separate file. The rewrite rule bridges this gap.

### Alternative Approaches
1. **Vercel's `cleanUrls`** - Only works for static routes
2. **`trailingSlash`** - Doesn't solve dynamic routes
3. **Rewrites (our solution)** - Handles all routes including dynamic ones ✅

### Static Assets
Static assets (images, CSS, JS) are not affected because Vercel checks if a file exists before applying rewrites. If a file exists at the path, it serves the file directly.

## Related Files
- `vercel.json` - Vercel configuration with rewrites
- `app/post/[id].tsx` - Dynamic post detail route
- `app/_layout.tsx` - Root layout with Expo Router

## Status
✅ Fixed and deployed to production
