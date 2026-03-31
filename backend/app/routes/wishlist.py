import logging
import uuid
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import IntegrityError
from app.extensions import db
from app.models import Wishlist, Product
from app.utils import success_response, error_response

logger = logging.getLogger(__name__)

wishlist_bp = Blueprint("wishlist", __name__)


@wishlist_bp.route("/", methods=["GET"])
@jwt_required()
def get_wishlist():
    """Get all wishlist items for the current user."""
    try:
        user_id = get_jwt_identity()
        items = Wishlist.query.filter_by(user_id=user_id).order_by(Wishlist.added_at.desc()).all()

        items_data = []
        for item in items:
            item_dict = {
                "id": str(item.id),
                "product_id": str(item.product_id),
                "added_at": item.added_at.isoformat(),
            }
            if item.product:
                item_dict["product"] = {
                    "id": str(item.product.id),
                    "name": item.product.name,
                    "slug": item.product.slug,
                    "min_price": item.product.min_price,
                    "primary_image_url": item.product.primary_image,
                    "fit_type": item.product.fit_type,
                    "is_featured": item.product.is_featured,
                    "is_active": item.product.is_active,
                }
            items_data.append(item_dict)

        return success_response({"items": items_data, "count": len(items_data)})

    except Exception as exc:
        logger.error("Get wishlist error: %s", exc)
        return error_response("Could not retrieve wishlist", 500)


@wishlist_bp.route("/", methods=["POST"])
@jwt_required()
def add_to_wishlist():
    """Add a product to the wishlist. Silently ignores duplicates."""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        if not data:
            return error_response("Request body is required", 400)

        product_id = data.get("product_id")
        if not product_id:
            return error_response("product_id is required", 400)

        try:
            product_uuid = uuid.UUID(str(product_id))
        except (ValueError, AttributeError):
            return error_response("Invalid product_id", 400)

        product = Product.query.get(product_uuid)
        if not product or not product.is_active:
            return error_response("Product not found", 404)

        # Check if already in wishlist
        existing = Wishlist.query.filter_by(
            user_id=user_id, product_id=product_uuid
        ).first()
        if existing:
            return success_response(existing.to_dict(), "Already in wishlist")

        wishlist_item = Wishlist(user_id=user_id, product_id=product_uuid)
        db.session.add(wishlist_item)
        db.session.commit()
        return success_response(wishlist_item.to_dict(), "Added to wishlist", 201)

    except IntegrityError:
        db.session.rollback()
        return success_response(message="Already in wishlist")
    except Exception as exc:
        db.session.rollback()
        logger.error("Add to wishlist error: %s", exc)
        return error_response("Could not add to wishlist", 500)


@wishlist_bp.route("/<product_id>", methods=["DELETE"])
@jwt_required()
def remove_from_wishlist(product_id):
    """Remove a product from the wishlist."""
    try:
        user_id = get_jwt_identity()

        try:
            product_uuid = uuid.UUID(str(product_id))
        except (ValueError, AttributeError):
            return error_response("Invalid product_id", 400)

        wishlist_item = Wishlist.query.filter_by(
            user_id=user_id, product_id=product_uuid
        ).first()
        if not wishlist_item:
            return error_response("Item not in wishlist", 404)

        db.session.delete(wishlist_item)
        db.session.commit()
        return success_response(message="Removed from wishlist")

    except Exception as exc:
        db.session.rollback()
        logger.error("Remove from wishlist error: %s", exc)
        return error_response("Could not remove from wishlist", 500)
