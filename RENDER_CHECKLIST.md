# Render Deployment Checklist

## Before You Start
- [ ] Project pushed to GitHub
- [ ] GitHub account ready
- [ ] Render account created (https://render.com)

---

## Phase 1: Database Setup (MongoDB Atlas)
- [ ] Create MongoDB Atlas account
- [ ] Create free M0 cluster
- [ ] Create database user with password
- [ ] Add IP whitelist (Allow from anywhere)
- [ ] Copy connection string (MONGODB_URI)

**Save these credentials:**
```
MongoDB Connection String: ____________________________
```

---

## Phase 2: Prepare Environment Variables
- [ ] Generate JWT_SECRET
- [ ] Gmail App Password created (EMAIL_PASSWORD)
- [ ] Optional: Twilio credentials

**Credentials to save:**
```
JWT_SECRET: ____________________________
EMAIL_USER: ____________________________
EMAIL_PASSWORD: ____________________________
TWILIO_ACCOUNT_SID: ____________________________
TWILIO_AUTH_TOKEN: ____________________________
TWILIO_PHONE_NUMBER: ____________________________
```

---

## Phase 3: Push to GitHub
- [ ] Commit and push render.yaml
- [ ] Commit and push this guide

```powershell
git add render.yaml RENDER_DEPLOYMENT_GUIDE.md
git commit -m "Add Render deployment files"
git push origin main
```

---

## Phase 4: Deploy Backend
- [ ] Go to Render Dashboard
- [ ] Create new Web Service
- [ ] Select your GitHub repository
- [ ] Set Name: `agrilearn-cacao-api`
- [ ] Build Command: `cd server && npm install`
- [ ] Start Command: `cd server && npm start`
- [ ] Add all environment variables from Phase 2
- [ ] Deploy and wait for success
- [ ] **Copy Backend URL**: _________________________________

---

## Phase 5: Deploy Frontend
- [ ] Create another Web Service for frontend
- [ ] Set Name: `agrilearn-cacao-frontend`
- [ ] Build Command: `npm install && npm run build`
- [ ] Start Command: `npm run preview`
- [ ] Add environment variables:
  - [ ] VITE_API_URL: `https://agrilearn-cacao-api.onrender.com` (your backend URL)
  - [ ] NODE_ENV: `production`
- [ ] Deploy and wait for success
- [ ] **Copy Frontend URL**: _________________________________

---

## Phase 6: Final Configuration
- [ ] Update Backend's FRONTEND_URL variable with your frontend URL
- [ ] Backend will redeploy automatically
- [ ] **Frontend is now live at**: _________________________________

---

## Phase 7: Testing
- [ ] Open frontend URL in browser
- [ ] Try to sign up
- [ ] Try to log in
- [ ] Verify email notification received
- [ ] Check browser console (F12) for errors
- [ ] Check Render logs for backend errors

---

## Deployment Complete! ✅

Your application is live and accessible!

**Frontend URL**: _________________________________
**Backend API URL**: _________________________________
**Dashboard**: https://dashboard.render.com

### What to do next:
1. Share your frontend URL with users
2. Monitor logs for any issues
3. Consider upgrading to paid plan if free tier limitations affect you
4. Set up custom domain (optional)
5. Enable SSL certificate (automatic)

---

## Troubleshooting Quick Links

- Backend Logs: https://dashboard.render.com → Select Service → Logs
- Frontend Logs: https://dashboard.render.com → Select Service → Logs
- Environment Variables: Service → Environment
- Redeploy: Service → Manual Deploy

---

**Questions?** Refer to RENDER_DEPLOYMENT_GUIDE.md for detailed instructions!
