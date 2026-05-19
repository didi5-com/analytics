from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from app.database import db
from app.models import User, Student, Course, Grade, Attendance, AdvisorAssignment, AcademicPeriod
from app.ml.features import compute_risk
from datetime import datetime
import re

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')


def admin_required(f):
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        if not current_user.is_authenticated or current_user.role != 'admin':
            flash('Admin access required.', 'danger')
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated


def _department_code(department):
    cleaned = re.sub(r'[^A-Za-z0-9 ]+', ' ', (department or '').upper()).strip()
    parts = [part for part in cleaned.split() if part]
    if not parts:
        return 'GEN'
    if len(parts) == 1:
        return parts[0][:4]
    return ''.join(part[0] for part in parts)[:4]


def _generate_matric_no(department):
    prefix = f"{_department_code(department)}/{datetime.utcnow().strftime('%y')}/"
    highest = 0
    existing_students = Student.query.filter(Student.matric_no.like(f'{prefix}%')).all()
    for student in existing_students:
        if not student.matric_no:
            continue
        try:
            highest = max(highest, int(student.matric_no.split('/')[-1]))
        except (TypeError, ValueError):
            continue
    return f'{prefix}{highest + 1:03d}'


@admin_bp.route('/dashboard')
@login_required
@admin_required
def dashboard():
    users = User.query.all()
    courses = Course.query.all()
    students = Student.query.all()
    advisor_assignments = AdvisorAssignment.query.all()

    total_students = sum(1 for u in users if u.role == 'student')
    total_lecturers = sum(1 for u in users if u.role == 'lecturer')

    at_risk_count = 0
    for s in students:
        grades = Grade.query.filter_by(student_id=s.id).all()
        for g in grades:
            att = Attendance.query.filter_by(student_id=s.id, course_id=g.course_id).first()
            att_pct = att.percentage if att else 100.0
            risk, _ = compute_risk(g.score, att_pct)
            if risk == 'HIGH':
                at_risk_count += 1
                break

    return render_template('admin/dashboard.html',
                           users=users,
                           courses=courses,
                           total_students=total_students,
                           total_lecturers=total_lecturers,
                           at_risk_count=at_risk_count,
                           advisor_assignments=advisor_assignments)


@admin_bp.route('/academic-period', methods=['POST'])
@login_required
@admin_required
def update_academic_period():
    session_name = request.form.get('session_name', '').strip()
    semester_name = request.form.get('semester_name', '').strip()

    if not session_name or not semester_name:
        flash('Session and semester are required.', 'danger')
        return redirect(url_for('admin.dashboard'))

    period = AcademicPeriod.query.first()
    if not period:
        period = AcademicPeriod()
        db.session.add(period)

    period.session_name = session_name
    period.semester_name = semester_name
    db.session.commit()
    flash('Academic session and semester updated.', 'success')
    return redirect(url_for('admin.dashboard'))


@admin_bp.route('/add-course', methods=['GET', 'POST'])
@login_required
@admin_required
def add_course():
    lecturers = User.query.filter_by(role='lecturer').all()
    if request.method == 'POST':
        code = request.form.get('course_code', '').strip().upper()
        title = request.form.get('title', '').strip()
        dept = request.form.get('department', '').strip()
        level = request.form.get('level', '').strip()
        lecturer_id = request.form.get('lecturer_id') or None

        if not code or not title:
            flash('Course code and title are required.', 'danger')
            return render_template('admin/add_course.html', lecturers=lecturers)

        if Course.query.filter_by(course_code=code).first():
            flash('A course with that code already exists.', 'danger')
            return render_template('admin/add_course.html', lecturers=lecturers)

        course = Course(course_code=code, title=title, department=dept, level=level,
                        lecturer_id=int(lecturer_id) if lecturer_id else None)
        db.session.add(course)
        db.session.commit()
        flash(f'Course {code} added successfully.', 'success')
        return redirect(url_for('admin.dashboard'))

    return render_template('admin/add_course.html', lecturers=lecturers)


@admin_bp.route('/delete-course/<int:course_id>', methods=['POST'])
@login_required
@admin_required
def delete_course(course_id):
    course = Course.query.get_or_404(course_id)
    Grade.query.filter_by(course_id=course_id).delete()
    Attendance.query.filter_by(course_id=course_id).delete()
    db.session.delete(course)
    db.session.commit()
    flash('Course deleted.', 'success')
    return redirect(url_for('admin.dashboard'))


@admin_bp.route('/users')
@login_required
@admin_required
def manage_users():
    users = User.query.all()
    lecturers = User.query.filter_by(role='lecturer').order_by(User.name.asc()).all()
    advisor_assignments = AdvisorAssignment.query.order_by(AdvisorAssignment.department.asc(), AdvisorAssignment.level.asc()).all()
    return render_template('admin/users.html', users=users, lecturers=lecturers, advisor_assignments=advisor_assignments)


@admin_bp.route('/users/create', methods=['POST'])
@login_required
@admin_required
def create_user():
    name = request.form.get('name', '').strip()
    email = request.form.get('email', '').strip().lower()
    password = request.form.get('password', '')
    role = request.form.get('role', 'student')
    department = request.form.get('department', '').strip()
    level = request.form.get('level', '').strip()
    phone = request.form.get('phone', '').strip()

    if not name or not email or not password:
        flash('Name, email, and password are required.', 'danger')
        return redirect(url_for('admin.manage_users'))

    if role not in ('student', 'lecturer'):
        flash('Only student and lecturer accounts can be created here.', 'danger')
        return redirect(url_for('admin.manage_users'))

    if User.query.filter_by(email=email).first():
        flash('A user with that email already exists.', 'danger')
        return redirect(url_for('admin.manage_users'))

    user = User(name=name, email=email, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.flush()

    if role == 'student':
        if not department or not level or not phone:
            db.session.rollback()
            flash('Department, level, and phone are required for student registration.', 'danger')
            return redirect(url_for('admin.manage_users'))

        db.session.add(Student(
            user_id=user.id,
            department=department,
            level=level,
            phone=phone,
            matric_no=_generate_matric_no(department),
        ))

    db.session.commit()
    flash(f'{role.title()} account created successfully.', 'success')
    return redirect(url_for('admin.manage_users'))


@admin_bp.route('/advisors/create', methods=['POST'])
@login_required
@admin_required
def create_advisor_assignment():
    lecturer_id = request.form.get('lecturer_id')
    department = request.form.get('department', '').strip()
    level = request.form.get('level', '').strip()

    if not lecturer_id or not department or not level:
        flash('Lecturer, department, and level are required for advisor assignment.', 'danger')
        return redirect(url_for('admin.manage_users'))

    lecturer = User.query.filter_by(id=int(lecturer_id), role='lecturer').first()
    if not lecturer:
        flash('Selected lecturer was not found.', 'danger')
        return redirect(url_for('admin.manage_users'))

    assignment = AdvisorAssignment.query.filter_by(department=department, level=level).first()
    if assignment:
        assignment.lecturer_id = lecturer.id
        flash('Course advisor updated successfully.', 'success')
    else:
        db.session.add(AdvisorAssignment(lecturer_id=lecturer.id, department=department, level=level))
        flash('Course advisor assigned successfully.', 'success')

    db.session.commit()
    return redirect(url_for('admin.manage_users'))


@admin_bp.route('/advisors/delete/<int:assignment_id>', methods=['POST'])
@login_required
@admin_required
def delete_advisor_assignment(assignment_id):
    assignment = AdvisorAssignment.query.get_or_404(assignment_id)
    db.session.delete(assignment)
    db.session.commit()
    flash('Course advisor assignment removed.', 'success')
    return redirect(url_for('admin.manage_users'))


@admin_bp.route('/delete-user/<int:user_id>', methods=['POST'])
@login_required
@admin_required
def delete_user(user_id):
    if user_id == current_user.id:
        flash('Cannot delete your own account.', 'danger')
        return redirect(url_for('admin.manage_users'))
    user = User.query.get_or_404(user_id)
    if user.student_profile:
        Grade.query.filter_by(student_id=user.student_profile.id).delete()
        Attendance.query.filter_by(student_id=user.student_profile.id).delete()
        db.session.delete(user.student_profile)
    db.session.delete(user)
    db.session.commit()
    flash('User deleted.', 'success')
    return redirect(url_for('admin.manage_users'))


@admin_bp.route('/change-password', methods=['GET', 'POST'])
@login_required
@admin_required
def change_password():
    if request.method == 'POST':
        current_pw = request.form.get('current_password', '')
        new_pw = request.form.get('new_password', '').strip()
        confirm_pw = request.form.get('confirm_password', '').strip()
        if not current_user.check_password(current_pw):
            flash('Current password is incorrect.', 'danger')
        elif new_pw != confirm_pw:
            flash('New passwords do not match.', 'danger')
        elif len(new_pw) < 4:
            flash('Password must be at least 4 characters.', 'danger')
        else:
            current_user.set_password(new_pw)
            db.session.commit()
            flash('Password changed successfully.', 'success')
        return redirect(url_for('admin.change_password'))
    return render_template('admin/change_password.html')


@admin_bp.route('/add-grade', methods=['GET', 'POST'])
@login_required
@admin_required
def add_grade():
    flash('Grades are now recorded by the lecturer assigned to each course.', 'info')
    return redirect(url_for('admin.dashboard'))
