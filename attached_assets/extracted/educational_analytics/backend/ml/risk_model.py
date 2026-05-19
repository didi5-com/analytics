from sklearn.ensemble import RandomForestClassifier
import joblib
import os

_MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'instance', 'risk_model.joblib')
_model = None

def _ensure_dir(path):
    os.makedirs(os.path.dirname(path), exist_ok=True)

def load_model():
    global _model
    if _model is not None:
        return _model
    if os.path.exists(_MODEL_PATH):
        _model = joblib.load(_MODEL_PATH)
        return _model
    return None

def save_model(model):
    _ensure_dir(_MODEL_PATH)
    joblib.dump(model, _MODEL_PATH)

def train(X, y):
    model = RandomForestClassifier(n_estimators=200, random_state=42)
    model.fit(X, y)
    save_model(model)
    global _model
    _model = model

def predict(X):
    model = load_model()
    if model is None:
        raise RuntimeError('Model not trained')
    return model.predict_proba(X)[:, 1]
