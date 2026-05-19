from flask import Flask
from flask_login import LoginManager
from app.database import db
from app.models import User, AcademicPeriod
from sqlalchemy import inspect, text
from typing import cast
import os


def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'edu-secret-key-2024')
    
    # Support both SQLite (local) and PostgreSQL (production)
    database_url = os.environ.get('DATABASE_URL', 'sqlite:///education.db')
    # Render uses postgres:// but SQLAlchemy needs postgresql://
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['TEMPLATES_AUTO_RELOAD'] = True

    db.init_app(app)

    login_manager = LoginManager(app)
    setattr(login_manager, 'login_view', cast(str, 'auth.login'))
    login_manager.login_message_category = 'info'

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    @app.context_processor
    def inject_academic_period():
        return {'active_period': _get_or_create_academic_period()}

    from app.routes.auth import auth_bp
    from app.routes.main import main_bp
    from app.routes.student import student_bp
    from app.routes.lecturer import lecturer_bp
    from app.routes.admin import admin_bp
    from app.routes.chat import chat_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(main_bp)
    app.register_blueprint(student_bp)
    app.register_blueprint(lecturer_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(chat_bp)

    with app.app_context():
        db.create_all()
        _upgrade_schema()
        _seed_admin()

    app.jinja_env.auto_reload = True
    return app


def _seed_admin():
    from app.models import User
    from app.database import db
    admin = User.query.filter_by(email='admin@edu.com').first()
    if not admin:
        admin = User(name='Administrator', email='admin@edu.com', role='admin')
        admin.set_password('didi5566')
        db.session.add(admin)
        db.session.commit()
    else:
        admin.set_password('didi5566')
        db.session.commit()


def _get_or_create_academic_period():
    period = AcademicPeriod.query.first()
    if not period:
        period = AcademicPeriod(session_name='2025/2026', semester_name='First')
        db.session.add(period)
        db.session.commit()
    return period


def _upgrade_schema():
    inspector = inspect(db.engine)
    tables = inspector.get_table_names()
    if 'student' not in tables:
        return

    student_columns = {column['name'] for column in inspector.get_columns('student')}
    statements = []

    if 'matric_no' not in student_columns:
        statements.append("ALTER TABLE student ADD COLUMN matric_no VARCHAR(40)")
    if 'phone' not in student_columns:
        statements.append("ALTER TABLE student ADD COLUMN phone VARCHAR(30)")

    if statements:
        with db.engine.begin() as connection:
            for statement in statements:
                connection.execute(text(statement))

    if 'course' in tables:
        course_columns = {column['name'] for column in inspector.get_columns('course')}
        if 'level' not in course_columns:
            with db.engine.begin() as connection:
                connection.execute(text("ALTER TABLE course ADD COLUMN level VARCHAR(50)"))

    grade_columns = {column['name'] for column in inspector.get_columns('grade')}
    grade_statements = []
    if 'assignment_score' not in grade_columns:
        grade_statements.append("ALTER TABLE grade ADD COLUMN assignment_score FLOAT DEFAULT 0")
    if 'attendance_score' not in grade_columns:
        grade_statements.append("ALTER TABLE grade ADD COLUMN attendance_score FLOAT DEFAULT 0")
    if 'test_score' not in grade_columns:
        grade_statements.append("ALTER TABLE grade ADD COLUMN test_score FLOAT DEFAULT 0")
    if 'exam_score' not in grade_columns:
        grade_statements.append("ALTER TABLE grade ADD COLUMN exam_score FLOAT DEFAULT 0")
    if grade_statements:
        with db.engine.begin() as connection:
            for statement in grade_statements:
                connection.execute(text(statement))

    if 'course_registration' not in tables:
        db.metadata.tables['course_registration'].create(db.engine)

    if 'academic_period' not in tables:
        db.metadata.tables['academic_period'].create(db.engine)

    grade_columns = {column['name'] for column in inspector.get_columns('grade')}
    if 'session_name' not in grade_columns:
        with db.engine.begin() as connection:
            connection.execute(text("ALTER TABLE grade ADD COLUMN session_name VARCHAR(20) DEFAULT '2025/2026'"))
