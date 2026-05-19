from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt

def roles_required(*required_roles):
    """A decorator to protect endpoints based on a list of allowed user roles."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            claims = get_jwt()
            user_role = claims.get("role")
            if user_role not in required_roles:
                return jsonify(msg=f"Access forbidden: This endpoint requires one of the following roles: {', '.join(required_roles)}"), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator
