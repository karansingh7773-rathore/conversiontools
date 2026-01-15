# Vercel Deployment Guide

## Quick Deploy (Recommended)

### Option 1: Deploy via Vercel Dashboard (Easiest)

1. **Push your code to GitHub**:
   ```powershell
   cd "d:\campushub (2)"
   git init
   git add .
   git commit -m "Initial commit - CampusHub frontend"
   git branch -M main
   # Create a new repo on GitHub first, then:
   git remote add origin https://github.com/YOUR_USERNAME/campushub-frontend.git
   git push -u origin main
   ```

2. **Deploy on Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vite
   - Click "Deploy"

That's it! Vercel will build and deploy automatically.

---

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```powershell
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```powershell
   vercel login
   ```

3. **Deploy**:
   ```powershell
   cd "d:\campushub (2)"
   vercel
   ```

4. **Follow prompts**:
   - Set up and deploy? **Yes**
   - Which scope? **Your account**
   - Link to existing project? **No**
   - Project name? **campushub** (or any name)
   - Directory? **./** (current directory)
   - Override settings? **No**

5. **Deploy to production**:
   ```powershell
   vercel --prod
   ```

---

## What's Already Configured

✅ **vercel.json**: Vite configuration with SPA routing
✅ **.env.production**: Backend API URL set to your HF Space
✅ **api.ts**: Automatically uses production URL when deployed
✅ **Backend CORS**: Already allows cross-origin requests

---

## Testing After Deployment

Once deployed, Vercel will give you a URL like:
`https://campushub-abc123.vercel.app`

Test it:
1. Open the URL in your browser
2. Try uploading a file
3. Check browser console for any errors
4. Verify API calls go to HF backend

---

## Environment Variables (Optional)

If you need to change the backend URL later:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add: `VITE_API_URL` = `https://your-backend-url.hf.space`
3. Redeploy

---

## Automatic Deployments

Once connected to GitHub:
- Every push to `main` branch = Production deployment
- Every pull request = Preview deployment
- Instant rollback available

---

## Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

---

## Troubleshooting

### CORS Errors
- Your backend already has CORS enabled for all origins
- If issues persist, check browser console

### API Not Connecting
- Verify HF backend is running: `https://karansinghrathore820-myvirtualmachine.hf.space/health`
- Check `.env.production` has correct URL
- Check browser Network tab for failed requests

### Build Fails
- Run `npm run build` locally first to catch errors
- Check Vercel build logs
- Ensure all dependencies are in `package.json`

---

## Cost

**Free tier includes**:
- 100 GB bandwidth/month
- Unlimited deployments
- HTTPS/SSL automatic
- Global CDN

Perfect for your use case!
