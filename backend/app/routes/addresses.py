import logging
import uuid
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import Address
from app.utils import success_response, error_response

logger = logging.getLogger(__name__)

addresses_bp = Blueprint("addresses", __name__)


@addresses_bp.route("/", methods=["GET"])
@jwt_required()
def list_addresses():
    """List all addresses for the current user."""
    try:
        user_id = get_jwt_identity()
        addresses = (
            Address.query.filter_by(user_id=user_id)
            .order_by(Address.is_default.desc(), Address.created_at.desc())
            .all()
        )
        return success_response([a.to_dict() for a in addresses])

    except Exception as exc:
        logger.error("List addresses error: %s", exc)
        return error_response("Could not retrieve addresses", 500)


@addresses_bp.route("/", methods=["POST"])
@jwt_required()
def create_address():
    """Create a new address for the current user."""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        if not data:
            return error_response("Request body is required", 400)

        required = ["name", "phone", "line1", "city", "state", "pincode"]
        for field in required:
            if not data.get(field, "").strip():
                return error_response(f"{field} is required", 400)

        is_default = bool(data.get("is_default", False))

        # If new address is default, unset all others
        if is_default:
            Address.query.filter_by(user_id=user_id, is_default=True).update(
                {"is_default": False}
            )

        # If this is the first address, make it default automatically
        existing_count = Address.query.filter_by(user_id=user_id).count()
        if existing_count == 0:
            is_default = True

        address = Address(
            user_id=user_id,
            name=data["name"].strip(),
            phone=data["phone"].strip(),
            line1=data["line1"].strip(),
            line2=data.get("line2", "").strip() or None,
            city=data["city"].strip(),
            state=data["state"].strip(),
            pincode=data["pincode"].strip(),
            is_default=is_default,
        )
        db.session.add(address)
        db.session.commit()
        return success_response(address.to_dict(), "Address created", 201)

    except Exception as exc:
        db.session.rollback()
        logger.error("Create address error: %s", exc)
        return error_response("Could not create address", 500)


@addresses_bp.route("/<address_id>", methods=["PUT"])
@jwt_required()
def update_address(address_id):
    """Update an existing address."""
    try:
        user_id = get_jwt_identity()

        try:
            address_uuid = uuid.UUID(str(address_id))
        except (ValueError, AttributeError):
            return error_response("Invalid address_id", 400)

        address = Address.query.filter_by(id=address_uuid, user_id=user_id).first()
        if not address:
            return error_response("Address not found", 404)

        data = request.get_json()
        if not data:
            return error_response("Request body is required", 400)

        updatable = ["name", "phone", "line1", "line2", "city", "state", "pincode"]
        for field in updatable:
            if field in data:
                value = data[field]
                setattr(address, field, value.strip() if isinstance(value, str) else value)

        if "is_default" in data and bool(data["is_default"]):
            Address.query.filter_by(user_id=user_id, is_default=True).update(
                {"is_default": False}
            )
            address.is_default = True

        db.session.commit()
        return success_response(address.to_dict(), "Address updated")

    except Exception as exc:
        db.session.rollback()
        logger.error("Update address error: %s", exc)
        return error_response("Could not update address", 500)


@addresses_bp.route("/<address_id>", methods=["DELETE"])
@jwt_required()
def delete_address(address_id):
    """Delete an address."""
    try:
        user_id = get_jwt_identity()

        try:
            address_uuid = uuid.UUID(str(address_id))
        except (ValueError, AttributeError):
            return error_response("Invalid address_id", 400)

        address = Address.query.filter_by(id=address_uuid, user_id=user_id).first()
        if not address:
            return error_response("Address not found", 404)

        db.session.delete(address)
        db.session.commit()

        # If deleted address was default, promote the newest remaining address
        if address.is_default:
            next_address = (
                Address.query.filter_by(user_id=user_id)
                .order_by(Address.created_at.desc())
                .first()
            )
            if next_address:
                next_address.is_default = True
                db.session.commit()

        return success_response(message="Address deleted")

    except Exception as exc:
        db.session.rollback()
        logger.error("Delete address error: %s", exc)
        return error_response("Could not delete address", 500)
