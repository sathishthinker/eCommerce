import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    set_refresh_cookies,
    unset_refresh_cookies,
)
from app.extensions import db, bcrypt
from app.models import User
from app.utils import success_response, error_response

logger = logging.getLogger(__name__)

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    """Register a new user."""
    try:
        data = request.get_json()
        if not data:
            return error_response("Request body is required", 400)

        email = data.get("email", "").strip().lower()
        password = data.get("password", "")
        name = data.get("name", "").strip()
        phone = data.get("phone", "").strip()

        if not email or not password or not name:
            return error_response("Email, password, and name are required", 400)

        if len(password) < 8:
            return error_response("Password must be at least 8 characters", 400)

        if User.query.filter_by(email=email).first():
            return error_response("Email already registered", 409)

        password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

        # Normalize phone to +91 format
        if phone and not phone.startswith("+"):
            phone = "+91" + phone.lstrip("91").lstrip("0")

        user = User(
            email=email,
            password_hash=password_hash,
            name=name,
            phone=phone or None,
        )
        db.session.add(user)
        db.session.commit()

        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))

        response_data = {
            "user": user.to_dict(),
            "access_token": access_token,
        }
        resp = jsonify({"success": True, "message": "Registration successful", "data": response_data})
        resp.status_code = 201
        set_refresh_cookies(resp, refresh_token)
        return resp

    except Exception as exc:
        db.session.rollback()
        logger.error("Registration error: %s", exc)
        return error_response("Registration failed. Please try again.", 500)


@auth_bp.route("/login", methods=["POST"])
def login():
    """Login with email and password."""
    try:
        data = request.get_json()
        if not data:
            return error_response("Request body is required", 400)

        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        if not email or not password:
            return error_response("Email and password are required", 400)

        user = User.query.filter_by(email=email).first()

        if not user or not user.check_password(password):
            return error_response("Invalid email or password", 401)

        if not user.is_active:
            return error_response("Account is disabled. Please contact support.", 403)

        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))

        response_data = {
            "user": user.to_dict(),
            "access_token": access_token,
        }
        resp = jsonify({"success": True, "message": "Login successful", "data": response_data})
        resp.status_code = 200
        set_refresh_cookies(resp, refresh_token)
        return resp

    except Exception as exc:
        logger.error("Login error: %s", exc)
        return error_response("Login failed. Please try again.", 500)


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    """Issue a new access token using the refresh token."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user or not user.is_active:
            return error_response("User not found or inactive", 401)

        access_token = create_access_token(identity=user_id)
        return success_response({"access_token": access_token}, "Token refreshed")

    except Exception as exc:
        logger.error("Token refresh error: %s", exc)
        return error_response("Token refresh failed", 500)


@auth_bp.route("/logout", methods=["POST"])
def logout():
    """Logout by clearing the refresh token cookie."""
    resp = jsonify({"success": True, "message": "Logged out successfully"})
    unset_refresh_cookies(resp)
    return resp, 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_me():
    """Get current user profile."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return error_response("User not found", 404)
        return success_response(user.to_dict())

    except Exception as exc:
        logger.error("Get profile error: %s", exc)
        return error_response("Could not retrieve profile", 500)


@auth_bp.route("/me", methods=["PUT"])
@jwt_required()
def update_me():
    """Update current user's name and phone."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return error_response("User not found", 404)

        data = request.get_json()
        if not data:
            return error_response("Request body is required", 400)

        if "name" in data and data["name"].strip():
            user.name = data["name"].strip()

        if "phone" in data:
            phone = data["phone"].strip()
            if phone and not phone.startswith("+"):
                phone = "+91" + phone.lstrip("91").lstrip("0")
            user.phone = phone or None

        db.session.commit()
        return success_response(user.to_dict(), "Profile updated")

    except Exception as exc:
        db.session.rollback()
        logger.error("Update profile error: %s", exc)
        return error_response("Could not update profile", 500)


@auth_bp.route("/me/password", methods=["PUT"])
@jwt_required()
def change_password():
    """Change current user's password."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return error_response("User not found", 404)

        data = request.get_json()
        if not data:
            return error_response("Request body is required", 400)

        current_password = data.get("current_password", "")
        new_password = data.get("new_password", "")

        if not current_password or not new_password:
            return error_response("current_password and new_password are required", 400)

        if not user.check_password(current_password):
            return error_response("Current password is incorrect", 401)

        if len(new_password) < 8:
            return error_response("New password must be at least 8 characters", 400)

        user.password_hash = bcrypt.generate_password_hash(new_password).decode("utf-8")
        db.session.commit()
        return success_response(message="Password changed successfully")

    except Exception as exc:
        db.session.rollback()
        logger.error("Change password error: %s", exc)
        return error_response("Could not change password", 500)
