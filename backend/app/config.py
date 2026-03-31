import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


class Config:
    # Database
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", "postgresql://localhost/threadco")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }

    # JWT
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-secret-key-change-in-production")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_TOKEN_LOCATION = ["headers", "cookies"]
    JWT_COOKIE_SECURE = False
    JWT_COOKIE_CSRF_PROTECT = False
    JWT_COOKIE_SAMESITE = "Lax"

    # Flask
    FLASK_ENV = os.environ.get("FLASK_ENV", "development")
    SECRET_KEY = os.environ.get("SECRET_KEY", os.environ.get("JWT_SECRET_KEY", "dev-secret"))

    # Razorpay
    RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "")
    RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "")

    # Cloudinary
    CLOUDINARY_CLOUD_NAME = os.environ.get("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY = os.environ.get("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET = os.environ.get("CLOUDINARY_API_SECRET", "")

    # Resend (email)
    RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
    RESEND_FROM_EMAIL = os.environ.get("RESEND_FROM_EMAIL", "noreply@threadco.in")

    # WhatsApp (Meta Cloud API)
    WHATSAPP_ACCESS_TOKEN = os.environ.get("WHATSAPP_ACCESS_TOKEN", "")
    WHATSAPP_PHONE_NUMBER_ID = os.environ.get("WHATSAPP_PHONE_NUMBER_ID", "")

    # CORS
    FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")
