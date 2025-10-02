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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

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
      
      // Use local server in development for better performance
      const baseUrl = process.env.NODE_ENV === 'development' && window.location.hostname === 'localhost' 
        ? 'http://localhost:2000'
        : 'https://tech-store-2.onrender.com';
      
      await fetch(`${baseUrl}/api/cart/${cartId}/items`, {
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

  // Optimized data loading function
  const loadData = async (attempt = 1) => {
    try {
      console.log(`Loading data - attempt ${attempt}`);
      setLoading(true);
      setError(null);
      
      const startTime = Date.now();
      
      // Use local server in development for better performance
      const baseUrl = process.env.NODE_ENV === 'development' && window.location.hostname === 'localhost' 
        ? 'http://localhost:2000'
        : 'https://tech-store-2.onrender.com';
      
      // Use the new optimized endpoint that fetches both products and categories
      const response = await fetch(`${baseUrl}/api/initial-data`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const loadTime = Date.now() - startTime;
      
      console.log(`Data loaded in ${loadTime}ms from ${baseUrl}`, {
        cached: data.cached,
        products: data.products?.length || 0,
        categories: data.categories?.length || 0
      });
      
      setProducts(Array.isArray(data.products) ? data.products : []);
      setCategories(Array.isArray(data.categories) ? data.categories : []);
      setRetryCount(0); // Reset retry count on success
      
    } catch (e) {
      console.error(`Failed to load data (attempt ${attempt}):`, e);
      setError(e.message);
      
      // Auto-retry with exponential backoff for first few attempts
      if (attempt < 3) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`Retrying in ${delay}ms...`);
        setTimeout(() => {
          setRetryCount(attempt);
          loadData(attempt + 1);
        }, delay);
      } else {
        // Final attempt - try individual endpoints as fallback
        try {
          console.log('Trying fallback individual endpoints...');
          const baseUrl = process.env.NODE_ENV === 'development' && window.location.hostname === 'localhost' 
            ? 'http://localhost:2000'
            : 'https://tech-store-2.onrender.com';
          const [resP, resC] = await Promise.all([
            fetch(`${baseUrl}/api/products`),
            fetch(`${baseUrl}/api/categories`),
          ]);
          const [dataP, dataC] = await Promise.all([resP.json(), resC.json()]);
          setProducts(Array.isArray(dataP) ? dataP : []);
          setCategories(Array.isArray(dataC) ? dataC : []);
          setError(null);
        } catch (fallbackError) {
          console.error("Fallback also failed:", fallbackError);
          setProducts([]);
          setCategories([]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Manual retry function
  const handleRetry = () => {
    loadData();
  };

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
            
            {/* Loading State */}
            {loading && (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ 
                  display: 'inline-block', 
                  width: '40px', 
                  height: '40px', 
                  border: '4px solid #f3f3f3',
                  borderTop: '4px solid #3498db',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginBottom: '1rem'
                }} />
                <p>Loading products...</p>
                {retryCount > 0 && <p style={{ color: '#666' }}>Retry attempt {retryCount}</p>}
              </div>
            )}
            
            {/* Error State */}
            {error && !loading && (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem',
                backgroundColor: '#ffe6e6',
                border: '1px solid #ff9999',
                borderRadius: '8px',
                margin: '1rem 0'
              }}>
                <p style={{ color: '#cc0000', marginBottom: '1rem' }}>
                  Failed to load products: {error}
                </p>
                <button 
                  onClick={handleRetry}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Retry
                </button>
              </div>
            )}
            
            {/* Filters and Content */}
            {!loading && (
              <>
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
                    !error && <p>No products available.</p>
                  )}
                </ul>
              </>
            )}
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
