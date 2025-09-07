import React, { useState, useEffect } from "react";
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

  // Minimal placeholder to avoid no-undef; integrate API later
  const handleAddToCart = (product) => {
    // no-op for now
  };
  
  


  useEffect(() => {
    // Load products and categories from backend API
    const load = async () => {
      try {
        const [resP, resC] = await Promise.all([
          fetch("https://tech-store-navy.vercel.app:2000/api/products"),
          fetch("https://tech-store-navy.vercel.app:2000/api/categories"),
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
                  .filter((p) => !selectedCategory || p.categoryId === selectedCategory)
                  .filter((p) => {
                    const q = searchQuery.trim().toLowerCase();
                    if (!q) return true;
                    const name = String(p.name || p.dish_Name || '').toLowerCase();
                    return name.includes(q);
                  })
                  .sort((a, b) => {
                    if (!sortOrder) return 0;
                    const pa = Number(a.price) || 0;
                    const pb = Number(b.price) || 0;
                    return sortOrder === 'asc' ? pa - pb : pb - pa;
                  })
                  .map((product) => (
                    <li key={product.productId} className="food" style={{ listStyle: 'none' }}>
                      <ProductCard product={product} onAdd={() => { /* TODO: implement add-to-cart here or navigate to Cart */ }} />
                    </li>
                  ))
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
