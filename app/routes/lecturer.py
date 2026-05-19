from functools import wraps
from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_required, current_user
from app.database import db
from app.models import Course, Grade, Attendance, Student, User, AdvisorAssignment, CourseRegistration, AcademicPeriod
from app.ml.features import compute_risk

lecturer_bp = Blueprint('lecturer', __name__, url_prefix='/lecturer')

MAX_ASSIGNMENT_SCORE = 10.0
MAX_ATTENDANCE_SCORE = 10.0
MAX_TEST_SCORE = 20.0
MAX_EXAM_SCORE = 60.0
MAX_TOTAL_SCORE = MAX_ASSIGNMENT_SCORE + MAX_ATTENDANCE_SCORE + MAX_TEST_SCORE + MAX_EXAM_SCORE


def lecturer_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not current_user.is_authenticated or current_user.role != 'lecturer':
            flash('Lecturer access required.', 'danger')
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated


@lecturer_bp.route('/dashboard')
@login_required
def dashboard():
    if current_user.role not in ('lecturer', 'admin'):
        return redirect(url_for('main.home'))

    if current_user.role == 'lecturer':
        courses = Course.query.filter_by(lecturer_id=current_user.id).all()
        advisor_assignments = AdvisorAssignment.query.filter_by(lecturer_id=current_user.id).all()
    else:
        courses = Course.query.all()
        advisor_assignments = AdvisorAssignment.query.all()

    course_stats = []
    for course in courses:
        grades = Grade.query.filter_by(course_id=course.id).all()
        if not grades:
            continue
        student_rows = []
        for g in grades:
            att = Attendance.query.filter_by(student_id=g.student_id, course_id=course.id).first()
            att_pct = att.percentage if att else 100.0
            risk_level, _ = compute_risk(g.score, att_pct)
            student = Student.query.get(g.student_id)
            student_rows.append({
                'student_id': g.student_id,
                'name': student.user.name if student else 'Unknown',
                'score': g.score,
                'assignment_score': g.assignment_score or 0,
                'attendance_score': g.attendance_score or 0,
                'test_score': g.test_score or 0,
                'exam_score': g.exam_score or 0,
                'attendance': att_pct,
                'risk_level': risk_level,
            })
        scores = [r['score'] for r in student_rows]
        atts = [r['attendance'] for r in student_rows]
        at_risk = [r for r in student_rows if r['risk_level'] == 'HIGH']
        course_stats.append({
            'course': course,
            'students': student_rows,
            'avg_score': round(sum(scores) / len(scores), 1) if scores else 0,
            'avg_attendance': round(sum(atts) / len(atts), 1) if atts else 0,
            'at_risk': at_risk,
            'total': len(student_rows),
        })

    advised_students = []
    seen_student_ids = set()
    for assignment in advisor_assignments:
      students = Student.query.join(User, Student.user_id == User.id).filter(
          Student.department == assignment.department,
          Student.level == assignment.level,
      ).order_by(User.name.asc()).all()
      rows = []
      for student in students:
          if student.id not in seen_student_ids:
              seen_student_ids.add(student.id)
          rows.append(student)
      advised_students.append({
          'assignment': assignment,
          'students': rows,
          'total': len(rows),
      })

    return render_template('lecturer/dashboard.html', course_stats=course_stats, advised_students=advised_students)


@lecturer_bp.route('/add-grade', methods=['GET', 'POST'])
@login_required
@lecturer_required
def add_grade():
    courses = Course.query.filter_by(lecturer_id=current_user.id).order_by(Course.course_code.asc()).all()
    course_ids = [course.id for course in courses]
    students = Student.query.join(User, Student.user_id == User.id).order_by(User.name.asc()).all()

    if request.method == 'POST':
        student_id = request.form.get('student_id')
        course_id = request.form.get('course_id')
        assignment_score = request.form.get('assignment_score')
        attendance_score = request.form.get('attendance_score')
        test_score = request.form.get('test_score')
        exam_score = request.form.get('exam_score')

        if not all([student_id, course_id, assignment_score, attendance_score, test_score, exam_score]):
            flash('All fields are required.', 'danger')
            return render_template(
                'lecturer/add_grade.html',
                students=students,
                courses=courses,
                max_assignment_score=MAX_ASSIGNMENT_SCORE,
                max_attendance_score=MAX_ATTENDANCE_SCORE,
                max_test_score=MAX_TEST_SCORE,
                max_exam_score=MAX_EXAM_SCORE,
            )

        try:
            student_id = int(student_id)
            course_id = int(course_id)
            assignment_score = float(assignment_score)
            attendance_score = float(attendance_score)
            test_score = float(test_score)
            exam_score = float(exam_score)
        except ValueError:
            flash('All grading fields must be valid numbers.', 'danger')
            return render_template(
                'lecturer/add_grade.html',
                students=students,
                courses=courses,
                max_assignment_score=MAX_ASSIGNMENT_SCORE,
                max_attendance_score=MAX_ATTENDANCE_SCORE,
                max_test_score=MAX_TEST_SCORE,
                max_exam_score=MAX_EXAM_SCORE,
            )

        if course_id not in course_ids:
            flash('You can only record grades for courses assigned to you.', 'danger')
            return render_template(
                'lecturer/add_grade.html',
                students=students,
                courses=courses,
                max_assignment_score=MAX_ASSIGNMENT_SCORE,
                max_attendance_score=MAX_ATTENDANCE_SCORE,
                max_test_score=MAX_TEST_SCORE,
                max_exam_score=MAX_EXAM_SCORE,
            )

        student = Student.query.get(student_id)
        course = Course.query.get(course_id)

        if not student:
            flash('Selected student was not found.', 'danger')
            return render_template(
                'lecturer/add_grade.html',
                students=students,
                courses=courses,
                max_assignment_score=MAX_ASSIGNMENT_SCORE,
                max_attendance_score=MAX_ATTENDANCE_SCORE,
                max_test_score=MAX_TEST_SCORE,
                max_exam_score=MAX_EXAM_SCORE,
            )

        if not course:
            flash('Selected course was not found.', 'danger')
            return render_template(
                'lecturer/add_grade.html',
                students=students,
                courses=courses,
                max_assignment_score=MAX_ASSIGNMENT_SCORE,
                max_attendance_score=MAX_ATTENDANCE_SCORE,
                max_test_score=MAX_TEST_SCORE,
                max_exam_score=MAX_EXAM_SCORE,
            )

        registration = CourseRegistration.query.filter_by(student_id=student.id, course_id=course.id).first()
        if not registration:
            flash('The selected student has not registered this course.', 'danger')
            return render_template(
                'lecturer/add_grade.html',
                students=students,
                courses=courses,
                max_assignment_score=MAX_ASSIGNMENT_SCORE,
                max_attendance_score=MAX_ATTENDANCE_SCORE,
                max_test_score=MAX_TEST_SCORE,
                max_exam_score=MAX_EXAM_SCORE,
            )

        if course.department and student.department != course.department:
            flash('You can only enter results for students in the course department.', 'danger')
            return render_template(
                'lecturer/add_grade.html',
                students=students,
                courses=courses,
                max_assignment_score=MAX_ASSIGNMENT_SCORE,
                max_attendance_score=MAX_ATTENDANCE_SCORE,
                max_test_score=MAX_TEST_SCORE,
                max_exam_score=MAX_EXAM_SCORE,
            )

        if course.level and student.level != course.level:
            flash('You can only enter results for students in the course level.', 'danger')
            return render_template(
                'lecturer/add_grade.html',
                students=students,
                courses=courses,
                max_assignment_score=MAX_ASSIGNMENT_SCORE,
                max_attendance_score=MAX_ATTENDANCE_SCORE,
                max_test_score=MAX_TEST_SCORE,
                max_exam_score=MAX_EXAM_SCORE,
            )

        if not (0 <= assignment_score <= MAX_ASSIGNMENT_SCORE):
            flash(f'Assignment score cannot exceed {MAX_ASSIGNMENT_SCORE:.0f}.', 'danger')
            return render_template(
                'lecturer/add_grade.html',
                students=students,
                courses=courses,
                max_assignment_score=MAX_ASSIGNMENT_SCORE,
                max_attendance_score=MAX_ATTENDANCE_SCORE,
                max_test_score=MAX_TEST_SCORE,
                max_exam_score=MAX_EXAM_SCORE,
            )

        if not (0 <= attendance_score <= MAX_ATTENDANCE_SCORE):
            flash(f'Attendance score cannot exceed {MAX_ATTENDANCE_SCORE:.0f}.', 'danger')
            return render_template(
                'lecturer/add_grade.html',
                students=students,
                courses=courses,
                max_assignment_score=MAX_ASSIGNMENT_SCORE,
                max_attendance_score=MAX_ATTENDANCE_SCORE,
                max_test_score=MAX_TEST_SCORE,
                max_exam_score=MAX_EXAM_SCORE,
            )

        if not (0 <= test_score <= MAX_TEST_SCORE):
            flash(f'Test score cannot exceed {MAX_TEST_SCORE:.0f}.', 'danger')
            return render_template(
                'lecturer/add_grade.html',
                students=students,
                courses=courses,
                max_assignment_score=MAX_ASSIGNMENT_SCORE,
                max_attendance_score=MAX_ATTENDANCE_SCORE,
                max_test_score=MAX_TEST_SCORE,
                max_exam_score=MAX_EXAM_SCORE,
            )

        if not (0 <= exam_score <= MAX_EXAM_SCORE):
            flash(f'Exam score cannot exceed {MAX_EXAM_SCORE:.0f}.', 'danger')
            return render_template(
                'lecturer/add_grade.html',
                students=students,
                courses=courses,
                max_assignment_score=MAX_ASSIGNMENT_SCORE,
                max_attendance_score=MAX_ATTENDANCE_SCORE,
                max_test_score=MAX_TEST_SCORE,
                max_exam_score=MAX_EXAM_SCORE,
            )

        total_score = assignment_score + attendance_score + test_score + exam_score
        attendance_percentage = (attendance_score / MAX_ATTENDANCE_SCORE) * 100 if MAX_ATTENDANCE_SCORE else 0
        active_period = AcademicPeriod.query.first()
        session_name = active_period.session_name if active_period else '2025/2026'
        semester_name = active_period.semester_name if active_period else 'First'

        existing_grade = Grade.query.filter_by(student_id=student_id, course_id=course_id).first()
        if existing_grade:
            existing_grade.assignment_score = assignment_score
            existing_grade.attendance_score = attendance_score
            existing_grade.test_score = test_score
            existing_grade.exam_score = exam_score
            existing_grade.score = total_score
            existing_grade.session_name = session_name
            existing_grade.semester = semester_name
        else:
            db.session.add(Grade(
                student_id=student_id,
                course_id=course_id,
                assignment_score=assignment_score,
                attendance_score=attendance_score,
                test_score=test_score,
                exam_score=exam_score,
                score=total_score,
                session_name=session_name,
                semester=semester_name,
            ))

        existing_attendance = Attendance.query.filter_by(student_id=student_id, course_id=course_id).first()
        if existing_attendance:
            existing_attendance.percentage = attendance_percentage
        else:
            db.session.add(Attendance(student_id=student_id, course_id=course_id, percentage=attendance_percentage))

        db.session.commit()
        flash('Grade and attendance recorded for your course.', 'success')
        return redirect(url_for('lecturer.dashboard'))

    return render_template(
        'lecturer/add_grade.html',
        students=students,
        courses=courses,
        max_assignment_score=MAX_ASSIGNMENT_SCORE,
        max_attendance_score=MAX_ATTENDANCE_SCORE,
        max_test_score=MAX_TEST_SCORE,
        max_exam_score=MAX_EXAM_SCORE,
    )
