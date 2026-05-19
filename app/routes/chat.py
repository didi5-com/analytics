from flask import Blueprint, render_template, request, jsonify, redirect, url_for
from flask_login import login_required, current_user
from app.database import db
from app.models import Message, User
from datetime import datetime

chat_bp = Blueprint('chat', __name__, url_prefix='/chat')


@chat_bp.route('/')
@login_required
def index():
    users = User.query.filter(User.id != current_user.id).all()
    return render_template('chat.html', users=users)


@chat_bp.route('/messages')
@login_required
def get_messages():
    room = request.args.get('room', 'general')
    messages = Message.query.filter_by(room=room).order_by(Message.timestamp.asc()).limit(100).all()
    return jsonify([{
        'id': m.id,
        'sender': m.sender.name or m.sender.email,
        'sender_id': m.sender_id,
        'content': m.content,
        'timestamp': m.timestamp.strftime('%H:%M'),
        'is_me': m.sender_id == current_user.id
    } for m in messages])


@chat_bp.route('/send', methods=['POST'])
@login_required
def send():
    data = request.get_json()
    content = (data.get('content') or '').strip()
    room = data.get('room', 'general')
    if not content:
        return jsonify({'error': 'Empty message'}), 400
    msg = Message(sender_id=current_user.id, content=content, room=room)
    db.session.add(msg)
    db.session.commit()
    return jsonify({'status': 'ok', 'id': msg.id})
