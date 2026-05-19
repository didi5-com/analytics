from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
import pandas as pd

from backend.ml import risk_model, features
from backend.decorators import roles_required

analytics_bp = Blueprint('analytics_bp', __name__)

@analytics_bp.route('/train', methods=['POST'])
@jwt_required()
@roles_required('admin')
def train_model():
    data = request.get_json()
    if not data or 'grades' not in data or 'attendance' not in data or 'labels' not in data:
        return jsonify({"msg": "Provide grades, attendance, and labels"}), 400

    grades_df = pd.DataFrame(data['grades'])
    attendance_df = pd.DataFrame(data['attendance'])
    labels_df = pd.DataFrame(data['labels'])  # expected columns: student_id, target (0/1)

    if 'student_id' not in labels_df.columns or 'target' not in labels_df.columns:
        return jsonify({"msg": "Labels must include student_id and target"}), 400

    features_df = features.build_features(grades_df, attendance_df)
    train_df = features_df.merge(labels_df, on='student_id', how='inner')

    if train_df.empty:
        return jsonify({"msg": "No matching students between features and labels"}), 400

    X = train_df[['performance_index']]
    y = train_df['target']

    risk_model.train(X, y)
    return jsonify({"msg": "Model trained and persisted"}), 200

@analytics_bp.route('/predict', methods=['POST'])
@jwt_required()
@roles_required('admin', 'lecturer', 'student')
def predict_risk():
    data = request.get_json()
    
    if 'grades' not in data or 'attendance' not in data:
        return jsonify({"msg": "Missing grades or attendance data"}), 400

    grades_df = pd.DataFrame(data['grades'])
    attendance_df = pd.DataFrame(data['attendance'])

    features_df = features.build_features(grades_df, attendance_df)

    if 'performance_index' not in features_df.columns:
        return jsonify({"msg": "Feature engineering failed"}), 500

    X = features_df[['performance_index']]

    try:
        predictions = risk_model.predict(X)
    except Exception:
        # Fallback: use rule-based probability from performance_index
        predictions = (1 - (X['performance_index'].clip(0, 100) / 100)).values

    features_df['risk_probability'] = predictions
    
    def map_risk(prob):
        if prob < 0.4:
            return 'LOW'
        elif prob < 0.7:
            return 'MEDIUM'
        else:
            return 'HIGH'

    features_df['risk_level'] = features_df['risk_probability'].apply(map_risk)

    # Align schema to dashboard expectations
    if 'percentage' in features_df.columns:
        features_df = features_df.rename(columns={'percentage': 'attendance'})
    if 'course' not in features_df.columns and 'course_id' in features_df.columns:
        features_df['course'] = features_df['course_id']

    return jsonify(features_df.to_dict(orient='records')), 200

@analytics_bp.route('/recommend', methods=['POST'])
@jwt_required()
@roles_required('admin', 'lecturer', 'student')
def recommend():
    data = request.get_json()
    if not data or 'students' not in data:
        return jsonify({"msg": "Provide students data"}), 400

    df = pd.DataFrame(data['students'])
    if 'risk_level' not in df.columns:
        return jsonify({"msg": "Each student must include risk_level"}), 400

    def recs(row):
        rl = row.get('risk_level', 'LOW')
        if rl == 'HIGH':
            return [
                'Schedule advisor meeting this week',
                'Attend all upcoming classes',
                'Join study group',
                'Book tutoring session'
            ]
        if rl == 'MEDIUM':
            return [
                'Review last 3 weeks material',
                'Increase weekly study hours',
                'Ask questions in lectures'
            ]
        return [
            'Explore advanced materials',
            'Mentor a peer',
            'Plan next semester courses'
        ]

    df['recommendations'] = df.apply(recs, axis=1)
    return jsonify(df[['student_id', 'course', 'risk_level', 'recommendations']].to_dict(orient='records')), 200
