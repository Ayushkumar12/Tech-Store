import React from "react";

function ProductCard({ product, onAdd }) {
  const name = String(product?.name || product?.dish_Name || "Unnamed");
  const priceRaw = product?.price ?? product?.dish_Price ?? 0;
  const price = Number(priceRaw);
  const category = product?.categoryName || product?.category?.name || "";
  const imageUrl =
    product?.imageUrl || product?.image || product?.imgUrl || product?.imageURL || "";

  const formattedPrice = Number.isFinite(price)
    ? new Intl.NumberFormat(undefined, { style: "currency", currency: "INR" }).format(price)
    : "-";

  return (
    <article className="product-card surface" aria-label={name}>
      <div className="product-card__image">
        {imageUrl ? (
          <img src={imageUrl} alt={name} loading="lazy" />
        ) : (
          <div className="product-card__placeholder" aria-hidden="true">No Image</div>
        )}
      </div>
      <div className="product-card__body">
        <div className="product-card__header">
          <h3 className="product-card__title" title={name}>{name}</h3>
          {category ? <span className="badge" title={category}>{category}</span> : null}
        </div>
        <div className="product-card__footer">
          <span className="product-card__price">{formattedPrice}</span>
          <button
            className="product-card__button"
            onClick={() => onAdd && onAdd()}
            type="button"
            aria-label={`Add ${name} to cart`}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
