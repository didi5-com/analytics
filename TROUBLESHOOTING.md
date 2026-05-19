# Troubleshooting Guide

## ✅ Fixed: Python Version Compatibility Issue

### Problem
The deployment was failing with this error:
```
AssertionError: Class <class 'sqlalchemy.sql.elements.SQLCoreOperations'> 
directly inherits TypingOnly but has additional attributes
```

### Root Cause
Render was using Python 3.14.3, which is too new and incompatible with SQLAlchemy 2.0.23.

### Solution Applied ✅
Updated the following files:

1. **runtime.txt**: Changed from `python-3.11.0` to `python-3.11.9`
2. **requirements.txt**: Updated dependencies to latest stable versions:
   - flask: 3.0.0 → 3.0.3
   - werkzeug: 3.0.1 → 3.0.3
   - gunicorn: 21.2.0 → 22.0.0
   - python-dotenv: 1.0.0 → 1.0.1
   - sqlalchemy: 2.0.23 → 2.0.30

3. **render.yaml**: Updated Python version to 3.11.9

### Status
✅ **Fixed and pushed to GitHub**

Render will now use Python 3.11.9, which is fully compatible with all dependencies.

---

## Common Render Deployment Issues

### 1. Build Fails - Missing Dependencies

**Symptoms:**
```
ERROR: Could not find a version that satisfies the requirement...
```

**Solution:**
- Check `requirements.txt` for typos
- Ensure all package versions are compatible
- Try removing version pins to get latest compatible versions

### 2. App Crashes on Start

**Symptoms:**
```
Exited with status 1
ModuleNotFoundError: No module named 'app'
```

**Solution:**
- Verify `main.py` is in the root directory
- Check that `app/` folder exists with `__init__.py`
- Ensure `Procfile` has correct command: `gunicorn main:app`

### 3. Database Connection Errors

**Symptoms:**
```
sqlalchemy.exc.OperationalError: could not connect to server
```

**Solution:**
- Verify `DATABASE_URL` environment variable is set
- Ensure URL format is `postgresql://` not `postgres://`
- Check that database and web service are in same region
- Verify database is running and accessible

### 4. Static Files Not Loading

**Symptoms:**
- CSS/JS files return 404 errors
- Pages load but have no styling

**Solution:**
- Verify files exist in `app/static/` directory
- Check template paths use `url_for('static', filename='...')`
- Ensure Flask is configured to serve static files

### 5. Environment Variables Not Working

**Symptoms:**
```
KeyError: 'SECRET_KEY'
```

**Solution:**
- Go to Render Dashboard → Your Service → Environment
- Add required variables:
  - `SECRET_KEY`: Generate with `python -c "import secrets; print(secrets.token_hex(32))"`
  - `DATABASE_URL`: (if using PostgreSQL)
- Save changes (triggers automatic redeploy)

### 6. App Sleeps on Free Tier

**Symptoms:**
- First request after inactivity takes 30+ seconds
- App becomes unresponsive after 15 minutes

**Solution:**
- This is expected behavior on Render's free tier
- Upgrade to Starter plan ($7/month) for always-on service
- Or use a service like UptimeRobot to ping your app every 10 minutes

### 7. Database Migrations Fail

**Symptoms:**
```
sqlalchemy.exc.ProgrammingError: relation does not exist
```

**Solution:**
- Tables are created automatically on first run
- If issues persist, check logs for schema creation errors
- Verify `db.create_all()` is called in `app/__init__.py`

### 8. Port Binding Issues

**Symptoms:**
```
Failed to bind to 0.0.0.0:5000
```

**Solution:**
- Render sets `PORT` environment variable automatically
- Ensure `main.py` uses: `port = int(os.environ.get('PORT', 5000))`
- Don't hardcode port numbers

---

## Checking Logs

### View Logs in Render Dashboard
1. Go to your service
2. Click "Logs" tab
3. Look for error messages
4. Use search to filter specific errors

### Common Log Patterns

**Successful Start:**
```
==> Build successful 🎉
==> Deploying...
==> Running 'gunicorn main:app'
[INFO] Listening at: http://0.0.0.0:10000
```

**Import Error:**
```
ModuleNotFoundError: No module named 'flask'
```
→ Check `requirements.txt`

**Database Error:**
```
sqlalchemy.exc.OperationalError
```
→ Check `DATABASE_URL`

**Port Error:**
```
Address already in use
```
→ Check port configuration

---

## Manual Redeploy

If automatic deployment doesn't trigger:

1. Go to Render Dashboard
2. Select your service
3. Click "Manual Deploy" → "Deploy latest commit"
4. Wait for build to complete

---

## Testing Locally Before Deploy

Always test locally first:

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export SECRET_KEY="test-secret-key"
export DATABASE_URL="sqlite:///education.db"

# Run the app
python main.py
```

Visit `http://localhost:5000` to test.

---

## Getting Help

### Render Support
- Documentation: https://render.com/docs
- Community: https://community.render.com/
- Status: https://status.render.com/

### Project Repository
- GitHub: https://github.com/didi5-com/analytics
- Issues: https://github.com/didi5-com/analytics/issues

### Quick Checks
- ✅ Python version: 3.11.9
- ✅ All dependencies in requirements.txt
- ✅ Procfile exists with correct command
- ✅ main.py in root directory
- ✅ SECRET_KEY environment variable set
- ✅ Database URL format correct (if using PostgreSQL)

---

## Deployment Checklist

Before deploying, verify:

- [ ] All code committed and pushed to GitHub
- [ ] `requirements.txt` has all dependencies
- [ ] `runtime.txt` specifies Python 3.11.9
- [ ] `Procfile` contains: `web: gunicorn main:app`
- [ ] `main.py` exists in root directory
- [ ] Environment variables configured in Render
- [ ] Database created (if using PostgreSQL)
- [ ] Logs checked for errors after deployment

---

## Current Configuration

### Files for Render Deployment
- ✅ `main.py` - Application entry point
- ✅ `Procfile` - Process configuration
- ✅ `requirements.txt` - Python dependencies
- ✅ `runtime.txt` - Python version (3.11.9)
- ✅ `render.yaml` - Render blueprint
- ✅ `.env.example` - Environment variable template

### Environment Variables Required
- `SECRET_KEY` - Flask secret key (required)
- `DATABASE_URL` - Database connection (optional, defaults to SQLite)
- `PORT` - Port number (set automatically by Render)

### Default Credentials
```
Email: admin@edu.com
Password: didi5566
```
**⚠️ Change immediately after first login!**

---

**Your deployment should now work correctly! 🚀**

If you encounter any other issues, check the logs first and refer to this guide.
