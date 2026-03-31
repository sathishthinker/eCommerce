import logging
import cloudinary
import cloudinary.uploader
from flask import jsonify, current_app

logger = logging.getLogger(__name__)


def paginate(query, page: int, per_page: int) -> dict:
    """Paginate a SQLAlchemy query and return a standard dict."""
    page = max(1, page)
    per_page = max(1, min(per_page, 100))
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    return {
        "items": pagination.items,
        "total": pagination.total,
        "pages": pagination.pages,
        "current_page": pagination.page,
        "per_page": per_page,
        "has_next": pagination.has_next,
        "has_prev": pagination.has_prev,
    }


def success_response(data=None, message: str = "Success", status: int = 200):
    """Return a standard success JSON response."""
    payload = {"success": True, "message": message}
    if data is not None:
        payload["data"] = data
    return jsonify(payload), status


def error_response(message: str = "An error occurred", status: int = 400):
    """Return a standard error JSON response."""
    payload = {"success": False, "message": message}
    return jsonify(payload), status


def send_email(to: str, subject: str, html_body: str) -> bool:
    """
    Send an email using Resend API.
    Returns True on success, False on failure.
    """
    try:
        import resend

        resend.api_key = current_app.config["RESEND_API_KEY"]
        from_email = current_app.config["RESEND_FROM_EMAIL"]

        resend.Emails.send({
            "from": from_email,
            "to": to,
            "subject": subject,
            "html": html_body,
        })
        return True
    except Exception as exc:
        logger.error("Failed to send email to %s: %s", to, exc)
        return False


def upload_image(file) -> tuple:
    """
    Upload a file to Cloudinary.
    Returns (url, public_id) tuple, or (None, None) on failure.
    """
    try:
        cloudinary.config(
            cloud_name=current_app.config["CLOUDINARY_CLOUD_NAME"],
            api_key=current_app.config["CLOUDINARY_API_KEY"],
            api_secret=current_app.config["CLOUDINARY_API_SECRET"],
        )
        result = cloudinary.uploader.upload(
            file,
            folder="threadco/products",
            resource_type="image",
        )
        return result["secure_url"], result["public_id"]
    except Exception as exc:
        logger.error("Failed to upload image to Cloudinary: %s", exc)
        return None, None
