# 🚀 RENDER DEPLOYMENT - COMPLETE STEP-BY-STEP TUTORIAL

**I've created everything you need! Follow these steps exactly in order.**

---

## 📋 QUICK SUMMARY

Your project has:
- Frontend (React + Vite) in `/src`
- Backend (Express.js) in `/server`
- Database (MongoDB)

We'll deploy all three to Render!

---

## ⚡ STEP 0: Link GitHub Repository

First, connect your local Git to your GitHub repository.

### Command (Replace with YOUR values):
```powershell
cd "c:\AGRILEARN\AgriLearnCacao-main (1)\AgriLearnCacao-main"

# Replace YOUR_USERNAME and YOUR_REPO_NAME
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

**Example:**
```powershell
git remote add origin https://github.com/john-doe/AgriLearnCacao.git
git branch -M main
git push -u origin main
```

**When prompted for credentials:**
- Use your GitHub Personal Access Token (not password)
- Get it from: https://github.com/settings/tokens

### Verify it worked:
```powershell
git remote -v
```

Should show:
```
origin  https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git (fetch)
origin  https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git (push)
```

---

## 🌐 STEP 1: Set Up MongoDB Atlas Database

Your app needs a database in the cloud.

### 1.1 Create MongoDB Account
1. Go to: https://www.mongodb.com/cloud/atlas
2. Click **"Sign up for free"**
3. Create an account (use email or Google)

### 1.2 Create a Cluster
1. After login, click **"+ Create"** or **"Create Deployment"**
2. Choose **"M0"** (FREE tier) ✅
3. Select **AWS** as cloud provider
4. Choose region closest to you (e.g., us-east-1 for US)
5. Cluster name: `AgriLearnCacao` (or whatever you want)
6. Click **"Create Deployment"**
7. Wait 5-10 minutes for cluster to be ready ☕

### 1.3 Create Database User
1. In MongoDB Atlas, go to: **Security** → **Database Access**
2. Click **"Add New Database User"**
3. Choose **"Autogenerate Secure Password"** ✅
4. **COPY AND SAVE** the username and password somewhere safe!
5. Click **"Add User"**

**Save this:**
```
Username: ________________
Password: ________________
```

### 1.4 Allow Access From Anywhere
1. Go to: **Security** → **Network Access**
2. Click **"Add IP Address"**
3. Click **"Allow access from anywhere"** (select 0.0.0.0/0)
4. Click **"Confirm"**

### 1.5 Get Your Database Connection String
1. Go to: **Databases** (main view)
2. Find your cluster → Click **"Connect"**
3. Choose **"Drivers"** → **"Node.js"**
4. Copy the connection string
5. Replace `<username>` and `<password>` with values from Step 1.3

**Example connection string:**
```
mongodb+srv://john:MyPassword123@agrilearncacao.mongodb.net/?retryWrites=true&w=majority
```

**After replacing credentials:**
```
mongodb+srv://john:MyPassword123@agrilearncacao.mongodb.net/agrilearn?retryWrites=true&w=majority
```

**Save this:**
```
MONGODB_URI: ____________________________________________________________
```

---

## 🔐 STEP 2: Generate Secret Keys & Passwords

### 2.1 Generate JWT Secret
Run this in PowerShell:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

You'll get something like: `a7b2c9d4e1f8g3h5i2j6k1l4m7n2o5p8q1r4s7t0u3v6w9x2y5z8a1b4c7d0e3f`

**Save this:**
```
JWT_SECRET: ____________________________________________________________
```

### 2.2 Get Gmail App Password (for email sending)

**Why?** Your app needs to send verification emails.

1. Go to: https://myaccount.google.com/security
2. Look for **"App passwords"** (bottom of page)
   - If you don't see it: Enable 2-Factor Authentication first
3. Select: **Mail** and **Windows Computer**
4. Google will give you a 16-character password
5. **Copy this password** (you won't see it again!)

**Save this:**
```
EMAIL_USER: your-email@gmail.com
EMAIL_PASSWORD: ________________
```

### 2.3 (Optional) Get Twilio Credentials - for SMS

If you want SMS notifications:
1. Go to: https://www.twilio.com/console
2. Copy your Account SID
3. Copy your Auth Token
4. Copy your phone number (get one free)

**Save this:**
```
TWILIO_ACCOUNT_SID: ________________
TWILIO_AUTH_TOKEN: ________________
TWILIO_PHONE_NUMBER: +1234567890
```

---

## 📝 STEP 3: Create Account on Render

### 3.1 Sign Up
1. Go to: https://render.com
2. Click **"Sign up"**
3. Choose **"GitHub"** (easiest!)
4. Authorize Render to access your GitHub

---

## 🔧 STEP 4: Deploy Backend API

### 4.1 Create Backend Service
1. Login to Render: https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Click **"Build and deploy from a Git repository"**
4. Authorize GitHub if prompted
5. **Search for your repository** name (e.g., "AgriLearnCacao")
6. Click **"Connect"**

### 4.2 Configure Backend

Fill in these fields:

| Field | Value |
|-------|-------|
| **Name** | `agrilearn-cacao-api` |
| **Environment** | `Node` |
| **Region** | Pick closest to you |
| **Branch** | `main` |
| **Build Command** | `cd server && npm install` |
| **Start Command** | `cd server && npm start` |
| **Plan** | `Free` |

### 4.3 Add Environment Variables

Click **"Add Environment Variable"** for each:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | (from Step 1.5) |
| `JWT_SECRET` | (from Step 2.1) |
| `EMAIL_SERVICE` | `gmail` |
| `EMAIL_USER` | (from Step 2.2) |
| `EMAIL_PASSWORD` | (from Step 2.2) |
| `TWILIO_ACCOUNT_SID` | (from Step 2.3, optional) |
| `TWILIO_AUTH_TOKEN` | (from Step 2.3, optional) |
| `TWILIO_PHONE_NUMBER` | (from Step 2.3, optional) |
| `NODE_ENV` | `production` |
| `PORT` | `10000` |

### 4.4 Deploy!
- Click **"Create Web Service"**
- Wait for deployment (2-5 minutes)
- You'll see a green checkmark when done ✅

### 4.5 Copy Your Backend URL
In Render dashboard, you'll see a URL like:
```
https://agrilearn-cacao-api.onrender.com
```

**Save this:**
```
BACKEND_URL: https://agrilearn-cacao-api.onrender.com
```

---

## 🎨 STEP 5: Deploy Frontend

### 5.1 Create Frontend Service
1. In Render Dashboard, click **"New +"** → **"Web Service"**
2. Select your repository again
3. Click **"Connect"**

### 5.2 Configure Frontend

| Field | Value |
|-------|-------|
| **Name** | `agrilearn-cacao-frontend` |
| **Environment** | `Node` |
| **Region** | Same as backend |
| **Branch** | `main` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run preview` |
| **Plan** | `Free` |

### 5.3 Add Environment Variables

| Key | Value |
|-----|-------|
| `VITE_API_URL` | (your backend URL from Step 4.5) |
| `NODE_ENV` | `production` |

**Example:**
```
VITE_API_URL = https://agrilearn-cacao-api.onrender.com
```

### 5.4 Deploy!
- Click **"Create Web Service"**
- Wait for deployment (3-5 minutes)

### 5.5 Copy Your Frontend URL
You'll see a URL like:
```
https://agrilearn-cacao-frontend.onrender.com
```

**Save this:**
```
FRONTEND_URL: https://agrilearn-cacao-frontend.onrender.com
```

---

## 🔄 STEP 6: Update Backend with Frontend URL

Now the backend knows where the frontend is (for CORS).

1. In Render Dashboard → Click **"agrilearn-cacao-api"** service
2. Go to **"Environment"**
3. Click **"Add Environment Variable"**
4. Key: `FRONTEND_URL`
5. Value: (your frontend URL from Step 5.5)
6. Click **"Save"**

**Backend will redeploy automatically** ⏳

---

## ✅ STEP 7: Test Everything

### 7.1 Visit Your Live Website
1. Open your **Frontend URL** from Step 5.5 in browser
2. You should see your AgriLearn Cacao app! 🎉

### 7.2 Test Sign Up
1. Click "Sign Up"
2. Create account with email
3. Check your email for verification link
4. Click verification link
5. You should be verified!

### 7.3 Test Log In
1. Log in with your new account
2. Browse courses
3. Take a quiz
4. Check dashboard

### 7.4 Check for Errors
- Press **F12** in browser to open Developer Tools
- Look at **"Console"** tab for errors
- If issues, check Render logs:
  - Dashboard → Service → **"Logs"** tab

---

## 🆘 Troubleshooting

### ❌ "Cannot connect to API"
**Solution:**
1. Check `VITE_API_URL` is correct in frontend
2. Visit backend URL directly: `https://agrilearn-cacao-api.onrender.com`
3. You should see a message (not a blank page)
4. Check backend logs for errors

### ❌ "Email not sending"
**Solution:**
1. Verify Gmail App Password is correct
2. Check backend logs for SMTP errors
3. Ensure 2FA is enabled on Gmail
4. Try creating a new App Password

### ❌ "Database connection failed"
**Solution:**
1. Check MongoDB connection string format
2. Verify IP whitelist allows "0.0.0.0/0"
3. Test connection locally first
4. Check database user exists

### ❌ "Service won't start"
**Solution:**
1. Check Render logs for exact error
2. Verify all required environment variables are set
3. Test locally: `npm start` in /server folder
4. Check for syntax errors in code

---

## 📊 Monitoring Your App

### Check Logs
- Dashboard → Service → **"Logs"** tab
- Scroll to see real-time activity

### Restart Service
- Service page → **"Manual Deploy"** → **"Deploy latest commit"**

### View Environment Variables
- Service page → **"Environment"** tab

---

## 💡 Important Notes

⚠️ **Free Tier Limitations:**
- Services sleep after 15 minutes of inactivity
- First request after sleep takes ~30 seconds
- Limited bandwidth and storage
- Automatic upgrades if you exceed limits

⚠️ **Security:**
- Never commit `.env` files
- Rotate passwords regularly
- Keep your JWT_SECRET secret
- Monitor your MongoDB for suspicious activity

⚠️ **Costs:**
- Free tier is truly free initially
- Render may charge if you exceed limits
- MongoDB Atlas free tier: 512MB storage

---

## 🎯 What's Next?

Once everything works:

1. **Add Custom Domain** (optional)
   - Domain settings in Render
   - Points to your app URL

2. **Enable HTTPS** (automatic on Render)
   - Already included!

3. **Set Up Monitoring**
   - Alert on service failures
   - Monitor database usage

4. **Upgrade to Paid Plan** (if needed)
   - Get better performance
   - No service sleeping
   - More resources

---

## 📞 Need Help?

- **Render Docs**: https://render.com/docs
- **MongoDB Docs**: https://docs.mongodb.com/
- **Express Docs**: https://expressjs.com
- **Vite Docs**: https://vitejs.dev

---

## ✨ Success Indicators

You'll know it's working when:
- ✅ Frontend loads without errors
- ✅ Sign up creates account
- ✅ Verification email arrives
- ✅ Login works
- ✅ Courses load
- ✅ Quizzes work
- ✅ Console (F12) shows no red errors
- ✅ No error messages on screen

---

## 🎉 You're Done!

Your app is now live on the internet! Share your frontend URL with users:

```
https://agrilearn-cacao-frontend.onrender.com
```

**Congratulations! 🚀**

---

**Last updated**: December 2025
**Ready to deploy?** Follow Step 0 to get started!
