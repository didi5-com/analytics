# Educational Data Analytics System

A full Python Flask web application for tracking student academic performance, risk levels, and providing personalized recommendations.

## Tech Stack
- **Backend**: Python 3 + Flask
- **Database**: SQLite via Flask-SQLAlchemy
- **Auth**: Flask-Login (session-based)
- **Frontend**: Jinja2 HTML templates + plain CSS/JS (no React, no Node)

## Entry Point
- `run.py` — starts the Flask server on `PORT` (default 5000)

## App Structure
```
app/
  __init__.py          # Flask app factory, seeds admin account
  database.py          # SQLAlchemy instance
  models.py            # User, Student, Course, Grade, Attendance, Message
  ml/features.py       # Risk calculation (LOW/MEDIUM/HIGH) + recommendations
  routes/
    auth.py            # Login, Register, Logout
    main.py            # Home redirect based on role
    student.py         # Student dashboard + profile edit
    lecturer.py        # Lecturer course analytics
    admin.py           # Admin dashboard, courses, grades, users, password
    chat.py            # Chat room (JSON API + polling)
  templates/           # Jinja2 HTML templates per role
  static/css/style.css # All CSS styling
run.py                 # Entry point
requirements.txt       # Python dependencies
```

## Roles
- **admin** — Full access: add/delete courses, add grades, manage users, change password
- **lecturer** — View their assigned course analytics and at-risk students
- **student** — View own grades, risk level, recommendations, edit profile

## Default Admin Account
- Email: `admin@edu.com`
- Password: `didi5566`
(Reset every time the server starts via `_seed_admin()` in `app/__init__.py`)

## Features
- Login / Register / Logout
- Student dashboard with course performance table and progress bars
- Student profile page (edit name, department, level, password)
- Lecturer dashboard with per-course analytics and at-risk student list
- Admin dashboard with stats, course management, user management
- Add courses (with optional lecturer assignment)
- Add/update grades and attendance per student per course
- Risk engine: computes LOW/MEDIUM/HIGH risk from score + attendance
- Personalized recommendations based on risk level
- Chat rooms (general, study-group, announcements) with 3-second polling
- No demo mode, no mock data

## Workflow
- Name: `Start application`
- Command: `python run.py`
- Port: 5000
