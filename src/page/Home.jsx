import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../comp/Footer";
import Navbar from "../comp/Navbar";
import ProductCard from "../comp/ProductCard";
import "../asserts/style/home.css";
import { useAuth } from "../Authentication/Authpro";

function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const { currentUser, loading: authLoading } = useAuth();

  const cartId = useMemo(() => {
    if (!currentUser) return null;
    return currentUser.uid || String(currentUser.email || "").replace(/[^a-z0-9]/gi, "");
  }, [currentUser]);

  const handleAddToCart = async (product) => {
    try {
      if (authLoading) {
        alert("Please wait, we are still signing you in.");
        return;
      }

      if (!currentUser || !cartId) {
        alert("Log in to add items to your cart.");
        return;
      }

      const productId = product.id;
      const name = String(product.name);
      const price = Number(product.price ?? 0) || 0;
      if (!productId) return;

      await fetch(`https://tech-store-txuf.onrender.com/api/cart/${cartId}/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, name, price, quantity: 1 })
      });
    } catch (e) {
      alert("Unable to add to cart right now.");
    }
  };

  const loadData = async (attempt = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`https://tech-store-txuf.onrender.com/api/initial-data`, {
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache"
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setProducts(Array.isArray(data.products) ? data.products : []);
      setCategories(Array.isArray(data.categories) ? data.categories : []);
      setRetryCount(0);
    } catch (e) {
      setError(e.message);

      if (attempt < 3) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        setTimeout(() => {
          setRetryCount(attempt);
          loadData(attempt + 1);
        }, delay);
      } else {
        try {
          const [resP, resC] = await Promise.all([
            fetch(`https://tech-store-txuf.onrender.com/api/products`),
            fetch(`https://tech-store-txuf.onrender.com/api/categories`)
          ]);
          const [dataP, dataC] = await Promise.all([resP.json(), resC.json()]);
          setProducts(Array.isArray(dataP) ? dataP : []);
          setCategories(Array.isArray(dataC) ? dataC : []);
          setError(null);
        } catch (fallbackError) {
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
  }, []);

  const handleRetry = () => {
    loadData();
  };

  const filteredProducts = useMemo(() => {
    const list = Array.isArray(products) ? products : [];
    return list
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
        return sortOrder === "asc" ? pa - pb : pb - pa;
      });
  }, [products, selectedCategory, searchQuery, sortOrder]);

  const isEmpty = !loading && !error && filteredProducts.length === 0;

  return (
    <div className="home-page">
      <Navbar />
      <main className="home-page__main">
        <section className="home-hero section">
          <div className="layout-container home-hero__inner">
            <div className="home-hero__content">
              <span className="home-hero__eyebrow">Curated tech essentials</span>
              <h1>Design your dream workspace</h1>
              <p className="text-muted">
                Discover premium gadgets, peripherals, and accessories selected to elevate every workflow.
              </p>
              <div className="home-hero__actions">
                <a className="btn-primary" href="#catalog">Shop collection</a>
                <Link className="btn-secondary" to="/seller">Become a seller</Link>
              </div>
            </div>
            <div className="home-hero__metrics">
              <div className="metric-card surface surface--inset">
                <span className="metric-card__value">{products.length}</span>
                <span className="metric-card__label">Products curated</span>
              </div>
              <div className="metric-card surface surface--inset">
                <span className="metric-card__value">{categories.length}</span>
                <span className="metric-card__label">Categories to explore</span>
              </div>
              <div className="metric-card surface surface--inset">
                <span className="metric-card__value">{loading ? "Syncing" : "Live"}</span>
                <span className="metric-card__label">Inventory status</span>
              </div>
            </div>
          </div>
        </section>

        <section id="catalog" className="home-catalog section">
          <div className="layout-container stack-lg">
            <div className="home-catalog__header">
              <div>
                <h2>Shop the latest drops</h2>
                <p className="text-muted">Filter by category, search by name, or sort by price to find the perfect fit.</p>
              </div>
            </div>

            <div className="home-catalog__filters surface surface--inset" id="filters">
              <div className="filter-field">
                <label htmlFor="category">Category</label>
                <select id="category" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                  <option value="">All categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="filter-field">
                <label htmlFor="search">Search</label>
                <input
                  id="search"
                  type="text"
                  placeholder="Search products"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="filter-field">
                <label htmlFor="sort">Sort by</label>
                <select id="sort" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                  <option value="">Recommended</option>
                  <option value="asc">Price: Low to High</option>
                  <option value="desc">Price: High to Low</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="home-catalog__state surface surface--inset" role="status">
                <span className="home-catalog__spinner" aria-hidden="true" />
                <p>Loading products...</p>
                {retryCount > 0 && <p className="text-muted">Retry attempt {retryCount}</p>}
              </div>
            ) : error ? (
              <div className="home-catalog__state surface surface--inset" role="alert">
                <h3>We hit a speed bump</h3>
                <p className="text-muted">{`Failed to load products: ${error}`}</p>
                <button type="button" className="btn-primary" onClick={handleRetry}>Retry</button>
              </div>
            ) : isEmpty ? (
              <div className="home-catalog__state surface surface--inset">
                <h3>No products just yet</h3>
                <p className="text-muted">Try adjusting your filters or check back in a little while.</p>
              </div>
            ) : (
              <ul className="product-grid">
                {filteredProducts.map((product) => {
                  const key = product.productId || product.id || Math.random();
                  return (
                    <li key={key}>
                      <ProductCard product={product} onAdd={() => handleAddToCart(product)} />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default Home;
