# Educational Analytics Platform

A comprehensive Flask-based educational analytics platform for managing students, courses, grades, and academic performance tracking.

## Features

- **Multi-Role System**: Admin, Lecturer, and Student dashboards
- **Course Management**: Create and manage courses with department and level tracking
- **Grade Tracking**: Comprehensive grading system with assignment, attendance, test, and exam scores
- **Student Profiles**: Complete student information with matric numbers and department tracking
- **Real-time Chat**: Built-in messaging system for communication
- **Academic Period Management**: Session and semester tracking
- **Course Registration**: Students can register for courses

## Tech Stack

- **Backend**: Flask (Python)
- **Database**: SQLite (development) / PostgreSQL (production)
- **Authentication**: Flask-Login
- **ORM**: SQLAlchemy

## Local Development

### Prerequisites

- Python 3.11+
- pip

### Installation

1. Clone the repository:
```bash
git clone https://github.com/didi5-com/analytics.git
cd analytics
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run the application:
```bash
python main.py
```

The application will be available at `http://localhost:5000`

### Default Admin Credentials

- **Email**: admin@edu.com
- **Password**: didi5566

## Deployment to Render

### Option 1: Using render.yaml (Recommended)

1. Push your code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click "New" → "Blueprint"
4. Connect your GitHub repository
5. Render will automatically detect `render.yaml` and set up your services

### Option 2: Manual Setup

1. Push your code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click "New" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: edu-analytics
   - **Environment**: Python
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn main:app`
   - **Python Version**: 3.11.0

6. Add Environment Variables:
   - `SECRET_KEY`: Generate a secure random key
   - `DATABASE_URL`: (Optional) Add PostgreSQL database if needed

7. Click "Create Web Service"

### Database Options

**SQLite (Default)**: Works out of the box, suitable for small deployments
- Data persists in the container filesystem
- Simple setup, no additional configuration needed

**PostgreSQL (Recommended for Production)**:
1. In Render Dashboard, create a new PostgreSQL database
2. Copy the "Internal Database URL"
3. Add it as `DATABASE_URL` environment variable to your web service
4. The app will automatically use PostgreSQL

## Project Structure

```
.
├── app/
│   ├── __init__.py          # App factory and configuration
│   ├── models.py            # Database models
│   ├── database.py          # Database initialization
│   ├── routes/              # Route blueprints
│   │   ├── admin.py         # Admin routes
│   │   ├── auth.py          # Authentication routes
│   │   ├── chat.py          # Chat/messaging routes
│   │   ├── lecturer.py      # Lecturer routes
│   │   ├── main.py          # Main routes
│   │   └── student.py       # Student routes
│   ├── templates/           # HTML templates
│   ├── static/              # Static files (CSS, JS, images)
│   └── ml/                  # Machine learning features
├── main.py                  # Application entry point
├── requirements.txt         # Python dependencies
├── Procfile                 # Render/Heroku process file
├── render.yaml              # Render blueprint configuration
└── runtime.txt              # Python version specification

```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | Flask secret key for sessions | `edu-secret-key-2024` |
| `DATABASE_URL` | Database connection string | `sqlite:///education.db` |
| `PORT` | Port to run the application | `5000` |
| `FLASK_ENV` | Flask environment | `production` |

## API Endpoints

### Authentication
- `POST /login` - User login
- `POST /register` - User registration
- `GET /logout` - User logout

### Admin Routes
- `GET /admin/dashboard` - Admin dashboard
- `POST /admin/add-course` - Add new course
- `POST /admin/add-grade` - Add student grade
- `GET /admin/users` - Manage users

### Student Routes
- `GET /student/dashboard` - Student dashboard
- `GET /student/profile` - Student profile
- `POST /student/register-course` - Register for courses

### Lecturer Routes
- `GET /lecturer/dashboard` - Lecturer dashboard
- `POST /lecturer/add-grade` - Add grades for students

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on GitHub or contact the development team.

## Changelog

### Version 1.0.0 (2026-05-19)
- Initial release
- Multi-role authentication system
- Course and grade management
- Student profile management
- Real-time chat functionality
- Academic period tracking
