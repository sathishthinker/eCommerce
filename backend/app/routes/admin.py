import logging
import re
import uuid
from datetime import datetime
from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from app.extensions import db
from app.models import (
    User, Order, OrderItem, Product, ProductVariant, ProductImage,
    Category, Coupon, Review
)
from app.utils import success_response, error_response, paginate, upload_image
from services.whatsapp import send_whatsapp_message

logger = logging.getLogger(__name__)

admin_bp = Blueprint("admin", __name__)


def _require_admin():
    """Return (user, error_response) tuple. error_response is None if user is admin."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return None, error_response("User not found", 404)
    if not user.is_admin:
        return None, error_response("Admin access required", 403)
    return user, None


def _slugify(text: str) -> str:
    """Convert text to a URL-safe slug."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip("-")


def _format_phone_for_whatsapp(phone: str) -> str:
    if not phone:
        return ""
    phone = phone.strip().replace(" ", "").replace("-", "")
    if phone.startswith("+"):
        phone = phone[1:]
    if not phone.startswith("91") and len(phone) == 10:
        phone = "91" + phone
    return phone


# ─── Dashboard ──────────────────────────────────────────────────────────────

@admin_bp.route("/dashboard", methods=["GET"])
@jwt_required()
def dashboard():
    try:
        _, err = _require_admin()
        if err:
            return err

        total_orders = Order.query.count()
        revenue_result = db.session.query(func.sum(Order.total)).filter(
            Order.payment_status == "paid"
        ).scalar()
        total_revenue = int(revenue_result or 0)
        total_users = User.query.count()
        total_products = Product.query.filter_by(is_active=True).count()

        recent_orders = (
            Order.query.order_by(Order.created_at.desc()).limit(10).all()
        )

        low_stock = (
            ProductVariant.query.filter(
                ProductVariant.stock_qty < 5, ProductVariant.is_active == True
            ).all()
        )

        low_stock_data = []
        for v in low_stock:
            low_stock_data.append({
                **v.to_dict(),
                "product_name": v.product.name if v.product else None,
            })

        return success_response({
            "total_orders": total_orders,
            "total_revenue": total_revenue,
            "total_users": total_users,
            "total_products": total_products,
            "recent_orders": [o.to_dict() for o in recent_orders],
            "low_stock_variants": low_stock_data,
        })

    except Exception as exc:
        logger.error("Dashboard error: %s", exc)
        return error_response("Could not load dashboard", 500)


# ─── Orders ─────────────────────────────────────────────────────────────────

@admin_bp.route("/orders", methods=["GET"])
@jwt_required()
def list_orders():
    try:
        _, err = _require_admin()
        if err:
            return err

        status = request.args.get("status", "").strip()
        payment_status = request.args.get("payment_status", "").strip()
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 20, type=int)

        query = Order.query.order_by(Order.created_at.desc())
        if status:
            query = query.filter(Order.status == status)
        if payment_status:
            query = query.filter(Order.payment_status == payment_status)

        result = paginate(query, page, per_page)
        return success_response({
            "orders": [o.to_dict() for o in result["items"]],
            "total": result["total"],
            "pages": result["pages"],
            "current_page": result["current_page"],
        })

    except Exception as exc:
        logger.error("Admin list orders error: %s", exc)
        return error_response("Could not retrieve orders", 500)


@admin_bp.route("/orders/<order_id>", methods=["GET"])
@jwt_required()
def get_order(order_id):
    try:
        _, err = _require_admin()
        if err:
            return err

        try:
            order_uuid = uuid.UUID(str(order_id))
        except (ValueError, AttributeError):
            return error_response("Invalid order_id", 400)

        order = Order.query.get(order_uuid)
        if not order:
            return error_response("Order not found", 404)

        return success_response(
            order.to_dict(include_items=True, include_address=True, include_user=True)
        )

    except Exception as exc:
        logger.error("Admin get order error: %s", exc)
        return error_response("Could not retrieve order", 500)


@admin_bp.route("/orders/<order_id>/status", methods=["PUT"])
@jwt_required()
def update_order_status(order_id):
    try:
        _, err = _require_admin()
        if err:
            return err

        try:
            order_uuid = uuid.UUID(str(order_id))
        except (ValueError, AttributeError):
            return error_response("Invalid order_id", 400)

        order = Order.query.get(order_uuid)
        if not order:
            return error_response("Order not found", 404)

        data = request.get_json()
        if not data:
            return error_response("Request body is required", 400)

        new_status = data.get("status", "").lower()
        valid_statuses = ("pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded")
        if new_status not in valid_statuses:
            return error_response(f"Invalid status. Must be one of: {', '.join(valid_statuses)}", 400)

        if new_status == "shipped":
            courier_name = data.get("courier_name", "").strip()
            tracking_url = data.get("tracking_url", "").strip()
            if not courier_name or not tracking_url:
                return error_response("courier_name and tracking_url are required for shipped status", 400)
            order.notes = f"Courier: {courier_name} | Tracking: {tracking_url}"

            # WhatsApp notification
            try:
                user = order.user
                wa_phone = _format_phone_for_whatsapp(user.phone or "")
                if wa_phone:
                    send_whatsapp_message(
                        to=wa_phone,
                        template_name="order_shipped",
                        variables=[user.name, str(order.id)[:8].upper(), courier_name, tracking_url],
                    )
            except Exception as wa_exc:
                logger.warning("WhatsApp shipped notification failed: %s", wa_exc)

        elif new_status == "delivered":
            try:
                user = order.user
                wa_phone = _format_phone_for_whatsapp(user.phone or "")
                if wa_phone:
                    send_whatsapp_message(
                        to=wa_phone,
                        template_name="order_delivered",
                        variables=[user.name, str(order.id)[:8].upper()],
                    )
            except Exception as wa_exc:
                logger.warning("WhatsApp delivered notification failed: %s", wa_exc)

        order.status = new_status
        db.session.commit()
        return success_response(order.to_dict(), "Order status updated")

    except Exception as exc:
        db.session.rollback()
        logger.error("Update order status error: %s", exc)
        return error_response("Could not update order status", 500)


# ─── Products ────────────────────────────────────────────────────────────────

@admin_bp.route("/products", methods=["GET"])
@jwt_required()
def list_products():
    try:
        _, err = _require_admin()
        if err:
            return err

        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 20, type=int)
        query = Product.query.order_by(Product.created_at.desc())
        result = paginate(query, page, per_page)

        return success_response({
            "products": [p.to_dict(include_variants=True) for p in result["items"]],
            "total": result["total"],
            "pages": result["pages"],
            "current_page": result["current_page"],
        })

    except Exception as exc:
        logger.error("Admin list products error: %s", exc)
        return error_response("Could not retrieve products", 500)


@admin_bp.route("/products", methods=["POST"])
@jwt_required()
def create_product():
    try:
        _, err = _require_admin()
        if err:
            return err

        data = request.get_json()
        if not data:
            return error_response("Request body is required", 400)

        name = data.get("name", "").strip()
        if not name:
            return error_response("name is required", 400)

        category_id = data.get("category_id")
        category_uuid = None
        if category_id:
            try:
                category_uuid = uuid.UUID(str(category_id))
            except (ValueError, AttributeError):
                return error_response("Invalid category_id", 400)

        # Generate unique slug
        base_slug = _slugify(name)
        slug = base_slug
        counter = 1
        while Product.query.filter_by(slug=slug).first():
            slug = f"{base_slug}-{counter}"
            counter += 1

        product = Product(
            name=name,
            slug=slug,
            category_id=category_uuid,
            description=data.get("description", ""),
            fabric=data.get("fabric", ""),
            fit_type=data.get("fit_type", ""),
            care_instructions=data.get("care_instructions", ""),
            is_active=bool(data.get("is_active", True)),
            is_featured=bool(data.get("is_featured", False)),
        )
        db.session.add(product)
        db.session.flush()

        # Create variants
        variants_data = data.get("variants", [])
        for v_data in variants_data:
            sku = v_data.get("sku", "").strip()
            if not sku:
                db.session.rollback()
                return error_response("Each variant must have a sku", 400)
            if ProductVariant.query.filter_by(sku=sku).first():
                db.session.rollback()
                return error_response(f"SKU '{sku}' already exists", 409)

            variant = ProductVariant(
                product_id=product.id,
                size=v_data.get("size", "").upper(),
                color=v_data.get("color", ""),
                color_hex=v_data.get("color_hex", ""),
                sku=sku,
                price=int(v_data.get("price", 0)),
                mrp=int(v_data.get("mrp", 0)),
                stock_qty=int(v_data.get("stock_qty", 0)),
                is_active=bool(v_data.get("is_active", True)),
            )
            db.session.add(variant)

        db.session.commit()
        return success_response(
            product.to_dict(include_variants=True),
            "Product created",
            201,
        )

    except Exception as exc:
        db.session.rollback()
        logger.error("Create product error: %s", exc)
        return error_response("Could not create product", 500)


@admin_bp.route("/products/<product_id>", methods=["PUT"])
@jwt_required()
def update_product(product_id):
    try:
        _, err = _require_admin()
        if err:
            return err

        try:
            product_uuid = uuid.UUID(str(product_id))
        except (ValueError, AttributeError):
            return error_response("Invalid product_id", 400)

        product = Product.query.get(product_uuid)
        if not product:
            return error_response("Product not found", 404)

        data = request.get_json()
        if not data:
            return error_response("Request body is required", 400)

        updatable_str = ["name", "description", "fabric", "fit_type", "care_instructions"]
        updatable_bool = ["is_active", "is_featured"]

        for field in updatable_str:
            if field in data:
                setattr(product, field, data[field])

        for field in updatable_bool:
            if field in data:
                setattr(product, field, bool(data[field]))

        if "category_id" in data:
            if data["category_id"]:
                try:
                    product.category_id = uuid.UUID(str(data["category_id"]))
                except (ValueError, AttributeError):
                    return error_response("Invalid category_id", 400)
            else:
                product.category_id = None

        if "name" in data and data["name"]:
            # Re-generate slug if name changed
            new_name = data["name"].strip()
            base_slug = _slugify(new_name)
            slug = base_slug
            counter = 1
            while True:
                existing = Product.query.filter_by(slug=slug).first()
                if not existing or existing.id == product.id:
                    break
                slug = f"{base_slug}-{counter}"
                counter += 1
            product.slug = slug

        db.session.commit()
        return success_response(product.to_dict(include_variants=True), "Product updated")

    except Exception as exc:
        db.session.rollback()
        logger.error("Update product error: %s", exc)
        return error_response("Could not update product", 500)


@admin_bp.route("/products/<product_id>", methods=["DELETE"])
@jwt_required()
def delete_product(product_id):
    try:
        _, err = _require_admin()
        if err:
            return err

        try:
            product_uuid = uuid.UUID(str(product_id))
        except (ValueError, AttributeError):
            return error_response("Invalid product_id", 400)

        product = Product.query.get(product_uuid)
        if not product:
            return error_response("Product not found", 404)

        product.is_active = False
        db.session.commit()
        return success_response(message="Product deactivated")

    except Exception as exc:
        db.session.rollback()
        logger.error("Delete product error: %s", exc)
        return error_response("Could not deactivate product", 500)


@admin_bp.route("/products/<product_id>/images", methods=["POST"])
@jwt_required()
def upload_product_image(product_id):
    try:
        _, err = _require_admin()
        if err:
            return err

        try:
            product_uuid = uuid.UUID(str(product_id))
        except (ValueError, AttributeError):
            return error_response("Invalid product_id", 400)

        product = Product.query.get(product_uuid)
        if not product:
            return error_response("Product not found", 404)

        if "file" not in request.files:
            return error_response("No file provided", 400)

        file = request.files["file"]
        if not file.filename:
            return error_response("No file selected", 400)

        url, public_id = upload_image(file)
        if not url:
            return error_response("Image upload failed", 500)

        variant_id_raw = request.form.get("variant_id")
        variant_uuid = None
        if variant_id_raw:
            try:
                variant_uuid = uuid.UUID(str(variant_id_raw))
            except (ValueError, AttributeError):
                return error_response("Invalid variant_id", 400)

        alt_text = request.form.get("alt_text", "").strip() or None
        is_primary = request.form.get("is_primary", "false").lower() in ("true", "1", "yes")

        # If new image is primary, demote others
        if is_primary:
            ProductImage.query.filter_by(product_id=product_uuid, is_primary=True).update(
                {"is_primary": False}
            )

        # Determine sort order
        max_order = db.session.query(func.max(ProductImage.sort_order)).filter_by(
            product_id=product_uuid
        ).scalar()
        sort_order = (max_order or 0) + 1

        image = ProductImage(
            product_id=product_uuid,
            variant_id=variant_uuid,
            url=url,
            cloudinary_public_id=public_id,
            alt_text=alt_text,
            sort_order=sort_order,
            is_primary=is_primary,
        )
        db.session.add(image)
        db.session.commit()
        return success_response(image.to_dict(), "Image uploaded", 201)

    except Exception as exc:
        db.session.rollback()
        logger.error("Upload product image error: %s", exc)
        return error_response("Could not upload image", 500)


@admin_bp.route("/products/<product_id>/variants", methods=["POST"])
@jwt_required()
def add_variant(product_id):
    try:
        _, err = _require_admin()
        if err:
            return err

        try:
            product_uuid = uuid.UUID(str(product_id))
        except (ValueError, AttributeError):
            return error_response("Invalid product_id", 400)

        product = Product.query.get(product_uuid)
        if not product:
            return error_response("Product not found", 404)

        data = request.get_json()
        if not data:
            return error_response("Request body is required", 400)

        sku = data.get("sku", "").strip()
        if not sku:
            return error_response("sku is required", 400)
        if ProductVariant.query.filter_by(sku=sku).first():
            return error_response(f"SKU '{sku}' already exists", 409)

        variant = ProductVariant(
            product_id=product_uuid,
            size=data.get("size", "").upper(),
            color=data.get("color", ""),
            color_hex=data.get("color_hex", ""),
            sku=sku,
            price=int(data.get("price", 0)),
            mrp=int(data.get("mrp", 0)),
            stock_qty=int(data.get("stock_qty", 0)),
            is_active=bool(data.get("is_active", True)),
        )
        db.session.add(variant)
        db.session.commit()
        return success_response(variant.to_dict(), "Variant added", 201)

    except Exception as exc:
        db.session.rollback()
        logger.error("Add variant error: %s", exc)
        return error_response("Could not add variant", 500)


@admin_bp.route("/variants/<variant_id>", methods=["PUT"])
@jwt_required()
def update_variant(variant_id):
    try:
        _, err = _require_admin()
        if err:
            return err

        try:
            variant_uuid = uuid.UUID(str(variant_id))
        except (ValueError, AttributeError):
            return error_response("Invalid variant_id", 400)

        variant = ProductVariant.query.get(variant_uuid)
        if not variant:
            return error_response("Variant not found", 404)

        data = request.get_json()
        if not data:
            return error_response("Request body is required", 400)

        updatable_int = ["price", "mrp", "stock_qty"]
        updatable_str = ["size", "color", "color_hex", "sku"]
        updatable_bool = ["is_active"]

        for field in updatable_int:
            if field in data:
                setattr(variant, field, int(data[field]))

        for field in updatable_str:
            if field in data:
                value = data[field]
                if field == "size":
                    value = value.upper()
                if field == "sku" and value != variant.sku:
                    if ProductVariant.query.filter_by(sku=value).first():
                        return error_response(f"SKU '{value}' already exists", 409)
                setattr(variant, field, value)

        for field in updatable_bool:
            if field in data:
                setattr(variant, field, bool(data[field]))

        db.session.commit()
        return success_response(variant.to_dict(), "Variant updated")

    except Exception as exc:
        db.session.rollback()
        logger.error("Update variant error: %s", exc)
        return error_response("Could not update variant", 500)


# ─── Categories ──────────────────────────────────────────────────────────────

@admin_bp.route("/categories", methods=["GET"])
@jwt_required()
def list_categories():
    try:
        _, err = _require_admin()
        if err:
            return err

        categories = Category.query.order_by(Category.sort_order.asc(), Category.name.asc()).all()
        return success_response([c.to_dict() for c in categories])

    except Exception as exc:
        logger.error("Admin list categories error: %s", exc)
        return error_response("Could not retrieve categories", 500)


@admin_bp.route("/categories", methods=["POST"])
@jwt_required()
def create_category():
    try:
        _, err = _require_admin()
        if err:
            return err

        data = request.get_json()
        if not data:
            return error_response("Request body is required", 400)

        name = data.get("name", "").strip()
        if not name:
            return error_response("name is required", 400)

        base_slug = _slugify(name)
        slug = base_slug
        counter = 1
        while Category.query.filter_by(slug=slug).first():
            slug = f"{base_slug}-{counter}"
            counter += 1

        category = Category(
            name=name,
            slug=slug,
            description=data.get("description", ""),
            image_url=data.get("image_url", ""),
            is_active=bool(data.get("is_active", True)),
            sort_order=int(data.get("sort_order", 0)),
        )
        db.session.add(category)
        db.session.commit()
        return success_response(category.to_dict(), "Category created", 201)

    except Exception as exc:
        db.session.rollback()
        logger.error("Create category error: %s", exc)
        return error_response("Could not create category", 500)


@admin_bp.route("/categories/<category_id>", methods=["PUT"])
@jwt_required()
def update_category(category_id):
    try:
        _, err = _require_admin()
        if err:
            return err

        try:
            category_uuid = uuid.UUID(str(category_id))
        except (ValueError, AttributeError):
            return error_response("Invalid category_id", 400)

        category = Category.query.get(category_uuid)
        if not category:
            return error_response("Category not found", 404)

        data = request.get_json()
        if not data:
            return error_response("Request body is required", 400)

        updatable_str = ["name", "description", "image_url"]
        updatable_bool = ["is_active"]

        for field in updatable_str:
            if field in data:
                setattr(category, field, data[field])

        for field in updatable_bool:
            if field in data:
                setattr(category, field, bool(data[field]))

        if "sort_order" in data:
            category.sort_order = int(data["sort_order"])

        if "name" in data and data["name"]:
            new_name = data["name"].strip()
            base_slug = _slugify(new_name)
            slug = base_slug
            counter = 1
            while True:
                existing = Category.query.filter_by(slug=slug).first()
                if not existing or existing.id == category.id:
                    break
                slug = f"{base_slug}-{counter}"
                counter += 1
            category.slug = slug

        db.session.commit()
        return success_response(category.to_dict(), "Category updated")

    except Exception as exc:
        db.session.rollback()
        logger.error("Update category error: %s", exc)
        return error_response("Could not update category", 500)


# ─── Coupons ─────────────────────────────────────────────────────────────────

@admin_bp.route("/coupons", methods=["GET"])
@jwt_required()
def list_coupons():
    try:
        _, err = _require_admin()
        if err:
            return err

        coupons = Coupon.query.order_by(Coupon.created_at.desc()).all()
        return success_response([c.to_dict() for c in coupons])

    except Exception as exc:
        logger.error("List coupons error: %s", exc)
        return error_response("Could not retrieve coupons", 500)


@admin_bp.route("/coupons", methods=["POST"])
@jwt_required()
def create_coupon():
    try:
        _, err = _require_admin()
        if err:
            return err

        data = request.get_json()
        if not data:
            return error_response("Request body is required", 400)

        code = data.get("code", "").strip().upper()
        if not code:
            return error_response("code is required", 400)

        if Coupon.query.filter_by(code=code).first():
            return error_response("Coupon code already exists", 409)

        discount_percent = data.get("discount_percent")
        discount_flat = data.get("discount_flat")

        if discount_percent is None and discount_flat is None:
            return error_response("Either discount_percent or discount_flat is required", 400)

        expires_at = None
        if data.get("expires_at"):
            try:
                expires_at = datetime.fromisoformat(data["expires_at"])
            except (ValueError, TypeError):
                return error_response("Invalid expires_at format. Use ISO 8601.", 400)

        coupon = Coupon(
            code=code,
            description=data.get("description", ""),
            discount_percent=float(discount_percent) if discount_percent is not None else None,
            discount_flat=int(discount_flat) if discount_flat is not None else None,
            min_order_value=int(data.get("min_order_value", 0)),
            max_uses=int(data["max_uses"]) if data.get("max_uses") is not None else None,
            is_active=bool(data.get("is_active", True)),
            expires_at=expires_at,
        )
        db.session.add(coupon)
        db.session.commit()
        return success_response(coupon.to_dict(), "Coupon created", 201)

    except Exception as exc:
        db.session.rollback()
        logger.error("Create coupon error: %s", exc)
        return error_response("Could not create coupon", 500)


@admin_bp.route("/coupons/<coupon_id>", methods=["PUT"])
@jwt_required()
def update_coupon(coupon_id):
    try:
        _, err = _require_admin()
        if err:
            return err

        try:
            coupon_uuid = uuid.UUID(str(coupon_id))
        except (ValueError, AttributeError):
            return error_response("Invalid coupon_id", 400)

        coupon = Coupon.query.get(coupon_uuid)
        if not coupon:
            return error_response("Coupon not found", 404)

        data = request.get_json()
        if not data:
            return error_response("Request body is required", 400)

        if "description" in data:
            coupon.description = data["description"]
        if "discount_percent" in data:
            coupon.discount_percent = float(data["discount_percent"]) if data["discount_percent"] is not None else None
        if "discount_flat" in data:
            coupon.discount_flat = int(data["discount_flat"]) if data["discount_flat"] is not None else None
        if "min_order_value" in data:
            coupon.min_order_value = int(data["min_order_value"])
        if "max_uses" in data:
            coupon.max_uses = int(data["max_uses"]) if data["max_uses"] is not None else None
        if "is_active" in data:
            coupon.is_active = bool(data["is_active"])
        if "expires_at" in data:
            if data["expires_at"]:
                try:
                    coupon.expires_at = datetime.fromisoformat(data["expires_at"])
                except (ValueError, TypeError):
                    return error_response("Invalid expires_at format. Use ISO 8601.", 400)
            else:
                coupon.expires_at = None

        db.session.commit()
        return success_response(coupon.to_dict(), "Coupon updated")

    except Exception as exc:
        db.session.rollback()
        logger.error("Update coupon error: %s", exc)
        return error_response("Could not update coupon", 500)


# ─── Users ───────────────────────────────────────────────────────────────────

@admin_bp.route("/users", methods=["GET"])
@jwt_required()
def list_users():
    try:
        _, err = _require_admin()
        if err:
            return err

        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 20, type=int)
        query = User.query.order_by(User.created_at.desc())
        result = paginate(query, page, per_page)

        return success_response({
            "users": [u.to_dict() for u in result["items"]],
            "total": result["total"],
            "pages": result["pages"],
            "current_page": result["current_page"],
        })

    except Exception as exc:
        logger.error("List users error: %s", exc)
        return error_response("Could not retrieve users", 500)
