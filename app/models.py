from app.database import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from typing import Optional


class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120))
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))
    role = db.Column(db.String(20), default='student')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    student_profile = db.relationship('Student', backref='user', uselist=False)
    sent_messages = db.relationship('Message', foreign_keys='Message.sender_id', backref='sender', lazy='dynamic')
    received_messages = db.relationship('Message', foreign_keys='Message.receiver_id', backref='receiver', lazy='dynamic')

    def __init__(
        self,
        name: Optional[str] = None,
        email: Optional[str] = None,
        role: str = 'student',
        **kwargs,
    ):
        super().__init__(**kwargs)
        if name is not None:
            self.name = name
        if email is not None:
            self.email = email
        self.role = role

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class AcademicPeriod(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    session_name = db.Column(db.String(20), default='2025/2026')
    semester_name = db.Column(db.String(20), default='First')
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __init__(
        self,
        session_name: str = '2025/2026',
        semester_name: str = 'First',
        **kwargs,
    ):
        super().__init__(**kwargs)
        self.session_name = session_name
        self.semester_name = semester_name


class Student(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), unique=True)
    matric_no = db.Column(db.String(40), unique=True, index=True)
    department = db.Column(db.String(100), default='General')
    level = db.Column(db.String(50), default='100')
    phone = db.Column(db.String(30))
    grades = db.relationship('Grade', backref='student', lazy='dynamic')
    attendance = db.relationship('Attendance', backref='student', lazy='dynamic')
    course_registrations = db.relationship('CourseRegistration', backref='student', lazy='dynamic', cascade='all, delete-orphan')


class Course(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    course_code = db.Column(db.String(20), unique=True, nullable=False)
    title = db.Column(db.String(150), nullable=False)
    department = db.Column(db.String(100))
    level = db.Column(db.String(50))
    lecturer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    lecturer = db.relationship('User', foreign_keys=[lecturer_id])
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    registrations = db.relationship('CourseRegistration', backref='course', lazy='dynamic', cascade='all, delete-orphan')


class AdvisorAssignment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    lecturer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    department = db.Column(db.String(100), nullable=False)
    level = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    lecturer = db.relationship('User', foreign_keys=[lecturer_id])


class CourseRegistration(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('student.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('student_id', 'course_id', name='uq_student_course_registration'),
    )


class Grade(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('student.id'))
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'))
    assignment_score = db.Column(db.Float, default=0.0)
    attendance_score = db.Column(db.Float, default=0.0)
    test_score = db.Column(db.Float, default=0.0)
    exam_score = db.Column(db.Float, default=0.0)
    score = db.Column(db.Float)
    session_name = db.Column(db.String(20), default='2025/2026')
    semester = db.Column(db.String(20), default='2024/1')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    course = db.relationship('Course')


class Attendance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('student.id'))
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'))
    percentage = db.Column(db.Float, default=100.0)
    course = db.relationship('Course')


class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    content = db.Column(db.Text, nullable=False)
    room = db.Column(db.String(50), default='general')
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, default=False)
