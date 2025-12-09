# 🚀 Vercel Deployment Guide for AgriLearn Cacao

## Overview

Vercel is perfect for deploying your React frontend. For a full-stack app, we have two options:

### Option A: Frontend on Vercel + Backend on Render (Recommended)
- ✅ Vercel handles React frontend beautifully
- ✅ Render handles Node.js backend
- ✅ Best performance and reliability

### Option B: Frontend on Vercel + Backend on Vercel (Serverless)
- ✅ Everything in one platform
- ⚠️ Serverless functions have limitations
- ⚠️ May incur costs

**I recommend Option A.** Let me guide you through both.

---

## 📋 Prerequisites

- ✅ GitHub repository (you already have this!)
- ✅ Vercel account (free)
- ✅ Render account (free) - for backend

---

## ✅ OPTION A: Vercel Frontend + Render Backend (RECOMMENDED)

### Step 1: Prepare Frontend for Vercel

Your frontend is already ready! Just verify the API URL configuration.

Check your frontend API configuration:

**Location**: `src/services/api.js`

Make sure it has:
```javascript
const API_URL = process.env.VITE_API_URL || 'http://localhost:5000';
```

### Step 2: Deploy Backend to Render First

**Do this first before deploying frontend!**

1. Go to: https://dashboard.render.com
2. Create a new Web Service
3. Connect your GitHub repository
4. Configure:
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
   - **Environment Variables**: (see Render deployment guide)
5. Deploy and get your backend URL

**Save your backend URL**: `https://your-backend.onrender.com`

### Step 3: Deploy Frontend to Vercel

#### 3.1 Connect GitHub to Vercel

1. Go to: https://vercel.com
2. Click **"Sign up"** or **"Login"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access GitHub
5. Click **"Import Project"**
6. Find your `Agrilearn-cacao` repository
7. Click **"Import"**

#### 3.2 Configure Project Settings

Vercel will auto-detect your project. Configure:

**Project Settings:**
- **Framework**: React
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

#### 3.3 Add Environment Variables

In Vercel:
1. Go to **"Settings"** → **"Environment Variables"**
2. Add this variable:

```
VITE_API_URL = https://your-backend.onrender.com
```

Replace `your-backend.onrender.com` with your actual Render backend URL.

#### 3.4 Deploy

1. Click **"Deploy"**
2. Wait 2-5 minutes for deployment
3. You'll get a URL like: `https://agrilearn-cacao.vercel.app`

---

## 🔄 OPTION B: Everything on Vercel (Advanced)

If you want everything on Vercel, convert your backend to serverless functions.

### Create Vercel Configuration

Create `vercel.json` in your project root:

```json
{
  "buildCommand": "npm install && npm run build",
  "outputDirectory": "dist",
  "env": {
    "MONGODB_URI": "@mongodb_uri",
    "JWT_SECRET": "@jwt_secret",
    "EMAIL_SERVICE": "@email_service",
    "EMAIL_USERNAME": "@email_username",
    "EMAIL_PASSWORD": "@email_password",
    "NODE_ENV": "production"
  },
  "functions": {
    "api/**/*.js": {
      "runtime": "nodejs18.x"
    }
  }
}
```

### Restructure Backend for Serverless

Move your Express server files to `/api` folder:

```
api/
├── index.js           (your server.js)
├── routes/
├── models/
├── middleware/
└── services/
```

Then update `api/index.js` to export a handler.

**Note**: This is complex. I recommend Option A instead.

---

## ✅ OPTION A Complete Setup (Quick Steps)

1. **Backend First**:
   - Deploy to Render (use existing Render deployment guide)
   - Get backend URL

2. **Frontend**:
   - Go to vercel.com
   - Click "Import Project"
   - Select your GitHub repo
   - Add environment variable: `VITE_API_URL=your-backend-url`
   - Click "Deploy"

**Time**: ~15 minutes total

---

## 🔗 Update Your Frontend API

Make sure your frontend connects to your backend URL.

**Check file**: `src/services/api.js`

Should contain:
```javascript
import axios from 'axios';

const API_URL = process.env.VITE_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

---

## 📊 Deployment Architecture

### Option A (Recommended):
```
User Browser
    ↓
Vercel CDN (Frontend)
  agrilearn-cacao.vercel.app
    ↓ (API calls)
Render (Backend)
  your-backend.onrender.com
    ↓
MongoDB Atlas (Database)
```

### Option B (Vercel Only):
```
User Browser
    ↓
Vercel (Frontend + Backend)
  agrilearn-cacao.vercel.app
    ↓
MongoDB Atlas (Database)
```

---

## 🚀 Deployment Steps Summary

### For Option A (Recommended):

**Backend (Render)**:
1. Go to Render dashboard
2. New Web Service
3. Connect repo
4. Configure and deploy
5. Save backend URL

**Frontend (Vercel)**:
1. Go to Vercel.com
2. Import your GitHub repo
3. Add env variable with backend URL
4. Deploy
5. Get frontend URL

**Total time**: ~20 minutes

---

## 🔄 After Deployment

### Update Your .env File

Once deployed, update your local `.env` to test:

```env
VITE_API_URL=https://your-backend.onrender.com
MONGODB_URI=your-mongodb-uri
JWT_SECRET=your-secret
```

### Test Your Deployment

1. Visit your Vercel URL
2. Try signing up
3. Check email verification
4. Try logging in
5. Load courses and quizzes

---

## 🆘 Troubleshooting

### "Cannot connect to API"
- Check VITE_API_URL is correct in Vercel environment
- Verify backend is running on Render
- Check browser console (F12) for errors

### "CORS error"
- Make sure backend has CORS enabled
- Check backend FRONTEND_URL matches Vercel URL

### "Build failed on Vercel"
- Check build logs in Vercel dashboard
- Make sure `npm run build` works locally
- Verify all dependencies are in package.json

### "Blank page on Vercel"
- Check Network tab in browser DevTools (F12)
- Check if API calls are working
- Review Vercel logs

---

## ✅ Vercel Benefits

- ✅ Free tier available
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Serverless functions
- ✅ Easy GitHub integration
- ✅ One-click rollbacks
- ✅ Preview deployments
- ✅ Analytics included

---

## 📱 Custom Domain (Optional)

After deployment on Vercel:

1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS settings (instructions provided)
4. Wait for DNS propagation (5-30 minutes)

---

## 🎯 Next Steps

**Choose your option:**

### Option A (Recommended):
1. Follow the Render deployment guide (you already have it)
2. Get your backend URL
3. Follow this Vercel guide to deploy frontend
4. Add backend URL as environment variable

### Option B:
Contact me if you want detailed serverless setup (more complex)

---

## 📞 Support

- **Vercel Docs**: https://vercel.com/docs
- **Vite Docs**: https://vitejs.dev
- **React Docs**: https://react.dev

---

**Ready to deploy?** 🚀

Start with your Render backend, then deploy frontend to Vercel!
