# Deployment Guide for Render

## Project Status ✅

Your Educational Analytics Platform has been successfully prepared and uploaded to GitHub:
- **Repository**: https://github.com/didi5-com/analytics.git
- **Status**: Ready for Render deployment

## What Was Done

### 1. Files Created/Updated for Render Deployment

- ✅ **main.py** - Updated to serve as the Flask application entry point
- ✅ **Procfile** - Tells Render how to start your application
- ✅ **requirements.txt** - Updated with all necessary dependencies including gunicorn
- ✅ **runtime.txt** - Specifies Python version (3.11.0)
- ✅ **render.yaml** - Blueprint for automated Render deployment
- ✅ **.env.example** - Template for environment variables
- ✅ **README.md** - Comprehensive documentation
- ✅ **.gitignore** - Updated to exclude sensitive files and Python artifacts

### 2. Code Updates

- ✅ Database configuration now supports both SQLite (local) and PostgreSQL (production)
- ✅ Environment variable support for SECRET_KEY and DATABASE_URL
- ✅ Automatic postgres:// to postgresql:// URL conversion for Render compatibility

## Deploy to Render - Step by Step

### Option 1: Using Blueprint (Recommended - Easiest)

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com/
   - Sign in or create an account

2. **Create New Blueprint**
   - Click "New" → "Blueprint"
   - Connect your GitHub account if not already connected
   - Select the repository: `didi5-com/analytics`
   - Render will automatically detect the `render.yaml` file

3. **Review Configuration**
   - Service Name: `edu-analytics`
   - Environment: Python
   - The blueprint will automatically configure everything

4. **Deploy**
   - Click "Apply" to create the services
   - Render will automatically:
     - Install dependencies
     - Set up the database (if configured)
     - Deploy your application

5. **Access Your App**
   - Once deployed, you'll get a URL like: `https://edu-analytics.onrender.com`

### Option 2: Manual Web Service Setup

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com/

2. **Create New Web Service**
   - Click "New" → "Web Service"
   - Connect your GitHub repository: `didi5-com/analytics`

3. **Configure Service**
   ```
   Name: edu-analytics
   Environment: Python
   Region: Choose closest to your users
   Branch: main
   Root Directory: (leave empty)
   
   Build Command: pip install -r requirements.txt
   Start Command: gunicorn main:app
   ```

4. **Select Plan**
   - Free tier available (with limitations)
   - Starter plan recommended for production ($7/month)

5. **Environment Variables** (Click "Advanced")
   ```
   SECRET_KEY = [Generate a secure random string]
   ```
   
   Optional (for PostgreSQL):
   ```
   DATABASE_URL = [Your PostgreSQL connection string]
   ```

6. **Create Web Service**
   - Click "Create Web Service"
   - Wait for deployment (usually 2-5 minutes)

### Option 3: Add PostgreSQL Database (Recommended for Production)

1. **Create PostgreSQL Database**
   - In Render Dashboard, click "New" → "PostgreSQL"
   - Name: `edu-analytics-db`
   - Database: `education`
   - User: `edu_user`
   - Region: Same as your web service
   - Plan: Free or Starter

2. **Connect to Web Service**
   - Go to your web service settings
   - Add environment variable:
     ```
     DATABASE_URL = [Copy "Internal Database URL" from PostgreSQL dashboard]
     ```
   - Save changes (this will trigger a redeploy)

## Post-Deployment

### 1. Access Your Application

Your app will be available at: `https://your-service-name.onrender.com`

### 2. Default Admin Login

```
Email: admin@edu.com
Password: didi5566
```

**⚠️ IMPORTANT**: Change the admin password immediately after first login!

### 3. Verify Deployment

- Visit your app URL
- Try logging in with admin credentials
- Check that all pages load correctly
- Test creating a student, course, and grade

## Database Options

### SQLite (Default)
- ✅ Works out of the box
- ✅ No additional setup needed
- ✅ Good for testing and small deployments
- ⚠️ Data persists in container filesystem
- ⚠️ May be lost on redeployment

### PostgreSQL (Recommended for Production)
- ✅ Persistent data storage
- ✅ Better performance for multiple users
- ✅ Scalable
- ✅ Automatic backups (on paid plans)
- ℹ️ Requires additional setup (see Option 3 above)

## Troubleshooting

### Build Fails
- Check the build logs in Render dashboard
- Ensure all dependencies in requirements.txt are correct
- Verify Python version in runtime.txt

### App Crashes on Start
- Check the logs in Render dashboard
- Verify environment variables are set correctly
- Ensure DATABASE_URL format is correct (postgresql:// not postgres://)

### Database Connection Issues
- Verify DATABASE_URL is set correctly
- Check that PostgreSQL database is running
- Ensure web service and database are in the same region

### Static Files Not Loading
- Flask serves static files automatically
- Check that files exist in `app/static/` directory
- Verify paths in templates are correct

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `SECRET_KEY` | Yes | Flask secret key for sessions | `your-super-secret-key-here` |
| `DATABASE_URL` | No | Database connection string | `postgresql://user:pass@host/db` |
| `PORT` | No | Port (Render sets automatically) | `10000` |
| `PYTHON_VERSION` | No | Python version (from runtime.txt) | `3.11.0` |

## Monitoring & Maintenance

### View Logs
- Go to your service in Render dashboard
- Click "Logs" tab
- Monitor for errors or issues

### Redeploy
- Render auto-deploys on git push to main branch
- Manual redeploy: Click "Manual Deploy" → "Deploy latest commit"

### Scale
- Free tier: Limited resources, sleeps after inactivity
- Starter tier: Always on, better performance
- Upgrade in service settings

## Security Recommendations

1. **Change Default Admin Password**
   - Login as admin
   - Go to settings/profile
   - Change password immediately

2. **Set Strong SECRET_KEY**
   - Generate using: `python -c "import secrets; print(secrets.token_hex(32))"`
   - Set in Render environment variables

3. **Use PostgreSQL for Production**
   - SQLite is not recommended for production
   - Set up PostgreSQL database as shown above

4. **Enable HTTPS**
   - Render provides free SSL certificates
   - Automatically enabled for all services

## Next Steps

1. ✅ Deploy to Render using one of the options above
2. ✅ Change admin password
3. ✅ Test all functionality
4. ✅ Add your students and courses
5. ✅ Consider upgrading to PostgreSQL for production use
6. ✅ Set up custom domain (optional, available on paid plans)

## Support

- **Render Documentation**: https://render.com/docs
- **GitHub Repository**: https://github.com/didi5-com/analytics
- **Render Community**: https://community.render.com/

## Cost Estimate

### Free Tier
- Web Service: Free (sleeps after 15 min inactivity)
- PostgreSQL: Free (expires after 90 days)
- Total: $0/month

### Production Tier
- Web Service: $7/month (Starter)
- PostgreSQL: $7/month (Starter)
- Total: $14/month

---

**Your project is now ready for deployment! 🚀**

Choose your preferred deployment option above and follow the steps to get your Educational Analytics Platform live on Render.
