from flask import Blueprint, redirect, url_for
from flask_login import current_user, login_required

main_bp = Blueprint('main', __name__)


@main_bp.route('/')
@login_required
def home():
    if current_user.role == 'admin':
        return redirect(url_for('admin.dashboard'))
    if current_user.role == 'lecturer':
        return redirect(url_for('lecturer.dashboard'))
    return redirect(url_for('student.dashboard'))
