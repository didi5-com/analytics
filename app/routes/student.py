from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from app.database import db
from app.models import Student, Grade, Attendance, Course, CourseRegistration
from app.ml.features import compute_risk, get_recommendations

student_bp = Blueprint('student', __name__, url_prefix='/student')


def _require_student():
    if current_user.role not in ('student', 'admin'):
        return False
    return True


@student_bp.route('/dashboard')
@login_required
def dashboard():
    if current_user.role not in ('student',):
        return redirect(url_for('main.home'))
    profile = current_user.student_profile
    if not profile:
        profile = Student(user_id=current_user.id)
        db.session.add(profile)
        db.session.commit()

    registered_courses = CourseRegistration.query.filter_by(student_id=profile.id).all()
    registered_course_ids = [registration.course_id for registration in registered_courses]
    grades = Grade.query.filter_by(student_id=profile.id).all()
    attendances = Attendance.query.filter_by(student_id=profile.id).all()

    course_data = []
    for g in grades:
        if registered_course_ids and g.course_id not in registered_course_ids:
            continue
        att = next((a for a in attendances if a.course_id == g.course_id), None)
        att_pct = att.percentage if att else 100.0
        risk_level, risk_prob = compute_risk(g.score, att_pct)
        course_data.append({
            'course_code': g.course.course_code,
            'course_title': g.course.title,
            'score': g.score,
            'attendance': att_pct,
            'risk_level': risk_level,
            'risk_prob': risk_prob,
        })

    overall_risk = 'LOW'
    if course_data:
        scores = [d['score'] for d in course_data]
        atts = [d['attendance'] for d in course_data]
        avg_score = sum(scores) / len(scores)
        avg_att = sum(atts) / len(atts)
        overall_risk, _ = compute_risk(avg_score, avg_att)

    recs = get_recommendations(overall_risk)
    available_courses_query = Course.query
    if profile.department:
        available_courses_query = available_courses_query.filter(
            (Course.department == profile.department) | (Course.department.is_(None)) | (Course.department == '')
        )
    if profile.level:
        available_courses_query = available_courses_query.filter(
            (Course.level == profile.level) | (Course.level.is_(None)) | (Course.level == '')
        )
    available_courses = available_courses_query.order_by(Course.course_code.asc()).all()
    return render_template('student/dashboard.html',
                           profile=profile,
                           course_data=course_data,
                           overall_risk=overall_risk,
                           recommendations=recs,
                           registered_courses=registered_courses,
                           registered_course_ids=registered_course_ids,
                           available_courses=available_courses)


@student_bp.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    if current_user.role != 'student':
        return redirect(url_for('main.home'))
    p = current_user.student_profile
    if not p:
        p = Student(user_id=current_user.id)
        db.session.add(p)
        db.session.commit()

    if request.method == 'POST':
        current_user.name = request.form.get('name', current_user.name).strip()
        p.department = request.form.get('department', p.department).strip()
        p.level = request.form.get('level', p.level).strip()
        p.phone = request.form.get('phone', p.phone or '').strip()
        new_pw = request.form.get('new_password', '').strip()
        if new_pw:
            current_user.set_password(new_pw)
        db.session.commit()
        flash('Profile updated.', 'success')
        return redirect(url_for('student.profile'))

    courses = Course.query.all()
    return render_template('student/profile.html', profile=p, courses=courses)


@student_bp.route('/register-course', methods=['POST'])
@login_required
def register_course():
    if current_user.role != 'student':
        return redirect(url_for('main.home'))

    profile = current_user.student_profile
    if not profile:
        flash('Complete your profile before registering courses.', 'danger')
        return redirect(url_for('student.profile'))

    course_id = request.form.get('course_id')
    if not course_id:
        flash('Please select a course.', 'danger')
        return redirect(url_for('student.dashboard'))

    course = Course.query.get_or_404(int(course_id))

    if course.department and profile.department and course.department != profile.department:
        flash('You can only register courses from your department.', 'danger')
        return redirect(url_for('student.dashboard'))

    if course.level and profile.level and course.level != profile.level:
        flash('You can only register courses for your level.', 'danger')
        return redirect(url_for('student.dashboard'))

    existing = CourseRegistration.query.filter_by(student_id=profile.id, course_id=course.id).first()
    if existing:
        flash('You have already registered this course.', 'info')
        return redirect(url_for('student.dashboard'))

    db.session.add(CourseRegistration(student_id=profile.id, course_id=course.id))
    db.session.commit()
    flash(f'{course.course_code} registered successfully.', 'success')
    return redirect(url_for('student.dashboard'))


@student_bp.route('/drop-course/<int:course_id>', methods=['POST'])
@login_required
def drop_course(course_id):
    if current_user.role != 'student':
        return redirect(url_for('main.home'))

    profile = current_user.student_profile
    if not profile:
        return redirect(url_for('student.dashboard'))

    registration = CourseRegistration.query.filter_by(student_id=profile.id, course_id=course_id).first()
    if not registration:
        flash('Course registration not found.', 'danger')
        return redirect(url_for('student.dashboard'))

    db.session.delete(registration)
    db.session.commit()
    flash('Course registration removed.', 'success')
    return redirect(url_for('student.dashboard'))
