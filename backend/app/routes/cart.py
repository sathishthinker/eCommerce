import logging
import uuid
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import CartItem, ProductVariant
from app.utils import success_response, error_response

logger = logging.getLogger(__name__)

cart_bp = Blueprint("cart", __name__)


def _cart_summary(user_id):
    """Return cart items list and subtotal for a user."""
    items = CartItem.query.filter_by(user_id=user_id).all()
    items_data = []
    subtotal = 0
    for item in items:
        item_dict = item.to_dict()
        if item.variant:
            subtotal += item.variant.price * item.quantity
        items_data.append(item_dict)
    return items_data, subtotal


@cart_bp.route("/", methods=["GET"])
@jwt_required()
def get_cart():
    """Get all cart items for the current user with subtotal."""
    try:
        user_id = get_jwt_identity()
        items_data, subtotal = _cart_summary(user_id)
        return success_response({"items": items_data, "subtotal": subtotal, "item_count": len(items_data)})

    except Exception as exc:
        logger.error("Get cart error: %s", exc)
        return error_response("Could not retrieve cart", 500)


@cart_bp.route("/", methods=["POST"])
@jwt_required()
def add_to_cart():
    """Add an item to the cart or increment quantity if it already exists."""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        if not data:
            return error_response("Request body is required", 400)

        variant_id = data.get("variant_id")
        quantity = data.get("quantity", 1)

        if not variant_id:
            return error_response("variant_id is required", 400)

        try:
            variant_uuid = uuid.UUID(str(variant_id))
        except (ValueError, AttributeError):
            return error_response("Invalid variant_id", 400)

        if not isinstance(quantity, int) or quantity < 1:
            return error_response("quantity must be a positive integer", 400)

        variant = ProductVariant.query.get(variant_uuid)
        if not variant or not variant.is_active:
            return error_response("Product variant not found", 404)

        if variant.stock_qty < 1:
            return error_response("This variant is out of stock", 400)

        # Check if item already in cart
        existing = CartItem.query.filter_by(
            user_id=user_id, variant_id=variant_uuid
        ).first()

        if existing:
            new_qty = existing.quantity + quantity
            if new_qty > variant.stock_qty:
                return error_response(
                    f"Only {variant.stock_qty} units available in stock", 400
                )
            existing.quantity = new_qty
            db.session.commit()
            return success_response(existing.to_dict(), "Cart updated")
        else:
            if quantity > variant.stock_qty:
                return error_response(
                    f"Only {variant.stock_qty} units available in stock", 400
                )
            cart_item = CartItem(
                user_id=user_id,
                variant_id=variant_uuid,
                quantity=quantity,
            )
            db.session.add(cart_item)
            db.session.commit()
            return success_response(cart_item.to_dict(), "Item added to cart", 201)

    except Exception as exc:
        db.session.rollback()
        logger.error("Add to cart error: %s", exc)
        return error_response("Could not add item to cart", 500)


@cart_bp.route("/<item_id>", methods=["PUT"])
@jwt_required()
def update_cart_item(item_id):
    """Update quantity of a cart item. If quantity=0, delete the item."""
    try:
        user_id = get_jwt_identity()

        try:
            item_uuid = uuid.UUID(str(item_id))
        except (ValueError, AttributeError):
            return error_response("Invalid item_id", 400)

        cart_item = CartItem.query.filter_by(id=item_uuid, user_id=user_id).first()
        if not cart_item:
            return error_response("Cart item not found", 404)

        data = request.get_json()
        if not data or "quantity" not in data:
            return error_response("quantity is required", 400)

        quantity = data["quantity"]
        if not isinstance(quantity, int) or quantity < 0:
            return error_response("quantity must be a non-negative integer", 400)

        if quantity == 0:
            db.session.delete(cart_item)
            db.session.commit()
            return success_response(message="Item removed from cart")

        variant = cart_item.variant
        if variant and quantity > variant.stock_qty:
            return error_response(
                f"Only {variant.stock_qty} units available in stock", 400
            )

        cart_item.quantity = quantity
        db.session.commit()
        return success_response(cart_item.to_dict(), "Cart item updated")

    except Exception as exc:
        db.session.rollback()
        logger.error("Update cart item error: %s", exc)
        return error_response("Could not update cart item", 500)


@cart_bp.route("/<item_id>", methods=["DELETE"])
@jwt_required()
def remove_cart_item(item_id):
    """Remove a specific item from the cart."""
    try:
        user_id = get_jwt_identity()

        try:
            item_uuid = uuid.UUID(str(item_id))
        except (ValueError, AttributeError):
            return error_response("Invalid item_id", 400)

        cart_item = CartItem.query.filter_by(id=item_uuid, user_id=user_id).first()
        if not cart_item:
            return error_response("Cart item not found", 404)

        db.session.delete(cart_item)
        db.session.commit()
        return success_response(message="Item removed from cart")

    except Exception as exc:
        db.session.rollback()
        logger.error("Remove cart item error: %s", exc)
        return error_response("Could not remove cart item", 500)


@cart_bp.route("/", methods=["DELETE"])
@jwt_required()
def clear_cart():
    """Remove all items from the current user's cart."""
    try:
        user_id = get_jwt_identity()
        CartItem.query.filter_by(user_id=user_id).delete()
        db.session.commit()
        return success_response(message="Cart cleared")

    except Exception as exc:
        db.session.rollback()
        logger.error("Clear cart error: %s", exc)
        return error_response("Could not clear cart", 500)
