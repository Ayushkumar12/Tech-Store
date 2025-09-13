import React, { useState, useEffect, useMemo } from "react";
import Footer from '../comp/Footer';
import Navbar from "../comp/Navbar";
import ProductCard from "../comp/ProductCard";
import "../asserts/style/home.css";
function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [searchQuery, setSearchQuery] = useState("");


  const [clickEffect] = useState(false);

  // simple cartId for now
  const cartId = useMemo(() => "default", []);

  // Hook up add-to-cart to backend cart API used by Cart.jsx
  const handleAddToCart = async (product) => {
    try {
      const productId = product.productId || product.dish_Id || product.id || product._id;
      const name = String(product.name || product.dish_Name || "Unnamed");
      const price = Number(product.price ?? product.dish_Price ?? 0) || 0;
      if (!productId) { console.warn("Missing productId for add-to-cart"); return; }
      await fetch(`https://tech-store-2.onrender.com/api/cart/${cartId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, name, price, quantity: 1 })
      });
      // Optionally show feedback
      // alert(`${name} added to cart`);
    } catch (e) {
      console.error("Failed to add to cart", e);
    }
  };
  
  


  useEffect(() => {
    // Load products and categories from backend API
    const load = async () => {
      try {
        const [resP, resC] = await Promise.all([
          fetch("https://tech-store-2.onrender.com/api/products"),
          fetch("https://tech-store-2.onrender.com/api/categories"),
        ]);
        const [dataP, dataC] = await Promise.all([resP.json(), resC.json()]);
        setProducts(Array.isArray(dataP) ? dataP : []);
        setCategories(Array.isArray(dataC) ? dataC : []);
      } catch (e) {
        console.error("Failed to load products/categories", e);
        setProducts([]);
        setCategories([]);
      }
    };
    load();
  }, []);

  return (
    <section>
      <Navbar/>
      <main>
        <section className="first">
          <div className="herotext">
            <h1>Tech Store</h1>
          </div>
        </section>
        <section className="home">
          <div className="collection">
            <h2>Products</h2>
            <div className="filters" style={{ display: 'flex', gap: '12px', margin: '12px 0' }}>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <input type="text" placeholder="Search products" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                <option value="">Sort by</option>
                <option value="asc">Price: Low to High</option>
                <option value="desc">Price: High to Low</option>
              </select>
            </div>
            <ul className="menu">
              {Array.isArray(products) && products.length > 0 ? (
                products
                  .filter((p) => {
                    if (!selectedCategory) return true;
                    const pid = String(p.categoryId ?? p.category?.id ?? "");
                    return String(selectedCategory) === pid;
                  })
                  .filter((p) => {
                    const q = searchQuery.trim().toLowerCase();
                    if (!q) return true;
                    const nm = String(p.name || p.dish_Name || "").toLowerCase();
                    return nm.includes(q);
                  })
                  .sort((a, b) => {
                    if (!sortOrder) return 0;
                    const pa = Number(a.price ?? a.dish_Price) || 0;
                    const pb = Number(b.price ?? b.dish_Price) || 0;
                    return sortOrder === 'asc' ? pa - pb : pb - pa;
                  })
                  .map((product) => {
                    const key = product.productId || product.dish_Id || product.id || product._id || Math.random();
                    return (
                      <li key={key} className="food" style={{ listStyle: 'none' }}>
                        <ProductCard product={product} onAdd={() => handleAddToCart(product)} />
                      </li>
                    );
                  })

              ) : (
                <p>No products available.</p>
              )}
            </ul>
          </div>
          <div className={`cart-head ${clickEffect ? 'click-effect' : ''}`}
>
              <h1>Order Now</h1>
          </div>
            {/* Cart UI was removed. Please use the Cart page from the navbar. */}
        </section>
      </main>
      <Footer/>
    </section>
  );
}

export default Home;
