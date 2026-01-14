# 🚀 Deploy Fragments to Vercel

## Overview
Deploy the web version of your React Native/Expo Fragments app to Vercel for easy sharing and demonstration.

## Prerequisites
- ✅ GitHub repository (already done: https://github.com/elpresidentey/fragments)
- ✅ Vercel account (sign up at https://vercel.com)
- ✅ Supabase project with environment variables

## Step 1: Prepare for Web Deployment

### 1.1 Install Vercel CLI (Optional)
```bash
npm install -g vercel
```

### 1.2 Verify Web Support
Your app already has web support configured in `app.config.js`:
```javascript
web: {
  bundler: "metro",
  output: "static",
  favicon: "./assets/images/favicon.png"
}
```

## Step 2: Deploy to Vercel

### Method A: GitHub Integration (Recommended)

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Click "New Project"

2. **Import from GitHub**
   - Select "Import Git Repository"
   - Choose your repository: `elpresidentey/fragments`
   - Click "Import"

3. **Configure Build Settings**
   ```
   Framework Preset: Other
   Build Command: npx expo export -p web
   Output Directory: dist
   Install Command: npm install
   ```

4. **Add Environment Variables**
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://fragments-[random].vercel.app`

### Method B: Vercel CLI

```bash
# Navigate to your project
cd fragments-test

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name: fragments
# - Directory: ./
# - Override settings? Yes
# - Build Command: npx expo export -p web
# - Output Directory: dist
```

## Step 3: Configure Environment Variables

After deployment, add your environment variables:

1. Go to your Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Add:
   ```
   EXPO_PUBLIC_SUPABASE_URL = your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY = your_supabase_anon_key
   ```
4. Redeploy to apply changes

## Step 4: Custom Domain (Optional)

1. Go to "Settings" → "Domains"
2. Add your custom domain
3. Configure DNS settings as instructed

## Expected Results

✅ **What Will Work:**
- User authentication (login/register)
- Profile viewing and editing
- Post creation, editing, deletion
- Comments system
- Real-time updates
- Responsive design
- Dark/light theme

⚠️ **Limitations on Web:**
- No native mobile features (camera, push notifications)
- Different UI experience (web vs mobile)
- Some React Native components may behave differently

## Troubleshooting

### Build Errors
If you encounter build errors:

1. **Metro bundler issues:**
   ```bash
   npx expo install --fix
   ```

2. **Web compatibility:**
   ```bash
   npx expo install react-native-web
   ```

3. **Clear cache:**
   ```bash
   npx expo start --clear
   ```

### Environment Variables Not Working
- Ensure variables start with `EXPO_PUBLIC_`
- Redeploy after adding variables
- Check Vercel function logs

## Alternative: Expo Web Hosting

If Vercel doesn't work well, consider:

1. **Expo Hosting:**
   ```bash
   npx expo build:web
   npx expo upload:web
   ```

2. **Netlify:**
   - Similar process to Vercel
   - Good Expo support

3. **GitHub Pages:**
   - Free hosting option
   - Requires static build

## Performance Optimization

For better web performance:

1. **Enable static export in app.config.js:**
   ```javascript
   web: {
     bundler: "metro",
     output: "static"
   }
   ```

2. **Optimize images:**
   - Use WebP format
   - Compress assets

3. **Enable caching:**
   - Configure Vercel headers
   - Use CDN for assets

## Monitoring

After deployment:
- Monitor Vercel analytics
- Check error logs in dashboard
- Test on different devices/browsers

---

## 🎯 Quick Deploy Commands

```bash
# 1. Build for web
npx expo export -p web

# 2. Deploy to Vercel
vercel --prod

# 3. Set environment variables in Vercel dashboard
# 4. Test your live app!
```

Your Fragments app will be accessible at your Vercel URL and work as a Progressive Web App (PWA)!