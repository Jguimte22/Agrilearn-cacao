# AgriLearn Cacao - Render Deployment Guide

## Step-by-Step Tutorial for Deploying to Render

### Prerequisites
1. ✅ Your project is already pushed to GitHub
2. GitHub account with your repository
3. Render account (free tier available)

---

## STEP 1: Set Up MongoDB Atlas (Cloud Database)

Since Render doesn't include built-in database, you'll use MongoDB Atlas (free tier available).

### 1.1 Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for a free account
3. Create a new project

### 1.2 Create a Cluster
1. Click "Create Deployment"
2. Choose **FREE M0 Cluster**
3. Select AWS, choose your region (closest to you or where users are)
4. Name your cluster (e.g., "agrilearn-cacao")
5. Click "Create Deployment"

### 1.3 Create Database User
1. In Atlas, go to "Security" → "Database Access"
2. Click "Add New Database User"
3. Choose "Autogenerate Secure Password"
4. Copy the username and password somewhere safe
5. Click "Add User"

### 1.4 Configure IP Whitelist
1. Go to "Security" → "Network Access"
2. Click "Add IP Address"
3. Select "Allow access from anywhere" (for development)
4. Click "Confirm"

### 1.5 Get Connection String
1. Go to "Databases" → Click your cluster → "Connect"
2. Choose "Drivers" → "Node.js"
3. Copy the connection string
4. Replace `<username>` and `<password>` with your credentials
5. This is your **MONGODB_URI**

Example format:
```
mongodb+srv://username:password@cluster-name.mongodb.net/database-name?retryWrites=true&w=majority
```

---

## STEP 2: Create Environment Variables Document

Keep this file safe! You'll use these values in Render.

Create a file called `.env.render` with all your variables:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@your-cluster.mongodb.net/agrilearn?retryWrites=true&w=majority

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-12345abcdefg

# Email Configuration (for notifications/verification)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password  # Use Gmail App Password, not regular password

# SMS Configuration (Twilio - optional, for SMS notifications)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Frontend URL (you'll get this after Render deployment)
FRONTEND_URL=https://your-frontend-url.onrender.com

# API Port
PORT=10000

# Environment
NODE_ENV=production
```

**To get these values:**
- **JWT_SECRET**: Generate at https://www.random.org/strings/ or use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- **EMAIL_PASSWORD**: If using Gmail, create an "App Password" in Google Account settings
- **TWILIO**: Get from https://www.twilio.com/console (optional)

---

## STEP 3: Push Configuration to GitHub

Commit your `render.yaml` file:

```powershell
cd "c:\AGRILEARN\AgriLearnCacao-main (1)\AgriLearnCacao-main"
git add render.yaml
git commit -m "Add Render deployment configuration"
git push origin main
```

---

## STEP 4: Create Account on Render

1. Go to https://render.com
2. Click "Sign up"
3. Sign up with GitHub (recommended - easier authorization)
4. Authorize Render to access your GitHub account

---

## STEP 5: Deploy Backend to Render

### 5.1 Create Backend Service
1. Log in to Render Dashboard: https://dashboard.render.com
2. Click "New Web Service"
3. Select "Build and deploy from a Git repository"
4. Authorize GitHub if needed
5. Search and select your `AgriLearnCacao` repository
6. Click "Connect"

### 5.2 Configure Backend Service
- **Name**: `agrilearn-cacao-api`
- **Environment**: `Node`
- **Region**: Choose closest to you
- **Branch**: `main`
- **Build Command**: `cd server && npm install`
- **Start Command**: `cd server && npm start`
- **Plan**: Select Free (with limitations)

### 5.3 Add Environment Variables
1. Scroll to "Environment" section
2. Add each variable from your `.env.render` file:
   - Click "Add Environment Variable"
   - Key: `MONGODB_URI`, Value: your-mongodb-connection-string
   - Key: `JWT_SECRET`, Value: your-jwt-secret
   - Key: `EMAIL_SERVICE`, Value: `gmail`
   - Key: `EMAIL_USER`, Value: your-email
   - Key: `EMAIL_PASSWORD`, Value: your-app-password
   - Key: `TWILIO_ACCOUNT_SID`, Value: your-sid
   - Key: `TWILIO_AUTH_TOKEN`, Value: your-token
   - Key: `TWILIO_PHONE_NUMBER`, Value: your-number
   - Key: `PORT`, Value: `10000`
   - Key: `NODE_ENV`, Value: `production`

3. Click "Deploy Web Service"

### 5.4 Wait for Deployment
- Render will build and deploy your backend
- You'll see a URL like: `https://agrilearn-cacao-api.onrender.com`
- Copy this URL - you'll need it for the frontend!

---

## STEP 6: Deploy Frontend to Render

### 6.1 Create Frontend Service
1. Go back to Render Dashboard
2. Click "New Web Service"
3. Select your repository again
4. Click "Connect"

### 6.2 Configure Frontend Service
- **Name**: `agrilearn-cacao-frontend`
- **Environment**: `Node`
- **Region**: Same as backend
- **Branch**: `main`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run preview`
- **Plan**: Free

### 6.3 Add Frontend Environment Variables
1. Click "Add Environment Variable"
   - Key: `VITE_API_URL`, Value: `https://agrilearn-cacao-api.onrender.com` (your backend URL from Step 5.4)
   - Key: `NODE_ENV`, Value: `production`

2. Click "Deploy Web Service"

### 6.4 Wait for Deployment
- Render will build and deploy your frontend
- You'll get a URL like: `https://agrilearn-cacao-frontend.onrender.com`
- This is your live website!

---

## STEP 7: Update Backend with Frontend URL

Now that you have your frontend URL, update the backend:

1. Go back to your **Backend Service** on Render
2. Click "Environment"
3. Add new variable:
   - Key: `FRONTEND_URL`, Value: `https://agrilearn-cacao-frontend.onrender.com`
4. Click "Save"
5. Your backend will automatically redeploy

---

## STEP 8: Test Your Deployment

1. Open your frontend URL in browser: `https://agrilearn-cacao-frontend.onrender.com`
2. Try signing up, logging in
3. Check if backend API calls work
4. Test email verification

---

## Troubleshooting

### Backend won't start
- Check "Logs" tab in Render dashboard
- Common issues:
  - Missing environment variables
  - MongoDB connection string incorrect
  - Port already in use

### Frontend shows "Cannot connect to API"
- Ensure `VITE_API_URL` environment variable is set correctly
- Check browser console (F12) for error messages
- Verify backend service is running

### Emails not sending
- Check email credentials
- If using Gmail, ensure you created an "App Password"
- Check backend logs for SMTP errors

### Database connection failed
- Verify MongoDB Atlas IP whitelist allows "Anywhere"
- Check connection string has correct username/password
- Test connection locally first

---

## Important Notes

⚠️ **Free Tier Limitations on Render:**
- Services spin down after 15 minutes of inactivity (first request takes 30 seconds)
- Limited compute resources
- For production, upgrade to paid plan

⚠️ **Keep Secrets Safe:**
- Never commit `.env` files to GitHub
- Regenerate JWT_SECRET and passwords after deployment
- Rotate API keys regularly

---

## Next Steps (Optional Improvements)

1. Add custom domain
2. Set up SSL certificate (automatic on Render)
3. Configure continuous deployment
4. Set up monitoring and alerts
5. Optimize database indexes for better performance

---

**Need Help?**
- Render Documentation: https://render.com/docs
- MongoDB Atlas Help: https://docs.mongodb.com/cloud
- Contact support through Render dashboard

Good luck! 🚀
