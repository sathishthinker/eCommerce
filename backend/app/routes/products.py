import logging
from flask import Blueprint, request
from sqlalchemy import func, or_
from app.extensions import db
from app.models import Product, ProductVariant, ProductImage, Category
from app.utils import success_response, error_response, paginate

logger = logging.getLogger(__name__)

products_bp = Blueprint("products", __name__)


def _product_list_item(product):
    """Serialize a product for list views."""
    return {
        "id": str(product.id),
        "name": product.name,
        "slug": product.slug,
        "min_price": product.min_price,
        "primary_image_url": product.primary_image,
        "fit_type": product.fit_type,
        "is_featured": product.is_featured,
        "category_id": str(product.category_id) if product.category_id else None,
    }


@products_bp.route("/", methods=["GET"])
def list_products():
    """
    List active products with filtering and sorting.
    Query params: category, search, min_price, max_price, size, color,
                  sort (price_asc/price_desc/newest/featured), page, per_page
    """
    try:
        category_slug = request.args.get("category", "").strip()
        search = request.args.get("search", "").strip()
        min_price = request.args.get("min_price", type=int)
        max_price = request.args.get("max_price", type=int)
        size = request.args.get("size", "").strip()
        color = request.args.get("color", "").strip()
        sort = request.args.get("sort", "newest")
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 20, type=int)

        # Base query — only active products
        query = Product.query.filter_by(is_active=True)

        # Category filter
        if category_slug:
            query = query.join(Category, Product.category_id == Category.id).filter(
                Category.slug == category_slug, Category.is_active == True
            )

        # Search filter
        if search:
            query = query.filter(Product.name.ilike(f"%{search}%"))

        # Price / size / color filters require joining variants
        if min_price is not None or max_price is not None or size or color:
            query = query.join(ProductVariant, Product.id == ProductVariant.product_id).filter(
                ProductVariant.is_active == True
            )
            if min_price is not None:
                query = query.filter(ProductVariant.price >= min_price)
            if max_price is not None:
                query = query.filter(ProductVariant.price <= max_price)
            if size:
                query = query.filter(ProductVariant.size == size.upper())
            if color:
                query = query.filter(ProductVariant.color.ilike(f"%{color}%"))
            query = query.distinct()

        # Sorting
        if sort == "price_asc":
            # Subquery for min price
            min_price_sub = (
                db.session.query(
                    ProductVariant.product_id,
                    func.min(ProductVariant.price).label("min_p"),
                )
                .filter(ProductVariant.is_active == True)
                .group_by(ProductVariant.product_id)
                .subquery()
            )
            query = query.outerjoin(
                min_price_sub, Product.id == min_price_sub.c.product_id
            ).order_by(min_price_sub.c.min_p.asc().nullslast())
        elif sort == "price_desc":
            min_price_sub = (
                db.session.query(
                    ProductVariant.product_id,
                    func.min(ProductVariant.price).label("min_p"),
                )
                .filter(ProductVariant.is_active == True)
                .group_by(ProductVariant.product_id)
                .subquery()
            )
            query = query.outerjoin(
                min_price_sub, Product.id == min_price_sub.c.product_id
            ).order_by(min_price_sub.c.min_p.desc().nullslast())
        elif sort == "featured":
            query = query.order_by(Product.is_featured.desc(), Product.created_at.desc())
        else:  # newest
            query = query.order_by(Product.created_at.desc())

        result = paginate(query, page, per_page)
        items = [_product_list_item(p) for p in result["items"]]

        return success_response({
            "products": items,
            "total": result["total"],
            "pages": result["pages"],
            "current_page": result["current_page"],
            "per_page": result["per_page"],
            "has_next": result["has_next"],
            "has_prev": result["has_prev"],
        })

    except Exception as exc:
        logger.error("List products error: %s", exc)
        return error_response("Could not retrieve products", 500)


@products_bp.route("/categories", methods=["GET"])
def list_categories():
    """List all active categories ordered by sort_order."""
    try:
        categories = (
            Category.query.filter_by(is_active=True)
            .order_by(Category.sort_order.asc(), Category.name.asc())
            .all()
        )
        return success_response([c.to_dict() for c in categories])

    except Exception as exc:
        logger.error("List categories error: %s", exc)
        return error_response("Could not retrieve categories", 500)


@products_bp.route("/categories/<slug>", methods=["GET"])
def get_category(slug):
    """Get a single active category with its products."""
    try:
        category = Category.query.filter_by(slug=slug, is_active=True).first()
        if not category:
            return error_response("Category not found", 404)

        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 20, type=int)

        products_query = Product.query.filter_by(
            category_id=category.id, is_active=True
        ).order_by(Product.created_at.desc())

        result = paginate(products_query, page, per_page)

        data = category.to_dict()
        data["products"] = [_product_list_item(p) for p in result["items"]]
        data["total"] = result["total"]
        data["pages"] = result["pages"]
        data["current_page"] = result["current_page"]

        return success_response(data)

    except Exception as exc:
        logger.error("Get category error: %s", exc)
        return error_response("Could not retrieve category", 500)


@products_bp.route("/<slug>", methods=["GET"])
def get_product(slug):
    """Get product detail with all variants and images."""
    try:
        product = Product.query.filter_by(slug=slug, is_active=True).first()
        if not product:
            return error_response("Product not found", 404)

        data = product.to_dict(include_variants=True, include_images=True)

        # Include category info
        if product.category:
            data["category"] = product.category.to_dict()

        # Include review summary
        reviews = product.reviews.all()
        if reviews:
            avg_rating = sum(r.rating for r in reviews) / len(reviews)
            data["review_summary"] = {
                "count": len(reviews),
                "average": round(avg_rating, 1),
            }
        else:
            data["review_summary"] = {"count": 0, "average": None}

        return success_response(data)

    except Exception as exc:
        logger.error("Get product error: %s", exc)
        return error_response("Could not retrieve product", 500)
