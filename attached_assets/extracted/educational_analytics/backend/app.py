from flask import Flask
from flask_jwt_extended import JWTManager
from backend.database import db
from backend.auth import auth_bp
from backend.routes.analytics import analytics_bp

def create_app():
    app = Flask(__name__)

    # Configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///education.db'
    app.config['SECRET_KEY'] = 'your-super-secret-key'  # Change this in production
    app.config['JWT_SECRET_KEY'] = 'your-jwt-secret-key' # Change this in production

    # Initialize extensions
    db.init_app(app)
    jwt = JWTManager(app)

    # Register Blueprints
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(analytics_bp, url_prefix='/analytics')  # Register the analytics blueprint

    with app.app_context():
        db.create_all()

    @app.route('/')
    def index():
        return "Welcome to the Educational Analytics API!"

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
