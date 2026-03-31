import logging
import uuid
import hmac
import hashlib
from datetime import datetime
from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import razorpay
from app.extensions import db
from app.models import (
    Order, OrderItem, Payment, ProductVariant, Address, Coupon, User
)
from app.utils import success_response, error_response, paginate
from services.whatsapp import send_whatsapp_message

logger = logging.getLogger(__name__)

orders_bp = Blueprint("orders", __name__)

FREE_DELIVERY_THRESHOLD = 50000   # ₹500 in paise
DELIVERY_FEE = 9900               # ₹99 in paise


def _format_phone_for_whatsapp(phone: str) -> str:
    """Convert +91XXXXXXXXXX or 91XXXXXXXXXX to 91XXXXXXXXXX (no +)."""
    if not phone:
        return ""
    phone = phone.strip().replace(" ", "").replace("-", "")
    if phone.startswith("+"):
        phone = phone[1:]
    if not phone.startswith("91") and len(phone) == 10:
        phone = "91" + phone
    return phone


@orders_bp.route("/", methods=["GET"])
@jwt_required()
def list_orders():
    """List paginated orders for the current user."""
    try:
        user_id = get_jwt_identity()
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 10, type=int)

        query = Order.query.filter_by(user_id=user_id).order_by(Order.created_at.desc())
        result = paginate(query, page, per_page)

        return success_response({
            "orders": [o.to_dict() for o in result["items"]],
            "total": result["total"],
            "pages": result["pages"],
            "current_page": result["current_page"],
            "per_page": result["per_page"],
        })

    except Exception as exc:
        logger.error("List orders error: %s", exc)
        return error_response("Could not retrieve orders", 500)


@orders_bp.route("/<order_id>", methods=["GET"])
@jwt_required()
def get_order(order_id):
    """Get order detail with items and address."""
    try:
        user_id = get_jwt_identity()

        try:
            order_uuid = uuid.UUID(str(order_id))
        except (ValueError, AttributeError):
            return error_response("Invalid order_id", 400)

        order = Order.query.filter_by(id=order_uuid, user_id=user_id).first()
        if not order:
            return error_response("Order not found", 404)

        return success_response(order.to_dict(include_items=True, include_address=True))

    except Exception as exc:
        logger.error("Get order error: %s", exc)
        return error_response("Could not retrieve order", 500)


@orders_bp.route("/", methods=["POST"])
@jwt_required()
def create_order():
    """
    Create a new order.
    Body: {address_id, payment_method, coupon_code, items: [{variant_id, quantity}]}
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return error_response("User not found", 404)

        data = request.get_json()
        if not data:
            return error_response("Request body is required", 400)

        address_id = data.get("address_id")
        payment_method = data.get("payment_method", "").lower()
        coupon_code = data.get("coupon_code", "").strip().upper() or None
        items_data = data.get("items", [])

        # Validate required fields
        if not address_id:
            return error_response("address_id is required", 400)
        if payment_method not in ("razorpay", "cod"):
            return error_response("payment_method must be 'razorpay' or 'cod'", 400)
        if not items_data:
            return error_response("Order must contain at least one item", 400)

        try:
            address_uuid = uuid.UUID(str(address_id))
        except (ValueError, AttributeError):
            return error_response("Invalid address_id", 400)

        address = Address.query.filter_by(id=address_uuid, user_id=user_id).first()
        if not address:
            return error_response("Address not found", 404)

        # Validate items and stock
        order_items = []
        subtotal = 0

        for item in items_data:
            v_id = item.get("variant_id")
            qty = item.get("quantity", 1)

            if not v_id:
                return error_response("Each item must have a variant_id", 400)
            if not isinstance(qty, int) or qty < 1:
                return error_response("Item quantity must be a positive integer", 400)

            try:
                variant_uuid = uuid.UUID(str(v_id))
            except (ValueError, AttributeError):
                return error_response(f"Invalid variant_id: {v_id}", 400)

            variant = ProductVariant.query.get(variant_uuid)
            if not variant or not variant.is_active:
                return error_response(f"Variant {v_id} not found or inactive", 404)

            if variant.stock_qty < qty:
                return error_response(
                    f"Insufficient stock for {variant.product.name} ({variant.size}/{variant.color}). "
                    f"Available: {variant.stock_qty}",
                    400,
                )

            line_total = variant.price * qty
            subtotal += line_total
            order_items.append({
                "variant": variant,
                "quantity": qty,
                "unit_price": variant.price,
                "total_price": line_total,
                "product_name": variant.product.name,
                "variant_info": f"{variant.size} / {variant.color}",
            })

        # Apply coupon
        discount = 0
        coupon = None
        if coupon_code:
            coupon = Coupon.query.filter_by(code=coupon_code, is_active=True).first()
            if not coupon:
                return error_response("Invalid or inactive coupon code", 400)
            if coupon.expires_at and coupon.expires_at < datetime.utcnow():
                return error_response("Coupon has expired", 400)
            if coupon.max_uses is not None and coupon.used_count >= coupon.max_uses:
                return error_response("Coupon usage limit reached", 400)
            if subtotal < coupon.min_order_value:
                min_val_rupees = coupon.min_order_value / 100
                return error_response(
                    f"Minimum order value of ₹{min_val_rupees:.0f} required for this coupon", 400
                )
            if coupon.discount_percent:
                discount = int(subtotal * coupon.discount_percent / 100)
            elif coupon.discount_flat:
                discount = min(coupon.discount_flat, subtotal)

        # Delivery fee
        delivery_fee = 0 if (subtotal - discount) >= FREE_DELIVERY_THRESHOLD else DELIVERY_FEE
        total = subtotal - discount + delivery_fee

        # Create Razorpay order if needed
        razorpay_order_id = None
        if payment_method == "razorpay":
            try:
                rp_client = razorpay.Client(
                    auth=(
                        current_app.config["RAZORPAY_KEY_ID"],
                        current_app.config["RAZORPAY_KEY_SECRET"],
                    )
                )
                rp_order = rp_client.order.create({
                    "amount": total,
                    "currency": "INR",
                    "payment_capture": 1,
                })
                razorpay_order_id = rp_order["id"]
            except Exception as rp_exc:
                logger.error("Razorpay order creation failed: %s", rp_exc)
                return error_response("Payment gateway error. Please try again.", 502)

        # Persist order
        order = Order(
            user_id=user_id,
            address_id=address_uuid,
            payment_method=payment_method,
            subtotal=subtotal,
            discount=discount,
            delivery_fee=delivery_fee,
            total=total,
            coupon_code=coupon_code,
            razorpay_order_id=razorpay_order_id,
            status="pending",
            payment_status="paid" if payment_method == "cod" else "pending",
        )
        db.session.add(order)
        db.session.flush()  # get order.id before committing

        for item in order_items:
            order_item = OrderItem(
                order_id=order.id,
                variant_id=item["variant"].id,
                product_name=item["product_name"],
                variant_info=item["variant_info"],
                quantity=item["quantity"],
                unit_price=item["unit_price"],
                total_price=item["total_price"],
            )
            db.session.add(order_item)
            # Deduct stock
            item["variant"].stock_qty -= item["quantity"]

        # Increment coupon usage
        if coupon:
            coupon.used_count += 1

        db.session.commit()

        # Send WhatsApp notification (fire-and-forget)
        try:
            wa_phone = _format_phone_for_whatsapp(user.phone or "")
            if wa_phone:
                send_whatsapp_message(
                    to=wa_phone,
                    template_name="order_confirmation",
                    variables=[
                        user.name,
                        str(order.id)[:8].upper(),
                        str(total / 100),
                    ],
                )
        except Exception as wa_exc:
            logger.warning("WhatsApp notification failed: %s", wa_exc)

        response_data = order.to_dict(include_items=True, include_address=True)
        if razorpay_order_id:
            response_data["razorpay_order_id"] = razorpay_order_id
            response_data["razorpay_key_id"] = current_app.config["RAZORPAY_KEY_ID"]

        return success_response(response_data, "Order created successfully", 201)

    except Exception as exc:
        db.session.rollback()
        logger.error("Create order error: %s", exc)
        return error_response("Could not create order", 500)


@orders_bp.route("/<order_id>/verify-payment", methods=["POST"])
@jwt_required()
def verify_payment(order_id):
    """
    Verify Razorpay payment signature and confirm the order.
    Body: {razorpay_payment_id, razorpay_order_id, razorpay_signature}
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        try:
            order_uuid = uuid.UUID(str(order_id))
        except (ValueError, AttributeError):
            return error_response("Invalid order_id", 400)

        order = Order.query.filter_by(id=order_uuid, user_id=user_id).first()
        if not order:
            return error_response("Order not found", 404)

        if order.payment_status == "paid":
            return success_response(order.to_dict(include_items=True), "Payment already verified")

        data = request.get_json()
        if not data:
            return error_response("Request body is required", 400)

        razorpay_payment_id = data.get("razorpay_payment_id", "")
        razorpay_order_id_incoming = data.get("razorpay_order_id", "")
        razorpay_signature = data.get("razorpay_signature", "")

        if not razorpay_payment_id or not razorpay_order_id_incoming or not razorpay_signature:
            return error_response(
                "razorpay_payment_id, razorpay_order_id, and razorpay_signature are required", 400
            )

        # Verify signature
        try:
            rp_client = razorpay.Client(
                auth=(
                    current_app.config["RAZORPAY_KEY_ID"],
                    current_app.config["RAZORPAY_KEY_SECRET"],
                )
            )
            rp_client.utility.verify_payment_signature({
                "razorpay_order_id": razorpay_order_id_incoming,
                "razorpay_payment_id": razorpay_payment_id,
                "razorpay_signature": razorpay_signature,
            })
        except razorpay.errors.SignatureVerificationError:
            return error_response("Payment signature verification failed", 400)
        except Exception as rp_exc:
            logger.error("Razorpay verification error: %s", rp_exc)
            return error_response("Payment verification failed", 500)

        # Update order
        order.payment_status = "paid"
        order.status = "confirmed"
        order.razorpay_payment_id = razorpay_payment_id
        order.razorpay_signature = razorpay_signature

        # Create payment record
        payment = Payment(
            order_id=order.id,
            razorpay_payment_id=razorpay_payment_id,
            razorpay_order_id=razorpay_order_id_incoming,
            amount=order.total,
            status="captured",
            method="razorpay",
        )
        db.session.add(payment)
        db.session.commit()

        # WhatsApp notification
        try:
            wa_phone = _format_phone_for_whatsapp(user.phone or "")
            if wa_phone:
                send_whatsapp_message(
                    to=wa_phone,
                    template_name="payment_success",
                    variables=[
                        user.name,
                        str(order.id)[:8].upper(),
                        str(order.total / 100),
                    ],
                )
        except Exception as wa_exc:
            logger.warning("WhatsApp payment notification failed: %s", wa_exc)

        return success_response(
            order.to_dict(include_items=True, include_address=True),
            "Payment verified successfully",
        )

    except Exception as exc:
        db.session.rollback()
        logger.error("Verify payment error: %s", exc)
        return error_response("Payment verification failed", 500)


@orders_bp.route("/<order_id>/cancel", methods=["POST"])
@jwt_required()
def cancel_order(order_id):
    """Cancel an order if it is in pending or confirmed state."""
    try:
        user_id = get_jwt_identity()

        try:
            order_uuid = uuid.UUID(str(order_id))
        except (ValueError, AttributeError):
            return error_response("Invalid order_id", 400)

        order = Order.query.filter_by(id=order_uuid, user_id=user_id).first()
        if not order:
            return error_response("Order not found", 404)

        if order.status not in ("pending", "confirmed"):
            return error_response(
                f"Order cannot be cancelled in '{order.status}' status", 400
            )

        order.status = "cancelled"

        # Restore stock
        for item in order.items:
            variant = item.variant
            if variant:
                variant.stock_qty += item.quantity

        db.session.commit()
        return success_response(order.to_dict(), "Order cancelled successfully")

    except Exception as exc:
        db.session.rollback()
        logger.error("Cancel order error: %s", exc)
        return error_response("Could not cancel order", 500)
