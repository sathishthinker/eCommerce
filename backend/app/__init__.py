from flask import Flask
from app.config import Config
from app.extensions import db, jwt, bcrypt, cors, migrate


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    migrate.init_app(app, db)

    # CORS configuration
    frontend_url = app.config.get("FRONTEND_URL", "http://localhost:3000")
    admin_url = app.config.get("ADMIN_URL", "http://localhost:3001")
    allowed_origins = [frontend_url, admin_url, "http://localhost:3000", "http://localhost:3001"]
    # Remove duplicates
    allowed_origins = list(dict.fromkeys(allowed_origins))
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": allowed_origins}},
        supports_credentials=True,
    )

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.products import products_bp
    from app.routes.cart import cart_bp
    from app.routes.wishlist import wishlist_bp
    from app.routes.addresses import addresses_bp
    from app.routes.orders import orders_bp
    from app.routes.admin import admin_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(products_bp, url_prefix="/api/products")
    app.register_blueprint(cart_bp, url_prefix="/api/cart")
    app.register_blueprint(wishlist_bp, url_prefix="/api/wishlist")
    app.register_blueprint(addresses_bp, url_prefix="/api/addresses")
    app.register_blueprint(orders_bp, url_prefix="/api/orders")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")

    # Health check
    @app.route("/api/health")
    def health():
        return {"status": "ok", "service": "threadco-api"}

    return app
