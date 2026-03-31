import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy import UniqueConstraint
from app.extensions import db, bcrypt


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(20), nullable=True)  # stored with +91
    is_admin = db.Column(db.Boolean, default=False, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    email_verified = db.Column(db.Boolean, default=False, nullable=False)
    phone_verified = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    addresses = db.relationship("Address", backref="user", lazy="dynamic", cascade="all, delete-orphan")
    cart_items = db.relationship("CartItem", backref="user", lazy="dynamic", cascade="all, delete-orphan")
    wishlist_items = db.relationship("Wishlist", backref="user", lazy="dynamic", cascade="all, delete-orphan")
    orders = db.relationship("Order", backref="user", lazy="dynamic")
    reviews = db.relationship("Review", backref="user", lazy="dynamic")

    def check_password(self, password: str) -> bool:
        return bcrypt.check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": str(self.id),
            "email": self.email,
            "name": self.name,
            "phone": self.phone,
            "is_admin": self.is_admin,
            "is_active": self.is_active,
            "email_verified": self.email_verified,
            "phone_verified": self.phone_verified,
            "created_at": self.created_at.isoformat(),
        }


class Address(db.Model):
    __tablename__ = "addresses"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    line1 = db.Column(db.String(500), nullable=False)
    line2 = db.Column(db.String(500), nullable=True)
    city = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(100), nullable=False)
    pincode = db.Column(db.String(10), nullable=False)
    is_default = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "name": self.name,
            "phone": self.phone,
            "line1": self.line1,
            "line2": self.line2,
            "city": self.city,
            "state": self.state,
            "pincode": self.pincode,
            "is_default": self.is_default,
            "created_at": self.created_at.isoformat(),
        }


class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(255), nullable=False)
    slug = db.Column(db.String(255), unique=True, nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    image_url = db.Column(db.String(500), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    sort_order = db.Column(db.Integer, default=0, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    products = db.relationship("Product", backref="category", lazy="dynamic")

    def to_dict(self):
        return {
            "id": str(self.id),
            "name": self.name,
            "slug": self.slug,
            "description": self.description,
            "image_url": self.image_url,
            "is_active": self.is_active,
            "sort_order": self.sort_order,
            "created_at": self.created_at.isoformat(),
        }


class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category_id = db.Column(UUID(as_uuid=True), db.ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    name = db.Column(db.String(255), nullable=False)
    slug = db.Column(db.String(255), unique=True, nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    fabric = db.Column(db.String(255), nullable=True)
    fit_type = db.Column(db.String(50), nullable=True)  # slim/regular/oversized
    care_instructions = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_featured = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    variants = db.relationship("ProductVariant", backref="product", lazy="dynamic", cascade="all, delete-orphan")
    images = db.relationship("ProductImage", backref="product", lazy="dynamic", cascade="all, delete-orphan")
    wishlist_items = db.relationship("Wishlist", backref="product", lazy="dynamic")
    reviews = db.relationship("Review", backref="product", lazy="dynamic")

    @hybrid_property
    def min_price(self):
        active_variants = [v for v in self.variants if v.is_active and v.stock_qty > 0]
        if not active_variants:
            # Fall back to all active variants regardless of stock
            active_variants = [v for v in self.variants if v.is_active]
        if not active_variants:
            return None
        return min(v.price for v in active_variants)

    @hybrid_property
    def primary_image(self):
        primary = next((img for img in self.images if img.is_primary), None)
        if not primary:
            primary = next(iter(self.images), None)
        return primary.url if primary else None

    def to_dict(self, include_variants=False, include_images=False):
        data = {
            "id": str(self.id),
            "category_id": str(self.category_id) if self.category_id else None,
            "name": self.name,
            "slug": self.slug,
            "description": self.description,
            "fabric": self.fabric,
            "fit_type": self.fit_type,
            "care_instructions": self.care_instructions,
            "is_active": self.is_active,
            "is_featured": self.is_featured,
            "min_price": self.min_price,
            "primary_image_url": self.primary_image,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
        if include_variants:
            data["variants"] = [v.to_dict() for v in self.variants]
        if include_images:
            data["images"] = [img.to_dict() for img in self.images.order_by(ProductImage.sort_order)]
        return data


class ProductVariant(db.Model):
    __tablename__ = "product_variants"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = db.Column(UUID(as_uuid=True), db.ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    size = db.Column(db.String(10), nullable=False)  # S/M/L/XL/XXL
    color = db.Column(db.String(100), nullable=False)
    color_hex = db.Column(db.String(10), nullable=True)
    sku = db.Column(db.String(100), unique=True, nullable=False, index=True)
    price = db.Column(db.Integer, nullable=False)   # in paise
    mrp = db.Column(db.Integer, nullable=False)     # in paise
    stock_qty = db.Column(db.Integer, default=0, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    # Relationships
    cart_items = db.relationship("CartItem", backref="variant", lazy="dynamic")
    order_items = db.relationship("OrderItem", backref="variant", lazy="dynamic")
    images = db.relationship("ProductImage", backref="variant", lazy="dynamic", foreign_keys="ProductImage.variant_id")

    def to_dict(self):
        return {
            "id": str(self.id),
            "product_id": str(self.product_id),
            "size": self.size,
            "color": self.color,
            "color_hex": self.color_hex,
            "sku": self.sku,
            "price": self.price,
            "mrp": self.mrp,
            "stock_qty": self.stock_qty,
            "is_active": self.is_active,
        }


class ProductImage(db.Model):
    __tablename__ = "product_images"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = db.Column(UUID(as_uuid=True), db.ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    variant_id = db.Column(UUID(as_uuid=True), db.ForeignKey("product_variants.id", ondelete="SET NULL"), nullable=True, index=True)
    url = db.Column(db.String(500), nullable=False)
    cloudinary_public_id = db.Column(db.String(255), nullable=True)
    alt_text = db.Column(db.String(255), nullable=True)
    sort_order = db.Column(db.Integer, default=0, nullable=False)
    is_primary = db.Column(db.Boolean, default=False, nullable=False)

    def to_dict(self):
        return {
            "id": str(self.id),
            "product_id": str(self.product_id),
            "variant_id": str(self.variant_id) if self.variant_id else None,
            "url": self.url,
            "cloudinary_public_id": self.cloudinary_public_id,
            "alt_text": self.alt_text,
            "sort_order": self.sort_order,
            "is_primary": self.is_primary,
        }


class CartItem(db.Model):
    __tablename__ = "cart_items"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    variant_id = db.Column(UUID(as_uuid=True), db.ForeignKey("product_variants.id", ondelete="CASCADE"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    added_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "variant_id", name="uq_cart_user_variant"),
    )

    def to_dict(self):
        variant = self.variant
        product = variant.product if variant else None
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "variant_id": str(self.variant_id),
            "quantity": self.quantity,
            "added_at": self.added_at.isoformat(),
            "variant": variant.to_dict() if variant else None,
            "product": {
                "id": str(product.id),
                "name": product.name,
                "slug": product.slug,
                "primary_image_url": product.primary_image,
            } if product else None,
        }


class Wishlist(db.Model):
    __tablename__ = "wishlists"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = db.Column(UUID(as_uuid=True), db.ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    added_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "product_id", name="uq_wishlist_user_product"),
    )

    def to_dict(self):
        product = self.product
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "product_id": str(self.product_id),
            "added_at": self.added_at.isoformat(),
            "product": product.to_dict() if product else None,
        }


class Order(db.Model):
    __tablename__ = "orders"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    address_id = db.Column(UUID(as_uuid=True), db.ForeignKey("addresses.id", ondelete="RESTRICT"), nullable=False)
    status = db.Column(
        db.String(50),
        default="pending",
        nullable=False,
        index=True,
    )  # pending/confirmed/processing/shipped/delivered/cancelled/refunded
    payment_status = db.Column(
        db.String(50),
        default="pending",
        nullable=False,
    )  # pending/paid/failed/refunded
    payment_method = db.Column(db.String(50), nullable=False)  # razorpay/cod
    subtotal = db.Column(db.Integer, nullable=False)            # paise
    discount = db.Column(db.Integer, default=0, nullable=False) # paise
    delivery_fee = db.Column(db.Integer, default=0, nullable=False)  # paise
    total = db.Column(db.Integer, nullable=False)               # paise
    coupon_code = db.Column(db.String(100), nullable=True)
    razorpay_order_id = db.Column(db.String(255), nullable=True, index=True)
    razorpay_payment_id = db.Column(db.String(255), nullable=True)
    razorpay_signature = db.Column(db.String(500), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    items = db.relationship("OrderItem", backref="order", lazy="dynamic", cascade="all, delete-orphan")
    payments = db.relationship("Payment", backref="order", lazy="dynamic")
    address = db.relationship("Address", backref="orders", foreign_keys=[address_id])
    reviews = db.relationship("Review", backref="order", lazy="dynamic")

    def to_dict(self, include_items=False, include_address=False, include_user=False):
        data = {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "address_id": str(self.address_id),
            "status": self.status,
            "payment_status": self.payment_status,
            "payment_method": self.payment_method,
            "subtotal": self.subtotal,
            "discount": self.discount,
            "delivery_fee": self.delivery_fee,
            "total": self.total,
            "coupon_code": self.coupon_code,
            "razorpay_order_id": self.razorpay_order_id,
            "razorpay_payment_id": self.razorpay_payment_id,
            "notes": self.notes,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
        if include_items:
            data["items"] = [item.to_dict() for item in self.items]
        if include_address:
            data["address"] = self.address.to_dict() if self.address else None
        if include_user:
            data["user"] = self.user.to_dict() if self.user else None
        return data


class OrderItem(db.Model):
    __tablename__ = "order_items"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = db.Column(UUID(as_uuid=True), db.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    variant_id = db.Column(UUID(as_uuid=True), db.ForeignKey("product_variants.id", ondelete="RESTRICT"), nullable=False)
    product_name = db.Column(db.String(255), nullable=False)   # snapshot
    variant_info = db.Column(db.String(100), nullable=False)   # snapshot e.g. "L / White"
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Integer, nullable=False)         # paise
    total_price = db.Column(db.Integer, nullable=False)        # paise

    def to_dict(self):
        return {
            "id": str(self.id),
            "order_id": str(self.order_id),
            "variant_id": str(self.variant_id),
            "product_name": self.product_name,
            "variant_info": self.variant_info,
            "quantity": self.quantity,
            "unit_price": self.unit_price,
            "total_price": self.total_price,
        }


class Payment(db.Model):
    __tablename__ = "payments"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = db.Column(UUID(as_uuid=True), db.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    razorpay_payment_id = db.Column(db.String(255), nullable=True)
    razorpay_order_id = db.Column(db.String(255), nullable=True)
    amount = db.Column(db.Integer, nullable=False)  # paise
    status = db.Column(db.String(50), nullable=False)  # created/captured/failed/refunded
    method = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": str(self.id),
            "order_id": str(self.order_id),
            "razorpay_payment_id": self.razorpay_payment_id,
            "razorpay_order_id": self.razorpay_order_id,
            "amount": self.amount,
            "status": self.status,
            "method": self.method,
            "created_at": self.created_at.isoformat(),
        }


class Coupon(db.Model):
    __tablename__ = "coupons"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = db.Column(db.String(100), unique=True, nullable=False, index=True)
    description = db.Column(db.String(500), nullable=True)
    discount_percent = db.Column(db.Float, nullable=True)
    discount_flat = db.Column(db.Integer, nullable=True)  # paise
    min_order_value = db.Column(db.Integer, default=0, nullable=False)  # paise
    max_uses = db.Column(db.Integer, nullable=True)
    used_count = db.Column(db.Integer, default=0, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": str(self.id),
            "code": self.code,
            "description": self.description,
            "discount_percent": self.discount_percent,
            "discount_flat": self.discount_flat,
            "min_order_value": self.min_order_value,
            "max_uses": self.max_uses,
            "used_count": self.used_count,
            "is_active": self.is_active,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "created_at": self.created_at.isoformat(),
        }


class Review(db.Model):
    __tablename__ = "reviews"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = db.Column(UUID(as_uuid=True), db.ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    order_id = db.Column(UUID(as_uuid=True), db.ForeignKey("orders.id", ondelete="SET NULL"), nullable=True)
    rating = db.Column(db.Integer, nullable=False)  # 1-5
    title = db.Column(db.String(255), nullable=True)
    body = db.Column(db.Text, nullable=True)
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "product_id", name="uq_review_user_product"),
    )

    def to_dict(self):
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "product_id": str(self.product_id),
            "order_id": str(self.order_id) if self.order_id else None,
            "rating": self.rating,
            "title": self.title,
            "body": self.body,
            "is_verified": self.is_verified,
            "created_at": self.created_at.isoformat(),
        }
