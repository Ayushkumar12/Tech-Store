import React from "react";

// Reusable product card component
function ProductCard({ product, onAdd }) {
  const name = String(product?.name || product?.dish_Name || "Unnamed");
  const priceRaw = product?.price ?? product?.dish_Price ?? 0;
  const price = Number(priceRaw);
  const category = product?.categoryName || "";
  const imageUrl = product?.imageUrl || "";

  const formattedPrice = isNaN(price) ? "-" : price.toFixed(2);

  return (
    <article className="product-card" aria-label={name}>
      <div className="product-image">
        {/* Use background color as subtle placeholder */}
        {imageUrl ? (
          <img src={imageUrl} alt={name} loading="lazy" />
        ) : (
          <div className="product-image__placeholder" aria-hidden="true">No Image</div>
        )}
      </div>

      <div className="product-content">
        <h3 className="product-title" title={name}>{name}</h3>
        {category ? (
          <span className="badge" title={category}>{category}</span>
        ) : null}
      </div>

      <div className="product-footer">
        <span className="price">${formattedPrice}</span>
        <button className="add-btn" onClick={onAdd} type="button">
          Add to Cart
        </button>
      </div>
    </article>
  );
}

export default ProductCard;